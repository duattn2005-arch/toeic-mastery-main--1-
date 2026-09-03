"use client";

import * as React from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateUserPlanAction } from "@/lib/actions/admin-users";

export function PlanSelect({ userId, plan }: { userId: string; plan: "FREE" | "PRO" }) {
  const [pending, startTransition] = React.useTransition();
  const [value, setValue] = React.useState(plan);

  function handleChange(next: string) {
    startTransition(async () => {
      const result = await updateUserPlanAction(userId, next as "FREE" | "PRO");
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setValue(next as "FREE" | "PRO");
      toast.success(next === "PRO" ? "Đã nâng cấp Pro (30 ngày)" : "Đã chuyển về Free");
    });
  }

  return (
    <Select value={value} onValueChange={handleChange} disabled={pending}>
      <SelectTrigger size="sm" className="w-28">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="FREE">Free</SelectItem>
        <SelectItem value="PRO">Pro</SelectItem>
      </SelectContent>
    </Select>
  );
}
