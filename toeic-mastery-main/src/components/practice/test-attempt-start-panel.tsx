"use client";

import * as React from "react";
import { BookOpen, CheckCircle2, Clock, FileText, Headphones, Loader2 } from "lucide-react";
import { startAttemptAction } from "@/lib/actions/attempts";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PART_META } from "@/lib/constants/toeic";
import { TEST_PART_VALUES } from "@/lib/validations/admin";
import { cn } from "@/lib/utils";
import type { TestPart } from "@/generated/prisma/enums";

interface SectionCount {
  part: TestPart;
  questionCount: number;
}

/**
 * Replaces the old "Bắt đầu thi / Luyện tập" two-button choice with a full
 * scope picker: Full Test, Listening-only, Reading-only, or a hand-picked
 * set of Parts — under either a timed "Luyện thi" (EXAM) or untimed-deadline
 * "Luyện tập" (PRACTICE) tab. Each option calls startAttemptAction directly
 * (a server action can be invoked straight from client code; its own
 * redirect() at the end still navigates to /exam/[id] same as before) —
 * everything here is just client-side selection state feeding that one call.
 */
export function TestAttemptStartPanel({ testId, sections, durationMinutes }: { testId: string; sections: SectionCount[]; durationMinutes: number }) {
  return (
    <div data-tour="practice-mode-buttons">
      <Tabs defaultValue="EXAM">
        <TabsList>
          <TabsTrigger value="EXAM">Luyện thi</TabsTrigger>
          <TabsTrigger value="PRACTICE">Luyện tập</TabsTrigger>
        </TabsList>
        <TabsContent value="EXAM" className="mt-4 flex flex-col gap-4">
          <ModeBanner
            icon={<Clock className="size-4" />}
            text="Tính giờ như thi thật, không xem đáp án cho tới khi nộp bài — chọn Full Test, riêng Listening/Reading, hoặc tự chọn Part bên dưới."
          />
          <ModeOptions testId={testId} mode="EXAM" sections={sections} durationMinutes={durationMinutes} />
        </TabsContent>
        <TabsContent value="PRACTICE" className="mt-4 flex flex-col gap-4">
          <ModeBanner
            icon={<CheckCircle2 className="size-4" />}
            text="Xem đáp án và giải thích ngay sau mỗi câu"
          />
          <ModeOptions testId={testId} mode="PRACTICE" sections={sections} durationMinutes={durationMinutes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ModeBanner({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-foreground/80">
      <span className="mt-0.5 text-primary">{icon}</span>
      <p>{text}</p>
    </div>
  );
}

function ModeOptions({
  testId,
  mode,
  sections,
  durationMinutes,
}: {
  testId: string;
  mode: "EXAM" | "PRACTICE";
  sections: SectionCount[];
  durationMinutes: number;
}) {
  const [pendingKey, setPendingKey] = React.useState<string | null>(null);
  const [selectedParts, setSelectedParts] = React.useState<TestPart[]>([]);

  const countByPart = React.useMemo(() => new Map(sections.map((s) => [s.part, s.questionCount])), [sections]);
  const availableParts = TEST_PART_VALUES.filter((p) => (countByPart.get(p) ?? 0) > 0);
  const listeningParts = availableParts.filter((p) => PART_META[p].skill === "LISTENING");
  const readingParts = availableParts.filter((p) => PART_META[p].skill === "READING");
  const totalQuestions = availableParts.reduce((sum, p) => sum + (countByPart.get(p) ?? 0), 0);

  function countFor(parts: TestPart[]) {
    return parts.reduce((sum, p) => sum + (countByPart.get(p) ?? 0), 0);
  }
  // Prorated by question share of the full test — this test's own actual
  // composition, not a hardcoded "Listening = 45 min" assumption that would
  // only hold for a standard 200-question full mock.
  function minutesFor(count: number) {
    return totalQuestions > 0 ? Math.max(1, Math.round((durationMinutes * count) / totalQuestions)) : 0;
  }

  async function start(key: string, parts: TestPart[]) {
    if (pendingKey) return;
    setPendingKey(key);
    try {
      await startAttemptAction(testId, mode, parts);
    } finally {
      // Only reached if the action returned without redirecting (e.g. a
      // limit/Pro-required redirect elsewhere on this same page) — a
      // successful start navigates away before this ever runs.
      setPendingKey(null);
    }
  }

  const listeningCount = countFor(listeningParts);
  const readingCount = countFor(readingParts);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <PresetCard
          icon={<FileText className="size-4" />}
          title="Full Test"
          description="Làm như thi thật"
          durationLabel={`${durationMinutes} phút`}
          countLabel={`${totalQuestions} câu`}
          onClick={() => start("full", [])}
          loading={pendingKey === "full"}
          disabled={!!pendingKey || totalQuestions === 0}
        />
        <PresetCard
          icon={<Headphones className="size-4" />}
          title="Thi Listening"
          description="Thi riêng phần nghe"
          durationLabel={`${minutesFor(listeningCount)} phút`}
          countLabel={`${listeningCount} câu`}
          onClick={() => start("listening", listeningParts)}
          loading={pendingKey === "listening"}
          disabled={!!pendingKey || listeningCount === 0}
        />
        <PresetCard
          icon={<BookOpen className="size-4" />}
          title="Thi Reading"
          description="Thi riêng phần đọc"
          durationLabel={`${minutesFor(readingCount)} phút`}
          countLabel={`${readingCount} câu`}
          onClick={() => start("reading", readingParts)}
          loading={pendingKey === "reading"}
          disabled={!!pendingKey || readingCount === 0}
        />
      </div>

      {availableParts.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Thi theo Part</p>
              <p className="text-xs text-muted-foreground">Chọn Part cụ thể để thi thử</p>
            </div>
            <Button size="sm" onClick={() => start("custom", selectedParts)} disabled={!!pendingKey || selectedParts.length === 0}>
              {pendingKey === "custom" && <Loader2 className="size-4 animate-spin" />}
              Bắt đầu
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {availableParts.map((p) => {
              const checked = selectedParts.includes(p);
              return (
                <label
                  key={p}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm transition-colors",
                    checked ? "border-primary/50 bg-primary/5" : "border-border hover:bg-muted/50"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => setSelectedParts((prev) => (v ? [...prev, p] : prev.filter((x) => x !== p)))}
                    />
                    {PART_META[p].shortLabel}
                  </span>
                  <span className="text-xs text-muted-foreground">{countByPart.get(p)} câu</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PresetCard({
  icon,
  title,
  description,
  durationLabel,
  countLabel,
  onClick,
  loading,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  durationLabel: string;
  countLabel: string;
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-start gap-1.5 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:bg-card"
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</span>
      <span className="text-sm font-semibold">{title}</span>
      <span className="text-xs text-muted-foreground">{description}</span>
      <span className="mt-1 flex items-center gap-1.5 text-xs">
        <span className="flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 font-medium text-primary-foreground">
          {loading && <Loader2 className="size-3 animate-spin" />}
          Bắt đầu
        </span>
        <span className="text-muted-foreground">
          {durationLabel} · {countLabel}
        </span>
      </span>
    </button>
  );
}
