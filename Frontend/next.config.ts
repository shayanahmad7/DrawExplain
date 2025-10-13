import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["source.unsplash.com"],
  },
  // Add webpack configuration for JWT compatibility
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        util: require.resolve("util/"),
      };
    }
    return config;
  },
  // Environment variables configuration
  env: {
    JWT_SECRET: process.env.JWT_SECRET,
  },
  // Ensure proper handling of API routes
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: "/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },
          {
            key: "Access-Control-Allow-Origin",
            value:
              process.env.NODE_ENV === "production"
                ? process.env.FRONTEND_URL || "https://drawexplain-74788697407.europe-west1.run.app"
                : "http://localhost:3001",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,DELETE,PATCH,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ];
  },
  // Output configuration for deployment
  output: "standalone",
};

export default nextConfig;
