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

export function signOut() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function getStoredUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

/**
 * Hook to get the currently logged-in user from Supabase.
 * Falls back to default user per role for dev convenience.
 */
export function useCurrentUser(fallbackRole: string | null = null): Profile | null {
  const [user, setUser] = useState<Profile | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const storedId = getStoredUserId();

      // Try stored ID first
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

      // Fallback: load by default email for role
      if (fallbackRole) {
        const email = DEFAULT_EMAIL_BY_ROLE[fallbackRole];
        if (email) {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("email", email)
            .single();
          if (!cancelled && data) {
            // Also store in localStorage for consistency
            localStorage.setItem(STORAGE_KEY, data.id);
            setUser(data as Profile);
            return;
          }
        }
      }

      if (!cancelled) setUser(null);
    }

    load();
    return () => { cancelled = true; };
  }, [fallbackRole]);

  return user;
}
