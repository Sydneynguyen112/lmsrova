"use client";

import { useState } from "react";
import { Pencil, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

interface Props {
  milestones: number[];
  balance: number;
  onEdit?: () => void;
  /** Callback khi user bấm "Rút $X về mốc": parent mở WithdrawDialog. */
  onWithdraw?: (amount: number, toAnchor: number) => void;
  readOnly?: boolean;
}

export function MachineAnchorStrip({ milestones, balance, onEdit, onWithdraw, readOnly }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (!milestones || milestones.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Chưa có mốc neo cho cỗ máy này.
      </div>
    );
  }
  const sorted = [...milestones].sort((a, b) => b - a);

  // Mốc neo hiện tại = mốc cao nhất ≤ balance. Nếu balance < tất cả → currentIdx = sorted.length-1.
  let currentIdx = sorted.findIndex((m) => m <= balance);
  if (currentIdx === -1) currentIdx = sorted.length - 1;
  const currentMilestone = sorted[currentIdx];
  const overflow = balance - currentMilestone;
  const showOverflowPanel = !readOnly && !dismissed && overflow > 0;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <header className="flex items-center justify-between">
        <h3 className="text-lg md:text-xl font-bold text-foreground">Mốc neo</h3>
        {!readOnly && onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Pencil className="h-3 w-3" />
            Chỉnh
          </button>
        )}
      </header>

      {showOverflowPanel && (
        <div className="rounded-2xl border-2 border-[#3B6C4F]/40 bg-[#3B6C4F]/8 p-4 space-y-3">
          <div className="text-center space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Số dư hiện tại trên mốc neo
            </div>
            <div className="text-3xl md:text-4xl font-bold text-[#3B6C4F] dark:text-[#5C9C75] tabular-nums leading-none">
              +{usd.format(overflow)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onWithdraw?.(overflow, currentMilestone)}
            className="w-full rounded-xl bg-[#3B6C4F] hover:bg-[#2F5840] text-white py-3 text-sm font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Rút {usd.format(overflow)} về mốc {usd.format(currentMilestone)}
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="w-full rounded-xl border-2 border-dashed border-border hover:border-foreground/40 hover:bg-muted/50 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors"
          >
            Tôi ổn
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {sorted.map((m, i) => {
          const isCurrent = i === currentIdx;
          const isTouched = i > currentIdx;
          const stateLabel = isCurrent ? "Hiện tại" : isTouched ? "Đã chạm" : "Chưa đến";
          return (
            <div
              key={i}
              className={cn(
                "rounded-xl border-2 p-3 text-center transition-colors",
                isCurrent
                  ? "border-[#3B6C4F] bg-[#3B6C4F]/15 text-foreground"
                  : isTouched
                    ? "border-border bg-muted/30 text-foreground/70"
                    : "border-border/60 bg-card text-muted-foreground/70",
              )}
            >
              <div
                className={cn(
                  "text-[11px] font-bold uppercase tracking-widest mb-1",
                  isCurrent ? "text-[#5C9C75]" : "text-muted-foreground",
                )}
              >
                M{i + 1}
              </div>
              <div className="text-lg md:text-xl font-bold tabular-nums">{usd.format(m)}</div>
              <div className="text-[10px] uppercase tracking-widest mt-1 opacity-70 font-semibold">
                {stateLabel}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border-l-4 border-primary bg-primary/5 px-3 py-2">
        <p className="text-xs md:text-sm italic text-foreground/80 leading-relaxed">
          Vận hành ổn định, rút phần dư trên mốc neo.
        </p>
      </div>
    </section>
  );
}
