"use client";

import { useEffect, useState } from "react";
import { Pencil, Sparkles, Target, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

interface Props {
  milestones: number[];
  /** Mốc neo hiện tại (machine.current_anchor) — user-chosen, có thể khác milestone exact. */
  currentAnchor: number;
  balance: number;
  onEdit?: () => void;
  /** Mở WithdrawDialog với amount + target anchor. */
  onWithdraw?: (amount: number, toAnchor: number) => void;
  /** Hạ neo về newAnchor (= balance khi user chấp nhận lỗ). */
  onLowerAnchor?: (newAnchor: number) => void;
  readOnly?: boolean;
  /** Số lệnh trade — mỗi lệnh mới sẽ reset dismiss state để panel rút luôn xuất hiện. */
  tradeCount?: number;
}

export function MachineAnchorStrip({
  milestones,
  currentAnchor,
  balance,
  onEdit,
  onWithdraw,
  onLowerAnchor,
  readOnly,
  tradeCount,
}: Props) {
  // Dismissed-at cho overflow (lãi). Khi overflow tăng vượt → re-show.
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);
  // Dismissed cho underflow (lỗ) — track underflow value đã dismiss.
  const [dismissedLossAt, setDismissedLossAt] = useState<number | null>(null);

  const sorted = milestones && milestones.length > 0 ? [...milestones].sort((a, b) => b - a) : [];
  const hasMilestones = sorted.length > 0;

  // Index của milestone == currentAnchor (hoặc closest ≤ nếu user nhập custom)
  let currentIdx = -1;
  let prevMilestone: number | null = null;
  let nextLowerMilestone: number | null = null;
  if (hasMilestones) {
    currentIdx = sorted.findIndex((m) => m === currentAnchor);
    if (currentIdx === -1) currentIdx = sorted.findIndex((m) => m <= currentAnchor);
    if (currentIdx === -1) currentIdx = sorted.length - 1;
    // Mốc cũ = milestone CAO HƠN current liền kề
    prevMilestone = currentIdx > 0 ? sorted[currentIdx - 1] : null;
    // Mốc dưới = milestone THẤP HƠN current liền kề (dùng khi balance lọt giữa current và mốc dưới)
    nextLowerMilestone = currentIdx + 1 < sorted.length ? sorted[currentIdx + 1] : null;
  }

  const overflowCurrent = balance - currentAnchor;
  const overflowPrev = prevMilestone !== null ? balance - prevMilestone : 0;
  const underflow = currentAnchor - balance;
  // Có thể rút về mốc dưới nếu balance vẫn cao hơn nó
  const canWithdrawToLower = nextLowerMilestone !== null && balance > nextLowerMilestone;
  const withdrawToLowerAmount = canWithdrawToLower && nextLowerMilestone !== null ? balance - nextLowerMilestone : 0;

  const showPanel =
    !readOnly && overflowCurrent > 0 && (dismissedAt === null || overflowCurrent > dismissedAt);
  const showLossPanel =
    !readOnly && underflow > 0 && (dismissedLossAt === null || underflow > dismissedLossAt);

  useEffect(() => {
    if (dismissedAt !== null && overflowCurrent > dismissedAt) setDismissedAt(null);
  }, [overflowCurrent, dismissedAt]);

  useEffect(() => {
    if (dismissedLossAt !== null && underflow > dismissedLossAt) setDismissedLossAt(null);
  }, [underflow, dismissedLossAt]);

  // Mỗi lệnh trade mới → reset dismiss state để panel luôn xuất hiện
  useEffect(() => {
    setDismissedAt(null);
    setDismissedLossAt(null);
  }, [tradeCount]);

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

      {showLossPanel && !showPanel && (
        <div className="rounded-2xl border-2 border-dashed border-primary/50 bg-primary/8 p-4 space-y-3">
          <div className="text-center space-y-1.5">
            <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Số dư hiện tại dưới mốc neo
            </div>
            <div className="text-base md:text-lg italic text-foreground leading-snug">
              Có thể hạ neo xuống{" "}
              <span className="font-bold not-italic tabular-nums">
                {usd.format(canWithdrawToLower && nextLowerMilestone !== null ? nextLowerMilestone : balance)}
              </span>
            </div>
          </div>

          {canWithdrawToLower && nextLowerMilestone !== null ? (
            <>
              <button
                type="button"
                onClick={() => onWithdraw?.(withdrawToLowerAmount, nextLowerMilestone!)}
                className="w-full rounded-xl bg-[#3B6C4F] hover:bg-[#2F5840] text-white py-3 text-sm font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Rút {usd.format(withdrawToLowerAmount)} về mốc {usd.format(nextLowerMilestone)}
              </button>
              <button
                type="button"
                onClick={() => setDismissedLossAt(underflow)}
                className="w-full rounded-xl border-2 border-dashed border-border hover:border-foreground/40 hover:bg-muted/50 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors"
              >
                <Target className="h-3.5 w-3.5 inline mr-1.5" />
                Giữ nguyên — quay về mốc {usd.format(currentAnchor)}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onLowerAnchor?.(balance)}
              className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white py-3 text-sm font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
            >
              <TrendingDown className="h-4 w-4" />
              Hạ neo xuống {usd.format(balance)}
            </button>
          )}
        </div>
      )}

      {showPanel && (
        <div className="rounded-2xl border-2 border-[#3B6C4F]/40 bg-[#3B6C4F]/8 p-4 space-y-3">
          <div className="text-center space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Số dư hiện tại trên mốc neo
            </div>
            <div className="text-3xl md:text-4xl font-bold text-[#3B6C4F] dark:text-[#5C9C75] tabular-nums leading-none">
              +{usd.format(overflowCurrent)}
            </div>
          </div>

          {/* Khi balance vượt cả mốc trên — nâng neo lên mốc đó (rút ít hơn) */}
          {prevMilestone !== null && overflowPrev > 0 && (
            <button
              type="button"
              onClick={() => onWithdraw?.(overflowPrev, prevMilestone)}
              className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white py-3 text-sm font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Rút {usd.format(overflowPrev)} về mốc {usd.format(prevMilestone)} · NÂNG NEO ↑
            </button>
          )}

          {/* Rút phần dư về mốc hiện tại — luôn show khi có overflow */}
          <button
            type="button"
            onClick={() => onWithdraw?.(overflowCurrent, currentAnchor)}
            className="w-full rounded-xl bg-[#3B6C4F] hover:bg-[#2F5840] text-white py-3 text-sm font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Rút {usd.format(overflowCurrent)} về mốc {usd.format(currentAnchor)}
          </button>

          <button
            type="button"
            onClick={() => setDismissedAt(overflowCurrent)}
            className="w-full rounded-xl border-2 border-dashed border-border hover:border-foreground/40 hover:bg-muted/50 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors"
          >
            Tôi ổn
          </button>
        </div>
      )}

      {!hasMilestones && (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground italic">
          Cỗ máy này chưa có mốc neo cấu hình. Bấm <strong className="text-foreground">Chỉnh</strong> để thêm
          5 mốc neo theo công thức (M1 = vốn gốc, M2..5 = 80% mốc trước).
        </div>
      )}

      {hasMilestones && (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {sorted.map((m, i) => {
          const isCurrent = i === currentIdx;
          const isAbove = i < currentIdx; // Cao hơn current
          const isBelow = i > currentIdx; // Thấp hơn current

          // Trong vùng "có thể rút" (above current AND ≤ balance) → vượt mốc
          const isReachable = isAbove && balance >= m;
          const stateLabel = isCurrent
            ? "Hiện tại"
            : isReachable
              ? "Vượt mốc"
              : isAbove
                ? "Chưa đến"
                : "Đã chạm";

          return (
            <div
              key={i}
              className={cn(
                "rounded-xl border-2 p-3 text-center transition-colors",
                isCurrent
                  ? "border-[#3B6C4F] bg-[#3B6C4F]/15 text-foreground"
                  : isReachable
                    ? "border-[#3B6C4F]/50 bg-[#3B6C4F]/5 text-foreground"
                    : isBelow
                      ? "border-border bg-muted/30 text-foreground/70"
                      : "border-border/60 bg-card text-muted-foreground/70",
              )}
            >
              <div
                className={cn(
                  "text-[11px] font-bold uppercase tracking-widest mb-1",
                  isCurrent || isReachable ? "text-[#5C9C75]" : "text-muted-foreground",
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
      )}

      <div className="rounded-lg border-l-4 border-primary bg-primary/5 px-3 py-2">
        <p className="text-xs md:text-sm italic text-foreground/80 leading-relaxed">
          Vận hành ổn định, rút phần dư trên mốc neo.
        </p>
      </div>
    </section>
  );
}
