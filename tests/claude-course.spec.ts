import { readFileSync } from "node:fs";
import { expect, test, type Browser, type Page } from "@playwright/test";
import axe from "axe-core";
import {
  CLAUDE_CAPSTONE_ARTIFACT_IDS,
  CLAUDE_CAPSTONE_CRITICAL_CLEAR_KEY,
  CLAUDE_CAPSTONE_PROGRESS_KEY,
  CLAUDE_CAPSTONE_RUBRIC,
  CLAUDE_CAPSTONE_SCHEMA_VERSION,
  CLAUDE_FINAL_QUIZ,
  CLAUDE_FIGURES,
  CLAUDE_LESSON_SLUGS,
  CLAUDE_LOCALES,
  CLAUDE_PROGRESS_MILESTONES,
  CLAUDE_QUIZ,
  CLAUDE_QUIZ_BANK_VERSION,
  claudeProgressPercent,
  isClaudeFigureAuthenticityReleaseReady,
  type ClaudeCourseCopy,
  type ClaudeFigureManifest,
  type ClaudeFigurePermissionRequired,
  validateClaudeCopy,
  validateClaudeFigureAuthenticity,
  validateClaudeFigureAuthenticityCurrentness,
  validateClaudeFigurePermissionCurrentness,
  validateClaudeFigureRights,
} from "../lib/claude";

const DASHBOARD = "/en/claude/";
const CORRECT_INDEX = new Map<string, number>(
  CLAUDE_QUIZ.map((question) => [question.id, question.correctIndex]),
);

async function clearProgress(page: Page) {
  await page.goto(DASHBOARD);
  await page.evaluate(() => {
    window.localStorage.removeItem("ae.progress");
    window.localStorage.removeItem("tch.seen");
  });
  await page.reload();
}

async function completeQuizAttempt(page: Page, correctAnswers: number) {
  const ids: string[] = [];
  const units: string[] = [];

  for (let index = 0; index < 16; index += 1) {
    const form = page.locator('form[data-question-id][data-unit-id]');
    await expect(form).toBeVisible();
    const id = await form.getAttribute("data-question-id");
    const unit = await form.getAttribute("data-unit-id");
    expect(id).toBeTruthy();
    expect(unit).toBeTruthy();
    ids.push(id!);
    units.push(unit!);

    const correct = CORRECT_INDEX.get(id!);
    expect(correct).toBeDefined();
    const selected = index < correctAnswers ? correct! : (correct! + 1) % 4;
    await form.locator('input[type="radio"]').nth(selected).check();
    await form.getByRole("button", { name: "Check answer" }).click();

    const feedback = form.locator('[role="status"]');
    await expect(feedback).toBeVisible();
    await expect(feedback).toBeFocused();
    await expect(form.locator('[data-answer-state="correct"]')).toHaveText("Correct");
    if (selected !== correct) {
      await expect(form.locator('[data-answer-state="incorrect"]')).toHaveText("Not yet");
    }
    await expect(feedback.locator('a[href^="https://"]').first()).toBeVisible();

    await form.getByRole("button", {
      name: index === 15 ? "Finish the check" : "Next question",
    }).click();
  }

  await expect(page.locator('[data-testid="claude-final-quiz"] [role="status"]')).toBeFocused();
  return { ids, units };
}

async function assertNoJavaScriptFigure(browser: Browser, path: string, figureId: string) {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const response = await page.goto(path);
  expect(response?.status()).toBe(200);
  const figure = page.getByTestId(`claude-figure-${figureId}`);
  await expect(figure).toHaveAttribute("data-figure-status", "available");
  await expect(figure.locator("img")).toBeVisible();
  await expect(figure.locator("figcaption")).toBeVisible();
  await context.close();
}

function firstPartyScreenshotFixture(): ClaudeFigurePermissionRequired {
  const licensed = CLAUDE_FIGURES.find((figure) => figure.id === "fig-06");
  if (!licensed || licensed.status !== "available" || licensed.assetKind !== "interface-screenshot") {
    throw new Error("Expected retained Figure 06 screenshot fixture.");
  }
  return {
    id: "fig-01",
    lessonSlug: "choose-your-surface",
    surface: "desktop",
    captureIntent: "Test the fail-closed first-party screenshot boundary.",
    altKey: "figures.fig-01.alt",
    captionKey: "figures.fig-01.caption",
    privacyChecklist: licensed.privacyChecklist,
    status: "available",
    assetKind: "interface-screenshot",
    src: licensed.src,
    srcSet: licensed.srcSet,
    width: licensed.width,
    height: licensed.height,
    observedOn: "2026-08-23",
    observedUi: "Synthetic validator fixture, not a published figure record",
    sha256: licensed.sha256,
    privacyReviewed: true,
    sourceUrl: "https://academy.claude.com/tutorials/navigating-the-claude-desktop-app",
    attribution: "Validator-only first-party screenshot fixture.",
    provenance: "first-party-tutorial",
    rightsStatus: "permission-required",
    authenticityReview: {
      status: "source-provenance-reviewed",
      reviewedOn: "2026-08-24",
      sourceAssetUrl: "https://academy.claude.com/assets/example.png",
      sourceSha256: licensed.sha256,
      sourceWidth: licensed.width,
      sourceHeight: licensed.height,
      transformation: "Validator-only exact-byte fixture.",
    },
  };
}

