"use client";

import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

interface Props {
  milestones: number[]; // sorted desc — M1 highest
  balance: number;
  onEdit?: () => void;
  readOnly?: boolean;
}

export function MachineAnchorStrip({ milestones, balance, onEdit, readOnly }: Props) {
  if (!milestones || milestones.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Chưa có mốc neo cho cỗ máy này.
      </div>
    );
  }
  const sorted = [...milestones].sort((a, b) => b - a);
  // "Hiện tại" = mốc cao nhất ≤ balance. Còn lại "đã chạm" nếu < hiện tại, "chưa đến" nếu > balance.
  const currentIdx = sorted.findIndex((m) => m <= balance);

  return (
    <section className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <header className="flex items-center justify-between">
        <h3 className="text-base md:text-lg font-semibold text-foreground">Mốc neo</h3>
        {!readOnly && onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Pencil className="h-3 w-3" />
            Chỉnh
          </button>
        )}
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {sorted.map((m, i) => {
          const isCurrent = i === currentIdx;
          const isTouched = currentIdx === -1 ? false : i > currentIdx;
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
                  "text-[11px] font-semibold uppercase tracking-widest mb-1",
                  isCurrent ? "text-[#5C9C75]" : "text-muted-foreground",
                )}
              >
                M{i + 1}
              </div>
              <div className="text-lg md:text-xl font-bold tabular-nums">{usd.format(m)}</div>
              <div className="text-[10px] uppercase tracking-widest mt-1 opacity-70">{stateLabel}</div>
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
