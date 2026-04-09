import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative">
      {/* Background */}
      <div className="absolute inset-0 gold-gradient-radial" />

      {/* Logo */}
      <div className="relative mb-8">
        <Link href="/" className="text-3xl font-bold gold-gradient-text">
          ROVA
        </Link>
      </div>

      {/* Auth card */}
      <div className="relative w-full max-w-2xl">{children}</div>

      {/* Footer */}
      <p className="relative mt-8 text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} ROVA. All rights reserved.
      </p>
    </div>
  );
}
