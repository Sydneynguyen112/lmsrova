-- ============================================
-- Lưu full onboarding survey vào profiles
-- IDEMPOTENT
-- ============================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_survey JSONB;

-- Index để query nhanh khi filter classification trong dashboard
CREATE INDEX IF NOT EXISTS profiles_onboarding_classification_idx
  ON profiles((onboarding_survey->>'classification'));

-- Verify:
-- SELECT id, full_name, onboarding_survey->>'classification' AS class,
--        (onboarding_survey->>'total_score')::int AS score
-- FROM profiles WHERE onboarding_survey IS NOT NULL LIMIT 10;
