import { expect, test, type Browser, type Page } from "@playwright/test";
import axe from "axe-core";
import { AI_PYTHON_DATA_COURSE } from "../lib/ai-python-data";
import { AI_RESEARCH_COURSE } from "../lib/ai-research";
import {
  courseKitModuleCompleteKey,
  createCourseKitProgressConfig,
} from "../lib/course-kit/progress";
import { drawCourseKitQuizQuestions } from "../lib/course-kit/quiz";
import type { CourseKitDefinition } from "../lib/course-kit/types";
import { materialiseCourseKit } from "../lib/course-kit/locale";
import { DEEP_LEARNING_COURSE } from "../lib/deep-learning";
import { MACHINE_LEARNING_COURSE } from "../lib/machine-learning";
import { PRODUCTION_AI_COURSE } from "../lib/production-ai";
import { RESPONSIBLE_AI_COURSE } from "../lib/responsible-ai";

const SITE = "https://aicourse.top";
const STORAGE_KEY = "ae.progress";
const CORRUPT_BACKUP_KEY = "ae.progress.course-kit-corrupt-backup";

function evidenceReceipt({
  definition,
  artifactId,
  kind,
}: {
  definition: CourseKitDefinition;
  artifactId: string;
  kind: "module-artifact" | "capstone-artifact";
}) {
  return JSON.stringify({
    schemaVersion: "aicourse.evidence-receipt.v1",
    kind,
    courseId: definition.manifest.id,
    courseVersion: definition.manifest.version,
    artifactId,
    artifactPath: `artifacts/${artifactId}.json`,
    sha256: "0".repeat(64),
    validator: {
      id: `aicourse.${definition.manifest.id}.validator.v1`,
      command: `python public/courses/${definition.manifest.id}/lab/validate.py --package artifacts/package.json`,
      status: "pass",
      checkedOn: "2026-08-26",
    },
    reviewer: { role: "peer reviewer", decision: "accept" },
    limitations: ["Course fixture evidence only; no external certification."],
  });
}

/** The user-approved release scope is fixed at Course 16 through Course 21. */
const COURSES: readonly CourseKitDefinition[] = [
  RESPONSIBLE_AI_COURSE,
  AI_RESEARCH_COURSE,
  AI_PYTHON_DATA_COURSE,
  MACHINE_LEARNING_COURSE,
  DEEP_LEARNING_COURSE,
  PRODUCTION_AI_COURSE,
];

const pathFor = (locale: string, courseId: string, moduleSlug?: string) =>
  `/${locale}/${courseId}/${moduleSlug ? `${moduleSlug}/` : ""}`;

function rootFor(page: Page, courseId: string) {
  return page.locator(`[data-course-kit="${courseId}"]`);
}

async function expectSuccessfulNavigation(page: Page, path: string) {
  const response = await page.goto(path, { waitUntil: "networkidle" });
  expect(response?.status(), path).toBe(200);
  await expect(page.locator("main#main")).toHaveCount(1);
}

async function jsonLd(page: Page): Promise<Record<string, unknown>> {
  const raw = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(raw).toBeTruthy();
  return JSON.parse(raw ?? "{}") as Record<string, unknown>;
}

async function expectContentAlternates(page: Page) {
  const languages = await page
    .locator('link[rel="alternate"][hreflang]')
    .evaluateAll((links) =>
      links
        .map((link) => link.getAttribute("hreflang"))
        .filter((value): value is string => Boolean(value))
        .sort(),
    );
  expect(languages).toEqual(["en", "x-default", "zh-Hans"].sort());
}

async function externalRequests(page: Page, path: string): Promise<string[]> {
  const requested = new Set<string>();
  const listener = (request: { url(): string }) => {
    requested.add(request.url());
  };
  page.on("request", listener);
  await expectSuccessfulNavigation(page, path);
  await page.waitForLoadState("networkidle");
  page.off("request", listener);
  const allowedOrigin = new URL(page.url()).origin;
  return [...requested].filter((requestUrl) => {
    const url = new URL(requestUrl);
    return url.protocol !== "data:" && url.origin !== allowedOrigin;
  });
}

