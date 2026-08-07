// POST /api/push/send — nhận webhook từ Postgres trigger (pg_net, supabase-push.sql)
// khi có tin nhắn chat mới → bắn Web Push tới thiết bị người nhận.
// Học viên gửi → báo mentor phụ trách + admin (mở rova-ops); mentor/admin gửi → báo học viên (mở LMS).
// Cần 2 biến môi trường trên Vercel (project lmsrova): VAPID_PRIVATE_KEY + PUSH_WEBHOOK_SECRET
// (secret phải trùng với giá trị trong trigger của supabase-push.sql).
import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { supabase } from "@/lib/supabase";
import { VAPID_PUBLIC_KEY } from "@/lib/push";

export const runtime = "nodejs";

const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const WEBHOOK_SECRET = process.env.PUSH_WEBHOOK_SECRET || "";
const LMS_URL = "https://lmsrova.vercel.app";
const OPS_URL = "https://rova-ops.vercel.app";

if (VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails("mailto:moneyisthebest97@gmail.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

interface PushTarget {
  userId: string;
  url: string;
  title: string;
}

export async function POST(req: NextRequest) {
  if (!VAPID_PRIVATE_KEY || !WEBHOOK_SECRET) {
    return NextResponse.json({ error: "push chưa cấu hình env" }, { status: 500 });
  }
  if (req.headers.get("x-push-secret") !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const msg = await req.json().catch(() => null);
  if (!msg?.student_id || !msg?.sender_id) {
    return NextResponse.json({ error: "bad payload" }, { status: 400 });
  }

  const fromStudent = msg.sender_id === msg.student_id;
  const { data: sender } = await supabase
    .from("profiles").select("full_name").eq("id", msg.sender_id).maybeSingle();
  const senderName = sender?.full_name || (fromStudent ? "Học viên" : "Mentor");

  let targets: PushTarget[] = [];
  if (fromStudent) {
    const { data: student } = await supabase
      .from("profiles").select("mentor_id").eq("id", msg.student_id).maybeSingle();
    if (student?.mentor_id) {
      targets.push({
        userId: student.mentor_id,
        url: `${OPS_URL}/mentor/messages`,
        title: `${senderName} nhắn cho bạn`,
      });
    }
    const { data: admins } = await supabase
      .from("profiles").select("id").in("role", ["admin", "super_admin"]);
    for (const a of admins || []) {
      targets.push({
        userId: a.id,
        url: `${OPS_URL}/admin/messages`,
        title: `${senderName} nhắn trên LMS`,
      });
    }
  } else {
    targets.push({
      userId: msg.student_id,
      url: `${LMS_URL}/student/messages`,
      title: `${senderName} vừa nhắn cho bạn`,
    });
  }
  targets = targets.filter((t) => t.userId !== msg.sender_id);
  const ids = Array.from(new Set(targets.map((t) => t.userId)));
  if (ids.length === 0) return NextResponse.json({ sent: 0 });

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, user_id, subscription")
    .in("user_id", ids);

  let sent = 0;
  await Promise.all(
    (subs || []).map(async (s) => {
      const t = targets.find((x) => x.userId === s.user_id);
      if (!t) return;
      try {
        await webpush.sendNotification(
          s.subscription as webpush.PushSubscription,
          JSON.stringify({
            title: t.title,
            body: String(msg.content || "").slice(0, 140),
            url: t.url,
            tag: `chat-${msg.student_id}`,
          })
        );
        sent++;
      } catch (err) {
        // Subscription chết (đổi trình duyệt, thu hồi quyền) → dọn khỏi bảng
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
        }
      }
    })
  );
  return NextResponse.json({ sent });
}
