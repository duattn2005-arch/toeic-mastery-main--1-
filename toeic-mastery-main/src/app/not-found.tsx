import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
        <Compass className="size-8" />
      </span>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">404 — Không tìm thấy trang</h1>
        <p className="mt-2 text-sm text-muted-foreground">Trang bạn tìm không tồn tại hoặc đã được di chuyển.</p>
      </div>
      <div className="flex gap-3">
        <Button asChild variant="outline">
          <Link href="/">Về trang chủ</Link>
        </Button>
        <Button asChild>
          <Link href="/dashboard">Về Tổng quan</Link>
        </Button>
      </div>
    </div>
  );
}
