"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ensureProfile } from "@/lib/auth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Đang xác thực...");

  useEffect(() => {
    async function handle() {
      try {
        const profile = await ensureProfile();

        if (!profile) {
          setStatus("Không thể xác thực. Đang chuyển hướng...");
          setTimeout(() => router.push("/sign-in"), 2000);
          return;
        }

        setStatus(`Xin chào ${profile.full_name}! Đang chuyển hướng...`);

        if (profile.role === "admin") router.push("/admin");
        else if (profile.role === "mentor") router.push("/mentor");
        else router.push("/student");
      } catch {
        setStatus("Có lỗi xảy ra. Đang chuyển hướng...");
        setTimeout(() => router.push("/sign-in"), 2000);
      }
    }

    handle();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}
