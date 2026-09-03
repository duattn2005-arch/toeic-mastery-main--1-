import Link from "next/link";
import { ArrowRight, BookOpenCheck, Clock, ListChecks, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PartPracticeHero({
  partLabel,
  totalQuestions,
  durationMinutes,
  usersCompleted,
  bestScore,
  href,
  ctaLabel,
}: {
  partLabel: string;
  totalQuestions: number;
  durationMinutes: number;
  usersCompleted: number;
  bestScore: number | null;
  href: string;
  ctaLabel: string;
}) {
  return (
    <section className="hero-ambient relative overflow-hidden rounded-3xl p-6 text-white shadow-soft sm:p-8">
      <div className="hero-blob pointer-events-none absolute -top-20 -right-14 size-56 rounded-full bg-white/10 blur-3xl" aria-hidden />
      <div
        className="hero-blob pointer-events-none absolute -bottom-16 -left-10 size-48 rounded-full bg-[#17a673]/25 blur-3xl"
        style={{ animationDelay: "-5s" }}
        aria-hidden
      />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <BookOpenCheck className="size-6" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Ngân hàng câu hỏi luyện tập</p>
            <h2 className="mt-1 text-xl font-semibold sm:text-2xl">{partLabel}</h2>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-white/85">
              <span className="flex items-center gap-1.5">
                <ListChecks className="size-4" /> {totalQuestions} câu
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-4" /> {durationMinutes} phút
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="size-4" /> {usersCompleted} lượt làm
              </span>
              {bestScore !== null && (
                <span className="flex items-center gap-1.5">
                  <Trophy className="size-4" /> Điểm cao nhất {bestScore}
                </span>
              )}
            </div>
          </div>
        </div>

        <Button asChild size="lg" className="shrink-0 bg-white text-primary hover:bg-white/90">
          <Link href={href}>
            {ctaLabel} <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
