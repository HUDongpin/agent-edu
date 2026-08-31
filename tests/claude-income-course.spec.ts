import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";
import axe from "axe-core";
import { expect, test } from "../e2e/fixtures";
import {
  CLAUDE_INCOME_CAPSTONE,
  CLAUDE_INCOME_CONTENT_LANGUAGE,
  CLAUDE_INCOME_COURSE,
  CLAUDE_INCOME_FIGURES,
  CLAUDE_INCOME_FINAL_QUIZ,
  CLAUDE_INCOME_LESSON_SLUGS,
  CLAUDE_INCOME_LOCALES,
  CLAUDE_INCOME_QUIZ_BANK,
  CLAUDE_INCOME_SOURCES,
  validateClaudeIncomeCourse,
  type ClaudeIncomeAssetVariant,
  type ClaudeIncomeQuizQuestion,
  type ClaudeIncomeUnitId,
} from "../lib/claude-income";
import { withIsolatedRoutePage } from "./published-course-test-helpers";

const DASHBOARD = "/en/claude-income/";
const SITE = "https://aicourse.top";
const COURSE_PREFIX = "claude-income.";
const QUIZ_ATTEMPT_KEY = "aicourse.claude-income.quiz-attempt.v1";
const COURSE_ROOT = "[data-testid=\"claude-income-dashboard\"], [data-testid^=\"claude-income-lesson-\"]";

function cssRgb(value: string): [number, number, number] {
  const channels = value.match(/[0-9.]+/g)?.slice(0, 3).map(Number);
  if (!channels || channels.length !== 3 || channels.some((channel) => !Number.isFinite(channel))) {
    throw new Error(`Expected an rgb() color, received ${value}`);
  }
  return channels as [number, number, number];
}

function contrastRatio(foreground: string, background: string): number {
  const luminance = (value: string) => {
    const channels = cssRgb(value).map((channel) => {
      const normalized = channel / 255;
      return normalized <= 0.04045
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const left = luminance(foreground);
  const right = luminance(background);
  return (Math.max(left, right) + 0.05) / (Math.min(left, right) + 0.05);
}

async function axeViolations(page: Page) {
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
            nodes: readonly { target: readonly string[] }[];
          }[];
        }>;
      };
    }).axe;
    const results = await axeApi.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
      },
      resultTypes: ["violations"],
    });
    return results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      targets: violation.nodes.map((node) => node.target),
    }));
  });
}

const EXPECTED_ASSET_HASHES = {
  "fig-01-chat-composer.png": "11dec55d47b0de68ab6fc45ad551cb70323d56346720bee129e5cd9d224a7196",
  "fig-01-chat-composer-640.webp": "e045bbebae61609a7d4329223e1d3f115631ffbaf54c69dfd8a79eb487bad7ec",
  "fig-01-chat-composer-960.webp": "591e0990f6620f1ec40c9e9b0a6ee4e3b012a122693ecf399e46f8cf85b0ae61",
  "fig-02-cowork-composer.png": "92d671632af8bd8e85a316e603fcce9939c6d02882343f55b5d624a325d458c8",
  "fig-02-cowork-composer-640.webp": "0e4994269842350503b20a6c9f546267e8c7f47a3daefaefcda11ff626c50443",
  "fig-02-cowork-composer-960.webp": "cfd8cdec2698aafd72e3f173cfcd74153077441dd2141be266c569d04b8801f2",
  "fig-03-tools-menu.png": "aaeb8e2978e3c0fbde681ead1ed9ccf4abdb1e77929b50fbc161278627792a60",
  "fig-03-tools-menu-640.webp": "7cc57268c07a5d4e798335b760ae52019a8ccf5ba61b183f80e3cfb8a1de594e",
  "fig-03-tools-menu-960.webp": "f95b4531cf1d95a6a5b1d6f8c3e3c1c924f55668a7c1754f85b0dc51bbea4435",
  "fig-04-new-project.png": "7c6bba35a9c3e4730f50a68dfe25cf4454778fb34378c9089bee065e873dc13d",
  "fig-04-new-project-640.webp": "c64a760825449331d3046c1f360ca86fe0669a6e88f82e2920444b192efc5afd",
  "fig-04-new-project-960.webp": "7126248f29c8fcc3ade57cdb0706dd682f3d9c477140a2a416a917907c918302",
  "fig-05-file-outputs.png": "7937a17721034737827e83dc1b321677c72fb2ae9aaf4d39787de52f39a2f202",
  "fig-05-file-outputs-640.webp": "cf4ba12751413c516f286c997f215eb3aacf4cf7077330074abaed6d8828122a",
  "fig-05-file-outputs-960.webp": "60c7a1c2e9a43e63382f21d7fec6f532df3ddacc118b52a81a482c362406016d",
  "fig-06-artifact-workspace.png": "81b155f3632b27c46365dafd8692ce4b5c1f63ad1649ea67888f208f7fc2e2ab",
  "fig-06-artifact-workspace-640.webp": "2ddfa655cd8f232cf95bd831850ebf8ddd28c01bd97b8e2f88c3d7d12f20ce31",
  "fig-06-artifact-workspace-960.webp": "2fbf7aa9530eb81834b3eb17c88106485d3bcc33f471bfa3d00b876ff2bc7b32",
  "fig-07-skills-settings.png": "08724e40883bd3713a29ba7dd1348e0e138020b7c3073ee7355ad1dfac86babb",
  "fig-07-skills-settings-640.webp": "d84e171adbd27eac92a8cf88e5f6f1ed153fab72c3d1d377a14c4cd3facc3392",
  "fig-07-skills-settings-960.webp": "12af37d406ada4d30ed28467cb9757e1d72f7c7ea1c91f5c2df4d1fe81f990e5",
} as const;

const QUESTION_BY_PROMPT = new Map<string, ClaudeIncomeQuizQuestion>(
  CLAUDE_INCOME_QUIZ_BANK.map((question) => [question.prompt, question]),
);

