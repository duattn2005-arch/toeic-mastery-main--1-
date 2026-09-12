import type { NextConfig } from "next";

// next/image treats ANY absolute-URL src (http(s)://...) as "external" and
// 400s it unless the host is whitelisted — even when that host is the app's
// own origin. saveUpload() (src/lib/upload.ts) always returns a full
// NEXT_PUBLIC_UPLOADS_URL-based URL, so that host must be whitelisted here
// too, in both dev (http://localhost:3000/uploads) and production (wherever
// Nginx serves UPLOADS_DIR from — see README §12).
const uploadsUrl = process.env.NEXT_PUBLIC_UPLOADS_URL ? new URL(process.env.NEXT_PUBLIC_UPLOADS_URL) : null;

const nextConfig: NextConfig = {
  // sharp ships native (.node) bindings — bundling it like ordinary JS
  // breaks those at runtime, so it must stay an external require both for
  // Next's own image optimizer (handled automatically) and for our own
  // direct `import sharp` in src/lib/upload.ts (this entry is what makes
  // that one work too).
  serverExternalPackages: ["sharp"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.dicebear.com" },
      ...(uploadsUrl
        ? [
            {
              protocol: uploadsUrl.protocol.replace(":", "") as "http" | "https",
              hostname: uploadsUrl.hostname,
              port: uploadsUrl.port,
              pathname: `${uploadsUrl.pathname.replace(/\/$/, "")}/**`,
            },
          ]
        : []),
    ],
    // In local dev NEXT_PUBLIC_UPLOADS_URL points at localhost, which
    // resolves to a loopback IP — the optimizer's SSRF guard blocks that by
    // default. Safe here because remotePatterns above already restricts
    // fetches to only our own uploads host, not arbitrary URLs.
    dangerouslyAllowLocalIP: true,
  },
};

export default nextConfig;
