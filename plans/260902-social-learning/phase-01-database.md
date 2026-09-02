# Phase 01 — Database: bảng, trigger, RPC, seed, cron

File duy nhất: `supabase-social.sql` (chạy tay trong Supabase SQL Editor, thuần additive). Mirror hằng số điểm sang `lib/social-config.ts` ở phase 2.

## 1. Cột mới trên `profiles` (ADD COLUMN IF NOT EXISTS)

```sql
tier TEXT NOT NULL DEFAULT 'pro'
  CHECK (tier IN ('pro','pro_graduate','master','master_certified'));
show_full_name BOOLEAN NOT NULL DEFAULT false;
is_anonymous  BOOLEAN NOT NULL DEFAULT false;
hgtv_granted_at TIMESTAMPTZ;  -- admin đánh dấu đã gán role Hạt giống thịnh vượng bên Discord (tay)
```

`tier` có thứ bậc: hàm `tier_rank(text) RETURNS int` (pro=0 … master_certified=3). Trigger chỉ được `SET tier` khi `tier_rank(new) > tier_rank(old)` — không bao giờ hạ.

## 2. Bảng mới

```sql
CREATE TABLE activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id TEXT REFERENCES courses(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('stage_completed','badge_earned','graduated')),
  stage_id TEXT REFERENCES roadmap_stages(id),
  badge_id TEXT,
  journey_day INT,              -- NULL = không hiện số (luật chiều nâng)
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, event_type, stage_id, badge_id)   -- idempotent
);
CREATE INDEX idx_ae_created ON activity_events(created_at DESC);

CREATE TABLE effort_daily (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id),
  day DATE NOT NULL,            -- ngày theo giờ VN
  points INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, course_id, day)
);
CREATE INDEX idx_ed_day ON effort_daily(day, course_id);

CREATE TABLE streaks (           -- global, không chia khóa (thói quen của người)
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  current_len INT NOT NULL DEFAULT 0,
  best_len INT NOT NULL DEFAULT 0,
  last_day DATE,
  reached_at TIMESTAMPTZ DEFAULT now()   -- lúc current_len đạt giá trị hiện tại (tie-break)
);

CREATE TABLE badges (
  id TEXT PRIMARY KEY,           -- 'stage_<stage_key>', 'graduate_pro', 'tier_master', 'top10_week'
  title TEXT NOT NULL,
  icon TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('stage','graduation','tier','weekly'))
);

CREATE TABLE user_badges (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES badges(id),
  times INT NOT NULL DEFAULT 1,          -- top10_week lặp lại thì +1
  awarded_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);
```

Seed `badges`: 1 dòng/chặng từ `SELECT stage_key, title FROM roadmap_stages` (id = 'stage_'||stage_key) + `graduate_pro` + `tier_pro_graduate/master/master_certified` + `top10_week`. Title tiếng Việt tạm theo tên chặng, chờ đặt tên chính thức (biên bản: điểm chưa chốt).

## 3. Helper

```sql
CREATE FUNCTION vn_today() RETURNS date LANGUAGE sql STABLE
  AS $$ SELECT (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date $$;
```

`social_display_name(p profiles) RETURNS text`: `is_anonymous` → `'Một bạn học'`; `show_full_name` → `full_name`; mặc định rút gọn = token CUỐI của full_name + ' ' + chữ cái đầu token ĐẦU + '.' (tên Việt: "Nguyễn Văn Minh" → "Minh N."; một token thì trả nguyên).

## 4. Ghi điểm + streak: `award_effort(p_user, p_course, p_points)`

- Ngày = `vn_today()`. UPSERT vào `effort_daily`; dòng MỚI trong ngày thì cộng thêm +1 (điểm "lần đầu vào học trong ngày"); luôn `points = LEAST(10, points + …)`.
- Cùng transaction, cập nhật `streaks`:
  - chưa có dòng hoặc `vn_today() - last_day >= 3` → `current_len = 1`, `reached_at = now()`
  - `last_day` = hôm nay → không đổi
  - `last_day` cách 1 hoặc 2 ngày (ân xá 1 ngày lẻ) → `current_len + 1`, `reached_at = now()`
  - `best_len = GREATEST(best_len, current_len)`, `last_day = vn_today()`

## 5. Trigger trên bảng có sẵn (AFTER, function SECURITY DEFINER)

| Bảng | Điều kiện bắn | Việc |
|---|---|---|
| `lesson_progress` | INSERT, hoặc UPDATE đổi `last_watched_at` | `award_effort(user, course_của_lesson, 0)` (chỉ điểm hiện diện) |
| `lesson_progress` | `completed` false→true | `award_effort(…, 2)` |
| `submissions` | INSERT | `award_effort(user, course_của_assignment, 3)` |
| `student_stage_progress` | `completed_at` NULL→NOT NULL **AND source='app'** | `award_effort(…, 5)` + INSERT `activity_events(stage_completed, journey_day)` ON CONFLICT DO NOTHING + upsert `user_badges('stage_'||stage_key)` |
| `student_stage_progress` | như trên, chặng `completion_type='graduation_form'` | thêm: nâng `tier` lên `pro_graduate` (chỉ đi lên) + badge `graduate_pro` + event `graduated` (journey_day chỉ set khi ≤ 20) |

