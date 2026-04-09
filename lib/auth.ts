"use client";

import { useEffect, useState } from "react";
import { users } from "@/lib/mock-data";
import type { User, Role } from "@/lib/types";

const STORAGE_KEY = "rova_current_user_id";

// Default fallback user IDs per role — used when nothing in localStorage (dev convenience)
const DEFAULT_USER_BY_ROLE: Record<Role, string> = {
  admin: "u-admin-001",
  mentor: "u-mentor-001",
  student: "u-student-001",
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
 * Hook to get the currently logged-in user.
 *
 * @param fallbackRole - If no user is in localStorage, returns the default user for this role.
 *                      Pass the role of the dashboard the page belongs to.
 *                      Set to null to require explicit login (returns null if not logged in).
 */
export function useCurrentUser(fallbackRole: Role | null = null): User | null {
  const [user, setUser] = useState<User | null>(() => {
    // SSR-safe: initial state is null, real value loaded in effect
    return null;
  });

  useEffect(() => {
    const storedId = getStoredUserId();
    let resolved: User | undefined;

    if (storedId) {
      resolved = users.find((u) => u.id === storedId) as User | undefined;
    }

    if (!resolved && fallbackRole) {
      const fallbackId = DEFAULT_USER_BY_ROLE[fallbackRole];
      resolved = users.find((u) => u.id === fallbackId) as User | undefined;
    }

    setUser(resolved || null);
  }, [fallbackRole]);

  return user;
}
