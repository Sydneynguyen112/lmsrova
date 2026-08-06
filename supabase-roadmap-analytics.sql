-- ============================================================
-- ROVA LMS — Roadmap học tập + Trạng thái + Analytics (Phase 01)
-- Spec: plans/260806-roadmap-analytics/
-- Idempotent: chạy nhiều lần an toàn. KHÔNG drop bảng dữ liệu.
-- ============================================================

-- ============ 1. BẢNG CÓ TRONG CODE NHƯNG CHƯA CÓ TRONG DB ============

CREATE TABLE IF NOT EXISTS quizzes (
  id TEXT PRIMARY KEY,
  lesson_id TEXT REFERENCES lessons(id),
  title TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]',
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

CREATE TABLE IF NOT EXISTS user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'app' CHECK (channel IN ('call','zalo','zoom','app')),
  note_type TEXT NOT NULL DEFAULT 'khac' CHECK (note_type IN ('nhac_bai','go_ket','cham_soc','khac')),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notes_user ON user_notes(user_id, created_at);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_survey JSONB;

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
  correct_option INT,
  points INT DEFAULT 1,
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
  score_pct NUMERIC,
  grade TEXT CHECK (grade IN ('khong_dat','tot','xuat_sac')),
  submitted_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS form_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID REFERENCES form_responses(id) ON DELETE CASCADE,
  question_id TEXT REFERENCES form_questions(id) ON DELETE CASCADE,
  answer_value TEXT
);

-- ============ 2. LỘ TRÌNH & TRẠNG THÁI ============

CREATE TABLE IF NOT EXISTS roadmap_stages (
  id TEXT PRIMARY KEY,
  course_id TEXT REFERENCES courses(id),
  stage_key TEXT NOT NULL,
  title TEXT NOT NULL,
  order_index INT NOT NULL,
  target_days INT NOT NULL,
  completion_type TEXT NOT NULL CHECK (completion_type IN
    ('onboarding','first_lesson','assignment_quiz','lesson_quiz','lesson_group','graduation_form')),
  lesson_id TEXT REFERENCES lessons(id),
  lesson_ids TEXT[],
  assignment_id TEXT REFERENCES assignments(id),
  quiz_id TEXT REFERENCES quizzes(id),
  required_correct_images INT DEFAULT 20,
  form_id TEXT REFERENCES forms(id),
  UNIQUE(course_id, stage_key)
);

