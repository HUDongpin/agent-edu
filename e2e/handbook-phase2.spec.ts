import type { Locator } from "@playwright/test";
import { expect, test } from "./fixtures";

const MOBILE = { width: 390, height: 844 };
const SECTION_ORDER = [
  "start", "code", "prompt", "context", "loop", "graph",
  "harness", "evals", "security", "compare", "play",
] as const;

async function computedContrast(
  locator: Locator,
  property: "color" | "fill" | "borderTopColor",
  backgroundToken: "--bg" | "--surface",
) {
  return locator.evaluate((element, { property, backgroundToken }) => {
    const parse = (input: string) => {
      const value = input.trim();
      if (value.startsWith("#")) {
        const hex = value.slice(1);
        const full = hex.length === 3 ? [...hex].map((part) => part + part).join("") : hex;
        return [0, 2, 4].map((offset) => Number.parseInt(full.slice(offset, offset + 2), 16));
      }
      const numbers = (value.match(/[\d.]+/g) ?? []).map(Number);
      if (value.startsWith("color(srgb")) return numbers.slice(0, 3).map((part) => part * 255);
      return numbers.slice(0, 3);
    };
    const luminance = (rgb: number[]) => {
      const linear = rgb.map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
    };
    const style = getComputedStyle(element);
    const foreground = parse(style[property]);
    const background = parse(
      getComputedStyle(document.documentElement).getPropertyValue(backgroundToken),
    );
    const [lighter, darker] = [luminance(foreground), luminance(background)]
      .sort((a, b) => b - a);
    return (lighter + 0.05) / (darker + 0.05);
  }, { property, backgroundToken });
}

test("optional Start references use progressive disclosure without hiding the primary route", async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto("/en/handbook/#start");

  const practices = page.locator('[data-disclosure="start-practices"]');
  const guide = page.locator('[data-disclosure="start-guide"]');
  await expect(practices).toHaveJSProperty("open", false);
  await expect(guide).toHaveJSProperty("open", false);
  await expect(practices.locator(".cards4")).toBeHidden();
  await expect(guide.locator("#depMap")).toBeHidden();

  await expect(page.locator("#dialSvg")).toBeVisible();
  await expect(page.locator('#p-start [data-goto="play"]')).toBeVisible();
  await expect(page.locator('#p-start .section-nav [data-goto="code"]')).toBeVisible();

  await practices.locator("summary").click();
  await expect(practices.locator(".cards4")).toBeVisible();
  await practices.locator('[data-goto="code"]').first().click();
  await expect(page.locator("#p-code")).toBeVisible();
  await expect(page).toHaveURL(/#code$/);
});

test("Compare keeps decision support visible and opens its optional glossary on demand", async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto("/en/handbook/#compare");

  await expect(page.locator("#p-compare .tablewrap")).toBeVisible();
  await expect(page.locator("#decider")).toBeVisible();
  await expect(page.locator("#recBox")).toBeVisible();

  const reference = page.locator('[data-disclosure="compare-reference"]');
  await expect(reference).toHaveJSProperty("open", false);
  await expect(reference.locator("#nestSvg")).toBeHidden();
  await expect(reference.locator("#glossary")).toBeHidden();

  await page.locator("#glossBtn").click();
  await expect(reference).toHaveJSProperty("open", true);
  await expect(reference.locator("#glossary")).toBeVisible();
  await expect(reference.locator("#glossary")).toBeInViewport();
});

test("the mobile section rail communicates position and keeps the active section visible", async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto("/en/handbook/#start");

  const guide = page.locator(".hb .rail-title");
  const rail = page.locator("#rail");
  await expect(guide).toBeVisible();
  await expect(guide).toContainText(/progression/i);
  await expect(guide).toContainText(/swipe/i);
  await expect(rail).toHaveAttribute("aria-describedby", "railSwipe");
  await expect(page.locator(".hb nav.rail")).toHaveAccessibleName("Sections");
  const railGeometry = await rail.evaluate((element) => {
    const tabs = [...element.querySelectorAll<HTMLElement>(".rail-btn")];
    const rects = tabs.map((tab) => tab.getBoundingClientRect());
    return {
      overflows: element.scrollWidth > element.clientWidth + 4,
      overlaps: rects.some((rect, index) => index > 0 && rect.left < rects[index - 1].right - 1),
    };
  });
  expect(railGeometry.overflows).toBe(true);
  expect(railGeometry.overlaps).toBe(false);

  await page.locator("#tab-security").click();
  await expect(guide).toContainText(/2\s*\/\s*11/);
  const activeInsideRail = await page.evaluate(() => {
    const railElement = document.querySelector<HTMLElement>("#rail");
    const active = document.querySelector<HTMLElement>('#rail [aria-selected="true"]');
    if (!railElement || !active) return false;
    const railBox = railElement.getBoundingClientRect();
    const activeBox = active.getBoundingClientRect();
    return activeBox.left >= railBox.left - 1 && activeBox.right <= railBox.right + 1;
  });
  expect(activeInsideRail).toBe(true);
});

