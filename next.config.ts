import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: [
    '192.168.*.*',
    '10.*.*.*',
    '172.16.*.*',
    '172.17.*.*',
    '172.18.*.*',
    '172.19.*.*',
    '172.20.*.*',
    '172.21.*.*',
    '172.22.*.*',
    '172.23.*.*',
    '172.24.*.*',
    '172.25.*.*',
    '172.26.*.*',
    '172.27.*.*',
    '172.28.*.*',
    '172.29.*.*',
    '172.30.*.*',
    '172.31.*.*',
    '*.local',
    ...(process.env['ALLOWED_DEV_ORIGINS'] ? process.env['ALLOWED_DEV_ORIGINS'].split(',') : []),
  ],
  ...(process.env['BUILD_STANDALONE'] === 'true' ? { output: 'standalone' as const } : {}),
  experimental: {
    optimizePackageImports: ['lucide-react'],
    serverActions: {
      bodySizeLimit: '60mb',
    },
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/manifest.webmanifest',
        destination: '/manifest.json',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive, nosnippet',
          },
        ],
      },
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