CREATE TABLE IF NOT EXISTS student_stage_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stage_id TEXT REFERENCES roadmap_stages(id),
  entered_at TIMESTAMPTZ,
  deadline_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  paused_seconds BIGINT DEFAULT 0,
  pause_started_at TIMESTAMPTZ,
  source TEXT DEFAULT 'app' CHECK (source IN ('app','import')),
  UNIQUE(user_id, stage_id)
);
CREATE INDEX IF NOT EXISTS idx_ssp_user ON student_stage_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_ssp_open ON student_stage_progress(stage_id) WHERE completed_at IS NULL;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'dung_tien_do';
DO $$ BEGIN
  ALTER TABLE profiles ADD CONSTRAINT chk_profiles_status
    CHECK (status IN ('dung_tien_do','cham','roi_bo','quay_lai','tam_dung','tot_nghiep','hoan_tien'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ready_for_coaching BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS external_code TEXT;

CREATE TABLE IF NOT EXISTS status_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  reason TEXT,
  changed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_se_user ON status_events(user_id, created_at);

CREATE TABLE IF NOT EXISTS submission_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  assignment_id TEXT REFERENCES assignments(id),
  image_url TEXT NOT NULL,
  verdict TEXT DEFAULT 'pending' CHECK (verdict IN ('pending','correct','incorrect')),
  feedback TEXT,
  graded_by UUID REFERENCES profiles(id),
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_si_count ON submission_images(user_id, assignment_id, verdict);

ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS watched_seconds INT DEFAULT 0;
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS last_position_sec INT DEFAULT 0;

-- ============ 3. TRIGGER GHI STATUS_EVENTS ============

CREATE OR REPLACE FUNCTION log_status_change() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_changed_at := now();
    INSERT INTO status_events(user_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, NULL);
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_status ON profiles;
CREATE TRIGGER trg_log_status BEFORE UPDATE OF status ON profiles
FOR EACH ROW EXECUTE FUNCTION log_status_change();

-- App đổi tag tay thì gọi RPC này (điền người đổi + lý do vào dòng log vừa sinh)
CREATE OR REPLACE FUNCTION set_student_status(p_user UUID, p_status TEXT, p_reason TEXT, p_by UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles SET status = p_status WHERE id = p_user AND status IS DISTINCT FROM p_status;
  UPDATE status_events SET changed_by = p_by, reason = p_reason
  WHERE id = (SELECT id FROM status_events WHERE user_id = p_user ORDER BY created_at DESC LIMIT 1)
    AND to_status = p_status;
END; $$ LANGUAGE plpgsql;

-- ============ 4. PAUSE "CHỜ CHẤM" (đồng hồ dừng) ============
-- Điều kiện pause chặng assignment_quiz: (correct + pending) >= 20 AND correct < 20 AND pending > 0

CREATE OR REPLACE FUNCTION recompute_grading_pause(p_user UUID, p_assignment TEXT)
RETURNS void AS $$
DECLARE
  v_stage roadmap_stages%ROWTYPE;
  v_correct INT; v_pending INT;
  v_should_pause BOOLEAN;
BEGIN
  SELECT * INTO v_stage FROM roadmap_stages
  WHERE assignment_id = p_assignment AND completion_type = 'assignment_quiz' LIMIT 1;
  IF v_stage.id IS NULL THEN RETURN; END IF;

  SELECT count(*) FILTER (WHERE verdict = 'correct'),
         count(*) FILTER (WHERE verdict = 'pending')
  INTO v_correct, v_pending
  FROM submission_images WHERE user_id = p_user AND assignment_id = p_assignment;

  v_should_pause := (v_correct + v_pending) >= v_stage.required_correct_images
                    AND v_correct < v_stage.required_correct_images
                    AND v_pending > 0;

  IF v_should_pause THEN
    UPDATE student_stage_progress
    SET pause_started_at = COALESCE(pause_started_at, now())
    WHERE user_id = p_user AND stage_id = v_stage.id AND completed_at IS NULL;
  ELSE
    UPDATE student_stage_progress
    SET paused_seconds = paused_seconds + EXTRACT(EPOCH FROM (now() - pause_started_at))::BIGINT,
        deadline_at = deadline_at + (now() - pause_started_at),
        pause_started_at = NULL
    WHERE user_id = p_user AND stage_id = v_stage.id
      AND completed_at IS NULL AND pause_started_at IS NOT NULL;
  END IF;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_si_recompute_pause() RETURNS TRIGGER AS $$
BEGIN
  PERFORM recompute_grading_pause(NEW.user_id, NEW.assignment_id);
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_si_pause ON submission_images;
CREATE TRIGGER trg_si_pause AFTER INSERT OR UPDATE OF verdict ON submission_images
FOR EACH ROW EXECUTE FUNCTION trg_si_recompute_pause();

-- ============ 5. ENGINE TRẠNG THÁI (pg_cron gọi mỗi giờ) ============

CREATE OR REPLACE FUNCTION refresh_student_statuses() RETURNS void AS $$
BEGIN
  -- B1. Rời bỏ + chưa tốt nghiệp + có hoạt động mới → quay_lai, reset đồng hồ chặng đang dở
  WITH returners AS (
    SELECT p.id
    FROM profiles p
    WHERE p.role = 'student' AND p.status = 'roi_bo'
      AND (
        EXISTS (SELECT 1 FROM lesson_progress lp WHERE lp.user_id = p.id AND lp.last_watched_at > p.status_changed_at)
        OR EXISTS (SELECT 1 FROM submissions s WHERE s.user_id = p.id AND s.submitted_at > p.status_changed_at)
        OR EXISTS (SELECT 1 FROM quiz_attempts qa WHERE qa.user_id = p.id AND qa.submitted_at > p.status_changed_at)
      )
  ), reset_stage AS (
    UPDATE student_stage_progress ssp
    SET entered_at = now(),
        deadline_at = now() + (rs.target_days || ' days')::interval,
        paused_seconds = 0,
        pause_started_at = NULL
    FROM roadmap_stages rs, returners r
    WHERE ssp.stage_id = rs.id AND ssp.user_id = r.id AND ssp.completed_at IS NULL
    RETURNING ssp.user_id
  )
  UPDATE profiles SET status = 'quay_lai' WHERE id IN (SELECT id FROM returners);

  -- B2. Học viên đang sống (kể cả quay_lai từ đợt trước) → xếp dung_tien_do / cham theo deadline chặng mở
  --     Bỏ qua người đang pause (chờ chấm) và các status người-quyết (roi_bo, tam_dung, tot_nghiep, hoan_tien)
  --     và người vừa được B1 đổi quay_lai trong lần chạy này (status_changed_at mới).
  WITH current_stage AS (
    SELECT DISTINCT ON (ssp.user_id)
      ssp.user_id, ssp.deadline_at, ssp.pause_started_at
    FROM student_stage_progress ssp
    JOIN roadmap_stages rs ON rs.id = ssp.stage_id
    WHERE ssp.completed_at IS NULL
    ORDER BY ssp.user_id, rs.order_index
  )
  UPDATE profiles p
  SET status = CASE WHEN now() > cs.deadline_at THEN 'cham' ELSE 'dung_tien_do' END
  FROM current_stage cs
  WHERE p.id = cs.user_id
    AND p.role = 'student'
    AND p.status IN ('dung_tien_do','cham','quay_lai')
    AND cs.pause_started_at IS NULL
    AND NOT (p.status = 'quay_lai' AND p.status_changed_at > now() - interval '2 hours')
    AND p.status IS DISTINCT FROM (CASE WHEN now() > cs.deadline_at THEN 'cham' ELSE 'dung_tien_do' END);
END; $$ LANGUAGE plpgsql;

-- Bật extension pg_cron trong Dashboard → Database → Extensions trước, rồi:
-- SELECT cron.schedule('refresh-statuses', '0 * * * *', $cron$SELECT refresh_student_statuses()$cron$);

-- ============ 6. SEED LỘ TRÌNH 10 CHẶNG (course c-mov3c81m-fdq2 "3 hộp PRO") ============
-- Hiện trạng DB 06/08/2026: course thật chỉ có 1 lesson (Chương 1 chào mừng), 0 assignment.
-- → Tạo luôn 5 assignment cho 5 chặng bài tập. lesson_id các chặng dò theo TÊN (giờ sẽ NULL,
--   admin/dev chạy lại khối UPDATE ở mục 6b sau khi upload đủ video là mapping tự đầy).

INSERT INTO assignments (id, course_id, title, description, order_index) VALUES
  ('a-nen-chu','c-mov3c81m-fdq2','Bài tập: Nến chủ','Nộp 20 ảnh xác định nến chủ — cần được mentor chấm ĐÚNG đủ 20 ảnh để mở quiz chặng',1),
  ('a-cau-truc','c-mov3c81m-fdq2','Bài tập: Cấu trúc','Nộp 20 ảnh đánh dấu cấu trúc thị trường — cần đủ 20 ảnh chấm ĐÚNG để mở quiz chặng',2),
  ('a-ct1','c-mov3c81m-fdq2','Bài tập: Công thức 1 (CT1)','Backtest Công thức 1 — nộp 20 ảnh được chấm ĐÚNG để mở quiz chặng',3),
  ('a-ct2','c-mov3c81m-fdq2','Bài tập: Công thức 2 (CT2)','Backtest Công thức 2 — nộp 20 ảnh được chấm ĐÚNG để mở quiz chặng',4),
  ('a-ct3','c-mov3c81m-fdq2','Bài tập: Công thức 3 (CT3)','Backtest Công thức 3 — nộp 20 ảnh được chấm ĐÚNG để mở quiz chặng',5)
ON CONFLICT (id) DO NOTHING;

INSERT INTO roadmap_stages (id, course_id, stage_key, title, order_index, target_days, completion_type, lesson_id, assignment_id, lesson_ids)
VALUES
  ('stg-pro-01','c-mov3c81m-fdq2','onboarding','Onboarding',1,1,'onboarding',NULL,NULL,NULL),
  ('stg-pro-02','c-mov3c81m-fdq2','xem_video','Xem video',2,1,'first_lesson',NULL,NULL,NULL),
  ('stg-pro-03','c-mov3c81m-fdq2','nen_chu','Nến chủ',3,2,'assignment_quiz',NULL,'a-nen-chu',NULL),
  ('stg-pro-04','c-mov3c81m-fdq2','cau_truc','Cấu trúc',4,3,'assignment_quiz',NULL,'a-cau-truc',NULL),
  ('stg-pro-05','c-mov3c81m-fdq2','tu_duy','Tư duy',5,1,'lesson_quiz',NULL,NULL,NULL),
  ('stg-pro-06','c-mov3c81m-fdq2','ct1','Công thức 1',6,3,'assignment_quiz',NULL,'a-ct1',NULL),
  ('stg-pro-07','c-mov3c81m-fdq2','ct2','Công thức 2',7,3,'assignment_quiz',NULL,'a-ct2',NULL),
  ('stg-pro-08','c-mov3c81m-fdq2','ct3','Công thức 3',8,3,'assignment_quiz',NULL,'a-ct3',NULL),
  ('stg-pro-09','c-mov3c81m-fdq2','video_hoan_thien','Video hoàn thiện',9,2,'lesson_group',NULL,NULL,NULL),
  ('stg-pro-10','c-mov3c81m-fdq2','tot_nghiep','Bài Tốt nghiệp',10,1,'graduation_form',NULL,NULL,NULL)
ON CONFLICT (course_id, stage_key) DO NOTHING;

-- ============ 7. RLS (pattern allow_all hiện tại — siết ở dự án riêng) ============

DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['quizzes','quiz_attempts','user_notes','forms','form_questions','form_responses','form_answers',
                           'roadmap_stages','student_stage_progress','status_events','submission_images']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "allow_all_%s" ON %I', t, t);
    EXECUTE format('CREATE POLICY "allow_all_%s" ON %I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

-- ============ 6b. CHẠY LẠI SAU KHI UPLOAD ĐỦ VIDEO (mapping lesson theo tên) ============
-- Khi admin upload đủ 12 video vào khoá, chạy khối này để gắn video vào chặng:
-- UPDATE roadmap_stages SET lesson_id = (SELECT l.id FROM lessons l JOIN modules m ON m.id=l.module_id
--   WHERE m.course_id='c-mov3c81m-fdq2' AND l.title ILIKE '%nến chủ%' ORDER BY l.order_index LIMIT 1)
--   WHERE id='stg-pro-03';
-- (tương tự: stg-pro-04 '%cấu trúc%' · stg-pro-05 '%tư duy%' · stg-pro-06..08 '%công thức 1/2/3%')
-- UPDATE roadmap_stages SET lesson_ids = (SELECT array_agg(l.id ORDER BY l.order_index)
--   FROM lessons l JOIN modules m ON m.id=l.module_id WHERE m.course_id='c-mov3c81m-fdq2'
--   AND (l.title ILIKE '%tâm lý%' OR l.title ILIKE '%quản lý vốn%' OR l.title ILIKE '%nhật ký%'))
--   WHERE id='stg-pro-09';
-- Quiz chặng: tạo quiz trong bảng quizzes rồi UPDATE roadmap_stages SET quiz_id=... theo chặng.

-- ============ 8. KIỂM TRA SAU KHI CHẠY ============
-- Chạy tay từng câu, xem kết quả:
-- SELECT stage_key, title, target_days, completion_type, lesson_id, assignment_id, lesson_ids
--   FROM roadmap_stages WHERE course_id='c-mov3c81m-fdq2' ORDER BY order_index;
--   → đủ 10 dòng, tổng target_days = 20. Ô lesson_id/assignment_id NULL ở chặng 3-9 = tên bài
--     trong DB không khớp pattern → UPDATE gắn tay theo id thật.
-- SELECT * FROM cron.job;  → sau khi schedule, có job refresh-statuses.
