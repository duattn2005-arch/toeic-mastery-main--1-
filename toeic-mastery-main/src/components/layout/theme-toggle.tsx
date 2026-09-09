"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Compact light/dark switch for the header corner — a quick override on top
 * of the dark-by-default set in Providers. Full theme preference still lives
 * on the Settings page; this is just fast, always-visible access. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // `resolvedTheme` isn't reliably undefined during hydration — next-themes'
  // inline script can resolve it before React reconciles, so checking the
  // value itself still produces a server/client mismatch on some loads. The
  // `mounted` flag is next-themes' own documented fix: render an inert
  // placeholder until we're certainly past hydration, then swap to the real
  // icon in an effect (a legitimate one-time sync with the browser
  // environment, not app state).
  // eslint-disable-next-line react-hooks/set-state-in-effect -- see comment above
  React.useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="size-9" aria-hidden />;

  const isDark = resolvedTheme === "dark";
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
      className="rounded-full"
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
