"use client";

import { Wallet, TrendingUp, Target, TrendingDown, Clock, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KpiSnapshot } from "@/lib/co-may/types";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

interface KpiCard {
  label: string;
  icon: LucideIcon;
  value: string;
  hint?: string;
  highlight?: boolean;
  tone?: "neutral" | "profit" | "loss";
}

function buildCards(kpi: KpiSnapshot): KpiCard[] {
  const pnlTone: KpiCard["tone"] = kpi.pnl > 0 ? "profit" : kpi.pnl < 0 ? "loss" : "neutral";
  return [
    {
      label: "Tổng vốn",
      icon: Wallet,
      value: usd.format(kpi.total_capital),
      hint: `${kpi.trade_count} lệnh đã ghi`,
      highlight: true,
    },
    {
      label: "P&L",
      icon: TrendingUp,
      value: `${kpi.pnl >= 0 ? "+" : ""}${usd.format(kpi.pnl)}`,
      hint: "Trong chu kỳ hiện tại",
      highlight: true,
      tone: pnlTone,
    },
    {
      label: "Win rate",
      icon: Target,
      value: `${(kpi.win_rate * 100).toFixed(1)}%`,
      hint: kpi.trade_count > 0 ? `${Math.round(kpi.win_rate * kpi.trade_count)}/${kpi.trade_count}` : "—",
    },
    {
      label: "Drawdown",
      icon: TrendingDown,
      value: usd.format(kpi.drawdown),
      hint: "Đáy thấp nhất",
      tone: kpi.drawdown < 0 ? "loss" : "neutral",
    },
    {
      label: "Days active",
      icon: Clock,
      value: `${kpi.days_active}`,
      hint: kpi.days_active > 0 ? "ngày trong chu kỳ" : "Chưa khởi động",
    },
  ];
}

export function KpiGrid({ kpi }: { kpi: KpiSnapshot }) {
  const cards = buildCards(kpi);
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((c) => {
        const Icon = c.icon;
        const valueColor =
          c.tone === "profit"
            ? "text-[#3B6C4F] dark:text-[#5C9C75]"
            : c.tone === "loss"
              ? "text-[#C03B3B] dark:text-[#E06464]"
              : "text-foreground";
        return (
          <div
            key={c.label}
            className={cn(
              "rounded-2xl p-4 border bg-card transition-colors",
              c.highlight ? "border-primary/40 shadow-sm" : "border-border",
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg",
                  c.highlight ? "bg-primary/15" : "bg-muted",
                )}
              >
                <Icon size={16} className={c.highlight ? "text-primary" : "text-muted-foreground"} />
              </div>
              {c.highlight && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/70">
                  KPI
                </span>
              )}
            </div>
            <div className={cn("text-xl md:text-2xl font-bold leading-tight", valueColor)}>
              {c.value}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{c.label}</div>
            {c.hint && <div className="text-[11px] text-muted-foreground/70 mt-1">{c.hint}</div>}
          </div>
        );
      })}
    </div>
  );
}
