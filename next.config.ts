import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Firebase Storage public URLs
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      // Firebase Storage download URLs (alternative format)
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
};

export default nextConfig;