function sha256(file: string): string {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

function localAssetPath(src: string): string {
  expect(src).toMatch(/^\/courses\/claude-income\/figures\/[^/]+\.(?:png|webp)$/);
  return path.join(process.cwd(), "public", src.slice(1));
}

function uniqueVariants(
  variants: readonly ClaudeIncomeAssetVariant[],
): ClaudeIncomeAssetVariant[] {
  const byWidth = new Map<number, ClaudeIncomeAssetVariant>();
  for (const variant of variants) {
    if (!byWidth.has(variant.width)) byWidth.set(variant.width, variant);
  }
  return [...byWidth.values()].sort((left, right) => left.width - right.width);
}

async function clearProgress(page: Page) {
  await page.goto(DASHBOARD);
  await page.evaluate((attemptKey) => {
    window.localStorage.removeItem("ae.progress");
    window.sessionStorage.removeItem(attemptKey);
  }, QUIZ_ATTEMPT_KEY);
  await page.reload();
}

async function assertNoRemoteMedia(page: Page) {
  await expect(page.locator([
    'img[src^="http://"]',
    'img[src^="https://"]',
    'source[srcset*="http://"]',
    'source[srcset*="https://"]',
    'video[src^="http"]',
    'audio[src^="http"]',
    'iframe[src^="http"]',
  ].join(", "))).toHaveCount(0);
}

async function runQuizAttempt(
  page: Page,
  missOneCritical: boolean,
  beforeFinish?: () => Promise<void>,
) {
  const quiz = page.locator('section[aria-labelledby="claude-income-final-quiz-title"]');
  const start = quiz.getByRole("button", {
    name: /^(?:Begin final quiz|Try another balanced attempt)$/,
  });
  await expect(quiz).toHaveAttribute("data-client-ready", "true");
  await expect(quiz.locator("#claude-income-final-quiz-readiness")).toHaveText("Final quiz ready.");
  await expect(start).toBeEnabled();
  await start.focus();
  await page.keyboard.press("Enter");

  const seenPrompts: string[] = [];
  const unitCounts = new Map<ClaudeIncomeUnitId, number>();
  const criticalCounts = new Map<ClaudeIncomeUnitId, number>();
  let criticalMissed = false;

  for (let index = 0; index < CLAUDE_INCOME_FINAL_QUIZ.questionCount; index += 1) {
    const form = quiz.locator("form");
    const heading = form.getByRole("heading", { level: 3 });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();
    const prompt = (await heading.textContent())?.trim() ?? "";
    const question = QUESTION_BY_PROMPT.get(prompt);
    expect(question, `Unknown rendered quiz prompt: ${prompt}`).toBeDefined();
    if (!question) throw new Error(`Unknown rendered quiz prompt: ${prompt}`);

    seenPrompts.push(prompt);
    unitCounts.set(question.unitId, (unitCounts.get(question.unitId) ?? 0) + 1);
    if (question.critical) {
      criticalCounts.set(question.unitId, (criticalCounts.get(question.unitId) ?? 0) + 1);
    }

    const unit = CLAUDE_INCOME_COURSE.units.find((item) => item.id === question.unitId);
    expect(unit).toBeDefined();
    await expect(form.getByText(`Question ${index + 1} of 16`, { exact: true })).toBeVisible();
    await expect(form.getByText(unit?.title ?? question.unitId, { exact: true })).toBeVisible();
    await expect(form.getByText("Critical boundary", { exact: true })).toHaveCount(
      question.critical ? 1 : 0,
    );

    const shouldMiss = missOneCritical && question.critical === true && !criticalMissed;
    if (shouldMiss) criticalMissed = true;
    const selectedIndex = shouldMiss
      ? (question.correctIndex + 1) % question.options.length
      : question.correctIndex;
    const radios = form.locator('input[type="radio"]');
    await expect(radios).toHaveCount(4);
    await radios.nth(selectedIndex).check();

    const checkAnswer = form.getByRole("button", { name: "Check answer" });
    await checkAnswer.focus();
    await page.keyboard.press("Enter");
    const feedback = form.locator('[role="status"]');
    await expect(feedback).toBeVisible();
    await expect(feedback).toBeFocused();
    await expect(feedback.getByText(shouldMiss ? "Not correct" : "Correct", { exact: true })).toBeVisible();
    await expect(form.getByText("Correct answer", { exact: true })).toHaveCount(1);
    await expect(form.getByText("Your answer", { exact: true })).toHaveCount(1);
    await expect(feedback.locator('a[href^="https://"]')).toHaveCount(question.sourceIds.length);

    const nextName = index === CLAUDE_INCOME_FINAL_QUIZ.questionCount - 1
      ? "Finish and score"
      : "Next question";
    const next = feedback.getByRole("button", { name: nextName });
    if (index === CLAUDE_INCOME_FINAL_QUIZ.questionCount - 1) {
      await beforeFinish?.();
    }
    await next.click();
  }

  expect(new Set(seenPrompts).size).toBe(CLAUDE_INCOME_FINAL_QUIZ.questionCount);
  for (const unit of CLAUDE_INCOME_COURSE.units) {
    expect(unitCounts.get(unit.id), `${unit.id} question balance`).toBe(4);
    expect(criticalCounts.get(unit.id), `${unit.id} critical balance`).toBe(1);
  }
  expect(criticalMissed).toBe(missOneCritical);

  const result = quiz.locator('[role="status"]').filter({ hasText: /correct/ });
  await expect(result).toBeVisible();
  await expect(result).toBeFocused();
  return result;
}

test.describe("Course 12 typed release contracts", () => {
  test("curriculum, source, figure, quiz, and capstone contracts are internally complete", () => {
    expect(validateClaudeIncomeCourse()).toEqual([]);
    expect(CLAUDE_INCOME_COURSE.id).toBe("claude-income");
    expect(CLAUDE_INCOME_COURSE.displayNumber).toBe(12);
    expect(CLAUDE_INCOME_CONTENT_LANGUAGE).toBe("en");
    expect(CLAUDE_INCOME_COURSE.contentLanguage).toBe("en");
    expect(CLAUDE_INCOME_COURSE.units).toHaveLength(4);
    expect(CLAUDE_INCOME_COURSE.lessons).toHaveLength(12);
    expect(
      CLAUDE_INCOME_COURSE.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0),
    ).toBe(895);
    expect(CLAUDE_INCOME_LESSON_SLUGS).toEqual(
      CLAUDE_INCOME_COURSE.lessons.map((lesson) => lesson.slug),
    );
    expect(CLAUDE_INCOME_COURSE.lessons.map((lesson) => lesson.order)).toEqual(
      Array.from({ length: 12 }, (_, index) => index + 1),
    );
    expect(new Set(CLAUDE_INCOME_LESSON_SLUGS).size).toBe(12);

    const sourceIds = new Set<string>(CLAUDE_INCOME_SOURCES.map((source) => source.id));
    const figureIds = new Set<string>(CLAUDE_INCOME_FIGURES.map((figure) => figure.id));
    for (const unit of CLAUDE_INCOME_COURSE.units) {
      expect(unit.lessonSlugs).toHaveLength(3);
      expect(new Set(unit.lessonSlugs).size).toBe(3);
    }
    for (const lesson of CLAUDE_INCOME_COURSE.lessons) {
      expect(lesson.sections.length, lesson.slug).toBeGreaterThanOrEqual(3);
      expect(lesson.workflow.length, lesson.slug).toBeGreaterThanOrEqual(5);
      expect(lesson.qualityGate.length, lesson.slug).toBeGreaterThanOrEqual(4);
      expect(lesson.redFlags.length, lesson.slug).toBeGreaterThanOrEqual(3);
      expect(lesson.practice.steps.length, lesson.slug).toBeGreaterThanOrEqual(3);
      expect(lesson.practice.deliverables.length, lesson.slug).toBeGreaterThanOrEqual(1);
      expect(lesson.practice.doneWhen.length, lesson.slug).toBeGreaterThanOrEqual(2);
      expect(lesson.promptTemplate.trim().length, lesson.slug).toBeGreaterThan(80);
      for (const sourceId of lesson.sourceIds) expect(sourceIds.has(sourceId), sourceId).toBe(true);
      for (const section of lesson.sections) {
        expect(section.paragraphs.length, `${lesson.slug}: ${section.heading}`).toBeGreaterThanOrEqual(1);
        for (const sourceId of section.sourceIds) {
          expect(lesson.sourceIds.includes(sourceId), `${lesson.slug}: ${sourceId}`).toBe(true);
        }
      }
      for (const figureId of lesson.figureIds) expect(figureIds.has(figureId), figureId).toBe(true);
    }

    expect(CLAUDE_INCOME_SOURCES.length).toBeGreaterThanOrEqual(28);
    const requiredAuthorities = [
      "academy-work",
      "academy-code-101",
      "academy-cowork",
      "help-cowork-safety",
      "help-projects",
      "help-artifacts",
      "help-skills",
      "help-connectors",
      "help-research",
      "docs-prompting",
      "docs-cost",
      "commercial-terms",
      "aup",
      "x-automation-policy",
    ];
    for (const id of requiredAuthorities) expect(sourceIds.has(id), id).toBe(true);
    for (const source of CLAUDE_INCOME_SOURCES) {
      expect(new URL(source.url).protocol, source.id).toBe("https:");
      expect(source.accessedOn, source.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (source.kind === "x-post") {
        expect(source.rightsStatus, source.id).toBe("link-only");
        expect(source.claimClass, source.id).toBe("practitioner-report");
      }
      if (source.kind === "github" || source.kind === "case-study") {
        expect(source.rightsStatus, source.id).toBe("licensed-code");
        expect(source.license?.trim().length, source.id).toBeGreaterThan(0);
        expect(source.pinnedRevision, source.id).toMatch(/^[a-f0-9]{40}$/);
        expect(source.immutableUrl, source.id).toContain(source.pinnedRevision);
        expect(new URL(source.immutableUrl ?? "").hostname, source.id).toBe("github.com");
      }
    }
    const instructionalSourceIds = new Set([
      ...CLAUDE_INCOME_COURSE.lessons.flatMap((lesson) => [
        ...lesson.sourceIds,
        ...lesson.sections.flatMap((section) => section.sourceIds),
      ]),
      ...CLAUDE_INCOME_QUIZ_BANK.flatMap((question) => question.sourceIds),
    ]);
    expect(CLAUDE_INCOME_SOURCES.filter((source) => source.evidenceGrade === "D").map((source) => source.id)).toEqual([
      "x-degensing",
      "x-samrags",
      "x-adiix-caution",
    ]);
    for (const source of CLAUDE_INCOME_SOURCES.filter((item) => item.evidenceGrade === "D")) {
      expect(instructionalSourceIds.has(source.id), source.id).toBe(false);
    }

    expect(CLAUDE_INCOME_FIGURES).toHaveLength(7);
    for (const figure of CLAUDE_INCOME_FIGURES) {
      expect(figure.captureBasis, figure.id).toBe("course-authored-real-ui-capture");
      expect(figure.privacyReview, figure.id).toBe("passed");
      expect(figure.rightsStatus, figure.id).toBe("course-authored-capture");
      expect(figure.observedOn, figure.id).toBe("2026-08-23");
      expect(figure.alt.trim().length, figure.id).toBeGreaterThan(40);
      expect(figure.teachingPoints.length, figure.id).toBeGreaterThanOrEqual(3);
      expect(figure.variants).toHaveLength(2);
    }

    expect(CLAUDE_INCOME_QUIZ_BANK).toHaveLength(24);
    expect(CLAUDE_INCOME_FINAL_QUIZ).toMatchObject({
      questionCount: 16,
      questionsPerUnit: 4,
      passingCorrectAnswers: 13,
      requireAllCritical: true,
    });
    for (const unit of CLAUDE_INCOME_COURSE.units) {
      const questions: readonly ClaudeIncomeQuizQuestion[] = CLAUDE_INCOME_QUIZ_BANK.filter(
        (question) => question.unitId === unit.id,
      );
      expect(questions, unit.id).toHaveLength(6);
      expect(questions.some((question) => question.critical), unit.id).toBe(true);
    }
    for (const question of CLAUDE_INCOME_QUIZ_BANK) {
      expect(question.options, question.id).toHaveLength(4);
      expect(question.correctIndex, question.id).toBeGreaterThanOrEqual(0);
      expect(question.correctIndex, question.id).toBeLessThan(4);
      for (const sourceId of question.sourceIds) expect(sourceIds.has(sourceId), sourceId).toBe(true);
    }

    expect(CLAUDE_INCOME_CAPSTONE.criteria.reduce((sum, item) => sum + item.points, 0)).toBe(100);
    expect(CLAUDE_INCOME_CAPSTONE.minimumScore).toBe(80);
    expect(CLAUDE_INCOME_CAPSTONE.criticalFailures).toHaveLength(8);
    expect(CLAUDE_INCOME_CAPSTONE.passedStorageKey.startsWith(COURSE_PREFIX)).toBe(true);
    expect(CLAUDE_INCOME_COURSE.disclaimer).toContain("does not promise income");
    expect(CLAUDE_INCOME_COURSE.practitionerDisclaimer).toContain("self-reported");
    expect(CLAUDE_INCOME_COURSE.independentProjectNotice).toContain(
      "not affiliated with, sponsored by, or endorsed by Anthropic",
    );
  });

  test("all 21 local image files have the reviewed immutable hashes and manifest records", () => {
    const figureDirectory = path.join(process.cwd(), "public/courses/claude-income/figures");
    expect(readdirSync(figureDirectory).sort()).toEqual(Object.keys(EXPECTED_ASSET_HASHES).sort());

    const declaredHashes = new Map<string, string>();
    for (const figure of CLAUDE_INCOME_FIGURES) {
      declaredHashes.set(path.basename(figure.src), figure.sha256);
      for (const variant of figure.variants) {
        declaredHashes.set(path.basename(variant.src), variant.sha256);
      }
    }
    expect(Object.fromEntries([...declaredHashes].sort())).toEqual(
      Object.fromEntries(Object.entries(EXPECTED_ASSET_HASHES).sort()),
    );

    for (const [fileName, expectedHash] of Object.entries(EXPECTED_ASSET_HASHES)) {
      expect(sha256(path.join(figureDirectory, fileName)), fileName).toBe(expectedHash);
    }

    const manifestPath = path.join(process.cwd(), "public/courses/claude-income/media-manifest.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      metadataStripped: boolean;
      privacyReview: string;
      independentProject: boolean;
      anthropicEndorsement: boolean;
      thirdPartyRepositoryAssets: unknown[];
      xMediaAssets: unknown[];
      figures: Array<{
        id: string;
        master: { path: string; width: number; height: number; sha256: string };
        variants: Array<{ path: string; width: number; height: number; sha256: string }>;
      }>;
    };
    expect(manifest).toMatchObject({
      metadataStripped: true,
      privacyReview: "passed",
      independentProject: true,
      anthropicEndorsement: false,
      thirdPartyRepositoryAssets: [],
      xMediaAssets: [],
    });
    expect(manifest.figures).toHaveLength(7);
    for (const record of manifest.figures) {
      const figure = CLAUDE_INCOME_FIGURES.find((item) => item.id === record.id);
      expect(figure, record.id).toBeDefined();
      if (!figure) continue;
      expect(record.master).toMatchObject({
        path: figure.src.replace("/courses/claude-income/", ""),
        width: figure.width,
        height: figure.height,
        sha256: figure.sha256,
      });
      for (const variant of record.variants) {
        expect(sha256(path.join(process.cwd(), "public/courses/claude-income", variant.path))).toBe(
          variant.sha256,
        );
        expect(variant.width).toBeGreaterThan(0);
        expect(variant.height).toBeGreaterThan(0);
      }
    }
  });
});

test.describe("Course 12 approved UI and UX Phase 1 regressions", () => {
  const lessonProgress = Object.fromEntries(
    CLAUDE_INCOME_LESSON_SLUGS.map((slug) => [`${COURSE_PREFIX}lesson.${slug}.complete`, true]),
  );

  async function seedCourseProgress(page: Page, record: Record<string, unknown>) {
    await page.goto(DASHBOARD);
    await page.evaluate((nextRecord) => {
      window.localStorage.setItem("ae.progress", JSON.stringify(nextRecord));
    }, record);
    await page.reload();
  }

  test("language switching preserves only real localized routes and remains reachable in short landscape", async ({ page }) => {
    await page.goto(DASHBOARD);
    await page.getByRole("button", { name: "Language: English" }).click();
    await page.getByRole("menuitem", { name: "Deutsch German" }).click();
    await expect(page).toHaveURL(/\/de\/courses\/$/);
    await expect(page.locator("main h1").first()).toBeVisible();

    await page.goto("/en/claude-income/choose-a-money-path/");
    await page.getByRole("button", { name: "Language: English" }).click();
    await page.getByRole("menuitem", { name: "Français French" }).click();
    await expect(page).toHaveURL(/\/fr\/courses\/$/);

    await page.setViewportSize({ width: 844, height: 320 });
    await page.goto("/en/claude-income/choose-a-money-path/");
    await page.getByRole("button", { name: "Language: English" }).click();
    const menu = page.getByRole("menu");
    const menuBox = await menu.boundingBox();
    expect(menuBox).not.toBeNull();
    expect((menuBox?.y ?? 0) + (menuBox?.height ?? 0)).toBeLessThanOrEqual(320);
    await page.keyboard.press("End");
    const arabic = page.getByRole("menuitem", { name: "العربية Arabic" });
    await expect(arabic).toBeFocused();
    await expect(arabic).toBeInViewport();
  });

  test("dashboard and final lesson follow the complete fourteen-milestone journey", async ({ page }) => {
    await seedCourseProgress(page, lessonProgress);
    let progress = page.locator('section[aria-labelledby="claude-income-progress-title"]');
    await expect(progress.getByRole("heading", { name: "Final quiz is next" })).toBeVisible();
    await expect(progress.getByText("12 of 14 milestones complete", { exact: true })).toBeVisible();
    await expect(progress.getByRole("progressbar", { name: "Course 12 progress" })).toHaveAttribute("max", "14");
    await expect(progress.getByRole("progressbar", { name: "Course 12 progress" })).toHaveAttribute("value", "12");
    await expect(progress.getByText("86%", { exact: true })).toBeVisible();
    await expect(progress.getByRole("link", { name: /Take final quiz/ })).toHaveAttribute("href", "#final-quiz");

    await page.goto("/en/claude-income/capstone-seven-day-demand-test/");
    let pager = page.locator("[data-course-lesson-nav]");
    await expect(pager.getByRole("link", { name: /Take final quiz/ })).toHaveAttribute(
      "href",
      "/en/claude-income/#final-quiz",
    );

    const quizPassed = {
      ...lessonProgress,
      [CLAUDE_INCOME_FINAL_QUIZ.versionStorageKey]: CLAUDE_INCOME_FINAL_QUIZ.bankVersion,
      [CLAUDE_INCOME_FINAL_QUIZ.passedStorageKey]: true,
    };
    await seedCourseProgress(page, quizPassed);
    progress = page.locator('section[aria-labelledby="claude-income-progress-title"]');
    await expect(progress.getByRole("heading", { name: "Finish with the capstone" })).toBeVisible();
    await expect(progress.getByText("13 of 14 milestones complete", { exact: true })).toBeVisible();
    await expect(progress.getByRole("link", { name: /Open capstone/ })).toHaveAttribute(
      "href",
      "/en/claude-income/capstone-seven-day-demand-test/#claude-income-capstone-audit-title",
    );

    await page.goto("/en/claude-income/capstone-seven-day-demand-test/");
    pager = page.locator("[data-course-lesson-nav]");
    await expect(pager.getByRole("link", { name: /Continue capstone audit/ })).toHaveAttribute(
      "href",
      "#claude-income-capstone-audit-title",
    );

    await seedCourseProgress(page, {
      ...quizPassed,
      [CLAUDE_INCOME_CAPSTONE.passedStorageKey]: true,
    });
    progress = page.locator('section[aria-labelledby="claude-income-progress-title"]');
    await expect(progress.getByRole("heading", { name: "Course complete" })).toBeVisible();
    await expect(progress.getByText("14 of 14 milestones complete", { exact: true })).toBeVisible();
    await expect(progress.getByRole("link", { name: /Review course/ })).toHaveAttribute(
      "href",
      "/en/claude-income/choose-a-money-path/",
    );

    await seedCourseProgress(page, {});
    await expect(page.getByRole("button", { name: "Reset Course 12 progress" })).toHaveCount(0);
  });

  test("reset confirmation owns focus and announces completion", async ({ page }) => {
    await seedCourseProgress(page, {
      [`${COURSE_PREFIX}lesson.choose-a-money-path.complete`]: true,
    });
    const reset = page.getByRole("button", { name: "Reset Course 12 progress" });
    await reset.focus();
    await page.keyboard.press("Enter");
    const confirm = page.getByRole("button", { name: "Confirm reset" });
    await expect(confirm).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(reset).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(confirm).toBeFocused();
    await confirm.click();
    const status = page.locator('section[aria-labelledby="claude-income-progress-title"] [role="status"]');
    await expect(status).toHaveText("Course 12 progress was reset. Other course and site data was preserved.");
    await expect(status).toBeFocused();
    await expect(page.getByRole("button", { name: "Reset Course 12 progress" })).toHaveCount(0);
  });

  test("quiz feedback names answer states, owns focus, and retains a missed-answer review", async ({ page }) => {
    test.setTimeout(60_000);
    await clearProgress(page);
    const result = await runQuizAttempt(page, true);
    await expect(result.getByText("Review required", { exact: true })).toBeVisible();
    const review = page.getByTestId("claude-income-quiz-review");
    await expect(review.getByRole("heading", { name: "Review 1 missed answer" })).toBeVisible();
    await expect(review.locator("ol > li")).toHaveCount(1);
    await expect(review.getByText("Your answer", { exact: true })).toHaveCount(1);
    await expect(review.getByText("Correct answer", { exact: true })).toHaveCount(1);
    await expect(review.getByRole("link", { name: /^Review / })).toHaveAttribute(
      "href",
      /^\/en\/claude-income\/.+\/$/,
    );
  });

  test("dashboard visual, compact lesson jumps, and touch navigation expose the approved hierarchy", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto(DASHBOARD);
    const figure = page.getByTestId("claude-income-dashboard-figure");
    await expect(figure).toHaveAttribute("data-figure-id", "fig-06-artifact-workspace");
    await expect(figure.getByRole("img", { name: CLAUDE_INCOME_FIGURES[5].alt })).toBeVisible();
    await expect(figure.getByRole("link", { name: /Open the capstone lesson/ })).toHaveAttribute(
      "href",
      "/en/claude-income/capstone-seven-day-demand-test/",
    );

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/claude-income/choose-a-money-path/");
    const jumpMenu = page.getByRole("navigation", { name: "On this lesson" });
    await expect(jumpMenu).toBeVisible();
    const jumpPosition = await jumpMenu.evaluate((node) => getComputedStyle(node).position);
    expect(["sticky", "fixed"]).not.toContain(jumpPosition);
    const jumpLinks = jumpMenu.locator('a[href^="#"]');
    expect(await jumpLinks.count()).toBeGreaterThanOrEqual(8);
    for (const link of await jumpLinks.all()) {
      const href = await link.getAttribute("href");
      expect(href).toBeTruthy();
      await expect(page.locator(href ?? "#missing-approved-target")).toHaveCount(1);
      const box = await link.boundingBox();
      if (box) expect(box.height, href ?? "jump link").toBeGreaterThanOrEqual(44);
    }

    const outline = page.locator('details[class*="mobileOutline"]');
    await outline.locator("summary").click();
    for (const link of await outline.getByRole("link").all()) {
      const box = await link.boundingBox();
      if (box) expect(box.height, await link.textContent() ?? "outline link").toBeGreaterThanOrEqual(44);
    }
  });

  test("approved dark, control-boundary, and compound-focus contrast remains perceivable", async ({ page }) => {
    await seedCourseProgress(page, {
      [`${COURSE_PREFIX}lesson.choose-a-money-path.complete`]: true,
    });
    await page.evaluate(() => window.localStorage.setItem("ae.theme", "dark"));
    await page.reload();
    await page.getByRole("button", { name: "Reset Course 12 progress" }).click();
    await page.mouse.move(1, 1);
    const confirm = page.getByRole("button", { name: "Confirm reset" });
    let colors = await confirm.evaluate((node) => {
      const style = getComputedStyle(node);
      return { foreground: style.color, background: style.backgroundColor };
    });
    expect(contrastRatio(colors.foreground, colors.background)).toBeGreaterThanOrEqual(4.5);
    await confirm.hover();
    await expect.poll(async () => {
      colors = await confirm.evaluate((node) => {
        const style = getComputedStyle(node);
        return { foreground: style.color, background: style.backgroundColor };
      });
      return contrastRatio(colors.foreground, colors.background);
    }).toBeGreaterThanOrEqual(4.5);

    for (const theme of ["light", "dark"] as const) {
      await page.evaluate((selectedTheme) => window.localStorage.setItem("ae.theme", selectedTheme), theme);
      await page.goto("/en/claude-income/capstone-seven-day-demand-test/");
      const input = page.getByLabel("Points for Problem and buyer evidence");
      const boundary = await input.evaluate((node) => {
        const style = getComputedStyle(node);
        return { border: style.borderTopColor, background: style.backgroundColor };
      });
      expect(contrastRatio(boundary.border, boundary.background), theme).toBeGreaterThanOrEqual(3);
      const checkbox = page.getByRole("checkbox", { name: /One-page money thesis and stop rule/ });
      await checkbox.focus();
      const outlineWidth = await checkbox.locator("..").evaluate((node) => (
        Number.parseFloat(getComputedStyle(node).outlineWidth)
      ));
      expect(outlineWidth, `${theme} compound focus`).toBeGreaterThanOrEqual(2);
    }
  });
});

