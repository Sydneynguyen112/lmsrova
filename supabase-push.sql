-- ============================================================
-- Web Push (PWA) — bảng subscription + trigger bắn webhook khi có tin chat mới.
-- B1: Supabase Dashboard → Database → Extensions → bật "pg_net" (nếu chưa bật).
-- B2: chạy file này trong SQL Editor. Idempotent, chạy lại không sao.
-- Dùng chung cho lmsrova (học viên) + rova-ops (mentor/admin).
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_net;

-- Mỗi thiết bị/trình duyệt đã bật thông báo = 1 dòng (1 người có thể nhiều thiết bị)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  subscription jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_push_subscriptions" ON push_subscriptions;
CREATE POLICY "allow_all_push_subscriptions" ON push_subscriptions
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Tin nhắn chat mới → gọi API gửi push (chạy nền, không chặn insert)
CREATE OR REPLACE FUNCTION notify_push_on_chat_message() RETURNS trigger AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://lmsrova.vercel.app/api/push/send',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-secret', '__PUSH_WEBHOOK_SECRET__'  -- thay bằng secret thật trước khi chạy (trùng env PUSH_WEBHOOK_SECRET trên Vercel)
    ),
    body := jsonb_build_object(
      'id', NEW.id,
      'student_id', NEW.student_id,
      'sender_id', NEW.sender_id,
      'content', NEW.content
    )
  );
  RETURN NEW;
END $$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_push_on_chat_message ON mentor_messages;
CREATE TRIGGER trg_push_on_chat_message
  AFTER INSERT ON mentor_messages
  FOR EACH ROW EXECUTE FUNCTION notify_push_on_chat_message();

-- Kiểm tra sau khi chạy:
-- SELECT count(*) FROM push_subscriptions;  -- tăng dần khi có người bật thông báo
