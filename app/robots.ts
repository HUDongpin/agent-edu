import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

export const dynamic = "force-static";

/**
 * Everything here is meant to be found and reused — the licence says so — so
 * nothing is disallowed. This file exists to point at the sitemap, which is
 * the only way a crawler learns that the eight non-English versions exist.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
