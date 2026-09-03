"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export interface ActionResult {
  error?: string;
}

export interface SavePushSubscriptionInput {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}

/** Upserts by `endpoint` (unique) so re-subscribing the same browser (e.g.
 * after clearing the toggle off/on) updates the existing row for whichever
 * account is currently logged in, instead of erroring on the unique
 * constraint or leaving a stale subscription owned by a previous user. */
export async function savePushSubscriptionAction(input: SavePushSubscriptionInput): Promise<ActionResult> {
  const profile = await requireUser();
  if (!input.endpoint || !input.p256dh || !input.auth) return { error: "Dữ liệu đăng ký thông báo không hợp lệ" };

  await db.pushSubscription.upsert({
    where: { endpoint: input.endpoint },
    create: {
      userId: profile.id,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
      userAgent: input.userAgent ?? null,
    },
    update: {
      userId: profile.id,
      p256dh: input.p256dh,
      auth: input.auth,
      userAgent: input.userAgent ?? null,
    },
  });

  revalidatePath("/account/notifications");
  return {};
}

export async function deletePushSubscriptionAction(endpoint: string): Promise<ActionResult> {
  await requireUser();
  await db.pushSubscription.deleteMany({ where: { endpoint } });
  revalidatePath("/account/notifications");
  return {};
}
