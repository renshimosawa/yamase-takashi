import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  serverExternalPackages: ["next-auth", "firebase-admin"],
};

export default nextConfig;
