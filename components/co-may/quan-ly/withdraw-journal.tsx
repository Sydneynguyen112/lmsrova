"use client";

import { useState } from "react";
import { Plus, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { recordTransaction } from "@/lib/co-may/mock-data";
import { fireworks, FIREWORK_DURATION } from "@/lib/co-may/celebrate";
import type { MachineTransaction } from "@/lib/co-may/types";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

interface Props {
  ownerId: string;
  machineId: string;
  tx: MachineTransaction[];
  currentAnchor: number;
  onChange: () => void;
  readOnly?: boolean;
}

export function WithdrawJournal({
  ownerId,
  machineId,
  tx,
  currentAnchor,
  onChange,
  readOnly,
}: Props) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [celebrating, setCelebrating] = useState<{ amount: number } | null>(null);

  const withdraws = tx
    .filter((t) => t.type === "withdraw")
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    const a = Number(amount);
    if (!Number.isFinite(a) || a <= 0) return setError("Số tiền phải > 0");
    if (a > currentAnchor)
      return setError(`Vượt anchor — chỉ rút tối đa ${usd.format(currentAnchor)}`);
    setSubmitting(true);
    try {
      recordTransaction(ownerId, machineId, {
        type: "withdraw",
        amount: -a,
        note: note.trim() || `Rút ${usd.format(a)}`,
      });
    } catch (err) {
      setSubmitting(false);
      return setError(err instanceof Error ? err.message : "Không rút được");
    }
    setAmount("");
    setNote("");
    setError(null);
    setOpen(false);
    onChange();
    setCelebrating({ amount: a });
    fireworks();
    setTimeout(() => {
      setCelebrating(null);
      setSubmitting(false);
    }, FIREWORK_DURATION);
  }

  return (
    <>
      <section className="rounded-2xl border border-border bg-card overflow-hidden">
        <header className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <h3 className="text-base md:text-lg font-semibold text-foreground">Nhật ký rút tiền</h3>
          {!readOnly && !open && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-primary transition-colors"
            >
              <Plus className="h-3 w-3" />
              Ghi nhận rút
            </button>
          )}
        </header>

        {open && (
          <form
            onSubmit={handleSubmit}
            className="border-b border-border p-4 grid grid-cols-1 sm:grid-cols-[140px_1fr_auto_auto] gap-3 items-end bg-muted/20"
          >
            <Field label="Số tiền ($)">
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100"
                className="h-10"
                autoFocus
              />
            </Field>
            <Field label="Ghi chú (tuỳ chọn)">
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Rút khoá lợi nhuận..."
                className="h-10"
              />
            </Field>
            <Button type="submit" variant="anchor" size="default" disabled={submitting}>
              <Sparkles className="h-3.5 w-3.5" />
              {submitting ? "..." : "Rút"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="default"
              onClick={() => {
                setOpen(false);
                setAmount("");
                setNote("");
                setError(null);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
            {error && <p className="col-span-full text-xs text-destructive">{error}</p>}
          </form>
        )}

        <ul className="divide-y divide-border/60">
          {withdraws.length === 0 ? (
            <li className="px-5 py-8 text-center text-sm italic text-muted-foreground">
              Chưa có lần rút nào. Bấm &quot;Ghi nhận rút&quot; để bắt đầu.
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
                <span className="text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">
                  {formatHM(w.created_at)} {formatDmy(w.created_at)}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      <AnimatePresence>
        {celebrating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none px-4"
          >
            <div className="bg-card border-2 border-primary rounded-3xl px-8 py-6 shadow-2xl gold-glow text-center space-y-2 max-w-sm">
              <div className="flex justify-center">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold gold-gradient-text">
                Rút thành công {usd.format(celebrating.amount)}
              </h3>
              <p className="text-sm text-muted-foreground">
                Kỷ luật được tưởng thưởng. Tiếp tục giữ vững nhịp.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
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

void cn; // imported but maybe unused — silence linter if so
