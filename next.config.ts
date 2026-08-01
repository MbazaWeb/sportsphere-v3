import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Capacitor
  output: "export",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // If you need Turbopack, use experimental
  // experimental: { turbo: { root: __dirname } } // but __dirname not available
  // Instead, remove turbopack block – it's not needed.
};

export default nextConfig;