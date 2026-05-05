"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  PowerOff,
  Wallet,
  TrendingUp,
  Coins,
  Activity,
} from "lucide-react";
import { useCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  closeMachine,
  getMachineById,
  getTxByMachine,
  getUserScope,
} from "@/lib/co-may/mock-data";
import { adjustTotalCapital } from "@/lib/co-may/setup-store";
import { cn } from "@/lib/utils";
import type { Machine, MachineTransaction } from "@/lib/co-may/types";
import { CloseCycleDialog } from "./close-cycle-dialog";
import { MachineAnchorStrip } from "./machine-anchor-strip";
import { MachineBalanceBreakdown } from "./machine-balance-breakdown";
import { MachineEquityCurve } from "./machine-equity-curve";
import { TradeJournal } from "./trade-journal";
import { WithdrawJournal } from "./withdraw-journal";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const DAY_MS = 86400_000;

type RoleSlug = "student" | "mentor" | "admin";

const SIGNAL_LABEL: Record<string, string> = {
  self: "Tự sản xuất",
  imported: "Nhập tín hiệu",
  both: "Cả hai",
};

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

  const resolved = useMemo<{
    machine: Machine;
    tx: MachineTransaction[];
    resolvedOwner: string;
  } | null>(() => {
    if (!user) return null;
    const scope = getUserScope(user.role ?? role, user.id);
    const candidates = ownerId && scope.includes(ownerId) ? [ownerId] : [user.id, ...scope];
    for (const id of candidates) {
      const m = getMachineById(id, machineId);
      if (m) return { machine: m, tx: getTxByMachine(id, machineId), resolvedOwner: id };
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, role, machineId, ownerId, tick]);

  if (!user) return <div className="text-sm text-muted-foreground">Đang tải...</div>;

  if (!resolved) {
    return (
      <div className="space-y-4">
        <Link
          href={`/${role}/co-may/quan-ly`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Quay lại danh sách
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
  const cycleTrades = cycleTx.filter((t) => t.type === "trade_win" || t.type === "trade_loss");
  const cyclePnl = cycleTrades.reduce((s, t) => s + t.amount, 0);

  // Stats over ALL tx of this machine (not cycle-bounded)
  const allTrades = tx.filter((t) => t.type === "trade_win" || t.type === "trade_loss");
  const totalPnl = allTrades.reduce((s, t) => s + t.amount, 0);
  const allWithdraws = tx.filter((t) => t.type === "withdraw");
  const withdrawnAbs = -allWithdraws.reduce((s, t) => s + t.amount, 0); // positive
  const balance = machine.capital + totalPnl - withdrawnAbs;
  const wins = allTrades.filter((t) => t.type === "trade_win").length;
  const wr = allTrades.length > 0 ? Math.round((wins / allTrades.length) * 100) : 0;
  const days = Math.max(1, Math.floor((Date.now() - cycleStartTs) / DAY_MS));

  const closePreview = {
    capital: machine.capital,
    balance,
    delta: balance - machine.capital,
  };

  function handleCloseMachine() {
    if (typeof window === "undefined") return;
    const msg =
      `Xoá / đóng cỗ máy này?\n\n` +
      `• Vốn ban đầu: ${usd.format(closePreview.capital)}\n` +
      `• Số dư cuối: ${usd.format(closePreview.balance)}\n` +
      `• Chênh lệch: ${closePreview.delta >= 0 ? "+" : ""}${usd.format(closePreview.delta)}\n\n` +
      `Số dư cuối sẽ được cộng vào tổng vốn doanh chủ. Hành động không thể hoàn tác.`;
    if (!window.confirm(msg)) return;
    const result = closeMachine(resolvedOwner, machineId);
    adjustTotalCapital(resolvedOwner, result.delta);
    router.push(`/${role}/co-may/quan-ly`);
  }

  const readOnly = role !== "student" || resolvedOwner !== user.id;

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="space-y-3">
        <Link
          href={`/${role}/co-may/quan-ly`}
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Cỗ máy / {machine.name}
        </Link>

        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground gold-gradient-text">
                {machine.name}
              </h1>
              <span className="rounded-md bg-foreground text-background px-2.5 py-1 text-xs font-semibold tabular-nums uppercase tracking-widest">
                {days} ngày
              </span>
            </div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">
              {machine.method ?? "—"} · {SIGNAL_LABEL[machine.signal_source ?? "self"] ?? "—"} · {allTrades.length} lệnh
            </p>
          </div>

          {!readOnly && machine.status !== "closed" && (
            <div className="flex flex-wrap items-center gap-2">
              <CloseCycleDialog
                ownerId={resolvedOwner}
                machineId={machineId}
                cyclePnl={cyclePnl}
                onChange={refresh}
                role={role}
              />
              <Button
                variant="outline"
                size="default"
                onClick={handleCloseMachine}
                className="border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                <PowerOff className="h-3.5 w-3.5" />
                Xoá cỗ máy
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* 4 KPI top */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-2xl overflow-hidden border border-border">
        <KpiTile
          dark
          label="Đã rút"
          value={usd.format(withdrawnAbs)}
          hint="Tiền thật về tài khoản"
          icon={Wallet}
        />
        <KpiTile label="Số dư hiện tại" value={usd.format(balance)} icon={Coins} />
        <KpiTile label="Vốn gốc" value={usd.format(machine.capital)} icon={Coins} />
        <KpiTile
          label="PNL"
          value={`${totalPnl >= 0 ? "+" : ""}${usd.format(totalPnl)}`}
          hint={`${allTrades.length} lệnh · WR ${wr}%`}
          icon={TrendingUp}
          tone={totalPnl > 0 ? "profit" : totalPnl < 0 ? "loss" : "neutral"}
        />
      </div>

      {/* Anchor strip */}
      <MachineAnchorStrip
        milestones={machine.anchor_milestones ?? []}
        balance={balance}
        readOnly={readOnly}
      />

      {/* Equity curve + Balance breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <MachineEquityCurve
            capital={machine.capital}
            tx={tx}
            milestones={machine.anchor_milestones}
          />
        </div>
        <MachineBalanceBreakdown
          capital={machine.capital}
          totalPnl={totalPnl}
          totalWithdrawn={withdrawnAbs}
        />
      </div>

      {/* Trade journal */}
      <TradeJournal
        ownerId={resolvedOwner}
        machineId={machineId}
        tx={tx}
        onChange={refresh}
        readOnly={readOnly}
      />

      {/* Withdraw journal */}
      <WithdrawJournal
        ownerId={resolvedOwner}
        machineId={machineId}
        tx={tx}
        currentAnchor={machine.current_anchor}
        onChange={refresh}
        readOnly={readOnly}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────

function KpiTile({
  label,
  value,
  hint,
  icon: Icon,
  dark,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: typeof Wallet;
  dark?: boolean;
  tone?: "profit" | "loss" | "neutral";
}) {
  const valueColor =
    tone === "profit"
      ? "text-[#5C9C75]"
      : tone === "loss"
        ? "text-[#E06464]"
        : dark
          ? "text-primary"
          : "text-foreground";
  return (
    <div
      className={cn(
        "p-4 md:p-5 flex flex-col gap-2",
        dark ? "bg-foreground text-background" : "bg-card",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1.5 uppercase tracking-widest font-medium text-xs",
          dark ? "text-background/60" : "text-muted-foreground",
        )}
      >
        <Icon size={12} />
        {label}
      </div>
      <div className={cn("text-2xl md:text-3xl font-bold tabular-nums leading-none", valueColor)}>
        {value}
      </div>
      {hint && (
        <div className={cn("text-xs", dark ? "text-background/50" : "text-muted-foreground")}>{hint}</div>
      )}
    </div>
  );
}

// Suppress unused
void Activity;
