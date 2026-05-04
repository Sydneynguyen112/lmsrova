"use client";

import Link from "next/link";
import { Pause, Play, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Machine, MachineTransaction } from "@/lib/co-may/types";

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
}: {
  machine: Machine;
  tx: MachineTransaction[];
  detailHref: string;
}) {
  const cycleStart = machine.cycle_started_at ?? machine.created_at;
  const cycleStartTs = new Date(cycleStart).getTime();
  const cycleTx = tx.filter((t) => new Date(t.created_at).getTime() >= cycleStartTs);
  const trades = cycleTx.filter((t) => t.type === "trade_win" || t.type === "trade_loss");
  const pnl = trades.reduce((s, t) => s + t.amount, 0);
  const days = Math.max(0, Math.floor((Date.now() - cycleStartTs) / DAY_MS));
  const isActive = machine.status === "active";

  return (
    <Link
      href={detailHref}
      className="group block rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all p-5 space-y-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {machine.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Vốn ban đầu: {usd.format(machine.capital)}
          </p>
        </div>
        <Badge variant={isActive ? "default" : "secondary"} className="gap-1 shrink-0">
          {isActive ? <Play className="h-2.5 w-2.5" /> : <Pause className="h-2.5 w-2.5" />}
          {isActive ? "Active" : "Paused"}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Anchor</div>
          <div className="text-sm font-semibold text-primary mt-0.5 tabular-nums">
            {usd.format(machine.current_anchor)}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70">P&L</div>
          <div
            className={cn(
              "text-sm font-semibold mt-0.5 tabular-nums",
              pnl > 0
                ? "text-[#3B6C4F] dark:text-[#5C9C75]"
                : pnl < 0
                  ? "text-[#C03B3B] dark:text-[#E06464]"
                  : "text-muted-foreground",
            )}
          >
            {pnl > 0 ? "+" : ""}
            {usd.format(pnl)}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Days</div>
          <div className="text-sm font-semibold text-foreground mt-0.5 tabular-nums">{days}</div>
        </div>
      </div>

      <div className="flex items-center justify-end text-xs text-muted-foreground group-hover:text-primary transition-colors">
        Xem chi tiết
        <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
      </div>
    </Link>
  );
}