test.describe("Course 12 approved UI and UX Phase 2 regressions", () => {
  test("an unfinished balanced attempt resumes exactly and Course 12 reset removes only its draft", async ({ page }) => {
    test.setTimeout(90_000);
    await clearProgress(page);
    const quiz = page.getByTestId("claude-income-final-quiz");
    await quiz.getByRole("button", { name: "Begin final quiz" }).click();

    let form = quiz.locator("form");
    const firstPrompt = (await form.getByRole("heading", { level: 3 }).textContent())?.trim() ?? "";
    const firstQuestion = QUESTION_BY_PROMPT.get(firstPrompt);
    expect(firstQuestion).toBeDefined();
    if (!firstQuestion) throw new Error(`Unknown first question: ${firstPrompt}`);
    await form.locator('input[type="radio"]').nth(firstQuestion.correctIndex).check();
    await form.getByRole("button", { name: "Check answer" }).click();
    for (const sourceLink of await form.locator('[role="status"] a[target="_blank"]').all()) {
      await expect(sourceLink.locator("[data-external-link-cue]")).toHaveText("↗");
      await expect(sourceLink).toHaveAccessibleName(/opens in new tab/i);
    }
    await form.getByRole("button", { name: "Next question" }).click();

    form = quiz.locator("form");
    const secondPrompt = (await form.getByRole("heading", { level: 3 }).textContent())?.trim() ?? "";
    const secondQuestion = QUESTION_BY_PROMPT.get(secondPrompt);
    expect(secondQuestion).toBeDefined();
    if (!secondQuestion) throw new Error(`Unknown second question: ${secondPrompt}`);
    const selectedIndex = (secondQuestion.correctIndex + 1) % secondQuestion.options.length;
    await form.locator('input[type="radio"]').nth(selectedIndex).check();

    const saved = await page.evaluate((attemptKey) => {
      const raw = window.sessionStorage.getItem(attemptKey);
      return raw ? JSON.parse(raw) as Record<string, unknown> : null;
    }, QUIZ_ATTEMPT_KEY);
    expect(saved).toMatchObject({
      schemaVersion: 1,
      bankVersion: CLAUDE_INCOME_FINAL_QUIZ.bankVersion,
      index: 1,
      selectedIndex,
    });
    expect(Object.keys(saved ?? {}).sort()).toEqual([
      "answers",
      "bankVersion",
      "index",
      "questionIds",
      "schemaVersion",
      "selectedIndex",
    ]);
    expect(saved?.questionIds).toHaveLength(CLAUDE_INCOME_FINAL_QUIZ.questionCount);
    expect(new Set(saved?.questionIds as string[]).size).toBe(
      CLAUDE_INCOME_FINAL_QUIZ.questionCount,
    );
    expect(JSON.stringify(saved)).not.toContain(firstPrompt);
    expect(JSON.stringify(saved)).not.toContain(secondPrompt);
    expect(saved?.answers).toEqual([firstQuestion.correctIndex]);
    expect((saved?.answers as unknown[]).every(Number.isInteger)).toBe(true);
    expect(JSON.stringify(saved)).not.toContain('"correct"');
    for (const option of [...firstQuestion.options, ...secondQuestion.options]) {
      expect(JSON.stringify(saved)).not.toContain(option);
    }

    await page.goto("/en/claude-income/choose-a-money-path/");
    await page.goto(DASHBOARD);
    await expect(quiz.getByTestId("claude-income-quiz-saved-attempt")).toContainText(
      "Question 2 of 16",
    );
    await page.reload();
    const savedAttempt = quiz.getByTestId("claude-income-quiz-saved-attempt");
    await expect(savedAttempt).toContainText("Question 2 of 16");
    await expect(quiz.locator("form")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Reset Course 12 progress" })).toBeVisible();
    await savedAttempt.getByRole("button", { name: "Resume saved attempt" }).click();
    form = quiz.locator("form");
    await expect(form.getByRole("heading", { level: 3, name: secondPrompt })).toBeFocused();
    await expect(form.locator('input[type="radio"]').nth(selectedIndex)).toBeChecked();

    await form.getByRole("button", { name: "Check answer" }).click();
    await expect(form.locator('[role="status"]')).toBeFocused();
    await page.reload();
    await quiz.getByTestId("claude-income-quiz-saved-attempt")
      .getByRole("button", { name: "Resume saved attempt" })
      .click();
    form = quiz.locator("form");
    await expect(form.getByRole("heading", { level: 3, name: secondPrompt })).toBeVisible();
    await expect(form.locator('[role="status"]')).toContainText("Not correct");
    await expect(form.locator('[role="status"]')).toBeFocused();

    await page.evaluate(() => {
      window.localStorage.setItem("unrelated.storage", "preserve-me");
      window.sessionStorage.setItem("unrelated.session", "preserve-session");
      window.localStorage.setItem("ae.progress", JSON.stringify({
        "claude.lesson.choose-your-surface": true,
        "claude-income.last-lesson": "choose-a-money-path",
      }));
    });
    await page.reload();
    await page.getByRole("button", { name: "Reset Course 12 progress" }).click();
    await page.getByRole("button", { name: "Confirm reset" }).click();
    const resetStorage = await page.evaluate((attemptKey) => ({
      attempt: window.sessionStorage.getItem(attemptKey),
      unrelated: window.localStorage.getItem("unrelated.storage"),
      unrelatedSession: window.sessionStorage.getItem("unrelated.session"),
      progress: JSON.parse(window.localStorage.getItem("ae.progress") || "{}") as Record<string, unknown>,
    }), QUIZ_ATTEMPT_KEY);
    expect(resetStorage.attempt).toBeNull();
    expect(resetStorage.unrelated).toBe("preserve-me");
    expect(resetStorage.unrelatedSession).toBe("preserve-session");
    expect(resetStorage.progress["claude.lesson.choose-your-surface"]).toBe(true);
    await expect(quiz.getByTestId("claude-income-quiz-saved-attempt")).toHaveCount(0);
    await expect(quiz.getByRole("button", { name: "Begin final quiz" })).toBeEnabled();
  });

  test("invalid saved attempts fail closed and never replace a fresh balanced attempt", async ({ page }) => {
    await page.goto(DASHBOARD);
    await page.evaluate((attemptKey) => {
      window.sessionStorage.setItem(attemptKey, JSON.stringify({
        schemaVersion: 1,
        bankVersion: "forged-bank",
        questionIds: ["not-a-real-question"],
        index: 99,
        selectedIndex: 99,
        answers: { "not-a-real-question": { selectedIndex: 99, correct: true } },
      }));
    }, QUIZ_ATTEMPT_KEY);
    await page.reload();

    const quiz = page.getByTestId("claude-income-final-quiz");
    await expect(quiz.getByTestId("claude-income-quiz-saved-attempt")).toHaveCount(0);
    await expect(quiz.getByRole("button", { name: "Begin final quiz" })).toBeEnabled();
    await expect.poll(
      () => page.evaluate((attemptKey) => window.sessionStorage.getItem(attemptKey), QUIZ_ATTEMPT_KEY),
    ).toBeNull();
  });

  test("a denied session store gives an explicit leave-risk warning while the quiz remains usable", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL });
    await context.addInitScript(() => {
      Object.defineProperty(window, "sessionStorage", {
        configurable: true,
        get() {
          throw new DOMException("Session storage denied", "SecurityError");
        },
      });
    });
    const page = await context.newPage();
    try {
      await page.goto(DASHBOARD);
      const quiz = page.getByTestId("claude-income-final-quiz");
      await quiz.getByRole("button", { name: "Begin final quiz" }).click();
      const form = quiz.locator("form");
      await expect(form).toBeVisible();
      const prompt = (await form.getByRole("heading", { level: 3 }).textContent())?.trim() ?? "";
      await form.locator('input[type="radio"]').first().check();
      await expect(quiz.getByText(
        "This unfinished attempt cannot be restored after leaving this page, closing the tab, or refreshing.",
        { exact: true },
      )).toBeVisible();

      const unloadGuard = await page.evaluate(() => {
        const event = new Event("beforeunload", { cancelable: true });
        return {
          dispatchAllowed: window.dispatchEvent(event),
          defaultPrevented: event.defaultPrevented,
        };
      });
      expect(unloadGuard).toEqual({ dispatchAllowed: false, defaultPrevented: true });
      await expect(form.getByRole("heading", { level: 3, name: prompt })).toBeVisible();
      await expect(form.locator('input[type="radio"]').first()).toBeChecked();
    } finally {
      await context.close();
    }
  });

  test("a silent failed clear keeps the finished draft guarded and offers cleanup retry", async ({ page }) => {
    test.setTimeout(120_000);
    await clearProgress(page);
    const result = await runQuizAttempt(page, false, async () => {
      expect(await page.evaluate(
        (attemptKey) => window.sessionStorage.getItem(attemptKey),
        QUIZ_ATTEMPT_KEY,
      )).not.toBeNull();
      await page.evaluate((attemptKey) => {
        const originalRemoveItem = Storage.prototype.removeItem;
        Reflect.set(window, "__course12OriginalRemoveItem", originalRemoveItem);
        Storage.prototype.removeItem = function removeItem(key: string) {
          if (this === window.sessionStorage && key === attemptKey) return;
          originalRemoveItem.call(this, key);
        };
      }, QUIZ_ATTEMPT_KEY);
    });
    await expect(result.getByText("Assessment passed", { exact: true })).toBeVisible();
    expect(await page.evaluate(
      (attemptKey) => window.sessionStorage.getItem(attemptKey),
      QUIZ_ATTEMPT_KEY,
    )).not.toBeNull();
    const quiz = page.getByTestId("claude-income-final-quiz");
    await expect(quiz.getByText(
      "Your result is ready, but the saved attempt could not be cleared. Retry cleanup before leaving this page.",
      { exact: true },
    )).toBeVisible();
    await expect(quiz.getByRole("button", { name: "Retry saved-attempt cleanup" })).toBeVisible();
    const unloadGuard = await page.evaluate(() => {
      const event = new Event("beforeunload", { cancelable: true });
      return {
        dispatchAllowed: window.dispatchEvent(event),
        defaultPrevented: event.defaultPrevented,
      };
    });
    expect(unloadGuard).toEqual({ dispatchAllowed: false, defaultPrevented: true });

    await page.evaluate(() => {
      const originalRemoveItem = Reflect.get(
        window,
        "__course12OriginalRemoveItem",
      ) as typeof Storage.prototype.removeItem;
      Storage.prototype.removeItem = originalRemoveItem;
    });
    await quiz.getByRole("button", { name: "Retry saved-attempt cleanup" }).click();
    await expect(quiz.getByText(
      "Your result is ready, but the saved attempt could not be cleared. Retry cleanup before leaving this page.",
      { exact: true },
    )).toHaveCount(0);
    expect(await page.evaluate(
      (attemptKey) => window.sessionStorage.getItem(attemptKey),
      QUIZ_ATTEMPT_KEY,
    )).toBeNull();
    expect(await page.evaluate(() => {
      const event = new Event("beforeunload", { cancelable: true });
      return {
        dispatchAllowed: window.dispatchEvent(event),
        defaultPrevented: event.defaultPrevented,
      };
    })).toEqual({ dispatchAllowed: true, defaultPrevented: false });
  });

  test("a throwing clear leaves reset visibly incomplete and keeps the saved draft recoverable", async ({ page }) => {
    await clearProgress(page);
    const quiz = page.getByTestId("claude-income-final-quiz");
    await quiz.getByRole("button", { name: "Begin final quiz" }).click();
    expect(await page.evaluate(
      (attemptKey) => window.sessionStorage.getItem(attemptKey),
      QUIZ_ATTEMPT_KEY,
    )).not.toBeNull();
    await page.evaluate((attemptKey) => {
      const originalRemoveItem = Storage.prototype.removeItem;
      Storage.prototype.removeItem = function removeItem(key: string) {
        if (this === window.sessionStorage && key === attemptKey) {
          throw new DOMException("Attempt removal denied", "SecurityError");
        }
        originalRemoveItem.call(this, key);
      };
    }, QUIZ_ATTEMPT_KEY);

    await page.getByRole("button", { name: "Reset Course 12 progress" }).click();
    await page.getByRole("button", { name: "Confirm reset" }).click();
    await expect(page.locator(
      'section[aria-labelledby="claude-income-progress-title"] [role="status"]',
    )).toHaveText(
      "Course 12 results were reset, but the saved quiz attempt could not be cleared. Retry reset before leaving this page.",
    );
    await expect(quiz.getByTestId("claude-income-quiz-saved-attempt")).toBeVisible();
    expect(await page.evaluate(
      (attemptKey) => window.sessionStorage.getItem(attemptKey),
      QUIZ_ATTEMPT_KEY,
    )).not.toBeNull();
  });

  test("denied attempt storage never suppresses valid durable progress in My Learning", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL });
    await context.addInitScript(() => {
      window.localStorage.setItem("ae.progress", JSON.stringify({
        "claude-income.lesson.choose-a-money-path.complete": true,
      }));
      Object.defineProperty(window, "sessionStorage", {
        configurable: true,
        get() {
          throw new DOMException("Session storage denied", "SecurityError");
        },
      });
    });
    const page = await context.newPage();
    try {
      await page.goto("/en/learning/");
      const card = page.locator(".learning-course-card").filter({
        hasText: CLAUDE_INCOME_COURSE.title,
      });
      await expect(card).toBeVisible();
      await expect(card.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "7");
      await expect(card.getByRole("link", { name: /Resume/ })).toHaveAttribute(
        "href",
        "/en/claude-income/validate-paid-demand/",
      );
    } finally {
      await context.close();
    }
  });

  test("the site-wide progress reset clears the Course 12 draft and preserves unrelated session data", async ({ page }) => {
    await clearProgress(page);
    const quiz = page.getByTestId("claude-income-final-quiz");
    await quiz.getByRole("button", { name: "Begin final quiz" }).click();
    await quiz.locator('input[type="radio"]').first().check();
    await page.evaluate(() => window.sessionStorage.setItem(
      "unrelated.session",
      "preserve-session",
    ));
    expect(await page.evaluate(
      (attemptKey) => window.sessionStorage.getItem(attemptKey),
      QUIZ_ATTEMPT_KEY,
    )).not.toBeNull();

    await page.goto("/en/learning/");
    page.once("dialog", async (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Clear all progress" }).click();
    await expect(page.locator(".learning-reset-feedback")).toBeVisible();
    expect(await page.evaluate(
      (attemptKey) => window.sessionStorage.getItem(attemptKey),
      QUIZ_ATTEMPT_KEY,
    )).toBeNull();
    expect(await page.evaluate(() => window.sessionStorage.getItem("unrelated.session")))
      .toBe("preserve-session");

    await page.goto(DASHBOARD);
    await expect(quiz.getByTestId("claude-income-quiz-saved-attempt")).toHaveCount(0);
    await expect(quiz.getByRole("button", { name: "Begin final quiz" })).toBeEnabled();
  });

  test("neutral server states hydrate to the saved record without a mismatch or stale action", async ({ page }) => {
    const hydrationProblems: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error"
        && /hydration|did not match|server rendered/iu.test(message.text())) {
        hydrationProblems.push(message.text());
      }
    });
    page.on("pageerror", (error) => {
      if (/hydration|did not match|server rendered/iu.test(error.message)) {
        hydrationProblems.push(error.message);
      }
    });
    await page.addInitScript(({ lessonSlugs, version }) => {
      window.localStorage.setItem("ae.progress", JSON.stringify({
        ...Object.fromEntries(lessonSlugs.map((slug) => [
          `claude-income.lesson.${slug}.complete`,
          true,
        ])),
        "claude-income.quiz.best": 14,
        "claude-income.quiz.passed": true,
        "claude-income.quiz.version": version,
      }));
    }, {
      lessonSlugs: CLAUDE_INCOME_LESSON_SLUGS,
      version: CLAUDE_INCOME_FINAL_QUIZ.bankVersion,
    });

    await page.goto(DASHBOARD);
    const progress = page.locator('section[aria-labelledby="claude-income-progress-title"]');
    const quiz = page.getByTestId("claude-income-final-quiz");
    await expect(progress).toHaveAttribute("data-client-ready", "true");
    await expect(progress).toHaveAttribute("aria-busy", "false");
    await expect(progress.getByText("13 of 14 milestones complete", { exact: true })).toBeVisible();
    await expect(progress.getByRole("link", { name: /Open capstone/ })).toBeVisible();
    await expect(quiz).toHaveAttribute("data-client-ready", "true");
    await expect(quiz).toHaveAttribute("aria-busy", "false");
    await expect(quiz.locator("dd").nth(0)).toHaveText("14/16");
    await expect(quiz.locator("dd").nth(1)).toHaveText("Passed");
    for (const loadingCopy of [
      "Loading course record…",
      "Loading assessment record…",
      "Loading next milestone…",
    ]) {
      await expect(page.getByText(loadingCopy, { exact: true })).toHaveCount(0);
    }
    expect(hydrationProblems).toEqual([]);
  });

  test("course landmarks and every new-tab link clearly name their behavior", async ({ page }) => {
    async function expectNewTabCues(root: ReturnType<Page["locator"]>) {
      const links = root.locator('a[target="_blank"]');
      expect(await links.count()).toBeGreaterThan(0);
      for (const link of await links.all()) {
        await expect(link.locator("[data-external-link-cue]")).toHaveText("↗");
        await expect(link).toHaveAccessibleName(/opens in new tab/i);
      }
    }

    await page.goto(DASHBOARD);
    const dashboard = page.getByTestId("claude-income-dashboard");
    await expect(page.getByRole("region", {
      name: "Course overview: How to Make Money with Claude",
    })).toBeVisible();
    const sourceLedger = dashboard.locator("details").filter({ hasText: "Source ledger" });
    if (!(await sourceLedger.getAttribute("open"))) await sourceLedger.locator("summary").click();
    await expectNewTabCues(dashboard);

    await page.goto("/en/claude-income/choose-a-money-path/");
    const lesson = page.getByTestId("claude-income-lesson-choose-a-money-path");
    await expect(page.getByRole("complementary", { name: "Course 12 outline" })).toBeVisible();
    const figure = lesson.getByTestId("claude-income-figure-fig-01-chat-composer");
    await expect(figure.locator("a").first()).toHaveAttribute("target", "_blank");
    await expect(figure.getByText("Open full-resolution figure", { exact: true })).toBeVisible();
    await expectNewTabCues(lesson);
  });
});

