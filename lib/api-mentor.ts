// lib/api-mentor.ts — Phase 03: toàn bộ query phía mentor (hàng đợi chấm ảnh,
// trạng thái học viên, ghi chú lần chạm). KHÔNG thêm vào lib/api.ts.
// Nguồn chân lý thông số: plans/260806-roadmap-analytics/phase-03-mentor-grading.md
import { supabase } from "./supabase";
import type { StudentStatus, NoteChannel, NoteType } from "./status-labels";

// ─── v_student_roadmap (view định nghĩa trong supabase-analytics-views.sql) ───

export interface StudentRoadmapRow {
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  mentor_id: string | null;
  mentor_name: string | null;
  status: StudentStatus | null;
  status_changed_at: string | null;
  ready_for_coaching: boolean;
  external_code: string | null;
  enrolled_at: string | null;
  graduated_at: string | null;
  cohort_month: string | null;
  current_stage_key: string | null;
  current_stage_title: string | null;
  stage_order: number | null;
  entered_at: string | null;
  deadline_at: string | null;
  pause_started_at: string | null;
  days_in_stage: number | null;
  days_late: number | null;
  is_ket: boolean;
  is_cho_cham: boolean;
  correct_images: number;
  pending_images: number;
  graduation_grade: string | null;
}

export async function getMentorRoadmapRows(mentorId: string): Promise<StudentRoadmapRow[]> {
  const { data } = await supabase
    .from("v_student_roadmap")
    .select("*")
    .eq("mentor_id", mentorId);
  return (data as StudentRoadmapRow[]) || [];
}

export async function getStudentRoadmapRow(userId: string): Promise<StudentRoadmapRow | null> {
  const { data } = await supabase
    .from("v_student_roadmap")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as StudentRoadmapRow) || null;
}

// Số học viên của mentor đang bị "Chờ chấm" (đồng hồ deadline dừng vì mentor)
export async function countChoChamStudents(mentorId: string): Promise<number> {
  const { count } = await supabase
    .from("v_student_roadmap")
    .select("user_id", { count: "exact", head: true })
    .eq("mentor_id", mentorId)
    .eq("is_cho_cham", true);
  return count || 0;
}

// ─── Hàng đợi chấm ảnh (submission_images) ───

export interface SubmissionMetadata {
  pair?: string;
  timeframe?: string;
  date?: string;
  formula?: string;
  direction?: string;
  note?: string;
}

export type ImageVerdict = "pending" | "correct" | "incorrect";

export interface PendingImage {
  id: string;
  submission_id: string;
  user_id: string;
  assignment_id: string;
  image_url: string;
  verdict: ImageVerdict;
  feedback: string | null;
  created_at: string;
  // nested từ FK submission_id → submissions (metadata pair/timeframe/note của lần nộp)
  submissions: { metadata: SubmissionMetadata | null; submitted_at: string } | null;
}

export async function getPendingImagesByStudents(studentIds: string[]): Promise<PendingImage[]> {
  if (studentIds.length === 0) return [];
  const { data } = await supabase
    .from("submission_images")
    .select(
      "id, submission_id, user_id, assignment_id, image_url, verdict, feedback, created_at, submissions(metadata, submitted_at)"
    )
    .eq("verdict", "pending")
    .in("user_id", studentIds)
    .order("created_at", { ascending: true }); // cũ nhất trước
  return (data as unknown as PendingImage[]) || [];
}

// Chấm 1 ảnh. Sau khi gọi hàm này, NGƯỜI GỌI phải gọi checkAndCompleteStages(userId, 'c-mov3c81m-fdq2')
// (lib/roadmap.ts) — ảnh thứ 20 correct có thể qua chặng/mở quiz. Trigger DB tự lo pause/unpause.
export async function gradeImage(
  imageId: string,
  verdict: "correct" | "incorrect",
  feedback: string | null,
  gradedBy: string
): Promise<void> {
  const { error } = await supabase
    .from("submission_images")
    .update({
      verdict,
      feedback: feedback?.trim() || null,
      graded_by: gradedBy,
      graded_at: new Date().toISOString(),
    })
    .eq("id", imageId);
  if (error) throw error;
}

// ─── Trạng thái học viên (status_events + RPC set_student_status) ───

export interface StatusEvent {
  id: string;
  user_id: string;
  from_status: StudentStatus | null;
  to_status: StudentStatus;
  reason: string | null;
  changed_by: string | null;
  created_at: string;
}

