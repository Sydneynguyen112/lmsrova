-- ============================================================
-- ROVA LMS — Analytics Views (Phase 05)
-- Chạy SAU supabase-roadmap-analytics.sql. Idempotent.
-- Nguyên tắc: median không mean; lứa theo THÁNG; loại hoan_tien khỏi mẫu số.
-- ============================================================

-- ============ v_student_roadmap: 1 dòng/học viên — nền của mọi thứ ============
CREATE OR REPLACE VIEW v_student_roadmap AS
SELECT
  p.id AS user_id,
  p.full_name,
  p.email,
  p.phone,
  p.mentor_id,
  mt.full_name AS mentor_name,
  p.status,
  p.status_changed_at,
  p.ready_for_coaching,
  p.external_code,
  e.enrolled_at,
  e.completed_at AS graduated_at,
  date_trunc('month', e.enrolled_at)::date AS cohort_month,
  cur.stage_key   AS current_stage_key,
  cur.stage_title AS current_stage_title,
  cur.stage_order,
  cur.entered_at,
  cur.deadline_at,
  cur.pause_started_at,
  ROUND(GREATEST(0, EXTRACT(EPOCH FROM (now() - cur.entered_at)) / 86400)::numeric, 1) AS days_in_stage,
  ROUND(GREATEST(0, EXTRACT(EPOCH FROM (now() - cur.deadline_at)) / 86400)::numeric, 1) AS days_late,
  (p.status = 'cham' AND cur.deadline_at IS NOT NULL AND now() > cur.deadline_at + interval '3 days') AS is_ket,
  (cur.pause_started_at IS NOT NULL) AS is_cho_cham,
  COALESCE(img.correct_count, 0)  AS correct_images,
  COALESCE(img.pending_count, 0)  AS pending_images,
  gr.grade AS graduation_grade
FROM profiles p
LEFT JOIN profiles mt ON mt.id = p.mentor_id
LEFT JOIN enrollments e ON e.user_id = p.id AND e.course_id = 'c-pro'
LEFT JOIN LATERAL (
  SELECT rs.stage_key, rs.title AS stage_title, rs.order_index AS stage_order,
         rs.assignment_id, rs.required_correct_images,
         ssp.entered_at, ssp.deadline_at, ssp.pause_started_at
  FROM student_stage_progress ssp
  JOIN roadmap_stages rs ON rs.id = ssp.stage_id
  WHERE ssp.user_id = p.id AND ssp.completed_at IS NULL
  ORDER BY rs.order_index
  LIMIT 1
) cur ON true
LEFT JOIN LATERAL (
  SELECT count(*) FILTER (WHERE si.verdict = 'correct') AS correct_count,
         count(*) FILTER (WHERE si.verdict = 'pending') AS pending_count
  FROM submission_images si
  WHERE si.user_id = p.id AND si.assignment_id = cur.assignment_id
) img ON true
LEFT JOIN LATERAL (
  SELECT fr.grade
  FROM form_responses fr
  JOIN forms f ON f.id = fr.form_id AND f.form_type = 'graduation'
  WHERE fr.user_id = p.id AND fr.grade IN ('tot','xuat_sac')
  ORDER BY fr.submitted_at DESC
  LIMIT 1
) gr ON true
WHERE p.role = 'student';

-- ============ v_funnel: học viên đang đứng ở từng chặng ============
CREATE OR REPLACE VIEW v_funnel AS
SELECT current_stage_key AS stage_key,
       current_stage_title AS stage_title,
       stage_order AS order_index,
       count(*) AS students
FROM v_student_roadmap
WHERE status IN ('dung_tien_do','cham','quay_lai','tam_dung')
  AND current_stage_key IS NOT NULL
GROUP BY current_stage_key, current_stage_title, stage_order
ORDER BY stage_order;

-- ============ v_today_actions: 5 nhóm việc hôm nay ============
-- action_group: ket | can_cham | cho_cham | cho_tot_nghiep | moi_chua_vao_guong
CREATE OR REPLACE VIEW v_today_actions AS
SELECT 'ket' AS action_group, user_id, full_name, mentor_id, mentor_name,
       current_stage_title || ' — trễ ' || days_late || ' ngày' AS detail
FROM v_student_roadmap
WHERE is_ket
UNION ALL
SELECT 'can_cham', v.user_id, v.full_name, v.mentor_id, v.mentor_name,
       v.current_stage_title || ' — chậm, chưa ai chạm'
FROM v_student_roadmap v
WHERE v.status = 'cham'
  AND NOT EXISTS (
    SELECT 1 FROM user_notes n
    WHERE n.user_id = v.user_id
      AND n.created_at >= COALESCE(
        (SELECT max(se.created_at) FROM status_events se
         WHERE se.user_id = v.user_id AND se.to_status = 'cham'),
        v.status_changed_at)
  )
UNION ALL
SELECT 'cho_cham', user_id, full_name, mentor_id, mentor_name,
       current_stage_title || ' — ' || pending_images || ' ảnh chờ chấm'
FROM v_student_roadmap
WHERE is_cho_cham
UNION ALL
SELECT 'cho_tot_nghiep', user_id, full_name, mentor_id, mentor_name,
       'Đã xong video hoàn thiện, chưa nộp/đạt bài tốt nghiệp'
