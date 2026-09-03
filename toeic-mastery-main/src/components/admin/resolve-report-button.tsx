"use client";

import * as React from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { resolveReportAction } from "@/lib/actions/admin-users";

export function ResolveReportButton({ reportId }: { reportId: string }) {
  const [pending, startTransition] = React.useTransition();
  const [resolved, setResolved] = React.useState(false);

  function handleClick() {
    startTransition(async () => {
      const result = await resolveReportAction(reportId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setResolved(true);
    });
  }

  if (resolved) return <span className="text-xs text-success">Đã xử lý</span>;

  return (
    <Button size="sm" variant="outline" onClick={handleClick} disabled={pending}>
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
      Đánh dấu đã xử lý
    </Button>
  );
}
