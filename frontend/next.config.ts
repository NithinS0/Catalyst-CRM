import type { NextConfig } from "next";

const rawBackendUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const backendBase = rawBackendUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendBase}/api/:path*`,
      },
      {
        source: "/app",
        destination: "/dashboard",
      },
      {
        source: "/app/dashboard",
        destination: "/dashboard",
      },
      {
        source: "/app/customers",
        destination: "/customers",
      },
      {
        source: "/app/segments",
        destination: "/segments",
      },
      {
        source: "/app/campaigns",
        destination: "/campaigns",
      },
      {
        source: "/app/campaigns/new",
        destination: "/campaigns",
      },
      {
        source: "/app/campaign-studio",
        destination: "/campaign-studio",
      },
      {
        source: "/app/ai-studio",
        destination: "/campaign-studio",
      },
      {
        source: "/app/analytics",
        destination: "/analytics",
      },
      {
        source: "/app/ai-insights",
        destination: "/dashboard",
      },
      {
        source: "/app/agent-monitor",
        destination: "/agent-monitor",
      },
      {
        source: "/app/settings",
        destination: "/settings",
      },
      {
        source: "/app/super-admin",
        destination: "/super-admin",
      },
    ];
  },
};

export default nextConfig;
