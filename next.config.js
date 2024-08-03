/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    appDir: true,
    typedRoutes: true,
    serverActions: true,
  },
  images: {
    domains: [
      "goodhive-image.s3.us-east-005.backblazeb2.com",
      "goodhive.s3.us-east-005.backblazeb2.com",
    ],
  },
};

module.exports = nextConfig;
