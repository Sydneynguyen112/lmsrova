"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const STORAGE_KEY = "rova_current_user_id";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: "admin" | "mentor" | "student";
  mentor_id: string | null;
  avatar_url: string | null;
  classification: string | null;
  risk_tag: string | null;
  discord_handle: string | null;
  last_active_date: string;
  created_at: string;
}

// Default emails per role for dev fallback
const DEFAULT_EMAIL_BY_ROLE: Record<string, string> = {
  admin: "admin@rova.vn",
  mentor: "tien@rova.vn",
  student: "huy@gmail.com",
};

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
 * Sign in with email (lookup from profiles table — for existing mock users)
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
export async function ensureProfile(): Promise<Profile | null> {
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
    return existing as Profile;
  }

  // Create new profile for Google user
  const { data: newProfile } = await supabase
    .from("profiles")
    .insert({
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Học viên",
      email: user.email!,
      avatar_url: user.user_metadata?.avatar_url || null,
      role: "student",
      classification: "newbie",
      risk_tag: "normal",
    })
    .select()
    .single();

  if (newProfile) {
    signIn(newProfile.id);
    return newProfile as Profile;
  }

  return null;
}

/**
 * Hook to get the currently logged-in user from Supabase.
 * Checks: Supabase Auth session → localStorage → fallback role.
 */
export function useCurrentUser(fallbackRole: string | null = null): Profile | null {
  const [user, setUser] = useState<Profile | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // 1. Check Supabase Auth session
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

      // 2. Try stored ID from localStorage
      const storedId = getStoredUserId();
      if (storedId) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", storedId)
          .single();
        if (!cancelled && data) {
          setUser(data as Profile);
          return;
        }
      }

      // 3. Fallback: load by default email for role (dev only)
      if (fallbackRole) {
        const email = DEFAULT_EMAIL_BY_ROLE[fallbackRole];
        if (email) {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("email", email)
            .single();
          if (!cancelled && data) {
            localStorage.setItem(STORAGE_KEY, data.id);
            setUser(data as Profile);
            return;
          }
        }
      }

      if (!cancelled) setUser(null);
    }

    load();

    // Listen for auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [fallbackRole]);

  return user;
}