test.describe("Claude Course 3 routes, evidence, and metadata", () => {
  test("course-original diagrams close the Academy media debt without weakening the screenshot gate", () => {
    const originals = CLAUDE_FIGURES.filter(
      (figure) => figure.status === "available" && figure.assetKind === "original-diagram",
    );
    const licensed = CLAUDE_FIGURES.filter(
      (figure) => figure.status === "available" && figure.assetKind === "interface-screenshot",
    );
    expect(originals).toHaveLength(12);
    expect(licensed.map((figure) => figure.id)).toEqual(["fig-06", "fig-11", "fig-12"]);
    for (const figure of originals) {
      expect(figure).toMatchObject({
        provenance: "course-original",
        rightsStatus: "course-original",
        licence: "CC0-1.0",
        provenancePath: "/courses/claude/figure-provenance.v1.json",
      });
      expect(figure.src).toMatch(/-original\.svg$/);
      expect(validateClaudeFigureRights(figure)).toEqual([]);
      expect(validateClaudeFigureAuthenticity(figure)).toEqual([]);
      expect(isClaudeFigureAuthenticityReleaseReady(figure)).toBe(true);
    }

    const pending = firstPartyScreenshotFixture();
    expect(validateClaudeFigureRights(pending)).toEqual([]);
    expect(pending.rightsStatus).toBe("permission-required");
    const futureDated = {
      ...pending,
      authenticityReview: { ...pending.authenticityReview, reviewedOn: "9999-12-31" },
    } as ClaudeFigureManifest;
    expect(validateClaudeFigureAuthenticityCurrentness(futureDated, "2026-08-24")).toContain(
      "Authenticity review date cannot be in the future on the release calendar.",
    );
  });

  test("locale validator rejects technical-token and product-identity drift", async () => {
    const english = JSON.parse(readFileSync(
      new URL("../messages/claude/en.json", import.meta.url),
      "utf8",
    )) as ClaudeCourseCopy;
    const chinese = JSON.parse(readFileSync(
      new URL("../messages/claude/zh-Hans.json", import.meta.url),
      "utf8",
    )) as ClaudeCourseCopy;
    const mutated = {
      ...chinese,
      lessons: {
        ...chinese.lessons,
        "work-with-files": {
          ...chinese.lessons["work-with-files"],
          practice: {
            ...chinese.lessons["work-with-files"].practice,
            brief: chinese.lessons["work-with-files"].practice.brief.replace("DOCX", "文档"),
          },
        },
      },
      quiz: {
        ...chinese.quiz,
        q13: {
          ...chinese.quiz.q13,
          question: "何时适合使用艺术品？",
        },
        q15: {
          ...chinese.quiz.q15,
          explanation: chinese.quiz.q15.explanation.replace("Research", "研究"),
        },
      },
    } satisfies ClaudeCourseCopy;

    const issues = validateClaudeCopy("zh-Hans", mutated, english);
    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        path: "$.lessons.work-with-files.practice.brief",
        message: expect.stringContaining("Protected technical-token mismatch"),
      }),
      expect.objectContaining({
        path: "$.quiz.q13.question",
        message: expect.stringContaining("product name Artifact"),
      }),
      expect.objectContaining({
        path: "$.quiz.q15.explanation",
        message: expect.stringContaining("product name Research"),
      }),
    ]));
  });

  test("Figure 11 uses the pinned official Apache-2.0 Claude Code asset", () => {
    const figure = CLAUDE_FIGURES.find((candidate) => candidate.id === "fig-11");
    expect(figure).toMatchObject({
      status: "available",
      provenance: "licensed-community",
      rightsStatus: "repository-licence-reviewed",
      thirdPartyLicense: "Apache-2.0",
      sourceCommit: "340e33aef211d95769d252324854497af871dafe",
      sourceSha256: "a0b12357a8d8f9b1ba16692805344b8c4d03af2cc2eefcb70c68431b4350d1ad",
      sha256: "007a90d0a088c02b2878b2f57b5b44aab5a276aeb612a5fbf73d92c9577581d5",
    });
    expect(figure?.sourceUrl).toContain("anthropics/claude-plugins-official/blob/340e33aef");
    expect(figure && "modifications" in figure ? figure.modifications : "").toContain("no pixel changes");
  });

  test("written image permission requires a complete, reviewed evidence record", () => {
    const pendingFigure = firstPartyScreenshotFixture();

    const permissionClearance = {
      evidenceReference: "rights-register:claude-academy:2026-001",
      evidenceSha256: "a".repeat(64),
      grantor: "Anthropic PBC",
      grantedOn: "2026-08-22",
      scope: "Reviewed permission for the exact figure, nine-language public web display, responsive derivatives, attribution, territory, duration, and takedown terms.",
      expiresOn: null,
      reviewedBy: "Publication rights reviewer",
      reviewedOn: "2026-08-23",
    } as const;
    const clearedFigure = {
      ...pendingFigure,
      rightsStatus: "written-permission-reviewed",
      permissionClearance,
    } as unknown as ClaudeFigureManifest;
    expect(validateClaudeFigureRights(clearedFigure)).toEqual([]);

    const incompleteFigure = {
      ...clearedFigure,
      permissionClearance: { ...permissionClearance, scope: "" },
    } as unknown as ClaudeFigureManifest;
    expect(validateClaudeFigureRights(incompleteFigure)).toContain(
      "Written permission requires non-empty evidence reference, grantor, scope, reviewer, and review dates.",
    );

    const extraFieldFigure = {
      ...clearedFigure,
      permissionClearance: { ...permissionClearance, publicEvidenceUrl: "https://example.com/private-letter" },
    } as unknown as ClaudeFigureManifest;
    expect(validateClaudeFigureRights(extraFieldFigure)).toContain(
      "Written-permission evidence must use the exact clearance-record fields.",
    );

    const rolloverDateFigure = {
      ...clearedFigure,
      permissionClearance: { ...permissionClearance, grantedOn: "2026-02-31" },
    } as unknown as ClaudeFigureManifest;
    expect(validateClaudeFigureRights(rolloverDateFigure)).toContain(
      "Permission grant, review, and optional expiry dates must be exact YYYY-MM-DD calendar dates.",
    );

    const reviewedAfterExpiryFigure = {
      ...clearedFigure,
      permissionClearance: { ...permissionClearance, expiresOn: "2026-08-22", reviewedOn: "2026-08-23" },
    } as unknown as ClaudeFigureManifest;
    expect(validateClaudeFigureRights(reviewedAfterExpiryFigure)).toContain(
      "Permission cannot be reviewed after it expires.",
    );

    const futureReviewFigure = {
      ...clearedFigure,
      permissionClearance: { ...permissionClearance, reviewedOn: "2026-08-24" },
    } as unknown as ClaudeFigureManifest;
    expect(validateClaudeFigurePermissionCurrentness(futureReviewFigure, "2026-08-23")).toContain(
      "Permission grant and review dates cannot be in the future on the release calendar.",
    );
    const expiredFigure = {
      ...clearedFigure,
      permissionClearance: { ...permissionClearance, reviewedOn: "2026-08-22", expiresOn: "2026-08-22" },
    } as unknown as ClaudeFigureManifest;
    expect(validateClaudeFigurePermissionCurrentness(expiredFigure, "2026-08-23")).toContain(
      "Written permission is expired on the release calendar.",
    );
  });

  test("dashboard exposes the complete 15-lesson curriculum", async ({ page }) => {
    const response = await page.goto(DASHBOARD);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/How to Use Claude/);
    await expect(page.getByRole("heading", { level: 1, name: "How to Use Claude" })).toBeVisible();
    await expect(page.getByText(/Course 3/).first()).toBeVisible();
    await expect(page.locator('section[aria-labelledby="claude-curriculum-title"] a[href^="/en/claude/"]')).toHaveCount(15);
    await expect(page.getByText(/120-minute portfolio capstone/)).toBeVisible();
    await expect(page.getByTestId("claude-final-quiz")).toBeVisible();
  });

  test("shared catalogue, homepage, footer, and Course structured data expose Course 3", async ({ page }) => {
    await page.goto("/en/courses/");
    const card = page.locator("#how-to-use-claude");
    await expect(card).toContainText("Course 3");
    await expect(card.getByRole("heading", { name: "How to Use Claude" })).toBeVisible();
    await expect(card).toContainText("15 lessons, about 14.5 hours");
    await expect(card.locator('a[href="/en/claude/"]')).toBeVisible();
    await expect(page.locator('footer a[href="/en/claude/"]')).toHaveText("How to Use Claude");

    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    const itemList = jsonLd
      .map((value) => JSON.parse(value) as Record<string, unknown>)
      .find((value) => value["@type"] === "ItemList") as {
        itemListElement: Array<{
          position: number;
          item: { name: string; inLanguage: string; hasPart: Array<Record<string, unknown>> };
        }>;
      };
    const courseThree = itemList.itemListElement.find((entry) => entry.position === 3);
    expect(courseThree?.item.name).toBe("How to Use Claude");
    expect(courseThree?.item.inLanguage).toBe("en");
    expect(courseThree?.item.hasPart).toHaveLength(15);
    expect(courseThree?.item.hasPart.map((part) => part.position)).toEqual(
      Array.from({ length: 15 }, (_, index) => index + 1),
    );

    await page.goto("/en/");
    const featured = page.locator(".featured-course-card.claude");
    await expect(featured.getByRole("heading", { name: "How to Use Claude" })).toBeVisible();
    await expect(featured.locator('a[href="/en/claude/"]')).toHaveText(/Start learning Claude/);
  });

  test("shared catalogue refreshes Claude progress on the same-tab event", async ({ page }) => {
    await page.goto("/en/courses/");
    await page.evaluate(() => {
      window.localStorage.setItem("ae.progress", JSON.stringify({
        "claude.lesson.choose-your-surface": true,
      }));
      window.dispatchEvent(new Event("claude:progress-change"));
    });
    await expect(page.locator("#how-to-use-claude [role=progressbar]")).toHaveAttribute(
      "aria-valuenow",
      "6",
    );
  });

  for (const [index, slug] of CLAUDE_LESSON_SLUGS.entries()) {
    test(`English lesson ${slug} renders a local, rights-labelled, traceable figure`, async ({ page }) => {
      const response = await page.goto(`/en/claude/${slug}/`);
      expect(response?.status()).toBe(200);
      await expect(page.getByTestId(`claude-lesson-${slug}`)).toBeVisible();
      await expect(page.getByRole("heading", { name: "Discernment checkpoint" })).toBeVisible();
      await expect(page.locator('section[aria-labelledby="claude-practice-title"] ol > li')).toHaveCount(3);

      const figureId = `fig-${String(index + 1).padStart(2, "0")}`;
      const figureManifest = CLAUDE_FIGURES[index];
      const figure = page.getByTestId(`claude-figure-${figureId}`);
      await expect(figure).toHaveCount(1);
      await expect(figure).toHaveAttribute("data-figure-status", "available");
      await expect(figure).toHaveAttribute("data-capture-sha256", /^[a-f0-9]{64}$/);
      await expect(figure).toHaveAttribute(
        "data-rights-status",
        /^(course-original|permission-required|written-permission-reviewed|repository-licence-reviewed)$/,
      );
      await expect(figure).toHaveAttribute("data-figure-kind", figureManifest.assetKind);
      const image = figure.locator("img");
      await expect(image).toBeVisible();
      expect(await image.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBeGreaterThanOrEqual(562);
      if (figureManifest.assetKind === "original-diagram") {
        await expect(image).toHaveAttribute("src", /^\/courses\/claude\/figures\/[^?]+-original\.svg$/);
        await expect(figure.locator('source[type="image/webp"]')).toHaveCount(0);
        await expect(figure.locator('figcaption a[href="/courses/claude/figure-provenance.v1.json"]')).toHaveCount(1);
      } else {
        await expect(image).toHaveAttribute("src", /^\/courses\/claude\/figures\/[^?]+\.png$/);
        await expect(figure.locator('source[type="image/webp"]')).toHaveAttribute(
          "srcset",
          /^\/courses\/claude\/figures\/[^,]+\.webp \d+w, \/courses\/claude\/figures\/[^,]+\.webp \d+w$/,
        );
        await expect(figure.locator('figcaption a[href^="https://"]')).toHaveCount(1);
      }
      await expect(figure.locator("figcaption time")).toHaveAttribute("datetime", /^2026-/);
      await expect(figure.locator("figcaption small > span")).toHaveCount(2);
      await expect(figure.locator("figcaption small > span").nth(1)).not.toHaveText("");
      await expect(page.locator('section[aria-labelledby="claude-sources-title"] li').first()).toBeVisible();
      await expect(page.locator('img[src^="http"], source[srcset^="http"]')).toHaveCount(0);
    });
  }

  test("uses current Help Centre authority for Artifact publishing and Cowork execution modes", async ({ page }) => {
    await page.goto("/en/claude/create-artifacts/");
    await expect(page.locator(
      'section[aria-labelledby="claude-sources-title"] a[href="https://support.claude.com/en/articles/9487310-what-are-artifacts-and-how-do-i-use-them"]',
    )).toBeVisible();
    await expect(page.locator(
      'a[href="https://support.claude.com/en/articles/9547008-publish-and-share-artifacts"]',
    )).toBeVisible();

    await page.goto("/en/claude/delegate-with-cowork/");
    await expect(page.getByText(/Cloud Cowork sessions run in an isolated temporary sandbox/)).toBeVisible();
    await expect(page.locator(
      'section[aria-labelledby="claude-sources-title"] a[href="https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork"]',
    )).toBeVisible();
    await expect(page.locator(
      'section[aria-labelledby="claude-sources-title"] a[href="https://support.claude.com/en/articles/14479288-claude-cowork-architecture-overview"]',
    )).toBeVisible();
  });

  test("labels Figure 08 as an original locator-to-source audit diagram", async ({ page }) => {
    await page.goto("/en/claude/research-with-citations/");
    await expect(page.getByTestId("claude-figure-fig-08").locator("figcaption")).toContainText(
      "Course-original diagram; not a Claude screenshot. Retrieved text is a locator, not proof",
    );
  });

  test("all nine locales materialise and Arabic keeps technical media LTR", async ({ page }) => {
    for (const locale of CLAUDE_LOCALES) {
      const response = await page.goto(`/${locale}/claude/`);
      expect(response?.status(), locale).toBe(200);
      await expect(page.getByTestId("claude-course-dashboard")).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
    }

    await page.goto("/ar/claude/research-and-data/");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByTestId("claude-figure-fig-12").locator("a").first()).toHaveAttribute("dir", "ltr");
  });

  test("canonical, reciprocal hreflang, Course, lesson, and breadcrumb data are emitted", async ({ page }) => {
    await page.goto(DASHBOARD);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://aicourse.top/en/claude/",
    );
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(10);
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "en_US");
    await expect(page.locator('meta[property="og:locale:alternate"]')).toHaveCount(8);
    await expect(page.locator('meta[property="og:locale:alternate"][content="zh_CN"]')).toHaveCount(1);
    let jsonLd = (await page.locator('script[type="application/ld+json"]').allTextContents()).join("\n");
    expect(jsonLd).toContain('"@type":"Course"');
    expect(jsonLd).toContain('"@type":"BreadcrumbList"');
    expect(jsonLd).toContain('"hasPart"');
    expect(jsonLd).toContain('"courseWorkload":"PT870M"');

    await page.goto("/fr/claude/research-with-citations/");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://aicourse.top/fr/claude/research-with-citations/",
    );
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
      "href",
      "https://aicourse.top/en/claude/research-with-citations/",
    );
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "fr_FR");
    jsonLd = (await page.locator('script[type="application/ld+json"]').allTextContents()).join("\n");
    expect(jsonLd).toContain('"@type":"LearningResource"');
    expect(jsonLd).toContain('"@type":"BreadcrumbList"');
  });

  test("language switching preserves the lesson slug", async ({ page }) => {
    await page.goto("/en/claude/software-engineering/");
    await page.getByRole("button", { name: /Language:/ }).click();
    await page.getByRole("menuitem", { name: /العربية/ }).click();
    await expect(page).toHaveURL(/\/ar\/claude\/software-engineering\/$/);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByTestId("claude-lesson-software-engineering")).toBeVisible();
  });
});

