"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TEST_PART_VALUES } from "@/lib/validations/admin";
import { PART_META } from "@/lib/constants/toeic";

/** Drives /admin/questions' testId/part/status query params — same
 * URLSearchParams-push pattern as PracticeFilters. A dedicated Test
 * dropdown (rather than a pill bar) since the test list can run long. */
export function AdminQuestionsFilterBar({ tests }: { tests: { id: string; title: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const testId = searchParams.get("testId") ?? "ALL";
  const part = searchParams.get("part") ?? "ALL";
  const status = searchParams.get("status") ?? "ALL";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "ALL") params.delete(key);
    else params.set(key, value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Select value={testId} onValueChange={(v) => updateParam("testId", v)}>
        <SelectTrigger size="sm" className="w-[220px]">
          <SelectValue placeholder="Tất cả đề thi" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Tất cả đề thi</SelectItem>
          {tests.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={part} onValueChange={(v) => updateParam("part", v)}>
        <SelectTrigger size="sm" className="w-[140px]">
          <SelectValue placeholder="Mọi Part" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Mọi Part</SelectItem>
          {TEST_PART_VALUES.map((p) => (
            <SelectItem key={p} value={p}>
              {PART_META[p].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={status} onValueChange={(v) => updateParam("status", v)}>
        <SelectTrigger size="sm" className="w-[160px]">
          <SelectValue placeholder="Mọi trạng thái" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Mọi trạng thái</SelectItem>
          <SelectItem value="DRAFT">Nháp</SelectItem>
          <SelectItem value="PUBLISHED">Xuất bản</SelectItem>
          <SelectItem value="ARCHIVED">Lưu trữ</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
