import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hosts allowed to load the dev server, e.g. another machine on your
  // network. Comma-separated; set in .env.
  allowedDevOrigins: (process.env.ALLOWED_DEV_ORIGINS ?? "")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean),
  devIndicators: false,
};

export default nextConfig;