FROM v_student_roadmap
WHERE current_stage_key = 'tot_nghiep' AND status NOT IN ('tot_nghiep','hoan_tien','roi_bo')
UNION ALL
SELECT 'moi_chua_vao_guong', user_id, full_name, mentor_id, mentor_name,
       CASE WHEN current_stage_key = 'onboarding' THEN 'Đăng ký >48h chưa xong onboarding'
            ELSE 'Onboard >3 ngày chưa xem video nào' END
FROM v_student_roadmap
WHERE status NOT IN ('tot_nghiep','hoan_tien','roi_bo','tam_dung')
  AND ((current_stage_key = 'onboarding' AND enrolled_at < now() - interval '48 hours')
    OR (current_stage_key = 'xem_video' AND entered_at < now() - interval '3 days'));

-- ============ v_cohort_monthly: so sánh lứa nhập học theo tháng ============
CREATE OR REPLACE VIEW v_cohort_monthly AS
WITH base AS (
  SELECT v.user_id, v.cohort_month, v.enrolled_at, v.graduated_at, v.status,
         EXISTS (SELECT 1 FROM submission_images si
                 WHERE si.user_id = v.user_id
                   AND si.created_at <= v.enrolled_at + interval '7 days') AS activated_7d
  FROM v_student_roadmap v
  WHERE v.enrolled_at IS NOT NULL AND v.status <> 'hoan_tien'
)
SELECT cohort_month,
  count(*) AS total,
  ROUND(100.0 * count(*) FILTER (WHERE activated_7d) / count(*), 1) AS pct_activated_7d,
  CASE WHEN now() >= cohort_month + interval '1 month' + interval '30 days'
    THEN ROUND(100.0 * count(*) FILTER (WHERE graduated_at IS NOT NULL AND graduated_at <= enrolled_at + interval '30 days') / count(*), 1)
    ELSE NULL END AS pct_graduated_30d,
  CASE WHEN now() >= cohort_month + interval '1 month' + interval '60 days'
    THEN ROUND(100.0 * count(*) FILTER (WHERE graduated_at IS NOT NULL AND graduated_at <= enrolled_at + interval '60 days') / count(*), 1)
    ELSE NULL END AS pct_graduated_60d,
  ROUND(100.0 * count(*) FILTER (WHERE status = 'roi_bo') / count(*), 1) AS pct_roi_bo,
  ROUND((percentile_cont(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (graduated_at - enrolled_at)) / 86400)
    FILTER (WHERE graduated_at IS NOT NULL))::numeric, 1) AS median_days_to_graduate
FROM base
GROUP BY cohort_month
ORDER BY cohort_month;

-- ============ v_stage_speed: tốc độ thật từng chặng vs chuẩn ============
CREATE OR REPLACE VIEW v_stage_speed AS
SELECT rs.stage_key, rs.title, rs.order_index, rs.target_days,
  count(ssp.id) AS completed_count,
  ROUND((percentile_cont(0.5) WITHIN GROUP (
    ORDER BY (EXTRACT(EPOCH FROM (ssp.completed_at - ssp.entered_at)) - ssp.paused_seconds) / 86400))::numeric, 1) AS median_days,
  ROUND(100.0 * count(*) FILTER (WHERE ssp.completed_at <= ssp.deadline_at) / NULLIF(count(*), 0), 1) AS pct_on_time
FROM roadmap_stages rs
LEFT JOIN student_stage_progress ssp
  ON ssp.stage_id = rs.id AND ssp.completed_at IS NOT NULL
  AND ssp.entered_at IS NOT NULL AND ssp.source = 'app'
WHERE rs.course_id = 'c-pro'
GROUP BY rs.stage_key, rs.title, rs.order_index, rs.target_days
ORDER BY rs.order_index;

-- ============ v_mentor_scorecard: chỉ trang admin dùng ============
CREATE OR REPLACE VIEW v_mentor_scorecard AS
SELECT m.id AS mentor_id, m.full_name AS mentor_name,
  count(v.user_id) FILTER (WHERE v.status NOT IN ('tot_nghiep','hoan_tien')) AS students_active,
  ROUND(100.0 * count(*) FILTER (WHERE v.status = 'dung_tien_do')
    / NULLIF(count(*) FILTER (WHERE v.status IN ('dung_tien_do','cham','quay_lai')), 0), 1) AS pct_dung_tien_do,
  count(*) FILTER (WHERE v.is_ket) AS count_ket,
  count(*) FILTER (WHERE v.graduated_at >= date_trunc('month', now())) AS graduated_this_month,
  (SELECT count(*) FROM submission_images si
    JOIN profiles ps ON ps.id = si.user_id
    WHERE ps.mentor_id = m.id AND si.verdict = 'pending') AS pending_to_grade,
  (SELECT ROUND((percentile_cont(0.5) WITHIN GROUP (
      ORDER BY EXTRACT(EPOCH FROM (si.graded_at - si.created_at)) / 3600))::numeric, 1)
    FROM submission_images si
    WHERE si.graded_by = m.id AND si.graded_at >= now() - interval '30 days') AS median_grading_hours,
  (SELECT count(*) FROM user_notes n
    WHERE n.author_id = m.id AND n.created_at >= now() - interval '7 days') AS touches_this_week
FROM profiles m
LEFT JOIN v_student_roadmap v ON v.mentor_id = m.id
WHERE m.role = 'mentor'
GROUP BY m.id, m.full_name;
