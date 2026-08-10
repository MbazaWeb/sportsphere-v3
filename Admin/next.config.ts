import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  turbopack: { root: "../" },
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
  serverExternalPackages: [],
};

export default nextConfig;
