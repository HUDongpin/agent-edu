import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { Page } from "@playwright/test";
import { expect, test } from "../e2e/fixtures";
import { PROMPT_FIGURES } from "../lib/prompts/figures";
import {
  PROMPT_CAPSTONE_REQUIRED_COUNT,
  PROMPT_CAPSTONE_RUBRIC_COUNT,
  isPromptCapstonePassed,
  normalizePromptCapstoneProgress,
} from "../lib/prompts/capstone";
import {
  PROMPT_CAPSTONE_KEY,
  PROMPT_CAPSTONE_REQUIRED_KEY,
  PROMPT_CAPSTONE_SCORES_KEY,
  PROMPT_LEGACY_UNVERSIONED_QUIZ_BANK_VERSION,
  PROMPT_QUIZ_BANK_VERSION,
  PROMPT_QUIZ_BEST_KEY,
  PROMPT_QUIZ_MAX_SCORE,
  PROMPT_QUIZ_PASSED_KEY,
  PROMPT_QUIZ_VERSION_KEY,
  isCurrentPromptQuizResult,
  isLegacyPromptQuizResultForBank,
  isPromptQuizPassed,
} from "../lib/prompts/progress-keys";
import {
  PROMPT_LESSON_SLUGS,
  type PromptCourseCopy,
} from "../lib/prompts/types";
import { LOCALES } from "../lib/i18n";
import {
  publishedSitemapUrls,
  withIsolatedRoutePage,
} from "./published-course-test-helpers";

const promptCopy = JSON.parse(
  readFileSync(new URL("../messages/prompts/en.json", import.meta.url), "utf8"),
) as PromptCourseCopy;

const DASHBOARD = "/en/prompts/";

const RASTER_FIGURE_CASES = [
  { slug: "six-part-prompt", kind: "workbench" },
  { slug: "evaluation-flywheel", kind: "evaluation-loop" },
] as const;

const SEMANTIC_FIGURE_CASES = [
  { slug: "prompts-are-specifications", kind: "pipeline" },
  { slug: "instructions-and-data", kind: "authority" },
  { slug: "examples-and-contracts", kind: "few-shot" },
  { slug: "four-prompt-jobs", kind: "four-jobs" },
  { slug: "decompose-and-chain", kind: "chain" },
  { slug: "grounding-and-safety", kind: "evidence" },
  { slug: "capstone-prompt-packet", kind: "capstone" },
] as const;

const FINAL_QUIZ_ANSWER_KEY = [
  ["current-evidence-over-prompt-polish", 1],
  ["resolve-conflicting-constraints", 2],
  ["untrusted-message-boundary", 2],
  ["few-shot-regression-decision", 3],
  ["fidelity-before-word-count", 0],
  ["judge-needs-source-evidence", 1],
  ["chain-at-verification-boundary", 2],
  ["citation-support-check", 0],
  ["permissions-live-outside-prompt", 3],
] as const;

const FINAL_QUIZ_IDS = FINAL_QUIZ_ANSWER_KEY.map(([id]) => id);
const FINAL_QUIZ_CORRECT_INDEX = new Map<string, number>(FINAL_QUIZ_ANSWER_KEY);

const COMPLETE_CAPSTONE_PROGRESS = {
  [PROMPT_CAPSTONE_REQUIRED_KEY]: Object.fromEntries(
    Array.from({ length: PROMPT_CAPSTONE_REQUIRED_COUNT }, (_, index) => [index, true]),
  ),
  [PROMPT_CAPSTONE_SCORES_KEY]: Object.fromEntries(
    Array.from({ length: PROMPT_CAPSTONE_RUBRIC_COUNT }, (_, index) => [index, 2]),
  ),
  [PROMPT_CAPSTONE_KEY]: true,
} as const;

const SEMANTIC_RELATIONSHIPS = {
  pipeline: {
    nodes: ["task", "prompt", "model-and-tools", "output", "test", "evidence"],
    edges: ["task-to-prompt", "prompt-to-model-and-tools", "model-and-tools-to-output", "output-to-test", "evidence-to-model-and-tools"],
  },
  authority: {
    nodes: ["authoritative-task", "untrusted-source-data", "fact-with-paragraph-id", "embedded-instruction-stays-data", "structured-output"],
    edges: ["authoritative-task-to-structured-output", "fact-with-paragraph-id-to-structured-output"],
  },
  "few-shot": {
    nodes: ["same-task", "same-held-out-case", "zero-shot", "few-shot-examples", "compare-results"],
    edges: ["same-task-to-zero-shot", "same-task-to-few-shot", "held-out-case-to-zero-shot", "held-out-case-to-few-shot", "zero-shot-to-compare", "few-shot-to-compare"],
  },
  "four-jobs": {
    nodes: ["source", "job-1", "job-2", "job-3", "job-4"],
    edges: ["source-to-job-1", "source-to-job-2", "source-to-job-3", "source-to-job-4"],
  },
  chain: {
    nodes: ["source", "extract", "compare", "draft", "verify", "stop-if-evidence-is-missing"],
    edges: ["source-to-extract", "extract-to-compare", "compare-to-draft", "draft-to-verify", "verification-failure-to-stop"],
  },
  evidence: {
    nodes: ["claim-1", "paragraph-evidence-1", "claim-2", "paragraph-evidence-2", "claim-3", "no-matching-paragraph"],
    edges: ["claim-1-to-evidence-1", "claim-2-to-evidence-2", "claim-3-to-evidence-3"],
  },
  capstone: {
    nodes: ["prompt-card-section-1", "prompt-card-section-2", "prompt-card-section-3", "prompt-card-section-4", "prompt-card-section-5", "prompt-card-section-6"],
    edges: [],
  },
} as const;

type JsonLdNode = Record<string, unknown>;

async function readJsonLdNodes(page: Page): Promise<JsonLdNode[]> {
  const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
  return scripts.flatMap((text) => {
    const parsed = JSON.parse(text) as JsonLdNode;
    const graph = parsed["@graph"];
    return Array.isArray(graph) ? graph as JsonLdNode[] : [parsed];
  });
}

