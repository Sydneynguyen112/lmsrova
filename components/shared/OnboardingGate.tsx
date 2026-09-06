"use client";

// Học viên đã được ROVA duyệt nhưng chưa làm bài test đầu vào thì không được vào
// bất kỳ trang dashboard nào. Chặn ở layout để gõ thẳng URL cũng không lọt.
// Chưa được duyệt thì cho qua — trang /student tự hiện popup chờ duyệt.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUserState } from "@/lib/auth";
import { isApproved } from "@/lib/approval";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user: currentUser, status } = useCurrentUserState();
  const [checked, setChecked] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

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
    let cancelled = false;
    isApproved(currentUser.id).then((approved) => {
      if (cancelled) return;
      if (approved) {
        setRedirecting(true);
        router.replace("/onboarding-video");
      } else {
        setChecked(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [currentUser, pendingIntake, router]);

  if (pendingIntake && !checked) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Đang trên đường về /sign-in — đừng vẽ children, chúng sẽ lại kẹt "Đang tải…".
  if (status === "signed-out" || redirecting) return null;

  return <>{children}</>;
}
