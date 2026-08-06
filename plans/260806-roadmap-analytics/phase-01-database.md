# Phase 01 — Database: schema mới, migration, seed lộ trình, pg_cron

## Context Links
- [Main Plan](plan.md) — đọc trước, chứa mọi quyết định
- Schema thật đã dump 06/08/2026 — xem "Bối cảnh hệ thống" trong plan.md

## Overview
- **Description:** Tạo mọi bảng còn thiếu + bảng mới cho lộ trình/trạng thái/chấm ảnh, seed 10 chặng, cài pg_cron tính trạng thái hằng ngày.
- **Priority:** P0 — mọi phase khác phụ thuộc phase này.
- **Output:** 1 file `supabase-roadmap-analytics.sql` idempotent (chạy nhiều lần an toàn) ở root repo, cùng chỗ với các file supabase-*.sql cũ.

## 1. Bảng còn thiếu so với code (tạo mới)

```sql
-- Quiz (đã có file supabase-quiz-notes.sql nhưng CHƯA chạy trên DB thật — gộp vào file mới)
CREATE TABLE IF NOT EXISTS quizzes (
  id TEXT PRIMARY KEY,
  lesson_id TEXT REFERENCES lessons(id),
  title TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]',   -- [{question, options: string[], correct: number}]
  pass_score INT DEFAULT 70
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id TEXT REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  answers JSONB DEFAULT '[]',
  score INT,
  passed BOOLEAN,
  submitted_at TIMESTAMPTZ DEFAULT now()
);
-- KHÔNG BAO GIỜ xoá dữ liệu quiz_attempts — nền gamification tương lai.

CREATE TABLE IF NOT EXISTS user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,   -- học viên được ghi chú
  author_id UUID REFERENCES profiles(id),                   -- mentor/admin viết
  content TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'app' CHECK (channel IN ('call','zalo','zoom','app')),
  note_type TEXT NOT NULL DEFAULT 'khac' CHECK (note_type IN ('nhac_bai','go_ket','cham_soc','khac')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_survey JSONB;

-- Form builder (theo plans/260415-form-builder, thêm phần chấm điểm cho graduation — chi tiết phase 04)
CREATE TABLE IF NOT EXISTS forms (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  form_type TEXT DEFAULT 'survey' CHECK (form_type IN ('survey','onboarding','graduation')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS form_questions (
  id TEXT PRIMARY KEY,
  form_id TEXT REFERENCES forms(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('text','textarea','radio','checkbox','select','rating')),
  options JSONB DEFAULT '[]',
  correct_option INT,              -- index đáp án đúng (chỉ dùng cho form graduation, câu radio/select)
  points INT DEFAULT 1,            -- trọng số câu (graduation)
  required BOOLEAN DEFAULT false,
  order_index INT NOT NULL
);

CREATE TABLE IF NOT EXISTS form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id TEXT REFERENCES forms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  respondent_name TEXT,
  respondent_email TEXT,
  respondent_phone TEXT,
  score_pct NUMERIC,               -- % điểm (graduation, máy tự tính lúc nộp)
  grade TEXT CHECK (grade IN ('khong_dat','tot','xuat_sac')),  -- <60 / >=60 / >=85
  submitted_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS form_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID REFERENCES form_responses(id) ON DELETE CASCADE,
  question_id TEXT REFERENCES form_questions(id) ON DELETE CASCADE,
  answer_value TEXT
);
```

## 2. Bảng mới cho lộ trình & trạng thái

