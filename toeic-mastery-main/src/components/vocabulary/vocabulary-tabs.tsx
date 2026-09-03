"use client";

import * as React from "react";
import { BookOpenCheck, Layers, Link2, ListChecks, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORY_ORDER, TopicGrid, groupTopicsByCategory, type VocabularyTopicRow } from "@/components/vocabulary/topic-section-grid";
import { PathOverviewContent } from "@/components/vocabulary/path/path-overview-content";
import type { getVocabularyPathOverview } from "@/lib/data/vocabulary-path";

type PathOverview = Awaited<ReturnType<typeof getVocabularyPathOverview>>;

const PATH_TAB = "20-ngay";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  [CATEGORY_ORDER[0]]: Layers,
  [CATEGORY_ORDER[1]]: Trophy,
  [CATEGORY_ORDER[2]]: ListChecks,
  [CATEGORY_ORDER[3]]: Link2,
};

/** Pill-style horizontal tab bar switching between the 20-day path and each
 * topic category — the 20-day path is the default/first tab. Data for every
 * tab is fetched once server-side and handed down; switching tabs is a pure
 * client-side state flip, no navigation or re-fetch. */
export function VocabularyTabs({ topics, pathOverview }: { topics: VocabularyTopicRow[]; pathOverview: PathOverview }) {
  const { sections, orderedKeys } = groupTopicsByCategory(topics);
  const [activeTab, setActiveTab] = React.useState<string>(PATH_TAB);

  const tabs = [
    { key: PATH_TAB, label: "Từ vựng 20 ngày", icon: BookOpenCheck },
    ...orderedKeys.map((key) => ({ key, label: key, icon: CATEGORY_ICONS[key] ?? Layers })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div data-tour="vocabulary-tabs" className="flex gap-1 overflow-x-auto rounded-full bg-card p-1 shadow-soft">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              activeTab === key ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === PATH_TAB ? (
        <PathOverviewContent data={pathOverview} />
      ) : (
        <TopicGrid topics={sections.get(activeTab) ?? []} />
      )}
    </div>
  );
}
