import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Uploaded question images (question.imageUrl) are same-origin in
      // production (NEXT_PUBLIC_UPLOADS_URL serves off the app's own
      // domain via Nginx — see README §12), so no entry is needed here for
      // them. Add one only if uploads ever move to a separate subdomain/CDN.
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
};

export default nextConfig;
