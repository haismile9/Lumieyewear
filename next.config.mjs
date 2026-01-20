const nextConfig = {
  /* config options here */
  experimental: {
    inlineCss: true,
    useCache: true,
    clientSegmentCache: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zylq-002.dx.commercecloud.salesforce.com',
      },
      {
        protocol: 'https',
        hostname: 'edge.disstg.commercecloud.salesforce.com',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '5002',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5002',
      },
    ],
  },
};

export default nextConfig;
