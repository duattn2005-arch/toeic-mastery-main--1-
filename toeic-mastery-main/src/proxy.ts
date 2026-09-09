import type { NextFetchEvent, NextRequest } from "next/server";
import { updateSession } from "@/lib/auth/proxy-session";

export function proxy(request: NextRequest, event: NextFetchEvent) {
  return updateSession(request, event);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|ico)$).*)"],
};
