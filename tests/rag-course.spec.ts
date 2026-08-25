import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { RAG_FIGURES } from "../lib/rag/figures";
import { RAG_COURSE_MANIFEST } from "../lib/rag/manifest";
import { RAG_SOURCE_BY_ID } from "../lib/rag/sources";
import {
  RAG_LESSON_SLUGS,
  RAG_LOCALES,
  type RagCourseCopy,
  type RagLessonSlug,
} from "../lib/rag/types";

const ragCopyByLocale = Object.fromEntries(RAG_LOCALES.map((locale) => [
  locale,
  JSON.parse(readFileSync(new URL(`../messages/rag/${locale}.json`, import.meta.url), "utf8")) as RagCourseCopy,
])) as Record<(typeof RAG_LOCALES)[number], RagCourseCopy>;
const catalogLabelByLocale = Object.fromEntries(RAG_LOCALES.map((locale) => {
  const messages = JSON.parse(
    readFileSync(new URL(`../messages/${locale}.json`, import.meta.url), "utf8"),
  ) as Record<string, string>;
  return [locale, messages["nav.courses"]];
})) as Record<(typeof RAG_LOCALES)[number], string>;
const ragCopy = ragCopyByLocale.en;

const DASHBOARD = "/en/rag/";
const AUTHENTIC_FIGURES = RAG_FIGURES.filter((figure) => figure.authenticUi);
const OFFICIAL_DIAGRAM = RAG_FIGURES.find((figure) => figure.format === "official-teaching-diagram")!;
const LESSON_BY_FIGURE = new Map(
  RAG_COURSE_MANIFEST.lessons.map((lesson) => [lesson.figureId, lesson]),
);
const CORRECT_INDEX = new Map<RagLessonSlug, number>(
  RAG_LESSON_SLUGS.map((slug) => [slug, ragCopy.lessons[slug].checkpoint.correctIndex]),
);

type JsonLdNode = Record<string, unknown>;

async function readJsonLdNodes(page: Page): Promise<JsonLdNode[]> {
  const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
  return scripts.flatMap((text) => {
    const parsed = JSON.parse(text) as JsonLdNode;
    const graph = parsed["@graph"];
    return Array.isArray(graph) ? graph as JsonLdNode[] : [parsed];
  });
}

async function clearRagProgress(page: Page) {
  await page.goto(DASHBOARD);
  await page.evaluate(() => {
    window.localStorage.removeItem("ae.progress");
  });
  await page.reload();
  await expect(page.locator('[data-rag-hydrated="true"]')).toBeAttached();
}

async function completeQuizAttempt(page: Page, correctAnswers: number) {
  const seen = new Set<string>();

  for (let index = 0; index < RAG_LESSON_SLUGS.length; index += 1) {
    const form = page.locator("#rag-final-quiz form");
    await expect(form).toBeVisible();

    const options = form.locator('input[type="radio"]');
    await expect(options).toHaveCount(4);
    const slug = await options.first().getAttribute("name") as RagLessonSlug | null;
    expect(slug).toBeTruthy();
    expect(RAG_LESSON_SLUGS).toContain(slug!);
    expect(seen.has(slug!)).toBe(false);
    seen.add(slug!);

    const correct = CORRECT_INDEX.get(slug!);
    expect(correct).toBeDefined();
    const selected = index < correctAnswers ? correct! : (correct! + 1) % 4;
    await options.nth(selected).check();
    await form.getByRole("button", { name: ragCopy.ui.checkAnswer }).click();

    const feedback = form.getByRole("status");
    await expect(feedback).toBeVisible();
    await expect(feedback).toBeFocused();
    await expect(feedback.getByText(
      index < correctAnswers ? ragCopy.ui.correct : ragCopy.ui.incorrect,
      { exact: true },
    )).toBeVisible();
    await expect(feedback.getByRole("link", { name: new RegExp(`^${ragCopy.ui.source}:`) }))
      .toHaveAttribute("href", RAG_SOURCE_BY_ID[ragCopy.lessons[slug!].checkpoint.sourceId].exactAnchor);
    await feedback.getByRole("button", {
      name: index === RAG_LESSON_SLUGS.length - 1
        ? ragCopy.ui.finishQuiz
        : ragCopy.ui.nextQuestion,
    }).click();
    if (index === RAG_LESSON_SLUGS.length - 1) {
      await expect(page.locator("#rag-final-quiz").getByRole("status")).toBeFocused();
    } else {
      await expect(page.locator("#rag-final-quiz form h3")).toBeFocused();
    }
  }

  expect(seen).toEqual(new Set(RAG_LESSON_SLUGS));
}

function durationToMilliseconds(value: string): number {
  return value.trim().endsWith("ms") ? Number.parseFloat(value) : Number.parseFloat(value) * 1000;
}

