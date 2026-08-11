-- ============================================================
-- BÀI TEST KHÁM BỆNH — ĐÁNH GIÁ ĐẦU VÀO (intake assessment)
-- Plan: plans/260807-intake-assessment/plan.md
-- Chạy tay trong Supabase SQL Editor. Idempotent — chạy lại vô hại.
-- Thuần additive: không sửa/xóa cột cũ, 2 app đang chạy không ảnh hưởng.
-- ============================================================

-- 1. Mở rộng forms.form_type thêm 'intake'
-- CHECK inline không có tên cố định → dò tên qua pg_constraint rồi drop.
DO $$
DECLARE
  cname TEXT;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'forms'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%form_type%';
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE forms DROP CONSTRAINT %I', cname);
  END IF;
  ALTER TABLE forms ADD CONSTRAINT forms_form_type_check
    CHECK (form_type IN ('survey', 'onboarding', 'graduation', 'intake'));
END $$;

-- 2. Cột meta cho câu hỏi — contract chấm điểm đa chiều.
-- Form cũ meta = '{}' → mọi renderer/scorer coi như câu thường (trơ, không crash).
-- Shape (định nghĩa chuẩn trong lib/intake-scoring.ts, mirror ở rova-ops):
--   { "section": "birth|personality|trading|personal",
--     "dimension": "tam_ly|kien_thuc|phuong_phap|quan_ly_von|kinh_nghiem|hoan_canh",
--     "optionScores": [1,2,3,4],            -- song song options[]
--     "optionGroups": {"0": "than_trong"},  -- option bầu nhóm tính cách
--     "optionFlags": {"0": ["no_nang"]},    -- option -> cờ rủi ro
--     "semantic": "birth_date" | "birth_time" | null,
--     "sensitive": true }
ALTER TABLE form_questions ADD COLUMN IF NOT EXISTS meta JSONB NOT NULL DEFAULT '{}';

-- 3. Kết quả khám bệnh — 1 dòng / học viên / form (UNIQUE để upsert khi làm lại)
CREATE TABLE IF NOT EXISTS intake_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  response_id UUID REFERENCES form_responses(id) ON DELETE SET NULL,
  form_id TEXT REFERENCES forms(id),   -- NULL khi dùng bộ câu hỏi fallback trong code
  birth_date DATE,
  birth_time TIME,
  life_path_number INT,                -- thần số học: 1..9, 11, 22, 33
  zodiac TEXT,                         -- slug: 'bach_duong'..'song_ngu'
  can_chi TEXT,                        -- 'Mậu Thìn', ...
  personality_group TEXT,              -- 'than_trong'|'ky_luat'|'lieu_linh'|'cam_tinh'
  classification TEXT,                 -- map legacy: newbie|beginner|intermediate|advanced
  care_group TEXT NOT NULL DEFAULT 'binh_thuong'
    CHECK (care_group IN ('uu_tien_cham_soc', 'theo_doi_sat', 'binh_thuong', 'tiem_nang_cao')),
  dimension_scores JSONB NOT NULL DEFAULT '{}',  -- { "kien_thuc": {"earned":7,"max":12,"pct":58}, ... }
  flags JSONB NOT NULL DEFAULT '[]',             -- ["no_nang","khong_thu_nhap_chinh",...] — chỉ mã enum, không text tự do
  student_visible JSONB NOT NULL DEFAULT '{}',   -- payload an toàn cho màn kết quả học viên (KHÔNG chứa flags/care_group)
  engine_version INT NOT NULL DEFAULT 1,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, form_id)
);

CREATE INDEX IF NOT EXISTS idx_intake_results_user ON intake_results(user_id);
CREATE INDEX IF NOT EXISTS idx_intake_results_care ON intake_results(care_group);

-- 4. Denormalize lên profiles cho list view rova-ops (lọc care_group không cần join)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS care_group TEXT;

-- 5. RLS theo pattern allow_all hiện có của repo.
-- ⚠️ Dữ liệu nhạy cảm (cờ nợ nần...) đang world-readable như mọi bảng khác —
-- việc siết RLS là dự án riêng đã ghi nhận; intake_results + form_answers
-- đứng đầu danh sách khi làm.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['intake_results'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "allow_all_%s" ON %I', t, t);
    EXECUTE format(
      'CREATE POLICY "allow_all_%s" ON %I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)',
      t, t
    );
  END LOOP;
END $$;

-- 6. Kiểm tra nhanh sau khi chạy
SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
  WHERE conrelid = 'forms'::regclass AND contype = 'c';
SELECT column_name FROM information_schema.columns
  WHERE table_name = 'form_questions' AND column_name = 'meta';
SELECT column_name FROM information_schema.columns
  WHERE table_name = 'profiles' AND column_name IN ('date_of_birth', 'care_group');
SELECT count(*) AS intake_results_rows FROM intake_results;