test.describe.serial("Claude progress and private browser storage", () => {
  test("catalogue adapter counts fifteen lessons, strict quiz, and strict capstone as seventeen milestones", () => {
    const complete: Record<string, unknown> = Object.fromEntries(
      CLAUDE_LESSON_SLUGS.map((slug) => [`claude.lesson.${slug}`, true]),
    );
    complete[CLAUDE_FINAL_QUIZ.bestScoreStorageKey] = 16;
    complete[CLAUDE_FINAL_QUIZ.passedStorageKey] = true;
    complete[CLAUDE_FINAL_QUIZ.versionStorageKey] = CLAUDE_QUIZ_BANK_VERSION;
    for (const id of CLAUDE_CAPSTONE_ARTIFACT_IDS) {
      complete[`claude.capstone.artifact.${id}`] = true;
    }
    for (const criterion of CLAUDE_CAPSTONE_RUBRIC) {
      complete[`claude.capstone.rubric.${criterion.id}`] = criterion.weight;
    }
    complete[CLAUDE_CAPSTONE_CRITICAL_CLEAR_KEY] = true;
    complete[CLAUDE_CAPSTONE_PROGRESS_KEY] = true;

    expect(CLAUDE_PROGRESS_MILESTONES).toBe(17);
    expect(claudeProgressPercent(complete)).toBe(100);
    expect(claudeProgressPercent({ "claude.lesson.choose-your-surface": true })).toBe(6);
    expect(claudeProgressPercent({ [CLAUDE_CAPSTONE_PROGRESS_KEY]: true })).toBe(0);
    expect(claudeProgressPercent([])).toBe(0);
  });

  test("does not credit a legacy bare capstone flag without the full self-audit", async ({ page }) => {
    await clearProgress(page);
    await expect(page.getByText(
      "This course stores only Claude-course progress in this browser: 15 lesson completion flags; the quiz best score, pass flag, and bank version; six capstone artifact checks; four rubric self-scores; the critical-risk review attestation; and the final capstone completion flag. It never stores prompts, selected quiz answers, or files.",
    )).toBeVisible();
    await page.evaluate(() => {
      window.localStorage.setItem("ae.progress", JSON.stringify({
        "claude.capstone.v1": true,
      }));
    });
    await page.reload();

    await expect(page.locator('[data-testid="claude-course-progress"] progress')).toHaveAttribute("value", "0");
  });

  test("software-engineering practice keeps a complete free path", async ({ page }) => {
    await page.goto("/en/claude/software-engineering/");
    await expect(page.getByText(/Claude Code is a paid or organisation-entitled extension/)).toBeVisible();
    await expect(page.getByText(/Chat plus your own local tools on the free path/)).toBeVisible();
    await expect(page.getByText(/apply Chat's proposal locally yourself and inspect the complete diff/)).toBeVisible();
    await expect(page.locator(
      'section[aria-labelledby="claude-sources-title"] a[href="https://claude.com/pricing"]',
    )).toBeVisible();
  });

  test("completion persists and Claude-only reset preserves unrelated progress", async ({ page }) => {
    await clearProgress(page);
    await page.evaluate(() => {
      window.localStorage.setItem("ae.progress", JSON.stringify({
        "codex.lesson.meet-codex": true,
        "handbook.done": true,
      }));
    });
    await page.goto("/en/claude/choose-your-surface/");
    await page.getByRole("button", { name: "Mark complete" }).click();
    await expect(page.getByRole("button", { name: "Marked complete" })).toHaveAttribute("aria-disabled", "true");
    await expect(page.getByRole("button", { name: "Marked complete" })).toBeFocused();
    await page.reload();
    await expect(page.getByRole("button", { name: "Marked complete" })).toHaveAttribute("aria-disabled", "true");

    await page.goto(DASHBOARD);
    await expect(page.locator('[data-testid="claude-course-progress"] progress')).toHaveAttribute("value", "1");
    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toBe("Reset all locally saved Claude-course progress?");
      await dialog.accept();
    });
    await page.getByRole("button", { name: "Reset progress" }).click();
    await expect(page.getByText("Claude-course progress reset.")).toBeFocused();

    const stored = await page.evaluate(() => JSON.parse(window.localStorage.getItem("ae.progress") || "{}"));
    expect(stored["claude.lesson.choose-your-surface"]).toBeUndefined();
    expect(stored["codex.lesson.meet-codex"]).toBe(true);
    expect(stored["handbook.done"]).toBe(true);
  });

  test("storage denial leaves content and ephemeral completion usable", async ({ browser }) => {
    const context = await browser.newContext();
    await context.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        get() {
          throw new DOMException("Storage denied", "SecurityError");
        },
      });
    });
    const page = await context.newPage();
    await page.goto(DASHBOARD);
    await expect(
      page.getByTestId("claude-course-progress").getByText(/Browser storage is unavailable/),
    ).toHaveAttribute("role", "status");
    await page.goto("/en/claude/choose-your-surface/");
    await expect(page.getByText(/Browser storage is unavailable/)).toBeVisible();
    await page.getByRole("button", { name: "Mark complete" }).click();
    await expect(page.getByRole("button", { name: "Marked complete" })).toHaveAttribute("aria-disabled", "true");
    await expect(page.getByTestId("claude-lesson-choose-your-surface")).toBeVisible();
    await context.close();
  });

  test("a denied shared read cannot overwrite another course's stored progress", async ({ browser }) => {
    const context = await browser.newContext();
    await context.addInitScript(() => {
      try {
        const storage = window.localStorage;
        const originalGetItem = Storage.prototype.getItem;
        const originalSetItem = Storage.prototype.setItem;
        originalSetItem.call(storage, "ae.progress", JSON.stringify({
          "codex.lesson.meet-codex": true,
        }));
        let aeWriteAttempts = 0;
        Storage.prototype.getItem = function getItem(key: string) {
          if (key === "ae.progress") {
            throw new DOMException("Shared read denied", "SecurityError");
          }
          return originalGetItem.call(this, key);
        };
        Storage.prototype.setItem = function setItem(key: string, value: string) {
          if (key === "ae.progress") aeWriteAttempts += 1;
          return originalSetItem.call(this, key, value);
        };
        (window as unknown as {
          __claudeStorageProbe: { writes: () => number; readRaw: () => string | null };
        }).__claudeStorageProbe = {
          writes: () => aeWriteAttempts,
          readRaw: () => originalGetItem.call(storage, "ae.progress"),
        };
      } catch {
        // The script also runs in opaque initial documents; the same-origin
        // course navigation below installs the probe before application code.
      }
    });

    const page = await context.newPage();
    await page.goto("/en/claude/choose-your-surface/");
    await page.getByRole("button", { name: "Mark complete" }).click();
    await expect(page.getByRole("button", { name: "Marked complete" })).toBeVisible();
    const probe = await page.evaluate(() => {
      const value = (window as unknown as {
        __claudeStorageProbe: { writes: () => number; readRaw: () => string | null };
      }).__claudeStorageProbe;
      return { writes: value.writes(), raw: value.readRaw() };
    });
    expect(probe.writes).toBe(0);
    expect(JSON.parse(probe.raw || "{}")).toEqual({ "codex.lesson.meet-codex": true });
    await context.close();
  });

  test("malformed shared progress is quarantined instead of overwritten", async ({ browser }) => {
    const context = await browser.newContext();
    await context.addInitScript(() => {
      try {
        const storage = window.localStorage;
        const originalGetItem = Storage.prototype.getItem;
        const originalSetItem = Storage.prototype.setItem;
        originalSetItem.call(storage, "ae.progress", "{not-valid-json");
        let aeWriteAttempts = 0;
        Storage.prototype.setItem = function setItem(key: string, value: string) {
          if (key === "ae.progress") aeWriteAttempts += 1;
          return originalSetItem.call(this, key, value);
        };
        (window as unknown as {
          __claudeMalformedProbe: { writes: () => number; readRaw: () => string | null };
        }).__claudeMalformedProbe = {
          writes: () => aeWriteAttempts,
          readRaw: () => originalGetItem.call(storage, "ae.progress"),
        };
      } catch {
        // See the denied-read probe above: opaque initial documents are safe
        // to ignore because the course-origin document runs this script too.
      }
    });

    const page = await context.newPage();
    await page.goto("/en/claude/choose-your-surface/");
    await page.getByRole("button", { name: "Mark complete" }).click();
    const probe = await page.evaluate(() => {
      const value = (window as unknown as {
        __claudeMalformedProbe: { writes: () => number; readRaw: () => string | null };
      }).__claudeMalformedProbe;
      return { writes: value.writes(), raw: value.readRaw() };
    });
    expect(probe).toEqual({ writes: 0, raw: "{not-valid-json" });
    await context.close();
  });
});

