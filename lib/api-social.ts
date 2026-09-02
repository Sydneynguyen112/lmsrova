// RPC social learning — client CHỈ đọc qua các hàm này (4 bảng social bị RLS chặn hoàn toàn).
// Mọi RPC là SECURITY DEFINER phía Supabase; luật tên (ẩn danh / rút gọn) đã áp trong SQL,
// client không bao giờ nhận full_name thô của người khác.
import { supabase } from "./supabase";
import type { Tier } from "./social-config";

export type FeedEventType = "stage_completed" | "badge_earned" | "graduated";

export interface FeedItem {
  event_type: FeedEventType;
  name: string;
  avatar_url: string | null;
  tier: Tier;
  stage_title: string | null;
  badge_title: string | null;
  journey_day: number | null;
  created_at: string;
}

export interface BoardRow {
  name: string;
  avatar_url: string | null;
  tier: Tier;
  points?: number;
  days?: number;
}

export interface BoardMe {
  points?: number;
  days?: number;
  rank: number | null;
  total: number;
}

export interface Leaderboard {
  top: BoardRow[];
  me: BoardMe;
}

export interface GoldBoardItem {
  name: string;
  avatar_url: string | null;
  journey_day: number | null;
  created_at: string;
}

export interface GoldBoard {
  total_count: number;
  items: GoldBoardItem[];
}

export interface MyPulse {
  streak: number;
  best_streak: number;
  week: BoardMe;
  recent: FeedItem[];
}

export interface MyBadge {
  id: string;
  title: string;
  icon: string | null;
  kind: "stage" | "graduation" | "tier" | "weekly";
  earned: boolean;
  times: number;
  awarded_at: string | null;
}

export async function getMyPulse(viewerId: string): Promise<MyPulse | null> {
  const { data, error } = await supabase.rpc("get_my_pulse", { p_viewer: viewerId });
  if (error) return null;
  return data as MyPulse;
}

export async function getFeed(limit = 20): Promise<FeedItem[]> {
  const { data, error } = await supabase.rpc("get_feed", { p_limit: limit });
  if (error) return [];
  return (data || []) as FeedItem[];
}

export async function getLeaderboardEffort(
  viewerId: string,
  courseId: string | null = null
): Promise<Leaderboard | null> {
  const { data, error } = await supabase.rpc("get_leaderboard_effort", {
    p_viewer: viewerId,
    p_course: courseId,
  });
  if (error) return null;
  return data as Leaderboard;
}

export async function getLeaderboardStreak(viewerId: string): Promise<Leaderboard | null> {
  const { data, error } = await supabase.rpc("get_leaderboard_streak", { p_viewer: viewerId });
  if (error) return null;
  return data as Leaderboard;
}

export async function getGoldBoard(): Promise<GoldBoard | null> {
  const { data, error } = await supabase.rpc("get_gold_board");
  if (error) return null;
  return data as GoldBoard;
}

export async function getMyBadges(viewerId: string): Promise<MyBadge[]> {
  const { data, error } = await supabase.rpc("get_my_badges", { p_viewer: viewerId });
  if (error) return [];
  return (data || []) as MyBadge[];
}

// ─── Câu chữ cho feed (máy viết, ngôn ngữ đời thường) ───

export function feedText(item: FeedItem): string {
  switch (item.event_type) {
    case "stage_completed":
      return item.stage_title
        ? `vừa hoàn thành chặng ${item.stage_title}`
        : "vừa hoàn thành một chặng";
    case "graduated":
      return "đã tốt nghiệp khoá học";
    case "badge_earned":
      return item.badge_title ? `vừa nhận huy hiệu ${item.badge_title}` : "vừa nhận huy hiệu mới";
  }
}

export function timeAgoVi(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "hôm qua";
  if (days < 30) return `${days} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
}
