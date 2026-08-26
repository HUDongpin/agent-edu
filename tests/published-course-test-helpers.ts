import {
  expect,
  type APIRequestContext,
  type Page,
  type Response,
  type ViewportSize,
} from "@playwright/test";

const SITE = "https://aicourse.top";
const MAX_SITEMAP_BYTES = 500 * 1024;

type IsolatedRoutePageOptions = {
  expectedStatus?: number;
  setup?: (page: Page) => Promise<void>;
  viewport?: ViewportSize;
};

/**
 * Exercise an independent document contract in a fresh Page while retaining
 * the parent Page's protected BrowserContext. Next.js route prefetch work can
 * outlive a document; reusing one Page for unrelated inventory entries makes
 * WebKit occasionally cancel the next top-level navigation. A fresh Page keeps
 * those lifecycles separate without bypassing the shared Provider and curated
 * evidence fixtures.
 */
export async function withIsolatedRoutePage<T>(
  parentPage: Page,
  path: string,
  assertion: (routePage: Page, response: Response) => Promise<T>,
  options: IsolatedRoutePageOptions = {},
): Promise<T> {
  const routePage = await parentPage.context().newPage();
  try {
    if (options.viewport) await routePage.setViewportSize(options.viewport);
    if (options.setup) await options.setup(routePage);
    const response = await routePage.goto(path);
    expect(response, `${path}: document response`).not.toBeNull();
    expect(response!.status(), `${path}: document status`).toBe(options.expectedStatus ?? 200);
    return await assertion(routePage, response!);
  } finally {
    if (!routePage.isClosed()) await routePage.close();
  }
}

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