test.describe("Course 12 routes, evidence rendering, and media boundaries", () => {
  test("dashboard exposes Course 12, all lessons, evidence limits, quiz, and capstone", async ({ page }) => {
    const response = await page.goto(DASHBOARD);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/How to Make Money with Claude/);
    const root = page.getByTestId("claude-income-dashboard");
    await expect(root).toHaveAttribute("lang", "en");
    await expect(root).toHaveAttribute("dir", "ltr");
    await expect(root.getByRole("heading", { level: 1, name: CLAUDE_INCOME_COURSE.title })).toBeVisible();
    await expect(root.getByText("Course 12", { exact: true }).first()).toBeVisible();
    await expect(root.locator('section#curriculum a[href^="/en/claude-income/"]')).toHaveCount(12);
    await expect(root.getByText(CLAUDE_INCOME_COURSE.disclaimer, { exact: true })).toBeVisible();
    await expect(root.getByText(CLAUDE_INCOME_COURSE.practitionerDisclaimer, { exact: true })).toBeVisible();
    await expect(root.getByText(CLAUDE_INCOME_COURSE.independentProjectNotice, { exact: true })).toBeVisible();
    await expect(root.getByRole("heading", { name: "16 questions, four business boundaries" })).toBeVisible();
    const finalQuiz = root.getByTestId("claude-income-final-quiz");
    await expect(finalQuiz).toHaveAttribute("data-client-ready", "true");
    await expect(finalQuiz.getByRole("button", { name: "Begin final quiz" })).toBeEnabled();
    await expect(finalQuiz.locator("#claude-income-final-quiz-readiness")).toHaveText(
      "Final quiz ready.",
    );
    await expect(root.getByText(/100-point evidence rubric/)).toBeVisible();
    await expect(root.getByText("7", { exact: true }).first()).toBeVisible();
    await assertNoRemoteMedia(page);
  });

  for (const lesson of CLAUDE_INCOME_COURSE.lessons) {
    test(`lesson ${lesson.order}: ${lesson.slug} renders its complete learning contract`, async ({ page }) => {
      const externalMediaRequests: string[] = [];
      page.on("request", (request) => {
        if (["image", "media"].includes(request.resourceType())) {
          const url = new URL(request.url());
          if (!url.hostname.match(/^(127\.0\.0\.1|localhost)$/)) externalMediaRequests.push(url.href);
        }
      });
      const response = await page.goto(`/en/claude-income/${lesson.slug}/`);
      expect(response?.status()).toBe(200);
      const root = page.getByTestId(`claude-income-lesson-${lesson.slug}`);
      await expect(root).toHaveAttribute("lang", "en");
      await expect(root).toHaveAttribute("dir", "ltr");
      await expect(root.getByRole("heading", { level: 1, name: lesson.title })).toBeVisible();
      await expect(root.locator('section[aria-labelledby^="lesson-section-"]')).toHaveCount(
        lesson.sections.length,
      );
      await expect(root.getByRole("heading", { name: "Run the work in this order" })).toBeVisible();
      await expect(root.locator('section[aria-labelledby="workflow-title"] ol > li')).toHaveCount(
        lesson.workflow.length,
      );
      await expect(root.locator('section[aria-labelledby="prompt-template-title"] pre code')).toContainText(
        lesson.promptTemplate.slice(0, 60),
      );
      await expect(root.locator('section[aria-labelledby="quality-gate-title"] li')).toHaveCount(
        lesson.qualityGate.length,
      );
      await expect(root.locator('section[aria-labelledby="red-flags-title"] li')).toHaveCount(
        lesson.redFlags.length,
      );
      await expect(root.locator('section[aria-labelledby="practice-title"]')).toContainText(
        lesson.practice.title,
      );
      await expect(root.locator('section[aria-labelledby="lesson-sources-title"] > ol > li')).toHaveCount(
        lesson.sourceIds.length,
      );
      await expect(root.getByText(CLAUDE_INCOME_COURSE.independentProjectNotice, { exact: true })).toBeVisible();

      await expect(root.locator('[data-testid^="claude-income-figure-"]')).toHaveCount(
        lesson.figureIds.length,
      );
      for (const figureId of lesson.figureIds) {
        const figure = CLAUDE_INCOME_FIGURES.find((item) => item.id === figureId);
        expect(figure).toBeDefined();
        if (!figure) continue;
        const rendered = root.getByTestId(`claude-income-figure-${figure.id}`);
        await expect(rendered).toHaveAttribute("data-capture-sha256", figure.sha256);
        await expect(rendered).toHaveAttribute("data-rights-status", "course-authored-capture");
        await expect(rendered).toHaveAttribute("data-privacy-review", "passed");
        await expect(rendered).toHaveAttribute("data-master-width", String(figure.width));
        await expect(rendered).toHaveAttribute("data-master-height", String(figure.height));
        const image = rendered.locator("img");
        await expect(image).toHaveAttribute("src", figure.src);
        await expect(image).toHaveAttribute("alt", figure.alt);
        await expect(image).toBeVisible();
        await image.scrollIntoViewIfNeeded();
        await expect.poll(
          () => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0),
        ).toBe(true);
        const decoded = await image.evaluate((node: HTMLImageElement) => ({
          currentSrc: node.currentSrc,
          naturalWidth: node.naturalWidth,
          naturalHeight: node.naturalHeight,
        }));
        expect(
          [figure.src, ...figure.variants.map((variant) => variant.src)].some(
            (src) => new URL(decoded.currentSrc).pathname === src,
          ),
          decoded.currentSrc,
        ).toBe(true);
        expect(decoded.naturalWidth / decoded.naturalHeight).toBeCloseTo(
          figure.width / figure.height,
          2,
        );
        await expect(rendered.locator("a").first()).toHaveAttribute("href", figure.src);
        await expect(rendered.locator("time")).toHaveAttribute("datetime", figure.observedOn);
        await expect(rendered.getByText("Course-authored capture", { exact: true })).toBeVisible();
        await expect(rendered.getByText("Review passed", { exact: true })).toBeVisible();
        const variants = uniqueVariants(figure.variants);
        await expect(rendered.locator('source[type="image/webp"]')).toHaveAttribute(
          "srcset",
          variants.map((variant) => `${variant.src} ${variant.width}w`).join(", "),
        );
        for (const variant of figure.variants) {
          expect(sha256(localAssetPath(variant.src)), variant.src).toBe(variant.sha256);
        }
      }
      await assertNoRemoteMedia(page);
      expect(externalMediaRequests).toEqual([]);
    });
  }

  test("unknown lesson and unknown locale fail closed", async ({ page }) => {
    for (const route of [
      "/en/claude-income/not-a-course-lesson/",
      "/zz/claude-income/",
    ]) {
      await withIsolatedRoutePage(page, route, async (routePage) => {
        await expect(routePage.locator(COURSE_ROOT)).toHaveCount(0);
      }, { expectedStatus: 404 });
    }
  });
});

