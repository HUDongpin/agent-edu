import { expect, test } from "@playwright/test";
import axe from "axe-core";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  CURSOR_CAPSTONE_FIXTURE_SHA256,
  CURSOR_CAPSTONE_ARCHIVE_SHA256,
  CURSOR_CAPSTONE_ASSESSMENT_PROGRESS_KEY,
  CURSOR_CAPSTONE_RECEIPT_SCHEMA,
  CURSOR_CAPSTONE_REQUIRED_CHECKS,
  CURSOR_FINAL_QUIZ,
  CURSOR_CAPSTONE_PROGRESS_KEY,
  CURSOR_CAPSTONE_META_PROGRESS_KEY,
  CURSOR_CAPSTONE_PROGRESS_META,
  CURSOR_COURSE_MANIFEST,
  CURSOR_FIGURES,
  CURSOR_LESSON_PROGRESS_KEYS,
  CURSOR_LESSON_SLUGS,
  CURSOR_LOCALES,
  CURSOR_OPEN_GRAPH_LOCALES,
  CURSOR_PRACTICES,
  CURSOR_QUIZ,
  CURSOR_QUIZ_OPTION_IDS,
  CURSOR_PROGRESS_CACHE_CONTRACT,
  CURSOR_PROGRESS_STORAGE_KEY,
  CURSOR_PROGRESS_MILESTONES,
  cursorProgressCompletedMilestones,
  cursorProgressPercent,
  createCursorCapstoneProgressAssessment,
  isCursorCapstoneProgressPassed,
  validateCursorCopy,
  validateCursorOwnershipRelations,
  type CursorCourseCopy,
} from "../lib/cursor";

const dashboard = "/en/cursor/";
const englishCursorCopy = JSON.parse(
  readFileSync(new URL("../messages/cursor/en.json", import.meta.url), "utf8"),
) as CursorCourseCopy;
function quizCopyFingerprint(copy: CursorCourseCopy): string {
  const canonical = CURSOR_QUIZ.map((question) => ({
    id: question.id,
    question: copy.quiz[question.id].question,
    options: Object.fromEntries(CURSOR_QUIZ_OPTION_IDS.map((optionId) => (
      [optionId, copy.quiz[question.id].options[optionId]]
    ))),
    explanation: copy.quiz[question.id].explanation,
  }));
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}
const passingCapstoneAssessment = createCursorCapstoneProgressAssessment(
  Object.fromEntries(["task-contract", "orientation-note", "approved-plan", "reviewed-diff", "verification-record", "handoff"].map((id) => [id, true])),
  { scope: true, safety: true, implementation: false, verification: true, handoff: true },
);

test("publication state is backed by reviewed course-original figure rights", () => {
  expect(CURSOR_COURSE_MANIFEST.publicationStatus).toBe("published");
  expect(CURSOR_COURSE_MANIFEST.publishedOn).toBe("2026-08-26");
  expect(CURSOR_FIGURES).toHaveLength(14);
  expect(CURSOR_FIGURES.every((figure) => (
    figure.status === "available"
      && figure.kind === "course-original-diagram"
      && figure.rightsStatus === "original-authorship-reviewed"
      && figure.license === "MIT"
  ))).toBe(true);
});

