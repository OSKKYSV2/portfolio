import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // serverové buildy (NE 'export')
  reactStrictMode: true,
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true }
};

export default nextConfig;
