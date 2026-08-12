"use client";

// Học viên đã được ROVA duyệt nhưng chưa làm bài test đầu vào thì không được vào
// bất kỳ trang dashboard nào. Chặn ở layout để gõ thẳng URL cũng không lọt.
// Chưa được duyệt thì cho qua — trang /student tự hiện popup chờ duyệt.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/auth";
import { isApproved } from "@/lib/approval";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const currentUser = useCurrentUser("student");
  const [checked, setChecked] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

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

  if (redirecting) return null;

  return <>{children}</>;
}
