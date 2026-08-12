-- Sửa watch_count bị đếm dư 1 (chạy MỘT LẦN trên Supabase SQL Editor).
--
-- Bug: flushWatchProgress tạo dòng lesson_progress mới với watch_count = 1
-- (nghĩa là "đang xem lần 1"), trong khi incrementWatchCount lại bump khi video
-- chạy hết (nghĩa là "đã xem hết N lần"). Trộn hai nghĩa → xem hết lần đầu ra 2,
-- badge "xem lại lần N" (hiện khi >= 2) nổi lên oan ngay lần xem đầu tiên.
--
-- Code đã sửa: dòng mới khởi tạo watch_count = 0, chỉ onEnded mới bump.
-- Câu này gỡ 1 đơn vị dư cho toàn bộ dòng đã tạo TRƯỚC khi sửa.

UPDATE lesson_progress
SET watch_count = GREATEST(COALESCE(watch_count, 0) - 1, 0)
WHERE COALESCE(watch_count, 0) > 0;

-- Kiểm tra lại: không còn dòng nào watch_count >= 2 mà mới xem 1 lần.
-- SELECT watch_count, COUNT(*) FROM lesson_progress GROUP BY 1 ORDER BY 1;
