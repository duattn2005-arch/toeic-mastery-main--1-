"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { startLearningWordsAction } from "@/lib/actions/vocabulary";

export function StartLearningButton({ vocabularyWordIds }: { vocabularyWordIds: string[] }) {
  const [pending, startTransition] = React.useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      const result = await startLearningWordsAction(vocabularyWordIds);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Đã thêm ${vocabularyWordIds.length} từ vào danh sách ôn tập`);
      router.refresh();
    });
  }

  return (
    <Button onClick={handleClick} disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <GraduationCap className="size-4" />}
      Học tất cả từ trong chủ đề này
    </Button>
  );
}
