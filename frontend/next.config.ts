import type { NextConfig } from "next";

/**
 * Hosts allowed to serve images through `next/image`.
 *
 * The profile photo comes from the API as an absolute `profile_photo_url`. Without
 * a matching pattern `next/image` throws at runtime the first time a real photo is
 * set, so the upload host is allow-listed explicitly rather than by wildcard.
 */
const API_HOST = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").hostname;
  } catch {
    return "localhost";
  }
})();

const nextConfig: NextConfig = {
  images: {
    // Only the API host. A `hostname: "**"` wildcard here would turn the image
    // optimizer into an open proxy for any remote URL.
    remotePatterns: [
      { protocol: "http", hostname: API_HOST, pathname: "/**" },
      { protocol: "https", hostname: API_HOST, pathname: "/**" },
    ],
  },
};

export default nextConfig;
