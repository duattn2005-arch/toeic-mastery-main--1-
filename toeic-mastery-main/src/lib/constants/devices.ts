import type { DeviceType } from "@/generated/prisma/enums";

export const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  COMPUTER: "Máy tính",
  PHONE: "Điện thoại",
  TABLET: "Máy tính bảng",
};

/** Display-only ceiling shown next to each device-type count (e.g. "2/2 máy
 * tính") — purely informational, per the plan's decision to never actually
 * block a login over the device count. */
export const DEVICE_TYPE_LIMITS: Record<DeviceType, number> = {
  COMPUTER: 2,
  PHONE: 2,
  TABLET: 1,
};
