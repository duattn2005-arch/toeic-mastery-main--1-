"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileDown, Gamepad2, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AddCustomWordsDialog } from "@/components/vocabulary/add-custom-words-dialog";
import { setSavedWordCategoryAction } from "@/lib/actions/dictionary";
import { cn } from "@/lib/utils";

export interface SavedWordRow {
  id: string;
  word: string;
  isFavorite: boolean;
  category: string | null;
  createdAt: string;
}

const UNCATEGORIZED = "__uncategorized__";
const ALL = "__all__";

function dateBucketKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dateBucketLabel(iso: string): string {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.getTime() === today.getTime()) return "Hôm nay";
  if (d.getTime() === yesterday.getTime()) return "Hôm qua";
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function SavedWordsManager({ words, categories }: { words: SavedWordRow[]; categories: string[] }) {
  const router = useRouter();
  const [filter, setFilter] = React.useState<string>(ALL);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [exportOpen, setExportOpen] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);

  const filtered = words.filter((w) => {
    if (filter === ALL) return true;
    if (filter === UNCATEGORIZED) return !w.category;
    return w.category === filter;
  });

  const groups = React.useMemo(() => {
    const map = new Map<string, { label: string; items: SavedWordRow[] }>();
    for (const w of filtered) {
      const key = dateBucketKey(w.createdAt);
      const existing = map.get(key);
      if (existing) existing.items.push(w);
      else map.set(key, { label: dateBucketLabel(w.createdAt), items: [w] });
    }
    return [...map.values()];
  }, [filtered]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleGroup(items: SavedWordRow[]) {
    const fullySelected = items.every((w) => selected.has(w.id));
    setSelected((prev) => {
      const next = new Set(prev);
      for (const w of items) {
        if (fullySelected) next.delete(w.id);
        else next.add(w.id);
      }
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(filtered.map((w) => w.id)));
  }

  function changeFilter(value: string) {
    setFilter(value);
    setSelected(new Set());
  }

  async function moveToCategory(word: string, category: string) {
    await setSavedWordCategoryAction(word, category === UNCATEGORIZED ? null : category);
    router.refresh();
  }

  const studyHref =
    selected.size > 0
      ? `/bookmarks/study?words=${[...selected].join(",")}`
      : filter === ALL
        ? "/bookmarks/study"
        : filter === UNCATEGORIZED
          ? "/bookmarks/study?category=none"
          : `/bookmarks/study?category=${encodeURIComponent(filter)}`;
  const studyLabel = selected.size > 0 ? `Học ${selected.size} từ đã chọn` : "Học và Chơi";

  const exportWordIds = selected.size > 0 ? [...selected] : filtered.map((w) => w.id);
  const exportPreviewWords = words.filter((w) => exportWordIds.includes(w.id));

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/vocabulary/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordIds: exportWordIds }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Xuất file thất bại, vui lòng thử lại");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tu-vung-cua-toi.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setExportOpen(false);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm" className="w-fit">
          <Link href={studyHref}>
            <Gamepad2 className="size-4" /> {studyLabel}
          </Link>
        </Button>
        <AddCustomWordsDialog existingCategories={categories} />
        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setExportOpen(true)}>
          <FileDown className="size-4" /> Xuất file
        </Button>

        {categories.length > 0 && (
          <select
            value={filter}
            onChange={(e) => changeFilter(e.target.value)}
            className="ml-auto h-9 rounded-lg border border-input bg-card px-3 text-sm"
          >
            <option value={ALL}>Tất cả chủ đề ({words.length})</option>
            <option value={UNCATEGORIZED}>Chưa phân loại ({words.filter((w) => !w.category).length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c} ({words.filter((w) => w.category === c).length})
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center gap-3 text-sm">
        <button type="button" onClick={selectAll} className="font-medium text-primary hover:underline">
          Chọn tất cả ({filtered.length})
        </button>
        {selected.size > 0 && (
          <button type="button" onClick={() => setSelected(new Set())} className="text-muted-foreground hover:underline">
            Bỏ chọn ({selected.size})
          </button>
        )}
      </div>

      <div className="flex flex-col gap-5">
        {groups.map((group) => {
          const groupSelected = group.items.every((w) => selected.has(w.id));
          return (
            <div key={group.label}>
              <label className="mb-2 flex w-fit items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={groupSelected}
                  onChange={() => toggleGroup(group.items)}
                  className="size-4 accent-primary"
                  aria-label={`Chọn nhóm ${group.label}`}
                />
                {group.label}
                <span className="font-normal text-muted-foreground">({group.items.length})</span>
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((w) => (
                  <div
                    key={w.id}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                      selected.has(w.id) ? "border-primary bg-accent" : "border-border bg-card"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(w.id)}
                      onChange={() => toggleSelect(w.id)}
                      className="size-4 shrink-0 accent-primary"
                      aria-label={`Chọn ${w.word}`}
                    />
                    <Link href={`/dictionary/${encodeURIComponent(w.word)}`} className="min-w-0 flex-1 truncate hover:text-primary">
                      {w.word}
                    </Link>
                    {w.isFavorite && <Star className="size-3.5 shrink-0 fill-current text-warning" />}
                    <select
                      value={w.category ?? UNCATEGORIZED}
                      onChange={(e) => void moveToCategory(w.word, e.target.value)}
                      className="w-24 shrink-0 rounded-md border border-input bg-transparent text-[11px] text-muted-foreground"
                      aria-label={`Chủ đề của ${w.word}`}
                    >
                      <option value={UNCATEGORIZED}>Chưa phân loại</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xuất từ vựng ra file PDF</DialogTitle>
            <DialogDescription>
              {selected.size > 0
                ? `Bạn đã chọn ${exportWordIds.length} từ để xuất.`
                : `Chưa chọn từ nào — sẽ xuất tất cả ${exportWordIds.length} từ đang hiển thị.`}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-56 rounded-lg border border-border">
            <div className="flex flex-col divide-y divide-border">
              {exportPreviewWords.map((w, i) => (
                <div key={w.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                  <span className="w-6 shrink-0 text-xs text-muted-foreground">{i + 1}</span>
                  <span className="truncate">{w.word}</span>
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExportOpen(false)} disabled={exporting}>
              Huỷ
            </Button>
            <Button onClick={handleExport} disabled={exporting || exportWordIds.length === 0}>
              {exporting && <Loader2 className="size-4 animate-spin" />}
              Đồng ý, tải PDF ({exportWordIds.length} từ)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
