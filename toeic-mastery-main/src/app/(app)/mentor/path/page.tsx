import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Target } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getLearningPathOverview } from "@/lib/data/learning-path";
import { EmptyState } from "@/components/shared/empty-state";
import { LearningPathOverviewContent } from "@/components/mentor/learning-path-overview-content";

export const metadata: Metadata = { title: "Lộ trình học" };

export default async function LearningPathPage() {
  const profile = await requireUser();
  const overview = await getLearningPathOverview(profile.id);

  return (
    <div className="flex flex-col gap-4">
      <Link href="/mentor" className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Quay lại AI Mentor
      </Link>

      {overview ? (
        <LearningPathOverviewContent data={overview} />
      ) : (
        <EmptyState
          icon={Target}
          title="Chưa có lộ trình học"
          description="Trò chuyện với AI Mentor để đặt mục tiêu và khởi tạo lộ trình cá nhân hóa cho bạn."
          actionLabel="Trò chuyện với AI Mentor"
          actionHref="/mentor"
        />
      )}
    </div>
  );
}