async function externalRequestsDuring(
  page: Page,
  action: () => Promise<void>,
): Promise<string[]> {
  const requested = new Set<string>();
  const listener = (request: { url(): string }) => requested.add(request.url());
  page.on("request", listener);
  await action();
  await page.waitForTimeout(50);
  page.off("request", listener);
  const allowedOrigin = new URL(page.url()).origin;
  return [...requested].filter((requestUrl) => {
    const url = new URL(requestUrl);
    return url.protocol !== "data:" && url.origin !== allowedOrigin;
  });
}

async function seriousAxeViolations(page: Page) {
  await page.addScriptTag({ content: axe.source });
  return page.evaluate(async () => {
    const axeApi = (window as unknown as {
      axe: {
        run: (
          root: Document,
          options: Readonly<Record<string, unknown>>,
        ) => Promise<{
          violations: readonly {
            id: string;
            impact: string | null;
            nodes: readonly { target: readonly string[]; html: string }[];
          }[];
        }>;
      };
    }).axe;
    const result = await axeApi.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
      },
      resultTypes: ["violations"],
    });
    return result.violations
      .filter((violation) =>
        violation.impact === "serious" || violation.impact === "critical",
      )
      .map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        nodes: violation.nodes.map((node) => ({
          target: node.target,
          html: node.html,
        })),
      }));
  });
}

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    document: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport + 1);
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
}

