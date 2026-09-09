"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function PublishButton({
  action,
  successMessage = "Đã xuất bản",
}: {
  action: () => Promise<{ error?: string }>;
  successMessage?: string;
}) {
  const [pending, startTransition] = React.useTransition();
  const router = useRouter();

  function handlePublish() {
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

  return (
    <Button type="button" size="sm" variant="outline" disabled={pending} onClick={handlePublish}>
      {pending && <Loader2 className="size-3 animate-spin" />}
      Xuất bản
    </Button>
  );
}