**journey_day** = số ngày (VN) từ `MIN(enrollments.enrolled_at)` của user+course đến `completed_at`, trừ `SUM(paused_seconds)` của user trong course đó, +1. Chỉ ghi vào event khi `journey_day <= 2 * roadmap_stages.order_index` (graduated: ≤ 20); không đạt → NULL. Không bao giờ lưu enrolled_at vào event.

Course của lesson: `lessons → modules → courses`; của assignment: `assignments.course_id`.

## 6. RPC cho client (SECURITY DEFINER, GRANT EXECUTE TO anon, authenticated)

⚠️ **Danh tính caller:** app KHÔNG dùng `auth.uid()` làm khóa — `lib/auth.ts` map Supabase Auth → `profiles` bằng EMAIL, và còn đường fallback localStorage không có session Auth (xem `useCurrentUser`, auth.ts ~254). Vì vậy mọi RPC cần "hàng của bạn" nhận **`p_viewer uuid`** (profiles.id) từ client, cùng mô hình tin cậy với phần còn lại của app. Hệ quả chấp nhận được: kẻ spoof p_viewer chỉ xem được HẠNG/CHUỖI của người khác (thứ vốn định bày lên bảng), còn luật ẩn danh/tên rút gọn được áp KHÔNG ĐIỀU KIỆN bên trong function nên không phụ thuộc danh tính caller.

| Function | Trả về |
|---|---|
| `get_my_pulse(p_viewer uuid)` | streak hiện tại (0 nếu `vn_today()-last_day>=3`), best_len, điểm tuần này, hạng tuần + tổng người, 3 event mới nhất |
| `get_leaderboard_effort(p_viewer uuid, p_course text DEFAULT NULL)` | top 10 tuần này (display_name, avatar_url, tier, points) + hàng của p_viewer (rank, total). NULL = bảng chung |
| `get_leaderboard_streak(p_viewer uuid)` | top 10 theo `current_len` hiệu lực, tie-break `reached_at ASC` + hàng của p_viewer |
| `get_gold_board()` | event `graduated` trong tháng lịch VN này: display_name, avatar, journey_day (NULL = không hiện số), created_at DESC; kèm `total_count` cho tiếng vọng chặng 10 |
| `get_feed(p_limit int DEFAULT 20)` | event mới nhất: display_name, avatar, tier, event_type, tên chặng/huy hiệu, journey_day, created_at |
| `get_my_badges(p_viewer uuid)` | toàn bộ `badges` LEFT JOIN `user_badges` của p_viewer (cái chưa có → hiện mờ) |

Tên luôn render qua `social_display_name` TRONG function — client không bao giờ nhận full_name thô của người khác (trừ khi chính chủ bật `show_full_name`).

## 7. RLS

- 5 bảng mới: ENABLE RLS và **KHÔNG tạo policy nào** → client (anon key) bị chặn mọi SELECT/INSERT/UPDATE/DELETE trực tiếp; đường đọc duy nhất là RPC definer, đường ghi duy nhất là trigger definer. (Không dùng policy own-row vì `auth.uid()` không khớp `profiles.id` — xem cảnh báo mục 6.)
- `badges` (danh mục tĩnh) có thể mở SELECT cho anon+authenticated, không nhạy cảm.

## 8. Cron Top 10 tuần

```sql
-- Chủ nhật 17:05 UTC = thứ Hai 00:05 VN
SELECT cron.schedule('social-weekly-top10', '5 17 * * 0', $$SELECT award_weekly_top10()$$);
```

`award_weekly_top10()`: tính top 10 điểm của TUẦN VỪA KẾT THÚC (mọi khóa gộp) từ `effort_daily`; mỗi người: upsert `user_badges('top10_week')` (`times = times + 1`) + INSERT event `badge_earned` (UNIQUE có badge_id nên tuần sau vẫn insert được? — KHÔNG: unique (user,type,stage,badge) chặn tuần 2. Sửa: với badge `top10_week` dùng `ON CONFLICT DO NOTHING` trên event và chấp nhận chỉ có event lần đầu, HOẶC nới unique bằng cột `dedupe_key TEXT` = `stage_id|badge_id|tuần`. **Chọn: thêm cột `dedupe_key` và UNIQUE(user_id, event_type, dedupe_key)**; trigger thường điền `dedupe_key = COALESCE(stage_id, badge_id)`; top10 điền `'top10_'||to_char(tuần,'IYYY-IW')`.)

## Kiểm chứng phase

- Toàn bộ mục SQL trong checklist plan.md chạy đạt bằng script test tay trong SQL Editor (INSERT giả lập vào lesson_progress/submissions/student_stage_progress cho 1 user test)
- `SELECT cron.schedule` đã đăng ký (query `cron.job`)
