"use client";

// Học viên chưa làm bài test đầu vào thì không được vào bất kỳ trang dashboard
// nào — kể cả khi CHƯA được duyệt. Thứ tự mới: onboarding trước (tự chọn mentor
// trong form) → mentor thấy trong dashboard → mở khoá học (= duyệt). Đã làm
// onboarding mà chưa được duyệt thì /student tự hiện popup chờ duyệt.
// Chặn ở layout để gõ thẳng URL cũng không lọt.
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUserState } from "@/lib/auth";

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

  const pendingIntake = !!currentUser && !currentUser.onboarding_survey;

  useEffect(() => {
    if (!currentUser || !pendingIntake) return;
    router.replace("/onboarding-video");
  }, [currentUser, pendingIntake, router]);

  if (pendingIntake) {
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
