// Engine lộ trình học — nguồn chân lý thông số: plans/260806-roadmap-analytics/plan.md
// Mọi màn hình (student unlock, mentor grading, analytics) dùng CHUNG file này,
// tuyệt đối không tự chế luật mở khoá/qua chặng ở nơi khác.
import { supabase } from "./supabase";

export const WATCH_THRESHOLD = 0.5; // xem >=50% thời lượng = xong bài

export interface RoadmapStage {
  id: string;
  course_id: string;
  stage_key: string;
  title: string;
  order_index: number;
  target_days: number;
  completion_type:
    | "onboarding"
    | "first_lesson"
    | "assignment_quiz"
    | "lesson_quiz"
    | "lesson_group"
    | "graduation_form";
  lesson_id: string | null;
  lesson_ids: string[] | null;
  assignment_id: string | null;
  quiz_id: string | null;
  required_correct_images: number;
  form_id: string | null;
}

export interface StageProgressRow {
  id: string;
  user_id: string;
  stage_id: string;
  entered_at: string | null;
  deadline_at: string | null;
  completed_at: string | null;
  paused_seconds: number;
  pause_started_at: string | null;
  source: "app" | "import";
}

export interface ImageCounts {
  correct: number;
  pending: number;
  incorrect: number;
}

// ─── Fetchers ───

export async function getRoadmapStages(courseId: string): Promise<RoadmapStage[]> {
  const { data } = await supabase
    .from("roadmap_stages")
    .select("*")
    .eq("course_id", courseId)
    .order("order_index");
  return (data as RoadmapStage[]) || [];
}

export async function getStageProgress(userId: string): Promise<StageProgressRow[]> {
  const { data } = await supabase
    .from("student_stage_progress")
    .select("*")
    .eq("user_id", userId);
  return (data as StageProgressRow[]) || [];
}

export async function getImageCountsByAssignment(
  userId: string
): Promise<Map<string, ImageCounts>> {
  const { data } = await supabase
    .from("submission_images")
    .select("assignment_id, verdict")
    .eq("user_id", userId);
  const map = new Map<string, ImageCounts>();
  for (const row of data || []) {
    const c = map.get(row.assignment_id) || { correct: 0, pending: 0, incorrect: 0 };
    if (row.verdict === "correct") c.correct++;
    else if (row.verdict === "pending") c.pending++;
    else c.incorrect++;
    map.set(row.assignment_id, c);
  }
  return map;
}

export async function getPassedQuizIds(userId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from("quiz_attempts")
    .select("quiz_id")
    .eq("user_id", userId)
    .eq("passed", true);
  return new Set((data || []).map((r) => r.quiz_id));
}

// quiz gắn theo bài học (quizzes.lesson_id) — dùng cho luật mở bài kế tiếp
export async function getLessonQuizMap(lessonIds: string[]): Promise<Map<string, string>> {
  if (lessonIds.length === 0) return new Map();
  const { data } = await supabase
    .from("quizzes")
    .select("id, lesson_id")
    .in("lesson_id", lessonIds);
  const map = new Map<string, string>();
  for (const q of data || []) if (q.lesson_id) map.set(q.lesson_id, q.id);
  return map;
}

// ─── Luật mở khoá video tuần tự ───
// done(bài N) = xem >=50% + quiz bài N passed (nếu có) + nếu N là video đầu chặng bài tập
// thì CẢ chặng đó phải completed. Bài N+1 mở khi mọi bài trước done.

export interface LessonLite {
  id: string;
  duration_sec: number;
  order_index: number; // thứ tự TOÀN KHOÁ (đã sort xuyên module)
}

export interface UnlockInput {
  lessons: LessonLite[]; // đã sort theo thứ tự học
  watchedSeconds: Map<string, number>; // lesson_id -> giây xem thật
  lessonQuizMap: Map<string, string>; // lesson_id -> quiz_id
  passedQuizIds: Set<string>;
  stages: RoadmapStage[];
  progress: StageProgressRow[];
}

export interface UnlockState {
  unlockedLessonIds: Set<string>;
  doneLessonIds: Set<string>;
  firstLockedLessonId: string | null;
}

export function isLessonWatched(lesson: LessonLite, watchedSeconds: Map<string, number>): boolean {
  const watched = watchedSeconds.get(lesson.id) || 0;
  if (!lesson.duration_sec) return watched > 0; // duration chưa có: nới, tránh khoá oan
  return watched >= lesson.duration_sec * WATCH_THRESHOLD;
}

