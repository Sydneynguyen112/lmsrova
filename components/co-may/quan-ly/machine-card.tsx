"use client";

import Link from "next/link";
import { Pause, Play, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Machine, MachineTransaction } from "@/lib/co-may/types";
import { isSeniorMode, seniorCx } from "@/lib/co-may/senior-ui";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const DAY_MS = 86400_000;

export function MachineCard({
  machine,
  tx,
  detailHref,
  role,
}: {
  machine: Machine;
  tx: MachineTransaction[];
  detailHref: string;
  role?: string | null;
}) {
  const senior = isSeniorMode(role);
  const cycleStart = machine.cycle_started_at ?? machine.created_at;
  const cycleStartTs = new Date(cycleStart).getTime();
  const cycleTx = tx.filter((t) => new Date(t.created_at).getTime() >= cycleStartTs);
  const trades = cycleTx.filter((t) => t.type === "trade_win" || t.type === "trade_loss");
  const pnl = trades.reduce((s, t) => s + t.amount, 0);
  const days = Math.max(0, Math.floor((Date.now() - cycleStartTs) / DAY_MS));
  const isActive = machine.status === "active";

  const labelCls = senior
    ? "text-xs uppercase tracking-wider text-muted-foreground"
    : "text-[10px] uppercase tracking-wider text-muted-foreground/70";
  const metricCls = senior
    ? "text-base md:text-lg font-semibold mt-1 tabular-nums"
    : "text-sm font-semibold mt-0.5 tabular-nums";

  return (
    <Link
      href={detailHref}
      className={cn(
        "group block rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all space-y-4",
        senior ? "p-6" : "p-5",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3
            className={cn(
              "font-semibold text-foreground group-hover:text-primary transition-colors",
              senior ? "text-lg leading-snug" : "truncate",
            )}
          >
            {machine.name}
          </h3>
          <p className={cn("mt-1", senior ? "text-sm text-muted-foreground" : "text-xs text-muted-foreground")}>
            Vốn ban đầu: {usd.format(machine.capital)}
          </p>
        </div>
        <Badge variant={isActive ? "default" : "secondary"} className="gap-1 shrink-0">
          {isActive ? <Play className="h-2.5 w-2.5" /> : <Pause className="h-2.5 w-2.5" />}
          {isActive ? "Active" : "Paused"}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
        <div>
          <div className={labelCls}>Anchor</div>
          <div className={cn(metricCls, "text-primary")}>{usd.format(machine.current_anchor)}</div>
        </div>
        <div>
          <div className={labelCls}>P&L</div>
          <div
            className={cn(
              metricCls,
              pnl > 0
                ? "text-[#3B6C4F] dark:text-[#5C9C75]"
                : pnl < 0
                  ? "text-foreground"
                  : "text-muted-foreground",
            )}
          >
            {pnl > 0 ? "+" : ""}
            {usd.format(pnl)}
          </div>
        </div>
        <div>
          <div className={labelCls}>Days</div>
          <div className={cn(metricCls, "text-foreground")}>{days}</div>
        </div>
      </div>

      <div
        className={cn(
          "flex items-center justify-end text-muted-foreground group-hover:text-primary transition-colors",
          senior ? "text-sm font-medium" : "text-xs",
        )}
      >
        Xem chi tiết
        <ChevronRight className={senior ? "h-4 w-4 ml-1" : "h-3.5 w-3.5 ml-0.5"} />
      </div>
    </Link>
  );
}
