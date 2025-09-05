import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true, // ⬅️ DŮLEŽITÉ
  },
  typescript: {
    ignoreBuildErrors: true, // ⬅️ DŮLEŽITÉ
  },
};

export default nextConfig;
