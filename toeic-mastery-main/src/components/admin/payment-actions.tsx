"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { approvePaymentAction, rejectPaymentAction } from "@/lib/actions/admin-payments";

export function PaymentActions({ paymentId }: { paymentId: string }) {
  const [pending, startTransition] = React.useTransition();
  const router = useRouter();

  function handle(action: (id: string) => Promise<{ error?: string }>, successMessage: string) {
    startTransition(async () => {
      const result = await action(paymentId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(successMessage);
      router.refresh();
    });
  }

  return (
    <div className="flex justify-end gap-1.5">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => handle(approvePaymentAction, "Đã xác nhận, nâng Pro cho người dùng")}
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
        Xác nhận
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="text-destructive hover:text-destructive"
        disabled={pending}
        onClick={() => handle(rejectPaymentAction, "Đã từ chối giao dịch")}
      >
        <X className="size-3.5" />
      </Button>
    </div>
  );
}
