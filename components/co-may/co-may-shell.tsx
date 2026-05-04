"use client";

import { Coins } from "lucide-react";
import { SubNav } from "./sub-nav";

type RoleSlug = "student" | "mentor" | "admin";

const ROLE_LABEL: Record<RoleSlug, string> = {
  student: "View học viên",
  mentor: "View mentor — đọc dữ liệu mentee",
  admin: "View admin — toàn hệ thống",
};

export function CoMayShell({
  role,
  children,
}: {
  role: RoleSlug;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <header className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 border border-primary/30">
          <Coins className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold gold-gradient-text">
            Cỗ Máy In Tiền
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {ROLE_LABEL[role]} — quản trị kỷ luật rút tiền cho trader
          </p>
        </div>
      </header>

      <SubNav role={role} />

      <div className="pt-2">{children}</div>
    </div>
  );
}