test.describe("Course 9 dashboard, catalogue, and routes", () => {
  test("dashboard identifies Course 9 and links the complete four-unit curriculum", async ({ page }) => {
    const response = await page.goto(DASHBOARD);
    expect(response?.status()).toBe(200);

    const dashboard = page.getByTestId("rag-course-dashboard");
    await expect(dashboard).toBeVisible();
    await expect(page).toHaveTitle(/Retrieval-Augmented Generation/);
    await expect(dashboard.getByRole("heading", {
      level: 1,
      name: ragCopy.meta.title,
    })).toBeVisible();
    await expect(dashboard.getByText(/Course 9/).first()).toBeVisible();
    await expect(dashboard.getByText("12", { exact: true }).first()).toBeVisible();
    await expect(dashboard.getByText("780", { exact: true })).toBeVisible();
    await expect(dashboard.getByText("5", { exact: true })).toBeVisible();
    const heroImage = dashboard.locator('img[src="/courses/rag/figures/claude-support-rag-ui.png"]');
    await expect(heroImage).toBeVisible();
    await expect(heroImage).toHaveAttribute("fetchpriority", "high");
    await expect(dashboard.locator('a[href="/courses/rag/NOTICE.md"]')).toHaveText(ragCopy.ui.rightsNotice);
    await expect(dashboard.locator('code')).toHaveText("5264b729deda");
    await expect(dashboard.getByText(/not the consumer Claude\.ai interface/i)).toBeVisible();
    await expect(dashboard.getByRole("group", { name: ragCopy.ui.successCriteria })).toBeVisible();
    await expect(dashboard.getByRole("progressbar", { name: ragCopy.ui.courseProgress })).toBeVisible();

    const lessonLinks = dashboard.locator(
      'section[aria-labelledby="rag-curriculum-title"] ol > li > a',
    );
    await expect(lessonLinks).toHaveCount(RAG_LESSON_SLUGS.length);
    expect(await lessonLinks.evaluateAll((links) => links.map((link) => link.getAttribute("href"))))
      .toEqual(RAG_LESSON_SLUGS.map((slug) => `/en/rag/${slug}/`));
    await expect(dashboard.locator('section[aria-labelledby="rag-curriculum-title"] > div > section'))
      .toHaveCount(4);
  });

  test("catalogue exposes the available Course 9 card without displacing Course 6", async ({ page }) => {
    await page.goto("/en/courses/");
    const cards = page.locator("#catalog-course-results > li");
    const github = cards.filter({ has: page.locator('[data-course-cover="github"]') });
    const rag = cards.filter({ has: page.locator('[data-course-cover="rag"]') });

    await expect(github).toHaveCount(1);
    await expect(github.getByText("Course 6", { exact: true })).toBeVisible();
    await expect(github.locator("a").first()).toHaveAttribute("href", "/en/github/");
    await expect(rag).toHaveCount(1);
    await expect(rag).toHaveAttribute("id", "retrieval-augmented-generation");
    await expect(rag.getByText("Course 9", { exact: true })).toBeVisible();
    await expect(rag.getByRole("heading", { level: 2 })).toHaveText(
      "Retrieval-Augmented Generation (RAG)",
    );
    await expect(rag.locator("a.cinner")).toHaveAttribute("href", "/en/rag/");
    await expect(rag.getByRole("progressbar")).toHaveAttribute("aria-valuemax", "100");

    await page.getByRole("searchbox", { name: "Search" }).fill("retrieval-augmented");
    await expect(cards).toHaveCount(1);
    await expect(cards.getByRole("heading", { level: 2 })).toHaveText(
      "Retrieval-Augmented Generation (RAG)",
    );
    await expect(page).toHaveURL(/\?q=retrieval-augmented$/);

    await page.goto("/ar/courses/");
    const arabicRag = page.locator("#retrieval-augmented-generation");
    await expect(arabicRag.getByText("محتوى الدورة: الإنجليزية", { exact: true })).toHaveCount(0);
    await expect(arabicRag.locator("a.cinner")).toHaveAttribute("href", "/ar/rag/");
  });

  for (const lesson of RAG_COURSE_MANIFEST.lessons) {
    test(`English lesson ${lesson.slug} renders its learning, evidence, and figure contracts`, async ({ page }) => {
      const response = await page.goto(`/en/rag/${lesson.slug}/`);
      expect(response?.status()).toBe(200);

      const lessonRoot = page.getByTestId(`rag-lesson-${lesson.slug}`);
      await expect(lessonRoot).toBeVisible();
      await expect(lessonRoot.getByRole("heading", {
        level: 1,
        name: ragCopy.lessons[lesson.slug].title,
      })).toBeVisible();
      await expect(lessonRoot.locator('section[aria-labelledby="rag-objective-title"]')).toBeVisible();
      await expect(lessonRoot.locator('section[aria-labelledby^="rag-section-"]')).toHaveCount(3);
      await expect(lessonRoot.locator(`[data-figure-id="${lesson.figureId}"]`)).toHaveCount(1);
      await expect(lessonRoot.locator('section[aria-labelledby="rag-practice-title"] ol > li').first())
        .toBeVisible();
      await expect(lessonRoot.getByText(
        `${ragCopy.ui.estimatedLessonTime}: ${lesson.minutes} ${ragCopy.ui.minutes}`,
        { exact: true },
      )).toBeVisible();
      await expect(lessonRoot.locator(`section[aria-labelledby="checkpoint-${lesson.slug}-title"] input[type="radio"]`))
        .toHaveCount(4);
      await expect(lessonRoot.locator('section[aria-labelledby="rag-sources-title"] li'))
        .toHaveCount(lesson.sourceIds.length);
      await expect(lessonRoot.locator('section[aria-labelledby="rag-sources-title"] a:not([href^="https://"])'))
        .toHaveCount(0);
    });
  }

  test("an unrecognised Course 9 lesson slug returns the not-found surface", async ({ page }) => {
    const response = await page.goto("/en/rag/not-a-rag-lesson/");
    expect(response?.status()).toBe(404);
    await expect(page.locator('[data-testid^="rag-lesson-"]')).toHaveCount(0);
  });
});

