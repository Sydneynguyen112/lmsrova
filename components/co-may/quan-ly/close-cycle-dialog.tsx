"use client";

import { useState } from "react";
import { RotateCcw, TrendingUp, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { closeCycleMock } from "@/lib/co-may/mock-data";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function CloseCycleDialog({
  ownerId,
  machineId,
  cyclePnl,
  onChange,
}: {
  ownerId: string;
  machineId: string;
  cyclePnl: number;
  onChange: () => void;
}) {
  const [open, setOpen] = useState(false);

  function handle(decision: "reset" | "scale") {
    closeCycleMock(ownerId, machineId, decision);
    setOpen(false);
    onChange();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" className="w-full">
            <RefreshCw className="h-3.5 w-3.5" />
            Đóng chu kỳ
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Đóng chu kỳ giao dịch</DialogTitle>
          <DialogDescription>
            P&L chu kỳ này:{" "}
            <span
              className={
                cyclePnl > 0
                  ? "font-semibold text-[#3B6C4F] dark:text-[#5C9C75]"
                  : cyclePnl < 0
                    ? "font-semibold text-[#C03B3B] dark:text-[#E06464]"
                    : "font-semibold"
              }
            >
              {cyclePnl >= 0 ? "+" : ""}
              {usd.format(cyclePnl)}
            </span>
            . Chọn quyết định cho chu kỳ tiếp theo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <button
            type="button"
            onClick={() => handle("reset")}
            className="w-full text-left rounded-xl border-2 border-border hover:border-foreground transition-colors p-4 group"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <RotateCcw className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
              <span className="font-semibold text-foreground">Reset</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Bắt đầu chu kỳ mới với cùng vốn + anchor. Days active đếm lại từ 0.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handle("scale")}
            disabled={cyclePnl <= 0}
            className="w-full text-left rounded-xl border-2 border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary transition-colors p-4 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-primary/40"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground">
                Scale {cyclePnl > 0 && `(+${usd.format(cyclePnl)})`}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Tăng vốn + anchor theo P&L. Chỉ khả dụng khi chu kỳ có lợi nhuận.
            </p>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
