-- ============================================
-- Học viên tự khai khoá đã đăng ký ngay sau đăng nhập (PRO / MASTER)
-- IDEMPOTENT — chạy trong Supabase SQL Editor TRƯỚC khi deploy code.
-- ============================================
-- Đây chỉ là LỜI KHAI của học viên: mentor/admin bên rova-ops vẫn là người
-- gán enrollment (= duyệt). Không tạo dòng enrollments ở bước này vì rova-ops
-- đang coi "có bất kỳ enrollment nào" = đã duyệt (isPendingApproval).
--
-- Luồng phía LMS (components/shared/OnboardingGate.tsx):
--   chưa chọn khoá     → /choose-course
--   chọn xong          → dashboard, popup chờ duyệt (mentor/admin gán enrollment)
--   duyệt xong, PRO    → video onboarding → bài test đầu vào → dashboard
--   duyệt xong, MASTER → dashboard luôn — bộ câu hỏi MASTER chưa có

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS requested_course_id TEXT REFERENCES courses(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS requested_course_at TIMESTAMPTZ;

-- supabase-rls-profiles-hardening.sql cấp quyền UPDATE theo allowlist cột —
-- phải mở thêm 2 cột này thì client mới ghi được lựa chọn.
GRANT UPDATE (requested_course_id, requested_course_at) ON public.profiles TO anon, authenticated;

-- Verify:
-- SELECT id, full_name, requested_course_id, requested_course_at
-- FROM profiles WHERE requested_course_id IS NOT NULL ORDER BY requested_course_at DESC LIMIT 20;
