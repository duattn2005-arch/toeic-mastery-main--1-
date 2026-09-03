import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sendPush } from "@/lib/services/web-push";

/** A subscription only gets one reminder per run of this window — running
 * daily (see vercel.json) that's just "not already sent today", but the
 * margin under 24h keeps this correct even if the cron fires a bit early
 * or late on a given day. */
const RESEND_THROTTLE_HOURS = 20;

/**
 * Vercel Hobby allows only one cron run per day, so every user who has
 * `dailyReminderEnabled` gets pushed in this single daily run, ignoring
 * their personal `dailyReminderTime`.
 * TODO: once the project is on a paid Vercel plan, switch this cron's
 * schedule to every ~15 minutes and filter recipients by whether their
 * `dailyReminderTime` falls in the current window, instead of blasting
 * everyone at one fixed hour.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const usersToRemind = await db.userSettings.findMany({
    where: { dailyReminderEnabled: true },
    select: { userId: true },
  });
  const userIds = usersToRemind.map((u) => u.userId);
  if (userIds.length === 0) {
    return NextResponse.json({ sent: 0, candidates: 0 });
  }

  const throttleCutoff = new Date(Date.now() - RESEND_THROTTLE_HOURS * 60 * 60 * 1000);
  const subscriptions = await db.pushSubscription.findMany({
    where: {
      userId: { in: userIds },
      OR: [{ lastSentAt: null }, { lastSentAt: { lt: throttleCutoff } }],
    },
  });

  let sent = 0;
  for (const subscription of subscriptions) {
    const delivered = await sendPush(subscription, {
      title: "Đến giờ ôn luyện TOEIC rồi!",
      body: "Duy trì streak học tập của bạn — chỉ mất vài phút mỗi ngày.",
      url: "/dashboard",
    });
    if (delivered) {
      sent++;
      await db.pushSubscription
        .update({ where: { id: subscription.id }, data: { lastSentAt: new Date() } })
        .catch(() => {});
    }
  }

  return NextResponse.json({ sent, candidates: subscriptions.length });
}
