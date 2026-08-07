// Web Push phía client: đăng ký service worker + push subscription,
// lưu vào bảng push_subscriptions (supabase-push.sql) để /api/push/send bắn noti.
// VAPID public key KHÔNG bí mật; private key nằm ở app/api/push/send/route.ts.
import { supabase } from "./supabase";

export const VAPID_PUBLIC_KEY =
  "BK2liSEe2nfi6ma-xmtatzJny3mPFL74h2SriSJ8_pPFpO6Qyncbnm8CIuCd2rXRDBXP606CkfpyWutqFyiBplg";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

// Gọi sau khi Notification.permission === "granted". An toàn gọi lại nhiều lần
// (upsert theo endpoint) — mỗi thiết bị/trình duyệt là một subscription riêng.
export async function registerPushSubscription(userId: string): Promise<void> {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission !== "granted") return;
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    const sub =
      (await reg.pushManager.getSubscription()) ||
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      }));
    await supabase.from("push_subscriptions").upsert(
      { user_id: userId, endpoint: sub.endpoint, subscription: sub.toJSON() },
      { onConflict: "endpoint" }
    );
  } catch (err) {
    // Không chặn app vì push lỗi (trình duyệt cũ, user chặn quyền...)
    console.error("registerPushSubscription:", err);
  }
}