test.describe.serial("Claude final knowledge check", () => {
  test("draws four unique questions per unit and passes at exactly 13 of 16", async ({ page }) => {
    await clearProgress(page);
    await page.getByRole("button", { name: "Begin 16-question check" }).click();
    const attempt = await completeQuizAttempt(page, 13);

    expect(new Set(attempt.ids).size).toBe(16);
    const unitCounts = Object.fromEntries(
      ["unit-1", "unit-2", "unit-3", "unit-4"].map((unit) => [
        unit,
        attempt.units.filter((candidate) => candidate === unit).length,
      ]),
    );
    expect(unitCounts).toEqual({ "unit-1": 4, "unit-2": 4, "unit-3": 4, "unit-4": 4 });
    await expect(page.getByText("Knowledge check passed")).toBeVisible();
    await expect(page.getByText("Score: 13 of 16", { exact: true })).toBeVisible();

    const stored = await page.evaluate(() => JSON.parse(window.localStorage.getItem("ae.progress") || "{}"));
    expect(stored["claude.quizBest"]).toBe(13);
    expect(stored["claude.quizPassed"]).toBe(true);
    expect(stored["claude.quizBankVersion"]).toBe("1");
  });

  test("fails at 12 of 16 and retains a previous best passing score", async ({ page }) => {
    await clearProgress(page);
    await page.evaluate(() => {
      window.localStorage.setItem("ae.progress", JSON.stringify({
        "claude.quizBest": 16,
        "claude.quizPassed": true,
        "claude.quizBankVersion": "1",
      }));
    });
    await page.reload();
    await page.getByRole("button", { name: "Begin 16-question check" }).click();
    await completeQuizAttempt(page, 12);
    await expect(page.getByText("Review the evidence links and try again")).toBeVisible();

    const stored = await page.evaluate(() => JSON.parse(window.localStorage.getItem("ae.progress") || "{}"));
    expect(stored["claude.quizBest"]).toBe(16);
    expect(stored["claude.quizPassed"]).toBe(true);
  });
});

