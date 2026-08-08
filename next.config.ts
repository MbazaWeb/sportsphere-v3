import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/sportsphere',
  assetPrefix: '/sportsphere',
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: '/sportsphere',
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

export default nextConfig;
