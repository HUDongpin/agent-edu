import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

export const dynamic = "force-static";

/**
 * Published material is discoverable through the sitemap. Unpublished course
 * names stay out of this public SEO surface entirely; their routes fail closed
 * as static 404s instead of being advertised through Disallow entries.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: "*",
      allow: "/",
    }],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
