"use client";

// Học viên đi qua các cửa theo thứ tự trước khi vào bất kỳ trang dashboard nào —
// kể cả khi CHƯA được duyệt. Chặn ở layout để gõ thẳng URL cũng không lọt.
//   1. Chưa khai khoá đã đăng ký (PRO/MASTER)      → /choose-course
//   2. Chưa được duyệt (chưa có enrollment active)  → dashboard, /student hiện popup chờ duyệt
//   3. Đã duyệt, khoá cần bài test (PRO) mà chưa làm → /onboarding-video → /onboarding
//   4. Qua hết → dashboard.
// Học viên cũ đã làm bài test thì bỏ qua cửa 1, không bắt khai lại.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUserState } from "@/lib/auth";
import { isApproved } from "@/lib/approval";
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
  // Khoá cần bài test mà chưa làm → phải biết đã duyệt chưa mới quyết được
  const needsIntakeCheck =
    !!currentUser &&
    !hasSurvey &&
    !needsChoice &&
    choiceRequiresIntake(currentUser.requested_course_id);
  const [approved, setApproved] = useState<boolean | null>(null);

  useEffect(() => {
    if (!currentUser || !needsIntakeCheck) return;
    let cancelled = false;
    isApproved(currentUser.id).then((ok) => {
      if (!cancelled) setApproved(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [currentUser, needsIntakeCheck]);

  const checkingApproval = needsIntakeCheck && approved === null;
  const pendingIntake = needsIntakeCheck && approved === true;

  useEffect(() => {
    if (!currentUser) return;
    if (needsChoice) router.replace("/choose-course");
    else if (pendingIntake) router.replace("/onboarding-video");
  }, [currentUser, needsChoice, pendingIntake, router]);

  if (needsChoice || checkingApproval || pendingIntake) {
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
