import type { Metadata } from "next";
import { requireUser, isPro } from "@/lib/auth";
import { QuickStudySetup } from "@/components/quick-study/quick-study-setup";

export const metadata: Metadata = { title: "Ôn nhanh" };

export default async function QuickStudyPage() {
  const profile = await requireUser();
  const pro = isPro(profile);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Ôn nhanh</h1>
        <p className="mt-1 text-sm text-muted-foreground">Không cần lên kế hoạch — hệ thống tự chọn bài phù hợp cho khoảng thời gian rảnh của bạn.</p>
      </div>
      <QuickStudySetup isPro={pro} />
    </div>
  );
}
