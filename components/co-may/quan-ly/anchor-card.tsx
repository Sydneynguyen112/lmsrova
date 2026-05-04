"use client";

import { useState } from "react";
import { Anchor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { recordTransaction, updateMachine } from "@/lib/co-may/mock-data";
import type { Machine } from "@/lib/co-may/types";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function AnchorCard({
  machine,
  ownerId,
  readOnly,
  onChange,
}: {
  machine: Machine;
  ownerId: string;
  readOnly?: boolean;
  onChange: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(machine.current_anchor));
  const [error, setError] = useState<string | null>(null);

  function handleSet() {
    const newAnchor = Number(draft);
    if (!Number.isFinite(newAnchor) || newAnchor <= 0) {
      return setError("Anchor phải > 0");
    }
    if (newAnchor >= machine.current_anchor) {
      // Kỷ luật: anchor monotonic-decrease (chỉ tăng tự động qua closeCycle scale)
      return setError(`Anchor mới phải < ${usd.format(machine.current_anchor)}`);
    }
    setError(null);
    const delta = newAnchor - machine.current_anchor;
    updateMachine(ownerId, machine.id, { current_anchor: newAnchor });
    recordTransaction(ownerId, machine.id, {
      type: "anchor_change",
      amount: delta,
      note: `Hạ neo từ ${usd.format(machine.current_anchor)} xuống ${usd.format(newAnchor)}`,
    });
    setEditing(false);
    setDraft(String(newAnchor));
    onChange();
  }

  return (
    <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-card to-secondary/5 p-6 space-y-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Anchor className="h-3.5 w-3.5 text-primary" />
        <span className="uppercase tracking-wider font-semibold">Anchor hiện tại</span>
      </div>

      <div className="text-4xl md:text-5xl font-bold gold-gradient-text tabular-nums leading-none">
        {usd.format(machine.current_anchor)}
      </div>

      <p className="text-xs text-muted-foreground">
        Anchor là mức giá &quot;neo&quot; — không cho phép rút xuống thấp hơn để giữ kỷ luật.
      </p>

      {!readOnly && (
        <>
          {!editing ? (
            <Button
              variant="anchor"
              onClick={() => setEditing(true)}
              className="w-full"
            >
              <Anchor className="h-3.5 w-3.5" />
              Hạ neo xuống mức mới
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Anchor mới (USD)"
                  max={machine.current_anchor - 1}
                  autoFocus
                />
                <Button variant="anchor" size="sm" onClick={handleSet}>
                  Xác nhận
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditing(false);
                    setError(null);
                    setDraft(String(machine.current_anchor));
                  }}
                >
                  Huỷ
                </Button>
              </div>
              {error ? (
                <p className="text-[11px] text-destructive">{error}</p>
              ) : (
                <p className="text-[11px] text-muted-foreground/70">
                  Anchor chỉ giảm — tăng được tự động khi đóng chu kỳ Scale.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
