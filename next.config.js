/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    typedRoutes: true,
  },
  images: {
    domains: [
      "goodhive-image.s3.us-east-005.backblazeb2.com",
      "goodhive.s3.us-east-005.backblazeb2.com",
      "cdn.sanity.io",
      "picsum.photos",
    ],
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: "standalone",
  poweredByHeader: false,
  swcMinify: true,
  transpilePackages: ["ethers", "siwe"],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      ethers: require.resolve("ethers"),
    };
    return config;
  },
};

module.exports = nextConfig;