test.describe("Course 12 language and search metadata boundaries", () => {
  test("only real English course routes publish while shell locales remain available in the catalogue", async ({ page }) => {
    test.setTimeout(90_000);
    expect(CLAUDE_INCOME_LOCALES).toHaveLength(9);
    await withIsolatedRoutePage(page, DASHBOARD, async (routePage) => {
      const dashboard = routePage.getByTestId("claude-income-dashboard");
      await expect(dashboard).toHaveAttribute("lang", "en");
      await expect(dashboard).toHaveAttribute("dir", "ltr");
      await expect(dashboard.getByRole("heading", { level: 1 })).toHaveText(
        CLAUDE_INCOME_COURSE.title,
      );
    });

    await withIsolatedRoutePage(
      page,
      "/en/claude-income/choose-a-money-path/",
      async (routePage) => {
        const lesson = routePage.getByTestId("claude-income-lesson-choose-a-money-path");
        await expect(lesson).toHaveAttribute("lang", "en");
        await expect(lesson).toHaveAttribute("dir", "ltr");
        await expect(lesson.getByRole("heading", { level: 1 })).toHaveText(
          CLAUDE_INCOME_COURSE.lessons[0].title,
        );
      },
    );

    for (const locale of CLAUDE_INCOME_LOCALES.filter((candidate) => candidate !== "en")) {
      for (const suffix of ["", "choose-a-money-path/"]) {
        const route = `/${locale}/claude-income/${suffix}`;
        await withIsolatedRoutePage(page, route, async (routePage) => {
          await expect(routePage.locator(COURSE_ROOT)).toHaveCount(0);
        }, { expectedStatus: 404 });
      }
    }

    await withIsolatedRoutePage(page, "/fr/courses/", async (routePage) => {
      await expect(routePage.locator('main a[href="/en/claude-income/?fromLocale=fr"]'))
        .toBeVisible();
    });
  });

  test("dashboard metadata publishes only the real English canonical and hreflang", async ({ page }) => {
    await page.goto(DASHBOARD);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${SITE}/en/claude-income/`,
    );
    const alternates = page.locator('link[rel="alternate"][hreflang]');
    await expect(alternates).toHaveCount(2);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
      "href",
      `${SITE}/en/claude-income/`,
    );
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
      "href",
      `${SITE}/en/claude-income/`,
    );
    await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveCount(0);

    const records = await page.locator('script[type="application/ld+json"]').allTextContents();
    const graphs = records.map((record) => JSON.parse(record) as { "@graph"?: Array<Record<string, unknown>> });
    const graph = graphs.find((record) => record["@graph"]?.some((item) => item["@type"] === "Course"));
    expect(graph).toBeDefined();
    const course = graph?.["@graph"]?.find((item) => item["@type"] === "Course") as {
      inLanguage: string;
      hasPart: unknown[];
      hasCourseInstance: { courseWorkload: string };
      offers: { price: number; category: string };
    };
    expect(course.inLanguage).toBe("en");
    expect(course.hasPart).toHaveLength(12);
    expect(course.hasCourseInstance.courseWorkload).toBe(
      `PT${CLAUDE_INCOME_COURSE.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0)}M`,
    );
    expect(course.offers).toMatchObject({ price: 0, category: "Free" });
    expect(graph?.["@graph"]?.some((item) => item["@type"] === "BreadcrumbList")).toBe(true);
  });

  test("lesson metadata keeps the route canonical, English resource language, and breadcrumb", async ({ page }) => {
    const lesson = CLAUDE_INCOME_COURSE.lessons[8];
    await page.goto(`/en/claude-income/${lesson.slug}/`);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${SITE}/en/claude-income/${lesson.slug}/`,
    );
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(2);
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
      "href",
      `${SITE}/en/claude-income/${lesson.slug}/`,
    );
    const records = await page.locator('script[type="application/ld+json"]').allTextContents();
    const graphs = records.map((record) => JSON.parse(record) as { "@graph"?: Array<Record<string, unknown>> });
    const graph = graphs.find((record) => record["@graph"]?.some(
      (item) => item["@type"] === "LearningResource",
    ));
    expect(graph).toBeDefined();
    const resource = graph?.["@graph"]?.find((item) => item["@type"] === "LearningResource");
    expect(resource).toMatchObject({
      name: lesson.title,
      inLanguage: "en",
      learningResourceType: "lesson",
      position: lesson.order,
      timeRequired: `PT${lesson.minutes}M`,
    });
    expect(graph?.["@graph"]?.some((item) => item["@type"] === "BreadcrumbList")).toBe(true);
  });
});