export function computeUnlockState(input: UnlockInput): UnlockState {
  const { lessons, watchedSeconds, lessonQuizMap, passedQuizIds, stages, progress } = input;
  const completedStageIds = new Set(
    progress.filter((p) => p.completed_at).map((p) => p.stage_id)
  );
  const stageByLesson = new Map<string, RoadmapStage>();
  for (const s of stages)
    if (s.completion_type === "assignment_quiz" && s.lesson_id) stageByLesson.set(s.lesson_id, s);

  const unlocked = new Set<string>();
  const done = new Set<string>();
  let firstLocked: string | null = null;
  let previousAllDone = true;

  for (const lesson of lessons) {
    if (previousAllDone) unlocked.add(lesson.id);
    else if (firstLocked === null) firstLocked = lesson.id;

    let lessonDone = isLessonWatched(lesson, watchedSeconds);
    const quizId = lessonQuizMap.get(lesson.id);
    if (lessonDone && quizId && !passedQuizIds.has(quizId)) lessonDone = false;
    const stage = stageByLesson.get(lesson.id);
    if (lessonDone && stage && !completedStageIds.has(stage.id)) lessonDone = false;

    if (lessonDone) done.add(lesson.id);
    previousAllDone = previousAllDone && lessonDone;
  }
  return { unlockedLessonIds: unlocked, doneLessonIds: done, firstLockedLessonId: firstLocked };
}

// ─── Khởi tạo & qua chặng ───

export async function initStudentRoadmap(userId: string, courseId: string): Promise<void> {
  const stages = await getRoadmapStages(courseId);
  if (stages.length === 0) return;
  const existing = await getStageProgress(userId);
  if (existing.length > 0) return;
  const first = stages[0];
  const now = new Date();
  await supabase.from("student_stage_progress").insert({
    user_id: userId,
    stage_id: first.id,
    entered_at: now.toISOString(),
    deadline_at: new Date(now.getTime() + first.target_days * 86400_000).toISOString(),
  });
}

async function openStage(userId: string, stage: RoadmapStage): Promise<void> {
  const now = new Date();
  await supabase.from("student_stage_progress").upsert(
    {
      user_id: userId,
      stage_id: stage.id,
      entered_at: now.toISOString(),
      deadline_at: new Date(now.getTime() + stage.target_days * 86400_000).toISOString(),
    },
    { onConflict: "user_id,stage_id", ignoreDuplicates: true }
  );
}

