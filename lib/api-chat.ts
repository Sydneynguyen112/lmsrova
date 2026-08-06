// lib/api-chat.ts — chat học viên ↔ mentor (luật 3 Trải Nghiệm 360: trao đổi CHỈ trong LMS).
// Thread = student_id: mỗi học viên một luồng duy nhất với mentor phụ trách (profiles.mentor_id).
// Bảng + Realtime định nghĩa trong supabase-mentor-chat.sql. KHÔNG thêm vào lib/api.ts.
import { supabase } from "./supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface ChatMessage {
  id: string;
  student_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

export async function getThreadMessages(studentId: string, limit = 500): Promise<ChatMessage[]> {
  const { data } = await supabase
    .from("mentor_messages")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: true })
    .limit(limit);
  return (data as ChatMessage[]) || [];
}

export async function sendChatMessage(
  studentId: string,
  senderId: string,
  content: string
): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from("mentor_messages")
    .insert({ student_id: studentId, sender_id: senderId, content: content.trim() })
    .select()
    .single();
  if (error) throw error;
  return data as ChatMessage;
}

// Đánh dấu đã đọc mọi tin phía bên kia gửi trong luồng (gọi khi mở luồng / nhận tin mới lúc đang mở)
export async function markThreadRead(studentId: string, readerId: string): Promise<void> {
  await supabase
    .from("mentor_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("student_id", studentId)
    .neq("sender_id", readerId)
    .is("read_at", null);
}

// Số tin gửi tới reader mà reader chưa đọc (badge sidebar)
export async function countUnread(studentId: string, readerId: string): Promise<number> {
  const { count } = await supabase
    .from("mentor_messages")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .neq("sender_id", readerId)
    .is("read_at", null);
  return count || 0;
}

// Realtime: cb chạy với MỖI tin nhắn mới trong luồng (kể cả tin mình gửi — UI tự lọc trùng theo id).
// Trả về hàm hủy đăng ký, gọi trong cleanup của useEffect.
export function subscribeToThread(
  studentId: string,
  cb: (m: ChatMessage) => void
): () => void {
  const channel: RealtimeChannel = supabase
    .channel(`mentor-chat-${studentId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "mentor_messages", filter: `student_id=eq.${studentId}` },
      (payload) => cb(payload.new as ChatMessage)
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
