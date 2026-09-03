"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, isSuperAdmin } from "@/lib/auth";
import { grantProDays } from "@/lib/services/pro-grant";

export interface ActionResult {
  error?: string;
}

export async function setUserRoleAction(userId: string, role: "STUDENT" | "ADMIN"): Promise<ActionResult> {
  const admin = await requireAdmin();
  // Only the one super-admin account can change Học viên/Admin status —
  // every other admin can view the users list but not edit roles from it.
  // Enforced here (not just hidden in the UI) since a server action is
  // callable directly regardless of what the client renders.
  if (!isSuperAdmin(admin)) {
    return { error: "Chỉ quản trị viên cấp cao mới có quyền thay đổi vai trò" };
  }
  if (admin.id === userId && role !== "ADMIN") {
    return { error: "Bạn không thể tự gỡ quyền admin của chính mình" };
  }

  await db.profile.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/users");
  return {};
}

/** Manual override for support/comp accounts/testing — real upgrades go
 * through VNPay (see src/lib/actions/billing.ts), but this stays useful
 * alongside real payment for refunds, comps, and QA. */
export async function updateUserPlanAction(userId: string, plan: "FREE" | "PRO"): Promise<ActionResult> {
  await requireAdmin();

  if (plan === "FREE") {
    await db.profile.update({ where: { id: userId }, data: { plan: "FREE", proExpiresAt: null } });
  } else {
    await grantProDays(userId, 30);
  }

  revalidatePath("/admin/users");
  return {};
}

export async function resolveReportAction(reportId: string): Promise<ActionResult> {
  await requireAdmin();
  await db.questionReport.update({ where: { id: reportId }, data: { status: "RESOLVED", resolvedAt: new Date() } });
  revalidatePath("/admin/analytics");
  return {};
}
