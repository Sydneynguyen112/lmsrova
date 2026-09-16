// Lựa chọn khoá học ngay sau đăng nhập — học viên tự khai đã đăng ký khoá nào
// (PRO hay MASTER). Đây CHỈ là lời khai: mentor/admin bên rova-ops vẫn là người
// gán enrollment (= duyệt). Lưu ở profiles.requested_course_id.
// SQL: supabase-course-choice.sql
import { supabase } from "./supabase";
import { ROADMAP_COURSE_ID } from "./api-intake";

export const MASTER_COURSE_ID = "c-mthq5gx5-to6p";

export interface CourseChoice {
  courseId: string;
  key: "pro" | "master";
  title: string;
  /** Dùng khi courses.description trống */
  tagline: string;
  /** true = sau khi được duyệt phải qua video onboarding + bài test đầu vào */
  requiresIntake: boolean;
}

export const COURSE_CHOICES: CourseChoice[] = [
  {
    courseId: ROADMAP_COURSE_ID,
    key: "pro",
    title: "3 Hộp PRO",
    tagline: "Lộ trình 10 chặng, bài tập chấm bởi mentor.",
    requiresIntake: true,
  },
  {
    courseId: MASTER_COURSE_ID,
    key: "master",
    title: "3 Hộp MASTER",
    tagline: "Chương trình nâng cao của ROVA.",
    // TODO: đổi thành true khi có bộ câu hỏi onboarding riêng cho MASTER
    requiresIntake: false,
  },
];

export function getCourseChoice(courseId?: string | null): CourseChoice | null {
  return COURSE_CHOICES.find((c) => c.courseId === courseId) ?? null;
}

// Khoá không nằm trong danh sách (vd học viên cũ được gán khoá Tradingview)
// → mặc định vẫn bắt làm bài test, giữ đúng hành vi trước đây.
export function choiceRequiresIntake(courseId?: string | null): boolean {
  return getCourseChoice(courseId)?.requiresIntake ?? true;
}

export async function saveCourseChoice(
  userId: string,
  courseId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("profiles")
    .update({ requested_course_id: courseId, requested_course_at: new Date().toISOString() })
    .eq("id", userId);
  return { error: error ? error.message : null };
}
