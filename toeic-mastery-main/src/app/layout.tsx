import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/providers";

const GA_MEASUREMENT_ID = "G-GDBZE58K1G";
const SECURE_PRIVACY_SRC = "https://app.secureprivacy.ai/script/6a9942ee4e74644db5656e70.js";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TOEIC Mastery — Nền tảng luyện thi TOEIC toàn diện",
    template: "%s — TOEIC Mastery",
  },
  description:
    "Luyện đề TOEIC sát thực tế, Listening & Reading đầy đủ 7 Part, từ điển thông minh, flashcard lặp lại ngắt quãng và phân tích điểm yếu theo từng kỹ năng.",
};

export const viewport: Viewport = {
  themeColor: "#5b4bf0",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-background font-sans text-foreground" suppressHydrationWarning>
        {/* beforeInteractive scripts are always injected as high as possible in
            <head>, ahead of everything else, regardless of where they sit in
            this tree — that's what a cookie consent manager needs (load before
            any other tracking script gets a chance to run). Secure Privacy
            replaces CookieHub (removed) — running two consent managers at
            once would fight over showing/dismissing their own banners, the
            same class of stacking bug already found and fixed for the
            onboarding tour. */}
        <Script src={SECURE_PRIVACY_SRC} strategy="beforeInteractive" />
        <Providers>{children}</Providers>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
      </body>
    </html>
  );
}
