import { expect, type APIRequestContext } from "@playwright/test";

const SITE = "https://aicourse.top";
const MAX_SITEMAP_BYTES = 500 * 1024;

function decodeXmlText(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}

function locations(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => decodeXmlText(match[1].trim()));
}

/** Traverse the published sitemap index and return only page URLs. */
export async function publishedSitemapUrls(
  request: APIRequestContext,
): Promise<Set<string>> {
  const pending = ["/sitemap.xml"];
  const visited = new Set<string>();
  const pageUrls = new Set<string>();

  while (pending.length) {
    const path = pending.shift()!;
    if (visited.has(path)) continue;
    visited.add(path);

    const response = await request.get(path);
    expect(response.status(), `${path} must be published`).toBe(200);
    const body = await response.body();
    expect(body.byteLength, `${path} must stay within 500 KiB`).toBeLessThanOrEqual(
      MAX_SITEMAP_BYTES,
    );
    const xml = body.toString("utf8");
    const sitemapLocations = locations(xml);
    if (/<sitemapindex(?:\s|>)/.test(xml)) {
      for (const location of sitemapLocations) {
        const url = new URL(location);
        expect(url.origin).toBe(SITE);
        pending.push(url.pathname);
      }
      continue;
    }

    expect(xml).toMatch(/<urlset(?:\s|>)/);
    for (const location of sitemapLocations) pageUrls.add(location);
  }

  return pageUrls;
}
