import Link from "next/link";
import { Headphones } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16">
        <Link href="/" className="mb-10 flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Headphones className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">TOEIC Mastery</span>
        </Link>
        <div className="mx-auto w-full max-w-sm">{children}</div>
      </div>

      <div className="relative hidden overflow-hidden bg-sidebar lg:block">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(60% 50% at 20% 20%, color-mix(in oklab, var(--primary) 35%, transparent), transparent), radial-gradient(50% 40% at 80% 70%, color-mix(in oklab, var(--info) 30%, transparent), transparent)",
          }}
        />
        <div className="relative flex h-full flex-col items-start justify-end gap-4 p-16 text-sidebar-foreground">
          <p className="text-3xl leading-snug font-semibold text-white">
            Chinh phục 990 điểm TOEIC <br /> với lộ trình cá nhân hóa.
          </p>
          <p className="max-w-md text-sm text-sidebar-muted-foreground">
            Luyện đề sát thực tế, từ điển thông minh ngay trên trang, và phân tích điểm yếu theo từng Part —
            tất cả trong một nền tảng.
          </p>
        </div>
      </div>
    </div>
  );
}
