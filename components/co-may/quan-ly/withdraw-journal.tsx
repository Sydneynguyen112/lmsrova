"use client";

import { Plus } from "lucide-react";
import type { MachineTransaction } from "@/lib/co-may/types";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

interface Props {
  tx: MachineTransaction[];
  /** Mốc neo hiện tại — dùng để compute overflow + disable button. */
  currentAnchor: number;
  balance: number;
  onRequestWithdraw: (amount: number, toAnchor: number) => void;
  readOnly?: boolean;
}

export function WithdrawJournal({
  tx,
  currentAnchor,
  balance,
  onRequestWithdraw,
  readOnly,
}: Props) {
  const overflow = Math.max(0, balance - currentAnchor);
  const canWithdraw = !readOnly && overflow > 0;

  const withdraws = tx
    .filter((t) => t.type === "withdraw")
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <section className="rounded-2xl border border-border bg-card overflow-hidden">
      <header className="px-5 py-3.5 border-b border-border flex items-center justify-between">
        <h3 className="text-lg md:text-xl font-bold text-foreground">Nhật ký rút tiền</h3>
        {!readOnly && (
          <button
            type="button"
            onClick={() => canWithdraw && onRequestWithdraw(overflow, currentAnchor)}
            disabled={!canWithdraw}
            title={
              canWithdraw
                ? `Rút ${usd.format(overflow)} về mốc ${usd.format(currentAnchor)}`
                : "Chưa có phần dư trên mốc neo"
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="h-3 w-3" />
            Ghi nhận rút
          </button>
        )}
      </header>

      <ul className="divide-y divide-border/60">
        {withdraws.length === 0 ? (
          <li className="px-5 py-8 text-center text-sm italic text-muted-foreground">
            Chưa có lần rút nào. Bấm &quot;Ghi nhận rút&quot; khi balance vượt mốc neo.
          </li>
        ) : (
          withdraws.map((w) => (
            <li
              key={w.id}
              className="px-5 py-3.5 grid grid-cols-[1fr_auto] items-baseline gap-3"
            >
              <div className="min-w-0">
                <div className="font-bold text-foreground tabular-nums text-base">
                  {usd.format(-w.amount)}
                </div>
                {w.note && (
                  <div className="text-sm italic text-muted-foreground/80 mt-0.5 truncate">
                    {w.note}
                  </div>
                )}
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground tabular-nums whitespace-nowrap">
                {formatHM(w.created_at)} {formatDmy(w.created_at)}
              </span>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

function formatHM(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function formatDmy(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}
function pad(n: number) {
  return n.toString().padStart(2, "0");
}