test.describe.serial("portfolio capstone", () => {
  test("invalidates a stale completion flag when the final artifact is added", async ({ page }) => {
    await clearProgress(page);
    await page.evaluate(({ artifactIds, rubric }) => {
      const progress: Record<string, unknown> = {
        "claude.capstone.v1": true,
        "claude.capstone.criticalClear": true,
      };
      for (const id of artifactIds.slice(0, -1)) {
        progress[`claude.capstone.artifact.${id}`] = true;
      }
      for (const criterion of rubric) {
        progress[`claude.capstone.rubric.${criterion.id}`] = criterion.weight;
      }
      window.localStorage.setItem("ae.progress", JSON.stringify(progress));
    }, {
      artifactIds: CLAUDE_CAPSTONE_ARTIFACT_IDS,
      rubric: CLAUDE_CAPSTONE_RUBRIC,
    });
    await page.goto("/en/claude/portfolio-capstone/");

    const capstone = page.getByTestId("claude-capstone");
    await expect(page.getByTestId("claude-capstone-record")).toHaveCount(0);
    await capstone.locator('ul input[type="checkbox"]').last().check();
    const recordCompletion = capstone.getByRole("button", { name: "Record capstone completion" });
    await expect(recordCompletion).toBeEnabled();
    await expect(page.getByTestId("claude-capstone-record")).toHaveCount(0);
    expect(await page.evaluate(() => (
      JSON.parse(window.localStorage.getItem("ae.progress") || "{}")["claude.capstone.v1"]
    ))).toBeUndefined();

    await recordCompletion.click();
    await expect(page.getByTestId("claude-capstone-record")).toBeVisible();
  });

  test("invalidates a stale completion flag when critical-risk review is added", async ({ page }) => {
    await clearProgress(page);
    await page.evaluate(({ artifactIds, rubric }) => {
      const progress: Record<string, unknown> = {
        "claude.capstone.v1": true,
        "claude.capstone.criticalClear": false,
      };
      for (const id of artifactIds) {
        progress[`claude.capstone.artifact.${id}`] = true;
      }
      for (const criterion of rubric) {
        progress[`claude.capstone.rubric.${criterion.id}`] = criterion.weight;
      }
      window.localStorage.setItem("ae.progress", JSON.stringify(progress));
    }, {
      artifactIds: CLAUDE_CAPSTONE_ARTIFACT_IDS,
      rubric: CLAUDE_CAPSTONE_RUBRIC,
    });
    await page.goto("/en/claude/portfolio-capstone/");

    const capstone = page.getByTestId("claude-capstone");
    await capstone.getByTestId("claude-capstone-critical-attestation").check();
    await expect(capstone.getByRole("button", { name: "Record capstone completion" })).toBeEnabled();
    await expect(page.getByTestId("claude-capstone-record")).toHaveCount(0);
    expect(await page.evaluate(() => (
      JSON.parse(window.localStorage.getItem("ae.progress") || "{}")["claude.capstone.v1"]
    ))).toBeUndefined();
  });

  test("requires six artifacts, an 80-point 4D score, and a critical-risk attestation", async ({ page }) => {
    await clearProgress(page);
    await page.goto("/en/claude/portfolio-capstone/");
    const capstone = page.getByTestId("claude-capstone");
    await expect(capstone.getByRole("link", { name: "Download the capstone brief" })).toHaveAttribute(
      "href",
      "/courses/claude/claude-capstone-brief.md",
    );
    const checks = capstone.locator('ul input[type="checkbox"]');
    await expect(checks).toHaveCount(6);
    const rubricScores = capstone.locator('input[type="number"]');
    await expect(rubricScores).toHaveCount(4);
    const criticalAttestation = capstone.getByTestId("claude-capstone-critical-attestation");
    const submit = capstone.getByRole("button", { name: /Required evidence/ });
    await expect(submit).toBeDisabled();

    for (let index = 0; index < 6; index += 1) await checks.nth(index).check();
    await rubricScores.nth(0).fill("25");
    await rubricScores.nth(1).fill("25");
    await rubricScores.nth(2).fill("29");
    await rubricScores.nth(3).fill("0");
    await criticalAttestation.check();
    await expect(submit).toBeDisabled();

    await rubricScores.nth(3).fill("1");
    const ready = capstone.getByRole("button", { name: "Record capstone completion" });
    await expect(ready).toBeEnabled();
    await ready.click();

    const record = page.getByTestId("claude-capstone-record");
    await expect(record).toBeVisible();
    await expect(record).toHaveAttribute("data-schema-version", CLAUDE_CAPSTONE_SCHEMA_VERSION);
    await expect(page.getByRole("heading", { name: "Portfolio self-audit complete" })).toBeFocused();
    await expect(record).toContainText("not an independently verified credential");

    const stored = await page.evaluate(() => JSON.parse(window.localStorage.getItem("ae.progress") || "{}"));
    expect(stored["claude.capstone.v1"]).toBe(true);
    expect(stored["claude.capstone.criticalClear"]).toBe(true);
    expect(Object.keys(stored).filter((key) => key.startsWith("claude.capstone.artifact.")).length).toBe(6);
    expect(Object.keys(stored).filter((key) => key.startsWith("claude.capstone.rubric.")).length).toBe(4);
    expect(Object.entries(stored)
      .filter(([key]) => key.startsWith("claude.capstone.rubric."))
      .reduce((total, [, score]) => total + Number(score), 0)).toBe(80);
  });
});

