import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "strapi5-commere.ratama.space",
      },
      {
        protocol: "https",
        hostname: "minio-api.ratama.space",
      },
    ],
  },
};

export default nextConfig;
