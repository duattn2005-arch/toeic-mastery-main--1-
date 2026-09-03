import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";

interface ClickPayload {
  code?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
}

/** Only callable from src/proxy.ts (shared secret) — never from the browser
 * directly, so a forged `code` can't be used to inflate someone's click
 * count. An invalid `code` still no-ops rather than erroring, since Proxy
 * fires this via `event.waitUntil` without inspecting the response. */
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-internal-secret");
  if (!secret || secret !== process.env.INTERNAL_TRACK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as ClickPayload | null;
  const code = body?.code?.trim();
  if (!code) {
    return NextResponse.json({ ok: true });
  }

  const referrer = await db.profile.findUnique({ where: { referralCode: code }, select: { id: true } });
  if (!referrer) {
    return NextResponse.json({ ok: true });
  }

  const ip = body?.ip || "0.0.0.0";
  const userAgent = body?.userAgent || "";
  const fingerprintHash = createHash("sha256").update(`${ip}|${userAgent}`).digest("hex");

  await db.referralClick.create({
    data: {
      referralCode: code,
      referrerProfileId: referrer.id,
      ipAddress: ip,
      userAgent,
      fingerprintHash,
      landingPath: body?.path ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
