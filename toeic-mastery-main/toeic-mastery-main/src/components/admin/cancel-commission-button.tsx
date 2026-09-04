"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Ban, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cancelCommissionAction } from "@/lib/actions/admin-withdrawals";

export function CancelCommissionButton({ commissionId }: { commissionId: string }) {
  const [pending, startTransition] = React.useTransition();
  const router = useRouter();

  function handleClick() {
    const note = window.prompt("Lý do huỷ hoa hồng này:");
    if (note === null) return;

    startTransition(async () => {
      const result = await cancelCommissionAction(commissionId, note);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã huỷ hoa hồng");
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="text-destructive hover:text-destructive"
      disabled={pending}
      onClick={handleClick}
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Ban className="size-3.5" />}
      Huỷ
    </Button>
  );
}
