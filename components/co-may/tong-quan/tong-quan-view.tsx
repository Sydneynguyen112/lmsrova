"use client";

import { useMemo } from "react";
import { useCurrentUser } from "@/lib/auth";
import {
  computeKpiForScope,
  getMachinesForScope,
  getTxForScope,
  getUserScope,
} from "@/lib/co-may/mock-data";
import { KpiGrid } from "./kpi-grid";
import { PerformanceMatrix } from "./performance-matrix";
import { EquitySparkline } from "./equity-sparkline";

type RoleSlug = "student" | "mentor" | "admin";

const SCOPE_LABEL: Record<RoleSlug, string> = {
  student: "Cỗ máy của bạn",
  mentor: "Tổng hợp cỗ máy của các mentee",
  admin: "Toàn hệ thống",
};

export function TongQuanView({ role }: { role: RoleSlug }) {
  const user = useCurrentUser(role);

  const data = useMemo(() => {
    if (!user) return null;
    const userIds = getUserScope(user.role ?? role, user.id);
    return {
      userIds,
      machines: getMachinesForScope(userIds),
      tx: getTxForScope(userIds),
      kpi: computeKpiForScope(userIds),
    };
  }, [user, role]);

  if (!user || !data) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground text-sm">
        Đang tải dữ liệu...
      </div>
    );
  }

  const { machines, tx, kpi, userIds } = data;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Tổng quan & Hiệu suất</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {SCOPE_LABEL[role]} • {userIds.length} {role === "student" ? "tài khoản" : "trader"} • {machines.length} cỗ máy
          </p>
        </div>
      </div>

      <KpiGrid kpi={kpi} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <PerformanceMatrix machines={machines} tx={tx} weeks={4} />
        </div>
        <div className="lg:col-span-1">
          <EquitySparkline tx={tx} days={30} />
        </div>
      </div>
    </div>
  );
}
