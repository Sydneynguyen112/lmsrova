import type {
  Machine,
  MachineTransaction,
  CycleReport,
  CycleDecision,
  KpiSnapshot,
  TransactionType,
} from "./types";

// ── Deterministic PRNG (mulberry32) seeded by userId ──
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function () {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOW = new Date("2026-05-04T08:00:00Z").getTime();
const DAY = 86400_000;

const MACHINE_TEMPLATES = [
  { name: "Cỗ máy chính — XAUUSD", capital: 5000 },
  { name: "Cỗ máy phụ — EURUSD", capital: 2000 },
  { name: "Cỗ máy thử nghiệm — BTC", capital: 1000 },
  { name: "Cỗ máy scalping — GBPJPY", capital: 3000 },
];

// ── Generators ──

function genMachines(userId: string, rand: () => number): Machine[] {
  const count = Math.max(1, Math.floor(rand() * MACHINE_TEMPLATES.length) + 1);
  const machines: Machine[] = [];
  for (let i = 0; i < count; i++) {
    const tpl = MACHINE_TEMPLATES[i];
    const ageDays = Math.floor(rand() * 60) + 7;
    const cycleAgeDays = Math.floor(rand() * Math.min(ageDays, 30));
    const created = new Date(NOW - ageDays * DAY);
    const cycleStart = cycleAgeDays > 0 ? new Date(NOW - cycleAgeDays * DAY) : null;
    machines.push({
      id: `mach-${userId}-${i + 1}`,
      user_id: userId,
      name: tpl.name,
      capital: tpl.capital,
      current_anchor: tpl.capital + Math.floor(rand() * 800) - 200,
      cycle_started_at: cycleStart?.toISOString() ?? null,
      status: rand() > 0.15 ? "active" : "paused",
      created_at: created.toISOString(),
      updated_at: new Date(NOW - Math.floor(rand() * 3) * DAY).toISOString(),
    });
  }
  return machines;
}

function genTransactions(machine: Machine, rand: () => number): MachineTransaction[] {
  const count = Math.floor(rand() * 20) + 12;
  const txs: MachineTransaction[] = [];
  const cycleStartTs = machine.cycle_started_at
    ? new Date(machine.cycle_started_at).getTime()
    : new Date(machine.created_at).getTime();
  const span = Math.max(DAY, NOW - cycleStartTs);

  for (let i = 0; i < count; i++) {
    const r = rand();
    let type: TransactionType;
    let amount: number;
    if (r < 0.55) {
      type = "trade_win";
      amount = Math.floor(rand() * 250) + 30;
    } else if (r < 0.85) {
      type = "trade_loss";
      amount = -(Math.floor(rand() * 180) + 20);
    } else if (r < 0.95) {
      type = "withdraw";
      amount = -(Math.floor(rand() * 400) + 100);
    } else {
      type = "anchor_change";
      amount = Math.floor(rand() * 400) - 200;
    }

    const ts = cycleStartTs + Math.floor(rand() * span);
    txs.push({
      id: `tx-${machine.id}-${i + 1}`,
      machine_id: machine.id,
      user_id: machine.user_id,
      type,
      amount,
      note: type === "trade_loss" ? "Stop-loss kỷ luật" : null,
      created_at: new Date(ts).toISOString(),
    });
  }

  txs.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return txs;
}

function genReports(machine: Machine, rand: () => number): CycleReport[] {
  const count = Math.floor(rand() * 3) + 1;
  const reports: CycleReport[] = [];
  const baseStart = new Date(machine.created_at).getTime();
  let cursor = baseStart;
  for (let i = 0; i < count; i++) {
    const cycleLen = Math.floor(rand() * 14 + 7) * DAY;
    const start = cursor;
    const end = Math.min(cursor + cycleLen, NOW - DAY);
    if (end <= start) break;
    cursor = end;
    const pnl = Math.floor((rand() - 0.3) * 1500);
    const withdrawn = pnl > 0 ? Math.floor(pnl * (0.3 + rand() * 0.4)) : 0;
    reports.push({
      id: `rep-${machine.id}-${i + 1}`,
      machine_id: machine.id,
      user_id: machine.user_id,
      start_date: new Date(start).toISOString(),
      end_date: new Date(end).toISOString(),
      decision: pnl > 200 && rand() > 0.4 ? "scale" : "reset",
      pnl,
      withdrawn,
      meta: { cycle_started_at: new Date(end + DAY).toISOString() },
      created_at: new Date(end).toISOString(),
    });
  }
  return reports;
}

// ── Cache: lazy generation, stable per userId ──
const cache = new Map<
  string,
  { machines: Machine[]; tx: MachineTransaction[]; reports: CycleReport[] }
>();

function getDataFor(userId: string) {
  const cached = cache.get(userId);
  if (cached) return cached;

  const rand = mulberry32(hash(userId));
  const machines = genMachines(userId, rand);
  const tx = machines.flatMap((m) => genTransactions(m, rand));
  const reports = machines.flatMap((m) => genReports(m, rand));
  const data = { machines, tx, reports };
  cache.set(userId, data);
  return data;
}

// ── Mutation API (in-memory, dev only) ──
// Reload page = reset state. Acceptable cho MVP. Khi wire Supabase, các fn này sẽ thay bằng server actions.

let mutationSeq = 0;
function nextId(prefix: string) {
  mutationSeq += 1;
  return `${prefix}-${Date.now().toString(36)}-${mutationSeq}`;
}

export function addMachine(
  userId: string,
  input: {
    name: string;
    capital: number;
    current_anchor: number;
    method?: string;
    signal_source?: Machine["signal_source"];
    risk_per_trade_pct?: number;
    max_drawdown_pct?: number;
    target_withdraw_count?: number;
    target_profit?: number;
    anchor_milestones?: number[];
  },
): Machine {
  const data = getDataFor(userId);
  const now = new Date().toISOString();
  const m: Machine = {
    id: nextId("mach-new"),
    user_id: userId,
    name: input.name,
    capital: input.capital,
    current_anchor: input.current_anchor,
    cycle_started_at: now,
    status: "active",
    created_at: now,
    updated_at: now,
    method: input.method,
    signal_source: input.signal_source,
    risk_per_trade_pct: input.risk_per_trade_pct,
    max_drawdown_pct: input.max_drawdown_pct,
    target_withdraw_count: input.target_withdraw_count,
    target_profit: input.target_profit,
    anchor_milestones: input.anchor_milestones,
  };
  data.machines.unshift(m);
  return m;
}

// Same shape as Supabase RLS denial — caller handles uniformly.
class OwnershipError extends Error {
  constructor(machineId: string) {
    super(`Machine ${machineId} not owned by user`);
    this.name = "OwnershipError";
  }
}

function assertOwnership(userId: string, machineId: string): void {
  const data = getDataFor(userId);
  if (!data.machines.some((m) => m.id === machineId)) {
    throw new OwnershipError(machineId);
  }
}

export function updateMachine(
  userId: string,
  machineId: string,
  patch: Partial<Pick<Machine, "name" | "capital" | "current_anchor" | "status">>,
): Machine {
  assertOwnership(userId, machineId);
  const data = getDataFor(userId);
  const idx = data.machines.findIndex((m) => m.id === machineId);
  data.machines[idx] = {
    ...data.machines[idx],
    ...patch,
    updated_at: new Date().toISOString(),
  };
  return data.machines[idx];
}

export function deleteMachine(userId: string, machineId: string): void {
  assertOwnership(userId, machineId);
  const data = getDataFor(userId);
  data.machines = data.machines.filter((m) => m.id !== machineId);
  data.tx = data.tx.filter((t) => t.machine_id !== machineId);
  data.reports = data.reports.filter((r) => r.machine_id !== machineId);
}

export function recordTransaction(
  userId: string,
  machineId: string,
  input: {
    type: TransactionType;
    amount: number;
    note?: string | null;
    direction?: MachineTransaction["direction"];
    symbol?: string;
    volume?: number;
    entry_reason?: string;
    exit_reason?: string;
    emotion?: string;
  },
): MachineTransaction {
  assertOwnership(userId, machineId);
  const data = getDataFor(userId);
  const tx: MachineTransaction = {
    id: nextId("tx-new"),
    machine_id: machineId,
    user_id: userId,
    type: input.type,
    amount: input.amount,
    note: input.note ?? null,
    created_at: new Date().toISOString(),
    direction: input.direction,
    symbol: input.symbol,
    volume: input.volume,
    entry_reason: input.entry_reason,
    exit_reason: input.exit_reason,
    emotion: input.emotion,
  };
  data.tx.unshift(tx);
  return tx;
}

/**
 * Đóng cỗ máy hoàn toàn — khác close cycle.
 * Tính balance cuối (capital + pnl + withdraws âm), trả lại vào tổng vốn doanh chủ
 * dạng delta = balance - capital ban đầu (gain/loss). Mark machine.status = "closed".
 * Caller chịu trách nhiệm gọi adjustTotalCapital ở setup-store.
 *
 * Returns: { balance, capital, delta }
 */
export function closeMachine(
  userId: string,
  machineId: string,
): { balance: number; capital: number; delta: number } {
  assertOwnership(userId, machineId);
  const data = getDataFor(userId);
  const idx = data.machines.findIndex((m) => m.id === machineId);
  const m = data.machines[idx];
  const machineTx = data.tx.filter((t) => t.machine_id === machineId);
  const trades = machineTx.filter((t) => t.type === "trade_win" || t.type === "trade_loss");
  const pnl = trades.reduce((s, t) => s + t.amount, 0);
  const withdraws = machineTx.filter((t) => t.type === "withdraw").reduce((s, t) => s + t.amount, 0);
  const balance = m.capital + pnl + withdraws; // withdraws is negative
  data.machines[idx] = {
    ...m,
    status: "closed",
    updated_at: new Date().toISOString(),
  };
  return { balance, capital: m.capital, delta: balance - m.capital };
}

export function closeCycleMock(
  userId: string,
  machineId: string,
  decision: CycleDecision,
): CycleReport {
  assertOwnership(userId, machineId);
  const data = getDataFor(userId);
  const machine = data.machines.find((m) => m.id === machineId)!;

  const cycleStart = machine.cycle_started_at ?? machine.created_at;
  const machineTx = data.tx.filter(
    (t) =>
      t.machine_id === machineId &&
      new Date(t.created_at) >= new Date(cycleStart),
  );
  const trades = machineTx.filter((t) => t.type === "trade_win" || t.type === "trade_loss");
  const pnl = trades.reduce((s, t) => s + t.amount, 0);
  const withdrawn = -machineTx
    .filter((t) => t.type === "withdraw")
    .reduce((s, t) => s + t.amount, 0); // amount is negative for withdraw

  const newCycleStart = new Date().toISOString();
  const report: CycleReport = {
    id: nextId("rep-new"),
    machine_id: machineId,
    user_id: userId,
    start_date: cycleStart,
    end_date: newCycleStart,
    decision,
    pnl,
    withdrawn,
    meta: { cycle_started_at: newCycleStart },
    created_at: newCycleStart,
  };
  data.reports.unshift(report);

  // Update machine: reset cycle. Scale = bump capital + anchor by pnl.
  const idx = data.machines.findIndex((m) => m.id === machineId);
  if (idx !== -1) {
    data.machines[idx] = {
      ...data.machines[idx],
      cycle_started_at: newCycleStart,
      capital:
        decision === "scale"
          ? Math.max(0, data.machines[idx].capital + pnl)
          : data.machines[idx].capital,
      current_anchor:
        decision === "scale"
          ? data.machines[idx].current_anchor + Math.max(0, pnl)
          : data.machines[idx].current_anchor,
      updated_at: newCycleStart,
    };
  }
  return report;
}

// ── Public API ──

export function getMachinesByUser(userId: string): Machine[] {
  return getDataFor(userId).machines;
}

export function getMachineById(userId: string, machineId: string): Machine | null {
  return getDataFor(userId).machines.find((m) => m.id === machineId) ?? null;
}

export function getTxByMachine(userId: string, machineId: string): MachineTransaction[] {
  return getDataFor(userId).tx.filter((t) => t.machine_id === machineId);
}

export function getTxByUser(userId: string): MachineTransaction[] {
  return getDataFor(userId).tx;
}

export function getReportsByMachine(userId: string, machineId: string): CycleReport[] {
  return getDataFor(userId).reports.filter((r) => r.machine_id === machineId);
}

export function getReportsByUser(userId: string): CycleReport[] {
  return getDataFor(userId).reports;
}

export function computeKpi(userId: string, machineId?: string): KpiSnapshot {
  const data = getDataFor(userId);
  const machines = machineId
    ? data.machines.filter((m) => m.id === machineId)
    : data.machines;
  const tx = machineId
    ? data.tx.filter((t) => t.machine_id === machineId)
    : data.tx;

  const total_capital = machines.reduce((s, m) => s + m.capital, 0);
  const trades = tx.filter((t) => t.type === "trade_win" || t.type === "trade_loss");
  const wins = trades.filter((t) => t.type === "trade_win").length;
  const trade_count = trades.length;
  const win_rate = trade_count > 0 ? wins / trade_count : 0;
  const pnl = trades.reduce((s, t) => s + t.amount, 0);

  // Drawdown: lowest equity point relative to running peak
  let equity = 0;
  let peak = 0;
  let drawdown = 0;
  const ordered = [...trades].sort((a, b) => a.created_at.localeCompare(b.created_at));
  for (const t of ordered) {
    equity += t.amount;
    if (equity > peak) peak = equity;
    const dd = equity - peak;
    if (dd < drawdown) drawdown = dd;
  }

  const oldest = machines.reduce<Machine | null>((acc, m) => {
    const start = m.cycle_started_at ?? m.created_at;
    if (!acc) return m;
    const accStart = acc.cycle_started_at ?? acc.created_at;
    return start < accStart ? m : acc;
  }, null);
  const days_active = oldest
    ? Math.max(
        0,
        Math.floor(
          (NOW - new Date(oldest.cycle_started_at ?? oldest.created_at).getTime()) / DAY,
        ),
      )
    : 0;

  return { total_capital, pnl, win_rate, drawdown, days_active, trade_count };
}

// ── Access flag ──
// Đọc từ feature-flags store (admin toggle qua UI). Admin role/id có override TRUE.
import { hasFeature } from "@/lib/feature-flags/store";

export function hasMoneyMachineAccess(userId: string, role?: string | null): boolean {
  return hasFeature(userId, "money_machine", role);
}

// ── Demo scope (cho mentor + admin view) ──
const DEMO_USER_IDS = [
  "u-student-001",
  "u-student-002",
  "u-student-003",
  "u-student-004",
  "u-student-005",
];

const DEMO_MENTEE_BY_MENTOR: Record<string, string[]> = {
  "u-mentor-001": ["u-student-001", "u-student-002", "u-student-003"],
  "u-mentor-002": ["u-student-004", "u-student-005"],
};

export function getUserScope(role: string | undefined | null, userId: string): string[] {
  if (role === "admin" || userId.startsWith("u-admin")) return DEMO_USER_IDS;
  if (role === "mentor" || userId.startsWith("u-mentor")) {
    return DEMO_MENTEE_BY_MENTOR[userId] ?? DEMO_USER_IDS.slice(0, 3);
  }
  // Fallback: any other id → treat as own scope. Add to demo seeded users
  // for stable mock data when arbitrary Supabase profile ids appear.
  return [userId];
}

export function getMachinesForScope(userIds: string[]): Machine[] {
  return userIds.flatMap((id) => getMachinesByUser(id));
}

export function getTxForScope(userIds: string[]): MachineTransaction[] {
  return userIds.flatMap((id) => getTxByUser(id));
}

export function getReportsForScope(userIds: string[]): CycleReport[] {
  return userIds.flatMap((id) => getReportsByUser(id));
}

export function computeKpiForScope(userIds: string[]): KpiSnapshot {
  const machines = getMachinesForScope(userIds);
  const tx = getTxForScope(userIds);

  const total_capital = machines.reduce((s, m) => s + m.capital, 0);
  const trades = tx.filter((t) => t.type === "trade_win" || t.type === "trade_loss");
  const wins = trades.filter((t) => t.type === "trade_win").length;
  const trade_count = trades.length;
  const win_rate = trade_count > 0 ? wins / trade_count : 0;
  const pnl = trades.reduce((s, t) => s + t.amount, 0);

  let equity = 0;
  let peak = 0;
  let drawdown = 0;
  const ordered = [...trades].sort((a, b) => a.created_at.localeCompare(b.created_at));
  for (const t of ordered) {
    equity += t.amount;
    if (equity > peak) peak = equity;
    const dd = equity - peak;
    if (dd < drawdown) drawdown = dd;
  }

  const oldest = machines.reduce<Machine | null>((acc, m) => {
    const start = m.cycle_started_at ?? m.created_at;
    if (!acc) return m;
    const accStart = acc.cycle_started_at ?? acc.created_at;
    return start < accStart ? m : acc;
  }, null);
  const days_active = oldest
    ? Math.max(
        0,
        Math.floor(
          (NOW - new Date(oldest.cycle_started_at ?? oldest.created_at).getTime()) / DAY,
        ),
      )
    : 0;

  return { total_capital, pnl, win_rate, drawdown, days_active, trade_count };
}
