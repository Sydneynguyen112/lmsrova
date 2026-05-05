// Onboarding setup state cho Cỗ Máy. Mỗi user phải hoàn tất wizard 3-bước trước
// khi xem Phòng điều hành. Mock layer: localStorage. Sẽ thay bằng Supabase
// `user_setup` table khi wire backend.

import { addMachine } from "./mock-data";

export type StrategyId = "concentrated" | "balanced" | "diversified" | "later";

export interface SetupConfig {
  totalCapital: number;
  strategy: StrategyId;
  allocations: { name: string; capital: number }[];
  completedAt: string;
}

const STORAGE_KEY = "rova_comay_setup_v1";
const cache = new Map<string, SetupConfig>();
const listeners = new Set<() => void>();

function isBrowser() {
  return typeof window !== "undefined";
}

function loadAll(): Record<string, SetupConfig> {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, SetupConfig>) : {};
  } catch {
    return {};
  }
}

function persistAll(all: Record<string, SetupConfig>) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* quota / private mode */
  }
}

function notify() {
  for (const fn of listeners) fn();
}

export function getSetup(userId: string): SetupConfig | null {
  if (cache.has(userId)) return cache.get(userId)!;
  const all = loadAll();
  if (all[userId]) {
    cache.set(userId, all[userId]);
    return all[userId];
  }
  return null;
}

export function hasCompletedSetup(userId: string, role?: string | null): boolean {
  // Admin/mentor không cần setup — họ chỉ xem dữ liệu, không phải trader.
  if (role === "admin" || role === "mentor") return true;
  return getSetup(userId) !== null;
}

export function saveSetup(
  userId: string,
  config: Omit<SetupConfig, "completedAt">,
): SetupConfig {
  const full: SetupConfig = { ...config, completedAt: new Date().toISOString() };
  const all = loadAll();
  all[userId] = full;
  persistAll(all);
  cache.set(userId, full);

  // Sinh machines theo phân bổ — chỉ tạo nếu user chưa có (tránh duplicate khi
  // user reset setup nhiều lần).
  for (const a of config.allocations) {
    addMachine(userId, {
      name: a.name,
      capital: a.capital,
      current_anchor: a.capital, // anchor khởi đầu = vốn ban đầu
    });
  }

  notify();
  return full;
}

export function resetSetup(userId: string): void {
  const all = loadAll();
  delete all[userId];
  persistAll(all);
  cache.delete(userId);
  notify();
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ── Strategy catalog (consumed bởi setup-wizard step 2) ──
export const STRATEGIES: Array<{
  id: StrategyId;
  number: string;
  title: string;
  desc: string;
  machineCount: number;
}> = [
  {
    id: "concentrated",
    number: "01",
    title: "Tập trung",
    desc: "Một cỗ máy duy nhất với 100% vốn. Phù hợp người mới.",
    machineCount: 1,
  },
  {
    id: "balanced",
    number: "02",
    title: "Cân bằng",
    desc: "Hai cỗ máy, 60/40. Bắt đầu đa dạng hoá.",
    machineCount: 2,
  },
  {
    id: "diversified",
    number: "03",
    title: "Đa dạng",
    desc: "Ba cỗ máy. Phù hợp doanh chủ có kinh nghiệm.",
    machineCount: 3,
  },
  {
    id: "later",
    number: "—",
    title: "Để sau",
    desc: "Chỉ thiết lập vốn. Tự tạo cỗ máy sau.",
    machineCount: 0,
  },
];

export const QUICK_CAPITAL_CHIPS = [500, 1000, 3000, 5000, 10000];
