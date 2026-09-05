// Query bổ sung phía HỌC VIÊN cho Phase 02 (tracking engine).
// Luật mở khoá/qua chặng nằm ở lib/roadmap.ts — file này CHỈ fetch + gói dữ liệu.
import { supabase } from "./supabase";
import {
  computeUnlockState,
  getImageCountsByAssignment,
  getLessonQuizMap,
  getPassedQuizIds,
  getRoadmapStages,
  getStageProgress,
  type ImageCounts,
  type LessonLite,
  type RoadmapStage,
  type StageProgressRow,
  type UnlockState,
} from "./roadmap";

// ─── Lessons toàn khoá, sort xuyên module (thứ tự học thật) ───

export interface CourseLessonRow {
  id: string;
  module_id: string;
  module_title: string;
  module_order_index: number;
  title: string;
  video_url: string | null;
  duration_sec: number;
  order_index: number; // order trong module (giữ nguyên từ DB)
  materials: { name: string; url: string; type: string }[] | null;
}

export async function getCourseLessonsSorted(courseId: string): Promise<CourseLessonRow[]> {
  const { data } = await supabase
    .from("lessons")
    .select(
      "id, module_id, title, video_url, duration_sec, order_index, materials, modules!inner(course_id, title, order_index)"
    )
    .eq("modules.course_id", courseId);
  type Row = {
    id: string;
    module_id: string;
    title: string;
    video_url: string | null;
    duration_sec: number | null;
    order_index: number;
    materials: { name: string; url: string; type: string }[] | null;
    modules: { title: string; order_index: number };
  };
  const rows = (data as unknown as Row[]) || [];
  return rows
    .sort(
      (a, b) => a.modules.order_index - b.modules.order_index || a.order_index - b.order_index
    )
    .map((r) => ({
      id: r.id,
      module_id: r.module_id,
      module_title: r.modules.title,
      module_order_index: r.modules.order_index,
      title: r.title,
      video_url: r.video_url,
      duration_sec: r.duration_sec || 0,
      order_index: r.order_index,
      materials: r.materials,
    }));
}

// ─── lesson_progress đầy đủ (giây xem + vị trí resume + completed) ───

export interface LessonProgressLite {
  lesson_id: string;
  watched_seconds: number;
  last_position_sec: number;
  completed: boolean;
  status: string | null;
  watch_count: number;
}

export async function getLessonProgressMap(
  userId: string
): Promise<Map<string, LessonProgressLite>> {
  const { data } = await supabase
    .from("lesson_progress")
    .select("lesson_id, watched_seconds, last_position_sec, completed, status, watch_count")
    .eq("user_id", userId);
  const map = new Map<string, LessonProgressLite>();
  for (const r of (data as LessonProgressLite[] | null) || []) {
    map.set(r.lesson_id, {
      lesson_id: r.lesson_id,
      watched_seconds: r.watched_seconds || 0,
      last_position_sec: r.last_position_sec || 0,
      completed: !!r.completed,
      status: r.status,
      watch_count: r.watch_count || 0,
    });
  }
  return map;
}

// ─── Tiến độ theo BÀI HỌC — nguồn dùng chung cho trang danh sách và trang chi tiết ───
// Không đọc enrollments.progress_pct: cột đó tính theo CHẶNG (script đồng bộ ghi),
// nên hiển thị lệch với % trong trang chi tiết vốn đếm bài học đã xong.

export interface CourseProgress {
  completed: number;
  total: number;
  pct: number;
}

export function isLessonCompleted(lp: LessonProgressLite | undefined): boolean {
  return lp?.status === "completed" || lp?.completed === true;
}

export async function getCourseProgressMap(
  userId: string
): Promise<Map<string, CourseProgress>> {
  const [{ data: lessonRows }, progressMap] = await Promise.all([
    supabase.from("lessons").select("id, modules!inner(course_id)"),
    getLessonProgressMap(userId),
  ]);
  type Row = { id: string; modules: { course_id: string } };
  const map = new Map<string, CourseProgress>();
  for (const l of (lessonRows as unknown as Row[]) || []) {
    const courseId = l.modules.course_id;
    const cur = map.get(courseId) || { completed: 0, total: 0, pct: 0 };
    cur.total++;
    if (isLessonCompleted(progressMap.get(l.id))) cur.completed++;
    map.set(courseId, cur);
  }
  for (const p of map.values())
    p.pct = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;
  return map;
}

// ─── Gói dữ liệu unlock — load 1 LẦN khi vào trang khoá học / bài học ───

export interface StudentUnlockData {
  stages: RoadmapStage[];
  stageProgress: StageProgressRow[];
  lessons: CourseLessonRow[]; // đã sort xuyên module
  progressMap: Map<string, LessonProgressLite>;
  lessonQuizMap: Map<string, string>; // lesson_id -> quiz_id (quizzes.lesson_id)
  passedQuizIds: Set<string>;
  imageCounts: Map<string, ImageCounts>; // assignment_id -> đếm verdict
  unlock: UnlockState;
}

