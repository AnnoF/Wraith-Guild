import type { MetadataRoute } from "next";

const SITE_URL = "https://wraith-guild.fr";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/candidature`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/galerie`, changeFrequency: "weekly", priority: 0.5 }
  ];
}
