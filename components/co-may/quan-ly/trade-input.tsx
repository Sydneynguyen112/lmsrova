"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { recordTransaction } from "@/lib/co-may/mock-data";

export function TradeInput({
  ownerId,
  machineId,
  onChange,
}: {
  ownerId: string;
  machineId: string;
  onChange: () => void;
}) {
  const [type, setType] = useState<"trade_win" | "trade_loss">("trade_win");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const a = Number(amount);
    if (!Number.isFinite(a) || a <= 0) return setError("Số tiền phải > 0");
    setError(null);

    recordTransaction(ownerId, machineId, {
      type,
      amount: type === "trade_win" ? a : -a,
      note: note.trim() || null,
    });
    setAmount("");
    setNote("");
    onChange();
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Ghi nhận giao dịch</h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType("trade_win")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border-2 transition-colors",
              type === "trade_win"
                ? "border-[#3B6C4F] bg-[#3B6C4F]/10 text-[#3B6C4F] dark:text-[#5C9C75]"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Lệnh thắng
          </button>
          <button
            type="button"
            onClick={() => setType("trade_loss")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border-2 transition-colors",
              type === "trade_loss"
                ? "border-[#C03B3B] bg-[#C03B3B]/10 text-[#C03B3B] dark:text-[#E06464]"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            <TrendingDown className="h-3.5 w-3.5" />
            Lệnh thua
          </button>
        </div>

        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Số tiền (USD)"
          min={0.01}
          step="0.01"
        />

        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ghi chú (tuỳ chọn)..."
        />

        {error && <p className="text-xs text-destructive">{error}</p>}

        <Button type="submit" variant="default" className="w-full">
          Ghi nhận
        </Button>
      </form>
    </div>
  );
}