async function markStageComplete(userId: string, stageId: string): Promise<void> {
  await supabase
    .from("student_stage_progress")
    .update({ completed_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("stage_id", stageId)
    .is("completed_at", null);
}

// ─── Kiểm tra điều kiện qua chặng theo completion_type ───

interface StageCheckContext {
  userId: string;
  hasOnboardingSurvey: boolean;
  lessons: LessonLite[];
  watchedSeconds: Map<string, number>;
  lessonQuizMap: Map<string, string>;
  passedQuizIds: Set<string>;
  imageCounts: Map<string, ImageCounts>;
  passingGraduationFormIds: Set<string>; // form_id có response grade tot/xuat_sac
}

function isStageConditionMet(stage: RoadmapStage, ctx: StageCheckContext): boolean {
  switch (stage.completion_type) {
    case "onboarding":
      return ctx.hasOnboardingSurvey;
    case "first_lesson":
      return ctx.lessons.some((l) => isLessonWatched(l, ctx.watchedSeconds));
    case "assignment_quiz": {
      if (!stage.assignment_id) return false;
      const counts = ctx.imageCounts.get(stage.assignment_id);
      const enoughImages = (counts?.correct || 0) >= stage.required_correct_images;
      const quizOk = stage.quiz_id ? ctx.passedQuizIds.has(stage.quiz_id) : true;
      return enoughImages && quizOk;
    }
    case "lesson_quiz": {
      const lesson = ctx.lessons.find((l) => l.id === stage.lesson_id);
      const watched = lesson ? isLessonWatched(lesson, ctx.watchedSeconds) : false;
      const quizId = stage.quiz_id || (stage.lesson_id ? ctx.lessonQuizMap.get(stage.lesson_id) : undefined);
      return watched && (quizId ? ctx.passedQuizIds.has(quizId) : true);
    }
    case "lesson_group": {
      const ids = stage.lesson_ids || [];
      if (ids.length === 0) return false;
      return ids.every((id) => {
        const lesson = ctx.lessons.find((l) => l.id === id);
        if (!lesson || !isLessonWatched(lesson, ctx.watchedSeconds)) return false;
        const quizId = ctx.lessonQuizMap.get(id);
        return quizId ? ctx.passedQuizIds.has(quizId) : true;
      });
    }
    case "graduation_form":
      return stage.form_id ? ctx.passingGraduationFormIds.has(stage.form_id) : false;
  }
}

// Gọi sau MỌI sự kiện học: video đạt 50%, quiz pass, mentor chấm ảnh, nộp survey, nộp form.
// Lặp complete các chặng đã đủ điều kiện (phòng import/backfill), mở chặng kế, refresh status.
export async function checkAndCompleteStages(userId: string, courseId: string): Promise<void> {
  const [stages, progress] = await Promise.all([
    getRoadmapStages(courseId),
    getStageProgress(userId),
  ]);
  if (stages.length === 0) return;
  if (progress.length === 0) await initStudentRoadmap(userId, courseId);

  const [{ data: profile }, lessonsRes, watchedRes, imageCounts, passedQuizIds, gradRes] =
    await Promise.all([
      supabase.from("profiles").select("onboarding_survey").eq("id", userId).single(),
      supabase
        .from("lessons")
        .select("id, duration_sec, order_index, module_id, modules!inner(course_id, order_index)")
        .eq("modules.course_id", courseId),
      supabase.from("lesson_progress").select("lesson_id, watched_seconds").eq("user_id", userId),
      getImageCountsByAssignment(userId),
      getPassedQuizIds(userId),
      supabase
        .from("form_responses")
        .select("form_id, grade")
        .eq("user_id", userId)
        .in("grade", ["tot", "xuat_sac"]),
    ]);

  type LessonRow = { id: string; duration_sec: number; order_index: number; modules: { order_index: number } };
  const lessons: LessonLite[] = ((lessonsRes.data as unknown as LessonRow[]) || [])
    .sort((a, b) => a.modules.order_index - b.modules.order_index || a.order_index - b.order_index)
    .map((l, i) => ({ id: l.id, duration_sec: l.duration_sec, order_index: i }));

  const watchedSeconds = new Map<string, number>();
  for (const r of watchedRes.data || []) watchedSeconds.set(r.lesson_id, r.watched_seconds || 0);

  const lessonQuizMap = await getLessonQuizMap(lessons.map((l) => l.id));

  const ctx: StageCheckContext = {
    userId,
    hasOnboardingSurvey: !!profile?.onboarding_survey,
    lessons,
    watchedSeconds,
    lessonQuizMap,
    passedQuizIds,
    imageCounts,
    passingGraduationFormIds: new Set((gradRes.data || []).map((r) => r.form_id)),
  };

  const currentProgress = await getStageProgress(userId);
  const completedIds = new Set(currentProgress.filter((p) => p.completed_at).map((p) => p.stage_id));

  for (const stage of stages) {
    if (completedIds.has(stage.id)) continue;
    await openStage(userId, stage); // đảm bảo có dòng progress (idempotent)
    if (!isStageConditionMet(stage, ctx)) break; // chặng đầu tiên chưa đạt = chặng hiện tại
    await markStageComplete(userId, stage.id);
    completedIds.add(stage.id);
  }

  await supabase.rpc("refresh_student_statuses");
}

// ─── Ghi giây xem video (VideoPlayer gọi định kỳ) ───
export async function flushWatchProgress(
  userId: string,
  lessonId: string,
  addedSeconds: number,
  positionSec: number,
  durationSec: number
): Promise<{ justCompleted: boolean }> {
  const { data: existing } = await supabase
    .from("lesson_progress")
    .select("id, watched_seconds, completed")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  const watched = (existing?.watched_seconds || 0) + Math.max(0, Math.round(addedSeconds));
  const reachedThreshold = durationSec > 0 && watched >= durationSec * WATCH_THRESHOLD;
  const justCompleted = reachedThreshold && !existing?.completed;

  await supabase.from("lesson_progress").upsert(
    {
      user_id: userId,
      lesson_id: lessonId,
      watched_seconds: watched,
      last_position_sec: Math.round(positionSec),
      last_watched_at: new Date().toISOString(),
      watch_count: existing ? undefined : 1,
      ...(reachedThreshold
        ? { completed: true, completed_at: existing?.completed ? undefined : new Date().toISOString(), status: "completed" }
        : { status: "in_progress" }),
    },
    { onConflict: "user_id,lesson_id" }
  );

  return { justCompleted };
}
