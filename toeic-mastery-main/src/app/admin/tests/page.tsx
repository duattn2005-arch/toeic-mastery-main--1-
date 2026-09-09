import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PublishButton } from "@/components/admin/publish-button";
import { publishTestAction } from "@/lib/actions/admin-tests";

export const metadata: Metadata = { title: "Quản lý đề thi" };

export default async function AdminTestsPage() {
  const tests = await db.test.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questions: true, attempts: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quản lý đề thi</h1>
          <p className="mt-1 text-sm text-muted-foreground">{tests.length} đề thi</p>
        </div>
        <Button asChild>
          <Link href="/admin/tests/new">
            <Plus className="size-4" /> Tạo đề thi
          </Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Tiêu đề</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Câu hỏi</th>
              <th className="px-4 py-3 font-medium">Lượt làm</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {tests.map((test) => (
              <tr key={test.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{test.title}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={test.status === "PUBLISHED" ? "default" : "secondary"}>{test.status}</Badge>
                    {test.status !== "PUBLISHED" && (
                      <PublishButton action={publishTestAction.bind(null, test.id)} successMessage="Đã xuất bản đề thi" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{test._count.questions}</td>
                <td className="px-4 py-3 text-muted-foreground">{test._count.attempts}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/tests/${test.id}`} className="text-primary hover:underline">
                    Chỉnh sửa
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
