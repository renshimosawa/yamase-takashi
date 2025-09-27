import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  trailingSlash: true,
  serverExternalPackages: ["next-auth"],
};

export default nextConfig;