async function completeQuizAttempt(page: Page, correctAnswers: number) {
  for (let index = 0; index < FINAL_QUIZ_IDS.length; index += 1) {
    const form = page.locator("#prompts-final-quiz form");
    await expect(form).toBeVisible();

    const options = form.locator('input[type="radio"]');
    await expect(options).toHaveCount(4);
    const questionId = await options.first().getAttribute("name");
    expect(FINAL_QUIZ_IDS).toContain(questionId);

    const correct = FINAL_QUIZ_CORRECT_INDEX.get(questionId!);
    expect(correct).toBeDefined();
    const selected = index < correctAnswers ? correct! : (correct! + 1) % 4;
    await options.nth(selected).check();
    await form.getByRole("button", { name: "Check answer" }).click();

    const feedback = form.getByRole("status");
    await expect(feedback).toBeVisible();
    await expect(feedback.getByText(index < correctAnswers ? "Correct" : "Not yet", { exact: true })).toBeVisible();
    if (index >= correctAnswers) {
      const question = promptCopy.finalQuiz.questions.find((item) => item.id === questionId);
      await expect(feedback).toContainText(question!.misconceptions[selected]);
    }
    await expect(feedback.getByRole("link", { name: /^Source:/ })).toHaveAttribute("href", /^https:\/\//);
    await feedback.getByRole("button", {
      name: index === FINAL_QUIZ_IDS.length - 1
        ? "Finish knowledge check"
        : "Next question",
    }).click();
  }
}

test.describe("Course 7 dashboard and lesson routes", () => {
  test("dashboard identifies Course 7 and links exactly nine lessons", async ({ page }) => {
    const response = await page.goto(DASHBOARD);
    expect(response?.status()).toBe(200);

    const dashboard = page.getByTestId("prompts-course-dashboard");
    await expect(dashboard).toBeVisible();
    await expect(page).toHaveTitle(/How to Write Prompts/);
    await expect(dashboard.getByRole("heading", { level: 1, name: "How to Write Prompts" })).toBeVisible();
    await expect(dashboard.getByText("Course 7", { exact: true })).toBeVisible();
    const heroImage = dashboard.locator('img[src="/courses/prompts/prompt-workbench-v2.png"]');
    await expect(heroImage).toBeVisible();
    await expect(heroImage).toHaveAttribute("fetchpriority", "high");

    const lessonLinks = dashboard.locator(
      'section[aria-labelledby="prompts-curriculum-title"] ol > li > a',
    );
    await expect(lessonLinks).toHaveCount(9);
    expect(await lessonLinks.evaluateAll((links) => links.map((link) => link.getAttribute("href"))))
      .toEqual(PROMPT_LESSON_SLUGS.map((slug) => `/en/prompts/${slug}/`));
    await expect(dashboard.locator('section[aria-labelledby="prompt-capstone-title"]')).toHaveCount(0);
    await expect(dashboard.getByRole("link", { name: "Open capstone lesson" })).toHaveAttribute(
      "href",
      "/en/prompts/capstone-prompt-packet/",
    );
  });

  test("dashboard publishes a version-matched offline fixture pack", async ({ page, request }) => {
    await page.goto(DASHBOARD);
    const fixtureLink = page.getByRole("link", { name: "Download the offline fixture pack" });
    await expect(fixtureLink).toHaveAttribute("href", "/courses/prompts/course-7-fixture-pack-v1.json");
    await expect(fixtureLink).toHaveAttribute("download", "");

    const response = await request.get("/courses/prompts/course-7-fixture-pack-v1.json");
    expect(response.status()).toBe(200);
    const fixture = await response.json() as {
      courseId: string;
      courseVersion: string;
      purpose: string;
      usage: { offline: string[]; liveOptional: string };
      fixtures: Record<string, unknown> & {
        lesson8Grounding: { unsupportedAnswerKey: string };
      };
    };
    expect(fixture.courseId).toBe("how-to-write-prompts");
    expect(fixture.courseVersion).toBe("1.1.0");
    expect(fixture.purpose).toContain("offline inspection and revision planning");
    expect(fixture.usage.offline.join(" ")).toContain("paired live rerun");
    expect(fixture.usage.liveOptional).toContain("required for empirical before-and-after claims and a self-authored capstone");
    expect(`${fixture.purpose} ${fixture.usage.offline.join(" ")} ${fixture.usage.liveOptional}`)
      .not.toMatch(/every core exercise|complete Course 7 without an AI account/i);
    await expect(page.getByText(/every core exercise/i)).toHaveCount(0);
    expect(Object.keys(fixture.fixtures)).toEqual([
      "lesson3PolicyExtraction",
      "lesson4SupportClassification",
      "lesson5FactPreservingRewrite",
      "lesson6EvaluationSet",
      "lesson7DecisionEvidence",
      "lesson8Grounding",
      "lesson9RoughNotes",
    ]);
    expect(fixture.fixtures.lesson8Grounding.unsupportedAnswerKey).toBe(
      "Status: Not supported by the supplied source.\nMissing information:\n- Whether lunch is provided and, if so, the menu.",
    );
  });

  for (const slug of PROMPT_LESSON_SLUGS) {
    test(`English lesson ${slug} renders`, async ({ page }) => {
      const response = await page.goto(`/en/prompts/${slug}/`);
      expect(response?.status()).toBe(200);

      const lesson = page.getByTestId(`prompts-lesson-${slug}`);
      await expect(lesson).toBeVisible();
      await expect(lesson.getByRole("heading", {
        level: 1,
        name: promptCopy.lessons[slug].title,
      })).toBeVisible();
      await expect(lesson.locator('section[aria-labelledby="real-prompt-title"]')).toBeVisible();
      await expect(lesson.getByRole("button", { name: "Copy prompt" })).toBeVisible();
      await expect(lesson.getByRole("button", { name: "Check answer" })).toBeEnabled();
      await expect(lesson.locator("figure[data-figure-kind]")).toHaveCount(1);
      await expect(lesson.locator('section[aria-labelledby="prompt-sources-title"] li').first()).toBeVisible();
      if (PROMPT_LESSON_SLUGS.indexOf(slug) >= 2) {
        await expect(
          lesson.locator('section[aria-labelledby="prompt-practice-title"]')
            .getByRole("link", { name: "Download the offline fixture pack" }),
        ).toHaveAttribute("href", "/courses/prompts/course-7-fixture-pack-v1.json");
      }
    });
  }
});

test.describe("original raster and semantic teaching figures", () => {
  test("the release contract contains exactly two raster and seven semantic figures", () => {
    expect(PROMPT_FIGURES.filter((figure) => figure.raster !== null)).toHaveLength(2);
    expect(PROMPT_FIGURES.filter((figure) => figure.raster === null)).toHaveLength(7);
    expect(RASTER_FIGURE_CASES).toHaveLength(2);
    expect(SEMANTIC_FIGURE_CASES).toHaveLength(7);
  });

  for (const { slug, kind } of RASTER_FIGURE_CASES) {
    test(`${kind} raster is local, authentic, dimensioned, and transcribed`, async ({ page, request }) => {
      const manifest = PROMPT_FIGURES.find((figure) => figure.kind === kind);
      expect(manifest?.format).toBe("original-raster-with-transcript");
      expect(manifest?.raster).not.toBeNull();
      const raster = manifest!.raster!;

      for (const [path, expectedHash, expectedType] of [
        [raster.pngPath, raster.pngSha256, "image/png"],
        [raster.webpPath, raster.webpSha256, "image/webp"],
      ] as const) {
        const response = await request.get(path);
        expect(response.status(), path).toBe(200);
        expect(response.headers()["content-type"], path).toContain(expectedType);
        expect(createHash("sha256").update(await response.body()).digest("hex"), path).toBe(expectedHash);
      }

      await page.goto(`/en/prompts/${slug}/`);
      const figure = page.locator(`figure[data-figure-kind="${kind}"]`);
      await expect(figure).toBeVisible();
      await expect(figure.locator("a")).toHaveAttribute("href", raster.pngPath);
      await expect(figure.locator("source")).toHaveAttribute("srcset", raster.webpPath);

      const image = figure.locator("img");
      await expect(image).toHaveAttribute("src", raster.pngPath);
      await expect(image).toHaveAttribute("width", String(raster.width));
      await expect(image).toHaveAttribute("height", String(raster.height));
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((node: HTMLImageElement) => (
        node.complete && node.currentSrc.length > 0 && node.naturalWidth > 0
      ))).toBe(true);
      const evidence = await image.evaluate(async (node: HTMLImageElement) => {
        const response = await fetch(node.currentSrc);
        const bitmap = await createImageBitmap(await response.blob());
        const result = {
          currentPath: new URL(node.currentSrc).pathname,
          responseStatus: response.status,
          contentType: response.headers.get("content-type"),
          naturalWidth: node.naturalWidth,
          naturalHeight: node.naturalHeight,
          decodedWidth: bitmap.width,
          decodedHeight: bitmap.height,
        };
        bitmap.close();
        return result;
      });
      expect(evidence.currentPath).toBe(raster.webpPath);
      expect(evidence.responseStatus).toBe(200);
      expect(evidence.contentType).toContain("image/webp");
      expect(evidence.naturalWidth / evidence.naturalHeight).toBeCloseTo(
        raster.webpWidth / raster.webpHeight,
        2,
      );
      expect(evidence.decodedWidth).toBe(raster.webpWidth);
      expect(evidence.decodedHeight).toBe(raster.webpHeight);
      await expect(figure.getByText("Text shown in the image", { exact: true })).toBeVisible();
      await expect(figure.locator("figcaption")).not.toBeEmpty();
    });
  }

  for (const { slug, kind } of SEMANTIC_FIGURE_CASES) {
    test(`${kind} remains a semantic HTML figure`, async ({ page }) => {
      await page.goto(`/en/prompts/${slug}/`);
      const figure = page.locator(`figure[data-figure-kind="${kind}"]`);
      await expect(figure).toBeVisible();
      await expect(figure.getByRole("img")).toBeVisible();
      await expect(figure.locator("img")).toHaveCount(0);
      await expect(figure.locator("figcaption")).not.toBeEmpty();
      const relationship = SEMANTIC_RELATIONSHIPS[kind];
      for (const node of relationship.nodes) {
        await expect(figure.locator(`[data-node="${node}"]`), `${kind} node ${node}`).toHaveCount(1);
      }
      for (const edge of relationship.edges) {
        await expect(figure.locator(`[data-edge="${edge}"]`), `${kind} edge ${edge}`).toHaveCount(1);
      }
      if (kind === "few-shot" || kind === "capstone") {
        for (const label of promptCopy.lessons[slug].figure.labels) {
          await expect(figure.getByText(label, { exact: true }), `${kind} label ${label}`).toBeVisible();
        }
      }
    });
  }

  test("the copy action writes the exact real prompt", async ({ browserName, context, page }) => {
    if (browserName !== "chromium") {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: {
            writeText: async (text: string) => {
              (window as typeof window & { __promptClipboardText?: string }).__promptClipboardText = text;
            },
          },
        });
      });
    }
    await page.goto("/en/prompts/six-part-prompt/");
    if (browserName === "chromium") {
      await context.grantPermissions(
        ["clipboard-read", "clipboard-write"],
        { origin: new URL(page.url()).origin },
      );
    }

    const studio = page.locator('section[aria-labelledby="real-prompt-title"]');
    const expectedPrompt = await studio.locator("pre code").textContent();
    expect(expectedPrompt).toBeTruthy();
    const copyButton = studio.locator("button");
    await copyButton.click();
    await expect(copyButton).toContainText("Copied");
    if (browserName === "chromium") {
      await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expectedPrompt);
    } else {
      await expect.poll(() => page.evaluate(() => (
        (window as typeof window & { __promptClipboardText?: string }).__promptClipboardText
      ))).toBe(expectedPrompt);
    }
  });

  test("clipboard failure explains the manual recovery path", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: async () => { throw new DOMException("denied"); } },
      });
    });
    await page.goto("/en/prompts/prompts-are-specifications/");
    await page.getByRole("button", { name: "Copy prompt" }).click();
    await expect(page.getByRole("status")).toContainText(
      "Copy failed. Select the prompt text and copy it manually.",
    );
    await expect(page.getByRole("button", { name: "Copy prompt" })).toBeEnabled();
  });

  test("a later clipboard failure is not hidden by an earlier success timer", async ({ page }) => {
    await page.addInitScript(() => {
      let calls = 0;
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async () => {
            calls += 1;
            if (calls > 1) throw new DOMException("denied");
          },
        },
      });
    });
    await page.goto("/en/prompts/prompts-are-specifications/");
    const copy = page.locator("button").filter({ hasText: /^(Copy prompt|Copied)$/ }).first();
    await copy.click();
    await expect(copy).toHaveText("Copied");
    await copy.click();
    const recovery = page.getByRole("status").filter({ hasText: "Copy failed" });
    await expect(recovery).toBeVisible();
    await page.waitForTimeout(1_900);
    await expect(recovery).toContainText("Select the prompt text and copy it manually.");
  });
});

