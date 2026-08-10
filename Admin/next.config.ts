import type { NextConfig } from "next";

/**
 * Standalone Admin console config.
 *
 * - No basePath: the admin app is mounted at the root of its own port (3003).
 * - No Cloudinary/Prisma/etc — this app has NO database. It only talks to the
 *   main SportSphere fan app over HTTP via MAIN_APP_URL.
 * - Images served by the main app are loaded cross-origin; we leave Next's
 *   image optimizer off (the main app already optimizes them).
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "http",
        hostname: "104.152.50.173",
      },
      {
        protocol: "https",
        hostname: "104.152.50.173",
      },
    ],
  },
  // Allow the admin server to keep running even if the main app is briefly
  // unreachable — the API client returns structured errors instead of crashing.
  serverExternalPackages: [],
};

export default nextConfig;
