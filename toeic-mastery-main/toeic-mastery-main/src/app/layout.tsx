import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/providers";

const GA_MEASUREMENT_ID = "G-GDBZE58K1G";
const COOKIEHUB_SRC = "https://cdn.cookiehub.eu/c2/51a8864f.js";

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
      <body className="min-h-full bg-background font-sans text-foreground">
        {/* beforeInteractive scripts are always injected as high as possible in
            <head>, ahead of everything else, regardless of where they sit in
            this tree — that's what a cookie consent manager needs (load before
            any other tracking script gets a chance to run). */}
        <Script src={COOKIEHUB_SRC} strategy="beforeInteractive" />
        <Script id="cookiehub-init" strategy="beforeInteractive">
          {`
            document.addEventListener("DOMContentLoaded", function (event) {
              var cpm = {};
              window.cookiehub.load(cpm);
            });
          `}
        </Script>
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
