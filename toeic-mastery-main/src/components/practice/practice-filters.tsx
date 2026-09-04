"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORY_TABS = [
  { value: "ALL", label: "Tất cả" },
  { value: "FULL", label: "Full Test" },
  { value: "LISTENING", label: "Listening" },
  { value: "READING", label: "Reading" },
  { value: "PART1", label: "Part 1" },
  { value: "PART2", label: "Part 2" },
  { value: "PART3", label: "Part 3" },
  { value: "PART4", label: "Part 4" },
  { value: "PART5", label: "Part 5" },
  { value: "PART6", label: "Part 6" },
  { value: "PART7", label: "Part 7" },
];

export function PracticeFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const category = searchParams.get("category") ?? "ALL";
  const difficulty = searchParams.get("difficulty") ?? "ALL";
  const completion = searchParams.get("completion") ?? "ALL";
  const sort = searchParams.get("sort") ?? "NEWEST";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "ALL" || !value) params.delete(key);
    else params.set(key, value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div data-tour="practice-filters" className="flex flex-col gap-3">
      <div className="scrollbar-thin flex gap-1.5 overflow-x-auto pb-1">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => updateParam("category", tab.value)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              category === tab.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={difficulty} onValueChange={(v) => updateParam("difficulty", v)}>
          <SelectTrigger size="sm" className="w-[150px]">
            <SelectValue placeholder="Độ khó" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Mọi độ khó</SelectItem>
            <SelectItem value="EASY">Dễ</SelectItem>
            <SelectItem value="MEDIUM">Trung bình</SelectItem>
            <SelectItem value="HARD">Khó</SelectItem>
          </SelectContent>
        </Select>

        <Select value={completion} onValueChange={(v) => updateParam("completion", v)}>
          <SelectTrigger size="sm" className="w-[170px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
            <SelectItem value="COMPLETED">Đã hoàn thành</SelectItem>
            <SelectItem value="NOT_COMPLETED">Chưa hoàn thành</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => updateParam("sort", v)}>
          <SelectTrigger size="sm" className="w-[150px]">
            <SelectValue placeholder="Sắp xếp" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NEWEST">Mới nhất</SelectItem>
            <SelectItem value="RATING">Đánh giá cao</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
