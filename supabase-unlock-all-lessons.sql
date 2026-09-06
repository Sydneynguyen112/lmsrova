-- ============================================
-- MỞ KHOÁ TOÀN BỘ BÀI HỌC
-- ============================================
-- Chạy toàn bộ file này trong Supabase SQL Editor.
--
-- Mặc định app khoá tuần tự: xem hết video + đạt quiz + nộp đủ bài tập mới mở bài kế
-- (lib/roadmap.ts computeUnlockState). Cột unlock_all_lessons là cửa hậu bỏ luật đó
-- cho từng học viên: bật true -> mọi bài trong mọi khoá đều mở, nhưng doneLessonIds
-- vẫn tính theo số giây xem thật nên tiến độ, chuỗi học, bảng xếp hạng không bị thổi.
--
-- TRẠNG THÁI HIỆN TẠI (05/09/2026): MỞ CHO TẤT CẢ.
-- Default của cột = true và toàn bộ 641 học viên đang bật -> không ai bị khoá tuần tự,
-- kể cả tài khoản đăng ký mới. Sẽ làm lại chức năng khoá từng bài sau; khi đó chạy
-- phần "TẮT — khoá lại tuần tự" ở cuối file.
--
-- BẢO MẬT: cột này CỐ TÌNH không nằm trong allowlist grant update của
-- supabase-rls-profiles-hardening.sql -> client dùng anon key không tự bật/tắt được.
-- Chỉ đổi qua SQL Editor (service_role).
-- ============================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS unlock_all_lessons BOOLEAN NOT NULL DEFAULT false;

-- ── BẬT CHO TẤT CẢ (đang áp dụng) ──
-- Default true để học viên đăng ký mới cũng được mở sẵn.
ALTER TABLE profiles ALTER COLUMN unlock_all_lessons SET DEFAULT true;
UPDATE profiles SET unlock_all_lessons = true WHERE unlock_all_lessons = false;

-- ── Kiểm chứng: hai số phải bằng nhau ──
SELECT count(*) AS tong_hoc_vien,
       count(*) FILTER (WHERE unlock_all_lessons) AS da_mo_khoa
FROM profiles;

-- ============================================
-- TẮT — KHOÁ LẠI TUẦN TỰ (chạy khi làm lại chức năng khoá từng bài)
-- ============================================
-- ALTER TABLE profiles ALTER COLUMN unlock_all_lessons SET DEFAULT false;
-- UPDATE profiles SET unlock_all_lessons = false;
--
-- Mở lại cho riêng một khách (khách mời / VIP):
-- UPDATE profiles SET unlock_all_lessons = true WHERE lower(email) = lower('email-khach@gmail.com');