test.describe("Course 12 progress isolation and resilient storage", () => {
  test("resume and Course 12 reset preserve all unrelated site and course records", async ({ page }) => {
    await page.goto(DASHBOARD);
    await page.evaluate(({ prefix, version }) => {
      window.localStorage.setItem("ae.theme", "dark");
      window.localStorage.setItem("unrelated.storage", "preserve-me");
      window.localStorage.setItem("ae.progress", JSON.stringify({
        "claude.lesson.choose-your-surface": true,
        "make-money-with-codex.lesson.start": true,
        "handbook.done": true,
        [`${prefix}lesson.choose-a-money-path.complete`]: true,
        [`${prefix}last-lesson`]: "run-client-projects",
        [`${prefix}quiz.best`]: 14,
        [`${prefix}quiz.passed`]: true,
        [`${prefix}quiz.version`]: version,
        [`${prefix}capstone.v1`]: true,
      }));
    }, { prefix: COURSE_PREFIX, version: CLAUDE_INCOME_FINAL_QUIZ.bankVersion });
    await page.reload();

    const progress = page.locator('section[aria-labelledby="claude-income-progress-title"]');
    await expect(progress.getByRole("heading", { name: "Resume lesson 5" })).toBeVisible();
    await expect(progress.getByText("3 of 14 milestones complete", { exact: true })).toBeVisible();
    await expect(progress.getByRole("link", { name: /Resume course/ })).toHaveAttribute(
      "href",
      "/en/claude-income/run-client-projects/",
    );

    await progress.getByRole("link", { name: /Resume course/ }).click();
    const completion = page.locator('section[aria-labelledby="lesson-completion-title"]');
    const completionCheckbox = completion.getByRole("checkbox");
    await expect(completionCheckbox).not.toBeChecked();
    await completionCheckbox.check();
    await expect(completionCheckbox).toBeChecked();
    await expect(completion.getByText("Completed", { exact: true })).toBeVisible();

    await page.goto(DASHBOARD);
    await expect(page.getByText("4 of 14 milestones complete", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Reset Course 12 progress" }).click();
    await expect(page.getByRole("button", { name: "Confirm reset" })).toBeVisible();
    await page.getByRole("button", { name: "Confirm reset" }).click();
    await expect(progress.locator('[aria-live="polite"]')).toHaveText(
      "Course 12 progress was reset. Other course and site data was preserved.",
    );
    await expect(page.getByText("0 of 14 milestones complete", { exact: true })).toBeVisible();

    const storage = await page.evaluate(() => ({
      theme: window.localStorage.getItem("ae.theme"),
      unrelated: window.localStorage.getItem("unrelated.storage"),
      progress: JSON.parse(window.localStorage.getItem("ae.progress") || "{}") as Record<string, unknown>,
    }));
    expect(storage.theme).toBe("dark");
    expect(storage.unrelated).toBe("preserve-me");
    expect(storage.progress["claude.lesson.choose-your-surface"]).toBe(true);
    expect(storage.progress["make-money-with-codex.lesson.start"]).toBe(true);
    expect(storage.progress["handbook.done"]).toBe(true);
    expect(Object.keys(storage.progress).filter((key) => key.startsWith(COURSE_PREFIX))).toEqual([]);
  });

  test("localStorage denial keeps the lesson, ephemeral completion, and client navigation usable", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, javaScriptEnabled: true });
    await context.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        get() {
          throw new DOMException("Storage denied", "SecurityError");
        },
      });
    });
    const page = await context.newPage();
    try {
      const response = await page.goto("/en/claude-income/choose-a-money-path/");
      expect(response?.status()).toBe(200);
      await expect(page.getByTestId("claude-income-lesson-choose-a-money-path")).toBeVisible();
      await expect(page.getByText(
        "This completion is available only in the current browser session.",
        { exact: true },
      )).toBeVisible();
      const completion = page.locator('section[aria-labelledby="lesson-completion-title"]');
      await completion.getByRole("checkbox").check();
      await expect(completion.getByRole("checkbox")).toBeChecked();
      await expect(completion.getByText("Completed", { exact: true })).toBeVisible();

      await page.getByRole("link", { name: CLAUDE_INCOME_COURSE.title, exact: true }).first().click();
      await expect(page.getByTestId("claude-income-dashboard")).toBeVisible();
      await expect(page.getByText(
        "Browser storage is unavailable. Progress will last only for this open session.",
        { exact: true },
      )).toBeVisible();
      await expect(page.getByText("1 of 14 milestones complete", { exact: true })).toBeVisible();
    } finally {
      await context.close();
    }
  });
});

