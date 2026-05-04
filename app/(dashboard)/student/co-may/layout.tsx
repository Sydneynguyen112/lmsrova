"use client";

import { useCurrentUser } from "@/lib/auth";
import { hasMoneyMachineAccess } from "@/lib/co-may/mock-data";
import { CoMayShell } from "@/components/co-may/co-may-shell";
import { PaywallScreen } from "@/components/co-may/paywall-screen";

export default function StudentCoMayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useCurrentUser("student");
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground">
        Đang tải...
      </div>
    );
  }
  if (!hasMoneyMachineAccess(user.id, user.role)) return <PaywallScreen />;
  return <CoMayShell role="student">{children}</CoMayShell>;
}
