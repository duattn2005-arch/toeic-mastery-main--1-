"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createUpgradeCheckoutAction } from "@/lib/actions/billing";
import type { ProPlanKey } from "@/lib/constants/billing";

export function UpgradeButton({ planKey, label, variant }: { planKey: ProPlanKey; label: string; variant?: "default" | "outline" }) {
  const [pending, startTransition] = React.useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await createUpgradeCheckoutAction(planKey);
      if (result.error || !result.redirectUrl) {
        toast.error(result.error ?? "Không tạo được giao dịch thanh toán");
        return;
      }
      window.location.href = result.redirectUrl;
    });
  }

  return (
    <Button type="button" onClick={handleClick} disabled={pending} variant={variant}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {label}
    </Button>
  );
}
