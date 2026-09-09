"use client";

import * as React from "react";
import { ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MentorTestRunnerDialog } from "./mentor-test-runner-dialog";

export function MentorTestCard({ mentorTestId, questionCount }: { mentorTestId: string; questionCount: number }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <div className="flex w-full items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <ListChecks className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Bài kiểm tra nhanh</p>
          <p className="text-xs text-muted-foreground">{questionCount} câu — vượt qua để mở khóa phần khó hơn</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          Làm ngay
        </Button>
      </div>
      <MentorTestRunnerDialog mentorTestId={mentorTestId} open={open} onOpenChange={setOpen} />
    </>
  );
}
