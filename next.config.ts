import type { NextConfig } from "next";

const lucideReactEntry = "lucide-react/dist/esm/lucide-react.js";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      "lucide-react": lucideReactEntry,
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "ui-avatars.com" },
    ],
  },
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "lucide-react": lucideReactEntry,
    };

    return config;
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
