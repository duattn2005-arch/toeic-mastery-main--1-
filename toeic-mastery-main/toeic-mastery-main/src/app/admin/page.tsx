import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, BookOpen, ClipboardList, Users } from "lucide-react";
import { db } from "@/lib/db";
import { StatCard } from "@/components/shared/stat-card";

export const metadata: Metadata = { title: "Quản trị" };

export default async function AdminDashboardPage() {
  const [testCount, questionCount, userCount, openReports] = await Promise.all([
    db.test.count(),
    db.question.count(),
    db.profile.count(),
    db.questionReport.count({ where: { status: "OPEN" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bảng điều khiển quản trị</h1>
        <p className="mt-1 text-sm text-muted-foreground">Quản lý đề thi, câu hỏi, từ vựng và người dùng.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={ClipboardList} label="Đề thi" value={testCount} />
        <StatCard icon={BookOpen} label="Câu hỏi" value={questionCount} />
        <StatCard icon={Users} label="Người dùng" value={userCount} />
        <StatCard icon={AlertTriangle} label="Báo lỗi chưa xử lý" value={openReports} accent="warning" />
      </div>

      {openReports > 0 && (
        <Link
          href="/admin/analytics"
          className="flex items-center justify-between rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm font-medium hover:bg-warning/15"
        >
          Có {openReports} báo cáo lỗi câu hỏi cần xem xét
          <span className="text-warning">Xem ngay →</span>
        </Link>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <QuickLink href="/admin/tests/new" title="Tạo đề thi mới" description="Thiết lập đề thi và cấu trúc Part." />
        <QuickLink href="/admin/questions/new" title="Thêm câu hỏi" description="Nhập câu hỏi thủ công hoặc import JSON." />
        <QuickLink href="/admin/vocabulary" title="Quản lý từ vựng" description="Thêm từ vựng theo chủ đề." />
      </div>
    </div>
  );
}

function QuickLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-colors hover:border-primary/40">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </Link>
  );
}
