-- ============================================
-- ROVA LMS — Social Learning (phase 1)
-- Nguồn logic: vault 2ndbrain .../lms-social-learning-chot-logic.md (02-09-2026)
-- Plan: plans/260902-social-learning/phase-01-database.md
-- Thuần ADDITIVE, chạy lại an toàn (idempotent).
-- Client KHÔNG đọc/ghi bảng social trực tiếp — chỉ qua RPC ở mục 7.
-- ============================================

-- ============================================
-- 1. CỘT MỚI TRÊN profiles
-- ============================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'pro';
DO $$ BEGIN
  ALTER TABLE profiles ADD CONSTRAINT chk_profiles_tier
    CHECK (tier IN ('pro','pro_graduate','master','master_certified'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_full_name BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT false;
-- Admin đánh dấu đã gán role "Hạt giống thịnh vượng" bên Discord (làm tay, phase 4)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hgtv_granted_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION tier_rank(p_tier TEXT) RETURNS INT
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_tier
    WHEN 'pro' THEN 0
    WHEN 'pro_graduate' THEN 1
    WHEN 'master' THEN 2
    WHEN 'master_certified' THEN 3
    ELSE -1 END
$$;

-- ============================================
-- 2. BẢNG MỚI
-- ============================================

CREATE TABLE IF NOT EXISTS activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id TEXT REFERENCES courses(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('stage_completed','badge_earned','graduated')),
  stage_id TEXT REFERENCES roadmap_stages(id),
  badge_id TEXT,
  journey_day INT,          -- NULL = không hiện số ("ngày thứ N" chỉ khi đúng nhịp trở lên)
  dedupe_key TEXT NOT NULL, -- idempotent: stage_id / badge_id / 'graduated_<course>' / 'top10_<tuần>'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, event_type, dedupe_key)
);
CREATE INDEX IF NOT EXISTS idx_ae_created ON activity_events(created_at DESC);

CREATE TABLE IF NOT EXISTS effort_daily (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id),
  day DATE NOT NULL,        -- ngày theo giờ VN
  points INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, course_id, day)
);
CREATE INDEX IF NOT EXISTS idx_ed_day ON effort_daily(day, course_id);

-- Chuỗi ngày học: global theo người, không chia khóa
CREATE TABLE IF NOT EXISTS streaks (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  current_len INT NOT NULL DEFAULT 0,
  best_len INT NOT NULL DEFAULT 0,
  last_day DATE,
  reached_at TIMESTAMPTZ DEFAULT now()  -- lúc current_len đạt giá trị hiện tại (tie-break)
);

CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  icon TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('stage','graduation','tier','weekly'))
);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES badges(id),
  times INT NOT NULL DEFAULT 1,      -- top10_week lặp lại thì +1
  awarded_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

-- ============================================
-- 3. SEED HUY HIỆU (tên tạm theo tên chặng — chờ đặt tên chính thức)
-- ============================================

INSERT INTO badges (id, title, kind)
SELECT 'stage_' || stage_key, title, 'stage' FROM roadmap_stages
ON CONFLICT (id) DO NOTHING;

INSERT INTO badges (id, title, kind) VALUES
  ('graduate_pro',         'Tốt nghiệp ROVA 3 Hộp PRO', 'graduation'),
  ('tier_pro_graduate',    'Bậc: Pro tốt nghiệp',        'tier'),
  ('tier_master',          'Bậc: Master',                'tier'),
  ('tier_master_certified','Bậc: Master chứng nhận',     'tier'),
  ('top10_week',           'Top 10 tuần',                'weekly')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 4. HELPER
-- ============================================