test("overflowing diagrams and tables are named keyboard-scroll regions with progress", async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto("/en/handbook/#compare");

  const wrapper = page.locator("#p-compare .tablewrap");
  await expect(wrapper).toHaveAttribute("tabindex", "0");
  await expect(wrapper).toHaveAttribute("role", "region");
  await expect(wrapper).toHaveAttribute("aria-label", /comparison|approach/i);
  const hintId = await wrapper.getAttribute("aria-describedby");
  expect(hintId).toMatch(/^scrollhint-/);

  const hint = page.locator(`#${hintId}`);
  await expect(hint).toBeVisible();
  await expect(hint).toContainText(/swipe|arrow/i);
  await expect(hint.locator(".scrollmeter")).toBeVisible();

  await wrapper.focus();
  const before = await wrapper.evaluate((element) => element.scrollLeft);
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => wrapper.evaluate((element) => element.scrollLeft))
    .not.toBe(before);
  await expect.poll(async () => {
    const box = await hint.locator(".scrollmeter > span").boundingBox();
    return box?.width ?? 0;
  }).toBeGreaterThan(0);
});

test("all 21 authored horizontal surfaces keep a legible, local, accessible overflow path", async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto("/en/handbook/#start");
  let wrapperCount = 0;

  for (const section of SECTION_ORDER) {
    await page.locator(`#tab-${section}`).click();
    const panel = page.locator(`#p-${section}`);
    const disclosures = panel.locator("details.course-disclosure");
    for (let index = 0; index < await disclosures.count(); index += 1) {
      await disclosures.nth(index).evaluate((element: HTMLDetailsElement) => { element.open = true; });
    }

    const wrappers = panel.locator(".fcwrap,.graphscroll,.tablewrap");
    wrapperCount += await wrappers.count();
    for (let index = 0; index < await wrappers.count(); index += 1) {
      const wrapper = wrappers.nth(index);
      await expect(wrapper).toHaveAttribute("tabindex", "0");
      await expect(wrapper).toHaveAttribute("role", "region");
      await expect(wrapper).toHaveAttribute("aria-label", /\S/);
      const hintId = await wrapper.getAttribute("aria-describedby");
      expect(hintId).toMatch(/^scrollhint-/);
      await expect(page.locator(`#${hintId}`)).toBeVisible();
      const metrics = await wrapper.evaluate((element) => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      }));
      expect(metrics.scrollWidth).toBeGreaterThan(metrics.clientWidth + 4);
      expect(metrics.pageOverflow).toBeLessThanOrEqual(1);
    }
  }
  expect(wrapperCount).toBe(21);
});

test("authored diagrams retain readable scale and reveal every focused SVG control", async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto("/en/handbook/#start");

  const points = page.locator("#dialSvg .scatter-pt");
  await expect(points).toHaveCount(4);
  for (const index of [0, 1, 2, 3, 2, 1, 0]) {
    await points.nth(index).evaluate((element) => (element as HTMLElement).focus());
    await expect.poll(() => points.nth(index).evaluate((element) => {
      const target = element.getBoundingClientRect();
      const wrapper = element.closest(".fcwrap")!.getBoundingClientRect();
      return target.left >= wrapper.left - 1 && target.right <= wrapper.right + 1;
    })).toBe(true);
  }
  const guide = page.locator('[data-disclosure="start-guide"]');
  await guide.locator("summary").click();
  await expect.poll(() => page.locator("#depMap").evaluate((element) =>
    element.getBoundingClientRect().width,
  )).toBeGreaterThanOrEqual(840);
  const dependencyTarget = page.locator("#depMap .dm-box").last();
  const dependencyBox = await dependencyTarget.boundingBox();
  expect(dependencyBox?.height ?? 0).toBeGreaterThanOrEqual(44);
  await dependencyTarget.evaluate((element) => (element as HTMLElement).focus());
  await expect.poll(() => dependencyTarget.evaluate((element) => {
    const target = element.getBoundingClientRect();
    const wrapper = element.closest(".fcwrap")!.getBoundingClientRect();
    return target.left >= wrapper.left - 1 && target.right <= wrapper.right + 1;
  })).toBe(true);

  await page.locator("#tab-graph").click();
  await expect.poll(() => page.locator("#graphSvg").evaluate((element) =>
    element.getBoundingClientRect().width,
  )).toBeGreaterThanOrEqual(1010);
});

