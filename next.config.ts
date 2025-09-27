import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  trailingSlash: true,
  experimental: {
    serverComponentsExternalPackages: ["next-auth"],
  },
};

export default nextConfig;
