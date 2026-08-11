import Link from "next/link";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-5 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            ROVA
          </Link>
          <Link
            href="/register"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Quay lại đăng ký
          </Link>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 sm:px-6 py-10">
        {children}
      </main>

      {/* Bottom */}
      <div className="border-t border-border">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} ROVA. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs">
            <Link
              href="/terms"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Điều khoản dịch vụ
            </Link>
            <Link
              href="/privacy"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Chính sách bảo mật
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
