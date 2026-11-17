import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.174.213.249"],
  async headers() {
    return [{
      source: "/assets/hero/video/:path*",
      headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    }];
  },
  // El PDF de la entrada lee la fuente y el logo del disco en runtime.
  outputFileTracingIncludes: {
    "/mi-inscripcion/entrada/pdf": [
      "./public/fonts/blowbrush.ttf",
      "./app/mi-inscripcion/entrada/pdf/logo.png",
    ],
  },
  images: {
    qualities: [75, 95],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
