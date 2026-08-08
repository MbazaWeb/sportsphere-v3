import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/sportsphere',
  assetPrefix: '/sportsphere',
  reactStrictMode: true,
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
