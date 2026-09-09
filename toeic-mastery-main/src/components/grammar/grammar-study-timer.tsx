"use client";

import * as React from "react";
import { logGrammarStudySessionAction } from "@/lib/actions/grammar";

/** Invisible — tracks time spent on a grammar topic page (reading theory +
 * answering the practice quiz) and logs it on navigating away. Remounts
 * (and flushes) whenever the topic changes because `topicSlug` is a key. */
export function GrammarStudyTimer({ topicSlug }: { topicSlug: string }) {
  React.useEffect(() => {
    const startedAt = Date.now();
    return () => {
      const elapsedSec = Math.round((Date.now() - startedAt) / 1000);
      if (elapsedSec > 0) void logGrammarStudySessionAction(elapsedSec);
    };
  }, [topicSlug]);

  return null;
}
