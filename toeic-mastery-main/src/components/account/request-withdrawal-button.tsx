"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { requestWithdrawalAction } from "@/lib/actions/account";

export function RequestWithdrawalButton({
  disabled,
  withdrawableAmount,
}: {
  disabled: boolean;
  withdrawableAmount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await requestWithdrawalAction();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã gửi yêu cầu rút tiền, vui lòng chờ admin duyệt");
      router.refresh();
    });
  }

  return (
    <Button type="button" onClick={handleClick} disabled={disabled || pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      Yêu cầu rút {withdrawableAmount.toLocaleString("vi-VN")}₫
    </Button>
  );
}
