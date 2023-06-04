/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
    typedRoutes: true,
  },
  images: {
    domains: ["goodhive-image.s3.us-east-005.backblazeb2.com"],
  },
};

module.exports = nextConfig;
