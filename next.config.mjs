/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['expo-server-sdk', 'undici'],
};

export default nextConfig;