export async function getStatusEvents(userId: string, limit = 10): Promise<StatusEvent[]> {
  const { data } = await supabase
    .from("status_events")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as StatusEvent[]) || [];
}

export async function getProfileNames(ids: string[]): Promise<Map<string, string>> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (unique.length === 0) return new Map();
  const { data } = await supabase.from("profiles").select("id, full_name").in("id", unique);
  return new Map((data || []).map((p) => [p.id as string, p.full_name as string]));
}

// tam_dung: đồng hồ deadline DỪNG — set pause trên dòng stage progress đang mở (chưa set thì mới set)
export async function pauseOpenStage(userId: string): Promise<void> {
  await supabase
    .from("student_stage_progress")
    .update({ pause_started_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("completed_at", null)
    .is("pause_started_at", null);
}

// Gỡ tạm dừng: cộng dồn paused_seconds + giãn deadline_at đúng bằng khoảng vừa pause, clear pause
export async function resumeOpenStage(userId: string): Promise<void> {
  const { data } = await supabase
    .from("student_stage_progress")
    .select("id, paused_seconds, pause_started_at, deadline_at")
    .eq("user_id", userId)
    .is("completed_at", null)
    .not("pause_started_at", "is", null);
  for (const row of data || []) {
    const pausedMs = Math.max(0, Date.now() - new Date(row.pause_started_at as string).getTime());
    await supabase
      .from("student_stage_progress")
      .update({
        paused_seconds: (Number(row.paused_seconds) || 0) + Math.round(pausedMs / 1000),
        pause_started_at: null,
        ...(row.deadline_at
          ? { deadline_at: new Date(new Date(row.deadline_at as string).getTime() + pausedMs).toISOString() }
          : {}),
      })
      .eq("id", row.id);
  }
}

// Gắn/đổi tag tay: gọi RPC set_student_status (ghi status_events kèm người đổi + lý do),
// kèm cơ chế pause/unpause khi vào/ra tam_dung.
export async function setStudentStatusManual(params: {
  userId: string;
  status: StudentStatus;
  reason: string | null;
  changedBy: string;
  prevStatus: StudentStatus | null;
}): Promise<void> {
  const { userId, status, reason, changedBy, prevStatus } = params;
  const { error } = await supabase.rpc("set_student_status", {
    p_user: userId,
    p_status: status,
    p_reason: reason,
    p_by: changedBy,
  });
  if (error) throw error;
  if (status === "tam_dung") await pauseOpenStage(userId);
  else if (prevStatus === "tam_dung") await resumeOpenStage(userId);
}

export async function toggleReadyForCoaching(userId: string, value: boolean): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ ready_for_coaching: value })
    .eq("id", userId);
  if (error) throw error;
}

// ─── Ghi chú lần chạm (user_notes có channel + note_type) ───

export interface TouchNote {
  id: string;
  user_id: string;
  author_id: string;
  content: string;
  channel: NoteChannel;
  note_type: NoteType;
  created_at: string;
}

export async function getTouchNotesByUser(userId: string): Promise<TouchNote[]> {
  const { data } = await supabase
    .from("user_notes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data as TouchNote[]) || [];
}

export async function createTouchNote(note: {
  user_id: string;
  author_id: string;
  content: string;
  channel: NoteChannel;
  note_type: NoteType;
}): Promise<TouchNote> {
  const { data, error } = await supabase.from("user_notes").insert(note).select().single();
  if (error) throw error;
  return data as TouchNote;
}

// Đếm lần chạm kể từ một mốc (dùng cho banner đề xuất Rời bỏ: chậm ≥14 ngày + chạm ≥3 lần)
export async function countNotesSince(userId: string, sinceIso: string): Promise<number> {
  const { count } = await supabase
    .from("user_notes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", sinceIso);
  return count || 0;
}

// Lần chạm gần nhất của từng học viên (cột "Lần chạm gần nhất" trong danh sách)
export async function getLastTouchByUsers(userIds: string[]): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map();
  const { data } = await supabase
    .from("user_notes")
    .select("user_id, created_at")
    .in("user_id", userIds)
    .order("created_at", { ascending: false });
  const map = new Map<string, string>();
  for (const row of data || []) {
    if (!map.has(row.user_id as string)) map.set(row.user_id as string, row.created_at as string);
  }
  return map;
}
