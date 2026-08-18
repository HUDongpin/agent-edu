import type { MetadataRoute } from "next";

export const dynamic = "force-static";

/**
 * Everything here is meant to be found and reused — the licence says so — so
 * nothing is disallowed. This file exists to point at the sitemap, which is
 * the only way a crawler learns that the eight non-English versions exist.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "https://aicourse.top/sitemap.xml",
    host: "https://aicourse.top",
  };
}
