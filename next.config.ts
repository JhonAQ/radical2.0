import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.174.213.249"],
  experimental: {
    // La captura del pago de una invitación se sube con una Server Action (Vercel admite hasta 4,5 MB).
    serverActions: { bodySizeLimit: "4mb" },
  },
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
    // AVIF pesa ~20-30 % menos que WebP; los navegadores que no lo soportan reciben WebP.
    formats: ["image/avif", "image/webp"],
    // 60: texturas y fondos decorativos, donde la compresión no se nota.
    qualities: [60, 75, 95],
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
