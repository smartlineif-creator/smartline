import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // The frontend service has the same tight memory ceiling as the backend.
    // Next's built-in optimizer resizes images inside this same Node process,
    // and a page rendering dozens of product photos at once (catalog grid)
    // spikes concurrent sharp resizes enough to OOM-crash the whole service
    // (confirmed: /_next/image requests started 502ing, then every page —
    // not just images — went down with it). Serve R2 images as-is until
    // resizing can be offloaded to Cloudflare's own image transformation.
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'images.prom.ua' },
      { protocol: 'https', hostname: 'cdn.smartline.com.ua' },
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '*.r2.dev' },
      { protocol: 'https', hostname: '*.cloudflare.com' },
      { protocol: 'https', hostname: '*.cloudflarecdn.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.dummyjson.com' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
};

export default nextConfig;
