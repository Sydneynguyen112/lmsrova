"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCurrentUser } from "@/lib/auth";
import {
  getMachineById,
  getTxByMachine,
  getUserScope,
} from "@/lib/co-may/mock-data";
import type { Machine, MachineTransaction } from "@/lib/co-may/types";
import { AnchorCard } from "./anchor-card";
import { TradeInput } from "./trade-input";
import { WithdrawModal } from "./withdraw-modal";
import { CloseCycleDialog } from "./close-cycle-dialog";
import { TransactionList } from "./transaction-list";

type RoleSlug = "student" | "mentor" | "admin";

export function MachineDetailView({
  role,
  machineId,
  ownerId,
}: {
  role: RoleSlug;
  machineId: string;
  ownerId?: string;
}) {
  const user = useCurrentUser(role);
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((n) => n + 1);

  const resolved = useMemo<{ machine: Machine; tx: MachineTransaction[]; resolvedOwner: string } | null>(() => {
    if (!user) return null;
    // For student: owner is always self. For mentor/admin: owner from query string, fallback to scope search.
    const scope = getUserScope(user.role ?? role, user.id);
    const candidates = ownerId && scope.includes(ownerId) ? [ownerId] : [user.id, ...scope];
    for (const id of candidates) {
      const m = getMachineById(id, machineId);
      if (m) {
        return { machine: m, tx: getTxByMachine(id, machineId), resolvedOwner: id };
      }
    }
    return null;
  }, [user, role, machineId, ownerId, tick]);

  if (!user) {
    return <div className="text-sm text-muted-foreground">Đang tải...</div>;
  }

  if (!resolved) {
    return (
      <div className="space-y-4">
        <Link
          href={`/${role}/co-may/quan-ly`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Quay lại danh sách
        </Link>
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Không tìm thấy cỗ máy này hoặc bạn không có quyền truy cập.
        </div>
      </div>
    );
  }

  const { machine, tx, resolvedOwner } = resolved;
  const cycleStartTs = new Date(machine.cycle_started_at ?? machine.created_at).getTime();
  const cycleTx = tx.filter((t) => new Date(t.created_at).getTime() >= cycleStartTs);
  const trades = cycleTx.filter((t) => t.type === "trade_win" || t.type === "trade_loss");
  const cyclePnl = trades.reduce((s, t) => s + t.amount, 0);

  const readOnly = role !== "student" || resolvedOwner !== user.id;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <Link
            href={`/${role}/co-may/quan-ly`}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-1.5"
          >
            <ArrowLeft className="h-3 w-3" />
            Danh sách cỗ máy
          </Link>
          <h2 className="text-lg font-semibold text-foreground">{machine.name}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Vốn ban đầu: {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(machine.capital)}
            {readOnly && " • read-only view"}
          </p>
        </div>
      </div>

      <AnchorCard machine={machine} ownerId={resolvedOwner} readOnly={readOnly} onChange={refresh} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <TransactionList tx={tx} limit={10} />
        </div>
        <div className="space-y-4">
          {!readOnly && (
            <>
              <TradeInput ownerId={resolvedOwner} machineId={machine.id} onChange={refresh} />
              <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Hành động</h3>
                <WithdrawModal
                  ownerId={resolvedOwner}
                  machineId={machine.id}
                  currentAnchor={machine.current_anchor}
                  onChange={refresh}
                />
                <CloseCycleDialog
                  ownerId={resolvedOwner}
                  machineId={machine.id}
                  cyclePnl={cyclePnl}
                  onChange={refresh}
                />
              </div>
            </>
          )}
          {readOnly && (
            <div className="rounded-2xl border border-dashed border-border p-5 text-center space-y-1.5">
              <p className="text-sm font-medium text-foreground">View read-only</p>
              <p className="text-xs text-muted-foreground">
                {role === "mentor" ? "Mentor không chỉnh sửa cỗ máy của mentee." : "Admin không chỉnh sửa cỗ máy của user khác."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
