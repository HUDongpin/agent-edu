import { expect, test } from "@playwright/test";
import axe from "axe-core";

test("reviewed language deep link preserves unrelated query state and controls card routes", async ({ page }) => {
  await page.goto("/es/courses/?utm_source=language-contract&language=en#catalog-course-results");

  const language = page.getByLabel("Idioma del curso");
  await expect(language).toHaveValue("en");
  expect(new URL(page.url()).searchParams.get("utm_source")).toBe("language-contract");

  const releasedCards = page.locator("#catalog-course-results > li");
  await expect(releasedCards.first()).toBeVisible();
  const reviewed = await releasedCards.evaluateAll((cards) => cards.map((card) => (
    card.querySelector("[data-course-reviewed-languages]")
      ?.getAttribute("data-course-reviewed-languages") ?? ""
  )));
  expect(reviewed.every((languages) => languages.split(",").includes("en"))).toBe(true);

  const prompts = page.locator('[data-course-id="prompts"]');
  const englishLink = page.locator('[data-course-id="prompts"] a.cinner');
  await expect(englishLink).toHaveAttribute("hreflang", "en");
  await expect(englishLink).toHaveAttribute("href", /\/en\/prompts\//);
  await expect(prompts).toContainText("English");

  await language.selectOption("zh-Hans");
  await expect(page).toHaveURL(/language=zh-Hans/);
  expect(new URL(page.url()).searchParams.get("utm_source")).toBe("language-contract");
  const filtered = page.locator("#catalog-course-results > li");
  await expect(filtered.first()).toBeVisible();
  const filteredReviewed = await filtered.evaluateAll((cards) => cards.map((card) => (
    card.querySelector("[data-course-reviewed-languages]")
      ?.getAttribute("data-course-reviewed-languages") ?? ""
  )));
  expect(filteredReviewed.every((languages) => languages.split(",").includes("zh-Hans"))).toBe(true);
});

test("Arabic catalog declares an English fallback before click with isolated direction", async ({ page }) => {
  await page.goto("/ar/courses/");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

  const prompts = page.locator('[data-course-id="prompts"]');
  await expect(prompts.locator('[data-course-language-fallback="true"]')).toBeVisible();
  await expect(prompts.locator('[data-course-content-language="en"]')).toContainText("English");
  await expect(prompts.locator('bdi[lang="en"][dir="ltr"]')).not.toHaveCount(0);
  await expect(prompts.locator("a.cinner")).toHaveAttribute("hreflang", "en");
  await expect(prompts.locator("a.cinner")).toHaveAttribute(
    "href",
    /\/en\/prompts\/\?fromLocale=ar/,
  );
});

test("catalog language UI reflows, retains 44px controls, and passes axe", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/de/courses/?language=en");

  const controls = page.locator(".catalog-filter select, .catalog-search-input");
  const boxes = await controls.evaluateAll((elements) => elements.map((element) => {
    const box = element.getBoundingClientRect();
    return { width: box.width, height: box.height };
  }));
  expect(boxes.length).toBeGreaterThan(0);
  expect(boxes.every(({ width, height }) => width > 0 && height >= 44)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.addScriptTag({ content: axe.source });
  const violations = await page.evaluate(async () => {
    const axeApi = (window as unknown as {
      axe: {
        run: (
          root: Document,
          options: { runOnly: { type: string; values: string[] } },
        ) => Promise<{ violations: Array<{ id: string; nodes: unknown[] }> }>;
      };
    }).axe;
    return (await axeApi.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] },
    })).violations;
  });
  expect(violations).toEqual([]);
});

test("catalog Course JSON-LD exposes reviewed arrays and no unreviewed parts", async ({ page }) => {
  await page.goto("/ar/courses/");
  const itemList = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) => (
    scripts.map((script) => JSON.parse(script.textContent ?? "null") as {
      "@type"?: string;
      itemListElement?: Array<{
        item: {
          inLanguage: string[];
          hasPart?: Array<{ inLanguage?: string | string[] }>;
        };
      }>;
    }).find((entry) => entry?.["@type"] === "ItemList")
  ));
  expect(itemList?.itemListElement?.length).toBeGreaterThan(0);

  for (const { item } of itemList?.itemListElement ?? []) {
    expect(Array.isArray(item.inLanguage)).toBe(true);
    expect(item.inLanguage.length).toBeGreaterThan(0);
    for (const part of item.hasPart ?? []) {
      const languages = Array.isArray(part.inLanguage)
        ? part.inLanguage
        : part.inLanguage
          ? [part.inLanguage]
          : [];
      expect(languages.length).toBeGreaterThan(0);
      expect(languages.every((language) => item.inLanguage.includes(language))).toBe(true);
    }
  }
});
