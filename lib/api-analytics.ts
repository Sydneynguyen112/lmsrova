// Fetchers cho các SQL view analytics (supabase-analytics-views.sql — Phase 05).
// Nguyên tắc: mọi tính toán (median, %, cờ) nằm TRONG view — client chỉ select.
// Nguồn chân lý thông số: plans/260806-roadmap-analytics/phase-05-analytics-dashboard.md
import { supabase } from "./supabase";
import type { StudentStatus } from "./status-labels";

// ─── Types (khớp cột các view) ───

export type ActionGroup =
  | "ket"
  | "can_cham"
  | "cho_cham"
  | "cho_tot_nghiep"
  | "moi_chua_vao_guong";

export interface TodayActionRow {
  action_group: ActionGroup;
  user_id: string;
  full_name: string;
  mentor_id: string | null;
  mentor_name: string | null;
  detail: string;
}

export interface FunnelRow {
  stage_key: string;
  stage_title: string;
  order_index: number;
  students: number;
}

export interface StageSpeedRow {
  stage_key: string;
  title: string;
  order_index: number;
  target_days: number;
  completed_count: number;
  median_days: number | null;
  pct_on_time: number | null;
}

export interface CohortMonthlyRow {
  cohort_month: string; // "YYYY-MM-01"
  total: number;
  pct_activated_7d: number | null;
  pct_graduated_30d: number | null; // NULL = lứa chưa đủ tuổi → UI hiện "đang chạy"
  pct_graduated_60d: number | null;
  pct_roi_bo: number | null;
  median_days_to_graduate: number | null;
}

export interface MentorScorecardRow {
  mentor_id: string;
  mentor_name: string;
  students_active: number;
  pct_dung_tien_do: number | null;
  count_ket: number;
  graduated_this_month: number;
  pending_to_grade: number;
  median_grading_hours: number | null;
  touches_this_week: number;
}

export interface StudentRoadmapRow {
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  mentor_id: string | null;
  mentor_name: string | null;
  status: StudentStatus | null;
  status_changed_at: string | null;
  enrolled_at: string | null;
  graduated_at: string | null;
  cohort_month: string | null;
  current_stage_key: string | null;
  current_stage_title: string | null;
  stage_order: number | null;
  entered_at: string | null;
  deadline_at: string | null;
  days_in_stage: number | null;
  days_late: number | null;
  is_ket: boolean;
  is_cho_cham: boolean;
  correct_images: number;
  pending_images: number;
  graduation_grade: string | null;
}

// ─── Fetchers ───

/** v_today_actions — 5 nhóm việc hôm nay. Truyền mentorId để CHỈ lấy học viên của mentor đó. */
export async function fetchTodayActions(mentorId?: string): Promise<TodayActionRow[]> {
  let query = supabase.from("v_today_actions").select("*");
  if (mentorId) query = query.eq("mentor_id", mentorId);
  const { data, error } = await query;
  if (error) {
    console.error("fetchTodayActions:", error.message);
    return [];
  }
  return (data || []) as TodayActionRow[];
}

/** v_funnel — số học viên đang đứng ở từng chặng (chỉ status đang sống). */
export async function fetchFunnel(): Promise<FunnelRow[]> {
  const { data, error } = await supabase
    .from("v_funnel")
    .select("*")
    .order("order_index", { ascending: true });
  if (error) {
    console.error("fetchFunnel:", error.message);
    return [];
  }
  return (data || []) as FunnelRow[];
}

/** v_stage_speed — median ngày thật vs target từng chặng (đủ 10 chặng kể cả chưa ai qua). */
export async function fetchStageSpeed(): Promise<StageSpeedRow[]> {
  const { data, error } = await supabase
    .from("v_stage_speed")
    .select("*")
    .order("order_index", { ascending: true });
  if (error) {
    console.error("fetchStageSpeed:", error.message);
    return [];
  }
  return (data || []) as StageSpeedRow[];
}

/** v_cohort_monthly — so sánh lứa nhập học theo tháng. */
export async function fetchCohortMonthly(): Promise<CohortMonthlyRow[]> {
  const { data, error } = await supabase
    .from("v_cohort_monthly")
    .select("*")
    .order("cohort_month", { ascending: true });
  if (error) {
    console.error("fetchCohortMonthly:", error.message);
    return [];
  }
  return (data || []) as CohortMonthlyRow[];
}

/** v_mentor_scorecard — CHỈ dùng ở trang admin, không đưa vào màn mentor. */
export async function fetchMentorScorecard(): Promise<MentorScorecardRow[]> {
  const { data, error } = await supabase
    .from("v_mentor_scorecard")
    .select("*")
    .order("mentor_name", { ascending: true });
  if (error) {
    console.error("fetchMentorScorecard:", error.message);
    return [];
  }
  return (data || []) as MentorScorecardRow[];
}

/** v_student_roadmap — 1 dòng/học viên, nền của mọi màn analytics. */
export async function fetchStudentRoadmap(mentorId?: string): Promise<StudentRoadmapRow[]> {
  let query = supabase.from("v_student_roadmap").select("*");
  if (mentorId) query = query.eq("mentor_id", mentorId);
  const { data, error } = await query;
  if (error) {
    console.error("fetchStudentRoadmap:", error.message);
    return [];
  }
  return (data || []) as StudentRoadmapRow[];
}

// ─── Format helpers (chống NaN — luật phase 05: % và ngày làm tròn tối đa 1 lẻ) ───

function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** "62.5%" · "100%" · "—" khi null/NaN. */
export function fmtPct(v: number | string | null | undefined): string {
  const n = toNum(v);
  if (n === null) return "—";
  return `${n.toFixed(1).replace(/\.0$/, "")}%`;
}

/** Số 1 lẻ (bỏ .0 thừa) · "—" khi null/NaN. Dùng cho số ngày, số giờ. */
export function fmtNum(v: number | string | null | undefined): string {
  const n = toNum(v);
  if (n === null) return "—";
  return n.toFixed(1).replace(/\.0$/, "");
}

/** Ép về number an toàn cho tính toán chiều cao/độ rộng bar (null → 0). */
export function safeNum(v: number | string | null | undefined): number {
  return toNum(v) ?? 0;
}
