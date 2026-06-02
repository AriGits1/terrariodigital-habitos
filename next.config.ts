import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow tunnel domains (e.g. cloudflared) to reach dev resources so the
  // installed PWA hydrates and its buttons work. Wildcard covers the random
  // subdomain that trycloudflare assigns on each run.
  allowedDevOrigins: ["*.trycloudflare.com"],
  // Authorize Server Actions submitted from the tunnel origin (anti-CSRF).
  experimental: {
    serverActions: {
      allowedOrigins: ["*.trycloudflare.com"],
    },
  },
};

export default nextConfig;