test.describe("Course 12 assessments", () => {
  test("every final attempt is balanced and a 15/16 result still fails when one critical boundary is missed", async ({ page }) => {
    test.setTimeout(120_000);
    await clearProgress(page);

    let result = await runQuizAttempt(page, true);
    await expect(result.getByText("Review required", { exact: true })).toBeVisible();
    await expect(result.getByRole("heading", { name: "15/16 correct" })).toBeVisible();
    await expect(result).toContainText("Critical boundary: not clear.");
    let stored = await page.evaluate(() => JSON.parse(
      window.localStorage.getItem("ae.progress") || "{}",
    ) as Record<string, unknown>);
    expect(stored[CLAUDE_INCOME_FINAL_QUIZ.bestScoreStorageKey]).toBe(15);
    expect(stored[CLAUDE_INCOME_FINAL_QUIZ.passedStorageKey]).toBe(false);
    expect(stored[CLAUDE_INCOME_FINAL_QUIZ.versionStorageKey]).toBe(
      CLAUDE_INCOME_FINAL_QUIZ.bankVersion,
    );
    expect(await page.evaluate(
      (attemptKey) => window.sessionStorage.getItem(attemptKey),
      QUIZ_ATTEMPT_KEY,
    )).toBeNull();

    result = await runQuizAttempt(page, false);
    await expect(result.getByText("Assessment passed", { exact: true })).toBeVisible();
    await expect(result.getByRole("heading", { name: "16/16 correct" })).toBeVisible();
    await expect(result).toContainText("Critical boundary: clear.");
    stored = await page.evaluate(() => JSON.parse(
      window.localStorage.getItem("ae.progress") || "{}",
    ) as Record<string, unknown>);
    expect(stored[CLAUDE_INCOME_FINAL_QUIZ.bestScoreStorageKey]).toBe(16);
    expect(stored[CLAUDE_INCOME_FINAL_QUIZ.passedStorageKey]).toBe(true);
    expect(await page.evaluate(
      (attemptKey) => window.sessionStorage.getItem(attemptKey),
      QUIZ_ATTEMPT_KEY,
    )).toBeNull();
  });

  test("the 100-point capstone cannot compensate for one uncleared critical failure", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/en/claude-income/capstone-seven-day-demand-test/");
    await page.evaluate(() => window.localStorage.removeItem("ae.progress"));
    await page.reload();

    const lesson = CLAUDE_INCOME_COURSE.lessons.find(
      (item) => item.slug === "capstone-seven-day-demand-test",
    );
    expect(lesson).toBeDefined();
    if (!lesson) throw new Error("Capstone lesson is missing");
    const audit = page.locator('section[aria-labelledby="claude-income-capstone-audit-title"]');
    await expect(audit.getByRole("heading", { name: "A 100-point evidence record" })).toBeVisible();
    const recordButton = audit.getByRole("button", { name: "Record capstone completion" });
    await expect(recordButton).toBeDisabled();

    const deliverables = audit.locator(
      'section[aria-labelledby="capstone-deliverables-title"] input[type="checkbox"]',
    );
    await expect(deliverables).toHaveCount(lesson.practice.deliverables.length);
    for (let index = 0; index < lesson.practice.deliverables.length; index += 1) {
      await deliverables.nth(index).check();
    }
    for (const criterion of CLAUDE_INCOME_CAPSTONE.criteria) {
      await audit.getByLabel(`Points for ${criterion.label}`).fill(String(criterion.points));
    }
    await expect(audit.getByText("100/100", { exact: true })).toBeVisible();
    await expect(recordButton).toBeDisabled();

    const critical = audit.locator(
      'section[aria-labelledby="capstone-critical-title"] input[type="checkbox"]',
    );
    await expect(critical).toHaveCount(CLAUDE_INCOME_CAPSTONE.criticalFailures.length);
    for (let index = 0; index < CLAUDE_INCOME_CAPSTONE.criticalFailures.length - 1; index += 1) {
      await critical.nth(index).check();
    }
    await expect(recordButton).toBeDisabled();
    await critical.last().check();
    await expect(recordButton).toBeEnabled();
    await recordButton.click();

    const result = audit.locator('[role="status"]').filter({ hasText: "Evidence-bounded capstone recorded" });
    await expect(result).toBeVisible();
    await expect(result).toBeFocused();
    let stored = await page.evaluate(() => JSON.parse(
      window.localStorage.getItem("ae.progress") || "{}",
    ) as Record<string, unknown>);
    expect(stored[CLAUDE_INCOME_CAPSTONE.passedStorageKey]).toBe(true);

    await critical.first().uncheck();
    await expect(audit.locator('[role="status"]').filter({ hasText: "Evidence-bounded capstone recorded" })).toHaveCount(0);
    await expect(recordButton).toBeDisabled();
    stored = await page.evaluate(() => JSON.parse(
      window.localStorage.getItem("ae.progress") || "{}",
    ) as Record<string, unknown>);
    expect(stored[CLAUDE_INCOME_CAPSTONE.passedStorageKey]).toBeUndefined();
  });
});

