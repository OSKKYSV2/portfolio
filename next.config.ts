import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // čistý statický build
  reactStrictMode: true,
};

export default nextConfig;