CREATE OR REPLACE FUNCTION vn_today() RETURNS DATE
LANGUAGE sql STABLE AS $$
  SELECT (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
$$;

-- Tên hiển thị: ẩn danh > tên đầy đủ (tự bật) > rút gọn "Minh N."
CREATE OR REPLACE FUNCTION social_display_name(p_full TEXT, p_show_full BOOLEAN, p_anon BOOLEAN)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE toks TEXT[];
BEGIN
  IF p_anon THEN RETURN 'Một bạn học'; END IF;
  IF p_full IS NULL OR btrim(p_full) = '' THEN RETURN 'Học viên'; END IF;
  IF p_show_full THEN RETURN btrim(p_full); END IF;
  toks := regexp_split_to_array(btrim(p_full), '\s+');
  IF array_length(toks, 1) = 1 THEN RETURN toks[1]; END IF;
  RETURN toks[array_length(toks, 1)] || ' ' || upper(left(toks[1], 1)) || '.';
END $$;

CREATE OR REPLACE FUNCTION course_of_lesson(p_lesson TEXT) RETURNS TEXT
LANGUAGE sql STABLE AS $$
  SELECT m.course_id FROM lessons l JOIN modules m ON m.id = l.module_id WHERE l.id = p_lesson
$$;

-- Ngày thứ N của hành trình: từ MIN(enrolled_at), trừ tổng thời gian tạm dừng, tính theo 24h trọn
CREATE OR REPLACE FUNCTION social_journey_day(p_user UUID, p_course TEXT, p_at TIMESTAMPTZ)
RETURNS INT LANGUAGE plpgsql STABLE AS $$
DECLARE v_enrolled TIMESTAMPTZ; v_paused BIGINT;
BEGIN
  SELECT MIN(enrolled_at) INTO v_enrolled FROM enrollments
    WHERE user_id = p_user AND course_id = p_course;
  IF v_enrolled IS NULL THEN RETURN NULL; END IF;
  SELECT COALESCE(SUM(ssp.paused_seconds), 0) INTO v_paused
    FROM student_stage_progress ssp JOIN roadmap_stages rs ON rs.id = ssp.stage_id
    WHERE ssp.user_id = p_user AND rs.course_id = p_course;
  RETURN GREATEST(1, floor((extract(epoch FROM (p_at - v_enrolled)) - v_paused) / 86400)::int + 1);
END $$;

-- ============================================
-- 5. GHI ĐIỂM + STREAK (ân xá 1 ngày) — nội bộ, client không được gọi
-- ============================================

CREATE OR REPLACE FUNCTION award_effort(p_user UUID, p_course TEXT, p_points INT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d DATE := vn_today(); v_bonus INT := 0;
BEGIN
  IF p_user IS NULL OR p_course IS NULL THEN RETURN; END IF;

  -- +1 cho lần hoạt động ĐẦU TIÊN trong ngày (mọi khóa gộp)
  IF NOT EXISTS (SELECT 1 FROM effort_daily WHERE user_id = p_user AND day = d) THEN
    v_bonus := 1;
  END IF;

  -- Trần 10 điểm/ngày (áp trên từng dòng user+course+day; hiện chỉ có 1 khóa nên = trần ngày)
  INSERT INTO effort_daily AS ed (user_id, course_id, day, points)
  VALUES (p_user, p_course, d, LEAST(10, p_points + v_bonus))
  ON CONFLICT (user_id, course_id, day)
  DO UPDATE SET points = LEAST(10, ed.points + p_points);

  -- Streak: nghỉ 1 ngày lẻ không đứt (gap ≤ 2), nghỉ 2 ngày liền về 1
  INSERT INTO streaks (user_id, current_len, best_len, last_day, reached_at)
  VALUES (p_user, 1, 1, d, now())
  ON CONFLICT (user_id) DO UPDATE SET
    current_len = CASE
      WHEN streaks.last_day = d THEN streaks.current_len
      WHEN d - streaks.last_day <= 2 THEN streaks.current_len + 1
      ELSE 1 END,
    best_len = GREATEST(streaks.best_len, CASE
      WHEN streaks.last_day = d THEN streaks.current_len
      WHEN d - streaks.last_day <= 2 THEN streaks.current_len + 1
      ELSE 1 END),
    reached_at = CASE WHEN streaks.last_day = d THEN streaks.reached_at ELSE now() END,
    last_day = d;
END $$;

-- ============================================
-- 6. TRIGGER TRÊN BẢNG CÓ SẴN
-- ============================================

CREATE OR REPLACE FUNCTION trg_social_lesson_progress()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_course TEXT; v_pts INT := 0; v_active BOOLEAN := false;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_active := true;
    IF NEW.completed THEN v_pts := 2; END IF;
  ELSE
    IF NEW.last_watched_at IS DISTINCT FROM OLD.last_watched_at THEN v_active := true; END IF;
    IF NEW.completed AND NOT COALESCE(OLD.completed, false) THEN v_active := true; v_pts := 2; END IF;
  END IF;
  IF NOT v_active THEN RETURN NEW; END IF;
  v_course := course_of_lesson(NEW.lesson_id);
  PERFORM award_effort(NEW.user_id, v_course, v_pts);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS social_lesson_progress ON lesson_progress;
CREATE TRIGGER social_lesson_progress
  AFTER INSERT OR UPDATE ON lesson_progress
  FOR EACH ROW EXECUTE FUNCTION trg_social_lesson_progress();

CREATE OR REPLACE FUNCTION trg_social_submission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_course TEXT;
BEGIN
  SELECT course_id INTO v_course FROM assignments WHERE id = NEW.assignment_id;
  PERFORM award_effort(NEW.user_id, v_course, 3);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS social_submission ON submissions;
CREATE TRIGGER social_submission
  AFTER INSERT ON submissions
  FOR EACH ROW EXECUTE FUNCTION trg_social_submission();

CREATE OR REPLACE FUNCTION trg_social_stage_completed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_stage roadmap_stages%ROWTYPE; v_jd INT; v_jd_show INT; v_badge TEXT;
BEGIN
  -- Chỉ bắn ở chuyển tiếp NULL → NOT NULL, nguồn 'app' (import KHÔNG đổ ra feed/điểm)
  IF NEW.completed_at IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.completed_at IS NOT NULL THEN RETURN NEW; END IF;
  IF NEW.source IS DISTINCT FROM 'app' THEN RETURN NEW; END IF;

  SELECT * INTO v_stage FROM roadmap_stages WHERE id = NEW.stage_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  PERFORM award_effort(NEW.user_id, v_stage.course_id, 5);

  v_jd := social_journey_day(NEW.user_id, v_stage.course_id, NEW.completed_at);
  -- "Ngày thứ N" chỉ hiện khi đúng nhịp thiết kế trở lên (10 chặng/20 ngày)
  v_jd_show := CASE WHEN v_jd IS NOT NULL AND v_jd <= 2 * v_stage.order_index THEN v_jd ELSE NULL END;

  INSERT INTO activity_events (user_id, course_id, event_type, stage_id, journey_day, dedupe_key)
  VALUES (NEW.user_id, v_stage.course_id, 'stage_completed', NEW.stage_id, v_jd_show, NEW.stage_id)
  ON CONFLICT (user_id, event_type, dedupe_key) DO NOTHING;

  v_badge := 'stage_' || v_stage.stage_key;
  INSERT INTO user_badges (user_id, badge_id)
  SELECT NEW.user_id, v_badge WHERE EXISTS (SELECT 1 FROM badges WHERE id = v_badge)
  ON CONFLICT (user_id, badge_id) DO NOTHING;

  IF v_stage.completion_type = 'graduation_form' THEN
    -- Bậc chỉ đi lên, không bao giờ hạ
    UPDATE profiles SET tier = 'pro_graduate'
      WHERE id = NEW.user_id AND tier_rank(tier) < tier_rank('pro_graduate');

    INSERT INTO user_badges (user_id, badge_id) VALUES
      (NEW.user_id, 'graduate_pro'), (NEW.user_id, 'tier_pro_graduate')
    ON CONFLICT (user_id, badge_id) DO NOTHING;

    INSERT INTO activity_events (user_id, course_id, event_type, journey_day, dedupe_key)
    VALUES (NEW.user_id, v_stage.course_id, 'graduated',
            CASE WHEN v_jd IS NOT NULL AND v_jd <= 20 THEN v_jd ELSE NULL END,
            'graduated_' || v_stage.course_id)
    ON CONFLICT (user_id, event_type, dedupe_key) DO NOTHING;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS social_stage_completed ON student_stage_progress;
CREATE TRIGGER social_stage_completed
  AFTER INSERT OR UPDATE ON student_stage_progress
  FOR EACH ROW EXECUTE FUNCTION trg_social_stage_completed();

-- ============================================
-- 7. RPC CHO CLIENT (SECURITY DEFINER, trả jsonb)
-- Danh tính = p_viewer (profiles.id) do client gửi — cùng mô hình tin cậy với app hiện tại.
-- Luật tên (ẩn danh/rút gọn) áp KHÔNG ĐIỀU KIỆN bên trong, không phụ thuộc caller.
-- ============================================

CREATE OR REPLACE FUNCTION get_feed(p_limit INT DEFAULT 20)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(jsonb_agg(x), '[]'::jsonb) FROM (
    SELECT jsonb_build_object(
      'event_type', ae.event_type,
      'name', social_display_name(p.full_name, p.show_full_name, p.is_anonymous),
      'avatar_url', CASE WHEN p.is_anonymous THEN NULL ELSE p.avatar_url END,
      'tier', p.tier,
      'stage_title', rs.title,
      'badge_title', b.title,
      'journey_day', ae.journey_day,
      'created_at', ae.created_at
    ) AS x
    FROM activity_events ae
    JOIN profiles p ON p.id = ae.user_id
    LEFT JOIN roadmap_stages rs ON rs.id = ae.stage_id
    LEFT JOIN badges b ON b.id = ae.badge_id
    ORDER BY ae.created_at DESC
    LIMIT LEAST(GREATEST(p_limit, 1), 50)
  ) t
$$;

CREATE OR REPLACE FUNCTION get_leaderboard_effort(p_viewer UUID, p_course TEXT DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE d_start DATE := date_trunc('week', vn_today())::date;
        v_top jsonb; v_me jsonb; v_pts INT; v_rank INT; v_total INT;
BEGIN
  WITH sums AS (
    SELECT user_id, SUM(points) AS pts FROM effort_daily
    WHERE day >= d_start AND (p_course IS NULL OR course_id = p_course)
    GROUP BY user_id HAVING SUM(points) > 0
  )
  SELECT
    (SELECT COALESCE(jsonb_agg(x), '[]'::jsonb) FROM (
      SELECT jsonb_build_object(
        'name', social_display_name(p.full_name, p.show_full_name, p.is_anonymous),
        'avatar_url', CASE WHEN p.is_anonymous THEN NULL ELSE p.avatar_url END,
        'tier', p.tier, 'points', s.pts
      ) AS x
      FROM sums s JOIN profiles p ON p.id = s.user_id
      ORDER BY s.pts DESC, s.user_id LIMIT 10
    ) t),
    COALESCE((SELECT pts FROM sums WHERE user_id = p_viewer), 0),
    (SELECT COUNT(*) FROM sums)
  INTO v_top, v_pts, v_total;

  SELECT 1 + COUNT(*) INTO v_rank FROM (
    SELECT user_id, SUM(points) AS pts FROM effort_daily
    WHERE day >= d_start AND (p_course IS NULL OR course_id = p_course)
    GROUP BY user_id HAVING SUM(points) > 0
  ) s WHERE s.pts > v_pts;

  v_me := jsonb_build_object('points', v_pts,
            'rank', CASE WHEN v_pts > 0 THEN v_rank ELSE NULL END, 'total', v_total);
  RETURN jsonb_build_object('top', v_top, 'me', v_me);
END $$;

CREATE OR REPLACE FUNCTION get_leaderboard_streak(p_viewer UUID)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_top jsonb; v_len INT; v_rank INT; v_total INT;
BEGIN
  -- Chuỗi hiệu lực: chết khi đã nghỉ ≥ 2 ngày trọn (vn_today - last_day >= 3)
  WITH eff AS (
    SELECT user_id, current_len, reached_at FROM streaks
    WHERE current_len > 0 AND vn_today() - last_day < 3
  )
  SELECT
    (SELECT COALESCE(jsonb_agg(x), '[]'::jsonb) FROM (
      SELECT jsonb_build_object(
        'name', social_display_name(p.full_name, p.show_full_name, p.is_anonymous),
        'avatar_url', CASE WHEN p.is_anonymous THEN NULL ELSE p.avatar_url END,
        'tier', p.tier, 'days', e.current_len
      ) AS x
      FROM eff e JOIN profiles p ON p.id = e.user_id
      ORDER BY e.current_len DESC, e.reached_at ASC LIMIT 10
    ) t),
    COALESCE((SELECT current_len FROM eff WHERE user_id = p_viewer), 0),
    (SELECT COUNT(*) FROM eff)
  INTO v_top, v_len, v_total;

  SELECT 1 + COUNT(*) INTO v_rank FROM streaks s
    WHERE s.current_len > 0 AND vn_today() - s.last_day < 3 AND s.current_len > v_len;

  RETURN jsonb_build_object('top', v_top,
    'me', jsonb_build_object('days', v_len,
      'rank', CASE WHEN v_len > 0 THEN v_rank ELSE NULL END, 'total', v_total));
END $$;

CREATE OR REPLACE FUNCTION get_gold_board()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH grads AS (
    SELECT ae.*, p.full_name, p.show_full_name, p.is_anonymous, p.avatar_url
    FROM activity_events ae JOIN profiles p ON p.id = ae.user_id
    WHERE ae.event_type = 'graduated'
      AND (ae.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date >= date_trunc('month', vn_today())::date
  )
  SELECT jsonb_build_object(
    'total_count', (SELECT COUNT(*) FROM grads),
    'items', COALESCE((SELECT jsonb_agg(x) FROM (
      SELECT jsonb_build_object(
        'name', social_display_name(full_name, show_full_name, is_anonymous),
        'avatar_url', CASE WHEN is_anonymous THEN NULL ELSE avatar_url END,
        'journey_day', journey_day, 'created_at', created_at
      ) AS x FROM grads ORDER BY created_at DESC
    ) t), '[]'::jsonb))
$$;

CREATE OR REPLACE FUNCTION get_my_pulse(p_viewer UUID)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_streak INT := 0; v_best INT := 0; v_board jsonb;
BEGIN
  SELECT CASE WHEN vn_today() - last_day < 3 THEN current_len ELSE 0 END, best_len
    INTO v_streak, v_best FROM streaks WHERE user_id = p_viewer;
  v_board := get_leaderboard_effort(p_viewer, NULL);
  RETURN jsonb_build_object(
    'streak', COALESCE(v_streak, 0),
    'best_streak', COALESCE(v_best, 0),
    'week', v_board->'me',
    'recent', get_feed(3));
END $$;

CREATE OR REPLACE FUNCTION get_my_badges(p_viewer UUID)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(jsonb_agg(x), '[]'::jsonb) FROM (
    SELECT jsonb_build_object(
      'id', b.id, 'title', b.title, 'icon', b.icon, 'kind', b.kind,
      'earned', ub.user_id IS NOT NULL, 'times', COALESCE(ub.times, 0),
      'awarded_at', ub.awarded_at
    ) AS x
    FROM badges b LEFT JOIN user_badges ub ON ub.badge_id = b.id AND ub.user_id = p_viewer
    ORDER BY b.kind, b.id
  ) t
$$;

-- ============================================
-- 8. TOP 10 TUẦN (cron sáng thứ Hai giờ VN)
-- ============================================

CREATE OR REPLACE FUNCTION award_weekly_top10()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE prev_start DATE := date_trunc('week', vn_today())::date - 7;
        r RECORD; wk TEXT;
BEGIN
  wk := to_char(prev_start, 'IYYY-IW');
  FOR r IN
    SELECT user_id, SUM(points) AS pts FROM effort_daily
    WHERE day >= prev_start AND day < prev_start + 7
    GROUP BY user_id HAVING SUM(points) > 0
    ORDER BY SUM(points) DESC, user_id LIMIT 10
  LOOP
    INSERT INTO user_badges (user_id, badge_id) VALUES (r.user_id, 'top10_week')
    ON CONFLICT (user_id, badge_id) DO UPDATE SET times = user_badges.times + 1, awarded_at = now();

    INSERT INTO activity_events (user_id, event_type, badge_id, dedupe_key)
    VALUES (r.user_id, 'badge_earned', 'top10_week', 'top10_' || wk)
    ON CONFLICT (user_id, event_type, dedupe_key) DO NOTHING;
  END LOOP;
END $$;

-- ============================================
-- 9. RLS + QUYỀN
-- ============================================

ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE effort_daily    ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges          ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges     ENABLE ROW LEVEL SECURITY;

-- KHÔNG policy cho 4 bảng dữ liệu → client bị chặn hoàn toàn, chỉ đi qua RPC.
-- badges là danh mục tĩnh, mở đọc:
DROP POLICY IF EXISTS badges_read ON badges;
CREATE POLICY badges_read ON badges FOR SELECT TO anon, authenticated USING (true);

-- Hàm nội bộ: thu hồi quyền gọi từ client (chống farm điểm qua RPC)
REVOKE EXECUTE ON FUNCTION award_effort(UUID, TEXT, INT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION award_weekly_top10() FROM PUBLIC, anon, authenticated;

-- RPC công khai cho app:
GRANT EXECUTE ON FUNCTION get_feed(INT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard_effort(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard_streak(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_gold_board() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_my_pulse(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_my_badges(UUID) TO anon, authenticated;

-- ============================================
-- 10. CRON (chạy tay SAU khi đã bật extension pg_cron trong Dashboard → Database → Extensions)
-- Chủ nhật 17:05 UTC = thứ Hai 00:05 giờ VN
-- ============================================
-- SELECT cron.schedule('social-weekly-top10', '5 17 * * 0', $$SELECT award_weekly_top10()$$);

-- ============================================
-- KIỂM TRA SAU KHI CHẠY
-- ============================================
-- SELECT COUNT(*) FROM badges;                          -- ≥ số chặng + 5
-- SELECT tgname FROM pg_trigger WHERE tgname LIKE 'social_%';
-- SELECT proname FROM pg_proc WHERE proname LIKE 'get_%' OR proname LIKE 'award_%';
