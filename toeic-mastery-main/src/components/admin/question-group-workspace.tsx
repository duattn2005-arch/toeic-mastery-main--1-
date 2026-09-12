"use client";

import * as React from "react";
import { Check, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuestionGroupForm } from "@/components/admin/question-group-form";
import type { QuestionGroupFormInput } from "@/lib/validations/admin";

interface GroupTab {
  id: string;
  label: string;
  saved: boolean;
  defaultTestId: string;
  defaultPart: QuestionGroupFormInput["part"];
}

let tabSeq = 0;
function newTabId() {
  tabSeq += 1;
  return `tab-${tabSeq}`;
}

/**
 * A single Part (esp. Part 3/4/7) is almost never just one group — a real
 * test needs several conversations/passages back to back. This wraps
 * QuestionGroupForm in a tab strip (one tab per group, styled like
 * PracticeFilters' part pills) so an admin can author a whole run of groups
 * for the same test without leaving the page or re-picking the test each
 * time: saving a group marks its tab done and hands off to the next
 * (existing, or a freshly-opened one) tab instead of navigating away.
 *
 * Every tab's QuestionGroupForm stays mounted (just hidden) so switching
 * tabs never loses in-progress input — see that component's own doc.
 */
export function QuestionGroupWorkspace({ testOptions }: { testOptions: { id: string; title: string }[] }) {
  const [tabs, setTabs] = React.useState<GroupTab[]>(() => [
    { id: newTabId(), label: "Nhóm 1", saved: false, defaultTestId: "", defaultPart: "PART3" },
  ]);
  const [activeId, setActiveId] = React.useState(tabs[0].id);

  function addTab() {
    const base = tabs.find((t) => t.id === activeId) ?? tabs[0];
    const tab: GroupTab = {
      id: newTabId(),
      label: `Nhóm ${tabs.length + 1}`,
      saved: false,
      // Carries over the same test/part — consecutive groups in one
      // sitting are almost always for the same test and often the same
      // part, so this saves re-selecting them every time.
      defaultTestId: base.defaultTestId,
      defaultPart: base.defaultPart,
    };
    setTabs((prev) => [...prev, tab]);
    setActiveId(tab.id);
  }

  function removeTab(id: string) {
    setTabs((prev) => {
      if (prev.length <= 1) return prev; // always keep at least one tab open
      const next = prev.filter((t) => t.id !== id);
      if (activeId === id) setActiveId(next[next.length - 1].id);
      return next;
    });
  }

  function handleSaved(id: string) {
    setTabs((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, saved: true } : t));
      const idx = updated.findIndex((t) => t.id === id);
      const next = updated[idx + 1];
      if (next) {
        setActiveId(next.id);
        return updated;
      }
      const fresh: GroupTab = {
        id: newTabId(),
        label: `Nhóm ${updated.length + 1}`,
        saved: false,
        defaultTestId: updated[idx].defaultTestId,
        defaultPart: updated[idx].defaultPart,
      };
      setActiveId(fresh.id);
      return [...updated, fresh];
    });
  }

  const tabsBar = (
    <div className="scrollbar-thin flex items-center gap-1.5 overflow-x-auto pb-1">
      {tabs.map((tab) => (
        <div key={tab.id} className="group/tab relative shrink-0">
          <button
            type="button"
            onClick={() => setActiveId(tab.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 pr-7 text-sm font-medium transition-colors",
              tab.id === activeId ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
            )}
          >
            {tab.saved && <Check className="size-3.5" />}
            {tab.label}
          </button>
          {tabs.length > 1 && (
            <button
              type="button"
              onClick={() => removeTab(tab.id)}
              title="Đóng tab này"
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 opacity-0 transition-opacity group-hover/tab:opacity-100",
                tab.id === activeId ? "text-primary-foreground/70 hover:text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addTab}
        className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-border px-3.5 py-1.5 text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary"
      >
        <Plus className="size-3.5" /> Thêm nhóm
      </button>
    </div>
  );

  return (
    <>
      {tabs.map((tab) => (
        <QuestionGroupForm
          key={tab.id}
          testOptions={testOptions}
          hidden={tab.id !== activeId}
          defaultTestId={tab.defaultTestId}
          defaultPart={tab.defaultPart}
          onSaved={() => handleSaved(tab.id)}
          tabsBar={tabsBar}
        />
      ))}
    </>
  );
}
