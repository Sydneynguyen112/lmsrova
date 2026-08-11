// API cho video onboarding bắt buộc (SQL: supabase-onboarding-video.sql)
// - Cài đặt video (app_settings, key "onboarding_video") — admin đánh dấu bài học ở /admin/courses (repo rova-ops)
// - Tiến độ xem của học viên (3 cột onboarding_video_* trong profiles)
import { supabase } from "./supabase";

/** Xem hết video + đủ tỷ lệ giây xem thật này mới được tính "đã xem xong" */
export const ONBOARDING_VIDEO_WATCH_RATIO = 0.8;

export interface OnboardingVideoSetting {
  /** Bunny Stream Video GUID — null = chưa cấu hình, tính năng tắt */
  video_id: string | null;
}

export async function getOnboardingVideoSetting(): Promise<OnboardingVideoSetting> {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "onboarding_video")
    .maybeSingle();
  const value = data?.value as OnboardingVideoSetting | undefined;
  return { video_id: value?.video_id || null };
}

export async function saveOnboardingVideoSetting(
  setting: OnboardingVideoSetting
): Promise<void> {
  const { error } = await supabase.from("app_settings").upsert({
    key: "onboarding_video",
    value: setting,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

/**
 * Cộng dồn giây xem thật + lưu vị trí đang xem (gọi từ onFlush của VideoPlayer).
 * Trả về tổng giây xem thật sau khi cộng.
 */
export async function flushOnboardingVideoProgress(
  userId: string,
  addedSeconds: number,
  positionSec: number
): Promise<number> {
  const { data } = await supabase
    .from("profiles")
    .select("onboarding_video_seconds")
    .eq("id", userId)
    .single();
  const total = (data?.onboarding_video_seconds || 0) + Math.round(addedSeconds);
  await supabase
    .from("profiles")
    .update({
      onboarding_video_seconds: total,
      onboarding_video_position: Math.round(positionSec),
    })
    .eq("id", userId);
  return total;
}

export async function markOnboardingVideoWatched(userId: string): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_video_watched_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw error;
}
