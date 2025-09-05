import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",               // důležité pro Cloudflare Pages
  reactStrictMode: true,
  images: {
    unoptimized: true,            // ⬅️ vypne optimalizaci obrázků
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
