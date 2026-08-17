import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  output: "standalone",
  basePath: "/sportsphere",
  reactStrictMode: true,
  serverExternalPackages: ['@aws-sdk/client-s3', '@google-cloud/storage'],
  experimental: {
    serverActions: {
      bodySizeLimit: '200mb',
    },
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: '/sportsphere',
  },
  images: {
    unoptimized: true,
    dangerouslyAllowSVG: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'http', hostname: '104.152.50.173', port: '3002', pathname: '/**' },
      { protocol: 'https', hostname: '104.152.50.173', pathname: '/**' },
      { protocol: 'http', hostname: 'localhost', port: '3002', pathname: '/**' },
      { protocol: 'https', hostname: 'sportssphere.fun', pathname: '/**' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      // CORS for Flutter Web / cross-origin clients (feed, profile-data, etc.)
      // Prefer setting CORS_ORIGIN env to a specific origin (e.g. https://sportsphere.app)
      // when credentials are required. Wildcard is used only as a development fallback.
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With, Cookie' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
      // CORS for Flutter — allow uploads/static files to be fetched by mobile
      {
        source: '/uploads/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, HEAD, OPTIONS' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;

