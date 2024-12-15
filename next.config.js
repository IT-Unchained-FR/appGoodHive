/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
    typedRoutes: true,
    serverActions: true,
    missingSuspenseWithCSRBailout: false,
    reactStrictMode: false,
  },
  images: {
    domains: [
      "goodhive-image.s3.us-east-005.backblazeb2.com",
      "goodhive.s3.us-east-005.backblazeb2.com",
      "cdn.sanity.io",
    ],
  },
};

module.exports = nextConfig;
