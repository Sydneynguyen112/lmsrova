"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/auth";
import {
  getMachinesByUser,
  getTxByUser,
  getUserScope,
} from "@/lib/co-may/mock-data";
import { getSetup } from "@/lib/co-may/setup-store";
import type { Machine, MachineTransaction } from "@/lib/co-may/types";
import { MachineCard } from "./machine-card";
import { CreateMachineDialog } from "./create-machine-dialog";

type RoleSlug = "student" | "mentor" | "admin";

const SCOPE_LABEL: Record<RoleSlug, string> = {
  student: "Cỗ máy của bạn",
  mentor: "Cỗ máy của mentee",
  admin: "Tất cả cỗ máy",
};

export function QuanLyListView({ role }: { role: RoleSlug }) {
  const user = useCurrentUser(role);
  const [machineMap, setMachineMap] = useState<{ ownerId: string; m: Machine }[]>([]);
  const [tx, setTx] = useState<MachineTransaction[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!user) return;
    const userIds = getUserScope(user.role ?? role, user.id);
    const allMachines: { ownerId: string; m: Machine }[] = [];
    const allTx: MachineTransaction[] = [];
    for (const id of userIds) {
      for (const m of getMachinesByUser(id)) allMachines.push({ ownerId: id, m });
      allTx.push(...getTxByUser(id));
    }
    setMachineMap(allMachines);
    setTx(allTx);
  }, [user, role, tick]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground text-sm">
        Đang tải...
      </div>
    );
  }

  const canCreate = role === "student";

  // Reserve pool = totalCapital - sum(active machine.capital của chính user, không phải scope)
  let reservePool: number | undefined;
  if (canCreate) {
    const setup = getSetup(user.id);
    if (setup) {
      const ownActive = getMachinesByUser(user.id).filter((m) => m.status !== "closed");
      const allocated = ownActive.reduce((s, m) => s + m.capital, 0);
      reservePool = Math.max(0, setup.totalCapital - allocated);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Cỗ Máy Chi Tiết</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {SCOPE_LABEL[role]} • {machineMap.length} cỗ máy
            {!canCreate && " • read-only"}
            {canCreate && reservePool !== undefined && ` • Vốn dự trữ: ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(reservePool)}`}
          </p>
        </div>
        {canCreate && (
          <CreateMachineDialog
            userId={user.id}
            reservePool={reservePool}
            onCreated={() => setTick((n) => n + 1)}
          />
        )}
      </div>

      {machineMap.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center space-y-2">
          <p className="text-sm text-muted-foreground">Chưa có cỗ máy nào.</p>
          {canCreate && (
            <p className="text-xs text-muted-foreground/70">
              Bấm &quot;Tạo cỗ máy mới&quot; ở góc phải để bắt đầu.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {machineMap.map(({ ownerId, m }) => (
            <MachineCard
              key={m.id}
              machine={m}
              tx={tx.filter((t) => t.machine_id === m.id)}
              detailHref={`/${role}/co-may/quan-ly/${m.id}?owner=${ownerId}`}
              role={role}
            />
          ))}
        </div>
      )}
    </div>
  );
}
