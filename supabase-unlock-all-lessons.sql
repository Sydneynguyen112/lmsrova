-- ============================================
-- MỞ KHOÁ TOÀN BỘ BÀI HỌC CHO MỘT SỐ TÀI KHOẢN
-- ============================================
-- Chạy toàn bộ file này trong Supabase SQL Editor.
--
-- Mặc định app khoá tuần tự: xem hết video + đạt quiz + nộp đủ bài tập mới mở bài kế
-- (lib/roadmap.ts computeUnlockState). Cột này là cửa hậu cho khách mời / VIP:
-- bật true -> mọi bài trong mọi khoá đều mở, nhưng doneLessonIds vẫn tính theo
-- số giây xem thật nên tiến độ, chuỗi học, bảng xếp hạng không bị thổi.
--
-- BẢO MẬT: cột này CỐ TÌNH không nằm trong allowlist grant update của
-- supabase-rls-profiles-hardening.sql -> client dùng anon key không tự bật được.
-- Chỉ đổi qua SQL Editor (service_role).
-- ============================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS unlock_all_lessons BOOLEAN NOT NULL DEFAULT false;

-- ── Cấp quyền mở khoá cho từng học viên ──
UPDATE profiles
SET unlock_all_lessons = true
WHERE lower(email) = lower('leanhduong309@gmail.com');

-- ── Kiểm chứng: phải thấy 1 dòng, unlock_all_lessons = true ──
SELECT id, email, full_name, unlock_all_lessons
FROM profiles
WHERE unlock_all_lessons = true;

-- ── Gỡ quyền khi cần ──
-- UPDATE profiles SET unlock_all_lessons = false WHERE lower(email) = lower('leanhduong309@gmail.com');
