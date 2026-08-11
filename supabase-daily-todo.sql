-- ============================================================
-- TODOLIST HẰNG NGÀY — nhịp học cá nhân hóa
-- Chạy trong Supabase Dashboard → SQL Editor. An toàn chạy lại nhiều lần.
-- ============================================================

-- Nhịp học do học viên TỰ CHỌN sau khảo sát (nguyên lý "người học cầm lái"):
-- 'fast'   = đường nhanh — 3 việc học/ngày, bám mốc 20 ngày
-- 'steady' = đường vững  — 1-2 việc/ngày, chắc từng bước
-- NULL = chưa chọn → dashboard hiện màn chọn nhịp (kèm gợi ý theo kết quả khảo sát)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS learning_pace TEXT
  CHECK (learning_pace IN ('fast', 'steady'));
