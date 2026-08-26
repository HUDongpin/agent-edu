import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
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

const DASHBOARD = "/en/claude-income/";
const SITE = "https://aicourse.top";
const COURSE_PREFIX = "claude-income.";
const COURSE_ROOT = "[data-testid=\"claude-income-dashboard\"], [data-testid^=\"claude-income-lesson-\"]";

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
  await page.evaluate(() => window.localStorage.removeItem("ae.progress"));
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

async function runQuizAttempt(page: Page, missOneCritical: boolean) {
  const quiz = page.locator('section[aria-labelledby="claude-income-final-quiz-title"]');
  const startName = missOneCritical ? "Begin final quiz" : "Try another balanced attempt";
  const start = quiz.getByRole("button", { name: startName });
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
    await expect(feedback.getByText(shouldMiss ? "Not correct" : "Correct", { exact: true })).toBeVisible();
    await expect(feedback.locator('a[href^="https://"]')).toHaveCount(question.sourceIds.length);

    const nextName = index === CLAUDE_INCOME_FINAL_QUIZ.questionCount - 1
      ? "Finish and score"
      : "Next question";
    const next = feedback.getByRole("button", { name: nextName });
    await next.focus();
    await page.keyboard.press("Enter");
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
    let response = await page.goto("/en/claude-income/not-a-course-lesson/");
    expect(response?.status()).toBe(404);
    await expect(page.locator(COURSE_ROOT)).toHaveCount(0);

    response = await page.goto("/zz/claude-income/");
    expect(response?.status()).toBe(404);
    await expect(page.locator(COURSE_ROOT)).toHaveCount(0);
  });
});

test.describe("Course 12 language and search metadata boundaries", () => {
  test("only real English course routes publish while shell locales remain available in the catalogue", async ({ page }) => {
    test.setTimeout(90_000);
    expect(CLAUDE_INCOME_LOCALES).toHaveLength(9);
    let response = await page.goto(DASHBOARD);
    expect(response?.status()).toBe(200);
    const dashboard = page.getByTestId("claude-income-dashboard");
    await expect(dashboard).toHaveAttribute("lang", "en");
    await expect(dashboard).toHaveAttribute("dir", "ltr");
    await expect(dashboard.getByRole("heading", { level: 1 })).toHaveText(
      CLAUDE_INCOME_COURSE.title,
    );

    response = await page.goto("/en/claude-income/choose-a-money-path/");
    expect(response?.status()).toBe(200);
    const lesson = page.getByTestId("claude-income-lesson-choose-a-money-path");
    await expect(lesson).toHaveAttribute("lang", "en");
    await expect(lesson).toHaveAttribute("dir", "ltr");
    await expect(lesson.getByRole("heading", { level: 1 })).toHaveText(
      CLAUDE_INCOME_COURSE.lessons[0].title,
    );

    for (const locale of CLAUDE_INCOME_LOCALES.filter((candidate) => candidate !== "en")) {
      for (const suffix of ["", "choose-a-money-path/"]) {
        response = await page.goto(`/${locale}/claude-income/${suffix}`);
        expect(response?.status(), `${locale}/${suffix || "dashboard"}`).toBe(404);
        await expect(page.locator(COURSE_ROOT)).toHaveCount(0);
      }
    }

    await page.goto("/fr/courses/");
    await expect(page.locator('main a[href="/en/claude-income/?fromLocale=fr"]'))
      .toBeVisible();
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
    await expect(progress.getByText("1 of 12 lessons marked complete", { exact: true })).toBeVisible();
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
    await expect(page.getByText("2 of 12 lessons marked complete", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Reset Course 12 progress" }).click();
    await expect(page.getByRole("button", { name: "Confirm reset" })).toBeVisible();
    await page.getByRole("button", { name: "Confirm reset" }).click();
    await expect(progress.locator('[aria-live="polite"]')).toHaveText(
      "Course 12 progress was reset. Other course and site data was preserved.",
    );
    await expect(page.getByText("0 of 12 lessons marked complete", { exact: true })).toBeVisible();

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
      await expect(page.getByText("1 of 12 lessons marked complete", { exact: true })).toBeVisible();
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

    result = await runQuizAttempt(page, false);
    await expect(result.getByText("Assessment passed", { exact: true })).toBeVisible();
    await expect(result.getByRole("heading", { name: "16/16 correct" })).toBeVisible();
    await expect(result).toContainText("Critical boundary: clear.");
    stored = await page.evaluate(() => JSON.parse(
      window.localStorage.getItem("ae.progress") || "{}",
    ) as Record<string, unknown>);
    expect(stored[CLAUDE_INCOME_FINAL_QUIZ.bestScoreStorageKey]).toBe(16);
    expect(stored[CLAUDE_INCOME_FINAL_QUIZ.passedStorageKey]).toBe(true);
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

  test("dashboard and a figure-rich capstone have no horizontal overflow at 390, 768, or 1440 pixels", async ({ page }) => {
    test.setTimeout(90_000);
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of [DASHBOARD, "/en/claude-income/capstone-seven-day-demand-test/"]) {
        const response = await page.goto(route);
        expect(response?.status(), `${width}px ${route}`).toBe(200);
        await expect(page.locator(COURSE_ROOT)).toBeVisible();
        const measurements = await page.evaluate(() => ({
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
        for (const image of await page.locator(`${COURSE_ROOT} img`).all()) {
          const box = await image.boundingBox();
          if (box) expect(box.width, `${width}px image at ${route}`).toBeLessThanOrEqual(width);
        }
      }
    }
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
      const finalQuiz = dashboard.getByTestId("claude-income-final-quiz");
      await expect(finalQuiz).toHaveAttribute("data-client-ready", "false");
      await expect(finalQuiz).toHaveAttribute("aria-busy", "true");
      await expect(finalQuiz.getByRole("button", { name: "Begin final quiz" })).toBeDisabled();
      await expect(finalQuiz.locator("#claude-income-final-quiz-readiness")).toHaveText(
        "Preparing final quiz.",
      );

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
      await assertNoRemoteMedia(page);
    } finally {
      await context.close();
    }
  });
});
