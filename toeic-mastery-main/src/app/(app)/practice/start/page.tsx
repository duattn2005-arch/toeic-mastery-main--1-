import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { getTrialFullTestId } from "@/lib/data/tests";
import { startAttemptAction } from "@/lib/actions/attempts";
import { LoginRequiredGate } from "@/components/practice/login-required-gate";

export const metadata: Metadata = { title: "Làm bài test thử" };

/**
 * "Làm bài test thử" destination — skips the practice list/detail pages
 * entirely and drops the visitor straight into an attempt (see
 * getTrialFullTestId + startAttemptAction, which itself redirects to
 * /exam/[attemptId]). Public like /practice (see proxy-session.ts) so a
 * logged-out visitor sees the same inline login prompt instead of a hard
 * redirect; once logged in, a fresh visit here goes straight into the test.
 */
export default async function PracticeStartPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Làm bài test thử</h1>
          <p className="mt-1 text-sm text-muted-foreground">Vào thẳng một đề thi thử đầy đủ, không cần chọn đề.</p>
        </div>
        <LoginRequiredGate />
      </div>
    );
  }

  const testId = await getTrialFullTestId();
  if (!testId) redirect("/practice?category=FULL");

  await startAttemptAction(testId);
}
