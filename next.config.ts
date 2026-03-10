import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.propertyprosmuncie.com",
      },
    ],
  },
};

export default nextConfig;
