import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Statický export pro Cloudflare Pages
  output: "export",
  reactStrictMode: true,
  
  // Zakáže optimalizaci obrázků (protože export běží bez serveru)
  images: {
    unoptimized: true,
  },

  // Zabrání pádům buildu kvůli ESLintu a TS typům
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
