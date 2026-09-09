import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PushToggle } from "@/components/account/push-toggle";

export const metadata: Metadata = { title: "Thông báo" };

export default async function AccountNotificationsPage() {
  await requireUser();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Thông báo</h1>
        <p className="mt-1 text-sm text-muted-foreground">Quản lý thông báo đẩy trên trình duyệt này.</p>
      </div>

      <PushToggle />
    </div>
  );
}
