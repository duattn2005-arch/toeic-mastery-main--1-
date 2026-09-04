"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  approveWithdrawalAction,
  markWithdrawalPaidAction,
  rejectWithdrawalAction,
} from "@/lib/actions/admin-withdrawals";
import type { WithdrawalStatus } from "@/generated/prisma/enums";
import type { ActionResult } from "@/lib/actions/admin-withdrawals";

export function WithdrawalActions({ withdrawalId, status }: { withdrawalId: string; status: WithdrawalStatus }) {
  const [pending, startTransition] = React.useTransition();
  const router = useRouter();

  function handle(action: () => Promise<ActionResult>, successMessage: string) {
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(successMessage);
      router.refresh();
    });
  }

  if (status === "PENDING") {
    return (
      <div className="flex justify-end gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => handle(() => approveWithdrawalAction(withdrawalId), "Đã duyệt yêu cầu rút tiền")}
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
          Duyệt
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          disabled={pending}
          onClick={() => handle(() => rejectWithdrawalAction(withdrawalId), "Đã từ chối yêu cầu")}
        >
          <X className="size-3.5" />
        </Button>
      </div>
    );
  }

  if (status === "APPROVED") {
    return (
      <div className="flex justify-end gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => handle(() => markWithdrawalPaidAction(withdrawalId), "Đã đánh dấu thanh toán")}
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
          Đã thanh toán
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          disabled={pending}
          onClick={() => handle(() => rejectWithdrawalAction(withdrawalId), "Đã từ chối yêu cầu")}
        >
          <X className="size-3.5" />
        </Button>
      </div>
    );
  }

  return null;
}
