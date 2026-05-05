// Cỗ Máy In Tiền — domain types
// MVP scope: mock-data only. Sẽ map 1:1 với Supabase money_machine schema khi wire backend.

export type MachineStatus = "active" | "paused" | "closed";

export type TransactionType =
  | "trade_win"
  | "trade_loss"
  | "withdraw"
  | "anchor_change";

export type CycleDecision = "reset" | "scale";

export interface Machine {
  id: string;
  user_id: string;
  name: string;
  capital: number;
  current_anchor: number;
  cycle_started_at: string | null;
  status: MachineStatus;
  created_at: string;
  updated_at: string;
}

export interface MachineTransaction {
  id: string;
  machine_id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  note: string | null;
  created_at: string;
}

export interface CycleReport {
  id: string;
  machine_id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  decision: CycleDecision;
  pnl: number;
  withdrawn: number;
  meta: { cycle_started_at: string } | null;
  created_at: string;
}

export interface KpiSnapshot {
  total_capital: number;
  pnl: number;
  win_rate: number; // 0..1
  drawdown: number; // negative number, lowest equity dip
  days_active: number;
  trade_count: number;
}
