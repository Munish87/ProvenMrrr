import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "ui-avatars.com" },
    ],
  },
  // Allow stripe webhooks to receive raw body
  async headers() {
    return [
      {
        source: "/api/webhooks/stripe",
        headers: [{ key: "content-type", value: "application/json" }],
      },
    ];
  },
};

export default nextConfig;
