// Helpers cho quiz builder (admin) — tạo/sửa quiz + gắn vào bài học hoặc chặng lộ trình.
// KHÔNG đụng lib/api.ts — file này gom riêng logic quiz phía admin.
// Kiểu QuizRow/QuizQuestion dùng chung với phía học viên (lib/api-student.ts).
import { supabase } from "./supabase";
import type { QuizQuestion, QuizRow } from "./api-student";

export type { QuizQuestion, QuizRow };

export interface LessonOption {
  id: string;
  label: string; // "Module — Bài học"
}

export interface StageOption {
  id: string;
  stage_key: string;
  title: string;
  course_id: string;
  quiz_id: string | null;
}

export async function listQuizzes(): Promise<QuizRow[]> {
  const { data } = await supabase.from("quizzes").select("*").order("title");
  return (data as QuizRow[] | null) || [];
}

// quiz_id -> số lượt làm (để chặn xoá quiz đã có dữ liệu)
export async function getAttemptCounts(): Promise<Record<string, number>> {
  const { data } = await supabase.from("quiz_attempts").select("quiz_id");
  const counts: Record<string, number> = {};
  (data || []).forEach((r: { quiz_id: string }) => {
    counts[r.quiz_id] = (counts[r.quiz_id] || 0) + 1;
  });
  return counts;
}

export async function createQuiz(
  id: string,
  title: string,
  passScore: number
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("quizzes")
    .insert({ id, title, pass_score: passScore, questions: [] });
  return { error: error ? error.message : null };
}

export async function updateQuiz(
  id: string,
  patch: Partial<Pick<QuizRow, "title" | "pass_score" | "lesson_id" | "questions">>
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("quizzes").update(patch).eq("id", id);
  return { error: error ? error.message : null };
}

// roadmap_stages.quiz_id có FK không cascade — phải gỡ khỏi chặng trước khi xoá
export async function deleteQuiz(id: string): Promise<{ error: string | null }> {
  await supabase.from("roadmap_stages").update({ quiz_id: null }).eq("quiz_id", id);
  const { error } = await supabase.from("quizzes").delete().eq("id", id);
  return { error: error ? error.message : null };
}

// Dropdown bài học: "Module — Bài" theo đúng thứ tự học
export async function getLessonOptions(): Promise<LessonOption[]> {
  const [{ data: lessons }, { data: modules }] = await Promise.all([
    supabase.from("lessons").select("id, module_id, title, order_index").order("order_index"),
    supabase.from("modules").select("id, title, order_index").order("order_index"),
  ]);
  const moduleMap = new Map<string, { title: string; order: number }>();
  (modules || []).forEach((m) => moduleMap.set(m.id, { title: m.title, order: m.order_index }));
  return (lessons || [])
    .slice()
    .sort((a, b) => {
      const ma = moduleMap.get(a.module_id)?.order ?? 0;
      const mb = moduleMap.get(b.module_id)?.order ?? 0;
      return ma - mb || a.order_index - b.order_index;
    })
    .map((l) => ({
      id: l.id,
      label: `${moduleMap.get(l.module_id)?.title || "?"} — ${l.title}`,
    }));
}

export async function getStageOptions(): Promise<StageOption[]> {
  const { data } = await supabase
    .from("roadmap_stages")
    .select("id, stage_key, title, course_id, quiz_id")
    .order("order_index");
  return (data as StageOption[] | null) || [];
}

export async function attachQuizToStage(
  stageId: string,
  quizId: string | null
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("roadmap_stages")
    .update({ quiz_id: quizId })
    .eq("id", stageId);
  return { error: error ? error.message : null };
}

// Validate trước khi lưu. Trả về message lỗi tiếng Việt, hoặc null nếu hợp lệ.
export function validateQuizQuestions(questions: QuizQuestion[]): string | null {
  if (questions.length === 0) return "Quiz cần ít nhất 1 câu hỏi.";
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.question.trim()) return `Câu ${i + 1}: chưa nhập nội dung câu hỏi.`;
    const filled = q.options.filter((o) => o.trim());
    if (filled.length < 2) return `Câu ${i + 1}: cần ít nhất 2 đáp án.`;
    if (q.options.some((o) => !o.trim())) return `Câu ${i + 1}: có đáp án đang để trống.`;
    if (q.correct < 0 || q.correct >= q.options.length)
      return `Câu ${i + 1}: chưa chọn đáp án đúng.`;
  }
  return null;
}
