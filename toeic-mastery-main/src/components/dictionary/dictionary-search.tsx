"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function DictionarySearch({ defaultValue = "" }: { defaultValue?: string }) {
  const [value, setValue] = React.useState(defaultValue);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    router.push(`/dictionary/${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} data-tour="dictionary-search" className="flex gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Nhập từ tiếng Anh cần tra, ví dụ: negotiation..."
          className="h-14 rounded-2xl pl-12 text-base"
        />
      </div>
      <Button type="submit" size="lg" className="h-14 rounded-2xl px-6">
        Tra cứu
      </Button>
    </form>
  );
}
