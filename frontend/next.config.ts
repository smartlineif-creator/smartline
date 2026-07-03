import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Uploaded photos are already resized WebP served by the Cloudflare R2
    // CDN. Next's optimizer adds no benefit and times out on Render's free
    // tier for large originals (blank main gallery image). Serve as-is.
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
