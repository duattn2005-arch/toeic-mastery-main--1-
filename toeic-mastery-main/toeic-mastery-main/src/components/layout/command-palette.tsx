"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BookA, ClipboardList, GraduationCap, SpellCheck2 } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { SearchResultItem } from "@/app/api/search/route";

const ICONS: Record<SearchResultItem["type"], React.ElementType> = {
  test: ClipboardList,
  vocabulary: GraduationCap,
  grammar: SpellCheck2,
  dictionary: BookA,
};

async function fetchResults(q: string): Promise<SearchResultItem[]> {
  if (q.trim().length < 2) return [];
  const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { results: SearchResultItem[] };
  return data.results;
}

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = React.useState("");
  const router = useRouter();

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["global-search", query],
    queryFn: () => fetchResults(query),
    enabled: open,
  });

  function handleSelect(href: string) {
    onOpenChange(false);
    setQuery("");
    router.push(href);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Tìm kiếm" description="Tìm đề thi, từ vựng, ngữ pháp, từ điển">
      <CommandInput placeholder="Tìm đề thi, từ vựng, ngữ pháp..." value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>{isFetching ? "Đang tìm..." : "Không tìm thấy kết quả."}</CommandEmpty>
        <CommandGroup heading="Kết quả">
          {results.map((item, i) => {
            const Icon = ICONS[item.type];
            return (
              <CommandItem key={`${item.type}-${item.href}-${i}`} onSelect={() => handleSelect(item.href)}>
                <Icon className="size-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span>{item.title}</span>
                  {item.subtitle && <span className="text-xs text-muted-foreground">{item.subtitle}</span>}
                </div>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
