import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // ⚠️ DŮLEŽITÉ! Pro Cloudflare Pages
  reactStrictMode: true,
};

export default nextConfig;
