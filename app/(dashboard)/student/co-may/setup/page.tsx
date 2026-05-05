"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/auth";
import { hasMoneyMachineAccess } from "@/lib/co-may/mock-data";
import { hasCompletedSetup } from "@/lib/co-may/setup-store";
import { PaywallScreen } from "@/components/co-may/paywall-screen";
import { SetupWizard } from "@/components/co-may/setup/setup-wizard";

export default function StudentCoMaySetupPage() {
  const user = useCurrentUser("student");
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    if (hasCompletedSetup(user.id, user.role)) {
      router.replace("/student/co-may/tong-quan");
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground">
        Đang tải...
      </div>
    );
  }
  if (!hasMoneyMachineAccess(user.id, user.role)) return <PaywallScreen />;
  return <SetupWizard userId={user.id} role="student" />;
}
