import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Klíčové pro Cloudflare Pages — vytvoří čistý statický web
  output: "export",
  reactStrictMode: true,

  // Ignorujeme ESLint a TS chyby během buildu
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
