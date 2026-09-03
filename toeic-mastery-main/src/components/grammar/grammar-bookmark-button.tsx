"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleGrammarBookmarkAction } from "@/lib/actions/bookmarks";

export function GrammarBookmarkButton({ grammarLessonId, initialBookmarked }: { grammarLessonId: string; initialBookmarked: boolean }) {
  const [bookmarked, setBookmarked] = React.useState(initialBookmarked);
  const [pending, startTransition] = React.useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await toggleGrammarBookmarkAction(grammarLessonId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setBookmarked(!!result.bookmarked);
    });
  }

  return (
    <Button variant={bookmarked ? "default" : "outline"} size="sm" disabled={pending} onClick={handleClick}>
      <Star className={cn("size-3.5", bookmarked && "fill-current")} />
      {bookmarked ? "Đã lưu" : "Lưu bài học"}
    </Button>
  );
}
