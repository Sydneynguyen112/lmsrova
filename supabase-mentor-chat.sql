-- supabase-mentor-chat.sql — Chat học viên ↔ mentor (luật 3 Trải Nghiệm 360:
-- trao đổi học tập CHỈ trong LMS, được lưu, tự đổ vào hồ sơ 360).
-- Chạy 1 lần trong Supabase SQL Editor. Dùng chung cho cả lmsrova (học viên) + rova-ops (mentor).
--
-- Mô hình luồng: thread = student_id. Mỗi học viên có ĐÚNG 1 luồng chat với mentor
-- phụ trách mình (profiles.mentor_id) — không cần bảng conversations riêng.

CREATE TABLE IF NOT EXISTS mentor_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- chủ luồng
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,  -- người gửi (học viên hoặc mentor)
  content text NOT NULL CHECK (length(trim(content)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz -- NULL = phía bên kia chưa đọc
);

CREATE INDEX IF NOT EXISTS idx_mentor_messages_thread
  ON mentor_messages (student_id, created_at);
CREATE INDEX IF NOT EXISTS idx_mentor_messages_unread
  ON mentor_messages (student_id) WHERE read_at IS NULL;

-- RLS pattern allow_all hiện tại của dự án — siết ở dự án riêng
ALTER TABLE mentor_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_mentor_messages" ON mentor_messages;
CREATE POLICY "allow_all_mentor_messages" ON mentor_messages
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Bật Realtime cho bảng — tin nhắn đẩy tức thì tới cả 2 app
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE mentor_messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
