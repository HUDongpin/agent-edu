import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "../e2e/fixtures";

const ORIGIN = process.env.COURSE15_PHASE3_ORIGIN ?? "";
const EVIDENCE_LABEL = process.env.PHASE3_EVIDENCE_LABEL;
const EVIDENCE_ROOT = EVIDENCE_LABEL
  ? join(process.cwd(), "output/playwright/course15-phase3", EVIDENCE_LABEL)
  : null;
const PROGRESS_KEY = "ae.progress";
const THEME_KEY = "ae.theme";
const MODULE_ONE = "workflow-agent-boundary";
const MODULE_THREE = "chaining-routing";
const MODULE_FIFTEEN = "production-orchestration-capstone";
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 820, height: 1180 },
  { width: 390, height: 844 },
  { width: 320, height: 700 },
] as const;
const LOCALES = ["en", "zh-Hans"] as const;
const THEMES = ["light", "dark"] as const;

interface MatrixRow {
  readonly browser: string;
  readonly locale: typeof LOCALES[number];
  readonly theme: typeof THEMES[number];
  readonly viewport: typeof VIEWPORTS[number];
  readonly scrollWidth: number;
  readonly clientWidth: number;
  readonly scrollHeight: number;
  readonly ctaBottom: number | null;
  readonly colorScheme: string;
  readonly fontFamily: string;
  readonly headingFontSize: string;
  readonly headingLetterSpacing: string;
  readonly headingLineHeight: string;
  readonly navigatorFontSize: string;
  readonly navigatorFontWeight: string;
  readonly navigatorStateFontSize: string;
  readonly workspaceBackground: string;
  readonly workspaceContrast: number;
  readonly workspaceForeground: string;
  readonly screenshot: string;
}

function channelToLinear(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(color: string): number {
  const channels = color.match(/[\d.]+/gu)?.slice(0, 3).map(Number);
  if (!channels || channels.length !== 3) return 0;
  return 0.2126 * channelToLinear(channels[0])
    + 0.7152 * channelToLinear(channels[1])
    + 0.0722 * channelToLinear(channels[2]);
}

function contrast(foreground: string, background: string): number {
  const light = Math.max(luminance(foreground), luminance(background));
  const dark = Math.min(luminance(foreground), luminance(background));
  return (light + 0.05) / (dark + 0.05);
}

function evidenceDirectory(browserName: string): string {
  if (!EVIDENCE_ROOT) return "";
  const directory = join(EVIDENCE_ROOT, browserName);
  mkdirSync(directory, { recursive: true });
  return directory;
}

async function waitForStorage(page: Page) {
  await expect(page.getByTestId("agent-orchestration-progress").first())
    .toHaveAttribute("data-storage-status", "available");
}

async function setTheme(page: Page, theme: typeof THEMES[number]) {
  await page.evaluate(({ key, selected }) => {
    localStorage.setItem(key, selected);
    document.documentElement.setAttribute("data-theme", selected);
  }, { key: THEME_KEY, selected: theme });
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
}

async function getStableWorkspaceContrast(page: Page): Promise<number> {
  const colors = await page.getByTestId("agent-orchestration-workspace-export")
    .evaluate((element) => {
      const style = getComputedStyle(element);
      const root = element.closest<HTMLElement>(
        '[data-testid="agent-orchestration-course"]',
      );
      const probe = document.createElement("span");
      probe.style.backgroundColor = "var(--brand)";
      probe.style.color = "var(--bg)";
      root?.append(probe);
      const expected = getComputedStyle(probe);
      const expectedBackground = expected.backgroundColor;
      const expectedForeground = expected.color;
      probe.remove();
      return {
        background: style.backgroundColor,
        expectedBackground,
        expectedForeground,
        foreground: style.color,
      };
    });
  if (
    colors.background !== colors.expectedBackground
    || colors.foreground !== colors.expectedForeground
  ) return 0;
  return contrast(colors.foreground, colors.background);
}

async function screenshot(
  page: Page,
  browserName: string,
  filename: string,
): Promise<string> {
  if (!EVIDENCE_ROOT) return "";
  const path = join(evidenceDirectory(browserName), filename);
  await page.screenshot({
    path,
    animations: "disabled",
    caret: "hide",
    scale: "css",
    type: "png",
  });
  return path;
}

async function activeStyle(locator: Locator) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  await locator.hover();
  const hover = await locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      backgroundColor: style.backgroundColor,
      borderColor: style.borderColor,
      boxShadow: style.boxShadow,
      transform: style.transform,
      transitionDuration: style.transitionDuration,
    };
  });
  await locator.page().mouse.move(
    box!.x + box!.width / 2,
    box!.y + box!.height / 2,
  );
  await locator.page().mouse.down();
  let active;
  try {
    await expect.poll(
      () => locator.evaluate((element) => getComputedStyle(element).transform),
      { intervals: [16, 32, 64], timeout: 1_000 },
    ).not.toBe(hover.transform);
    active = await locator.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        backgroundColor: style.backgroundColor,
        borderColor: style.borderColor,
        boxShadow: style.boxShadow,
        transform: style.transform,
        transitionDuration: style.transitionDuration,
      };
    });
  } finally {
    await locator.page().mouse.move(0, 0);
    await locator.page().mouse.up();
  }
  return { active, hover };
}

