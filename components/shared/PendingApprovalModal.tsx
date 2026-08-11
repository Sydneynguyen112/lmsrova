"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Copy, Check, RefreshCw, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";

interface PendingApprovalModalProps {
  email: string;
  fullName: string;
}

export function PendingApprovalModal({ email, fullName }: PendingApprovalModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/sign-in";
  };

  const firstName = fullName.trim().split(" ").slice(-1)[0] || "bạn";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/85 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md rounded-2xl border border-gold/30 bg-card p-6 shadow-xl space-y-5"
      >
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-gold/10 border-2 border-gold/30 flex items-center justify-center mx-auto">
            <Clock className="h-7 w-7 text-gold" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Tài khoản đang chờ ROVA duyệt
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Chào {firstName}, tài khoản đã tạo xong. ROVA cần duyệt tay thì video onboarding,
              bài test đầu vào và khoá học mới mở.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gold/20 bg-gold/5 p-4 space-y-3">
          <p className="text-sm text-foreground leading-relaxed">
            Bạn nhắn <span className="font-semibold text-gold">email dưới đây</span> cho mentor
            hoặc bạn tư vấn đang hỗ trợ bạn (Zalo / Messenger) để ROVA duyệt tài khoản:
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <code className="flex-1 break-all rounded-lg bg-background px-3 py-2.5 text-sm font-medium text-foreground border border-border">
              {email}
            </code>
            <Button
              type="button"
              onClick={handleCopy}
              variant="outline"
              className="shrink-0 border-gold/40 text-gold hover:bg-gold/10"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="ml-1.5">{copied ? "Đã chép" : "Chép"}</span>
            </Button>
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Duyệt xong bạn bấm &quot;Kiểm tra lại&quot; là vào học được ngay.
        </p>

        <div className="flex gap-3">
          <Button
            type="button"
            onClick={() => window.location.reload()}
            className="flex-1 bg-gold hover:bg-gold-medium text-gold-black font-semibold"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Kiểm tra lại
          </Button>
          <Button type="button" onClick={handleSignOut} variant="outline" className="shrink-0">
            <LogOut className="h-4 w-4 mr-1.5" />
            Đăng xuất
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
