// Form tốt nghiệp làm qua link /forms/<id> (mentor gửi cho học viên qua Zalo): học viên phải đăng nhập,
// nộp xong thì công nhận tốt nghiệp — cùng các bước với nộp trong trang khoá học (GraduationView):
// đóng chặng, gắn tag, đóng ghi danh.
import { supabase } from "./supabase";
import { checkAndCompleteStages } from "./roadmap";
import { profileFieldsFrom } from "./form-question-meta";

/**
 * Ghi họ tên / số điện thoại học viên tự điền trong form tốt nghiệp (câu có meta.profileField) vào hồ sơ —
 * tên lúc đăng ký thường là biệt danh / tên Google. Form không có câu nào như vậy thì không làm gì.
 */
export async function saveProfileFromForm(
  userId: string,
  questions: { id: string; question_type: string; meta?: unknown }[],
  answers: Record<string, string | undefined>
): Promise<void> {
  const fields = profileFieldsFrom(questions, answers);
  if (Object.keys(fields).length === 0) return;
  const { error } = await supabase.from("profiles").update(fields).eq("id", userId);
  if (error) console.error("saveProfileFromForm:", error.message);
}

/** Trả false khi học viên không ghi danh khoá nào dùng form này (bài vẫn lưu, không ai được tốt nghiệp). */
export async function graduateByForm(userId: string, formId: string): Promise<boolean> {
  const { data: stages } = await supabase
    .from("roadmap_stages")
    .select("course_id")
    .eq("completion_type", "graduation_form")
    .eq("form_id", formId);
  const courseIds = [...new Set((stages || []).map((s) => s.course_id as string))];
  if (courseIds.length === 0) return false;

  // Form dùng chung nhiều khoá → khoá ghi danh gần nhất
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id, enrolled_at")
    .eq("user_id", userId)
    .in("course_id", courseIds)
    .order("enrolled_at", { ascending: false });
  const courseId = enrollments?.[0]?.course_id as string | undefined;
  if (!courseId) return false;

  await checkAndCompleteStages(userId, courseId);
  await supabase.rpc("set_student_status", {
    p_user: userId,
    p_status: "tot_nghiep",
    p_reason: "Nộp form tốt nghiệp qua link form",
    p_by: null,
  });
  await supabase
    .from("enrollments")
    .update({ completed_at: new Date().toISOString(), status: "completed" })
    .eq("user_id", userId)
    .eq("course_id", courseId);
  return true;
}
