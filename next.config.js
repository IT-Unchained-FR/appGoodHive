/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse", "puppeteer", "pdf2pic", "pdfjs-dist"],
  },
  async headers() {
    return [
      {
        // Only apply CORS headers in development
        source: process.env.NODE_ENV === "development" ? "/(.*)" : "/dev-only-route-that-never-exists",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "http://localhost:3000",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "goodhive-image.s3.us-east-005.backblazeb2.com",
      },
      {
        protocol: "https",
        hostname: "goodhive.s3.us-east-005.backblazeb2.com",
      },
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Skip failing prerender pages (404/500 errors)
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  output: "standalone",
  poweredByHeader: false,
  swcMinify: true,
};

module.exports = nextConfig;