test.describe("Course 7 accessibility contract", () => {
  for (const path of [DASHBOARD, "/en/prompts/instructions-and-data/"] as const) {
    test(`${path} keeps names, labels, media alternatives, and unique anchors`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);

      const audit = await page.evaluate(() => {
        const duplicateIds = [...document.querySelectorAll<HTMLElement>("[id]")]
          .map((element) => element.id)
          .filter((id, index, ids) => ids.indexOf(id) !== index);
        const imagesWithoutAlternatives = [...document.querySelectorAll<HTMLImageElement>("img")]
          .filter((image) => !image.hasAttribute("alt") || !image.hasAttribute("width") || !image.hasAttribute("height"))
          .map((image) => image.currentSrc || image.src);
        const controlsWithoutLabels = [...document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea")]
          .filter((control) => !control.labels?.length && !control.getAttribute("aria-label") && !control.getAttribute("aria-labelledby"))
          .map((control) => `${control.tagName.toLowerCase()}[name="${control.getAttribute("name") ?? ""}"]`);
        const actionsWithoutNames = [...document.querySelectorAll<HTMLButtonElement | HTMLAnchorElement>("button, a[href]")]
          .filter((element) => {
            const text = element.textContent?.trim();
            const aria = element.getAttribute("aria-label")?.trim();
            const imageAlt = element.querySelector<HTMLImageElement>("img[alt]")?.alt.trim();
            return !text && !aria && !imageAlt;
          })
          .map((element) => element.outerHTML.slice(0, 160));
        const headingLevels = [...document.querySelectorAll<HTMLHeadingElement>("h1, h2, h3, h4, h5, h6")]
          .map((heading) => Number(heading.tagName.slice(1)));
        const headingJumps = headingLevels
          .map((level, index) => index === 0 ? 0 : level - headingLevels[index - 1])
          .filter((jump) => jump > 1);

        return {
          duplicateIds: [...new Set(duplicateIds)],
          imagesWithoutAlternatives,
          controlsWithoutLabels,
          actionsWithoutNames,
          headingJumps,
          hasSkipLink: Boolean(document.querySelector('a[href="#main"]')),
          hasMainTarget: Boolean(document.querySelector("main#main")),
        };
      });

      expect(audit).toEqual({
        duplicateIds: [],
        imagesWithoutAlternatives: [],
        controlsWithoutLabels: [],
        actionsWithoutNames: [],
        headingJumps: [],
        hasSkipLink: true,
        hasMainTarget: true,
      });

      await page.keyboard.press("Tab");
      const focused = await page.evaluate(() => {
        const element = document.activeElement as HTMLElement | null;
        const style = element ? getComputedStyle(element) : null;
        return {
          href: element?.getAttribute("href"),
          focusVisible: element?.matches(":focus-visible") ?? false,
          outlineStyle: style?.outlineStyle,
          outlineWidth: style?.outlineWidth,
        };
      });
      expect(focused.href).toBe("#main");
      expect(focused.focusVisible).toBe(true);
      expect(focused.outlineStyle).not.toBe("none");
      expect(focused.outlineWidth).not.toBe("0px");
    });
  }

  test("scrollable prompt text is keyboard reachable with a visible focus treatment", async ({ page }) => {
    await page.goto("/en/prompts/six-part-prompt/");
    const prompt = page.locator('pre[aria-label="Testable prompt"]');
    await expect(prompt).toHaveAttribute("tabindex", "0");
    await prompt.focus();
    await expect(prompt).toBeFocused();
    expect(await prompt.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe("none");
  });

  test("long lessons expose direct links to their core learning tasks", async ({ page }) => {
    await page.goto("/en/prompts/prompts-are-specifications/");
    const contents = page.getByRole("navigation", { name: "In this lesson" });
    await expect(contents.getByRole("link")).toHaveCount(5);
    expect(await contents.getByRole("link").evaluateAll((links) => links.map((link) => link.getAttribute("href"))))
      .toEqual([
        "#lesson-objective-title",
        "#real-prompt-title",
        "#prompt-practice-title",
        "#checkpoint-prompts-are-specifications-title",
        "#prompt-sources-title",
      ]);
  });

  test("the long capstone lesson links directly to its evidence rubric", async ({ page }) => {
    await page.goto("/en/prompts/capstone-prompt-packet/");
    const contents = page.getByRole("navigation", { name: "In this lesson" });
    await expect(contents.getByRole("link")).toHaveCount(6);
    await expect(contents.getByRole("link", { name: "Capstone evidence packet" }))
      .toHaveAttribute("href", "#prompt-capstone-title");
    await contents.getByRole("link", { name: "Capstone evidence packet" }).click();
    await expect(page).toHaveURL(/#prompt-capstone-title$/);
    const heading = page.locator("#prompt-capstone-title");
    expect(await heading.evaluate((element) => element.getBoundingClientRect().top))
      .toBeGreaterThanOrEqual(0);
  });

  test("client lesson navigation keeps the focused lesson heading visibly outlined", async ({ page }) => {
    await page.goto(DASHBOARD);
    await page.getByRole("link", { name: /Start with lesson 1/ }).click();
    const heading = page.getByRole("heading", {
      level: 1,
      name: "Prompts are specifications, not magic spells",
    });
    await expect(heading).toBeFocused();
    const outline = await heading.evaluate((element) => {
      const style = getComputedStyle(element);
      return { style: style.outlineStyle, width: style.outlineWidth };
    });
    expect(outline.style).not.toBe("none");
    expect(outline.width).not.toBe("0px");
  });

  test("formative and final assessment transitions move focus to new content", async ({ page }) => {
    await page.goto("/en/prompts/prompts-are-specifications/");
    const checkpoint = page.locator('section[aria-labelledby^="checkpoint-"]');
    await checkpoint.locator('input[type="radio"]').nth(1).check();
    await checkpoint.getByRole("button", { name: "Check answer" }).click();
    await expect(checkpoint.getByRole("status")).toBeFocused();

    await page.goto(DASHBOARD);
    await page.getByRole("button", { name: "Begin knowledge check" }).click();
    const quiz = page.locator("#prompts-final-quiz");
    await expect(quiz.locator("h3")).toBeFocused();
    await quiz.locator('input[type="radio"]').nth(FINAL_QUIZ_ANSWER_KEY[0][1]).check();
    await quiz.getByRole("button", { name: "Check answer" }).click();
    await expect(quiz.getByRole("status")).toBeFocused();
    await quiz.getByRole("button", { name: "Next question" }).click();
    await expect(quiz.locator("h3")).toBeFocused();
    await expect(quiz.locator("h3")).toContainText(promptCopy.finalQuiz.questions[1].question);
  });

  test("manual theme selection also themes native browser controls", async ({ page }) => {
    await page.goto(DASHBOARD);
    await page.getByRole("button", { name: "Switch to the dark theme" }).click();
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme))
      .toBe("dark");
    await page.getByRole("button", { name: "Switch to the light theme" }).click();
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme))
      .toBe("light");
  });
});

