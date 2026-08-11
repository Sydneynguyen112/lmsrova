-- Nối roadmap_stages với bài học.
--
-- VÌ SAO CẦN: mọi chặng đang có lesson_id = NULL. Hệ quả:
--   · assignment_quiz  → trang học không tìm ra chặng ⇒ KHÔNG hiện ô nộp bài tập
--   · lesson_quiz      → isStageConditionMet không tìm ra bài ⇒ KHÔNG BAO GIỜ qua được
--   · lesson_group     → lesson_ids rỗng ⇒ KHÔNG BAO GIỜ qua được
--
-- Ghép theo TÊN chặng ↔ TÊN chương. Đối chiếu lại trước khi chạy.
-- An toàn: chỉ ghi cột liên kết, không đụng student_stage_progress.

BEGIN;

-- Chặng 3 · Nến chủ → Chương 2: Nến
UPDATE roadmap_stages SET lesson_id = 'l-msonwa80-ggne' WHERE stage_key = 'nen_chu';

-- Chặng 4 · Cấu trúc → Chương 3: Cấu trúc thị trường
UPDATE roadmap_stages SET lesson_id = 'l-msonwa80-st7y' WHERE stage_key = 'cau_truc';

-- Chặng 5 · Tư duy → Chương 4: Tư duy phương pháp 3 hộp
UPDATE roadmap_stages SET lesson_id = 'l-msonwa80-tpap' WHERE stage_key = 'tu_duy';

-- Chặng 6 · Công thức 1 → Chương 5: Công thức 1
UPDATE roadmap_stages SET lesson_id = 'l-msonwa80-q7we' WHERE stage_key = 'ct1';

-- Chặng 7 · Công thức 2 → Chương 6: Công thức 2
UPDATE roadmap_stages SET lesson_id = 'l-msonwa80-t3t6' WHERE stage_key = 'ct2';

-- Chặng 8 · Công thức 3 → Chương 7: Công thức 3
UPDATE roadmap_stages SET lesson_id = 'l-msonwa80-3s1x' WHERE stage_key = 'ct3';

-- Chặng 9 · Video hoàn thiện → Chương 8 đến 12
UPDATE roadmap_stages
SET lesson_ids = ARRAY[
  'l-msonwa80-xnw0',  -- Chương 8: Quản Lý Vốn
  'l-msonwa80-u83d',  -- Chương 9: Quản Lí Cảm Xúc
  'l-msonwa80-2ffx',  -- Chương 10: Kế Hoạch Giao Dịch
  'l-msonwa81-7arb',  -- Chương 11: Nhật Ký Giao Dịch
  'l-msonwa81-r9f9'   -- Chương 12: Tổng Kết
]
WHERE stage_key = 'video_hoan_thien';

-- Chặng 10 · Bài Tốt nghiệp: CHƯA CHẠY ĐƯỢC.
-- Trong DB hiện chưa có form nào form_type='graduation' status='published'.
-- Phải tạo form tốt nghiệp bên rova-ops trước, rồi mới chạy:
--   UPDATE roadmap_stages SET form_id = '<id-form-tot-nghiep>' WHERE stage_key = 'tot_nghiep';

COMMIT;

-- Kiểm tra sau khi chạy: mọi dòng phải có liên kết, không còn (trống)
SELECT order_index, stage_key, completion_type, lesson_id,
       COALESCE(array_length(lesson_ids, 1), 0) AS so_bai_nhom,
       assignment_id, quiz_id, form_id
FROM roadmap_stages
ORDER BY order_index;
