import type { DeviceType } from "@/generated/prisma/enums";

/** Coarse User-Agent sniffing — good enough for a display-only device list
 * (see Device model), not meant to be bulletproof against spoofed UAs. */
export function parseDeviceFromUserAgent(userAgent: string): { type: DeviceType; label: string } {
  const ua = userAgent.toLowerCase();

  let type: DeviceType = "COMPUTER";
  if (/ipad|(?:tablet(?!.*mobile))/.test(ua)) {
    type = "TABLET";
  } else if (/mobile|iphone|android/.test(ua)) {
    type = "PHONE";
  }

  let browser = "Trình duyệt";
  if (ua.includes("edg/")) browser = "Edge";
  else if (ua.includes("opr/") || ua.includes("opera")) browser = "Opera";
  else if (ua.includes("chrome/") && !ua.includes("edg/")) browser = "Chrome";
  else if (ua.includes("firefox/")) browser = "Firefox";
  else if (ua.includes("safari/") && !ua.includes("chrome/")) browser = "Safari";

  let os = "";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("mac os") || ua.includes("macintosh")) os = "macOS";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad") || ua.includes(" ios")) os = "iOS";
  else if (ua.includes("linux")) os = "Linux";

  return { type, label: os ? `${browser} trên ${os}` : browser };
}
