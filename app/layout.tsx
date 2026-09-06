import type { Metadata } from "next";
import { Manrope, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Máy chủ CDN chứa file video của Bunny (vz-....b-cdn.net) — dùng để bắt tay sớm.
const BUNNY_CDN_HOSTNAME = process.env.NEXT_PUBLIC_BUNNY_CDN_HOSTNAME;

export const metadata: Metadata = {
  title: "ROVA LMS — Học Trading Chuyên Nghiệp",
  description:
    "Nền tảng học Trading/Forex online từ A-Z cùng mentor chuyên nghiệp. Bắt đầu hành trình trở thành Trader có lợi nhuận.",
  // PWA: cài được lên màn hình chính, nhận Web Push (iPhone bắt buộc cài mới nhận push)
  manifest: "/manifest.json",
  icons: { apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "ROVA LMS" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${manrope.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/*
          Bắt tay sẵn với Bunny ngay từ lúc tải trang. Đo thực tế: mở kết nối tới
          iframe.mediadelivery.net tốn ~720ms (DNS 196 + TCP/TLS 527) — phần này
          nằm chình ình trước mọi thứ khác. Làm sớm ở đây thì lúc khung video mới
          gắn vào, đường đã thông sẵn, đỡ được gần 1 giây.
        */}
        <link rel="preconnect" href="https://iframe.mediadelivery.net" crossOrigin="" />
        <link rel="preconnect" href="https://assets.mediadelivery.net" crossOrigin="" />
        {BUNNY_CDN_HOSTNAME && (
          <link rel="preconnect" href={`https://${BUNNY_CDN_HOSTNAME}`} crossOrigin="" />
        )}
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
