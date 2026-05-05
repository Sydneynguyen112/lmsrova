"use client";

import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Coins,
  ArrowUpRight,
  Plus,
  RotateCcw,
  Anchor,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Machine, MachineTransaction, TransactionType } from "@/lib/co-may/types";
import { isSeniorMode } from "@/lib/co-may/senior-ui";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

interface Props {
  role: "student" | "mentor" | "admin";
  userId: string;
  totalCapitalSetup: number;
  machines: Machine[];
  tx: MachineTransaction[];
  onReset?: () => void;
}

export function PhongDieuHanh({ role, userId, totalCapitalSetup, machines, tx, onReset }: Props) {
  void userId;
  const senior = isSeniorMode(role);

  // Loại bỏ closed machines khỏi running stats — vốn của chúng đã trả về totalCapital.
  const activeMachines = machines.filter((m) => m.status !== "closed");
  const totalAllocated = activeMachines.reduce((s, m) => s + m.capital, 0);
  const reserve = Math.max(0, totalCapitalSetup - totalAllocated);
  const trades = tx.filter((t) => t.type === "trade_win" || t.type === "trade_loss");
  const openPnl = trades.reduce((s, t) => s + t.amount, 0);
  const withdrawn = -tx
    .filter((t) => t.type === "withdraw")
    .reduce((s, t) => s + t.amount, 0);
  const activeCount = activeMachines.filter((m) => m.status === "active").length;
  const totalCapitalRunning = totalAllocated;

  function handleReset() {
    onReset?.();
  }

  // Recent activity (latest 6 withdraws/trades)
  const recent = [...tx]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 6);

  const featured = [...activeMachines]
    .sort((a, b) => {
      const pnlA = pnlForMachine(a, tx);
      const pnlB = pnlForMachine(b, tx);
      return pnlB - pnlA;
    })
    .slice(0, 2);

  return (
    <section className="space-y-6">
      <SectionHeader
        eyebrow="§ Tổng quan vận hành"
        title="Phòng điều hành"
        subtitle="Toàn cảnh danh mục cỗ máy và dòng tiền đã rút về đời thực."
        senior={senior}
      />

      {/* 4 KPI primary — first one highlighted dark */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-2xl overflow-hidden border border-border">
        <KpiTile
          dark
          label="Dòng tiền đã rút"
          value={usd.format(withdrawn)}
          hint="Tiền thật về tài khoản"
          icon={Wallet}
          senior={senior}
        />
        <KpiTile
          label="Vốn đang vận hành"
          value={usd.format(totalCapitalRunning)}
          icon={Coins}
          senior={senior}
        />
        <KpiTile
          label="PnL mở"
          value={`${openPnl >= 0 ? "+" : ""}${usd.format(openPnl)}`}
          tone={openPnl > 0 ? "profit" : openPnl < 0 ? "loss" : "neutral"}
          icon={openPnl >= 0 ? TrendingUp : TrendingDown}
          senior={senior}
        />
        <KpiTile
          label="Cỗ máy active"
          value={`${activeCount}`}
          icon={Coins}
          senior={senior}
        />
      </div>

      {/* 3 secondary KPI on dashed line */}
      <div className="rounded-2xl border-2 border-dashed border-border px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
        <SecondaryStat label="Tổng vốn doanh chủ" value={usd.format(totalCapitalSetup)} senior={senior} />
        <SecondaryStat label="Đang phân bổ" value={usd.format(totalAllocated)} senior={senior} />
        <SecondaryStat label="Vốn dự trữ" value={usd.format(reserve)} senior={senior} />
        {role === "student" && (
          <div className="flex md:justify-end">
            <Button
              variant="outline"
              size={senior ? "default" : "sm"}
              onClick={handleReset}
              disabled={reserve <= 0}
              title={reserve <= 0 ? "Không còn vốn dự trữ để phân bổ" : undefined}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Hoạch định lại
            </Button>
          </div>
        )}
      </div>

      {/* § 01 Featured machines */}
      <div className="space-y-3">
        <SubSectionHeader number="01" label="Cỗ máy nổi bật" actionHref={`/${role}/co-may/quan-ly`} actionText="Xem tất cả" senior={senior} />

        {featured.length === 0 ? (
          <EmptyMachineState role={role} senior={senior} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featured.map((m) => (
              <FeaturedMachineCard key={m.id} machine={m} tx={tx} role={role} senior={senior} />
            ))}
          </div>
        )}
      </div>

      {/* § 02 Recent activity */}
      <div className="space-y-3">
        <SubSectionHeader number="02" label="Hoạt động gần nhất" actionHref={`/${role}/co-may/lich-su`} actionText="Toàn bộ" senior={senior} />

        {recent.length === 0 ? (
          <div className={cn("rounded-2xl border border-border bg-muted/30 text-center text-muted-foreground", senior ? "px-6 py-8 text-base italic" : "px-6 py-6 text-sm italic")}>
            Chưa có lần rút nào. Mốc neo đầu tiên đang chờ bạn.
          </div>
        ) : (
          <ul className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
            {recent.map((t) => (
              <ActivityRow key={t.id} tx={t} machines={machines} senior={senior} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────

function pnlForMachine(m: Machine, tx: MachineTransaction[]): number {
  const cycleStart = new Date(m.cycle_started_at ?? m.created_at).getTime();
  return tx
    .filter((t) => t.machine_id === m.id && new Date(t.created_at).getTime() >= cycleStart)
    .filter((t) => t.type === "trade_win" || t.type === "trade_loss")
    .reduce((s, t) => s + t.amount, 0);
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  senior,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  senior: boolean;
}) {
  return (
    <header className="space-y-1">
      <div className="text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow}</div>
      <h2 className={cn("font-bold text-foreground leading-tight", senior ? "text-3xl md:text-4xl" : "text-2xl md:text-3xl")}>
        {title}
      </h2>
      <p className={cn("text-muted-foreground", senior ? "text-base" : "text-sm")}>{subtitle}</p>
    </header>
  );
}

function SubSectionHeader({
  number,
  label,
  actionHref,
  actionText,
  senior,
}: {
  number: string;
  label: string;
  actionHref?: string;
  actionText?: string;
  senior: boolean;
}) {
  return (
    <div className="flex items-end justify-between gap-3 border-b border-border pb-2">
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-semibold tabular-nums tracking-widest text-muted-foreground">§ {number}</span>
        <h3 className={cn("font-semibold text-foreground", senior ? "text-xl" : "text-lg")}>{label}</h3>
      </div>
      {actionHref && actionText && (
        <Link
          href={actionHref}
          className={cn(
            "inline-flex items-center gap-1 font-medium text-primary hover:underline whitespace-nowrap",
            senior ? "text-sm" : "text-xs",
          )}
        >
          {actionText} <ArrowUpRight className={senior ? "h-3.5 w-3.5" : "h-3 w-3"} />
        </Link>
      )}
    </div>
  );
}

function KpiTile({
  label,
  value,
  hint,
  icon: Icon,
  dark,
  tone,
  senior,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: typeof Wallet;
  dark?: boolean;
  tone?: "profit" | "loss" | "neutral";
  senior: boolean;
}) {
  const valueColor =
    tone === "profit"
      ? "text-[#5C9C75]"
      : tone === "loss"
        ? "text-[#E06464]"
        : dark
          ? "text-primary"
          : "text-foreground";
  return (
    <div
      className={cn(
        "p-4 md:p-5 flex flex-col gap-2",
        dark ? "bg-foreground text-background" : "bg-card",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1.5 uppercase tracking-widest font-medium",
          senior ? "text-xs" : "text-[11px]",
          dark ? "text-background/60" : "text-muted-foreground",
        )}
      >
        <Icon size={senior ? 14 : 12} />
        {label}
      </div>
      <div
        className={cn(
          "font-bold tabular-nums leading-none",
          senior ? "text-2xl md:text-3xl" : "text-xl md:text-2xl",
          valueColor,
        )}
      >
        {value}
      </div>
      {hint && (
        <div
          className={cn(
            senior ? "text-xs" : "text-[11px]",
            dark ? "text-background/50" : "text-muted-foreground",
          )}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

function SecondaryStat({ label, value, senior }: { label: string; value: string; senior: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className={cn("uppercase tracking-widest text-muted-foreground", senior ? "text-xs" : "text-[11px]")}>
        {label}
      </span>
      <span className={cn("font-bold tabular-nums text-foreground", senior ? "text-2xl" : "text-xl")}>
        {value}
      </span>
    </div>
  );
}

function EmptyMachineState({ role, senior }: { role: string; senior: boolean }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border px-6 py-10 text-center space-y-4">
      <p className="text-base italic text-foreground/80">
        <strong>&ldquo;</strong>Mọi doanh chủ đều bắt đầu với một cỗ máy đầu tiên.
      </p>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">— ROVA Trading Academy</p>
      <p className={cn(senior ? "text-base" : "text-sm", "text-muted-foreground")}>
        Hãy khởi tạo cỗ máy đầu tiên để biến vốn thành dòng tiền.
      </p>
      <Link href={`/${role}/co-may/quan-ly`}>
        <Button variant="default" size={senior ? "lg" : "default"}>
          <Plus className="h-4 w-4" />
          Khởi tạo cỗ máy đầu tiên
        </Button>
      </Link>
    </div>
  );
}

function FeaturedMachineCard({
  machine,
  tx,
  role,
  senior,
}: {
  machine: Machine;
  tx: MachineTransaction[];
  role: string;
  senior: boolean;
}) {
  const cycleStart = new Date(machine.cycle_started_at ?? machine.created_at).getTime();
  const machineTx = tx.filter((t) => t.machine_id === machine.id);
  const inCycle = machineTx.filter((t) => new Date(t.created_at).getTime() >= cycleStart);
  const trades = inCycle.filter((t) => t.type === "trade_win" || t.type === "trade_loss");
  const pnl = trades.reduce((s, t) => s + t.amount, 0);
  const withdraws = inCycle
    .filter((t) => t.type === "withdraw")
    .reduce((s, t) => s + t.amount, 0);
  const balance = machine.capital + pnl + withdraws;
  const days = Math.max(1, Math.floor((Date.now() - cycleStart) / 86400_000));
  const pnlPct = machine.capital > 0 ? (pnl / machine.capital) * 100 : 0;
  const anchorRatio = Math.max(0, Math.min(1, balance / Math.max(1, machine.current_anchor)));

  return (
    <Link
      href={`/${role}/co-may/quan-ly/${machine.id}?owner=${machine.user_id}`}
      className="group block rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all p-5 space-y-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className={cn("font-semibold text-foreground", senior ? "text-lg" : "text-base")}>
            {machine.name}
            {pnlPct !== 0 && (
              <span
                className={cn(
                  "ml-2 text-sm font-medium tabular-nums",
                  pnlPct > 0 ? "text-[#5C9C75]" : "text-[#E06464]",
                )}
              >
                {pnlPct > 0 ? "+" : ""}
                {pnlPct.toFixed(1)}%
              </span>
            )}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wider">
            3-box method · Thủ công
          </p>
        </div>
        <span className="rounded-md bg-foreground text-background px-2 py-0.5 text-xs font-semibold tabular-nums whitespace-nowrap">
          {days} ngày
        </span>
      </div>

      <div className="border-t border-dashed border-border pt-3 grid grid-cols-2 gap-y-2 text-sm">
        <Stat label="Vốn gốc" value={usd.format(machine.capital)} senior={senior} />
        <Stat
          label="PnL"
          value={`${pnl >= 0 ? "+" : ""}${usd.format(pnl)}`}
          tone={pnl > 0 ? "profit" : pnl < 0 ? "loss" : undefined}
          senior={senior}
        />
        <Stat label="Đã rút" value={usd.format(-withdraws)} senior={senior} />
        <Stat label="Số dư hiện tại" value={usd.format(balance)} senior={senior} />
      </div>

      {/* Anchor mock-bar */}
      <div className="rounded-lg bg-muted/30 px-3 py-2.5">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
          <span className="flex items-center gap-1">
            <Anchor className="h-3 w-3 text-primary" />
            Mốc neo
          </span>
          <span className="tabular-nums">
            Hiện tại: {usd.format(balance)} · Số dư: <strong className="text-foreground">{usd.format(balance)}</strong>
          </span>
        </div>
        <div className="relative h-2 rounded-full bg-border overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-primary transition-all"
            style={{ width: `${anchorRatio * 100}%` }}
          />
        </div>
      </div>
    </Link>
  );
}

function Stat({
  label,
  value,
  tone,
  senior,
}: {
  label: string;
  value: string;
  tone?: "profit" | "loss";
  senior: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-dashed border-border/50 py-1 last:border-0">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-semibold tabular-nums",
          senior ? "text-base" : "text-sm",
          tone === "profit" && "text-[#5C9C75]",
          tone === "loss" && "text-[#E06464]",
          !tone && "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

const TYPE_LABEL: Record<TransactionType, string> = {
  trade_win: "Lệnh thắng",
  trade_loss: "Lệnh thua",
  withdraw: "Rút phần dư",
  anchor_change: "Đổi anchor",
};

function ActivityRow({
  tx,
  machines,
  senior,
}: {
  tx: MachineTransaction;
  machines: Machine[];
  senior: boolean;
}) {
  const machine = machines.find((m) => m.id === tx.machine_id);
  const tone = tx.amount > 0 ? "profit" : tx.amount < 0 ? "loss" : undefined;

  return (
    <li className={cn("grid grid-cols-[120px_1fr_auto] items-center gap-4", senior ? "px-5 py-4" : "px-4 py-3")}>
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
        {TYPE_LABEL[tx.type]}
      </span>
      <div className="min-w-0">
        <div className={cn("font-medium text-foreground truncate", senior ? "text-base" : "text-sm")}>
          {machine?.name ?? tx.machine_id}
        </div>
        {tx.note && (
          <div className={cn("italic text-muted-foreground/70 truncate", senior ? "text-sm" : "text-xs")}>
            {tx.note}
          </div>
        )}
      </div>
      <div className="text-right space-y-0.5">
        <div
          className={cn(
            "font-semibold tabular-nums whitespace-nowrap",
            senior ? "text-base" : "text-sm",
            tone === "profit" && "text-[#5C9C75]",
            tone === "loss" && "text-[#E06464]",
          )}
        >
          {tx.amount > 0 ? "+" : ""}
          {usd.format(tx.amount)}
        </div>
        <div className="text-[11px] text-muted-foreground tabular-nums">
          {formatRelativeTime(tx.created_at)}
        </div>
      </div>
    </li>
  );
}
