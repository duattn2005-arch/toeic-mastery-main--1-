import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { DeviceList } from "@/components/account/device-list";

export const metadata: Metadata = { title: "Thiết bị" };

export default async function AccountDevicesPage() {
  const profile = await requireUser();

  const devices = await db.device.findMany({
    where: { userId: profile.id, deletedAt: null },
    orderBy: { lastSeenAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Thiết bị đăng nhập</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Danh sách này chỉ mang tính hiển thị — gỡ một thiết bị khỏi đây không đăng xuất hay chặn thiết bị đó đăng
          nhập lại.
        </p>
      </div>

      <DeviceList
        devices={devices.map((d) => ({
          id: d.id,
          type: d.type,
          label: d.label,
          lastSeenAt: d.lastSeenAt.toISOString(),
          lastIp: d.lastIp,
        }))}
      />
    </div>
  );
}