test.describe("authentic local UI figures and provenance", () => {
  test("the figure manifest distinguishes authentic UI, official evidence, and original semantics", () => {
    expect(AUTHENTIC_FIGURES).toHaveLength(5);
    expect(RAG_FIGURES.filter((figure) => figure.format === "semantic-html")).toHaveLength(6);
    expect(RAG_FIGURES.filter((figure) => figure.format === "official-teaching-diagram")).toHaveLength(1);
    expect(OFFICIAL_DIAGRAM.authenticUi).toBe(false);
    expect(AUTHENTIC_FIGURES.every((figure) => (
      figure.raster !== null
      && figure.rightsStatus === "licensed-local-figure"
      && figure.sourceId !== null
    ))).toBe(true);
  });

  test("the twelve answer keys are balanced against constant-position guessing", () => {
    const correctPositions = RAG_LESSON_SLUGS.map((slug) => ragCopy.lessons[slug].checkpoint.correctIndex);
    const histogram = [0, 1, 2, 3].map((position) => (
      correctPositions.filter((correctIndex) => correctIndex === position).length
    ));
    expect(histogram).toEqual([3, 3, 3, 3]);
    expect(Math.max(...histogram)).toBeLessThan(9);
  });

  test("every authentic PNG and WebP is local, hash-pinned, and rendered with its licence trail", async ({ page, request }) => {
    test.setTimeout(90_000);

    for (const figureManifest of AUTHENTIC_FIGURES) {
      const raster = figureManifest.raster!;
      for (const [path, expectedHash, expectedType] of [
        [raster.pngPath, raster.pngSha256, "image/png"],
        [raster.webpPath, raster.webpSha256, "image/webp"],
      ] as const) {
        const response = await request.get(path);
        expect(response.status(), path).toBe(200);
        expect(response.headers()["content-type"], path).toContain(expectedType);
        expect(createHash("sha256").update(await response.body()).digest("hex"), path)
          .toBe(expectedHash);
      }

      const lesson = LESSON_BY_FIGURE.get(figureManifest.id);
      expect(lesson).toBeDefined();
      await page.goto(`/en/rag/${lesson!.slug}/`);
      const figure = page.locator(`[data-figure-id="${figureManifest.id}"]`);
      await expect(figure).toBeVisible();
      await expect(figure.getByText(ragCopy.ui.authenticFigure, { exact: true })).toBeVisible();
      await expect(figure.locator('a[href="/courses/rag/NOTICE.md"]'))
        .toHaveText(ragCopy.ui.rightsNotice);
      await expect(figure.locator(`a[href="${raster.upstreamUrl}"]`))
        .toHaveText(ragCopy.ui.source);
      const originalLink = figure.locator(`a[href="${raster.pngPath}"]`);
      await expect(originalLink).toHaveCount(1);
      await expect(originalLink).toHaveAccessibleName(new RegExp(ragCopy.ui.openOriginal));
      await expect(figure.locator("source")).toHaveAttribute("srcset", raster.webpPath);

      const image = figure.locator("img");
      await expect(image).toHaveAttribute("src", raster.pngPath);
      await expect(image).toHaveAttribute("width", String(raster.width));
      await expect(image).toHaveAttribute("height", String(raster.height));
      await expect(image).toHaveAttribute("alt", ragCopy.lessons[lesson!.slug].figure.alt);
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.naturalWidth))
        .toBe(raster.width);
      await expect(figure.locator("figcaption")).not.toBeEmpty();
      await expect(figure.locator("details summary")).toHaveText(ragCopy.ui.imageTranscript);
      await expect(page.locator('img[src^="http"], source[srcset^="http"]')).toHaveCount(0);
    }

    const notice = await request.get("/courses/rag/NOTICE.md");
    expect(notice.status()).toBe(200);
    const noticeText = await notice.text();
    expect(noticeText).toContain("MIT License");
    expect(noticeText).toContain("Creative Commons Attribution 4.0 International");
    expect(noticeText).toContain("5264b729deda905dba3e5402d717bebed000325c");
    expect(noticeText).toContain("bca060d6b2d741071394605cadae46badb9911c5");
    expect(noticeText).toContain("947a005c4690087aed08f92a1681e95c2e6de7909e1edc7a75e085fa5d00131f");
  });

  test("the official Anthropic diagram is byte-pinned and never labelled as product UI", async ({ page, request }) => {
    expect(OFFICIAL_DIAGRAM.format).toBe("official-teaching-diagram");
    if (OFFICIAL_DIAGRAM.format !== "official-teaching-diagram") return;
    const vector = OFFICIAL_DIAGRAM.vector!;
    const response = await request.get(vector.svgPath);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/svg+xml");
    expect(createHash("sha256").update(await response.body()).digest("hex")).toBe(vector.svgSha256);

    await page.goto("/en/rag/advanced-patterns/");
    const figure = page.locator('[data-figure-id="anthropic-knowledge-wiki-architecture"]');
    await expect(figure.getByText(ragCopy.ui.officialFigure, { exact: true })).toBeVisible();
    await expect(figure.locator("img")).toHaveAttribute("src", vector.svgPath);
    await expect(figure.locator("img")).toHaveAttribute("alt", ragCopy.lessons["advanced-patterns"].figure.alt);
    await expect(figure.locator("figcaption")).toContainText("teaching diagram, not Claude.ai or product UI");
    await expect(figure.locator(`a[href="${vector.upstreamUrl}"]`)).toHaveText(ragCopy.ui.source);
    await expect(figure.locator('a[href="/courses/rag/NOTICE.md"]')).toHaveText(ragCopy.ui.rightsNotice);
    await expect(figure.locator("code")).toHaveText("5264b729deda");
  });

  test("the Dify citation screenshot is described only by what the pinned pixels show", async ({ page }) => {
    await page.goto("/en/rag/production-capstone/");
    const lesson = page.getByTestId("rag-lesson-production-capstone");
    const figure = lesson.locator('[data-figure-id="dify-citations-ui"]');
    await expect(figure.locator("img")).toHaveAttribute(
      "alt",
      /CITATIONS panel naming remote-work-policy\.md and leave-and-time-off-policy\.md/,
    );
    await expect(figure.locator("figcaption")).toContainText("CITATIONS panel");
    await expect(figure.locator("details")).toContainText("No supporting spans are visible");
    await expect(lesson).not.toContainText(/highlighted source|highlighted citation|Claim-to-source inspection/i);
  });

  test("the Claude-powered screen is labelled accurately and never presented as consumer Claude.ai", async ({ page }) => {
    await page.goto("/en/rag/ground-and-cite/");
    const figure = page.locator('[data-figure-id="claude-support-rag-ui"]');
    await expect(figure).toBeVisible();
    await expect(figure.locator("figcaption")).toContainText("Anthropic-maintained customer-support quickstart");
    await expect(figure.locator("figcaption")).toContainText("It is not Claude.ai");
    await expect(figure.locator("code")).toHaveText("5264b729deda");
  });

  test("a semantic teaching figure remains accessible without pretending to be a screenshot", async ({ page }) => {
    await page.goto("/en/rag/choose-rag/");
    const figure = page.locator('[data-figure-id="rag-decision-map"]');
    await expect(figure.getByText(ragCopy.ui.originalFigure, { exact: true })).toBeVisible();
    await expect(figure.locator('div[role="group"]')).toHaveAttribute(
      "aria-label",
      ragCopy.lessons["choose-rag"].figure.alt,
    );
    await expect(figure.locator("img, source")).toHaveCount(0);
    await expect(figure.locator('a[href="/courses/rag/NOTICE.md"]')).toHaveCount(0);

    await page.goto("/en/rag/retrieval-engineering/");
    const scoreboard = page.locator('[data-figure-id="retrieval-scoreboard"] table');
    await expect(scoreboard).toHaveCount(1);
    await expect(scoreboard.locator("thead th").first()).toHaveText("Query scenario");
    await expect(scoreboard.locator("tbody th")).toHaveText([
      "Exact identifier",
      "Paraphrase",
      "Conflicting policy",
    ]);
  });
});

