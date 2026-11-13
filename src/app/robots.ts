import type { MetadataRoute } from "next";

const SITE_URL = "https://wraith-guild.fr";

// Seules les pages publiques sont à indexer ; le reste exige une connexion.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/candidature", "/galerie"],
      disallow: ["/api/", "/dashboard", "/raids/", "/officier/", "/admin", "/membres", "/presence", "/guide", "/hall-of-fame", "/candidatures"]
    },
    sitemap: `${SITE_URL}/sitemap.xml`
  };
}
