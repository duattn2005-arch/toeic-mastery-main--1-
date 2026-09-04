"use client";

import * as React from "react";
import { ConfettiBurst } from "@/components/shared/confetti-burst";

export function ResultCelebration({ attemptId, achievedTarget }: { attemptId: string; achievedTarget: boolean }) {
  const [show, setShow] = React.useState(() => {
    if (typeof window === "undefined" || !achievedTarget) return false;
    const key = `toeic-mastery:celebrated:${attemptId}`;
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, "1");
    return true;
  });

  React.useEffect(() => {
    if (!show) return;
    const timeout = setTimeout(() => setShow(false), 2000);
    return () => clearTimeout(timeout);
  }, [show]);

  if (!show) return null;
  return <ConfettiBurst />;
}
