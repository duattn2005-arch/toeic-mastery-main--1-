"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-8" />
      </span>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Đã có lỗi xảy ra</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Rất tiếc, một lỗi không mong muốn đã xảy ra. Vui lòng thử lại hoặc quay về trang chủ.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.push("/")}>
          Về trang chủ
        </Button>
        <Button onClick={reset}>Thử lại</Button>
      </div>
    </div>
  );
}
