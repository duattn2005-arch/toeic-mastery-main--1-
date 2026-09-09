import { Headphones } from "lucide-react";
import Link from "next/link";
import { HeaderAuthButtons } from "@/components/marketing/landing-auth-buttons";

/**
 * Minimal shell for `(app)` routes visited while logged out — used only by
 * routes that opt into a public preview (currently /practice) instead of
 * the layout's default hard redirect to /login. No sidebar/user data, since
 * there's no profile yet; just enough chrome to feel like part of the site
 * rather than a dead end, with the real AppShell taking over once signed in.
 */
export function PublicAppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Headphones className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">TOEIC Mastery</span>
        </Link>
        <div className="flex items-center gap-2">
          <HeaderAuthButtons />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-16">{children}</main>
    </div>
  );
}
