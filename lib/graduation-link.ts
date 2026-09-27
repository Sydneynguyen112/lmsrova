// Form tốt nghiệp nộp qua link công khai (không đăng nhập): mentor gửi link cho học viên qua Zalo,
// lượt nộp không có user_id nên phải tìm tài khoản theo email rồi công nhận tốt nghiệp —
// cùng các bước với nộp trong LMS (GraduationView): gắn grade, đóng chặng, gắn tag, đóng ghi danh.
// Mirror: rova-ops/lib/graduation-link.ts — sửa một bên phải sửa bên kia.
import { supabase } from "./supabase";
import { GRADUATION_PASS_GRADE } from "./api-forms";
import { checkAndCompleteStages } from "./roadmap";

/** Trả true khi đã gắn được lượt nộp vào đúng một học viên. Không gắn được thì lượt nộp vẫn nằm ở trang phản hồi. */
export async function graduateByPublicResponse(responseId: string, formId: string, email: string): Promise<boolean> {
  const mail = email.trim();
  if (!mail) return false;

  const { data: stages } = await supabase
    .from("roadmap_stages")
    .select("course_id")
    .eq("completion_type", "graduation_form")
    .eq("form_id", formId);
  const courseIds = [...new Set((stages || []).map((s) => s.course_id as string))];
  if (courseIds.length === 0) return false;

  // ilike coi _ và % là ký tự đại diện → so lại đúng từng chữ; trùng email thì không đoán
  const { data: found } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("role", "student")
    .ilike("email", mail.replace(/[\\%_]/g, "\\$&"));
  const students = (found || []).filter((p) => (p.email || "").trim().toLowerCase() === mail.toLowerCase());
  if (students.length !== 1) return false;
  const userId = students[0].id as string;

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id, enrolled_at")
    .eq("user_id", userId)
    .in("course_id", courseIds)
    .order("enrolled_at", { ascending: false });
  const courseId = enrollments?.[0]?.course_id as string | undefined;
  if (!courseId) return false;

  const { error } = await supabase
    .from("form_responses")
    .update({ user_id: userId, grade: GRADUATION_PASS_GRADE })
    .eq("id", responseId)
    .is("user_id", null);
  if (error) {
    console.error("graduateByPublicResponse:", error.message);
    return false;
  }

  await checkAndCompleteStages(userId, courseId);
  await supabase.rpc("set_student_status", {
    p_user: userId,
    p_status: "tot_nghiep",
    p_reason: "Nộp form tốt nghiệp qua link công khai",
    p_by: null,
  });
  await supabase
    .from("enrollments")
    .update({ completed_at: new Date().toISOString(), status: "completed" })
    .eq("user_id", userId)
    .eq("course_id", courseId);
  return true;
}