export async function loadStudentUnlockData(
  userId: string,
  courseId: string
): Promise<StudentUnlockData> {
  const [
    stages,
    stageProgress,
    lessons,
    progressMap,
    passedQuizIds,
    imageCounts,
    courseRow,
    profileRow,
  ] = await Promise.all([
    getRoadmapStages(courseId),
    getStageProgress(userId),
    getCourseLessonsSorted(courseId),
    getLessonProgressMap(userId),
    getPassedQuizIds(userId),
    getImageCountsByAssignment(userId),
    supabase.from("courses").select("price, price_label").eq("id", courseId).single(),
    supabase.from("profiles").select("unlock_all_lessons").eq("id", userId).single(),
  ]);
  const lessonQuizMap = await getLessonQuizMap(lessons.map((l) => l.id));

  const lessonLites: LessonLite[] = lessons.map((l, i) => ({
    id: l.id,
    duration_sec: l.duration_sec,
    order_index: i,
  }));
  const watchedSeconds = new Map<string, number>();
  for (const [id, p] of progressMap) watchedSeconds.set(id, p.watched_seconds);

  const unlock = computeUnlockState({
    lessons: lessonLites,
    watchedSeconds,
    lessonQuizMap,
    passedQuizIds,
    stages,
    progress: stageProgress,
  });

  // Bỏ khoá tuần tự, mở toàn bộ bài (done vẫn tính theo giây xem thật) khi:
  //   - khoá miễn phí, hoặc
  //   - học viên được cấp quyền mở khoá toàn bộ (khách mời/VIP, bật từ SQL Editor)
  const c = courseRow.data as { price: number | null; price_label: string | null } | null;
  const p = profileRow.data as { unlock_all_lessons: boolean | null } | null;
  const isFreeCourse = !!c && !c.price && c.price_label === "Miễn phí";
  if (isFreeCourse || p?.unlock_all_lessons) {
    unlock.unlockedLessonIds = new Set(lessons.map((l) => l.id));
    unlock.firstLockedLessonId = null;
  }

  return {
    stages,
    stageProgress,
    lessons,
    progressMap,
    lessonQuizMap,
    passedQuizIds,
    imageCounts,
    unlock,
  };
}

// Bài "đang mở" đầu tiên (unlocked mà chưa done) — đích redirect khi vào URL bài khoá.
export function firstOpenLessonId(data: StudentUnlockData): string | null {
  for (const l of data.lessons) {
    if (data.unlock.unlockedLessonIds.has(l.id) && !data.unlock.doneLessonIds.has(l.id))
      return l.id;
  }
  // học xong hết → bài cuối cùng
  return data.lessons.length > 0 ? data.lessons[data.lessons.length - 1].id : null;
}

// ─── Quiz ───

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
}

export interface QuizRow {
  id: string;
  lesson_id: string | null;
  title: string;
  questions: QuizQuestion[];
  pass_score: number;
}

export async function getQuizById(quizId: string): Promise<QuizRow | null> {
  const { data } = await supabase.from("quizzes").select("*").eq("id", quizId).maybeSingle();
  return (data as QuizRow | null) ?? null;
}

export async function getQuizzesByIds(quizIds: string[]): Promise<Map<string, QuizRow>> {
  const map = new Map<string, QuizRow>();
  if (quizIds.length === 0) return map;
  const { data } = await supabase.from("quizzes").select("*").in("id", quizIds);
  for (const q of (data as QuizRow[] | null) || []) map.set(q.id, q);
  return map;
}

// ─── Backfill lessons.duration_sec từ metadata video (CHỈ khi đang 0/null) ───

export async function backfillLessonDuration(
  lessonId: string,
  durationSec: number
): Promise<void> {
  if (!durationSec || durationSec <= 0) return;
  await supabase
    .from("lessons")
    .update({ duration_sec: Math.round(durationSec) })
    .eq("id", lessonId)
    .or("duration_sec.is.null,duration_sec.eq.0");
}

// ─── Watch count (badge "xem lại lần 2, 3...") — bump khi video chạy hết ───

export async function incrementWatchCount(userId: string, lessonId: string): Promise<void> {
  const { data } = await supabase
    .from("lesson_progress")
    .select("id, watch_count")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .maybeSingle();
  if (!data) return; // chưa có dòng progress thì flushWatchProgress sẽ tạo với watch_count = 0
  await supabase
    .from("lesson_progress")
    .update({ watch_count: (data.watch_count || 0) + 1 })
    .eq("id", data.id);
}

// ─── Nộp bài tập theo ảnh: 1 lần nộp = 1 dòng submissions + MỖI ẢNH 1 dòng submission_images ───

export interface SubmissionImageRow {
  id: string;
  submission_id: string;
  user_id: string;
  assignment_id: string;
  image_url: string;
  verdict: "pending" | "correct" | "incorrect";
  feedback: string | null;
  graded_at: string | null;
  created_at: string;
}

export async function createSubmissionWithImages(input: {
  assignmentId: string;
  userId: string;
  imageUrls: string[];
  note?: string;
}): Promise<{ id: string }> {
  const { data: submission, error } = await supabase
    .from("submissions")
    .insert({
      assignment_id: input.assignmentId,
      user_id: input.userId,
      image_urls: input.imageUrls,
      note: input.note || null,
    })
    .select("id")
    .single();
  if (error) throw error;

  if (input.imageUrls.length > 0) {
    const { error: imgError } = await supabase.from("submission_images").insert(
      input.imageUrls.map((url) => ({
        submission_id: submission.id,
        user_id: input.userId,
        assignment_id: input.assignmentId,
        image_url: url,
        verdict: "pending",
      }))
    );
    if (imgError) throw imgError;
  }
  return submission;
}

export async function getSubmissionImagesByUser(
  userId: string
): Promise<SubmissionImageRow[]> {
  const { data } = await supabase
    .from("submission_images")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data as SubmissionImageRow[] | null) || [];
}