```sql
-- Lộ trình chuẩn: cấu hình được, KHÔNG hardcode trong UI
CREATE TABLE IF NOT EXISTS roadmap_stages (
  id TEXT PRIMARY KEY,                          -- 'stg-pro-01'...
  course_id TEXT REFERENCES courses(id),
  stage_key TEXT NOT NULL,                      -- xem bảng 10 chặng trong plan.md
  title TEXT NOT NULL,
  order_index INT NOT NULL,
  target_days INT NOT NULL,
  completion_type TEXT NOT NULL CHECK (completion_type IN (
    'onboarding',        -- có onboarding_survey (hoặc response form loại onboarding)
    'first_lesson',      -- xem >=50% 1 video bất kỳ đầu tiên
    'assignment_quiz',   -- 20 ảnh ĐÚNG của assignment + quiz đạt
    'lesson_quiz',       -- xem >=50% lesson_id + quiz đạt (chặng Tư duy)
    'lesson_group',      -- xem >=50% TỪNG video trong lesson_ids + quiz đạt nếu video có quiz
    'graduation_form'    -- có form_responses của form graduation (điền xong = qua chặng)
  )),
  lesson_id TEXT REFERENCES lessons(id),        -- video của chặng (lesson_quiz / video đầu chặng assignment_quiz)
  lesson_ids TEXT[],                            -- cho lesson_group
  assignment_id TEXT REFERENCES assignments(id),
  quiz_id TEXT REFERENCES quizzes(id),          -- quiz chặng (assignment_quiz / lesson_quiz)
  required_correct_images INT DEFAULT 20,
  form_id TEXT REFERENCES forms(id),            -- form graduation (gắn sau khi admin tạo form)
  UNIQUE(course_id, stage_key)
);

-- Tiến độ chặng của từng học viên (dữ liệu gốc cho mọi chỉ số)
CREATE TABLE IF NOT EXISTS student_stage_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stage_id TEXT REFERENCES roadmap_stages(id),
  entered_at TIMESTAMPTZ,                       -- thời điểm vào chặng (= completed_at chặng trước)
  deadline_at TIMESTAMPTZ,                      -- entered_at + target_days + paused
  completed_at TIMESTAMPTZ,
  paused_seconds BIGINT DEFAULT 0,              -- cộng dồn thời gian chờ chấm / tạm dừng
  pause_started_at TIMESTAMPTZ,                 -- NULL = không đang pause
  source TEXT DEFAULT 'app' CHECK (source IN ('app','import')),
  UNIQUE(user_id, stage_id)
);
CREATE INDEX IF NOT EXISTS idx_ssp_user ON student_stage_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_ssp_open ON student_stage_progress(stage_id) WHERE completed_at IS NULL;

-- Trạng thái trên profiles (thay risk_tag — GIỮ risk_tag cũ, không xoá, chỉ ngừng dùng)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'dung_tien_do'
  CHECK (status IN ('dung_tien_do','cham','roi_bo','quay_lai','tam_dung','tot_nghiep','hoan_tien'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ready_for_coaching BOOLEAN DEFAULT false;  -- bộ lọc riêng, KHÔNG phải status

-- Sổ lịch sử trạng thái (append-only, KHÔNG xoá)
CREATE TABLE IF NOT EXISTS status_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  reason TEXT,                                  -- bắt buộc (UI enforce) khi người gắn roi_bo/tam_dung/hoan_tien
  changed_by UUID REFERENCES profiles(id),      -- NULL = máy tự đổi
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_se_user ON status_events(user_id, created_at);

-- Chấm từng ảnh bài tập
CREATE TABLE IF NOT EXISTS submission_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),         -- denormalize để đếm nhanh
  assignment_id TEXT REFERENCES assignments(id),-- denormalize
  image_url TEXT NOT NULL,
  verdict TEXT DEFAULT 'pending' CHECK (verdict IN ('pending','correct','incorrect')),
  feedback TEXT,                                -- nhận xét từng ảnh, không bắt buộc
  graded_by UUID REFERENCES profiles(id),
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_si_count ON submission_images(user_id, assignment_id, verdict);

-- Đo giây xem video (cho luật >=50%)
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS watched_seconds INT DEFAULT 0;
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS last_position_sec INT DEFAULT 0;
```

## 3. Trigger ghi status_events

```sql
CREATE OR REPLACE FUNCTION log_status_change() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_changed_at := now();
    INSERT INTO status_events(user_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, NULL);
    -- changed_by/reason do app tự INSERT thêm dòng chi tiết khi người đổi tay
    -- (app đổi status bằng RPC set_student_status bên dưới thì trigger này bỏ qua — xem hàm)
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_status ON profiles;
CREATE TRIGGER trg_log_status BEFORE UPDATE OF status ON profiles
FOR EACH ROW EXECUTE FUNCTION log_status_change();
```

