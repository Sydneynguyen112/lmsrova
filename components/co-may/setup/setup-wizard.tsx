"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Coins, Check, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  QUICK_CAPITAL_CHIPS,
  saveSetup,
  STRATEGIES,
  type StrategyId,
} from "@/lib/co-may/setup-store";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const TOTAL_STEPS = 3;

export function SetupWizard({ userId, role }: { userId: string; role: string }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [capital, setCapital] = useState<number>(1000);
  const [strategy, setStrategy] = useState<StrategyId>("concentrated");
  const [allocations, setAllocations] = useState<{ name: string; capital: number }[]>([]);

  const machineCount = useMemo(
    () => STRATEGIES.find((s) => s.id === strategy)?.machineCount ?? 0,
    [strategy],
  );

  // Khi user vào step 3 (sau khi chọn strategy), khởi tạo allocations mặc định.
  function handleStrategyNext() {
    if (strategy === "later") {
      // Skip step 3 → save với 0 machines
      saveSetup(userId, { totalCapital: capital, strategy, allocations: [] });
      router.replace(`/${role}/co-may/tong-quan`);
      return;
    }
    const tpl = defaultAllocations(strategy, capital);
    setAllocations(tpl);
    setStep(3);
  }

  function handleFinish() {
    const sum = allocations.reduce((s, a) => s + a.capital, 0);
    if (sum !== capital) {
      // Cho phép sai khác ±1 do làm tròn
      if (Math.abs(sum - capital) > 1) {
        // eslint-disable-next-line no-alert
        alert(
          `Tổng phân bổ (${usd.format(sum)}) phải bằng tổng vốn (${usd.format(capital)}).`,
        );
        return;
      }
    }
    saveSetup(userId, { totalCapital: capital, strategy, allocations });
    router.replace(`/${role}/co-may/tong-quan`);
  }

  return (
    <div className="max-w-3xl mx-auto py-8 md:py-12 px-4 space-y-6">
      <StepIndicator current={step} total={TOTAL_STEPS} />

      <div className="rounded-3xl border border-border bg-card p-6 md:p-10 space-y-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Bước {String(step).padStart(2, "0")} / 0{TOTAL_STEPS}
          <span className="text-muted-foreground/40">·</span>
          <span className="text-primary">{stepLabel(step)}</span>
        </div>

        {step === 1 && (
          <StepCapital capital={capital} onChange={setCapital} />
        )}
        {step === 2 && (
          <StepStrategy strategy={strategy} onChange={setStrategy} />
        )}
        {step === 3 && (
          <StepAllocation
            allocations={allocations}
            onChange={setAllocations}
            total={capital}
            machineCount={machineCount}
          />
        )}

        <div className="flex items-center justify-between gap-3 pt-4 border-t border-dashed border-border">
          {step > 1 ? (
            <Button
              variant="outline"
              size="lg"
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
          ) : (
            <span />
          )}

          {step === 1 && (
            <Button variant="anchor" size="lg" onClick={() => setStep(2)} disabled={capital <= 0}>
              Tiếp: Chiến lược phân bổ
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          {step === 2 && (
            <Button variant="anchor" size="lg" onClick={handleStrategyNext}>
              {strategy === "later" ? "Hoàn tất" : "Tiếp: Phân bổ chi tiết"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          {step === 3 && (
            <Button variant="anchor" size="lg" onClick={handleFinish}>
              <Check className="h-4 w-4" />
              Khởi tạo cỗ máy
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function defaultAllocations(strategy: StrategyId, total: number): { name: string; capital: number }[] {
  switch (strategy) {
    case "concentrated":
      return [{ name: "Cỗ máy chính", capital: total }];
    case "balanced":
      return [
        { name: "Cỗ máy chính", capital: Math.round(total * 0.6) },
        { name: "Cỗ máy phụ", capital: total - Math.round(total * 0.6) },
      ];
    case "diversified": {
      const a = Math.round(total * 0.5);
      const b = Math.round(total * 0.3);
      const c = total - a - b;
      return [
        { name: "Cỗ máy chính", capital: a },
        { name: "Cỗ máy phụ", capital: b },
        { name: "Cỗ máy thử nghiệm", capital: c },
      ];
    }
    default:
      return [];
  }
}

function stepLabel(step: number): string {
  if (step === 1) return "Vốn doanh chủ";
  if (step === 2) return "Chiến lược phân bổ";
  return "Phân bổ chi tiết";
}

// ─────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => {
        const idx = i + 1;
        const state = idx < current ? "done" : idx === current ? "active" : "pending";
        return (
          <div
            key={idx}
            className={cn(
              "h-1.5 rounded-full transition-all",
              state === "active" ? "w-12 bg-primary" : "w-8",
              state === "done" && "bg-primary/60",
              state === "pending" && "bg-border",
            )}
          />
        );
      })}
    </div>
  );
}

function StepCapital({
  capital,
  onChange,
}: {
  capital: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          Bạn có <span className="text-primary">bao nhiêu</span> vốn?
        </h2>
        <p className="text-sm md:text-base text-muted-foreground mt-2 leading-relaxed">
          Đây là tổng số tiền bạn dành riêng cho trading. Không phải tiền sinh hoạt,
          không phải tiền vay. Nếu mất hết, cuộc sống vẫn tiếp tục.
        </p>
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center">
          Tổng vốn ($)
        </label>
        <Input
          type="number"
          value={capital}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          min={1}
          className="h-16 text-3xl font-bold text-center tabular-nums"
        />
        <div className="flex flex-wrap items-center justify-center gap-2">
          {QUICK_CAPITAL_CHIPS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              className={cn(
                "rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors",
                capital === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-foreground hover:bg-muted",
              )}
            >
              {usd.format(c)}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border-l-4 border-primary bg-primary/5 px-4 py-3">
        <p className="text-sm md:text-base italic text-foreground/80 leading-relaxed">
          <strong>Nguyên tắc doanh chủ:</strong> vốn trading phải là tiền bạn có thể
          mất 100% mà vẫn ngủ ngon.
        </p>
      </div>
    </div>
  );
}

function StepStrategy({
  strategy,
  onChange,
}: {
  strategy: StrategyId;
  onChange: (s: StrategyId) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          Một cỗ máy hay <span className="text-primary">nhiều cỗ máy</span>?
        </h2>
        <p className="text-sm md:text-base text-muted-foreground mt-2 leading-relaxed">
          Doanh chủ kinh nghiệm phân bổ vốn ra nhiều cỗ máy để giảm rủi ro. Người mới
          nên bắt đầu với một cỗ máy.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {STRATEGIES.map((s) => {
          const active = strategy === s.id;
          const isLater = s.id === "later";
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onChange(s.id)}
              className={cn(
                "text-left rounded-2xl border-2 p-5 transition-all space-y-2",
                active
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border bg-card hover:border-foreground/40",
              )}
            >
              <div className="flex items-center gap-2">
                {isLater ? (
                  <Ban className="h-6 w-6 text-muted-foreground" />
                ) : (
                  <span className="text-2xl font-bold text-primary">{s.number}</span>
                )}
              </div>
              <h3 className="font-semibold text-foreground text-lg">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border-l-4 border-primary bg-primary/5 px-4 py-3">
        <p className="text-sm md:text-base italic text-foreground/80 leading-relaxed">
          <strong>Nguyên tắc Kanban:</strong> đừng mở quá nhiều cỗ máy ngay từ đầu —
          bạn sẽ không quản trị được cái nào tử tế.
        </p>
      </div>
    </div>
  );
}

function StepAllocation({
  allocations,
  onChange,
  total,
  machineCount,
}: {
  allocations: { name: string; capital: number }[];
  onChange: (a: { name: string; capital: number }[]) => void;
  total: number;
  machineCount: number;
}) {
  const sum = allocations.reduce((s, a) => s + a.capital, 0);
  const remain = total - sum;

  function update(idx: number, patch: Partial<{ name: string; capital: number }>) {
    const next = allocations.map((a, i) => (i === idx ? { ...a, ...patch } : a));
    onChange(next);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          Phân bổ <span className="text-primary">chi tiết</span>
        </h2>
        <p className="text-sm md:text-base text-muted-foreground mt-2 leading-relaxed">
          Đặt tên + vốn cho {machineCount} cỗ máy. Tổng phải bằng {usd.format(total)}.
        </p>
      </div>

      <div className="space-y-3">
        {allocations.map((a, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Coins className="h-3.5 w-3.5 text-primary" />
              Cỗ máy #{i + 1}
            </div>
            <Input
              value={a.name}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder="Tên cỗ máy"
              className="h-11 text-base"
            />
            <Input
              type="number"
              value={a.capital}
              onChange={(e) => update(i, { capital: Number(e.target.value) || 0 })}
              placeholder="Vốn ($)"
              className="h-11 text-base"
            />
          </div>
        ))}
      </div>

      <div
        className={cn(
          "rounded-xl border px-4 py-3 flex items-center justify-between text-sm md:text-base",
          remain === 0
            ? "border-primary/40 bg-primary/5 text-primary"
            : Math.abs(remain) <= 1
              ? "border-primary/30 bg-primary/5 text-primary"
              : "border-destructive/40 bg-destructive/5 text-destructive",
        )}
      >
        <span>Đã phân bổ: {usd.format(sum)}</span>
        <span className="font-semibold tabular-nums">
          {remain === 0 ? "Khớp 100%" : `Còn ${usd.format(remain)}`}
        </span>
      </div>
    </div>
  );
}
