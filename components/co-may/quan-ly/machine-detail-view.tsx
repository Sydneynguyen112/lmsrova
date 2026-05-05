"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, PowerOff } from "lucide-react";
import { useCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  closeMachine,
  getMachineById,
  getTxByMachine,
  getUserScope,
} from "@/lib/co-may/mock-data";
import { adjustTotalCapital } from "@/lib/co-may/setup-store";
import type { Machine, MachineTransaction } from "@/lib/co-may/types";
import { AnchorCard } from "./anchor-card";
import { TradeInput } from "./trade-input";
import { WithdrawModal } from "./withdraw-modal";
import { CloseCycleDialog } from "./close-cycle-dialog";
import { TransactionList } from "./transaction-list";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

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
  const router = useRouter();
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((n) => n + 1);

  function handleCloseMachine(
    ownerId: string,
    machineId: string,
    preview: { capital: number; balance: number; delta: number },
  ) {
    if (typeof window === "undefined") return;
    const msg =
      `Đóng cỗ máy này?\n\n` +
      `• Vốn ban đầu: ${usd.format(preview.capital)}\n` +
      `• Số dư cuối: ${usd.format(preview.balance)}\n` +
      `• Chênh lệch: ${preview.delta >= 0 ? "+" : ""}${usd.format(preview.delta)}\n\n` +
      `Số dư cuối sẽ được cộng vào tổng vốn doanh chủ. Hành động không thể hoàn tác.`;
    const ok = window.confirm(msg);
    if (!ok) return;
    const result = closeMachine(ownerId, machineId);
    adjustTotalCapital(ownerId, result.delta);
    router.push(`/${role}/co-may/quan-ly`);
  }

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

  // Preview close machine — read-only, không mutate
  const allTrades = tx.filter((t) => t.type === "trade_win" || t.type === "trade_loss");
  const allWithdraws = tx.filter((t) => t.type === "withdraw");
  const totalPnl = allTrades.reduce((s, t) => s + t.amount, 0);
  const totalWithdraws = allWithdraws.reduce((s, t) => s + t.amount, 0); // negative
  const closeBalance = machine.capital + totalPnl + totalWithdraws;
  const closePreview = {
    capital: machine.capital,
    balance: closeBalance,
    delta: closeBalance - machine.capital,
  };

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

      <AnchorCard machine={machine} ownerId={resolvedOwner} readOnly={readOnly} onChange={refresh} role={role} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <TransactionList tx={tx} limit={10} role={role} />
        </div>
        <div className="space-y-4">
          {!readOnly && (
            <>
              <TradeInput ownerId={resolvedOwner} machineId={machine.id} onChange={refresh} role={role} />
              <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Hành động</h3>
                <WithdrawModal
                  ownerId={resolvedOwner}
                  machineId={machine.id}
                  currentAnchor={machine.current_anchor}
                  onChange={refresh}
                  role={role}
                />
                <CloseCycleDialog
                  ownerId={resolvedOwner}
                  machineId={machine.id}
                  cyclePnl={cyclePnl}
                  onChange={refresh}
                  role={role}
                />
                {machine.status !== "closed" && (
                  <>
                    <div className="border-t border-dashed border-border my-1" />
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => handleCloseMachine(resolvedOwner, machine.id, closePreview)}
                    >
                      <PowerOff className="h-3.5 w-3.5" />
                      Đóng cỗ máy hoàn toàn
                    </Button>
                    <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
                      Số dư cuối ({usd.format(closeBalance)}) cộng lại vào{" "}
                      <strong>tổng vốn doanh chủ</strong>. Cỗ máy ngừng hoạt động.
                    </p>
                  </>
                )}
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
