/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
    typedRoutes: true,
    serverActions: true,
    missingSuspenseWithCSRBailout: false,
    reactStrictMode: false,
    outputFileTracing: false,
  },
  images: {
    domains: [
      "goodhive-image.s3.us-east-005.backblazeb2.com",
      "goodhive.s3.us-east-005.backblazeb2.com",
      "cdn.sanity.io",
      "picsum.photos"
    ],
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
  poweredByHeader: false,
  swcMinify: true,
  transpilePackages: ['ethers', 'siwe'],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'ethers': require.resolve('ethers')
    };
    return config;
  }
};

module.exports = nextConfig;
