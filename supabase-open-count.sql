-- Số lượt mở video của học viên (chạy MỘT LẦN trên Supabase SQL Editor, TRƯỚC khi deploy LMS).
--
-- open_count tăng 1 mỗi lần học viên vào bài và video thật sự chạy (lần flush đầu có giây xem),
-- khác watch_count (= số lần video chạy tới cuối). rova-ops hiển thị ở thẻ Tiến độ khoá học.
-- Dữ liệu cũ không có lịch sử lượt mở → để 0, chỉ đếm từ lúc chạy file này.
--
-- Phải chạy trước khi deploy: LMS ghi cột này trong upsert lesson_progress,
-- thiếu cột thì lưu tiến độ xem bị lỗi.

ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS open_count INT NOT NULL DEFAULT 0;
