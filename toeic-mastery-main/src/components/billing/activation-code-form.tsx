"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { redeemActivationCodeAction } from "@/lib/actions/billing";

export function ActivationCodeForm() {
  const [code, setCode] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    startTransition(async () => {
      const result = await redeemActivationCodeAction(code);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Kích hoạt Pro thành công!");
      setCode("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Nhập mã kích hoạt..." className="flex-1" disabled={pending} />
      <Button type="submit" variant="outline" disabled={pending || !code.trim()}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Áp dụng
      </Button>
    </form>
  );
}
