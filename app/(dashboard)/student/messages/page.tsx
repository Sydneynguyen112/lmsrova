"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser, type Profile } from "@/lib/auth";
import {
  getThreadMessages,
  sendChatMessage,
  markThreadRead,
  subscribeToThread,
  type ChatMessage,
} from "@/lib/api-chat";
import { PageTransition } from "@/components/shared/PageTransition";
import { LockedFeature } from "@/components/shared/LockedFeature";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function formatChatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function formatChatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function StudentMessagesPage() {
  const currentUser = useCurrentUser("student");
  const [hasEnrollment, setHasEnrollment] = useState<boolean | null>(null);
  const [mentor, setMentor] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const appendMessage = useCallback((m: ChatMessage) => {
    setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    let unsubscribe = () => {};
    let cancelled = false;

    async function load() {
      const { data: enroll } = await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", currentUser!.id)
        .limit(1);
      if (cancelled) return;
      setHasEnrollment((enroll ?? []).length > 0);

      if (currentUser!.mentor_id) {
        const { data: m } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser!.mentor_id)
          .single();
        if (!cancelled) setMentor((m as Profile) ?? null);
      }

      const msgs = await getThreadMessages(currentUser!.id);
      if (cancelled) return;
      setMessages(msgs);
      markThreadRead(currentUser!.id, currentUser!.id);

      unsubscribe = subscribeToThread(currentUser!.id, (m) => {
        appendMessage(m);
        if (m.sender_id !== currentUser!.id) markThreadRead(currentUser!.id, currentUser!.id);
      });
    }
    load();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [currentUser, appendMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function handleSend() {
    if (!currentUser || !draft.trim() || sending) return;
    setSending(true);
    try {
      const sent = await sendChatMessage(currentUser.id, currentUser.id, draft);
      appendMessage(sent);
      setDraft("");
    } finally {
      setSending(false);
    }
  }

  if (!currentUser || hasEnrollment === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  if (!hasEnrollment) {
    return (
      <LockedFeature
        title="Chat với Mentor"
        description="Tính năng trao đổi với mentor sẽ được mở khi bạn đăng ký khoá học."
      />
    );
  }

  if (!currentUser.mentor_id) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-3">
          <MessageCircle className="h-10 w-10 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Chưa có mentor phụ trách</h1>
          <p className="text-muted-foreground max-w-md">
            Bạn sẽ được gán mentor sau khi vào lộ trình học. Nếu đã học mà chưa thấy, nhắn Zalo CS
            của ROVA để được gán nhé.
          </p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="flex flex-col h-[calc(100vh-7rem)] lg:h-[calc(100vh-5rem)] max-w-3xl mx-auto">
        <div className="flex items-center gap-3 pb-4">
          <Avatar className="h-10 w-10">
            {mentor?.avatar_url && <AvatarImage src={mentor.avatar_url} alt={mentor.full_name} />}
            <AvatarFallback>{mentor?.full_name?.charAt(0) ?? "M"}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-semibold leading-tight">{mentor?.full_name ?? "Mentor của bạn"}</h1>
            <p className="text-xs text-muted-foreground">
              Mentor phụ trách · trao đổi học tập được lưu trong LMS
            </p>
          </div>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden p-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center gap-2 text-muted-foreground">
                <MessageCircle className="h-8 w-8" />
                <p className="text-sm max-w-xs">
                  Chưa có tin nhắn nào. Gửi câu hỏi đầu tiên cho mentor — vướng ở chặng nào, công
                  thức nào, cứ hỏi thẳng nhé!
                </p>
              </div>
            )}
            {messages.map((m, i) => {
              const mine = m.sender_id === currentUser.id;
              const newDay =
                i === 0 || formatChatDay(m.created_at) !== formatChatDay(messages[i - 1].created_at);
              return (
                <div key={m.id}>
                  {newDay && (
                    <div className="text-center text-xs text-muted-foreground py-2">
                      {formatChatDay(m.created_at)}
                    </div>
                  )}
                  <div className={mine ? "flex justify-end" : "flex justify-start"}>
                    <div
                      className={
                        "max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap break-words " +
                        (mine
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted rounded-bl-md")
                      }
                    >
                      {m.content}
                      <div
                        className={
                          "text-[10px] mt-1 " +
                          (mine ? "text-primary-foreground/70 text-right" : "text-muted-foreground")
                        }
                      >
                        {formatChatTime(m.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <div className="border-t p-3 flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Nhắn cho mentor..."
              disabled={sending}
            />
            <Button onClick={handleSend} disabled={!draft.trim() || sending} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
