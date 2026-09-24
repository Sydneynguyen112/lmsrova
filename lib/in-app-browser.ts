/**
 * Nhận diện trình duyệt nhúng trong app (Zalo, Messenger, Facebook, Instagram, TikTok...).
 * Google chặn đăng nhập OAuth trong các trình duyệt này (lỗi 403 disallowed_useragent),
 * nên phải nhắc học viên mở link bằng Chrome / Safari.
 */
export type InAppBrowser = {
  /** Tên app hiển thị cho học viên, vd "Zalo" */
  app: string;
  isIOS: boolean;
  isAndroid: boolean;
};

const RULES: { app: string; re: RegExp }[] = [
  { app: "Zalo", re: /zalo/i },
  { app: "Messenger", re: /messenger|FB_IAB\/MESSENGER|FBAN\/Messenger/i },
  { app: "Facebook", re: /FBAN|FBAV|FB_IAB|FBIOS/i },
  { app: "Instagram", re: /instagram/i },
  { app: "TikTok", re: /musical_ly|BytedanceWebview|TikTok/i },
  { app: "Line", re: /\bLine\//i },
];

export function detectInAppBrowser(ua?: string): InAppBrowser | null {
  const agent = ua ?? (typeof navigator !== "undefined" ? navigator.userAgent : "");
  if (!agent) return null;
  const hit = RULES.find((r) => r.re.test(agent));
  if (!hit) return null;
  return {
    app: hit.app,
    isIOS: /iPhone|iPad|iPod/i.test(agent),
    isAndroid: /Android/i.test(agent),
  };
}

/** Link intent mở trang hiện tại bằng Chrome trên Android (nhiều webview cho phép). */
export function chromeIntentUrl(href: string): string {
  const url = new URL(href);
  return `intent://${url.host}${url.pathname}${url.search}#Intent;scheme=${url.protocol.replace(":", "")};package=com.android.chrome;end`;
}

export function inAppGoogleMessage(b: InAppBrowser): string {
  const browser = b.isIOS ? "Safari" : "Chrome";
  return `Google không cho đăng nhập trong ${b.app}. Hãy mở trang này bằng ${browser} rồi bấm lại "Đăng nhập bằng Google" (hoặc đăng nhập bằng email + mật khẩu ngay tại đây).`;
}
