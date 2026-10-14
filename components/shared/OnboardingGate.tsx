"use client";

// Học viên đi qua các cửa theo thứ tự trước khi vào bất kỳ trang dashboard nào —
// kể cả khi CHƯA được duyệt. Chặn ở layout để gõ thẳng URL cũng không lọt.
//   1. Chưa khai khoá đã đăng ký (PRO/MASTER)      → /choose-course
//   2. Khoá cần bài test (PRO) mà chưa làm          → /onboarding-video → /onboarding
//      (KHÔNG đợi duyệt: làm bài test xong mới chờ duyệt — câu "Ai là mentor của bạn?"
//      trong bài test gán mentor_id, nhờ vậy mentor bên rova-ops mới thấy để duyệt)
//   3. Qua hết → dashboard; chưa được duyệt thì /student hiện popup chờ duyệt.
// Học viên cũ đã làm bài test thì bỏ qua cửa 1, không bắt khai lại.
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUserState } from "@/lib/auth";
import { choiceRequiresIntake } from "@/lib/course-choice";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user: currentUser, status } = useCurrentUserState();

  // Chưa đăng nhập thì ĐƯA VỀ TRANG ĐĂNG NHẬP, đừng để đứng im.
  // Mọi màn dashboard đều viết `if (!currentUser) return <Đang tải…>`, mà
  // currentUser null cũng chính là trạng thái "chưa đăng nhập" — thiếu chốt này
  // thì người chưa đăng nhập (máy mới, phiên hết hạn) kẹt ở "Đang tải…" vĩnh viễn.
  // Phải đợi status khác "checking", nếu không sẽ đá nhầm người đang đăng nhập.
  useEffect(() => {
    if (status !== "signed-out") return;
    router.replace("/sign-in");
  }, [status, router]);

  const hasSurvey = !!currentUser?.onboarding_survey;
  const needsChoice = !!currentUser && !hasSurvey && !currentUser.requested_course_id;
  // Khoá cần bài test mà chưa làm → làm ngay, chưa duyệt cũng làm
  const pendingIntake =
    !!currentUser &&
    !hasSurvey &&
    !needsChoice &&
    choiceRequiresIntake(currentUser.requested_course_id);

  useEffect(() => {
    if (!currentUser) return;
    if (needsChoice) router.replace("/choose-course");
    else if (pendingIntake) router.replace("/onboarding-video");
  }, [currentUser, needsChoice, pendingIntake, router]);

  if (needsChoice || pendingIntake) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Đang trên đường về /sign-in — đừng vẽ children, chúng sẽ lại kẹt "Đang tải…".
  if (status === "signed-out") return null;

  return <>{children}</>;
}
