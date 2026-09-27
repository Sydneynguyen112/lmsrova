// Ghi thông tin học viên tự điền trong form (câu có meta.profileField) vào hồ sơ:
//   student_name = "Tên học viên" — KHÔNG đụng full_name (tên tài khoản lúc đăng ký, giữ nguyên)
//   phone        = số điện thoại
// Dùng cho form tốt nghiệp và form onboarding. Lỗi không chặn việc nộp form.
import { supabase } from "./supabase";
import { profileFieldsFrom } from "./form-question-meta";

export async function saveProfileFromForm(
  userId: string,
  questions: { id: string; question_type: string; meta?: unknown }[],
  answers: Record<string, string | undefined>
): Promise<void> {
  const fields = profileFieldsFrom(questions, answers);
  if (Object.keys(fields).length === 0) return;
  const { error } = await supabase.from("profiles").update(fields).eq("id", userId);
  if (!error) return;
  console.error("saveProfileFromForm:", error.message);
  // Cột student_name chưa có (chưa chạy supabase-student-name.sql bên rova-ops) → vẫn lưu số điện thoại
  if (fields.student_name && fields.phone) {
    const { error: phoneErr } = await supabase.from("profiles").update({ phone: fields.phone }).eq("id", userId);
    if (phoneErr) console.error("saveProfileFromForm phone:", phoneErr.message);
  }
}