async function expectCourseControlsAtLeast44(page: Page, courseId: string) {
  const tooSmall = await rootFor(page, courseId)
    .locator("button:not(:disabled), summary, a[href], input[type=radio], input[type=checkbox]")
    .evaluateAll((nodes) =>
      nodes.flatMap((node) => {
        const target = node instanceof HTMLInputElement
          ? node.closest("label") ?? node
          : node;
        const rect = target.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return [];
        if (rect.width >= 44 && rect.height >= 44) return [];
        return [
          {
            tag: target.tagName,
            text: (target.textContent ?? "").trim().slice(0, 80),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
        ];
      }),
    );
  expect(tooSmall, `${courseId} has undersized course controls`).toEqual([]);
}

async function newIsolatedPage(
  browser: Browser,
  init: () => void,
): Promise<{ page: Page; close: () => Promise<void> }> {
  const context = await browser.newContext();
  await context.addInitScript(init);
  return {
    page: await context.newPage(),
    close: () => context.close(),
  };
}

test("@engine-smoke all six released dashboards render", async ({ page }) => {
  for (const definition of COURSES) {
    const { id } = definition.manifest;
    await expectSuccessfulNavigation(page, pathFor("en", id));
    await expect(rootFor(page, id)).toBeVisible();
    await expect(rootFor(page, id).getByRole("heading", { level: 1 })).toBeVisible();
  }
});

for (const definition of COURSES) {
  const { id, displayNumber, modules } = definition.manifest;
  const english = definition.copy.en;

  test.describe(`${displayNumber} ${id}`, () => {
    test("English and Simplified Chinese dashboards and every module are exported", async ({ page }) => {
      for (const locale of ["en", "zh-Hans"] as const) {
        await expectSuccessfulNavigation(page, pathFor(locale, id));
        const root = rootFor(page, id);
        await expect(root).toHaveAttribute("lang", locale);
        await expect(root).toHaveAttribute("dir", "ltr");
        await expect(root).toHaveAttribute("data-course-number", String(displayNumber));
        await expect(root.getByRole("heading", { level: 1 })).toBeVisible();
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
          "href",
          `${SITE}/${locale}/${id}/`,
        );
        await expectContentAlternates(page);
        const courseSchema = await jsonLd(page);
        expect(courseSchema["@type"]).toBe("Course");
        expect(courseSchema.inLanguage).toBe(locale);
        expect(courseSchema.hasPart).toHaveLength(modules.length);

        for (const moduleManifest of modules) {
          const modulePath = pathFor(locale, id, moduleManifest.slug);
          await expectSuccessfulNavigation(page, modulePath);
          await expect(rootFor(page, id)).toHaveAttribute(
            "data-course-module",
            moduleManifest.slug,
          );
          await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
            "href",
            `${SITE}${modulePath}`,
          );
          const moduleSchema = await jsonLd(page);
          expect(moduleSchema["@type"]).toBe("LearningResource");
          expect(moduleSchema.inLanguage).toBe(locale);
          expect(moduleSchema.position).toBe(moduleManifest.order);
        }
      }
    });

    test("fallback metadata is honest and Arabic keeps an RTL shell around LTR English", async ({ page }) => {
      for (const locale of ["fr", "ar"] as const) {
        await expectSuccessfulNavigation(page, pathFor(locale, id));
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(page.locator("html")).toHaveAttribute(
          "dir",
          locale === "ar" ? "rtl" : "ltr",
        );
        const root = rootFor(page, id);
        await expect(root).toHaveAttribute("lang", "en");
        await expect(root).toHaveAttribute("dir", "ltr");
        await expect(root.locator("aside").first()).toContainText("en");
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
          "href",
          `${SITE}/en/${id}/`,
        );
        await expectContentAlternates(page);
        expect((await jsonLd(page)).inLanguage).toBe("en");
      }
    });

    test("desktop/mobile, themes, reduced motion, touch targets, and mobile keyboard control", async ({ page }) => {
      await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.addInitScript(() => {
        if (!localStorage.getItem("ae.theme")) localStorage.setItem("ae.theme", "dark");
      });
      await expectSuccessfulNavigation(page, pathFor("en", id));
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      await expectNoHorizontalOverflow(page);
      await expectCourseControlsAtLeast44(page, id);

      await page.setViewportSize({ width: 390, height: 844 });
      await page.emulateMedia({ colorScheme: "light", reducedMotion: "no-preference" });
      await page.evaluate(() => localStorage.setItem("ae.theme", "light"));
      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
      await expectNoHorizontalOverflow(page);
      await expectCourseControlsAtLeast44(page, id);

      const toggle = page.locator(".navtoggle");
      await toggle.focus();
      await toggle.press("Enter");
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await page.keyboard.press("Tab");
      await expect(page.locator(".mainnav a").first()).toBeFocused();
      await toggle.focus();
      await toggle.press("Enter");
      await toggle.press("Enter");
      await page.keyboard.press("Escape");
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await expect(toggle).toBeFocused();

      await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
      await page.evaluate(() => localStorage.setItem("ae.theme", "dark"));
      await expectSuccessfulNavigation(page, pathFor("en", id, modules[0].slug));
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      await expectNoHorizontalOverflow(page);
      await expectCourseControlsAtLeast44(page, id);
      const courseMap = rootFor(page, id).locator("details").first();
      const courseMapSummary = courseMap.locator("summary");
      await courseMapSummary.focus();
      await courseMapSummary.press("Enter");
      await expect(courseMap).toHaveAttribute("open", "");
      await page.keyboard.press("Tab");
      await expect(courseMap.locator("a").first()).toBeFocused();
    });

    test("checkpoint, same-tab progress event, persistence, and per-course reset work", async ({ page }) => {
      const firstModule = modules[0];
      const checkpoint = english.modules[firstModule.slug].checkpoint;
      await expectSuccessfulNavigation(page, pathFor("en", id, firstModule.slug));
      const checkpointSection = page
        .locator("section")
        .filter({ has: page.getByRole("heading", { name: checkpoint.question }) });
      await checkpointSection
        .locator('input[type="radio"]')
        .nth(checkpoint.correctIndex)
        .check();
      await checkpointSection.getByRole("button", { name: english.ui.checkAnswer }).click();
      await expect(checkpointSection.getByRole("status")).toContainText(english.ui.correct);

      const completion = page.locator("section").filter({
        has: page.getByRole("button", { name: english.ui.markModuleComplete }),
      });
      const completionButton = completion.getByRole("button", {
        name: english.ui.markModuleComplete,
      });
      const validReceipt = evidenceReceipt({
        definition,
        artifactId: firstModule.slug,
        kind: "module-artifact",
      });
      const invalidReceipts = [
        { field: "courseId", mutate: (value: Record<string, unknown>) => { value.courseId = "wrong-course"; } },
        { field: "courseVersion", mutate: (value: Record<string, unknown>) => { value.courseVersion = "stale-version"; } },
        { field: "artifactId", mutate: (value: Record<string, unknown>) => { value.artifactId = "wrong-artifact"; } },
        {
          field: "validatorId",
          mutate: (value: Record<string, unknown>) => {
            (value.validator as Record<string, unknown>).id = "aicourse.wrong.validator.v1";
          },
        },
        {
          field: "validatorCommand",
          mutate: (value: Record<string, unknown>) => {
            (value.validator as Record<string, unknown>).command = "python unrelated.py --package artifacts/package.json";
          },
        },
      ];
      for (const invalid of invalidReceipts) {
        const receipt = JSON.parse(validReceipt) as Record<string, unknown>;
        invalid.mutate(receipt);
        await completion.locator("textarea").fill(JSON.stringify(receipt));
        await expect(completionButton, invalid.field).toBeDisabled();
      }
      await completion.locator("textarea").fill(validReceipt);
      await expect(completionButton).toBeEnabled();
      await completionButton.click();
      const values = await rootFor(page, id)
        .getByRole("progressbar")
        .evaluateAll((bars) => bars.map((bar) => Number(bar.getAttribute("aria-valuenow"))));
      expect(values.every((value) => value > 0)).toBe(true);

      await expectSuccessfulNavigation(page, pathFor("en", id));
      await expect(rootFor(page, id).getByRole("progressbar").first()).not.toHaveAttribute(
        "aria-valuenow",
        "0",
      );
      await page.reload({ waitUntil: "networkidle" });
      await expect(rootFor(page, id).getByRole("progressbar").first()).not.toHaveAttribute(
        "aria-valuenow",
        "0",
      );

      const reset = rootFor(page, id).getByRole("button", {
        name: english.ui.resetProgress,
      });
      await reset.focus();
      await reset.press("Enter");
      const resetConfirm = rootFor(page, id)
        .getByRole("button", { name: english.ui.resetConfirm });
      await expect(resetConfirm).toBeFocused();
      await resetConfirm.press("Enter");
      await expect(rootFor(page, id).getByRole("progressbar").first()).toHaveAttribute(
        "aria-valuenow",
        "0",
      );
    });

    test("quiz and capstone drafts survive refresh and can be cleared by reset", async ({ page }) => {
      await expectSuccessfulNavigation(page, pathFor("en", id));
      const firstQuizOption = page
        .locator("#final-assessment fieldset")
        .first()
        .locator('input[type="radio"]')
        .first();
      await firstQuizOption.check();
      const firstArtifactDraft = page.locator("#capstone textarea").first();
      await firstArtifactDraft.fill(`Evidence note for ${id}`);
      await page.reload({ waitUntil: "networkidle" });
      await expect(
        page
          .locator("#final-assessment fieldset")
          .first()
          .locator('input[type="radio"]')
          .first(),
      ).toBeChecked();
      await expect(page.locator("#capstone textarea").first()).toHaveValue(
        `Evidence note for ${id}`,
      );
      const reset = rootFor(page, id).getByRole("button", {
        name: english.ui.resetProgress,
      });
      await reset.click();
      await rootFor(page, id)
        .getByRole("button", { name: english.ui.resetConfirm })
        .click();
      await expect(page.locator("#capstone textarea").first()).toHaveValue("");
    });

    test("critical quiz gating and receipt-bound capstone completion work without remote calls", async ({ page }) => {
      await expectSuccessfulNavigation(page, pathFor("en", id));
      const remoteRequests = await externalRequestsDuring(page, async () => {
        const materialised = materialiseCourseKit(definition, "en");
        const drawnQuestions = drawCourseKitQuizQuestions(
          materialised.quiz.questions,
          materialised.quiz.drawCount,
          `${id}:${definition.quiz.version}`,
        );
        const firstCritical = drawnQuestions.findIndex((question) => question.critical);
        expect(firstCritical).toBeGreaterThanOrEqual(0);
        const fieldsets = page.locator("#final-assessment fieldset");
        await expect(fieldsets).toHaveCount(drawnQuestions.length);
        for (let index = 0; index < drawnQuestions.length; index += 1) {
          const question = drawnQuestions[index];
          const answer = index === firstCritical
            ? (question.correctIndex + 1) % 4
            : question.correctIndex;
          await fieldsets.nth(index).locator('input[type="radio"]').nth(answer).check();
        }
        await page
          .locator("#final-assessment")
          .getByRole("button", { name: english.ui.submitQuiz })
          .click();
        const quizStatus = page.locator("#final-assessment [role=status]");
        await expect(quizStatus).toContainText(english.ui.quizNotPassed);
        await expect(quizStatus).toContainText(english.ui.criticalGateFailed);

        await page
          .locator("#final-assessment")
          .getByRole("button", { name: english.ui.retryQuiz })
          .click();
        for (let index = 0; index < drawnQuestions.length; index += 1) {
          await fieldsets
            .nth(index)
            .locator('input[type="radio"]')
            .nth(drawnQuestions[index].correctIndex)
            .check();
        }
        await page
          .locator("#final-assessment")
          .getByRole("button", { name: english.ui.submitQuiz })
          .click();
        await expect(quizStatus).toContainText(english.ui.quizPassed);

        const capstone = page.locator("#capstone");
        const artifactTextareas = capstone.locator("fieldset textarea");
        const artifactChecks = capstone.locator('fieldset input[type="checkbox"]');
        await expect(artifactTextareas).toHaveCount(definition.capstone.artifacts.length);
        await expect(artifactChecks).toHaveCount(definition.capstone.artifacts.length);
        const firstArtifact = definition.capstone.artifacts[0];
        await artifactTextareas.first().fill(evidenceReceipt({
          definition,
          artifactId: firstArtifact.id,
          kind: "module-artifact",
        }));
        await expect(artifactChecks.first()).toBeDisabled();

        for (let index = 0; index < definition.capstone.artifacts.length; index += 1) {
          const artifact = definition.capstone.artifacts[index];
          await artifactTextareas.nth(index).fill(evidenceReceipt({
            definition,
            artifactId: artifact.id,
            kind: "capstone-artifact",
          }));
          await expect(artifactChecks.nth(index)).toBeEnabled();
          await artifactChecks.nth(index).check();
        }
        const completeButton = capstone.getByRole("button", {
          name: english.ui.markCapstoneComplete,
        });
        await expect(completeButton).toBeDisabled();
        const attestation = capstone.locator(':scope > label input[type="checkbox"]');
        await attestation.check();
        await expect(completeButton).toBeEnabled();
        await completeButton.click();
        await expect(capstone.getByRole("status")).toContainText(
          english.ui.capstoneComplete,
        );
        await page.reload({ waitUntil: "networkidle" });
        await expect(
          page.locator("#capstone").getByRole("button", {
            name: english.ui.capstoneComplete,
          }),
        ).toBeDisabled();
      });
      expect(remoteRequests).toEqual([]);
    });

    test("static pages make no unauthorised remote requests and have no serious axe violations", async ({ page }) => {
      const dashboard = pathFor("en", id);
      expect(await externalRequests(page, dashboard)).toEqual([]);
      expect(await seriousAxeViolations(page), dashboard).toEqual([]);

      const modulePath = pathFor("en", id, modules[0].slug);
      expect(await externalRequests(page, modulePath)).toEqual([]);
      expect(await seriousAxeViolations(page), `${dashboard}${modules[0].slug}/`).toEqual([]);

      await expectSuccessfulNavigation(page, pathFor("ar", id));
      expect(await seriousAxeViolations(page), pathFor("ar", id)).toEqual([]);
    });
  });
}

