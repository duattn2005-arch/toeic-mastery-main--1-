"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Laptop, Loader2, Smartphone, Tablet, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteDeviceAction } from "@/lib/actions/account";
import { DEVICE_TYPE_LABELS, DEVICE_TYPE_LIMITS } from "@/lib/constants/devices";
import type { DeviceType } from "@/generated/prisma/enums";

export interface DeviceListItem {
  id: string;
  type: DeviceType;
  label: string;
  lastSeenAt: string;
  lastIp: string | null;
}

const TYPE_ICON: Record<DeviceType, typeof Laptop> = {
  COMPUTER: Laptop,
  PHONE: Smartphone,
  TABLET: Tablet,
};

export function DeviceList({ devices }: { devices: DeviceListItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const counts = devices.reduce<Partial<Record<DeviceType, number>>>((acc, d) => {
    acc[d.type] = (acc[d.type] ?? 0) + 1;
    return acc;
  }, {});

  function handleDelete(id: string) {
    setPendingId(id);
    startTransition(async () => {
      const result = await deleteDeviceAction(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Đã gỡ thiết bị khỏi danh sách");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-3">
        {(Object.keys(DEVICE_TYPE_LABELS) as DeviceType[]).map((type) => (
          <div key={type} className="rounded-2xl border border-border bg-card p-4 text-center shadow-soft">
            <p className="text-xs font-medium text-muted-foreground">{DEVICE_TYPE_LABELS[type]}</p>
            <p className="mt-1 text-xl font-semibold">
              {counts[type] ?? 0}/{DEVICE_TYPE_LIMITS[type]}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {devices.map((device) => {
          const Icon = TYPE_ICON[device.type];
          return (
            <div
              key={device.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{device.label}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    Truy cập gần nhất: {new Date(device.lastSeenAt).toLocaleString("vi-VN")}
                    {device.lastIp && ` · ${device.lastIp}`}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="shrink-0 text-destructive hover:text-destructive"
                disabled={pending && pendingId === device.id}
                onClick={() => handleDelete(device.id)}
              >
                {pending && pendingId === device.id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
                Gỡ
              </Button>
            </div>
          );
        })}
        {devices.length === 0 && <p className="text-sm text-muted-foreground">Chưa ghi nhận thiết bị nào.</p>}
      </div>
    </div>
  );
}
