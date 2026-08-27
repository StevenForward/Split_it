import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Dev-only. Next blocks cross-origin requests to internal dev endpoints
   * (/_next/*, HMR) unless the requesting host is listed here — without it a
   * tunnelled or LAN preview serves HTML but never hydrates, and hot reload
   * dies silently. Tunnel hostnames are random per run, hence the wildcards.
   * Has no effect on `next build` / production.
   */
  allowedDevOrigins: [
    "172.31.168.90",
    "*.ngrok-free.app",
    "*.ngrok-free.dev",
    "*.ngrok.app",
    "*.ngrok.io",
    "*.trycloudflare.com",
  ],
};

export default nextConfig;