test.describe("deterministic Retrieval Lab", () => {
  test("controls expose exact, reproducible ranking, abstention, and version-conflict outcomes", async ({ page }) => {
    await page.goto("/en/rag/retrieval-engineering/");
    const lab = page.locator('section[aria-labelledby="rag-lab-title"]');
    await expect(lab).toBeVisible();
    await expect(lab.getByText(ragCopy.lab.disclosure, { exact: true })).toBeVisible();
    await page.waitForLoadState("networkidle");
    await expect(lab).toHaveAttribute("data-rag-hydrated", "true");

    const backgroundCalls: string[] = [];
    page.on("request", (request) => {
      if (["fetch", "xhr"].includes(request.resourceType())) backgroundCalls.push(request.url());
    });

    const rows = lab.locator("ol > li");
    const outcome = lab.locator('div[role="status"][aria-atomic="true"]');
    await expect(rows).toHaveCount(4);
    expect(await rows.locator("div strong").allTextContents()).toEqual(["C1", "C2", "C3", "C4"]);
    await expect(lab.getByText("3 / 4", { exact: true })).toBeVisible();
    await expect(lab.getByText("C1 · C2 · C3", { exact: true })).toBeVisible();
    await expect(lab.getByText(ragCopy.lab.scenarios[0].answer, { exact: true })).toBeVisible();
    await expect(outcome.getByText("[C1]", { exact: true })).toBeVisible();

    await lab.getByRole("slider", { name: new RegExp(ragCopy.lab.topKLabel) }).fill("4");
    await expect(outcome.getByText(
      `${ragCopy.lab.scenarios[0].answer} ${ragCopy.lab.scenarios[0].supplements.C4}`,
      { exact: true },
    )).toBeVisible();
    await expect(outcome.getByText("[C1] [C4]", { exact: true })).toBeVisible();

    await lab.getByLabel(ragCopy.lab.scenarioLabel).selectOption("identifier");
    await lab.getByRole("radio", { name: ragCopy.lab.dense, exact: true }).check();
    await lab.getByRole("slider", { name: new RegExp(ragCopy.lab.topKLabel) }).fill("1");
    expect(await rows.locator("div strong").allTextContents()).toEqual(["C2", "C1", "C4", "C3"]);
    await expect(outcome.locator(":scope > div").first().getByText("C2", { exact: true })).toBeVisible();
    await expect(rows.nth(0)).toContainText("Teaching score: 0.71");
    await expect(outcome.getByText(ragCopy.lab.unsupportedContext, { exact: true })).toBeVisible();
    await expect(outcome.locator(":scope > div").nth(1).locator("small")).toHaveCount(0);

    await lab.getByRole("radio", { name: ragCopy.lab.hybrid, exact: true }).check();
    await lab.getByLabel(ragCopy.lab.scenarioLabel).selectOption("paraphrase");
    await lab.getByRole("slider", { name: new RegExp(ragCopy.lab.topKLabel) }).fill("3");
    await lab.getByRole("slider", { name: new RegExp(ragCopy.lab.thresholdLabel) }).fill("0.95");
    await expect(lab.getByText("0 / 4", { exact: true })).toBeVisible();
    await expect(lab.getByText("∅", { exact: true })).toBeVisible();
    await expect(lab.getByText(ragCopy.lab.noContext, { exact: true })).toBeVisible();

    await lab.getByRole("slider", { name: new RegExp(ragCopy.lab.thresholdLabel) }).fill("0.35");
    await lab.getByLabel(ragCopy.lab.scenarioLabel).selectOption("conflict");
    await lab.getByRole("slider", { name: new RegExp(ragCopy.lab.topKLabel) }).fill("1");
    await expect(outcome.getByText(ragCopy.lab.scenarios[2].answer, { exact: true })).toBeVisible();
    await expect(outcome.getByText("[C1]", { exact: true })).toBeVisible();
    await expect(outcome).not.toContainText(ragCopy.lab.scenarios[2].supplements.C2!);

    await lab.getByRole("slider", { name: new RegExp(ragCopy.lab.topKLabel) }).fill("3");
    await expect(outcome.getByText(
      `${ragCopy.lab.scenarios[2].answer} ${ragCopy.lab.scenarios[2].supplements.C2}`,
      { exact: true },
    )).toBeVisible();
    await expect(outcome.getByText("[C1] [C2]", { exact: true })).toBeVisible();

    await lab.getByRole("checkbox", { name: new RegExp(ragCopy.lab.rerankLabel) }).uncheck();
    await expect(lab.getByText(ragCopy.lab.rerankOff, { exact: true })).toBeVisible();
    await expect(backgroundCalls).toEqual([]);
  });

  test("a shared lab URL restores every validated control while preserving unrelated query state", async ({ page }) => {
    await page.goto("/en/rag/retrieval-engineering/?keep=1&ragScenario=identifier&ragStrategy=dense&ragTopK=1&ragThreshold=0.55&ragRerank=0");
    const lab = page.locator('section[aria-labelledby="rag-lab-title"]');
    await expect(lab).toHaveAttribute("data-rag-url-ready", "true");
    await expect(lab.getByLabel(ragCopy.lab.scenarioLabel)).toHaveValue("identifier");
    await expect(lab.getByRole("radio", { name: ragCopy.lab.dense, exact: true })).toBeChecked();
    await expect(lab.getByRole("slider", { name: new RegExp(ragCopy.lab.topKLabel) })).toHaveValue("1");
    await expect(lab.getByRole("slider", { name: new RegExp(ragCopy.lab.thresholdLabel) })).toHaveValue("0.55");
    await expect(lab.getByRole("checkbox", { name: new RegExp(ragCopy.lab.rerankLabel) })).not.toBeChecked();
    expect(new URL(page.url()).searchParams.get("keep")).toBe("1");

    await lab.getByLabel(ragCopy.lab.scenarioLabel).selectOption("conflict");
    await lab.getByRole("radio", { name: ragCopy.lab.hybrid, exact: true }).check();
    await lab.getByRole("slider", { name: new RegExp(ragCopy.lab.topKLabel) }).fill("3");
    await lab.getByRole("slider", { name: new RegExp(ragCopy.lab.thresholdLabel) }).fill("0.35");
    await lab.getByRole("checkbox", { name: new RegExp(ragCopy.lab.rerankLabel) }).check();
    await expect.poll(() => Object.fromEntries(new URL(page.url()).searchParams)).toMatchObject({
      keep: "1",
      ragScenario: "conflict",
      ragStrategy: "hybrid",
      ragTopK: "3",
      ragThreshold: "0.35",
      ragRerank: "1",
    });

    await page.reload();
    await expect(lab).toHaveAttribute("data-rag-url-ready", "true");
    await expect(lab.getByLabel(ragCopy.lab.scenarioLabel)).toHaveValue("conflict");
    await expect(lab.getByRole("radio", { name: ragCopy.lab.hybrid, exact: true })).toBeChecked();
    await expect(lab.getByRole("slider", { name: new RegExp(ragCopy.lab.topKLabel) })).toHaveValue("3");
    await expect(lab.getByRole("slider", { name: new RegExp(ragCopy.lab.thresholdLabel) })).toHaveValue("0.35");
    await expect(lab.getByRole("checkbox", { name: new RegExp(ragCopy.lab.rerankLabel) })).toBeChecked();
  });
});

