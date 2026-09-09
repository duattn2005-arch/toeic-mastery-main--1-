import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "Tổng giờ học" as something that visibly moves for a realistic study
 * session — `(seconds / 3600).toFixed(1)` rounds anything under 3 minutes to
 * "0.0h", which reads as "not tracking" even when it is. Show minutes below
 * an hour, hours+minutes at or above it. */
/** Calendar-day-only Date anchored at UTC midnight, built from `d`'s LOCAL
 * year/month/day. Used everywhere a date gets compared or persisted to a
 * Postgres `@db.Date` column (`Profile.lastStudyDate`): Postgres has no time
 * zone concept for `date`, so it stores/reads back whatever Y-M-D your value
 * has in UTC. Naively doing `d.setHours(0,0,0,0)` zeroes the *local* clock,
 * which for any positive UTC offset (all of Vietnam) leaves the UTC instant
 * sitting on the *previous* calendar day — so a value written today reads
 * back as yesterday, and a same-day streak check compares Aug 21 to Aug 20
 * and wrongly concludes "different day." Anchoring at UTC midnight for the
 * local Y-M-D survives that round-trip unchanged. */
export function toDateOnlyUTC(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

export function formatStudyDuration(totalSeconds: number): string {
  const totalMinutes = Math.round(totalSeconds / 60);
  if (totalMinutes < 60) return `${totalMinutes} phút`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}p`;
}
