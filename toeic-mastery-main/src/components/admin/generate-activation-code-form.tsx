"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateActivationCodeAction } from "@/lib/actions/admin-payments";
import { PRO_PLANS, type ProPlanKey } from "@/lib/constants/billing";

export function GenerateActivationCodeForm() {
  const [planKey, setPlanKey] = React.useState<ProPlanKey>("THREE_MONTHS");
  const [pending, startTransition] = React.useTransition();
  const [generated, setGenerated] = React.useState<string | null>(null);
  const router = useRouter();

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateActivationCodeAction(PRO_PLANS[planKey].durationDays);
      if (result.error || !result.code) {
        toast.error(result.error ?? "Không tạo được mã");
        return;
      }
      setGenerated(result.code);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={planKey} onValueChange={(v) => setPlanKey(v as ProPlanKey)}>
        <SelectTrigger size="sm" className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(PRO_PLANS) as ProPlanKey[]).map((key) => (
            <SelectItem key={key} value={key}>
              {PRO_PLANS[key].label} ({PRO_PLANS[key].durationDays} ngày)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="button" size="sm" variant="outline" disabled={pending} onClick={handleGenerate}>
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
        Tạo mã kích hoạt
      </Button>
      {generated && (
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(generated);
            toast.success("Đã sao chép");
          }}
          className="flex items-center gap-1.5 rounded-lg bg-success/10 px-3 py-1.5 font-mono text-xs font-medium text-success"
        >
          {generated}
          <Copy className="size-3" />
        </button>
      )}
    </div>
  );
}
