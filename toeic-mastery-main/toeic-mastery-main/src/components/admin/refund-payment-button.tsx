"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { markPaymentRefundedAction } from "@/lib/actions/admin-payments";

export function RefundPaymentButton({ paymentId }: { paymentId: string }) {
  const [pending, startTransition] = React.useTransition();
  const router = useRouter();

  function handleClick() {
    if (!window.confirm("Xác nhận hoàn tiền giao dịch này? Mọi hoa hồng liên quan chưa thanh toán sẽ bị huỷ.")) return;

    startTransition(async () => {
      const result = await markPaymentRefundedAction(paymentId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã đánh dấu hoàn tiền");
      router.refresh();
    });
  }

  return (
    <Button type="button" size="sm" variant="outline" disabled={pending} onClick={handleClick}>
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Undo2 className="size-3.5" />}
      Hoàn tiền
    </Button>
  );
}
