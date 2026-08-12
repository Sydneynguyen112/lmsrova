// Gợi ý bước học kế tiếp ngay sau khi khám bệnh xong — phần "ý nghĩa onboarding"
// gộp vào bài test: học viên vừa biết mình là ai, biết luôn phải làm gì tiếp.
//
// Chỉ đọc dữ liệu lộ trình CÓ THẬT (chặng hiện tại, bài chưa xem, quiz chưa qua)
// qua buildDailyTodo — KHÔNG bịa lộ trình riêng theo trình độ. Lộ trình hiện là
// một đường chung cho mọi học viên; trình độ chỉ dùng để gợi ý NHỊP học.
import { supabase } from "./supabase";
import { loadStudentUnlockData } from "./api-student";
import { buildDailyTodo, suggestPace, type LearningPace, type TodoItem } from "./daily-todo";
import { ROADMAP_COURSE_ID } from "./api-intake";

export interface IntakeNextStep {
  stageTitle: string | null; // null = đã đi hết lộ trình
  stageDone: number;
  stageTotal: number;
  primary: TodoItem | null; // MỘT việc kế tiếp, null = chưa có việc nào
  suggestedPace: LearningPace;
  courseId: string;
}

/**
 * Gọi SAU submitIntake (lúc đó chặng 1 vừa được đánh dấu xong, chặng 2 đã mở).
 * Trả null khi khoá chưa cấu hình lộ trình → màn kết quả ẩn khối gợi ý.
 * Không bao giờ throw: lỗi mạng/thiếu bảng chỉ làm mất khối gợi ý, không chặn
 * học viên xem kết quả.
 */
export async function getIntakeNextStep(
  userId: string,
  classification?: string | null
): Promise<IntakeNextStep | null> {
  const pace = suggestPace(classification);
  try {
    // Khoá học viên thực sự được gán; chưa có thì rơi về khoá lộ trình chính
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("course_id")
      .eq("user_id", userId)
      .in("status", ["active", "completed"])
      .limit(1);
    const courseId = enrollments?.[0]?.course_id || ROADMAP_COURSE_ID;

    const data = await loadStudentUnlockData(userId, courseId);
    const todo = buildDailyTodo(data, courseId, pace);
    if (todo.stageTotal === 0) return null; // khoá chưa seed roadmap_stages

    return {
      stageTitle: todo.stageTitle,
      stageDone: todo.stageDone,
      stageTotal: todo.stageTotal,
      primary: todo.items[0] ?? null,
      suggestedPace: pace,
      courseId,
    };
  } catch (e) {
    console.error("getIntakeNextStep error:", e);
    return null;
  }
}