test.describe("Course 15 Phase 3 visual and state evidence", () => {
  test.describe.configure({ timeout: 240_000 });

  test("locale, theme, viewport, and browser matrix remains readable and bounded", async ({
    browserName,
    page,
  }) => {
    const rows: MatrixRow[] = [];
    await page.goto(`${ORIGIN}/en/agent-orchestration/`);
    await page.evaluate((key) => localStorage.removeItem(key), PROGRESS_KEY);

    for (const locale of LOCALES) {
      for (const theme of THEMES) {
        for (const viewport of VIEWPORTS) {
          await page.setViewportSize(viewport);
          const response = await page.goto(`${ORIGIN}/${locale}/agent-orchestration/`);
          expect.soft(response?.status(), `${browserName}/${locale}/${theme}/${viewport.width}`)
            .toBe(200);
          await waitForStorage(page);
          await setTheme(page, theme);
          await expect.poll(
            () => getStableWorkspaceContrast(page),
            { intervals: [20, 40, 80], timeout: 2_000 },
          ).toBeGreaterThanOrEqual(4.5);

          const observed = await page.evaluate(() => {
            const root = document.querySelector<HTMLElement>(
              '[data-testid="agent-orchestration-course"]',
            );
            const heading = root?.querySelector<HTMLElement>("h1");
            const cta = root?.querySelector<HTMLElement>("[data-course-journey-action]");
            const navLink = root?.querySelector<HTMLElement>(
              '[data-testid="agent-orchestration-course-navigator"] a',
            );
            const navState = root?.querySelector<HTMLElement>("[data-nav-state]");
            const workspace = root?.querySelector<HTMLElement>(
              '[data-testid="agent-orchestration-workspace-export"]',
            );
            const rootStyle = root ? getComputedStyle(root) : null;
            const headingStyle = heading ? getComputedStyle(heading) : null;
            const navLinkStyle = navLink ? getComputedStyle(navLink) : null;
            const navStateStyle = navState ? getComputedStyle(navState) : null;
            const workspaceStyle = workspace ? getComputedStyle(workspace) : null;
            return {
              clientWidth: document.documentElement.clientWidth,
              scrollHeight: document.documentElement.scrollHeight,
              scrollWidth: document.documentElement.scrollWidth,
              ctaBottom: cta?.getBoundingClientRect().bottom ?? null,
              colorScheme: rootStyle?.colorScheme ?? "",
              fontFamily: rootStyle?.fontFamily ?? "",
              headingFontSize: headingStyle?.fontSize ?? "",
              headingLetterSpacing: headingStyle?.letterSpacing ?? "",
              headingLineHeight: headingStyle?.lineHeight ?? "",
              navigatorFontSize: navLinkStyle?.fontSize ?? "",
              navigatorFontWeight: navLinkStyle?.fontWeight ?? "",
              navigatorStateFontSize: navStateStyle?.fontSize ?? "",
              workspaceBackground: workspaceStyle?.backgroundColor ?? "",
              workspaceForeground: workspaceStyle?.color ?? "",
            };
          });
          const workspaceContrast = contrast(
            observed.workspaceForeground,
            observed.workspaceBackground,
          );
          const filename = `${locale}-${theme}-${viewport.width}x${viewport.height}.png`;
          const screenshotPath = await screenshot(page, browserName, filename);
          rows.push({
            browser: browserName,
            locale,
            theme,
            viewport,
            ...observed,
            workspaceContrast,
            screenshot: screenshotPath,
          });

          expect.soft(
            observed.scrollWidth,
            `${browserName}/${locale}/${theme}/${viewport.width}: horizontal overflow`,
          ).toBe(observed.clientWidth);
          expect.soft(
            observed.ctaBottom,
            `${browserName}/${locale}/${theme}/${viewport.width}: journey action`,
          ).not.toBeNull();
          expect.soft(
            observed.ctaBottom ?? Number.POSITIVE_INFINITY,
            `${browserName}/${locale}/${theme}/${viewport.width}: CTA above fold`,
          ).toBeLessThanOrEqual(viewport.height);
          expect.soft(
            observed.colorScheme,
            `${browserName}/${locale}/${theme}/${viewport.width}: native color scheme`,
          ).toBe(theme);
          expect.soft(
            workspaceContrast,
            `${browserName}/${locale}/${theme}/${viewport.width}: workspace contrast`,
          ).toBeGreaterThanOrEqual(4.5);
          expect.soft(Number.parseFloat(observed.navigatorFontSize))
            .toBeGreaterThanOrEqual(13);
          expect.soft(Number(observed.navigatorFontWeight)).toBeGreaterThanOrEqual(680);
          expect.soft(Number.parseFloat(observed.navigatorStateFontSize))
            .toBeGreaterThanOrEqual(10.5);
          if (locale === "zh-Hans") {
            expect.soft(
              observed.fontFamily,
              `${browserName}/${theme}/${viewport.width}: explicit CJK stack`,
            ).toMatch(/PingFang SC|Noto Sans CJK SC|Microsoft YaHei/u);
            const headingSize = Number.parseFloat(observed.headingFontSize);
            expect.soft(Number.parseFloat(observed.headingLetterSpacing) / headingSize)
              .toBeGreaterThanOrEqual(-0.03);
            expect.soft(Number.parseFloat(observed.headingLineHeight) / headingSize)
              .toBeGreaterThanOrEqual(1.1);
          }
        }
      }
    }

    if (EVIDENCE_ROOT) {
      writeFileSync(
        join(evidenceDirectory(browserName), "matrix.json"),
        `${JSON.stringify(rows, null, 2)}\n`,
        "utf8",
      );
    }
  });

  test("functional evidence uses readable type in both native locales", async ({
    browserName,
    page,
  }) => {
    for (const locale of LOCALES) {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${ORIGIN}/${locale}/agent-orchestration/${MODULE_FIFTEEN}/`);
      await waitForStorage(page);
      const evidence = page.locator("[data-evidence] p").first();
      const sourceRole = page.locator('a[href*="github.com"]').filter({
        hasText: /Supporting|Version|补充|版本/u,
      }).first();
      const evidenceFont = Number.parseFloat(
        await evidence.evaluate((element) => getComputedStyle(element).fontSize),
      );
      expect.soft(evidenceFont, `${browserName}/${locale}: evidence label font`)
        .toBeGreaterThanOrEqual(11.5);
      if (await sourceRole.count()) {
        const sourceFont = Number.parseFloat(
          await sourceRole.evaluate((element) => getComputedStyle(element).fontSize),
        );
        expect.soft(sourceFont, `${browserName}/${locale}: source-role font`)
          .toBeGreaterThanOrEqual(12);
      }
    }
  });

  test("hover, active, disabled, and keyboard focus states are systematic", async ({
    browserName,
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${ORIGIN}/en/agent-orchestration/`);
    await waitForStorage(page);

    const journey = page.locator("[data-course-journey-action]");
    if (browserName === "chromium") {
      const journeyStates = await activeStyle(journey);
      expect.soft(journeyStates.active.transform, "journey active transform")
        .not.toBe(journeyStates.hover.transform);

      const workspaceAction = page.getByTestId("agent-orchestration-workspace-export");
      const workspaceStates = await activeStyle(workspaceAction);
      expect.soft(workspaceStates.hover, "workspace hover feedback")
        .not.toEqual(workspaceStates.active);

      const optionPath = `${ORIGIN}/en/agent-orchestration/assessment/`;
      await page.goto(optionPath);
      await expect(page.getByTestId("agent-orchestration-assessment"))
        .toHaveAttribute("aria-busy", "false");
      const option = page.getByTestId("agent-orchestration-assessment")
        .locator("label").first();
      const optionStates = await activeStyle(option);
      expect.soft(optionStates.active.transform, "assessment option active transform")
        .not.toBe(optionStates.hover.transform);
      await option.click();
      const marker = page.getByTestId("agent-orchestration-assessment-option-marker");
      await expect(marker).toContainText("Selected");
      expect.soft(Number.parseFloat(
        await marker.evaluate((element) => getComputedStyle(element).fontSize),
      )).toBeGreaterThanOrEqual(11.5);
      await screenshot(page, browserName, "assessment-selected.png");
      const submit = page.getByRole("button", { name: "Grade assessment" });
      await expect(submit).toBeDisabled();
      const disabledStyle = await submit.evaluate((element) => {
        const style = getComputedStyle(element);
        return { cursor: style.cursor, opacity: Number(style.opacity), transform: style.transform };
      });
      expect.soft(disabledStyle.cursor).toBe("not-allowed");
      expect.soft(disabledStyle.opacity).toBeLessThanOrEqual(0.65);
    }

    await page.goto(`${ORIGIN}/en/agent-orchestration/`);
    await waitForStorage(page);
    await page.locator("body").press("Home");
    let focusedJourney = false;
    for (let index = 0; index < 40; index += 1) {
      await page.keyboard.press("Tab");
      focusedJourney = await journey.evaluate((element) => element === document.activeElement);
      if (focusedJourney) break;
    }
    if (!focusedJourney && browserName === "webkit") {
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
      for (let index = 0; index < 40; index += 1) {
        await page.keyboard.press("Alt+Tab");
        focusedJourney = await journey.evaluate((element) => element === document.activeElement);
        if (focusedJourney) break;
      }
    }
    expect.soft(focusedJourney, `${browserName}: keyboard reaches journey action`).toBe(true);
    const focusStyle = await journey.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: Number.parseFloat(style.outlineWidth),
      };
    });
    expect.soft(focusStyle.outlineStyle).not.toBe("none");
    expect.soft(focusStyle.outlineWidth).toBeGreaterThanOrEqual(3);
    await screenshot(page, browserName, "keyboard-focus.png");
  });

  test("reduced motion resolves every Course 15 transition to zero duration", async ({
    browserName,
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${ORIGIN}/en/agent-orchestration/`);
    await waitForStorage(page);
    const durations = await page.locator(
      '[data-course-journey-action], [data-testid="agent-orchestration-course-navigator"] a, [data-testid="agent-orchestration-workspace-export"]',
    ).evaluateAll((elements) => elements.map((element) => getComputedStyle(element).transitionDuration));
    for (const duration of durations) {
      expect.soft(duration, `${browserName}: reduced transition`).toMatch(/^(?:0s)(?:, 0s)*$/u);
    }
    await screenshot(page, browserName, "reduced-motion.png");
  });

  test("CSS source declares the complete state and native-table contract", async ({
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "One source audit proves the shared CSS contract.");
    const shared = readFileSync(
      "components/agent-orchestration/AgentOrchestrationCourse.module.css",
      "utf8",
    );
    const navigation = readFileSync(
      "components/agent-orchestration/CourseNavigation.module.css",
      "utf8",
    );
    const assessment = readFileSync(
      "components/agent-orchestration/AssessmentInteractions.module.css",
      "utf8",
    );
    const workspace = readFileSync(
      "components/agent-orchestration/CourseWorkspacePortability.module.css",
      "utf8",
    );

    for (const [name, source] of [
      ["shared", shared],
      ["navigation", navigation],
      ["assessment", assessment],
      ["workspace", workspace],
    ] as const) {
      expect.soft(source, `${name}: tactile active state`).toMatch(/:active/u);
      expect.soft(source, `${name}: reduced-motion override`)
        .toMatch(/prefers-reduced-motion:\s*reduce/u);
      expect.soft(source, `${name}: coarse-pointer tap contract`)
        .toMatch(/touch-action:\s*manipulation/u);
    }
    expect.soft(navigation).toMatch(/\.courseNavigator:lang\(zh-Hans\)/u);
    expect.soft(shared).toMatch(/\.root:lang\(zh-Hans\)/u);
    expect.soft(shared).toMatch(/\.runtimeTable\s+tr/u);
    expect.soft(shared).toMatch(/\.runtimeTable\s+:is\(th, td\)/u);
    expect.soft(shared).not.toMatch(/\.runtimeTable\s*>\s*div/u);
    expect.soft(shared).toMatch(/\.evidenceMode[\s\S]*font-size:\s*0\.(?:7[2-9]|8)rem/u);
  });
});

test.describe("Course 15 Phase 3 coarse-pointer evidence", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

  test("coarse targets retain 44px geometry without sticky hover", async ({
    browserName,
    page,
  }) => {
    await page.goto(`${ORIGIN}/en/agent-orchestration/assessment/`);
    await expect(page.getByTestId("agent-orchestration-assessment"))
      .toHaveAttribute("aria-busy", "false");
    expect.soft(await page.evaluate(() => matchMedia("(pointer: coarse)").matches))
      .toBe(true);
    for (const locator of [
      page.getByTestId("agent-orchestration-course-navigator").getByRole("link"),
      page.getByTestId("agent-orchestration-assessment").locator("label"),
    ]) {
      for (const target of await locator.all()) {
        const box = await target.boundingBox();
        expect.soft(box).not.toBeNull();
        expect.soft(box?.height ?? 0).toBeGreaterThanOrEqual(44);
      }
    }
    await screenshot(page, browserName, "coarse-touch.png");
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.goto(`${ORIGIN}/en/agent-orchestration/`);
    await waitForStorage(page);
    const resetBox = await page.getByTestId("agent-orchestration-progress")
      .last().getByRole("button").boundingBox();
    expect.soft(resetBox).not.toBeNull();
    expect.soft(resetBox?.height ?? 0).toBeGreaterThanOrEqual(44);

    await page.goto(`${ORIGIN}/en/agent-orchestration/${MODULE_ONE}/`);
    await waitForStorage(page);
    const sharedTargets: Locator[] = [
      page.getByTestId("agent-orchestration-artifact-workbench").getByRole("button"),
      page.getByTestId("agent-orchestration-lab").locator('input[type="range"]').first(),
      page.getByTestId("agent-orchestration-lab").getByRole("button"),
      page.getByTestId("agent-orchestration-checkpoint").getByRole("button"),
      page.getByTestId("agent-orchestration-module-completion").getByRole("button"),
    ];
    for (const target of sharedTargets) {
      const box = await target.first().boundingBox();
      expect.soft(box).not.toBeNull();
      expect.soft(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
    await page.goto(`${ORIGIN}/en/agent-orchestration/${MODULE_THREE}/`);
    await waitForStorage(page);
    const select = page.getByTestId("agent-orchestration-lab")
      .locator("select").first();
    await select.scrollIntoViewIfNeeded();
    const selectBox = await select.boundingBox();
    expect.soft(selectBox).not.toBeNull();
    expect.soft(selectBox?.height ?? 0).toBeGreaterThanOrEqual(44);
    await screenshot(page, browserName, "coarse-course-controls.png");
  });
});
