import { expect, test } from "@playwright/test";

const COURSE20_ROUTE_PATHS = [
  "/en/agentic-video-editing/",
  "/en/agentic-video-editing/agentic-editing-contract/",
  "/zh-Hans/agentic-video-editing/",
  "/zh-Hans/agentic-video-editing/production-capstone/",
] as const;

const COURSE20_ASSET_PATHS = [
  "/courses/agentic-video-editing/fixtures.provenance.json",
  "/courses/agentic-video-editing/lab/frozen/course20-original-fixture.mp4",
] as const;

function sitemapLocations(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

test("Course 20 HOLD keeps every learning route and downloadable asset private", async ({
  request,
}) => {
  for (const path of [...COURSE20_ROUTE_PATHS, ...COURSE20_ASSET_PATHS]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
  }
});

test("the public catalogue names Agentic Video Editing as Course 20 without a start link", async ({
  page,
}) => {
  const response = await page.goto("/en/courses/");
  expect(response?.status()).toBe(200);

  const card = page.locator('[data-course-id="agentic-video-editing"]');
  await expect(card).toBeVisible();
  await expect(card.locator(".catalog-course-number")).toHaveText("Course 20");
  await expect(card.getByRole("heading", {
    name: "Agentic Video Editing: From Intent to a Verified Cut",
  })).toBeVisible();
  await expect(card.locator('.catalog-course-disabled[aria-disabled="true"]'))
    .toBeVisible();
  await expect(card.locator(".catalog-course-status")).toHaveText("Coming soon");
  await expect(card.locator("a[href]")).toHaveCount(0);
  await expect(card.locator('[role="progressbar"]')).toHaveCount(0);
});

test("Course 20 HOLD stays out of every public sitemap shard", async ({ request }) => {
  const indexResponse = await request.get("/sitemap.xml");
  expect(indexResponse.status()).toBe(200);
  const shardPaths = sitemapLocations(await indexResponse.text()).map(
    (location) => new URL(location).pathname,
  );
  expect(shardPaths.length).toBeGreaterThan(0);

  for (const shardPath of shardPaths) {
    const response = await request.get(shardPath);
    expect(response.status(), shardPath).toBe(200);
    expect(await response.text(), shardPath).not.toContain(
      "/agentic-video-editing/",
    );
  }
});
