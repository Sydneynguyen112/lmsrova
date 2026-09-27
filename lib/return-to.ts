// Đăng nhập xong quay lại đúng trang đang mở dở (vd link form tốt nghiệp mentor gửi qua Zalo).
// Trang cần đăng nhập đẩy sang /sign-in?next=<đường dẫn>; trang đăng nhập cất vào sessionStorage để
// còn nguyên sau khi đi vòng qua Google hoặc sang trang đăng ký.
const KEY = "rova_return_to";

// Chỉ nhận đường dẫn trong chính trang này — chặn link lừa đẩy sang trang ngoài
function safePath(path: string | null): string | null {
  return path && path.startsWith("/") && !path.startsWith("//") && !path.includes("\\") ? path : null;
}

export function signInHref(path: string): string {
  return `/sign-in?next=${encodeURIComponent(path)}`;
}

/** Gọi khi mở trang đăng nhập / đăng ký: cất ?next= nếu có. */
export function rememberReturnTo(): void {
  if (typeof window === "undefined") return;
  const next = safePath(new URLSearchParams(window.location.search).get("next"));
  try {
    if (next) sessionStorage.setItem(KEY, next);
  } catch {}
}

/** Gọi ngay sau khi đăng nhập thành công: trả đường dẫn cần quay lại (rồi xoá), không có thì null. */
export function takeReturnTo(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const next = safePath(sessionStorage.getItem(KEY));
    sessionStorage.removeItem(KEY);
    return next;
  } catch {
    return null;
  }
}
