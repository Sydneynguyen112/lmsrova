-- ============================================================
-- VIDEO ONBOARDING BẮT BUỘC (trước form khảo sát)
-- Chạy trong Supabase Dashboard → SQL Editor, sau supabase-setup.sql.
-- An toàn chạy lại nhiều lần (IF NOT EXISTS / ON CONFLICT).
-- ============================================================

-- Bảng cài đặt chung dạng key-value (admin chỉnh trong /admin/settings)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_app_settings" ON app_settings;
CREATE POLICY "allow_all_app_settings" ON app_settings FOR ALL USING (true) WITH CHECK (true);

-- Chỗ chứa ID video onboarding (Bunny Stream GUID). null = tính năng tắt,
-- học viên mới đi thẳng vào form khảo sát như cũ.
INSERT INTO app_settings (key, value)
VALUES ('onboarding_video', '{"video_id": null}')
ON CONFLICT (key) DO NOTHING;

-- Theo dõi tiến độ xem video onboarding của từng học viên:
-- - seconds: tổng GIÂY XEM THẬT cộng dồn (tua không tính)
-- - position: vị trí đang xem dở, để lần sau mở lên xem tiếp
-- - watched_at: thời điểm được công nhận "đã xem xong" (hết video + đủ 80% giây thật)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_video_seconds INT NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_video_position INT NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_video_watched_at TIMESTAMPTZ;
