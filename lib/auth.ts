"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const STORAGE_KEY = "rova_current_user_id";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: "admin" | "mentor" | "student" | "super_admin";
  mentor_id: string | null;
  avatar_url: string | null;
  classification: string | null;
  risk_tag: string | null;
  discord_handle: string | null;
  last_active_date: string;
  created_at: string;
  onboarding_survey?: OnboardingSurvey | null;
  onboarding_video_seconds?: number;
  onboarding_video_position?: number;
  onboarding_video_watched_at?: string | null;
  learning_pace?: "fast" | "steady" | null;
  tier?: "pro" | "pro_graduate" | "master" | "master_certified";
  show_full_name?: boolean;
  is_anonymous?: boolean;
}

export interface OnboardingSurvey {
  answers: Record<string, { score: number; answer: string } | string>;
  total_score: number;
  has_any_one: boolean;
  classification: string;
  completed_at: string;
}

export function signIn(userId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, userId);
}

export async function signOut() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  await supabase.auth.signOut();
}

export function getStoredUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

/**
 * Sign in with Google via Supabase OAuth
 */
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : undefined,
    },
  });
  if (error) throw error;
}

/**
 * Đăng ký tài khoản mới: tạo Supabase Auth user trước, rồi tạo profile dùng chính auth user id.
 * Trả về profile + cờ needsEmailConfirm (true khi project bật email confirmation nên chưa có session).
 * Ném Error message tiếng Việt nếu thất bại.
 */
export async function signUpWithPassword(input: {
  full_name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<{ profile: Profile; needsEmailConfirm: boolean }> {
  const email = input.email.trim().toLowerCase();

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existing) throw new Error("Email đã tồn tại. Hãy đăng nhập.");

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: input.password,
  });
  if (authError) {
    const msg = authError.message.toLowerCase();
    if (msg.includes("already registered") || msg.includes("already been registered")) {
      throw new Error("Email đã tồn tại. Hãy đăng nhập.");
    }
    if (msg.includes("password")) {
      throw new Error("Mật khẩu chưa đủ mạnh — tối thiểu 8 ký tự.");
    }
    if (msg.includes("invalid") && msg.includes("email")) {
      throw new Error("Email không hợp lệ.");
    }
    throw new Error("Không thể tạo tài khoản. Thử lại sau.");
  }

  // Khi bật email confirmation, Supabase trả user rỗng identities thay vì báo lỗi trùng.
  if (authData.user && authData.user.identities?.length === 0) {
    throw new Error("Email đã tồn tại. Hãy đăng nhập.");
  }
  const userId = authData.user?.id;
  if (!userId) throw new Error("Không thể tạo tài khoản. Thử lại sau.");

  const { data: profile, error: insertError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        full_name: input.full_name,
        email,
        phone: input.phone,
        role: "student",
        classification: "newbie",
        risk_tag: "normal",
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (insertError || !profile) {
    throw new Error("Đã tạo tài khoản nhưng chưa lưu được hồ sơ — liên hệ ROVA");
  }

  const needsEmailConfirm = !authData.session;
  if (!needsEmailConfirm) signIn(profile.id);
  return { profile: profile as Profile, needsEmailConfirm };
}

/**
 * Sign in with email + password qua Supabase Auth (tài khoản thật, gồm cả tài khoản import).
 * Trả về profile nếu thành công, ném Error message tiếng Việt nếu sai.
 */
export async function signInWithPassword(email: string, password: string): Promise<Profile> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) {
    if (error.message.toLowerCase().includes("invalid")) {
      throw new Error("Email hoặc mật khẩu không đúng");
    }
    throw new Error("Không đăng nhập được, thử lại sau");
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email.trim().toLowerCase())
    .single();
  if (!profile) throw new Error("Tài khoản chưa có hồ sơ học viên — liên hệ ROVA");
  signIn(profile.id);
  return profile as Profile;
}

export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
  if (error) throw new Error("Không gửi được email đặt lại mật khẩu");
}

