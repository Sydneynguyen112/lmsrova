// Máy gợi ý việc-hôm-nay (rule-based, không AI): nhìn dữ liệu lộ trình sẵn có
// (chặng hiện tại, bài chưa xem, quiz chưa qua, bài tập chưa đạt) và lọc ra
// danh sách việc kế tiếp theo đúng thứ tự lộ trình. Việc đầu tiên trong danh
// sách chính là nút "MỘT việc kế tiếp" trên trang nhà.
// SQL đi kèm: supabase-daily-todo.sql (cột profiles.learning_pace)
import { supabase } from "./supabase";
import { isLessonWatched, type RoadmapStage } from "./roadmap";
import type { StudentUnlockData } from "./api-student";

export type LearningPace = "fast" | "steady";

export const PACE_INFO: Record<
  LearningPace,
  { label: string; desc: string; perDay: number }
> = {
  fast: {
    label: "Đường nhanh",
    desc: "3 việc học mỗi ngày — bám sát mốc 20 ngày",
    perDay: 3,
  },
  steady: {
    label: "Đường vững",
    desc: "1–2 việc mỗi ngày — chắc từng bước, không vội",
    perDay: 2,
  },
};

// Gợi ý nhịp từ kết quả khảo sát — học viên vẫn toàn quyền chọn khác
export function suggestPace(classification?: string | null): LearningPace {
  return classification === "intermediate" || classification === "advanced"
    ? "fast"
    : "steady";
}

export async function saveLearningPace(
  userId: string,
  pace: LearningPace
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ learning_pace: pace })
    .eq("id", userId);
  if (error) throw error;
}

export interface TodoItem {
  kind: "watch" | "quiz" | "assignment" | "waiting" | "graduation";
  title: string;
  detail: string;
  href: string;
}

export interface DailyTodoResult {
  items: TodoItem[];
  stageTitle: string | null; // null = đã đi hết lộ trình
  stageDone: number;
  stageTotal: number;
}

export function buildDailyTodo(
  data: StudentUnlockData,
  courseId: string,
  pace: LearningPace
): DailyTodoResult {
  const {
    stages,
    stageProgress,
    lessons,
    progressMap,
    lessonQuizMap,
    passedQuizIds,
    imageCounts,
    unlock,
  } = data;

  const completedStageIds = new Set(
    stageProgress.filter((p) => p.completed_at).map((p) => p.stage_id)
  );
  const orderedStages = [...stages].sort((a, b) => a.order_index - b.order_index);
  const currentStage =
    orderedStages.find((s) => !completedStageIds.has(s.id)) || null;
  const stageDone = orderedStages.filter((s) => completedStageIds.has(s.id)).length;

  const watchedSeconds = new Map<string, number>();
  for (const [id, p] of progressMap) watchedSeconds.set(id, p.watched_seconds);

  const assignmentStageByLesson = new Map<string, RoadmapStage>();
  for (const s of stages)
    if (s.completion_type === "assignment_quiz" && s.lesson_id)
      assignmentStageByLesson.set(s.lesson_id, s);

  const items: TodoItem[] = [];
  const maxItems = PACE_INFO[pace].perDay;

  for (const lesson of lessons) {
    if (items.length >= maxItems) break;
    if (!unlock.unlockedLessonIds.has(lesson.id)) break; // từ đây trở đi còn khóa
    if (unlock.doneLessonIds.has(lesson.id)) continue;

    const href = `/student/courses/${courseId}/${lesson.id}`;
    const watched = isLessonWatched(
      { id: lesson.id, duration_sec: lesson.duration_sec, order_index: 0 },
      watchedSeconds
    );
    if (!watched) {
      items.push({ kind: "watch", title: lesson.title, detail: "Xem video bài học", href });
      continue;
    }

    const quizId = lessonQuizMap.get(lesson.id);
    if (quizId && !passedQuizIds.has(quizId)) {
      items.push({ kind: "quiz", title: lesson.title, detail: "Làm quiz để qua bài", href });
      continue;
    }

    // Đã xem + quiz OK nhưng bài chưa "done" → kẹt ở bài tập chặng
    const stage = assignmentStageByLesson.get(lesson.id);
    if (stage?.assignment_id) {
      const counts = imageCounts.get(stage.assignment_id);
      const correct = counts?.correct || 0;
      const pending = counts?.pending || 0;
      const required = stage.required_correct_images || 0;
      if (correct < required && correct + pending >= required) {
        items.push({
          kind: "waiting",
          title: lesson.title,
          detail: `Bài tập đang chờ mentor chấm (${correct}/${required} ảnh đạt)`,
          href: "/student/submissions",
        });
      } else if (correct < required) {
        items.push({
          kind: "assignment",
          title: lesson.title,
          detail: `Nộp bài tập — cần ${required} ảnh đạt, đang có ${correct}`,
          href,
        });
      }
      continue;
    }
  }

  // Cuối lộ trình: mọi bài đã xong, chỉ còn form tốt nghiệp
  if (items.length === 0 && currentStage?.completion_type === "graduation_form") {
    items.push({
      kind: "graduation",
      title: "Form tốt nghiệp",
      detail: "Điền form để hoàn thành lộ trình",
      href: "/student/graduation",
    });
  }

  return {
    items,
    stageTitle: currentStage ? currentStage.title : null,
    stageDone,
    stageTotal: orderedStages.length,
  };
}
