import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://radical.ielp.org";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // /inscripcion no va: sin sesión redirige al login (noindex).
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
  ];
}
