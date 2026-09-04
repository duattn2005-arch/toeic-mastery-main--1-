import "server-only";
import { db } from "@/lib/db";
import type { Profile } from "@/generated/prisma/client";
import type { CommissionStatus } from "@/generated/prisma/enums";
import { resolveCommissionTier, nextCommissionTier, type CommissionTier } from "@/lib/constants/referral";

export function buildReferralLink(referralCode: string | null): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  if (!referralCode) return siteUrl;
  return `${siteUrl}/?ref=${referralCode}`;
}

export interface ReferralOverview {
  referralCode: string | null;
  referralLink: string;
  successfulReferralCount: number;
  isPayingReferrer: boolean;
  currentTier: CommissionTier;
  nextTier: CommissionTier | null;
  totals: {
    totalEarned: number;
    pending: number;
    withdrawable: number;
    paid: number;
  };
  referredUsers: Array<{
    id: string;
    fullName: string | null;
    email: string;
    plan: "FREE" | "PRO";
    referredAt: Date | null;
    totalCommissionFromThem: number;
  }>;
}

/** Powers /account/referrals — everything a learner sees about who they've
 * brought in and what it's earned them so far. */
export async function getReferralOverview(profile: Profile): Promise<ReferralOverview> {
  const [statusSums, referredUsers, commissionByReferred] = await Promise.all([
    db.commission.groupBy({ by: ["status"], where: { referrerId: profile.id }, _sum: { amount: true } }),
    db.profile.findMany({
      where: { referredByProfileId: profile.id },
      orderBy: { referredAt: "desc" },
      select: { id: true, fullName: true, email: true, plan: true, referredAt: true },
    }),
    db.commission.groupBy({
      by: ["referredId"],
      where: { referrerId: profile.id, status: { not: "CANCELLED" } },
      _sum: { amount: true },
    }),
  ]);

  const sumByStatus = (status: CommissionStatus) => statusSums.find((s) => s.status === status)?._sum.amount ?? 0;
  const commissionMap = new Map(commissionByReferred.map((c) => [c.referredId, c._sum.amount ?? 0]));

  return {
    referralCode: profile.referralCode,
    referralLink: buildReferralLink(profile.referralCode),
    successfulReferralCount: profile.successfulReferralCount,
    isPayingReferrer: Boolean(profile.firstProPaymentAt),
    currentTier: resolveCommissionTier(profile.successfulReferralCount),
    nextTier: nextCommissionTier(profile.successfulReferralCount),
    totals: {
      totalEarned: sumByStatus("PENDING") + sumByStatus("WITHDRAWABLE") + sumByStatus("PAID"),
      pending: sumByStatus("PENDING"),
      withdrawable: sumByStatus("WITHDRAWABLE"),
      paid: sumByStatus("PAID"),
    },
    referredUsers: referredUsers.map((u) => ({ ...u, totalCommissionFromThem: commissionMap.get(u.id) ?? 0 })),
  };
}

export interface CommissionsPageData {
  bankAccount: Awaited<ReturnType<typeof db.bankAccount.findUnique>>;
  withdrawals: Awaited<ReturnType<typeof db.withdrawal.findMany>>;
  totals: ReferralOverview["totals"];
}

/** Powers /account/commissions — bank details on file, request-withdrawal
 * form, and past withdrawal history. */
export async function getCommissionsPageData(profile: Profile): Promise<CommissionsPageData> {
  const [bankAccount, withdrawals, statusSums] = await Promise.all([
    db.bankAccount.findUnique({ where: { userId: profile.id } }),
    db.withdrawal.findMany({ where: { userId: profile.id }, orderBy: { requestedAt: "desc" } }),
    db.commission.groupBy({ by: ["status"], where: { referrerId: profile.id }, _sum: { amount: true } }),
  ]);

  const sumByStatus = (status: CommissionStatus) => statusSums.find((s) => s.status === status)?._sum.amount ?? 0;

  return {
    bankAccount,
    withdrawals,
    totals: {
      totalEarned: sumByStatus("PENDING") + sumByStatus("WITHDRAWABLE") + sumByStatus("PAID"),
      pending: sumByStatus("PENDING"),
      withdrawable: sumByStatus("WITHDRAWABLE"),
      paid: sumByStatus("PAID"),
    },
  };
}