test.describe("private progress, checkpoints, final quiz, and capstone", () => {
  test("practice persists and Course 9 reset preserves unrelated local progress", async ({ page }) => {
    await clearRagProgress(page);
    await page.evaluate(() => {
      localStorage.setItem("ae.progress", JSON.stringify({
        "github.lesson.github-mental-model.practice": true,
        "codex.lesson.meet-codex": true,
        unrelated: "keep me",
      }));
    });

    await page.goto("/en/rag/choose-rag/");
    await page.getByRole("button", { name: ragCopy.ui.markPracticeComplete }).click();
    await expect(page.getByRole("button", { name: ragCopy.ui.markedPracticeComplete }))
      .toBeDisabled();
    await page.reload();
    await expect(page.getByRole("button", { name: ragCopy.ui.markedPracticeComplete }))
      .toBeDisabled();

    let stored = await page.evaluate(() => JSON.parse(localStorage.getItem("ae.progress") || "{}"));
    expect(stored["rag.lesson.choose-rag.practice"]).toBe(true);
    expect(stored["github.lesson.github-mental-model.practice"]).toBe(true);
    expect(stored["codex.lesson.meet-codex"]).toBe(true);

    await page.goto(DASHBOARD);
    await expect(page.locator('section[aria-labelledby="rag-progress-title"] progress'))
      .toHaveAttribute("value", "1");
    await expect(page.locator('section[aria-labelledby="rag-progress-title"] progress'))
      .toHaveAttribute("max", "14");
    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toBe(ragCopy.ui.resetConfirm);
      await dialog.accept();
    });
    await page.getByRole("button", { name: ragCopy.ui.resetProgress }).click();
    const resetStatus = page.getByText(ragCopy.ui.resetDone, { exact: true });
    await expect(resetStatus).toBeVisible();
    await expect(resetStatus).toBeFocused();

    stored = await page.evaluate(() => JSON.parse(localStorage.getItem("ae.progress") || "{}"));
    expect(Object.keys(stored).filter((key) => key.startsWith("rag."))).toEqual([]);
    expect(stored).toEqual({
      "github.lesson.github-mental-model.practice": true,
      "codex.lesson.meet-codex": true,
      unrelated: "keep me",
    });
  });

  test("all twelve practices plus quiz and capstone produce exactly fourteen milestones", async ({ page }) => {
    await page.goto(DASHBOARD);
    await page.evaluate((slugs) => {
      localStorage.setItem("ae.progress", JSON.stringify({
        ...Object.fromEntries(slugs.map((slug) => [`rag.lesson.${slug}.practice`, true])),
        "rag.quiz.best": 12,
        "rag.quiz.passed": true,
        "rag.capstone.v1": true,
      }));
    }, RAG_LESSON_SLUGS);
    await page.reload();

    const progress = page.locator('section[aria-labelledby="rag-progress-title"]');
    await expect(progress.locator("progress")).toHaveAttribute("value", "14");
    await expect(progress.locator("progress")).toHaveAttribute("max", "14");
    await expect(progress.locator("output strong")).toHaveText("100%");
    await expect(progress.getByText("14 / 14", { exact: true })).toBeVisible();
  });

  test("progress fragment CTAs move keyboard focus into the quiz and capstone", async ({ page }) => {
    await page.goto(DASHBOARD);
    await page.evaluate((slugs) => {
      localStorage.setItem("ae.progress", JSON.stringify({
        ...Object.fromEntries(slugs.map((slug) => [`rag.lesson.${slug}.practice`, true])),
      }));
    }, RAG_LESSON_SLUGS);
    await page.reload();

    const progress = page.locator('section[aria-labelledby="rag-progress-title"]');
    const quizLink = progress.locator('a[href="#rag-final-quiz"]');
    await quizLink.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#rag-final-quiz$/);
    await expect(page.locator("#rag-final-quiz")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: ragCopy.ui.beginQuiz })).toBeFocused();

    await page.evaluate(() => {
      const stored = JSON.parse(localStorage.getItem("ae.progress") || "{}");
      stored["rag.quiz.best"] = 9;
      stored["rag.quiz.passed"] = true;
      localStorage.setItem("ae.progress", JSON.stringify(stored));
      window.dispatchEvent(new CustomEvent("aicourse:rag-progress"));
    });
    const capstoneLink = progress.locator('a[href="#rag-capstone"]');
    await capstoneLink.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#rag-capstone$/);
    await expect(page.locator("#rag-capstone")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.locator('#rag-capstone input[type="checkbox"]').first()).toBeFocused();
  });

  test("lesson checkpoint explains an error, permits retry, and confirms the sourced answer", async ({ page }) => {
    await page.goto("/en/rag/choose-rag/");
    const checkpoint = page.locator('section[aria-labelledby="checkpoint-choose-rag-title"]');
    const options = checkpoint.locator('input[type="radio"]');
    await expect(options).toHaveCount(4);

    await options.nth(0).check();
    await checkpoint.getByRole("button", { name: ragCopy.ui.checkAnswer }).focus();
    await page.keyboard.press("Enter");
    const incorrectFeedback = checkpoint.getByRole("status");
    await expect(incorrectFeedback).toContainText(ragCopy.ui.incorrect);
    await expect(incorrectFeedback).toBeFocused();
    await expect(incorrectFeedback).toHaveCSS("outline-style", "solid");
    await expect(incorrectFeedback).toContainText(
      ragCopy.lessons["choose-rag"].checkpoint.explanation,
    );
    await checkpoint.getByRole("button", { name: ragCopy.ui.retryQuiz }).focus();
    await page.keyboard.press("Enter");
    await expect(options.nth(0)).toBeFocused();

    await options.nth(ragCopy.lessons["choose-rag"].checkpoint.correctIndex).check();
    await checkpoint.getByRole("button", { name: ragCopy.ui.checkAnswer }).focus();
    await page.keyboard.press("Enter");
    await expect(checkpoint.getByRole("status")).toContainText(ragCopy.ui.correct);
    await expect(checkpoint.getByRole("status")).toBeFocused();
    await expect(checkpoint.getByRole("button", { name: ragCopy.ui.retryQuiz })).toHaveCount(0);
  });

  test("eight of twelve fails and the exact nine-of-twelve boundary passes", async ({ page }) => {
    test.setTimeout(90_000);
    await clearRagProgress(page);
    await page.getByRole("button", { name: ragCopy.ui.beginQuiz }).click();
    await expect(page.locator("#rag-final-quiz form h3")).toBeFocused();
    await completeQuizAttempt(page, 8);
    await expect(page.getByText("Score: 8 of 12", { exact: true })).toBeVisible();
    await expect(page.getByText(ragCopy.ui.quizNeedsReview, { exact: true })).toBeVisible();

    let stored = await page.evaluate(() => JSON.parse(localStorage.getItem("ae.progress") || "{}"));
    expect(stored["rag.quiz.best"]).toBe(8);
    expect(stored["rag.quiz.passed"]).not.toBe(true);

    await page.getByRole("button", { name: ragCopy.ui.retryQuiz }).click();
    await expect(page.locator("#rag-final-quiz form h3")).toBeFocused();
    await completeQuizAttempt(page, 9);
    await expect(page.getByText("Score: 9 of 12", { exact: true })).toBeVisible();
    await expect(page.getByText(ragCopy.ui.quizPassed, { exact: true })).toBeVisible();

    stored = await page.evaluate(() => JSON.parse(localStorage.getItem("ae.progress") || "{}"));
    expect(stored["rag.quiz.best"]).toBe(9);
    expect(stored["rag.quiz.passed"]).toBe(true);
  });

  test("an unfinished quiz restores its exact question, selection, and prior answers after reload", async ({ page }) => {
    await clearRagProgress(page);
    await page.getByRole("button", { name: ragCopy.ui.beginQuiz }).click();
    let form = page.locator("#rag-final-quiz form");
    const firstSlug = RAG_LESSON_SLUGS[0];
    await form.locator('input[type="radio"]').nth(ragCopy.lessons[firstSlug].checkpoint.correctIndex).check();
    await form.getByRole("button", { name: ragCopy.ui.checkAnswer }).click();
    await form.getByRole("button", { name: ragCopy.ui.nextQuestion }).click();

    form = page.locator("#rag-final-quiz form");
    await form.locator('input[type="radio"]').nth(2).check();
    await expect.poll(() => page.evaluate(() => {
      const progress = JSON.parse(localStorage.getItem("ae.progress") || "{}");
      return progress["rag.quiz.draft.v1"];
    })).toMatchObject({ version: 1, index: 1, selected: 2, answers: { [firstSlug]: true } });

    await page.reload();
    await page.getByRole("button", { name: ragCopy.ui.beginQuiz }).click();
    form = page.locator("#rag-final-quiz form");
    await expect(form.getByRole("heading", {
      level: 3,
      name: ragCopy.lessons[RAG_LESSON_SLUGS[1]].checkpoint.question,
    })).toBeVisible();
    await expect(form.locator('input[type="radio"]').nth(2)).toBeChecked();
    await expect(form.getByText("Question 2 of 12", { exact: true })).toBeVisible();
  });

  test("capstone completion requires all nine release artifacts and persists locally", async ({ page }) => {
    await clearRagProgress(page);
    const capstone = page.locator('section#rag-capstone');
    const checks = capstone.locator('input[type="checkbox"]');
    await expect(checks).toHaveCount(ragCopy.capstone.required.length);
    await expect(capstone.locator("ol > li")).toHaveCount(ragCopy.capstone.rubric.length);
    const record = capstone.getByRole("button", { name: ragCopy.ui.recordCapstone });
    await expect(record).toBeDisabled();

    const draftedIndexes = [0, 2];
    const expectedDraft = ragCopy.capstone.required.map((_, index) => draftedIndexes.includes(index));
    for (const index of draftedIndexes) await checks.nth(index).check();
    await expect.poll(() => page.evaluate(() => {
      const progress = JSON.parse(localStorage.getItem("ae.progress") || "{}");
      return progress["rag.capstone.draft.v1"];
    })).toEqual({ version: 1, checked: expectedDraft });

    await page.reload();
    for (let index = 0; index < ragCopy.capstone.required.length; index += 1) {
      if (draftedIndexes.includes(index)) {
        await expect(checks.nth(index)).toBeChecked();
      } else {
        await expect(checks.nth(index)).not.toBeChecked();
      }
    }
    for (let index = 0; index < ragCopy.capstone.required.length; index += 1) {
      if (!draftedIndexes.includes(index)) await checks.nth(index).check();
    }
    await expect(record).toBeEnabled();
    await record.click();
    await expect(capstone.getByRole("button", { name: ragCopy.ui.capstoneComplete })).toBeDisabled();
    await expect(capstone.getByRole("status")).toHaveText(ragCopy.ui.capstoneComplete);
    await expect(capstone.getByRole("status")).toBeFocused();
    for (let index = 0; index < ragCopy.capstone.required.length; index += 1) {
      await expect(checks.nth(index)).toBeDisabled();
    }

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("ae.progress") || "{}"));
    expect(stored["rag.capstone.v1"]).toBe(true);
    expect(stored["rag.capstone.draft.v1"]).toBeUndefined();
  });

  test("Course 9 reset clears live quiz and capstone state as well as persisted milestones", async ({ page }) => {
    test.setTimeout(90_000);
    await clearRagProgress(page);
    await page.getByRole("button", { name: ragCopy.ui.beginQuiz }).click();
    await completeQuizAttempt(page, 12);
    await expect(page.getByText("Score: 12 of 12", { exact: true })).toBeVisible();

    const capstone = page.locator("section#rag-capstone");
    const checks = capstone.locator('input[type="checkbox"]');
    for (let index = 0; index < ragCopy.capstone.required.length; index += 1) {
      await checks.nth(index).check();
    }
    await capstone.getByRole("button", { name: ragCopy.ui.recordCapstone }).click();
    await expect(capstone.getByRole("button", { name: ragCopy.ui.capstoneComplete })).toBeDisabled();

    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });
    await page.getByRole("button", { name: ragCopy.ui.resetProgress }).click();

    await expect(page.getByText(ragCopy.ui.resetDone, { exact: true })).toBeFocused();
    await expect(page.getByRole("button", { name: ragCopy.ui.beginQuiz })).toBeVisible();
    await expect(page.getByText("Best score: 0 of 12", { exact: true })).toBeVisible();
    await expect(page.getByText("Score: 12 of 12", { exact: true })).toHaveCount(0);
    await expect(capstone.getByRole("button", { name: ragCopy.ui.recordCapstone })).toBeDisabled();
    for (let index = 0; index < ragCopy.capstone.required.length; index += 1) {
      await expect(checks.nth(index)).not.toBeChecked();
      await expect(checks.nth(index)).toBeEnabled();
    }
    await expect(page.locator('section[aria-labelledby="rag-progress-title"] progress')).toHaveAttribute("value", "0");

    await page.evaluate(() => {
      const progress = JSON.parse(localStorage.getItem("ae.progress") || "{}");
      progress["rag.lesson.choose-rag.practice"] = true;
      localStorage.setItem("ae.progress", JSON.stringify(progress));
      window.dispatchEvent(new CustomEvent("aicourse:rag-progress"));
    });
    await expect(page.getByRole("button", { name: ragCopy.ui.resetProgress })).toBeEnabled();
    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });
    await page.getByRole("button", { name: ragCopy.ui.resetProgress }).click();
    await expect(page.getByText(ragCopy.ui.resetDone, { exact: true })).toBeFocused();
  });

  test("storage denial is disclosed while the course remains interactively usable", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(Storage.prototype, "getItem", {
        configurable: true,
        value: () => { throw new DOMException("denied", "SecurityError"); },
      });
      Object.defineProperty(Storage.prototype, "setItem", {
        configurable: true,
        value: () => { throw new DOMException("denied", "SecurityError"); },
      });
    });

    await page.goto("/en/rag/choose-rag/");
    const warning = page.getByText(ragCopy.ui.storageUnavailable);
    await expect(warning).toBeVisible();
    await expect(warning).toHaveAttribute("role", "status");
    await page.getByRole("button", { name: ragCopy.ui.markPracticeComplete }).click();
    await expect(page.getByRole("button", { name: ragCopy.ui.markedPracticeComplete }))
      .toBeDisabled();
    await expect(page.getByTestId("rag-lesson-choose-rag")).toBeVisible();
  });

  test("malformed shared progress is backed up and repaired without disabling storage", async ({ page }) => {
    const malformed = "{not-json";
    await page.goto(DASHBOARD);
    await page.evaluate((value) => {
      localStorage.setItem("ae.progress", value);
      sessionStorage.removeItem("ae.progress.corrupt-backup");
    }, malformed);
    await page.reload();
    await expect(page.locator('[data-rag-hydrated="true"]')).toBeAttached();

    await expect(page.getByText(ragCopy.ui.storageUnavailable)).toHaveCount(0);
    expect(await page.evaluate(() => sessionStorage.getItem("ae.progress.corrupt-backup"))).toBe(malformed);
    expect(await page.evaluate(() => localStorage.getItem("ae.progress"))).toBe("{}");

    await page.goto("/en/rag/choose-rag/");
    await page.getByRole("button", { name: ragCopy.ui.markPracticeComplete }).click();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("ae.progress") || "{}")))
      .toMatchObject({ "rag.lesson.choose-rag.practice": true });
  });
});