/**
 * @deprecated Đường đăng nhập KHÔNG mật khẩu — chỉ giữ cho code cũ compile, không dùng nữa.
 */
export async function signInWithEmail(email: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email.trim().toLowerCase())
    .single();

  if (!profile) return null;

  signIn(profile.id);
  return profile as Profile;
}

/**
 * After Google OAuth callback, ensure a profile exists in our profiles table.
 * If new user → create profile with role "student".
 * Returns the profile.
 */
export async function ensureProfile(): Promise<{ profile: Profile; isNewUser: boolean } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Check if profile already exists
  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", user.email)
    .single();

  if (existing) {
    signIn(existing.id);
    return { profile: existing as Profile, isNewUser: false };
  }

  // Create new profile for Google user
  // Google returns given_name (tên) and family_name (họ)
  // Vietnamese format: Họ + Tên → family_name + given_name
  const givenName = user.user_metadata?.given_name || "";
  const familyName = user.user_metadata?.family_name || "";
  const fullName = familyName && givenName
    ? `${familyName} ${givenName}`
    : user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Học viên";

  const { data: newProfile, error: insertError } = await supabase
    .from("profiles")
    .insert({
      full_name: fullName,
      email: user.email!,
      avatar_url: user.user_metadata?.avatar_url || null,
      role: "student",
      classification: "newbie",
      risk_tag: "normal",
    })
    .select()
    .single();

  if (insertError) {
    console.error("ensureProfile insert error:", insertError);
    // Profile may already exist with different casing — retry lookup
    const { data: retryProfile } = await supabase
      .from("profiles")
      .select("*")
      .ilike("email", user.email!)
      .single();
    if (retryProfile) {
      signIn(retryProfile.id);
      return { profile: retryProfile as Profile, isNewUser: false };
    }
    return null;
  }

  if (newProfile) {
    signIn(newProfile.id);
    return { profile: newProfile as Profile, isNewUser: true };
  }

  return null;
}

/**
 * Hook lấy người dùng đang đăng nhập. CHỈ tin phiên Supabase Auth thật.
 *
 * Trước đây có đường dự phòng: không có phiên thì lấy id trong localStorage rồi
 * nạp hồ sơ theo id đó. Bỏ đi vì hai lý do:
 *   1. Bảo mật — ai sửa được localStorage là tự khai mình thành người khác.
 *   2. Sau khi chạy supabase-rls-content-hardening.sql, người không có phiên
 *      thật mang vai anon nên MỌI thao tác ghi đều bị từ chối. Giữ đường dự
 *      phòng thì họ trông như đã đăng nhập nhưng tiến độ học âm thầm không lưu
 *      được — hỏng kiểu im lặng, tệ hơn là bắt đăng nhập lại.
 *
 * Hệ quả: học viên nào còn id cũ trong localStorage mà phiên đã hết hạn sẽ bị
 * coi là chưa đăng nhập và phải đăng nhập lại một lần. Đây là đánh đổi có chủ ý.
 */
export function useCurrentUser(_fallbackRole: string | null = null): Profile | null {
  const [user, setUser] = useState<Profile | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser?.email && !cancelled) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("email", authUser.email)
          .single();
        if (!cancelled && data) {
          localStorage.setItem(STORAGE_KEY, data.id);
          setUser(data as Profile);
          return;
        }
      }

      // Không có phiên Supabase hợp lệ = chưa đăng nhập. Dọn luôn id cũ để lần
      // sau không còn gì gợi ý là đang đăng nhập.
      if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
      if (!cancelled) setUser(null);
    }

    load();

    // Listen for auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    // Listen for profile-updated event (vd: avatar đổi từ ProfileEditor)
    const onProfileUpdate = () => load();
    if (typeof window !== "undefined") {
      window.addEventListener("rova:profile-updated", onProfileUpdate);
    }

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      if (typeof window !== "undefined") {
        window.removeEventListener("rova:profile-updated", onProfileUpdate);
      }
    };
  }, []);

  return user;
}