test.describe("private Course 7 progress and assessment", () => {
  test("final quiz uses an independent transfer bank and fixed answer key", () => {
    expect(FINAL_QUIZ_IDS).toHaveLength(PROMPT_QUIZ_MAX_SCORE);
    expect(promptCopy.finalQuiz.passScore).toBe(7);
    expect(promptCopy.finalQuiz.questions.map((question) => [question.id, question.correctIndex]))
      .toEqual(FINAL_QUIZ_ANSWER_KEY.map(([id, correctIndex]) => [id, correctIndex]));
    const formativeQuestions = new Set(
      PROMPT_LESSON_SLUGS.map((slug) => promptCopy.lessons[slug].checkpoint.question),
    );
    for (const question of promptCopy.finalQuiz.questions) {
      expect(formativeQuestions.has(question.question)).toBe(false);
      expect(question.misconceptions).toHaveLength(4);
      expect(question.sourceId).toBeTruthy();
      expect(question.claimId).toBeTruthy();
    }
  });

  test("quiz credit preserves the exact legacy bank and rejects stale or malformed results", () => {
    const validLegacy = {
      [PROMPT_QUIZ_BEST_KEY]: 7,
      [PROMPT_QUIZ_PASSED_KEY]: true,
    };
    expect(PROMPT_QUIZ_BANK_VERSION).toBe(PROMPT_LEGACY_UNVERSIONED_QUIZ_BANK_VERSION);
    expect(isLegacyPromptQuizResultForBank(validLegacy, PROMPT_QUIZ_BANK_VERSION)).toBe(true);
    expect(isLegacyPromptQuizResultForBank(validLegacy, "future-bank.v2")).toBe(false);
    expect(isCurrentPromptQuizResult(validLegacy)).toBe(true);
    expect(isPromptQuizPassed(validLegacy)).toBe(true);

    const invalidBestScores = [-1, 7.5, PROMPT_QUIZ_MAX_SCORE + 1, "7", null];
    for (const best of invalidBestScores) {
      const malformed = {
        [PROMPT_QUIZ_VERSION_KEY]: PROMPT_QUIZ_BANK_VERSION,
        [PROMPT_QUIZ_BEST_KEY]: best,
        [PROMPT_QUIZ_PASSED_KEY]: true,
      };
      expect(isCurrentPromptQuizResult(malformed)).toBe(false);
      expect(isPromptQuizPassed(malformed)).toBe(false);
    }

    expect(isPromptQuizPassed({
      [PROMPT_QUIZ_VERSION_KEY]: "stale-bank.v0",
      [PROMPT_QUIZ_BEST_KEY]: 9,
      [PROMPT_QUIZ_PASSED_KEY]: true,
    })).toBe(false);
    expect(isPromptQuizPassed({
      [PROMPT_QUIZ_VERSION_KEY]: PROMPT_QUIZ_BANK_VERSION,
      [PROMPT_QUIZ_BEST_KEY]: 0,
      [PROMPT_QUIZ_PASSED_KEY]: true,
    })).toBe(false);
  });

  test("capstone credit requires the complete current evidence shape and normalizes retired indexes", () => {
    expect(isPromptCapstonePassed(COMPLETE_CAPSTONE_PROGRESS)).toBe(true);

    const malformedRecords: Record<string, unknown>[] = [
      { [PROMPT_CAPSTONE_KEY]: true },
      {
        ...COMPLETE_CAPSTONE_PROGRESS,
        [PROMPT_CAPSTONE_REQUIRED_KEY]: { 0: true, 1: true, 2: true, 3: true, 4: true },
      },
      {
        ...COMPLETE_CAPSTONE_PROGRESS,
        [PROMPT_CAPSTONE_SCORES_KEY]: { 0: 0, 1: 2, 2: 2, 3: 2, 4: 2 },
      },
      {
        ...COMPLETE_CAPSTONE_PROGRESS,
        [PROMPT_CAPSTONE_SCORES_KEY]: { 0: "2", 1: 2, 2: 2, 3: 2, 4: 2 },
      },
      { ...COMPLETE_CAPSTONE_PROGRESS, [PROMPT_CAPSTONE_KEY]: false, "prompts.capstone.v1": true },
    ];
    for (const malformed of malformedRecords) {
      expect(isPromptCapstonePassed(malformed)).toBe(false);
    }

    const withRetiredIndexes: Record<string, unknown> = {
      ...COMPLETE_CAPSTONE_PROGRESS,
      [PROMPT_CAPSTONE_REQUIRED_KEY]: {
        ...COMPLETE_CAPSTONE_PROGRESS[PROMPT_CAPSTONE_REQUIRED_KEY],
        6: true,
      },
      [PROMPT_CAPSTONE_SCORES_KEY]: {
        ...COMPLETE_CAPSTONE_PROGRESS[PROMPT_CAPSTONE_SCORES_KEY],
        5: 2,
      },
    };
    expect(isPromptCapstonePassed(withRetiredIndexes)).toBe(false);
    expect(normalizePromptCapstoneProgress(withRetiredIndexes)).toBe(true);
    expect(isPromptCapstonePassed(withRetiredIndexes)).toBe(true);
  });

  test("practice persists and Course 7 reset preserves unrelated progress", async ({ context }) => {
    const practicePage = await context.newPage();
    try {
      const dashboardResponse = await practicePage.goto(DASHBOARD);
      expect(dashboardResponse?.status()).toBe(200);
      await practicePage.evaluate(() => {
        localStorage.setItem("ae.progress", JSON.stringify({
          "codex.lesson.meet-codex": true,
          play0: true,
          unrelated: "keep me",
        }));
      });

      const lessonResponse = await practicePage.goto(
        "/en/prompts/prompts-are-specifications/",
      );
      expect(lessonResponse?.status()).toBe(200);
      await practicePage
        .getByRole("button", { name: "I completed the practice" })
        .click();
      await expect(
        practicePage.getByRole("button", { name: "Mark practice incomplete" }),
      ).toHaveAttribute("aria-pressed", "true");
      const reloadResponse = await practicePage.reload();
      expect(reloadResponse?.status()).toBe(200);
      await expect(
        practicePage.getByRole("button", { name: "Mark practice incomplete" }),
      ).toHaveAttribute("aria-pressed", "true");
      await practicePage.getByRole("button", { name: "Mark practice incomplete" }).click();
      await expect(practicePage.getByRole("button", { name: "I completed the practice" }))
        .toHaveAttribute("aria-pressed", "false");
      await practicePage.getByRole("button", { name: "I completed the practice" }).click();

      const stored = await practicePage.evaluate(
        () => JSON.parse(localStorage.getItem("ae.progress") || "{}"),
      );
      expect(stored["prompts.lesson.prompts-are-specifications.practice"]).toBe(true);
      expect(stored["codex.lesson.meet-codex"]).toBe(true);
      expect(stored.play0).toBe(true);
    } finally {
      await practicePage.close();
    }

    const dashboardPage = await context.newPage();
    try {
      const response = await dashboardPage.goto(DASHBOARD);
      expect(response, "resume dashboard document response").not.toBeNull();
      expect(response!.status()).toBe(200);
      await expect(
        dashboardPage
          .getByTestId("prompts-course-dashboard")
          .locator("progress"),
      ).toHaveAttribute("value", "1");
      await expect(
        dashboardPage.locator('a[href="/en/prompts/prompts-are-specifications/"] [data-complete="true"]'),
      ).toHaveCount(1);
      dashboardPage.once("dialog", async (dialog) => {
        expect(dialog.message()).toBe("Reset only your saved Course 7 progress?");
        await dialog.accept();
      });
      await dashboardPage
        .getByRole("button", { name: "Reset Course 7 progress" })
        .click();
      await expect(
        dashboardPage.getByText("Course 7 progress reset.", { exact: true }),
      ).toBeVisible();

      const stored = await dashboardPage.evaluate(
        () => JSON.parse(localStorage.getItem("ae.progress") || "{}"),
      );
      expect(
        Object.keys(stored).filter((key) => key.startsWith("prompts.")),
      ).toEqual([]);
      expect(stored).toEqual({
        "codex.lesson.meet-codex": true,
        play0: true,
        unrelated: "keep me",
      });
    } finally {
      await dashboardPage.close();
    }
  });

  test("Course 7 reset cancels mounted quiz drafts and finished results", async ({ page }) => {
    await page.goto(DASHBOARD);
    const quiz = page.locator("#prompts-final-quiz");
    const reset = page.getByRole("button", { name: "Reset Course 7 progress" });
    const confirmReset = async () => {
      page.once("dialog", async (dialog) => {
        expect(dialog.message()).toBe("Reset only your saved Course 7 progress?");
        await dialog.accept();
      });
      await reset.click();
      await expect(page.getByText("Course 7 progress reset.", { exact: true })).toBeVisible();
      await expect(quiz.getByRole("button", { name: "Begin knowledge check" })).toBeVisible();
      await expect.poll(() => page.evaluate(() => Object.keys(
        JSON.parse(localStorage.getItem("ae.progress") || "{}"),
      ).filter((key) => key.startsWith("prompts.")))).toEqual([]);
    };

    await quiz.getByRole("button", { name: "Begin knowledge check" }).click();
    await quiz.locator('input[type="radio"]').first().check();
    await expect.poll(() => page.evaluate(() => {
      const record = JSON.parse(localStorage.getItem("ae.progress") || "{}");
      return record["prompts.quiz.draft.v1"]?.selected;
    })).toBe(0);
    await confirmReset();
    await page.waitForTimeout(50);
    expect(await page.evaluate(() => Object.keys(
      JSON.parse(localStorage.getItem("ae.progress") || "{}"),
    ).some((key) => key.startsWith("prompts.")))).toBe(false);

    await quiz.getByRole("button", { name: "Begin knowledge check" }).click();
    await completeQuizAttempt(page, 7);
    await expect(page.getByText("Knowledge check passed", { exact: true })).toBeVisible();
    await confirmReset();
    await expect(page.getByText(/Score: 7 of 9/)).toHaveCount(0);
  });

  test("a reset write failure is reported as session-only and never as durable", async ({ page }) => {
    await page.goto(DASHBOARD);
    await page.evaluate(() => {
      localStorage.setItem("ae.progress", JSON.stringify({
        "prompts.lesson.prompts-are-specifications.practice": true,
      }));
    });
    await page.reload();
    await expect(page.locator('section[aria-labelledby="prompts-progress-title"] progress'))
      .toHaveAttribute("value", "1");

    await page.evaluate(() => {
      const target = window as Window & {
        __promptOriginalSetItem?: typeof Storage.prototype.setItem;
      };
      target.__promptOriginalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function setItem(key: string, value: string) {
        if (key === "ae.progress") throw new DOMException("quota", "QuotaExceededError");
        return target.__promptOriginalSetItem!.call(this, key, value);
      };
    });
    page.once("dialog", async (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Reset Course 7 progress" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Progress was cleared for this session" }))
      .toContainText("Reloading may restore the saved record.");
    await expect(page.getByText(/Browser storage is unavailable/).first()).toBeVisible();

    await page.evaluate(() => {
      const target = window as Window & {
        __promptOriginalSetItem?: typeof Storage.prototype.setItem;
      };
      if (target.__promptOriginalSetItem) Storage.prototype.setItem = target.__promptOriginalSetItem;
    });
    await page.reload();
    await expect(page.locator('section[aria-labelledby="prompts-progress-title"] progress'))
      .toHaveAttribute("value", "1");
  });

  test("storage denial is disclosed while practice remains usable in memory", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(Storage.prototype, "getItem", {
        configurable: true,
        value: () => { throw new DOMException("denied"); },
      });
      Object.defineProperty(Storage.prototype, "setItem", {
        configurable: true,
        value: () => { throw new DOMException("denied"); },
      });
    });

    await page.goto("/en/prompts/prompts-are-specifications/");
    await expect(page.getByText(/Browser storage is unavailable/)).toBeVisible();
    await page.getByRole("button", { name: "I completed the practice" }).click();
    await expect(page.getByRole("button", { name: "Mark practice incomplete" }))
      .toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("prompts-lesson-prompts-are-specifications")).toBeVisible();
  });

  test("course progress names the capstone and final knowledge check destinations", async ({ page }) => {
    await page.goto(DASHBOARD);
    await page.evaluate((slugs) => {
      localStorage.setItem("ae.progress", JSON.stringify(Object.fromEntries(slugs.map((slug) => [
        `prompts.lesson.${slug}.practice`,
        true,
      ]))));
    }, PROMPT_LESSON_SLUGS);
    await page.reload();

    const journey = page.locator('section[aria-labelledby="prompts-progress-title"]');
    await expect(journey.getByRole("link", { name: /Capstone evidence packet/ })).toHaveAttribute(
      "href",
      "/en/prompts/capstone-prompt-packet/",
    );
    await expect(journey).toContainText("9 / 9");
    await expect(journey).toContainText("0 / 1");

    await page.evaluate((capstone) => {
      const record = JSON.parse(localStorage.getItem("ae.progress") || "{}");
      Object.assign(record, capstone);
      localStorage.setItem("ae.progress", JSON.stringify(record));
      window.dispatchEvent(new Event("aicourse:prompts-progress"));
    }, COMPLETE_CAPSTONE_PROGRESS);
    await expect(journey.getByRole("link", { name: /Final knowledge check/ })).toHaveAttribute(
      "href",
      "#prompts-final-quiz",
    );
    await journey.getByRole("link", { name: /Final knowledge check/ }).click();
    await expect(page.locator("#prompts-final-quiz-title")).toBeFocused();
  });

  test("a valid result from the unchanged unversioned quiz bank keeps its credit and migrates lazily", async ({ page }) => {
    await page.goto(DASHBOARD);
    await page.evaluate(({ slugs, capstone, quiz }) => {
      const record = Object.fromEntries(slugs.map((slug) => [
        `prompts.lesson.${slug}.practice`,
        true,
      ]));
      Object.assign(record, capstone, quiz);
      localStorage.setItem("ae.progress", JSON.stringify(record));
    }, {
      slugs: PROMPT_LESSON_SLUGS,
      capstone: COMPLETE_CAPSTONE_PROGRESS,
      quiz: {
        [PROMPT_QUIZ_BEST_KEY]: 7,
        [PROMPT_QUIZ_PASSED_KEY]: true,
      },
    });
    await page.reload();

    const journey = page.locator('section[aria-labelledby="prompts-progress-title"]');
    await expect(journey.locator("progress")).toHaveAttribute("value", "11");
    await expect(journey.getByRole("link", { name: "Review" })).toBeVisible();
    expect(await page.evaluate(() => {
      const record = JSON.parse(localStorage.getItem("ae.progress") || "{}");
      return record["prompts.quiz.version"];
    })).toBeUndefined();

    await page.goto("/en/prompts/prompts-are-specifications/");
    await page.getByRole("button", { name: "Mark practice incomplete" }).click();
    expect(await page.evaluate(() => {
      const record = JSON.parse(localStorage.getItem("ae.progress") || "{}");
      return record["prompts.quiz.version"];
    })).toBe(PROMPT_QUIZ_BANK_VERSION);
    await page.getByRole("button", { name: "I completed the practice" }).click();

    await page.goto("/en/courses/");
    await expect(page.locator("#how-to-write-prompts").getByRole("progressbar", {
      name: "How to Write Prompts: progress",
    })).toHaveAttribute("aria-valuenow", "100");
  });

  test("six of nine fails and the exact seven-of-nine boundary passes", async ({ page }) => {
    await page.goto(DASHBOARD);
    await page.getByRole("button", { name: "Begin knowledge check" }).click();
    await expect(page.getByRole("button", { name: "Check answer" })).toBeEnabled();
    await completeQuizAttempt(page, 6);
    await expect(page.getByText("Score: 6 of 9", { exact: true })).toBeVisible();
    await expect(page.getByText("Review the explanations and try again", { exact: true })).toBeVisible();

    let stored = await page.evaluate(() => JSON.parse(localStorage.getItem("ae.progress") || "{}"));
    expect(stored["prompts.quiz.version"]).toBe("2026-08-23.v1");
    expect(stored["prompts.quiz.best"]).toBe(6);
    expect(stored["prompts.quiz.passed"]).toBe(false);

    await page.getByRole("button", { name: "Try another attempt" }).click();
    await completeQuizAttempt(page, 7);
    await expect(page.getByText("Score: 7 of 9", { exact: true })).toBeVisible();
    await expect(page.getByText("Knowledge check passed", { exact: true })).toBeVisible();

    stored = await page.evaluate(() => JSON.parse(localStorage.getItem("ae.progress") || "{}"));
    expect(stored["prompts.quiz.best"]).toBe(7);
    expect(stored["prompts.quiz.passed"]).toBe(true);
  });

  test("an in-progress knowledge check resumes the exact question after refresh", async ({ page }) => {
    await page.goto(DASHBOARD);
    await page.getByRole("button", { name: "Begin knowledge check" }).click();
    const quiz = page.locator("#prompts-final-quiz");
    await quiz.locator('input[type="radio"]').nth(FINAL_QUIZ_ANSWER_KEY[0][1]).check();
    await quiz.getByRole("button", { name: "Check answer" }).click();
    await quiz.getByRole("button", { name: "Next question" }).click();
    await quiz.locator('input[type="radio"]').nth(2).check();

    await expect.poll(() => page.evaluate(() => {
      const progress = JSON.parse(localStorage.getItem("ae.progress") || "{}");
      return progress["prompts.quiz.draft.v1"]?.questionId;
    })).toBe(FINAL_QUIZ_IDS[1]);

    await page.reload();
    await expect(quiz.locator("h3")).toContainText(promptCopy.finalQuiz.questions[1].question);
    await expect(quiz.locator('input[type="radio"]').nth(2)).toBeChecked();
    await expect(quiz.locator("h3")).toBeFocused();
  });

  test("capstone requires every artefact, an 8-of-10 score, and no criterion scored zero", async ({ page }) => {
    await page.goto("/en/prompts/capstone-prompt-packet/");
    const capstone = page.locator('section[aria-labelledby="prompt-capstone-title"]').first();
    expect(await capstone.evaluate((element) => {
      const completion = document.querySelector('button[aria-pressed]')?.closest("section");
      return Boolean(
        completion
        && (element.compareDocumentPosition(completion) & Node.DOCUMENT_POSITION_FOLLOWING),
      );
    })).toBe(true);
    const recordButton = capstone.getByRole("button", { name: "Record self-attested pass" });
    await expect(recordButton).toBeDisabled();
    await expect(capstone.getByText(
      "Pass: 8 of 10 points, with no criterion scored 0.",
      { exact: true },
    )).toBeVisible();

    const artefacts = capstone.locator('input[type="checkbox"]');
    await expect(artefacts).toHaveCount(6);
    expect(await artefacts.evaluateAll((inputs) => inputs.map((input) => input.getAttribute("name"))))
      .toEqual([
        "capstone-evidence-1",
        "capstone-evidence-2",
        "capstone-evidence-3",
        "capstone-evidence-4",
        "capstone-evidence-5",
        "capstone-evidence-6",
      ]);
    for (let index = 0; index < 6; index += 1) await artefacts.nth(index).check();

    const criteria = capstone.locator("fieldset");
    await expect(criteria).toHaveCount(5);
    for (let index = 0; index < 5; index += 1) {
      await criteria.nth(index).locator('input[value="2"]').check();
    }
    for (let index = 0; index < 5; index += 1) {
      await criteria.nth(index).locator('input[value="0"]').check();
      await expect(capstone.getByText("Rubric score: 8 / 10", { exact: true })).toBeVisible();
      await expect(recordButton).toBeDisabled();
      await expect(capstone.getByText(
        "Revise the packet until it reaches the pass rule.",
        { exact: true },
      )).toBeVisible();
      await criteria.nth(index).locator('input[value="2"]').check();
    }
    await expect(capstone.getByText("Rubric score: 10 / 10", { exact: true })).toBeVisible();
    await expect(recordButton).toBeEnabled();
    await recordButton.click();
    await expect(capstone.getByRole("button", { name: "Edit self-assessment" })).toBeEnabled();

    let stored = await page.evaluate(() => JSON.parse(localStorage.getItem("ae.progress") || "{}"));
    expect(stored["prompts.capstone.v2.passed"]).toBe(true);
    expect(Object.values(stored["prompts.capstone.v2.required"])).toEqual([true, true, true, true, true, true]);
    expect(Object.values(stored["prompts.capstone.v2.scores"])).toEqual([2, 2, 2, 2, 2]);

    await page.reload();
    const restored = page.locator('section[aria-labelledby="prompt-capstone-title"]').first();
    await expect(restored.locator('input[type="checkbox"]:checked')).toHaveCount(6);
    await expect(restored.locator('input[type="radio"]:checked')).toHaveCount(5);
    const edit = restored.getByRole("button", { name: "Edit self-assessment" });
    await expect(edit).toBeEnabled();
    stored = await page.evaluate(() => JSON.parse(localStorage.getItem("ae.progress") || "{}"));
    expect(stored["prompts.capstone.v2.passed"]).toBe(true);
    await edit.click();
    await expect(restored.getByRole("button", { name: "Record self-attested pass" })).toBeEnabled();
    await expect(restored.locator('input[type="checkbox"]:checked')).toHaveCount(6);
    await expect(restored.locator('input[type="radio"]:checked')).toHaveCount(5);
    stored = await page.evaluate(() => JSON.parse(localStorage.getItem("ae.progress") || "{}"));
    expect(stored["prompts.capstone.v2.passed"]).toBe(false);
  });

  test("retired capstone indexes are normalized without forcing a full course reset", async ({ page }) => {
    await page.goto("/en/prompts/capstone-prompt-packet/");
    await page.evaluate((capstone) => {
      const record = structuredClone(capstone) as Record<string, unknown>;
      (record["prompts.capstone.v2.required"] as Record<string, unknown>)["6"] = true;
      (record["prompts.capstone.v2.scores"] as Record<string, unknown>)["5"] = 2;
      localStorage.setItem("ae.progress", JSON.stringify(record));
    }, COMPLETE_CAPSTONE_PROGRESS);
    await page.reload();

    const capstone = page.locator('section[aria-labelledby="prompt-capstone-title"]').first();
    await expect(capstone.getByRole("button", { name: "Edit self-assessment" })).toBeEnabled();
    await capstone.getByRole("button", { name: "Edit self-assessment" }).click();
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("ae.progress") || "{}"));
    expect(Object.keys(stored["prompts.capstone.v2.required"])).toEqual(["0", "1", "2", "3", "4", "5"]);
    expect(Object.keys(stored["prompts.capstone.v2.scores"])).toEqual(["0", "1", "2", "3", "4"]);
    await expect(capstone.getByRole("button", { name: "Record self-attested pass" })).toBeEnabled();
  });
});

