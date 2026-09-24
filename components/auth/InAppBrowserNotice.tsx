"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { chromeIntentUrl, detectInAppBrowser } from "@/lib/in-app-browser";

const noopSubscribe = () => () => {};

/** Dải nhắc mở bằng Chrome / Safari khi học viên vào từ link trong Zalo, Messenger... */
export function InAppBrowserNotice() {
  // Server render trả chuỗi rỗng → không hiện gì; trên máy học viên mới đọc userAgent (tránh lệch hydrate)
  const ua = useSyncExternalStore(noopSubscribe, () => navigator.userAgent, () => "");
  const browser = useMemo(() => (ua ? detectInAppBrowser(ua) : null), [ua]);
  const [copied, setCopied] = useState(false);

  if (!browser) return null;

  const target = browser.isIOS ? "Safari" : "Chrome";
  const howTo = browser.isIOS
    ? `Bấm nút ⋯ (hoặc biểu tượng la bàn / chia sẻ) ở góc màn hình → chọn "Mở bằng Safari".`
    : `Bấm nút ⋮ ở góc trên bên phải → chọn "Mở bằng trình duyệt" / "Mở trong Chrome".`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Sao chép link này rồi dán vào " + target, window.location.href);
    }
  };

  return (
    <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
      <p className="font-semibold">Bạn đang mở ROVA trong {browser.app}</p>
      <p className="mt-1">
        Để đăng nhập ổn định (nhất là đăng nhập bằng Google), hãy mở trang này bằng{" "}
        <b>{target}</b>. {howTo}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {browser.isAndroid && (
          <a
            href={chromeIntentUrl(window.location.href)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black"
          >
            <ExternalLink size={14} /> Mở bằng Chrome
          </a>
        )}
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/60 px-3 py-1.5 text-xs font-semibold"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Đã sao chép link" : `Sao chép link để dán vào ${target}`}
        </button>
      </div>
    </div>
  );
}
