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
  /**
   * Hosts allowed to load dev resources such as the HMR client.
   *
   * Next 16 blocks cross-origin dev requests by default. Opening the dev server
   * on a phone or tablet over the LAN is the only way to test real touch input,
   * and the request arrives from the machine's LAN address rather than
   * `localhost`, so it was blocked. That silently broke hydration: the page
   * rendered server-side and every JS-driven control — Radix checkbox, role
   * switch, filters — stopped responding, while native inputs kept working.
   *
   * Dev-only: the option is read by the dev server and ignored by `next build`
   * and `next start`, so it needs no stripping before deploy.
   *
   * Per the Next docs, `*` matches exactly one hostname label, so these are
   * the RFC1918 ranges written out rather than one broad catch-all. The dev
   * server already allows `localhost` and the hostname it started on.
   */
  allowedDevOrigins: [
    "192.168.*.*", // 192.168.0.0/16, the usual home-router range
    "10.*.*.*", // 10.0.0.0/8
    "172.16.*.*",
    "172.17.*.*",
    "172.18.*.*",
    "172.19.*.*",
    "172.2*.*.*", // 172.20-29
    "172.30.*.*",
    "172.31.*.*",
  ],

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