for (const theme of ["light", "dark"] as const) {
  test(`${theme}: muted diagram text and control boundaries retain contrast`, async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.addInitScript((selectedTheme) => {
      localStorage.setItem("ae.theme", selectedTheme);
    }, theme);
    await page.goto("/en/handbook/#graph");
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);

    expect(await computedContrast(page.locator("#rail .num").first(), "color", "--bg"))
      .toBeGreaterThanOrEqual(4.5);
    expect(await computedContrast(page.locator("#graphSvg .g-node text").first(), "fill", "--surface"))
      .toBeGreaterThanOrEqual(4.5);
    expect(await computedContrast(page.locator("#graphSvg .g-elabel:not(.backlabel)").first(), "fill", "--surface"))
      .toBeGreaterThanOrEqual(4.5);
    expect(await computedContrast(page.locator("#p-graph .btn").first(), "borderTopColor", "--surface"))
      .toBeGreaterThanOrEqual(3);

    await page.locator("#tab-compare").click();
    const node = page.locator("#fcDecide .fc-n").first();
    await node.evaluate((element) => element.classList.add("dim"));
    expect(await computedContrast(node.locator("text").first(), "fill", "--surface"))
      .toBeGreaterThanOrEqual(4.5);
  });
}

test("sticky navigation layers never overlap at the 979/980 boundary or in Arabic", async ({ page }) => {
  for (const { locale, width } of [
    { locale: "en", width: 390 },
    { locale: "ar", width: 390 },
    { locale: "en", width: 979 },
    { locale: "en", width: 980 },
    { locale: "ar", width: 980 },
  ]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(`/${locale}/handbook/#graph`);
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, 600);
    });
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
    const geometry = await page.evaluate(() => {
      const topbar = document.querySelector(".topbar")!.getBoundingClientRect();
      const rail = document.querySelector(".hb .rail")!.getBoundingClientRect();
      return {
        topbarBottom: topbar.bottom,
        railTop: rail.top,
        railBottom: rail.bottom,
        railHeight: rail.height,
        viewportHeight: innerHeight,
      };
    });
    expect(geometry.railTop).toBeGreaterThanOrEqual(geometry.topbarBottom - 1);
    expect(geometry.railBottom).toBeLessThanOrEqual(geometry.viewportHeight + 1);
    if (width < 980) expect(geometry.railHeight).toBeLessThanOrEqual(82);
  }
});

test("Arabic rail naming, progress, and overflow help are localized", async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto("/ar/handbook/#start");
  await expect(page.locator(".hb nav.rail")).toHaveAccessibleName("الأقسام");
  await expect(page.locator("#railSwipe")).toContainText("اسحب");
  await page.locator("#tab-security").click();
  await expect(page.locator(".hb .rail-title")).toContainText(/2\s*\/\s*11/);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});

test("print exposes every closed disclosure body", async ({ page }) => {
  await page.goto("/en/handbook/#start");
  await page.emulateMedia({ media: "print" });
  const states = await page.locator("details.course-disclosure").evaluateAll((details) =>
    details.map((detail) => {
      const body = [...detail.children].find((child) => child.tagName !== "SUMMARY") as HTMLElement;
      const style = getComputedStyle(body);
      const box = body.getBoundingClientRect();
      return { display: style.display, visibility: style.visibility, height: box.height };
    }),
  );
  expect(states).toHaveLength(11);
  for (const state of states) {
    expect(state.display).not.toBe("none");
    expect(state.visibility).not.toBe("hidden");
    expect(state.height).toBeGreaterThan(0);
  }
});

test("primary mobile controls meet the 44px target contract", async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto("/en/handbook/#start");

  const targets = [
    page.locator(".topbar .logo"),
    page.locator(".topbar .navtoggle"),
    page.locator(".topbar .langwrap > button"),
    page.locator(".topbar .topacts > button"),
    page.locator("#glossBtn"),
    page.locator('#p-start [data-goto="play"]'),
    page.locator('#p-start .section-nav [data-goto="code"]'),
  ];

  for (const target of targets) {
    const box = await target.boundingBox();
    expect(box, "target must be rendered").not.toBeNull();
    expect(box!.width, "target width").toBeGreaterThanOrEqual(44);
    expect(box!.height, "target height").toBeGreaterThanOrEqual(44);
  }
});

test.describe("Course 1 progressive disclosure without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("native summaries reveal the full optional teaching content", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto("/en/handbook/#start");
    const practices = page.locator('[data-disclosure="start-practices"]');
    await expect(practices.locator(".cards4")).toBeHidden();
    await practices.locator("summary").click();
    await expect(practices.locator(".cards4")).toBeVisible();
  });
});

test.describe("Course 1 with reduced motion", () => {
  test("disclosures, section changes, and scroll cues honor the operating-system preference", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/en/handbook/#start");
    await expect.poll(() => page.locator("html").evaluate((element) =>
      getComputedStyle(element).scrollBehavior,
    )).toBe("auto");
    const durations = await page.locator("#p-start, [data-disclosure='start-guide'] > summary, .scrollmeter > span")
      .evaluateAll((elements) => elements.map((element) => ({
        animation: Number.parseFloat(getComputedStyle(element).animationDuration) || 0,
        transition: Number.parseFloat(getComputedStyle(element).transitionDuration) || 0,
      })));
    for (const duration of durations) {
      expect(duration.animation).toBeLessThanOrEqual(0.001);
      expect(duration.transition).toBeLessThanOrEqual(0.001);
    }
  });
});