test.describe("localization, metadata, catalogue, and discovery", () => {
  test("English dashboard and lesson publish as explicitly LTR English content", async ({ page }) => {
    for (const [suffix, testId] of [
      ["", "prompts-course-dashboard"],
      ["grounding-and-safety/", "prompts-lesson-grounding-and-safety"],
    ] as const) {
      const path = `/en/prompts/${suffix}`;
      await withIsolatedRoutePage(page, path, async (routePage) => {
        await expect(routePage.locator("html")).toHaveAttribute("lang", "en");
        await expect(routePage.locator("html")).toHaveAttribute("dir", "ltr");
        const content = routePage.getByTestId(testId);
        await expect(content).toHaveAttribute("lang", "en");
        await expect(content).toHaveAttribute("dir", "ltr");
        expect(await content.evaluate((element) => getComputedStyle(element).direction))
          .toBe("ltr");
        await expect(content.getByText(promptCopy.ui.englishOnly, { exact: true }))
          .toHaveCount(0);
      });
    }
  });

  test("unsupported locale course URLs 404 while localized catalogues link to English", async ({ page }) => {
    test.setTimeout(90_000);
    for (const { code } of LOCALES.filter((locale) => locale.code !== "en")) {
      for (const suffix of ["", "grounding-and-safety/"]) {
        const path = `/${code}/prompts/${suffix}`;
        await withIsolatedRoutePage(page, path, async (routePage) => {
          await expect(routePage.locator('[data-testid^="prompts-"]')).toHaveCount(0);
        }, { expectedStatus: 404 });
      }
    }

    await withIsolatedRoutePage(page, "/ar/courses/", async (routePage) => {
      await expect(routePage.locator("html")).toHaveAttribute("lang", "ar");
      await expect(routePage.locator("html")).toHaveAttribute("dir", "rtl");
      const card = routePage.locator("#how-to-write-prompts");
      await expect(card.locator('[data-course-content-language="en"]')).toContainText("English");
      await expect(card.locator('[data-course-language-fallback="true"]')).toBeVisible();
      await expect(card.locator('bdi[lang="en"][dir="ltr"]')).not.toHaveCount(0);
      await expect(card.locator('a[href="/en/prompts/?fromLocale=ar"]')).toBeVisible();
    });
  });

  test("language switching on an English-only lesson preserves the course and a truthful return path", async ({ page }) => {
    await page.goto("/en/prompts/grounding-and-safety/");
    await page.getByRole("button", { name: "Language: English" }).click();
    await page.getByRole("menuitem").filter({ hasText: "العربية" }).click();

    await expect(page).toHaveURL(/\/en\/prompts\/grounding-and-safety\/\?fromLocale=ar$/);
    await expect(page.getByTestId("prompts-lesson-grounding-and-safety")).toBeVisible();
    await expect(page.getByRole("link", { name: /Return to the course catalogue/ })).toHaveAttribute(
      "href",
      "/ar/courses/",
    );
    expect(await page.evaluate(() => localStorage.getItem("ae.lang"))).toBe("ar");

    await page.locator('[data-course-lesson-nav] a[rel="next"]').click();
    await expect(page).toHaveURL(/\/en\/prompts\/capstone-prompt-packet\/\?fromLocale=ar$/);
    await expect(page.getByTestId("prompts-lesson-capstone-prompt-packet")).toBeVisible();
  });

  test("English-only course shells canonicalize to English and do not advertise untranslated hreflang variants", async ({ page }) => {
    await withIsolatedRoutePage(page, DASHBOARD, async (routePage) => {
      await expect(routePage.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        "https://aicourse.top/en/prompts/",
      );
      await expect(routePage.locator('link[rel="alternate"][hreflang]')).toHaveCount(2);
      await expect(routePage.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
        "href",
        "https://aicourse.top/en/prompts/",
      );
      await expect(routePage.locator('link[rel="alternate"][hreflang="x-default"]'))
        .toHaveAttribute("href", "https://aicourse.top/en/prompts/");

      const nodes = await readJsonLdNodes(routePage);
      const course = nodes.find((node) => node["@type"] === "Course");
      expect(course).toBeTruthy();
      expect(course?.inLanguage).toBe("en");
      expect(course?.hasPart).toHaveLength(9);
      expect((course?.hasCourseInstance as JsonLdNode)?.courseWorkload).toBe("PT380M");
      expect(nodes.some((node) => node["@type"] === "BreadcrumbList")).toBe(true);
    });

    await withIsolatedRoutePage(
      page,
      "/en/prompts/grounding-and-safety/",
      async (routePage) => {
        await expect(routePage.locator('link[rel="canonical"]')).toHaveAttribute(
          "href",
          "https://aicourse.top/en/prompts/grounding-and-safety/",
        );
        await expect(routePage.locator('link[rel="alternate"][hreflang]')).toHaveCount(2);
        await expect(routePage.locator('link[rel="alternate"][hreflang="ar"]')).toHaveCount(0);
        await expect(routePage.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
          "href",
          "https://aicourse.top/en/prompts/grounding-and-safety/",
        );
        await expect(
          routePage.locator('link[rel="alternate"][hreflang="x-default"]'),
        ).toHaveAttribute("href", "https://aicourse.top/en/prompts/grounding-and-safety/");

        const nodes = await readJsonLdNodes(routePage);
        const lesson = nodes.find((node) => node["@type"] === "LearningResource");
        expect(lesson).toBeTruthy();
        expect(lesson?.inLanguage).toBe("en");
        expect(lesson?.url).toBe("https://aicourse.top/en/prompts/grounding-and-safety/");
        expect(nodes.some((node) => node["@type"] === "BreadcrumbList")).toBe(true);
      },
    );
  });

  for (const width of [320, 390, 768, 1440]) {
    test(`dashboard and representative lessons do not overflow at ${width}px`, async ({ page }) => {
      test.setTimeout(60_000);
      for (const path of [
        DASHBOARD,
        "/en/prompts/evaluation-flywheel/",
        "/en/prompts/capstone-prompt-packet/",
      ]) {
        await withIsolatedRoutePage(page, path, async (routePage) => {
          await routePage.evaluate(async () => { await document.fonts.ready; });
          const dimensions = await routePage.evaluate(() => ({
            client: document.documentElement.clientWidth,
            scroll: document.documentElement.scrollWidth,
          }));
          expect(dimensions.scroll, `${path} at ${width}px`)
            .toBeLessThanOrEqual(dimensions.client + 1);
        }, { viewport: { width, height: 900 } });
      }
    });
  }

  test("mobile course map stays truthful and uses touch-sized navigation", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/en/prompts/prompts-are-specifications/");
    const map = page.locator("[data-course-mobile-map]");
    const summary = map.locator("summary");
    await expect(summary).toContainText("Open course map");
    await page.evaluate(() => window.scrollTo(0, 1_000));
    await expect.poll(() => summary.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= window.innerHeight;
    })).toBe(true);
    await summary.click();
    await expect(summary).toContainText("Close course map");
    expect(await summary.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return document.activeElement === element
        && rect.top >= 0
        && rect.bottom <= window.innerHeight;
    })).toBe(true);
    expect(await map.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= window.innerHeight;
    })).toBe(true);
    const sizes = await map.locator("summary, nav a").evaluateAll((elements) => elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { height: rect.height, width: rect.width };
    }));
    expect(sizes.every(({ height, width }) => height >= 44 && width >= 44)).toBe(true);
    expect(await map.locator("nav a").first().locator(":scope > span").nth(1).evaluate((element) => (
      Number.parseFloat(getComputedStyle(element).fontSize)
    ))).toBeGreaterThanOrEqual(14);
    await map.locator("nav a").last().focus();
    await page.keyboard.press("Tab");
    await expect(summary).toContainText("Open course map");
    const focusedAfterMap = page.locator(":focus");
    await expect.poll(() => focusedAfterMap.evaluate((element) => {
      const target = element.getBoundingClientRect();
      const sticky = document.querySelector("[data-course-mobile-map]")!.getBoundingClientRect();
      return target.top >= sticky.bottom && target.bottom <= window.innerHeight;
    })).toBe(true);

    await summary.click();
    await expect(summary).toContainText("Close course map");
    await page.keyboard.press("Escape");
    await expect(summary).toContainText("Open course map");
    await expect(summary).toBeFocused();
    const completion = page.getByRole("button", { name: "I completed the practice" });
    await completion.focus();
    await expect.poll(() => completion.evaluate((element) => {
      const target = element.getBoundingClientRect();
      const sticky = document.querySelector("[data-course-mobile-map]")!.getBoundingClientRect();
      return target.top >= sticky.bottom && target.bottom <= window.innerHeight;
    })).toBe(true);
  });

  test("catalogue keeps Course 6 immediately before Course 7 and prompt search finds it", async ({ page }) => {
    await page.goto("/en/courses/");
    const cards = page.locator("#catalog-course-results > li");
    const course6 = cards.filter({ has: page.locator('[data-course-cover="github"]') });
    const course7 = cards.filter({ has: page.locator('[data-course-cover="prompts"]') });
    await expect(course6).toHaveCount(1);
    await expect(course7).toHaveCount(1);
    await expect(course6.getByText("Course 6", { exact: true })).toBeVisible();
    await expect(course7.getByText("Course 7", { exact: true })).toBeVisible();
    await expect(course6.getByRole("heading", { level: 2 })).toHaveText("How to Use GitHub");
    await expect(course7.getByRole("heading", { level: 2 })).toHaveText("How to Write Prompts");
    await expect(course6.locator("a")).toHaveAttribute("href", "/en/github/");
    await expect(course7.locator("a").first()).toHaveAttribute("href", "/en/prompts/");
    expect(await course7.evaluate((node) => (
      node.previousElementSibling?.querySelector("[data-course-cover]")?.getAttribute("data-course-cover")
    ))).toBe("github");

    await page.getByRole("searchbox", { name: "Search" }).fill("prompt");
    await expect(cards).toHaveCount(1);
    await expect(cards.getByRole("heading", { level: 2 })).toHaveText("How to Write Prompts");
    await expect(page).toHaveURL(/\?q=prompt$/);
  });

  test("non-English catalogue structured data uses Course 7's English canonical URLs", async ({ page }) => {
    await page.goto("/ar/courses/");
    const nodes = await readJsonLdNodes(page);
    const itemList = nodes.find((node) => node["@type"] === "ItemList");
    const items = itemList?.itemListElement as JsonLdNode[] | undefined;
    const promptsItem = items?.find((entry) => (
      (entry.item as JsonLdNode)?.name === "كيفية كتابة المطالبات"
      || (entry.item as JsonLdNode)?.url === "https://aicourse.top/en/prompts/"
    ));
    const promptsCourse = promptsItem?.item as JsonLdNode | undefined;

    expect(promptsCourse?.url).toBe("https://aicourse.top/en/prompts/");
    expect(promptsCourse?.inLanguage).toEqual(["en"]);
    expect((promptsCourse?.hasPart as JsonLdNode[]).map((part) => part.url)).toEqual(
      PROMPT_LESSON_SLUGS.map((slug) => `https://aicourse.top/en/prompts/${slug}/`),
    );
  });

  test("all 11 current milestones yield 100 percent on the catalogue and home", async ({ page }) => {
    await page.goto(DASHBOARD);
    await page.evaluate(({ slugs, capstone, quiz }) => {
      const complete: Record<string, unknown> = Object.fromEntries(slugs.map((slug) => [
        `prompts.lesson.${slug}.practice`,
        true,
      ]));
      Object.assign(complete, capstone, quiz);
      localStorage.setItem("ae.progress", JSON.stringify(complete));
    }, {
      slugs: PROMPT_LESSON_SLUGS,
      capstone: COMPLETE_CAPSTONE_PROGRESS,
      quiz: {
        [PROMPT_QUIZ_VERSION_KEY]: PROMPT_QUIZ_BANK_VERSION,
        [PROMPT_QUIZ_BEST_KEY]: PROMPT_QUIZ_MAX_SCORE,
        [PROMPT_QUIZ_PASSED_KEY]: true,
      },
    });

    await page.goto("/en/courses/");
    const course7 = page.locator("#how-to-write-prompts");
    await expect(course7.getByRole("progressbar", {
      name: "How to Write Prompts: progress",
    })).toHaveAttribute("aria-valuenow", "100");
    await expect(course7.getByText("100%", { exact: true })).toBeVisible();
    await expect(course7.locator(".catalog-course-action")).toContainText("Review");

    const nodes = await readJsonLdNodes(page);
    const itemList = nodes.find((node) => node["@type"] === "ItemList");
    const items = itemList?.itemListElement as JsonLdNode[] | undefined;
    const promptsItem = items?.find((entry) => (
      (entry.item as JsonLdNode)?.url === "https://aicourse.top/en/prompts/"
    ));
    const promptsCourse = promptsItem?.item as JsonLdNode | undefined;
    expect(promptsCourse).toBeTruthy();
    expect((promptsCourse?.hasCourseInstance as JsonLdNode)?.courseWorkload).toBe("PT380M");
    expect(promptsCourse?.hasPart).toHaveLength(9);

    await page.goto("/en/");
    const homeCourse7 = page.locator("article.progress-course").filter({
      hasText: "How to Write Prompts",
    });
    await expect(homeCourse7.getByRole("progressbar", {
      name: "How to Write Prompts: progress",
    })).toHaveAttribute("aria-valuenow", "100");
    await expect(homeCourse7.getByText("100%", { exact: true })).toBeVisible();
    await expect(homeCourse7.getByRole("link", { name: "Review" })).toHaveAttribute(
      "href",
      "/en/prompts/",
    );
  });

  test("sitemap lists the English dashboard and nine English lessons exactly once", async ({ request }) => {
    const urls = await publishedSitemapUrls(request);
    const promptLocations = [...urls]
      .filter((location) => new URL(location).pathname.includes("/prompts/"));
    expect(new Set(promptLocations).size).toBe(PROMPT_LESSON_SLUGS.length + 1);
    expect(promptLocations).toHaveLength(PROMPT_LESSON_SLUGS.length + 1);

    expect(promptLocations).toContain("https://aicourse.top/en/prompts/");
    for (const slug of PROMPT_LESSON_SLUGS) {
      expect(promptLocations).toContain(`https://aicourse.top/en/prompts/${slug}/`);
    }
    expect(promptLocations.some((location) => !location.includes("/en/prompts/"))).toBe(false);
  });
});