Lưu ý cho implementer: để không bị 2 dòng log khi người đổi tay, cách đơn giản nhất là app KHÔNG update trực tiếp mà gọi RPC:

```sql
CREATE OR REPLACE FUNCTION set_student_status(p_user UUID, p_status TEXT, p_reason TEXT, p_by UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles SET status = p_status WHERE id = p_user;  -- trigger tạo dòng máy
  UPDATE status_events SET changed_by = p_by, reason = p_reason
  WHERE id = (SELECT id FROM status_events WHERE user_id = p_user ORDER BY created_at DESC LIMIT 1);
END; $$ LANGUAGE plpgsql;
```

## 4. Hàm engine trạng thái + pg_cron (chạy trong DB vì app là static export)

Bật extension (Supabase Dashboard → Database → Extensions): `pg_cron`.

```sql
-- Hàm tính lại trạng thái toàn bộ học viên. Logic:
-- 1. Với mỗi học viên đang active (status NOT IN tot_nghiep, hoan_tien, tam_dung, roi_bo):
--    - chặng hiện tại = student_stage_progress chưa completed có order_index nhỏ nhất
--    - nếu đang pause (pause_started_at NOT NULL) → bỏ qua (đồng hồ dừng)
--    - deadline_at = entered_at + target_days*interval '1 day' + paused_seconds
--    - now() > deadline_at  → status 'cham'; ngược lại 'dung_tien_do'
--    (cờ 'ket' KHÔNG lưu — view tính: now() > deadline_at + interval '3 days')
-- 2. Quay lại: học viên status='roi_bo' CHƯA tốt nghiệp mà có hoạt động mới
--    (lesson_progress.last_watched_at / submissions.submitted_at / quiz_attempts.submitted_at > status_changed_at)
--    → status 'quay_lai' + RESET: entered_at chặng đang dở = now(), paused_seconds = 0, deadline tính lại.
-- 3. Học viên 'quay_lai' → lần chạy sau tính như bình thường (rơi về dung_tien_do/cham theo deadline mới).
CREATE OR REPLACE FUNCTION refresh_student_statuses() RETURNS void AS $$ ... $$ LANGUAGE plpgsql;
-- (implementer viết body theo logic comment; giữ từng bước là UPDATE set-based, không loop từng người)

SELECT cron.schedule('refresh-statuses', '0 * * * *', $$SELECT refresh_student_statuses()$$);
-- mỗi giờ; đủ tươi vì deadline đơn vị ngày
```

Ngoài cron, client gọi `supabase.rpc('refresh_student_statuses')` sau các sự kiện lớn (nộp bài, qua chặng) để cập nhật tức thì — hàm phải idempotent.

## 5. Seed lộ trình 10 chặng

Seed `roadmap_stages` cho `course_id = 'c-pro'` theo đúng bảng trong plan.md (target_days: 1,1,2,3,1,3,3,3,2,1). Mapping lesson/assignment/quiz theo TÊN bài trong DB thật (bài học thật đặt tên trùng tên chặng — kiểm tra bằng select trước khi seed, KHÔNG tin seed demo cũ `scripts/seed.js`). Chặng nào chưa có quiz trong DB → tạo quiz khung rỗng cho admin điền câu hỏi sau, hoặc để NULL và ghi chú TODO. `form_id` của chặng tot_nghiep để NULL — admin tạo form graduation xong thì UPDATE (phase 04 làm UI cho việc gắn này).

## 6. RLS

Theo pattern hiện tại của repo: enable RLS + policy `allow_all` cho mọi bảng mới (siết sau ở dự án riêng — đã chốt).

## Acceptance criteria
- [ ] Chạy file SQL 2 lần liên tiếp không lỗi (idempotent).
- [ ] `SELECT * FROM roadmap_stages ORDER BY order_index` ra đúng 10 chặng, tổng target_days = 20.
- [ ] Update `profiles.status` sinh đúng 1 dòng `status_events`.
- [ ] `refresh_student_statuses()` chạy không lỗi trên DB có 0 học viên lẫn có dữ liệu.
- [ ] Cron job xuất hiện trong `SELECT * FROM cron.job`.