test.describe("locale boundaries, SEO, accessibility, and responsive rendering", () => {
  test("all nine locale routes materialise their own copy and Arabic uses genuine RTL", async ({ page }) => {
    test.setTimeout(180_000);
    for (const locale of RAG_LOCALES) {
      const localizedCopy = ragCopyByLocale[locale];
      const response = await page.goto(`/${locale}/rag/`);
      expect(response?.status(), locale).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
      const course = page.getByTestId("rag-course-dashboard");
      await expect(course).toHaveAttribute("lang", locale);
      await expect(course).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
      expect(await course.evaluate((element) => getComputedStyle(element).direction))
        .toBe(locale === "ar" ? "rtl" : "ltr");
      await expect(course.getByRole("heading", { level: 1, name: localizedCopy.meta.title })).toBeVisible();
      const catalogLabel = course.getByTestId("rag-catalog-label");
      await expect(catalogLabel).toHaveAttribute("lang", locale);
      await expect(catalogLabel).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
      await expect(catalogLabel).toHaveText(catalogLabelByLocale[locale]);
    }

    await page.goto("/ar/rag/ground-and-cite/");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    const lesson = page.getByTestId("rag-lesson-ground-and-cite");
    await expect(lesson).toHaveAttribute("lang", "ar");
    await expect(lesson).toHaveAttribute("dir", "rtl");
    expect(await lesson.evaluate((element) => getComputedStyle(element).direction)).toBe("rtl");
    await expect(lesson.getByRole("heading", {
      level: 1,
      name: ragCopyByLocale.ar.lessons["ground-and-cite"].title,
    })).toBeVisible();
  });

  test("Course 9 emits self-canonical locale alternates and localized JSON-LD", async ({ page }) => {
    await page.goto(DASHBOARD);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://aicourse.top/en/rag/",
    );
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(RAG_LOCALES.length + 1);
    for (const locale of RAG_LOCALES) {
      await expect(page.locator(`link[rel="alternate"][hreflang="${locale}"]`)).toHaveAttribute(
        "href",
        `https://aicourse.top/${locale}/rag/`,
      );
    }
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
      "href",
      "https://aicourse.top/en/rag/",
    );

    let nodes = await readJsonLdNodes(page);
    const course = nodes.find((node) => node["@type"] === "Course");
    expect(course).toBeTruthy();
    expect(course?.inLanguage).toBe("en");
    expect(course?.url).toBe("https://aicourse.top/en/rag/");
    expect(course?.hasPart).toHaveLength(RAG_LESSON_SLUGS.length);
    expect((course?.hasPart as JsonLdNode[]).every((part) => (
      typeof part.url === "string" && part.url.startsWith("https://aicourse.top/en/rag/")
    ))).toBe(true);
    expect((course?.hasCourseInstance as JsonLdNode)?.courseWorkload).toBe("PT780M");
    const breadcrumb = nodes.find((node) => node["@type"] === "BreadcrumbList");
    expect(breadcrumb).toBeTruthy();
    expect(((breadcrumb?.itemListElement as JsonLdNode[])[0]).name).toBe(ragCopy.ui.catalogName);

    await page.goto("/ar/rag/ground-and-cite/");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://aicourse.top/ar/rag/ground-and-cite/",
    );
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(RAG_LOCALES.length + 1);
    await expect(page.locator('link[rel="alternate"][hreflang="ar"]')).toHaveAttribute(
      "href",
      "https://aicourse.top/ar/rag/ground-and-cite/",
    );
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
      "href",
      "https://aicourse.top/en/rag/ground-and-cite/",
    );
    nodes = await readJsonLdNodes(page);
    const learningResource = nodes.find((node) => node["@type"] === "LearningResource");
    expect(learningResource).toBeTruthy();
    expect(learningResource?.inLanguage).toBe("ar");
    expect(learningResource?.url).toBe("https://aicourse.top/ar/rag/ground-and-cite/");
    expect(learningResource?.timeRequired).toBe("PT65M");
    expect((learningResource?.isPartOf as JsonLdNode)?.url).toBe("https://aicourse.top/ar/rag/");
    expect(nodes.some((node) => node["@type"] === "BreadcrumbList")).toBe(true);
  });

  test("sitemap publishes the dashboard and twelve lessons in all nine locales", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const xml = await response.text();
    const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    const ragLocations = locations.filter((location) => new URL(location).pathname.includes("/rag/"));
    const expectedCount = RAG_LOCALES.length * (RAG_LESSON_SLUGS.length + 1);
    expect(ragLocations).toHaveLength(expectedCount);
    expect(new Set(ragLocations).size).toBe(expectedCount);
    for (const locale of RAG_LOCALES) {
      expect(ragLocations).toContain(`https://aicourse.top/${locale}/rag/`);
      for (const slug of RAG_LESSON_SLUGS) {
        expect(ragLocations).toContain(`https://aicourse.top/${locale}/rag/${slug}/`);
      }
    }
  });

  test("lab controls, image alternatives, transcripts, and links expose accessible names", async ({ page }) => {
    await page.goto("/en/rag/retrieval-engineering/");
    const lesson = page.getByTestId("rag-lesson-retrieval-engineering");
    await expect(lesson.locator("h1")).toHaveCount(1);
    await expect(lesson.locator('img:not([alt]), img[alt=""]')).toHaveCount(0);
    const lab = page.locator('section[aria-labelledby="rag-lab-title"]');
    const scenarioSelect = lab.getByRole("combobox", { name: ragCopy.lab.scenarioLabel });
    await expect(scenarioSelect).toBeVisible();
    await expect(scenarioSelect).toHaveAttribute("name", "rag-scenario");
    await expect(scenarioSelect).toHaveAttribute("autocomplete", "off");
    await expect(lab.getByRole("group", { name: ragCopy.lab.strategyLabel })).toBeVisible();
    await expect(lab.getByRole("radio", { name: ragCopy.lab.dense })).toBeVisible();
    await expect(lab.getByRole("radio", { name: ragCopy.lab.keyword })).toBeVisible();
    await expect(lab.getByRole("radio", { name: ragCopy.lab.hybrid })).toBeVisible();
    await expect(lab.getByRole("slider", { name: new RegExp(ragCopy.lab.topKLabel) })).toBeVisible();
    await expect(lab.getByRole("slider", { name: new RegExp(ragCopy.lab.thresholdLabel) })).toBeVisible();
    await expect(lab.getByRole("checkbox", { name: new RegExp(ragCopy.lab.rerankLabel) })).toBeVisible();
    expect((await scenarioSelect.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    expect((await lab.locator("fieldset label").first().boundingBox())?.height).toBeGreaterThanOrEqual(44);
    expect((await lab.getByRole("slider", { name: new RegExp(ragCopy.lab.topKLabel) }).boundingBox())?.height)
      .toBeGreaterThanOrEqual(44);
    await expect(lesson.locator('[data-figure-id="retrieval-scoreboard"] table caption'))
      .toHaveText(ragCopy.lessons["retrieval-engineering"].figure.title);

    const transcript = lesson.locator('[data-figure-id="retrieval-scoreboard"] details');
    await expect(transcript).not.toHaveAttribute("open", "");
    await transcript.locator("summary").click();
    await expect(transcript).toHaveAttribute("open", "");
    await expect(transcript.locator("ol > li"))
      .toHaveCount(ragCopy.lessons["retrieval-engineering"].figure.transcript.length);
    await expect(lesson.locator('a[target="_blank"]:not([rel~="noopener"])')).toHaveCount(0);
  });

  test("the licensed Claude figure and its provenance remain available without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    const response = await page.goto("/en/rag/ground-and-cite/");
    expect(response?.status()).toBe(200);
    const figure = page.locator('[data-figure-id="claude-support-rag-ui"]');
    await expect(figure.locator("img")).toBeVisible();
    await expect(figure.locator("figcaption")).toBeVisible();
    await expect(figure.locator('a[href="/courses/rag/NOTICE.md"]')).toBeVisible();
    await context.close();
  });

  for (const width of [390, 768]) {
    test(`dashboard, lab, and Arabic capstone do not overflow at ${width}px`, async ({ page }) => {
      test.setTimeout(60_000);
      await page.setViewportSize({ width, height: 900 });
      for (const path of [
        DASHBOARD,
        "/en/rag/retrieval-engineering/",
        "/ar/rag/production-capstone/",
      ]) {
        await page.goto(path);
        await page.evaluate(async () => { await document.fonts.ready; });
        const dimensions = await page.evaluate(() => ({
          client: document.documentElement.clientWidth,
          scroll: document.documentElement.scrollWidth,
        }));
        expect(dimensions.scroll, `${path} at ${width}px`)
          .toBeLessThanOrEqual(dimensions.client + 1);
      }
    });
  }

  test("the course honours reduced-motion preferences", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(DASHBOARD);
    expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
    const durations = await page.getByTestId("rag-course-dashboard").locator("header > div, header > figure")
      .evaluateAll((elements) => elements.map((element) => getComputedStyle(element).animationDuration));
    expect(durations.length).toBeGreaterThan(0);
    expect(durations.every((duration) => durationToMilliseconds(duration) <= 1)).toBe(true);
  });
});
