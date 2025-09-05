import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",          // nativní statický export v Next.js 15
  reactStrictMode: true,
  images: {
    unoptimized: true,       // vypnutí image optimalizace
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
