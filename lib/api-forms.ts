// Helpers cho form builder (form tốt nghiệp = khảo sát cảm nhận, không chấm điểm)
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

// Form tốt nghiệp là khảo sát cảm nhận — kiến thức đã kiểm qua bài tập + quiz trong lộ trình.
// Học viên nộp form = đạt chặng tot_nghiep. Response vẫn ghi grade = GRADUATION_PASS_GRADE
// vì engine lộ trình (lib/roadmap.ts, scripts/rerun-roadmap-engine.mjs) và view SQL
// v_student_roadmap coi grade 'tot'/'xuat_sac' là "đã tốt nghiệp". score_pct để null.
export const GRADUATION_PASS_GRADE: Grade = "tot";

// Validate trước khi publish form graduation.
// Trả về message lỗi tiếng Việt, hoặc null nếu hợp lệ.
export function validateGraduationPublish(questions: FormQuestionRow[]): string | null {
  if (!questions.some((q) => q.question_text.trim())) {
    return "Form tốt nghiệp cần ít nhất 1 câu hỏi có nội dung.";
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
