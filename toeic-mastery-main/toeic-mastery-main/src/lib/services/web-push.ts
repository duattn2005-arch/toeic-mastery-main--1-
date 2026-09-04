import "server-only";
import webpush from "web-push";
import { db } from "@/lib/db";
import type { PushSubscription } from "@/generated/prisma/client";

let vapidConfigured = false;

function ensureVapidConfigured() {
  if (vapidConfigured) return;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    throw new Error("Thiếu cấu hình VAPID (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT)");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
}

export interface PushMessage {
  title: string;
  body: string;
  url?: string;
}

/**
 * Sends one push message and deletes the subscription if the push service
 * reports it's gone (410 Gone — unsubscribed/expired) or was never valid
 * (404). Any other error is left alone since it's likely transient.
 */
export async function sendPush(subscription: PushSubscription, message: PushMessage): Promise<boolean> {
  ensureVapidConfigured();

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(message)
    );
    return true;
  } catch (err) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    if (statusCode === 404 || statusCode === 410) {
      await db.pushSubscription.delete({ where: { id: subscription.id } }).catch(() => {});
    }
    return false;
  }
}
