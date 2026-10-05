import type { NextConfig } from "next";

/**
 * Product photos come from the API: Cloudinary in production, and the API's
 * own /uploads folder in development. Only these hosts may be optimized by
 * next/image.
 */
const apiOrigin = new URL(process.env.API_BASE_URL || "http://localhost:3000/api/v1");
const apiIsLocal = ["localhost", "127.0.0.1"].includes(apiOrigin.hostname);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    qualities: [75, 90],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      {
        protocol: apiOrigin.protocol.replace(":", "") as "http" | "https",
        hostname: apiOrigin.hostname,
        port: apiOrigin.port,
        pathname: "/uploads/**",
      },
    ],
    // Only when the API (and its /uploads) runs on this machine: in development,
    // or a local production build with ALLOW_LOCAL_IMAGES=true. Never on a real
    // server, where it would let the optimizer reach private addresses.
    dangerouslyAllowLocalIP:
      apiIsLocal &&
      (process.env.NODE_ENV !== "production" || process.env.ALLOW_LOCAL_IMAGES === "true"),
  },
};

export default nextConfig;