test.describe("Course 12 resilient rendering and accessibility basics", () => {
  test("copy results are announced without replacing the prompt content", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, "clipboard", {
        configurable: true,
        get: () => ({ writeText: async () => undefined }),
      });
    });
    await page.goto("/en/claude-income/choose-a-money-path/");
    const prompt = page.locator('section[aria-labelledby="prompt-template-title"]');
    const originalPrompt = await prompt.locator("pre code").textContent();
    await prompt.getByRole("button", { name: "Copy prompt" }).click();
    await expect(prompt.getByRole("button", { name: "Copied" })).toBeVisible();
    await expect(prompt.locator('[role="status"][aria-live="polite"]')).toHaveText(
      "Prompt copied to clipboard.",
    );
    await expect(prompt.locator("pre code")).toHaveText(originalPrompt ?? "");
  });

  test("dashboard quiz, representative lesson, and capstone pass automated WCAG A and AA checks", async ({ page }) => {
    test.setTimeout(90_000);
    for (const route of [
      DASHBOARD,
      "/en/claude-income/choose-a-money-path/",
      "/en/claude-income/capstone-seven-day-demand-test/",
    ]) {
      await withIsolatedRoutePage(page, route, async (routePage) => {
        await routePage.locator("main").waitFor();
        await routePage.evaluate(async () => {
          await document.fonts.ready;
        });
        if (route === DASHBOARD) {
          const quiz = routePage.getByTestId("claude-income-final-quiz");
          await quiz.getByRole("button", { name: "Begin final quiz" }).click();
          await quiz.locator('input[type="radio"]').first().check();
          await quiz.getByRole("button", { name: "Check answer" }).click();
          await expect(quiz.locator('[role="status"]')).toBeFocused();
        }
        expect(await axeViolations(routePage), route).toEqual([]);
      });
    }
  });

  test("dashboard and a figure-rich capstone have no horizontal overflow at 390, 768, or 1440 pixels", async ({ page }) => {
    test.setTimeout(90_000);
    for (const width of [390, 768, 1440]) {
      for (const route of [DASHBOARD, "/en/claude-income/capstone-seven-day-demand-test/"]) {
        await withIsolatedRoutePage(page, route, async (routePage) => {
          await expect(routePage.locator(COURSE_ROOT)).toBeVisible();
          const measurements = await routePage.evaluate(() => ({
            innerWidth: window.innerWidth,
            documentWidth: document.documentElement.scrollWidth,
            bodyWidth: document.body.scrollWidth,
          }));
          expect(measurements.documentWidth, `${width}px document at ${route}`).toBeLessThanOrEqual(
            measurements.innerWidth + 1,
          );
          expect(measurements.bodyWidth, `${width}px body at ${route}`).toBeLessThanOrEqual(
            measurements.innerWidth + 1,
          );
          for (const image of await routePage.locator(`${COURSE_ROOT} img`).all()) {
            const box = await image.boundingBox();
            if (box) expect(box.width, `${width}px image at ${route}`).toBeLessThanOrEqual(width);
          }
        }, { viewport: { width, height: 900 } });
      }
    }
  });

  test("Phase 3 uses one restrained raised tier while editorial reading surfaces stay flat", async ({ page }) => {
    await page.goto(DASHBOARD);

    const raisedDashboardSurfaces = [
      page.locator('section[aria-labelledby="claude-income-progress-title"]'),
      page.locator('section[aria-labelledby="assessment-path-title"] article').first(),
      page.getByTestId("claude-income-final-quiz"),
      page.getByTestId("claude-income-dashboard-figure"),
    ];
    const dashboardShadows = await Promise.all(raisedDashboardSurfaces.map(
      (surface) => surface.evaluate((node) => getComputedStyle(node).boxShadow),
    ));
    expect(dashboardShadows.every((shadow) => shadow !== "none")).toBe(true);
    expect(new Set(dashboardShadows).size).toBe(1);

    for (const editorialSurface of [
      page.locator('section[aria-labelledby="honesty-title"]'),
      page.locator("section#curriculum"),
      page.locator('section[aria-labelledby="source-integrity-title"]'),
    ]) {
      await expect(editorialSurface).toBeVisible();
      expect(await editorialSurface.evaluate((node) => getComputedStyle(node).boxShadow)).toBe("none");
    }

    const dashboardUtilities = await page.evaluate(() => {
      const styleFor = (selector: string) => {
        const node = document.querySelector<HTMLElement>(selector);
        if (!node) throw new Error(`Missing Phase 3 selector: ${selector}`);
        return getComputedStyle(node);
      };
      return {
        prettySupported: CSS.supports("text-wrap", "pretty"),
        proseWrap: styleFor('[data-testid="claude-income-dashboard"] header p:nth-of-type(2)').textWrap,
        sourceOverflow: styleFor('[data-testid="claude-income-dashboard"] details li a').overflowWrap,
        assessmentNumerals: styleFor('[data-testid="claude-income-final-quiz"] dd').fontVariantNumeric,
        touchAction: styleFor('[data-testid="claude-income-final-quiz"] button').touchAction,
      };
    });
    expect(dashboardUtilities.proseWrap).toBe(
      dashboardUtilities.prettySupported ? "pretty" : "wrap",
    );
    expect(dashboardUtilities.sourceOverflow).toBe("anywhere");
    expect(dashboardUtilities.assessmentNumerals).toContain("tabular-nums");
    expect(dashboardUtilities.touchAction).toBe("manipulation");

    await page.goto("/en/claude-income/capstone-seven-day-demand-test/");
    const lesson = page.getByTestId("claude-income-lesson-capstone-seven-day-demand-test");
    const lessonRaisedSurfaces = [
      lesson.locator('figure[data-testid^="claude-income-figure-"]').first(),
      lesson.getByTestId("claude-income-capstone-audit"),
    ];
    const lessonShadows = await Promise.all(lessonRaisedSurfaces.map(
      (surface) => surface.evaluate((node) => getComputedStyle(node).boxShadow),
    ));
    expect(lessonShadows.every((shadow) => shadow !== "none")).toBe(true);
    expect(new Set([...dashboardShadows, ...lessonShadows]).size).toBe(1);

    for (const editorialSurface of [
      lesson.locator('section[aria-labelledby="lesson-objective-title"]'),
      lesson.locator('section[aria-labelledby="prompt-template-title"]'),
      lesson.locator('section[aria-labelledby="practice-title"]'),
    ]) {
      await expect(editorialSurface).toBeVisible();
      expect(await editorialSurface.evaluate((node) => getComputedStyle(node).boxShadow)).toBe("none");
    }

    const lessonUtilities = await lesson.evaluate((root) => {
      const styleFor = (selector: string) => {
        const node = root.querySelector<HTMLElement>(selector);
        if (!node) throw new Error(`Missing Phase 3 lesson selector: ${selector}`);
        return getComputedStyle(node);
      };
      return {
        prettySupported: CSS.supports("text-wrap", "pretty"),
        proseWrap: styleFor('section[aria-labelledby^="lesson-section-"] > p').textWrap,
        sourceOverflow: styleFor('section[aria-labelledby="lesson-sources-title"] li > a').overflowWrap,
        metadataNumerals: styleFor("header dl dd").fontVariantNumeric,
      };
    });
    expect(lessonUtilities.proseWrap).toBe(
      lessonUtilities.prettySupported ? "pretty" : "wrap",
    );
    expect(lessonUtilities.sourceOverflow).toBe("anywhere");
    expect(lessonUtilities.metadataNumerals).toContain("tabular-nums");

    await page.emulateMedia({ reducedMotion: "reduce" });
    const reducedMotion = await lesson.locator('section[aria-labelledby="prompt-template-title"] button')
      .evaluate((node) => getComputedStyle(node).transitionDuration);
    expect(reducedMotion.split(",").every((duration) => duration.trim() === "0s")).toBe(true);
  });

  test("Phase 3 reflows at short landscape and 200%/400% equivalents without losing primary actions", async ({ page }) => {
    test.setTimeout(90_000);
    const viewports = [
      { label: "short landscape", width: 844, height: 320 },
      { label: "200% equivalent", width: 640, height: 900 },
      { label: "400% equivalent", width: 320, height: 900 },
    ];
    for (const viewport of viewports) {
      for (const route of [DASHBOARD, "/en/claude-income/capstone-seven-day-demand-test/"]) {
        await withIsolatedRoutePage(page, route, async (routePage) => {
          const dimensions = await routePage.evaluate(() => ({
            clientWidth: document.documentElement.clientWidth,
            scrollWidth: document.documentElement.scrollWidth,
          }));
          expect(dimensions.scrollWidth, `${viewport.label} at ${route}`)
            .toBeLessThanOrEqual(dimensions.clientWidth + 1);
          await expect(routePage.locator(COURSE_ROOT).getByRole("heading", { level: 1 })).toBeVisible();
          if (route === DASHBOARD) {
            await expect(routePage.getByRole("link", { name: "Start lesson 1" })).toBeVisible();
          } else {
            await expect(routePage.getByRole("button", { name: "Record capstone completion" }))
              .toBeAttached();
          }
        }, { viewport: { width: viewport.width, height: viewport.height } });
      }
    }
  });

  test("forced-colors mode keeps raised surfaces and focus understandable without shadows", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto(DASHBOARD);
    for (const surface of [
      page.locator('section[aria-labelledby="claude-income-progress-title"]'),
      page.getByTestId("claude-income-dashboard-figure"),
      page.getByTestId("claude-income-final-quiz"),
    ]) {
      const border = await surface.evaluate((node) => {
        const style = getComputedStyle(node);
        return { style: style.borderTopStyle, width: Number.parseFloat(style.borderTopWidth) };
      });
      expect(border.style).not.toBe("none");
      expect(border.width).toBeGreaterThanOrEqual(1);
    }

    const start = page.getByRole("link", { name: "Start lesson 1" });
    await start.focus();
    const focus = await start.evaluate((node) => {
      const style = getComputedStyle(node);
      return { style: style.outlineStyle, width: Number.parseFloat(style.outlineWidth) };
    });
    expect(focus.style).not.toBe("none");
    expect(focus.width).toBeGreaterThanOrEqual(2);
  });

  test("external-link cues stay plain and aligned with their source label", async ({ page }) => {
    await page.goto(DASHBOARD);
    const ledger = page.locator('details').filter({ hasText: "Open the full source ledger" });
    await ledger.locator("summary").click();
    const dashboardCue = ledger.locator("[data-external-link-cue]").first();
    const dashboardCueStyle = await dashboardCue.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        borderStyle: style.borderTopStyle,
        paddingInlineStart: style.paddingInlineStart,
        paddingInlineEnd: style.paddingInlineEnd,
      };
    });
    expect(dashboardCueStyle).toEqual({
      borderStyle: "none",
      paddingInlineStart: "0px",
      paddingInlineEnd: "0px",
    });

    await page.goto("/en/claude-income/choose-a-money-path/");
    const lessonSource = page.locator('section[aria-labelledby="lesson-sources-title"] li > a').first();
    const lessonCue = lessonSource.locator("[data-external-link-cue]");
    const cuePlacement = await lessonCue.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        column: style.gridColumnStart,
        rowStart: style.gridRowStart,
        rowEnd: style.gridRowEnd,
      };
    });
    expect(cuePlacement).toEqual({ column: "2", rowStart: "1", rowEnd: "3" });
  });

  test("programmatic assessment targets use the intentional Course 12 focus treatment", async ({ page }) => {
    await page.goto(`${DASHBOARD}#final-quiz`);
    const quiz = page.getByTestId("claude-income-final-quiz");
    await quiz.focus();
    const quizFocus = await quiz.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        color: style.outlineColor,
        offset: style.outlineOffset,
        style: style.outlineStyle,
        width: style.outlineWidth,
      };
    });
    expect(quizFocus).toEqual({
      color: "rgb(163, 63, 47)",
      offset: "3px",
      style: "solid",
      width: "3px",
    });

    await page.goto("/en/claude-income/capstone-seven-day-demand-test/#claude-income-capstone-audit-title");
    const capstoneHeading = page.getByRole("heading", { name: "A 100-point evidence record" });
    await capstoneHeading.focus();
    const capstoneFocus = await capstoneHeading.evaluate((node) => {
      const style = getComputedStyle(node);
      return { style: style.outlineStyle, width: style.outlineWidth };
    });
    expect(capstoneFocus).toEqual({ style: "solid", width: "3px" });
  });

  test("light and dark themes change the course palette, persist, and expose keyboard focus", async ({ page }) => {
    await page.addInitScript(() => {
      if (!window.localStorage.getItem("ae.theme")) {
        window.localStorage.setItem("ae.theme", "light");
      }
    });
    await page.goto(DASHBOARD);
    const root = page.getByTestId("claude-income-dashboard");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    const lightColor = await root.evaluate((node) => getComputedStyle(node).color);
    expect(lightColor).toBe("rgb(25, 27, 32)");

    await page.locator("button.themebtn").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    const darkColor = await root.evaluate((node) => getComputedStyle(node).color);
    expect(darkColor).toBe("rgb(242, 238, 233)");
    expect(darkColor).not.toBe(lightColor);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    let focusedInsideCourse = false;
    for (let index = 0; index < 40; index += 1) {
      await page.keyboard.press("Tab");
      focusedInsideCourse = await page.evaluate(() => {
        const rootNode = document.querySelector('[data-testid="claude-income-dashboard"]');
        return Boolean(rootNode && document.activeElement && rootNode.contains(document.activeElement));
      });
      if (focusedInsideCourse) break;
    }
    expect(focusedInsideCourse).toBe(true);
    const focusStyle = await page.locator(":focus").evaluate((node) => {
      const style = getComputedStyle(node);
      return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
    });
    expect(focusStyle.outlineStyle).not.toBe("none");
    expect(Number.parseFloat(focusStyle.outlineWidth)).toBeGreaterThanOrEqual(2);
  });

  test("core curriculum, lesson, figures, sources, and capstone remain available without JavaScript", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
    const page = await context.newPage();
    try {
      let response = await page.goto(DASHBOARD);
      expect(response?.status()).toBe(200);
      const dashboard = page.getByTestId("claude-income-dashboard");
      await expect(dashboard.getByRole("heading", { level: 1 })).toHaveText(CLAUDE_INCOME_COURSE.title);
      await expect(dashboard.locator('section#curriculum a[href^="/en/claude-income/"]')).toHaveCount(12);
      await expect(dashboard.getByText(CLAUDE_INCOME_COURSE.disclaimer, { exact: true })).toBeVisible();
      await expect(dashboard.locator('details[open]')).toHaveCount(0);
      await expect(dashboard.locator('details ol > li')).toHaveCount(CLAUDE_INCOME_SOURCES.length);
      const progress = dashboard.locator('section[aria-labelledby="claude-income-progress-title"]');
      await expect(progress).toHaveAttribute("data-client-ready", "false");
      await expect(progress).toHaveAttribute("aria-busy", "true");
      await expect(progress.getByRole("heading", { name: "Loading course record…" })).toBeVisible();
      await expect(progress.locator("[data-course-journey-action]")).toHaveCount(0);
      await expect(progress.getByText("0 of 14 milestones complete", { exact: true })).toHaveCount(0);
      await expect(progress.getByRole("progressbar", { name: "Loading Course 12 progress" }))
        .not.toHaveAttribute("value");
      await expect(progress.getByText(
        "Saved progress needs JavaScript. Every lesson remains available from the curriculum below.",
        { exact: true },
      )).toBeVisible();
      const finalQuiz = dashboard.getByTestId("claude-income-final-quiz");
      await expect(finalQuiz).toHaveAttribute("data-client-ready", "false");
      await expect(finalQuiz).toHaveAttribute("aria-busy", "true");
      await expect(finalQuiz.getByRole("button", { name: "Begin final quiz" })).toHaveCount(0);
      await expect(finalQuiz.getByText("Loading assessment record…", { exact: true })).toBeVisible();
      await expect(finalQuiz.getByText(
        "The final quiz requires JavaScript. The curriculum, figures, sources, and capstone instructions remain available.",
        { exact: true },
      )).toBeVisible();
      await expect(finalQuiz.locator("dd").nth(0)).toHaveText("—");
      await expect(finalQuiz.locator("dd").nth(1)).toHaveText("Loading…");
      await expect(finalQuiz.getByText("0/16", { exact: true })).toHaveCount(0);
      await expect(finalQuiz.getByText("Not passed", { exact: true })).toHaveCount(0);

      response = await page.goto("/en/claude-income/capstone-seven-day-demand-test/");
      expect(response?.status()).toBe(200);
      const lesson = page.getByTestId("claude-income-lesson-capstone-seven-day-demand-test");
      await expect(lesson.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(lesson.locator('section[aria-labelledby^="lesson-section-"]')).toHaveCount(
        CLAUDE_INCOME_COURSE.lessons[11].sections.length,
      );
      await expect(lesson.locator('section[aria-labelledby="prompt-template-title"] pre code')).not.toBeEmpty();
      await expect(lesson.locator('section[aria-labelledby="practice-title"]')).toBeVisible();
      await expect(lesson.locator('section[aria-labelledby="lesson-sources-title"] li')).toHaveCount(
        CLAUDE_INCOME_COURSE.lessons[11].sourceIds.length,
      );
      await expect(lesson.locator('[data-testid^="claude-income-figure-"] img')).toHaveCount(2);
      await expect(lesson.getByRole("heading", { name: "A 100-point evidence record" })).toBeVisible();
      const pendingNextAction = lesson.getByTestId("claude-income-final-next-action");
      await expect(pendingNextAction).toBeVisible();
      await expect(pendingNextAction).toContainText(
        "Next milestone uses your saved course record.",
      );
      expect(await pendingNextAction.locator("noscript").evaluate(
        (node) => node.textContent,
      )).toContain("JavaScript is needed to choose the saved-state action.");
      await expect(pendingNextAction.getByRole("link", { name: "Open Course 12 dashboard" }))
        .toHaveAttribute("href", "/en/claude-income/");
      await assertNoRemoteMedia(page);
    } finally {
      await context.close();
    }
  });
});