test.describe("accessibility, responsive layout, and static publication surfaces", () => {
  test("a course-original figure remains semantic without JavaScript", async ({ browser }) => {
    await assertNoJavaScriptFigure(browser, "/en/claude/choose-your-surface/", "fig-01");
  });

  test("representative English and Arabic surfaces have no automated WCAG A or AA violations", async ({ page }) => {
    const paths = [
      DASHBOARD,
      "/en/claude/research-with-citations/",
      "/en/claude/portfolio-capstone/",
      "/ar/claude/software-engineering/",
    ];
    for (const path of paths) {
      await page.goto(path);
      await page.locator("main").waitFor();
      await page.evaluate(async () => {
        await document.fonts.ready;
      });
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
    test(`dashboard and capstone do not overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const path of [DASHBOARD, "/en/claude/portfolio-capstone/", "/ar/claude/portfolio-capstone/"]) {
        await page.goto(path);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow).toBeLessThanOrEqual(1);
      }
    });
  }

  test("sitemap includes the dashboard and every Claude lesson in each locale", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.ok()).toBeTruthy();
    const xml = await response.text();
    for (const locale of CLAUDE_LOCALES) {
      expect(xml).toContain(`https://aicourse.top/${locale}/claude/`);
      for (const slug of CLAUDE_LESSON_SLUGS) {
        expect(xml).toContain(`https://aicourse.top/${locale}/claude/${slug}/`);
      }
    }
  });
});
