"use client";

// Thông báo tin nhắn từ mentor khi học viên KHÔNG đứng ở trang Chat:
// badge số tin mới trên tiêu đề tab + Notification hệ điều hành (bấm vào mở chat)
// + nút nổi xin quyền thông báo lần đầu. Gắn trong layout (dashboard).
// Lưu ý: chỉ hoạt động khi LMS đang mở trong một tab trình duyệt (chưa có push khi đóng hẳn).
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/auth";
import { registerPushSubscription } from "@/lib/push";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { ChatMessage } from "@/lib/api-chat";

const DISMISS_KEY = "chat-noti-prompt-dismissed";
const MESSAGES_PATH = "/student/messages";

export function ChatNotifications() {
  const currentUser = useCurrentUser();
  const pathname = usePathname();
  const router = useRouter();
  const [unseen, setUnseen] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);
  const baseTitle = useRef("");

  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default" && !localStorage.getItem(DISMISS_KEY)) {
      setShowPrompt(true);
    }
  }, []);

  // Đã cấp quyền từ trước → đảm bảo thiết bị này có push subscription (Web Push khi đóng web)
  useEffect(() => {
    if (!currentUser || currentUser.role !== "student") return;
    if ("Notification" in window && Notification.permission === "granted") {
      registerPushSubscription(currentUser.id);
    }
  }, [currentUser]);

  // Badge "(N)" trên tiêu đề tab
  useEffect(() => {
    if (!baseTitle.current) baseTitle.current = document.title;
    document.title = unseen > 0 ? `(${unseen}) ${baseTitle.current}` : baseTitle.current;
  }, [unseen]);

  // Quay lại app hoặc mở trang chat → xóa badge
  useEffect(() => {
    const reset = () => setUnseen(0);
    window.addEventListener("focus", reset);
    return () => window.removeEventListener("focus", reset);
  }, []);
  useEffect(() => {
    if (pathname === MESSAGES_PATH) setUnseen(0);
  }, [pathname]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "student") return;
    const userId = currentUser.id;

    const channel: RealtimeChannel = supabase
      .channel("chat-noti")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mentor_messages",
          filter: `student_id=eq.${userId}`,
        },
        (payload) => {
          const m = payload.new as ChatMessage;
          if (m.sender_id === userId) return;
          const dangMoChat =
            pathnameRef.current === MESSAGES_PATH && document.visibilityState === "visible";
          if (dangMoChat) return;
          setUnseen((n) => n + 1);
          if ("Notification" in window && Notification.permission === "granted") {
            const noti = new Notification("Mentor vừa nhắn cho bạn", {
              body: m.content.slice(0, 120),
              tag: "mentor-chat",
            });
            noti.onclick = () => {
              window.focus();
              router.push(MESSAGES_PATH);
              noti.close();
            };
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, router]);

  async function enableNoti() {
    setShowPrompt(false);
    const p = await Notification.requestPermission();
    if (p !== "granted") {
      localStorage.setItem(DISMISS_KEY, "1");
      return;
    }
    if (currentUser) registerPushSubscription(currentUser.id);
  }

  function dismissPrompt() {
    localStorage.setItem(DISMISS_KEY, "1");
    setShowPrompt(false);
  }

  if (!showPrompt || currentUser?.role !== "student") return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-gold/40 bg-card shadow-lg pl-4 pr-2 py-2">
      <Bell className="h-4 w-4 text-gold shrink-0" />
      <button onClick={enableNoti} className="text-sm font-medium text-foreground hover:text-gold">
        Bật thông báo tin nhắn
      </button>
      <button
        onClick={dismissPrompt}
        className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent"
        title="Để sau"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
