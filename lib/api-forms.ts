// Helpers cho form builder có chấm điểm (form tốt nghiệp) — Phase 04
// Nguồn chân lý thông số: plans/260806-roadmap-analytics/phase-04-graduation-form.md
// KHÔNG đụng lib/api.ts — file này gom riêng logic forms.
import { supabase } from "./supabase";

export type FormType = "survey" | "onboarding" | "graduation" | "intake";
export type FormStatus = "draft" | "published";
export type Grade = "khong_dat" | "tot" | "xuat_sac";

export interface FormRow {
  id: string;
  title: string;
  description: string | null;
  form_type: FormType;
  status: FormStatus;
  created_at: string;
}

export interface FormQuestionRow {
  id: string;
  form_id: string;
  question_text: string;
  question_type: "text" | "textarea" | "radio" | "checkbox" | "select" | "rating";
  options: string[];
  correct_option: number | null; // index trong options — chỉ radio/select
  points: number; // điểm câu hỏi — text/textarea luôn 0
  required: boolean;
  order_index: number;
}

// Loại câu hỏi được chấm điểm trong form graduation
export const SCORABLE_TYPES = ["radio", "select"] as const;

export function isScorableType(type: string): boolean {
  return (SCORABLE_TYPES as readonly string[]).includes(type);
}

// Badge styles cho xếp loại — dùng chung admin + student
export const GRADE_STYLES: Record<Grade, string> = {
  khong_dat: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  tot: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  xuat_sac: "bg-gold/15 text-gold border-gold/40",
};

// Ranh giới dùng >= để không lọt người đúng vạch (đã chốt trong plan)
export function gradeFromScore(scorePct: number): Grade {
  if (scorePct >= 85) return "xuat_sac";
  if (scorePct >= 60) return "tot";
  return "khong_dat";
}

export interface GraduationScore {
  scorePct: number; // 0–100, làm tròn 2 chữ số
  earnedPoints: number;
  totalPoints: number; // Σ points mọi câu có correct_option
  correctCount: number;
  gradedCount: number; // số câu được chấm điểm
  grade: Grade;
}

// Chấm điểm client ngay lúc submit:
// score_pct = 100 * Σ(points câu đúng) / Σ(points mọi câu có correct_option)
export function computeGraduationScore(
  questions: FormQuestionRow[],
  answers: Record<string, string>
): GraduationScore {
  let earned = 0;
  let total = 0;
  let correctCount = 0;
  let gradedCount = 0;
  for (const q of questions) {
    if (!isScorableType(q.question_type) || q.correct_option === null) continue;
    const pts = q.points || 0;
    total += pts;
    gradedCount++;
    const correctAnswer = q.options?.[q.correct_option];
    if (correctAnswer !== undefined && answers[q.id] === correctAnswer) {
      earned += pts;
      correctCount++;
    }
  }
  const scorePct = total > 0 ? Math.round((earned / total) * 10000) / 100 : 0;
  return {
    scorePct,
    earnedPoints: earned,
    totalPoints: total,
    correctCount,
    gradedCount,
    grade: gradeFromScore(scorePct),
  };
}

// Validate trước khi publish form graduation.
// Trả về message lỗi tiếng Việt, hoặc null nếu hợp lệ.
export function validateGraduationPublish(questions: FormQuestionRow[]): string | null {
  const scorable = questions.filter(
    (q) => isScorableType(q.question_type) && q.correct_option !== null
  );
  if (scorable.length === 0) {
    return "Form tốt nghiệp cần ít nhất 1 câu hỏi có đáp án đúng (loại Chọn một hoặc Dropdown).";
  }
  const totalPoints = scorable.reduce((sum, q) => sum + (q.points || 0), 0);
  if (totalPoints <= 0) {
    return "Tổng điểm các câu có đáp án đúng phải lớn hơn 0.";
  }
  return null;
}

// ─── Gắn form graduation vào chặng tot_nghiep của khoá ───

// Map course_id -> form_id đang được gắn làm bài tốt nghiệp
export async function getGraduationAttachments(): Promise<Map<string, string>> {
  const { data } = await supabase
    .from("roadmap_stages")
    .select("course_id, form_id")
    .eq("stage_key", "tot_nghiep");
  const map = new Map<string, string>();
  for (const row of data || []) {
    if (row.form_id) map.set(row.course_id, row.form_id);
  }
  return map;
}

// Gắn form mới thay form cũ (responses cũ giữ nguyên) — chỉ 1 form active per course
export async function attachGraduationForm(
  courseId: string,
  formId: string | null
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("roadmap_stages")
    .update({ form_id: formId })
    .eq("course_id", courseId)
    .eq("stage_key", "tot_nghiep");
  return { error: error ? error.message : null };
}