test("course-original SVG bytes match the rights and provenance ledgers", () => {
  const rights = JSON.parse(readFileSync(
    new URL("../public/courses/cursor/figure-rights.json", import.meta.url),
    "utf8",
  )) as { assets: Array<{ id: string; path: string; sha256: string; rightsStatus: string }> };
  const provenance = JSON.parse(readFileSync(
    new URL("../public/courses/cursor/figure-provenance.json", import.meta.url),
    "utf8",
  )) as { assets: Array<{ id: string; path: string; sha256: string }> };

  expect(rights.assets).toHaveLength(14);
  expect(provenance.assets).toHaveLength(14);
  for (const figure of CURSOR_FIGURES) {
    const fileName = `${figure.id}-concept.svg`;
    const bytes = readFileSync(new URL(`../public/courses/cursor/${fileName}`, import.meta.url));
    const svg = bytes.toString("utf8");
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    expect(sha256).toBe(figure.sha256);
    expect(rights.assets.find((item) => item.id === figure.id)).toEqual({
      id: figure.id,
      path: fileName,
      sha256,
      rightsStatus: "original-authorship-reviewed",
    });
    expect(provenance.assets.find((item) => item.id === figure.id)).toMatchObject({
      id: figure.id,
      path: fileName,
      sha256,
    });
    expect(svg).toContain('data-origin="course-original"');
    expect(svg).not.toContain("COURSE ORIGINAL · ABSTRACT");
    expect(svg).not.toMatch(/<(?:image|script|foreignObject)\b|\b(?:xlink:)?href\s*=|\burl\s*\(/i);
  }
});

test("pure progress adapter requires all sixteen strict milestones", () => {
  const lessons = Object.fromEntries(CURSOR_LESSON_PROGRESS_KEYS.map((key) => [key, true]));
  const complete = {
    ...lessons,
    [CURSOR_FINAL_QUIZ.versionStorageKey]: CURSOR_FINAL_QUIZ.bankVersion,
    [CURSOR_FINAL_QUIZ.bestScoreStorageKey]: CURSOR_FINAL_QUIZ.passingCorrectAnswers,
    [CURSOR_FINAL_QUIZ.passedStorageKey]: true,
    [CURSOR_CAPSTONE_PROGRESS_KEY]: true,
    [CURSOR_CAPSTONE_META_PROGRESS_KEY]: CURSOR_CAPSTONE_PROGRESS_META,
    [CURSOR_CAPSTONE_ASSESSMENT_PROGRESS_KEY]: passingCapstoneAssessment,
  };

  expect(CURSOR_PROGRESS_MILESTONES).toBe(16);
  expect(cursorProgressCompletedMilestones(complete)).toBe(16);
  expect(cursorProgressPercent(complete)).toBe(100);
  expect(cursorProgressPercent(lessons)).toBe(88);
  expect(isCursorCapstoneProgressPassed({ [CURSOR_CAPSTONE_PROGRESS_KEY]: true })).toBe(false);
  expect(isCursorCapstoneProgressPassed({
    [CURSOR_CAPSTONE_PROGRESS_KEY]: true,
    [CURSOR_CAPSTONE_META_PROGRESS_KEY]: { ...CURSOR_CAPSTONE_PROGRESS_META, fixtureSha256: "stale" },
    [CURSOR_CAPSTONE_ASSESSMENT_PROGRESS_KEY]: passingCapstoneAssessment,
  })).toBe(false);
  expect(isCursorCapstoneProgressPassed({
    [CURSOR_CAPSTONE_PROGRESS_KEY]: true,
    [CURSOR_CAPSTONE_META_PROGRESS_KEY]: { ...CURSOR_CAPSTONE_PROGRESS_META, fixtureVersion: "stale" },
    [CURSOR_CAPSTONE_ASSESSMENT_PROGRESS_KEY]: passingCapstoneAssessment,
  })).toBe(false);
  expect(isCursorCapstoneProgressPassed({
    [CURSOR_CAPSTONE_PROGRESS_KEY]: true,
    [CURSOR_CAPSTONE_META_PROGRESS_KEY]: CURSOR_CAPSTONE_PROGRESS_META,
  })).toBe(false);
  expect(isCursorCapstoneProgressPassed({
    [CURSOR_CAPSTONE_PROGRESS_KEY]: true,
    [CURSOR_CAPSTONE_META_PROGRESS_KEY]: CURSOR_CAPSTONE_PROGRESS_META,
    [CURSOR_CAPSTONE_ASSESSMENT_PROGRESS_KEY]: { ...passingCapstoneAssessment, score: 100 },
  })).toBe(false);
  expect(cursorProgressPercent({ [CURSOR_FINAL_QUIZ.passedStorageKey]: true })).toBe(0);
  expect(cursorProgressPercent({
    [CURSOR_FINAL_QUIZ.versionStorageKey]: CURSOR_FINAL_QUIZ.bankVersion,
    [CURSOR_FINAL_QUIZ.bestScoreStorageKey]: CURSOR_FINAL_QUIZ.passingCorrectAnswers - 1,
    [CURSOR_FINAL_QUIZ.passedStorageKey]: true,
  })).toBe(0);
  expect(CURSOR_PROGRESS_CACHE_CONTRACT.globalReset).toEqual({
    callAfter: "resetAllCourseProgress",
    adapter: "resetCursorProgressAfterGlobalReset",
    awaitAdapter: true,
  });
  expect(CURSOR_PROGRESS_CACHE_CONTRACT.storageKey).toBe("aicourse.cursor.progress.v1");
  expect(CURSOR_PROGRESS_CACHE_CONTRACT.lockName).toBe("aicourse:cursor-progress");
  expect(CURSOR_PROGRESS_CACHE_CONTRACT.storageIsolation).toBe(
    "course-specific record; no cross-course writers",
  );
});

test("cross-manifest ownership validator rejects swapped quiz, figure, and practice relations", () => {
  const quiz = CURSOR_QUIZ.map((question) => (
    question.id === "q01" ? { ...question, unitId: "unit-2" as const } : question
  ));
  const figures = CURSOR_FIGURES.map((figure) => (
    figure.id === "fig-01" ? { ...figure, lessonSlug: "tab-inline-edit" as const } : figure
  ));
  const practices = CURSOR_PRACTICES.filter((practice) => practice.id !== "practice-orient-privacy");
  const issues = validateCursorOwnershipRelations({
    lessons: CURSOR_COURSE_MANIFEST.lessons,
    quiz,
    figures,
    practices,
  });

  expect(issues.some((issue) => issue.path === "quiz.q01.unitId")).toBe(true);
  expect(issues.some((issue) => issue.path === "figures.fig-01.lessonSlug")).toBe(true);
  expect(issues.some((issue) => issue.path === "lessons.orient-privacy.practiceId")).toBe(true);
});

test("quiz-copy validation requires stable option IDs but ignores object insertion order", () => {
  const reference = englishCursorCopy as unknown as CursorCourseCopy;
  const missing = structuredClone(englishCursorCopy);
  delete (missing.quiz.q01.options as Partial<Record<string, string>>).a;
  const missingIssues = validateCursorCopy("en", missing);
  expect(missingIssues.some((issue) => (
    issue.path === "$.quiz.q01.options" && issue.message.includes("Missing: a")
  ))).toBe(true);

  const extra = structuredClone(englishCursorCopy);
  (extra.quiz.q01.options as Record<string, string>).e = "unreviewed option";
  const extraIssues = validateCursorCopy("en", extra);
  expect(extraIssues.some((issue) => (
    issue.path === "$.quiz.q01.options" && issue.message.includes("Extra: e")
  ))).toBe(true);

  const reordered = structuredClone(englishCursorCopy);
  const q13 = reordered.quiz.q13.options;
  (reordered.quiz.q13 as { options: Record<string, string> }).options = {
    d: q13.d,
    c: q13.c,
    b: q13.b,
    a: q13.a,
  };
  expect(validateCursorCopy("de", reordered, reference)).toEqual([]);
  expect(CURSOR_QUIZ_OPTION_IDS).toEqual(["a", "b", "c", "d"]);

  const swapped = structuredClone(englishCursorCopy);
  const q01 = swapped.quiz.q01.options;
  (swapped.quiz.q01 as { options: Record<string, string> }).options = {
    ...q01,
    b: q01.c,
    c: q01.b,
  };
  expect(quizCopyFingerprint(reference)).toBe(
    "17f773e3d615394caaa829006919bc85cee2b9f29ecceeeb5a342068cd4f7ed4",
  );
  expect(quizCopyFingerprint(swapped)).not.toBe(quizCopyFingerprint(reference));
});

test.describe("Cursor Course 4", () => {
  test("dashboard exposes the complete 14-lesson curriculum", async ({ page }) => {
    await page.goto(dashboard);
    await expect(page).toHaveTitle(/How to Use Cursor/);
    await expect(page.getByRole("heading", { level: 1, name: "How to Use Cursor" })).toBeVisible();
    await expect(page.getByText("Course 4", { exact: true })).toBeVisible();
    await expect(page.locator('section[aria-labelledby="cursor-curriculum-title"] ol > li > a')).toHaveCount(14);
    await expect(page.getByText("About 13 hours 20 minutes, including a 90-minute capstone")).toBeVisible();
    await expect(page.getByTestId("cursor-final-quiz")).toBeVisible();
  });

  for (const slug of CURSOR_LESSON_SLUGS) {
    test(`English lesson ${slug} renders course-original local media and evidence`, async ({ page }) => {
      const response = await page.goto(`/en/cursor/${slug}/`);
      expect(response?.status()).toBe(200);
      await expect(page.locator("article > header h1")).toBeVisible();
      const figure = page.locator('[data-testid^="cursor-figure-"]');
      await expect(figure).toHaveCount(1);
      await expect(figure).toHaveAttribute("data-figure-status", "available");
      await expect(figure).toHaveAttribute("data-figure-kind", "course-original-diagram");
      await expect(figure).toHaveAttribute("data-asset-sha256", /^[a-f0-9]{64}$/);
      const image = figure.locator("img");
      await expect(image).toBeVisible();
      await expect(image).toHaveAttribute("src", /^\/courses\/cursor\/fig-\d{2}-concept\.svg$/);
      const imageAlt = await image.getAttribute("alt");
      expect(imageAlt).toBeTruthy();
      await expect(figure.locator("a").first()).toHaveAttribute(
        "aria-label",
        `${englishCursorCopy.ui.openFullSize}: ${imageAlt}`,
      );
      const imageEvidence = await image.evaluate((node: HTMLImageElement) => ({
        currentPath: new URL(node.currentSrc).pathname,
        declaredWidth: Number(node.getAttribute("width")),
        naturalWidth: node.naturalWidth,
      }));
      expect(imageEvidence.currentPath).toMatch(/^\/courses\/cursor\/fig-\d{2}-concept\.svg$/);
      expect(imageEvidence.declaredWidth).toBe(1600);
      expect(imageEvidence.naturalWidth).toBe(1600);
      await expect(figure.locator("figcaption")).toContainText("Course-original SVG");
      await expect(figure.locator('figcaption a[href="/courses/cursor/figure-provenance.json"]')).toHaveCount(1);
      await expect(page.locator('section[aria-labelledby="cursor-sources-title"] li').first()).toBeVisible();
      await expect(page.getByText("Practice", { exact: true })).toBeVisible();
      await expect(page.getByTestId("cursor-lesson-quiz").locator("fieldset")).toHaveCount(2);
    });
  }

  test("lesson knowledge check requires both answers and returns sourced feedback", async ({ page }) => {
    await page.goto("/en/cursor/orient-privacy/");
    const quiz = page.getByTestId("cursor-lesson-quiz");
    const submit = quiz.getByRole("button", { name: "Check answers" });
    await expect(quiz).toHaveAttribute("data-hydrated", "true");
    await expect(submit).toBeDisabled();
    await quiz.locator('fieldset[data-question-id="q01"] input[value="b"]').check();
    await quiz.locator('fieldset[data-question-id="q02"] input[value="c"]').check();
    await expect(submit).toBeEnabled();
    await submit.click();
    await expect(quiz.locator('[role="status"]')).toHaveCount(3);
    await expect(quiz.locator('a[target="_blank"]')).toHaveCount(3);
    await expect(quiz.locator('[data-answer-state="correct"]')).toHaveCount(2);
    await expect(quiz).toContainText("Score: 2/2");
    await expect(quiz.getByRole("button", { name: "Try again" })).toBeVisible();
  });

  test("every locale materialises and Arabic preserves RTL with LTR media", async ({ page }) => {
    for (const locale of CURSOR_LOCALES) {
      const response = await page.goto(`/${locale}/cursor/`);
      expect(response?.status(), locale).toBe(200);
      await expect(page.locator("h1")).toBeVisible();
    }
    await page.goto("/ar/cursor/research-studio/");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator('[data-testid="cursor-figure-fig-10"] a:has(img)')).toHaveAttribute("dir", "ltr");
    await expect(page.locator('[data-testid="cursor-figure-fig-10"] img')).toBeVisible();
    const freshness = page.getByTestId("cursor-freshness-fig-10");
    await expect(freshness).not.toHaveAttribute("dir", "ltr");
    await expect(freshness.locator('bdi[dir="ltr"]')).toHaveCount(2);

    await page.goto("/ar/cursor/orient-privacy/");
    const arabicQuiz = page.getByTestId("cursor-lesson-quiz");
    await expect(arabicQuiz).not.toHaveAttribute("dir", "ltr");
    await expect(arabicQuiz.locator('fieldset[data-question-id="q01"] label[data-option-id="b"]')).not.toHaveAttribute("dir", "ltr");
    await arabicQuiz.locator('fieldset[data-question-id="q01"] input[value="b"]').check();
    await arabicQuiz.locator('fieldset[data-question-id="q02"] input[value="c"]').check();
    await arabicQuiz.locator('button[type="submit"]').click();
    await expect(arabicQuiz.locator('[data-answer-state="correct"]')).toHaveCount(2);
  });

  test("metadata is canonical, reciprocal, and course-specific", async ({ page }) => {
    await page.goto("/fr/cursor/research-studio/");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://aicourse.top/fr/cursor/research-studio/",
    );
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
      "href",
      "https://aicourse.top/en/cursor/research-studio/",
    );
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
      "href",
      "https://aicourse.top/en/cursor/research-studio/",
    );
    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(jsonLd.join("\n")).toContain("LearningResource");
    expect(jsonLd.join("\n")).toContain("BreadcrumbList");
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
      "content",
      CURSOR_OPEN_GRAPH_LOCALES.fr,
    );
    await expect(page.locator('meta[property="og:locale:alternate"]')).toHaveCount(8);
  });

  test("Cursor progress persists while reset preserves other course data", async ({ page }) => {
    await page.goto("/en/cursor/orient-privacy/");
    await page.evaluate((cursorStorageKey) => {
      window.localStorage.removeItem(cursorStorageKey);
      window.localStorage.setItem("ae.progress", JSON.stringify({
        "codex.lesson.meet-codex": true,
        "handbook.done": true,
      }));
    }, CURSOR_PROGRESS_STORAGE_KEY);
    await page.reload();
    await page.getByRole("button", { name: "Mark complete" }).click();
    await expect(page.getByRole("button", { name: "Marked complete" })).toBeDisabled();
    let cursorStored = await page.evaluate((storageKey) => (
      JSON.parse(window.localStorage.getItem(storageKey) || "{}")
    ), CURSOR_PROGRESS_STORAGE_KEY);
    expect(cursorStored["cursor.lesson.orient-privacy"]).toBe(true);
    let sharedStored = await page.evaluate(() => JSON.parse(window.localStorage.getItem("ae.progress") || "{}"));
    expect(sharedStored["codex.lesson.meet-codex"]).toBe(true);

    await page.goto(dashboard);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Reset progress" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Course progress reset." })).toBeVisible();
    cursorStored = await page.evaluate((storageKey) => (
      JSON.parse(window.localStorage.getItem(storageKey) || "{}")
    ), CURSOR_PROGRESS_STORAGE_KEY);
    sharedStored = await page.evaluate(() => JSON.parse(window.localStorage.getItem("ae.progress") || "{}"));
    expect(cursorStored["cursor.lesson.orient-privacy"]).toBeUndefined();
    expect(sharedStored["codex.lesson.meet-codex"]).toBe(true);
    expect(sharedStored["handbook.done"]).toBe(true);
  });

  test("two Cursor tabs preserve concurrent milestones without touching shared progress", async ({ page }) => {
    const second = await page.context().newPage();
    await page.goto("/en/cursor/orient-privacy/");
    await page.evaluate((cursorStorageKey) => {
      window.localStorage.removeItem(cursorStorageKey);
      window.localStorage.setItem("ae.progress", JSON.stringify({
        "codex.lesson.meet-codex": true,
        "handbook.done": true,
      }));
    }, CURSOR_PROGRESS_STORAGE_KEY);
    await page.reload();
    await second.goto("/en/cursor/tab-inline-edit/");

    await Promise.all([
      page.getByRole("button", { name: "Mark complete" }).click(),
      second.getByRole("button", { name: "Mark complete" }).click(),
    ]);

    await expect.poll(async () => page.evaluate((storageKey) => (
      JSON.parse(window.localStorage.getItem(storageKey) || "{}")
    ), CURSOR_PROGRESS_STORAGE_KEY)).toMatchObject({
      "cursor.lesson.orient-privacy": true,
      "cursor.lesson.tab-inline-edit": true,
    });
    await expect.poll(async () => page.evaluate(() => (
      JSON.parse(window.localStorage.getItem("ae.progress") || "{}")
    ))).toEqual({
      "codex.lesson.meet-codex": true,
      "handbook.done": true,
    });
    await second.close();
  });

  test("completion summary requires every lesson, the final quiz, and the capstone", async ({ page }) => {
    await page.goto(dashboard);
    await expect(page.getByTestId("cursor-completion-summary")).toHaveCount(0);
    await page.evaluate(({ slugs, quiz, capstoneKey, storageKey }) => {
      const progress: Record<string, unknown> = Object.fromEntries(
        slugs.map((slug) => [`cursor.lesson.${slug}`, true]),
      );
      progress[quiz.bestScoreStorageKey] = quiz.passingCorrectAnswers;
      progress[quiz.passedStorageKey] = true;
      progress[quiz.versionStorageKey] = quiz.bankVersion;
      progress[capstoneKey] = true;
      window.localStorage.setItem(storageKey, JSON.stringify(progress));
    }, {
      slugs: CURSOR_LESSON_SLUGS,
      quiz: CURSOR_FINAL_QUIZ,
      capstoneKey: CURSOR_CAPSTONE_PROGRESS_KEY,
      storageKey: CURSOR_PROGRESS_STORAGE_KEY,
    });
    await page.reload();
    await expect(page.getByTestId("cursor-completion-summary")).toHaveCount(0);
    await page.evaluate(({ metaKey, meta, assessmentKey, assessment, storageKey }) => {
      const progress = JSON.parse(window.localStorage.getItem(storageKey) || "{}");
      progress[metaKey] = meta;
      progress[assessmentKey] = assessment;
      window.localStorage.setItem(storageKey, JSON.stringify(progress));
    }, {
      metaKey: CURSOR_CAPSTONE_META_PROGRESS_KEY,
      meta: CURSOR_CAPSTONE_PROGRESS_META,
      assessmentKey: CURSOR_CAPSTONE_ASSESSMENT_PROGRESS_KEY,
      assessment: passingCapstoneAssessment,
      storageKey: CURSOR_PROGRESS_STORAGE_KEY,
    });
    await page.reload();
    const summary = page.getByTestId("cursor-completion-summary");
    await expect(summary).toBeVisible();
    await expect(summary).toContainText("100%");
    await expect(summary.getByRole("button", { name: "Export summary" })).toBeVisible();
  });

  test("storage denial leaves course content and ephemeral completion usable", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(Storage.prototype, "getItem", { configurable: true, value: () => { throw new DOMException("denied"); } });
      Object.defineProperty(Storage.prototype, "setItem", { configurable: true, value: () => { throw new DOMException("denied"); } });
    });
    await page.goto("/en/cursor/orient-privacy/");
    await expect(page.getByRole("status").filter({ hasText: /Browser storage is unavailable/ })).toBeVisible();
    await page.getByRole("button", { name: "Mark complete" }).click();
    await expect(page.getByRole("button", { name: "Marked complete" })).toBeDisabled();
    await expect(page.locator("article > header h1")).toBeVisible();
  });

  test("a failed storage read never overwrites the unknown Cursor record", async ({ page }) => {
    await page.addInitScript((cursorStorageKey) => {
      const nativeSetItem = Storage.prototype.setItem;
      Object.defineProperty(window, "__cursorProgressWrites", {
        configurable: true,
        value: 0,
        writable: true,
      });
      Object.defineProperty(Storage.prototype, "getItem", {
        configurable: true,
        value: () => { throw new DOMException("read denied"); },
      });
      Object.defineProperty(Storage.prototype, "setItem", {
        configurable: true,
        value(this: Storage, key: string, value: string) {
          if (key === cursorStorageKey) {
            (window as typeof window & { __cursorProgressWrites: number }).__cursorProgressWrites += 1;
          }
          return nativeSetItem.call(this, key, value);
        },
      });
    }, CURSOR_PROGRESS_STORAGE_KEY);

    await page.goto("/en/cursor/orient-privacy/");
    await expect(page.getByText(/Browser storage is unavailable/)).toBeVisible();
    await page.getByRole("button", { name: "Mark complete" }).click();
    await expect(page.getByRole("button", { name: "Marked complete" })).toBeDisabled();
    const progressWrites = await page.evaluate(() => (
      (window as typeof window & { __cursorProgressWrites: number }).__cursorProgressWrites
    ));
    expect(progressWrites).toBe(0);
  });

  test("malformed Cursor progress is never replaced by an incomplete snapshot", async ({ page }) => {
    await page.addInitScript((cursorStorageKey) => {
      const originalGetItem = Storage.prototype.getItem;
      const originalSetItem = Storage.prototype.setItem;
      (window as typeof window & { __cursorProgressWrites: number }).__cursorProgressWrites = 0;
      Storage.prototype.getItem = function getItem(key: string) {
        if (key === cursorStorageKey) return "not-json";
        return originalGetItem.call(this, key);
      };
      Storage.prototype.setItem = function setItem(key: string, value: string) {
        if (key === cursorStorageKey) {
          (window as typeof window & { __cursorProgressWrites: number }).__cursorProgressWrites += 1;
        }
        return originalSetItem.call(this, key, value);
      };
    }, CURSOR_PROGRESS_STORAGE_KEY);

    await page.goto("/en/cursor/orient-privacy/");
    await expect(page.getByText(/Browser storage is unavailable/)).toBeVisible();
    await page.getByRole("button", { name: "Mark complete" }).click();
    await expect(page.getByRole("button", { name: "Marked complete" })).toBeDisabled();
    const progressWrites = await page.evaluate(() => (
      (window as typeof window & { __cursorProgressWrites: number }).__cursorProgressWrites
    ));
    expect(progressWrites).toBe(0);
  });

  test("each final-quiz attempt is stratified by unit", async ({ page }) => {
    await page.goto(dashboard);
    await page.evaluate(({ storageKey, quiz }) => {
      window.localStorage.setItem(storageKey, JSON.stringify({
        [quiz.versionStorageKey]: "1",
        [quiz.bestScoreStorageKey]: quiz.questionCount,
        [quiz.passedStorageKey]: true,
      }));
    }, { storageKey: CURSOR_PROGRESS_STORAGE_KEY, quiz: CURSOR_FINAL_QUIZ });
    await page.reload();
    await expect(page.getByText("Best score: 0 of 12", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Begin quiz" }).click();
    const unitCounts = new Map<string, number>();
    for (let index = 0; index < 12; index += 1) {
      const form = page.locator('[data-testid="cursor-final-quiz"] form[data-unit-id]');
      const unit = await form.getAttribute("data-unit-id");
      expect(unit).not.toBeNull();
      unitCounts.set(unit!, (unitCounts.get(unit!) ?? 0) + 1);
      await form.locator('input[type="radio"]').first().check();
      await form.getByRole("button", { name: "Check answer" }).click();
      if (index < 11) await form.getByRole("button", { name: "Next question" }).click();
      else await form.getByRole("button", { name: "Finish quiz" }).click();
    }
    expect([...unitCounts.values()].sort()).toEqual([3, 3, 3, 3]);
    await expect.poll(async () => page.evaluate(({ storageKey, versionStorageKey }) => {
      const progress = JSON.parse(window.localStorage.getItem(storageKey) || "{}");
      return progress[versionStorageKey];
    }, {
      storageKey: CURSOR_PROGRESS_STORAGE_KEY,
      versionStorageKey: CURSOR_FINAL_QUIZ.versionStorageKey,
    })).toBe(CURSOR_FINAL_QUIZ.bankVersion);
    const stored = await page.evaluate((storageKey) => (
      JSON.parse(window.localStorage.getItem(storageKey) || "{}")
    ), CURSOR_PROGRESS_STORAGE_KEY);
    expect(stored[CURSOR_FINAL_QUIZ.versionStorageKey]).toBe("2");
    expect(stored[CURSOR_FINAL_QUIZ.bestScoreStorageKey]).toBeLessThan(10);
    expect(stored[CURSOR_FINAL_QUIZ.passedStorageKey]).toBe(false);
  });

  test("final quiz grades all randomized questions by stable option ID", async ({ page }) => {
    await page.goto(dashboard);
    await page.getByRole("button", { name: "Begin quiz" }).click();
    const seen = new Set<string>();
    for (let index = 0; index < CURSOR_FINAL_QUIZ.questionCount; index += 1) {
      const form = page.locator('[data-testid="cursor-final-quiz"] form[data-question-id]');
      const questionId = await form.getAttribute("data-question-id");
      const question = CURSOR_QUIZ.find((item) => item.id === questionId);
      expect(question, questionId ?? "missing question ID").toBeDefined();
      seen.add(question!.id);
      await form.locator(`input[value="${question!.correctOptionId}"]`).check();
      await form.getByRole("button", { name: "Check answer" }).click();
      await expect(form.locator('[data-answer-state="correct"]')).toHaveCount(1);
      if (index < CURSOR_FINAL_QUIZ.questionCount - 1) {
        await form.getByRole("button", { name: "Next question" }).click();
      } else {
        await form.getByRole("button", { name: "Finish quiz" }).click();
      }
    }

    expect(seen.size).toBe(CURSOR_FINAL_QUIZ.questionCount);
    await expect(page.getByText("Score: 12 of 12", { exact: true })).toBeVisible();
    await expect(page.getByText("Knowledge check passed", { exact: true })).toBeVisible();
    const stored = await page.evaluate((storageKey) => (
      JSON.parse(window.localStorage.getItem(storageKey) || "{}")
    ), CURSOR_PROGRESS_STORAGE_KEY);
    expect(stored[CURSOR_FINAL_QUIZ.versionStorageKey]).toBe("2");
    expect(stored[CURSOR_FINAL_QUIZ.bestScoreStorageKey]).toBe(12);
    expect(stored[CURSOR_FINAL_QUIZ.passedStorageKey]).toBe(true);
  });

  test("capstone rejects malformed or mismatched receipts and accepts the canonical declaration", async ({ page }) => {
    await page.goto("/en/cursor/workflow-capstone/");
    await page.evaluate(({ capstoneKey, storageKey }) => {
      window.localStorage.setItem(storageKey, JSON.stringify({ [capstoneKey]: true }));
    }, { capstoneKey: CURSOR_CAPSTONE_PROGRESS_KEY, storageKey: CURSOR_PROGRESS_STORAGE_KEY });
    await page.reload();
    await expect(page.getByRole("status").filter({ hasText: /does not match this published capstone contract/ })).toBeVisible();
    await expect(page.getByTestId("cursor-capstone-receipt")).toHaveCount(0);
    await page.evaluate((storageKey) => window.localStorage.removeItem(storageKey), CURSOR_PROGRESS_STORAGE_KEY);
    await page.reload();
    await expect(page.getByRole("link", { name: "Download starter project" })).toHaveAttribute(
      "href",
      "/courses/cursor/aicourse-cursor-demo-v1.zip",
    );
    await expect(page.getByRole("link", { name: "Download checksum" })).toHaveAttribute(
      "href",
      "/courses/cursor/aicourse-cursor-demo-v1.sha256",
    );
    await expect(page.getByText(CURSOR_CAPSTONE_ARCHIVE_SHA256, { exact: true })).toBeVisible();
    await expect(page.getByText(CURSOR_CAPSTONE_FIXTURE_SHA256, { exact: true })).toBeVisible();
    const artifacts = page.getByTestId("cursor-capstone-artifacts");
    const rubric = page.getByTestId("cursor-capstone-rubric");
    await expect(page.getByText(/Learner self-assessment.*does not review.*attest completion/)).toBeVisible();
    await expect(artifacts.locator('input[type="checkbox"]')).toHaveCount(6);
    await expect(rubric.locator('input[type="checkbox"]')).toHaveCount(5);
    const input = page.getByTestId("cursor-capstone-receipt-input");
    await expect(input).toBeDisabled();
    for (const checkbox of await artifacts.locator('input[type="checkbox"]').all()) await checkbox.check();
    for (const index of [0, 1, 3, 4]) await rubric.locator('input[type="checkbox"]').nth(index).check();
    await expect(page.getByTestId("cursor-capstone-score")).toContainText("80");
    await expect(page.getByText(/Pass at 80 points or above/)).toBeVisible();
    await expect(input).toBeEnabled();
    await input.fill("not json");
    await page.getByRole("button", { name: "Check receipt format" }).click();
    await expect(page.getByText("This is not valid JSON.")).toBeVisible();

    const checks = Object.fromEntries(CURSOR_CAPSTONE_REQUIRED_CHECKS.map((check) => [check, true]));
    await input.fill(JSON.stringify({
      schema: CURSOR_CAPSTONE_RECEIPT_SCHEMA,
      fixtureVersion: "1",
      fixtureSha256: "0".repeat(64),
      checks,
    }));
    await page.getByRole("button", { name: "Check receipt format" }).click();
    await expect(page.getByText("The receipt's fixtureSha256 does not match the required course-fixture.json manifest.")).toBeVisible();

    await input.fill(JSON.stringify({
      schema: CURSOR_CAPSTONE_RECEIPT_SCHEMA,
      fixtureVersion: "1",
      fixtureSha256: CURSOR_CAPSTONE_FIXTURE_SHA256,
      checks,
    }));
    await page.getByRole("button", { name: "Check receipt format" }).click();
    await expect(page.getByTestId("cursor-capstone-receipt")).toBeVisible();
    await expect(page.locator("#cursor-receipt-title")).toBeFocused();
    await expect(page.getByTestId("cursor-capstone-receipt")).toHaveAttribute(
      "data-fixture-sha256",
      CURSOR_CAPSTONE_FIXTURE_SHA256,
    );
    await expect(page.getByTestId("cursor-capstone-receipt")).toHaveAttribute(
      "data-self-assessment-score",
      "80",
    );
    await expect(page.getByTestId("cursor-capstone-score")).toContainText("80");
    await expect(rubric.locator('input[type="checkbox"]').nth(2)).not.toBeChecked();
    const stored = await page.evaluate((storageKey) => (
      JSON.parse(window.localStorage.getItem(storageKey) || "{}")
    ), CURSOR_PROGRESS_STORAGE_KEY);
    expect(stored[CURSOR_CAPSTONE_ASSESSMENT_PROGRESS_KEY]).toEqual(passingCapstoneAssessment);
    expect(JSON.stringify(stored)).not.toContain('"checks":');

    await page.reload();
    await expect(page.getByTestId("cursor-capstone-score")).toContainText("80");
    await expect(page.getByTestId("cursor-capstone-rubric").locator('input[type="checkbox"]').nth(2)).not.toBeChecked();
  });

  test("figures remain available without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/en/cursor/plan-execute-steer/");
    await expect(page.getByTestId("cursor-figure-fig-05").locator("img")).toBeVisible();
    await expect(page.getByTestId("cursor-figure-fig-05").locator("figcaption")).toContainText("Course-original");
    await context.close();
  });

  test("dashboard, interacted lesson check, and capstone have no automated WCAG A or AA violations", async ({ page }) => {
    const paths = [dashboard, "/en/cursor/rules-skills-mcp/", "/en/cursor/workflow-capstone/"];
    for (const path of paths) {
      await page.goto(path);
      await page.locator("main").waitFor();
      await page.evaluate(async () => {
        await document.fonts.ready;
      });
      if (path.includes("rules-skills-mcp")) {
        const quiz = page.getByTestId("cursor-lesson-quiz");
        for (const question of await quiz.locator("fieldset").all()) {
          await question.locator('input[type="radio"]').first().check();
        }
        await quiz.getByRole("button", { name: "Check answers" }).click();
      }
      if (path.includes("workflow-capstone")) {
        for (const checkbox of await page.getByTestId("cursor-capstone-assessment").locator('input[type="checkbox"]').all()) {
          await checkbox.check();
        }
        await page.getByTestId("cursor-capstone-receipt-input").fill("not json");
        await page.getByRole("button", { name: "Check receipt format" }).click();
      }
      await page.addScriptTag({ content: axe.source });
      const violations = await page.evaluate(async () => {
        const axeApi = (window as unknown as {
          axe: {
            run: (
              root: Document,
              options: Readonly<Record<string, unknown>>,
            ) => Promise<{
              violations: readonly {
                id: string;
                impact: string | null;
                nodes: readonly {
                  target: readonly string[];
                  html: string;
                  failureSummary?: string;
                }[];
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
          nodes: violation.nodes.map((node) => ({
            target: node.target,
            html: node.html,
            failureSummary: node.failureSummary,
          })),
        }));
      });
      expect(violations, path).toEqual([]);
    }
  });

  for (const width of [390, 768, 1440]) {
    test(`dashboard and figure do not overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const paths = width === 390
        ? [...CURSOR_LOCALES.map((locale) => `/${locale}/cursor/`), "/ar/cursor/office-studio/"]
        : [dashboard, "/ar/cursor/office-studio/"];
      for (const path of paths) {
        await page.goto(path);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow).toBeLessThanOrEqual(1);
      }
    });
  }

  test("every localized figure caption fits a 390px viewport", async ({ page }) => {
    test.setTimeout(300_000);
    await page.setViewportSize({ width: 390, height: 900 });
    for (const locale of CURSOR_LOCALES) {
      for (const slug of CURSOR_LESSON_SLUGS) {
        await page.goto(`/${locale}/cursor/${slug}/`);
        const overflow = await page.evaluate(() => (
          document.documentElement.scrollWidth - document.documentElement.clientWidth
        ));
        expect(overflow, `${locale}/cursor/${slug}/`).toBeLessThanOrEqual(1);
      }
    }
  });

  test("mobile lesson navigation is compact and reveals the current course map on demand", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/cursor/workflow-capstone/");

    const navigation = page.getByTestId("cursor-mobile-lesson-nav");
    await expect(navigation).not.toHaveAttribute("open", "");
    await expect(navigation.locator("summary")).toContainText("14 / 14");

    await navigation.locator("summary").click();
    await expect(navigation).toHaveAttribute("open", "");
    await expect(navigation.getByRole("link", { name: /Capstone: demonstrate a complete Cursor workflow/ })).toBeVisible();
  });

  test("sitemap includes the dashboard and every Cursor lesson in each locale", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.ok()).toBeTruthy();
    const xml = await response.text();
    for (const locale of CURSOR_LOCALES) {
      expect(xml).toContain(`https://aicourse.top/${locale}/cursor/`);
      for (const slug of CURSOR_LESSON_SLUGS) {
        expect(xml).toContain(`https://aicourse.top/${locale}/cursor/${slug}/`);
      }
    }
  });
});