test("all six courses preserve malformed shared storage instead of silently overwriting it", async ({ browser }) => {
  for (const definition of COURSES) {
    const isolated = await newIsolatedPage(browser, () => {
      localStorage.setItem("ae.progress", "{malformed-course-progress");
    });
    const { page } = isolated;
    await expectSuccessfulNavigation(page, pathFor("en", definition.manifest.id));
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(
      "{malformed-course-progress",
    );
    expect(
      await page.evaluate((key) => sessionStorage.getItem(key), CORRUPT_BACKUP_KEY),
    ).toBe("{malformed-course-progress");
    await isolated.close();
  }
});

test("all six courses keep in-memory state authoritative when storage writes fail", async ({ browser }) => {
  for (const definition of COURSES) {
    const firstModule = definition.manifest.modules[0];
    const checkpoint = definition.copy.en.modules[firstModule.slug].checkpoint;
    const isolated = await newIsolatedPage(browser, () => {
      Object.defineProperty(Storage.prototype, "setItem", {
        configurable: true,
        value() {
          throw new DOMException("storage disabled", "QuotaExceededError");
        },
      });
    });
    const { page } = isolated;
    await expectSuccessfulNavigation(
      page,
      pathFor("en", definition.manifest.id, firstModule.slug),
    );
    const checkpointSection = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: checkpoint.question }) });
    await checkpointSection
      .locator('input[type="radio"]')
      .nth(checkpoint.correctIndex)
      .check();
    await checkpointSection
      .getByRole("button", { name: definition.copy.en.ui.checkAnswer })
      .click();
    await expect(checkpointSection.getByRole("status")).toContainText(
      definition.copy.en.ui.savedInMemory,
    );
    await page.getByLabel(definition.copy.en.ui.evidenceReceiptLabel).fill(
      evidenceReceipt({
        definition,
        artifactId: firstModule.slug,
        kind: "module-artifact",
      }),
    );
    const markComplete = page.getByRole("button", {
      name: definition.copy.en.ui.markModuleComplete,
    });
    await expect(markComplete).toBeEnabled();
    await markComplete.click();
    await expect(rootFor(page, definition.manifest.id).getByRole("progressbar").first())
      .not.toHaveAttribute("aria-valuenow", "0");

    await rootFor(page, definition.manifest.id)
      .getByRole("link", { name: definition.copy.en.ui.backToCourse })
      .first()
      .click();
    await expect(page).toHaveURL(new RegExp(`/en/${definition.manifest.id}/$`));
    await expect(rootFor(page, definition.manifest.id).getByRole("progressbar").first())
      .not.toHaveAttribute("aria-valuenow", "0");

    await rootFor(page, definition.manifest.id)
      .getByRole("link", { name: definition.copy.en.ui.catalog })
      .first()
      .click();
    await expect(page).toHaveURL(/\/en\/courses\/$/);
    const catalogCard = page.locator(
      `.catalog-course-card a[href="/en/${definition.manifest.id}/"]`,
    );
    await expect(catalogCard.getByRole("progressbar")).not.toHaveAttribute(
      "aria-valuenow",
      "0",
    );

    await page.locator("a.logo").click();
    await expect(page).toHaveURL(/\/en\/$/);
    const homeProgress = page.locator(".progress-course").filter({
      hasText: definition.copy.en.meta.title,
    });
    await expect(homeProgress.getByRole("progressbar")).not.toHaveAttribute(
      "aria-valuenow",
      "0",
    );
    await isolated.close();
  }
});

test("the site-wide reset clears every Course 16–21 namespace", async ({ page }) => {
  const seededRecord: Record<string, unknown> = {};
  for (const definition of COURSES) {
    const config = createCourseKitProgressConfig(definition);
    seededRecord[config.progressVersionKey] = config.courseVersion;
    seededRecord[
      courseKitModuleCompleteKey(config.courseId, config.moduleSlugs[0])
    ] = true;
  }
  await page.addInitScript((record: Readonly<Record<string, unknown>>) => {
    localStorage.setItem("ae.progress", JSON.stringify(record));
  }, seededRecord);
  await expectSuccessfulNavigation(page, "/en/");
  await page.getByRole("button", { name: /reset/i }).click();
  const seededKeys = Object.keys(seededRecord);
  const remaining = await page.evaluate((expectedKeys) => {
    const raw = localStorage.getItem("ae.progress") ?? "{}";
    const record = JSON.parse(raw) as Record<string, unknown>;
    return expectedKeys.filter((key) => Object.hasOwn(record, key));
  }, seededKeys);
  expect(remaining).toEqual([]);
});
