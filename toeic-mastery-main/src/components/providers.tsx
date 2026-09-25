"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { SelectionDictionaryProvider } from "@/components/dictionary/selection-dictionary-provider";
import { OfflineIndicator } from "@/components/shared/offline-indicator";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
        <TooltipProvider delayDuration={200}>
          {children}
          <SelectionDictionaryProvider />
          <OfflineIndicator />
          {/* The app shell's sticky header (TopHeader) is h-16 (4rem) — without
             an explicit offset, sonner's default top-right anchor sits at the
             very top of the viewport and overlaps the header's own buttons
             (Quick Study/Nâng cấp/bell/avatar), worse on narrow screens where
             there's less spare width to begin with. mobileOffset keeps toasts
             inset from both side edges below ~600px instead of running
             edge-to-edge. */}
          <Toaster
            richColors
            position="top-right"
            offset={{ top: "4.5rem", right: "1rem" }}
            mobileOffset={{ top: "4.5rem", right: "0.75rem", left: "0.75rem" }}
          />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
