import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { expect, test, type ElementHandle, type Page } from "@playwright/test";

import {
  MATH_ANIMATION_MODULE_SLUGS,
  MATH_ANIMATION_PROGRESS_VERSION,
  MATH_ANIMATION_PROGRESS_VERSION_KEY,
  MATH_ANIMATION_PROGRESS_RESET_GENERATION_KEY,
  MATH_ANIMATION_SOURCES,
  loadMathAnimationCourse,
  mathAnimationModuleArtifactEvidenceKey,
  mathAnimationModuleCheckpointKey,
  mathAnimationModuleProgressKey,
  mathAnimationModuleVerificationEvidenceKey,
} from "../lib/math-animation";

const DASHBOARD = "/en/math-animation/";
const english = await loadMathAnimationCourse("en");
const firstModule = english.modules[0];
const firstModulePath = `${DASHBOARD}${firstModule.slug}/`;
const claudeReviewModule = english.modules.find((courseModule) => (
  courseModule.slug === "claude-direction-review"
));
if (!claudeReviewModule) throw new Error("Missing claude-direction-review module fixture");

async function clearSharedProgress(page: Page) {
  await page.goto(DASHBOARD);
  await page.evaluate(() => {
    localStorage.removeItem("ae.progress");
    sessionStorage.removeItem("ae.progress.math-animation-corrupt-backup");
  });
  await page.reload();
}

test("Course 19 overview exposes the complete route, evidence, and metadata contract", async ({ page, request }) => {
  await clearSharedProgress(page);
  await expect(page.getByTestId("math-animation-course")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: english.copy.meta.title })).toBeVisible();
  await expect(page).toHaveTitle(new RegExp(english.copy.meta.title));

  const moduleLinks = page.locator(
    '#course-map a[href^="/en/math-animation/"]',
  );
  await expect(moduleLinks).toHaveCount(MATH_ANIMATION_MODULE_SLUGS.length);
  expect(await moduleLinks.evaluateAll((links) => links.map((link) => link.getAttribute("href"))))
    .toEqual(MATH_ANIMATION_MODULE_SLUGS.map((slug) => `${DASHBOARD}${slug}/`));
  await expect(page.locator('section[aria-labelledby="repository-lab-title"] article'))
    .toHaveCount(9);
  await expect(page.locator('section[aria-labelledby="math-animation-progress-title"] progress'))
    .toHaveAttribute("max", "14");
  await expect(page.locator('section[aria-labelledby="math-animation-progress-title"] progress'))
    .toHaveAttribute("value", "0");
  await expect(page.locator("#math-animation-assessment")).toBeVisible();
  await expect(page.locator("#math-animation-capstone")).toBeVisible();
  await expect(page.locator("#math-animation-capstone").getByRole("button", {
    name: english.copy.ui.markCapstone,
  })).toBeDisabled();
  await expect(page.locator('img[src^="http"]')).toHaveCount(0);
  await expect(page.locator('img[src*="unit-circle-sine-keyframes.svg"]')).toBeVisible();

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://aicourse.top/en/math-animation/",
  );
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(3);
  await expect(page.locator('link[rel="alternate"][hreflang="zh-Hans"]')).toHaveAttribute(
    "href",
    "https://aicourse.top/zh-Hans/math-animation/",
  );

  for (const path of [
    "/courses/math-animation/NOTICE.md",
    "/courses/math-animation/repository-lock.json",
    "/courses/math-animation/starter-kit/README.md",
    "/courses/math-animation/starter-kit/SCENE_CONTRACT.md",
  ]) {
    expect((await request.get(path)).status(), path).toBe(200);
  }

  const start = page.getByRole("link", { name: english.copy.ui.start, exact: true }).first();
  await start.focus();
  await expect(start).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(`${firstModule.slug}/$`));
  await expect(page.getByTestId(`math-animation-module-${firstModule.slug}`)).toBeVisible();
});

test("module completion requires checkpoint plus both evidence records and reset preserves other courses", async ({ page }) => {
  await page.goto(DASHBOARD);
  await page.evaluate(() => {
    localStorage.setItem("ae.progress", JSON.stringify({
      "codex.lesson.keep": true,
      "rag.lesson.keep": { status: "complete" },
    }));
  });
  await page.goto(firstModulePath);

  const view = page.getByTestId(`math-animation-module-${firstModule.slug}`);
  await expect(view).toBeVisible();
  await expect(view.getByRole("heading", { level: 1, name: firstModule.copy.title })).toBeVisible();
  await expect(view.locator('section[aria-labelledby^="teaching-section-"]')).toHaveCount(3);
  const evidenceGate = view.locator(
    `section[aria-labelledby="${firstModule.slug}-evidence-title"]`,
  );
  await expect(evidenceGate.locator("textarea")).toHaveCount(2);

  await evidenceGate.getByLabel(english.copy.ui.artifactEvidence).fill(
    "public/render-receipts/first-scene.json",
  );
  await evidenceGate.getByLabel(english.copy.ui.verificationEvidence).fill(
    "python test_math_truth.py passed; low-quality render inspected at frame 60",
  );
  await evidenceGate.getByRole("button", { name: english.copy.ui.markComplete }).click();
  const progress = view.locator('section[aria-labelledby="math-animation-progress-title"] progress');
  await expect(progress).toHaveAttribute("value", "0");
  await expect(evidenceGate.getByRole("button", { name: english.copy.ui.markComplete }))
    .toBeEnabled();

  const checkpoint = view.locator(
    `section[aria-labelledby="${firstModule.slug}-checkpoint-title"]`,
  );
  const correctOption = checkpoint.locator('input[type="radio"]')
    .nth(firstModule.copy.checkpoint.correctIndex);
  await correctOption.focus();
  await expect(correctOption).toBeFocused();
  await page.keyboard.press("Space");
  const checkAnswer = checkpoint.getByRole("button", { name: english.copy.ui.checkAnswer });
  await checkAnswer.focus();
  await page.keyboard.press("Enter");
  await expect(checkpoint.getByRole("status")).toContainText(english.copy.ui.correct);
  await expect(progress).toHaveAttribute("value", "1");
  await expect(evidenceGate.getByRole("button", { name: english.copy.ui.completed }))
    .toBeDisabled();

  const resume = view.locator('section[aria-labelledby="math-animation-progress-title"]')
    .getByRole("link", { name: english.copy.ui.resume, exact: true });
  await expect(resume).toHaveAttribute(
    "href",
    `${DASHBOARD}${english.modules[1].slug}/`,
  );

  await page.reload();
  await expect(progress).toHaveAttribute("value", "1");
  await expect(evidenceGate.getByLabel(english.copy.ui.artifactEvidence))
    .toHaveValue("public/render-receipts/first-scene.json");
  await expect(evidenceGate.getByLabel(english.copy.ui.verificationEvidence))
    .toHaveValue(/low-quality render inspected/);
  await expect(evidenceGate.getByRole("button", { name: english.copy.ui.completed }))
    .toBeDisabled();

  const stored = await page.evaluate(() => (
    JSON.parse(localStorage.getItem("ae.progress") || "{}") as Record<string, unknown>
  ));
  expect(stored["codex.lesson.keep"]).toBe(true);
  expect(stored["rag.lesson.keep"]).toEqual({ status: "complete" });
  expect(stored[mathAnimationModuleCheckpointKey(firstModule.slug)]).toBe(true);
  expect(stored[mathAnimationModuleProgressKey(firstModule.slug)]).toBe(true);
  expect(stored[mathAnimationModuleArtifactEvidenceKey(firstModule.slug)])
    .toBe("public/render-receipts/first-scene.json");
  expect(stored[mathAnimationModuleVerificationEvidenceKey(firstModule.slug)])
    .toContain("low-quality render inspected");

  await page.goto(DASHBOARD);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: english.copy.ui.reset, exact: true }).click();
  await expect(page.getByText(english.copy.ui.resetDone, { exact: true })).toBeVisible();
  await expect(page.locator('section[aria-labelledby="math-animation-progress-title"] progress'))
    .toHaveAttribute("value", "0");
  const afterReset = await page.evaluate(() => (
    JSON.parse(localStorage.getItem("ae.progress") || "{}") as Record<string, unknown>
  ));
  expect(afterReset["codex.lesson.keep"]).toBe(true);
  expect(afterReset["rag.lesson.keep"]).toEqual({ status: "complete" });
  expect(Object.keys(afterReset).filter(
    (key) => key.startsWith("math-animation.")
      && key !== MATH_ANIMATION_PROGRESS_VERSION_KEY
      && key !== MATH_ANIMATION_PROGRESS_RESET_GENERATION_KEY,
  )).toEqual([]);
  expect(afterReset[MATH_ANIMATION_PROGRESS_RESET_GENERATION_KEY]).toBe(1);
  const resetProgressPanel = page.locator(
    'section[aria-labelledby="math-animation-progress-title"]',
  );
  await expect(resetProgressPanel.getByRole("link", { name: english.copy.ui.start, exact: true }))
    .toBeVisible();
  await expect(resetProgressPanel.getByRole("button", { name: english.copy.ui.reset, exact: true }))
    .toBeDisabled();
});

test("stale or corrupt Course 19 state is repaired while other course keys survive", async ({ page }) => {
  await page.goto(DASHBOARD);
  await page.evaluate(({ versionKey, moduleKey }) => {
    localStorage.setItem("unrelated.course.storage", "keep-me");
    localStorage.setItem("ae.progress", JSON.stringify({
      "claude.lesson.keep": true,
      "another.course.payload": { completed: [1, 2] },
      [versionKey]: "corrupt:progress-v0",
      [moduleKey]: true,
      "math-animation.quiz.best": 999,
      "math-animation.capstone.checks": [true],
    }));
  }, {
    versionKey: MATH_ANIMATION_PROGRESS_VERSION_KEY,
    moduleKey: mathAnimationModuleProgressKey(firstModule.slug),
  });
  await page.reload();
  await expect(page.locator('section[aria-labelledby="math-animation-progress-title"] progress'))
    .toHaveAttribute("value", "0");

  const repaired = await page.evaluate(() => ({
    shared: JSON.parse(localStorage.getItem("ae.progress") || "{}") as Record<string, unknown>,
    unrelated: localStorage.getItem("unrelated.course.storage"),
  }));
  expect(repaired.unrelated).toBe("keep-me");
  expect(repaired.shared["claude.lesson.keep"]).toBe(true);
  expect(repaired.shared["another.course.payload"]).toEqual({ completed: [1, 2] });
  expect(repaired.shared[MATH_ANIMATION_PROGRESS_VERSION_KEY]).toBe(MATH_ANIMATION_PROGRESS_VERSION);
  expect(repaired.shared[mathAnimationModuleProgressKey(firstModule.slug)]).toBeUndefined();
  expect(repaired.shared["math-animation.quiz.best"]).toBeUndefined();
  expect(repaired.shared["math-animation.capstone.checks"]).toBeUndefined();
});

test("hydration never overwrites immediate evidence, assessment, or capstone input", async ({ context, page }) => {
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 });
  try {
    await page.goto(DASHBOARD);
    await page.evaluate(() => localStorage.removeItem("ae.progress"));
    await page.reload();

    const assessment = page.locator("#math-animation-assessment");
    await assessment.getByRole("button", { name: english.copy.ui.startAssessment }).click();
    const capstone = page.locator("#math-animation-capstone");
    const firstCapstoneCheck = capstone.locator('input[type="checkbox"]').first();
    await firstCapstoneCheck.check();
    const capstoneDraft = "Immediate independent-review evidence entered while the page is hydrating must remain intact.";
    await capstone.getByLabel(english.copy.ui.capstoneEvidence).fill(capstoneDraft);

    await page.waitForTimeout(250);
    await expect(assessment.locator("fieldset")).toHaveCount(english.copy.assessment.length);
    await expect(firstCapstoneCheck).toBeChecked();
    await expect(capstone.getByLabel(english.copy.ui.capstoneEvidence)).toHaveValue(capstoneDraft);

    await page.goto(firstModulePath);
    const evidenceGate = page.locator(
      `section[aria-labelledby="${firstModule.slug}-evidence-title"]`,
    );
    const artifactDraft = "public/render-receipts/immediate-hydration-draft.json";
    const verificationDraft = "Immediate verification input must not be replaced by a delayed empty storage snapshot.";
    await evidenceGate.getByLabel(english.copy.ui.artifactEvidence).fill(artifactDraft);
    await evidenceGate.getByLabel(english.copy.ui.verificationEvidence).fill(verificationDraft);
    const checkpoint = page.locator(
      `section[aria-labelledby="${firstModule.slug}-checkpoint-title"]`,
    );
    const checkpointChoice = checkpoint.locator('input[type="radio"]')
      .nth(firstModule.copy.checkpoint.correctIndex);
    await checkpointChoice.check();

    await page.waitForTimeout(250);
    await expect(checkpointChoice).toBeChecked();
    await expect(evidenceGate.getByLabel(english.copy.ui.artifactEvidence)).toHaveValue(artifactDraft);
    await expect(evidenceGate.getByLabel(english.copy.ui.verificationEvidence)).toHaveValue(verificationDraft);
    await expect(evidenceGate.getByRole("button", { name: english.copy.ui.markComplete }))
      .toBeEnabled();
  } finally {
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  }
});

test("an external Course 19 reset clears unsaved module and capstone drafts", async ({ context, page }) => {
  await clearSharedProgress(page);
  await page.goto(firstModulePath);
  const moduleGate = page.locator(
    `section[aria-labelledby="${firstModule.slug}-evidence-title"]`,
  );
  await moduleGate.getByLabel(english.copy.ui.artifactEvidence).fill(
    "unsaved-artifact-draft.json",
  );
  await moduleGate.getByLabel(english.copy.ui.verificationEvidence).fill(
    "unsaved verification draft in the first browser tab",
  );

  const resetPage = await context.newPage();
  await resetPage.goto(DASHBOARD);
  await resetPage.evaluate(({ versionKey, version, quizBestKey }) => {
    const record = JSON.parse(localStorage.getItem("ae.progress") || "{}") as Record<string, unknown>;
    record[versionKey] = version;
    record[quizBestKey] = 20;
    localStorage.setItem("ae.progress", JSON.stringify(record));
  }, {
    versionKey: MATH_ANIMATION_PROGRESS_VERSION_KEY,
    version: MATH_ANIMATION_PROGRESS_VERSION,
    quizBestKey: "math-animation.quiz.best",
  });
  await resetPage.reload();
  resetPage.once("dialog", (dialog) => dialog.accept());
  await resetPage.getByRole("button", { name: english.copy.ui.reset, exact: true }).click();

  await expect(moduleGate.getByLabel(english.copy.ui.artifactEvidence)).toHaveValue("");
  await expect(moduleGate.getByLabel(english.copy.ui.verificationEvidence)).toHaveValue("");

  await page.goto(DASHBOARD);
  const capstone = page.locator("#math-animation-capstone");
  await capstone.locator('input[type="checkbox"]').first().check();
  await capstone.getByLabel(english.copy.ui.capstoneEvidence).fill(
    "Unsaved capstone evidence must be cleared when a different tab explicitly resets Course 19 progress.",
  );

  await resetPage.evaluate(({ versionKey, version, quizBestKey }) => {
    const record = JSON.parse(localStorage.getItem("ae.progress") || "{}") as Record<string, unknown>;
    record[versionKey] = version;
    record[quizBestKey] = 20;
    localStorage.setItem("ae.progress", JSON.stringify(record));
  }, {
    versionKey: MATH_ANIMATION_PROGRESS_VERSION_KEY,
    version: MATH_ANIMATION_PROGRESS_VERSION,
    quizBestKey: "math-animation.quiz.best",
  });
  await resetPage.reload();

  resetPage.once("dialog", (dialog) => dialog.accept());
  await resetPage.getByRole("button", { name: english.copy.ui.reset, exact: true }).click();
  await expect(capstone.locator('input[type="checkbox"]').first()).not.toBeChecked();
  await expect(capstone.getByLabel(english.copy.ui.capstoneEvidence)).toHaveValue("");
  await resetPage.close();
});

test("an external Course 19 reset clears checkpoint and assessment UI state", async ({ context, page }) => {
  await clearSharedProgress(page);
  await page.goto(firstModulePath);

  const checkpoint = page.locator(
    `section[aria-labelledby="${firstModule.slug}-checkpoint-title"]`,
  );
  const correctOption = checkpoint.locator('input[type="radio"]')
    .nth(firstModule.copy.checkpoint.correctIndex);
  await correctOption.check();
  await checkpoint.getByRole("button", { name: english.copy.ui.checkAnswer }).click();
  await expect(checkpoint.getByRole("status")).toContainText(english.copy.ui.correct);
  await expect(correctOption).toBeChecked();
  await expect(correctOption).toBeDisabled();

  const resetPage = await context.newPage();
  await resetPage.goto(DASHBOARD);
  resetPage.once("dialog", (dialog) => dialog.accept());
  await resetPage.getByRole("button", { name: english.copy.ui.reset, exact: true }).click();

  await expect(correctOption).not.toBeChecked();
  await expect(correctOption).toBeEnabled();
  await expect(checkpoint.getByRole("status")).toHaveCount(0);
  await expect(checkpoint.getByRole("button", { name: english.copy.ui.checkAnswer }))
    .toBeDisabled();

  await page.goto(DASHBOARD);
  const assessment = page.locator("#math-animation-assessment");
  await assessment.getByRole("button", { name: english.copy.ui.startAssessment }).click();
  const questions = assessment.locator("fieldset");
  for (const [index, question] of english.copy.assessment.entries()) {
    await questions.nth(index).locator('input[type="radio"]')
      .nth(question.correctIndex)
      .check();
  }
  await assessment.getByRole("button", { name: english.copy.ui.submitAssessment }).click();
  await expect(assessment.getByText(english.copy.ui.assessmentPassed, { exact: true }))
    .toBeVisible();
  await expect(assessment).toContainText(`${english.copy.ui.scoreResult}: 100%`);

  resetPage.once("dialog", (dialog) => dialog.accept());
  await resetPage.getByRole("button", { name: english.copy.ui.reset, exact: true }).click();

  await expect(assessment.getByRole("button", { name: english.copy.ui.startAssessment }))
    .toBeVisible();
  await expect(assessment.getByText(english.copy.ui.assessmentPassed, { exact: true }))
    .toHaveCount(0);
  await expect(assessment).toContainText(`${english.copy.ui.bestScore}: 0%`);
  await resetPage.close();
});

test("the final assessment cannot be passed by always choosing the first option", async ({ page }) => {
  await clearSharedProgress(page);
  const assessment = page.locator("#math-animation-assessment");
  await assessment.getByRole("button", { name: english.copy.ui.startAssessment }).click();
  const questions = assessment.locator("fieldset");
  for (let index = 0; index < english.copy.assessment.length; index += 1) {
    await questions.nth(index).locator('input[type="radio"]').first().check();
  }
  await assessment.getByRole("button", { name: english.copy.ui.submitAssessment }).click();
  await expect(assessment.getByText(english.copy.ui.assessmentRetry, { exact: true }))
    .toBeVisible();
  await expect(assessment).toContainText(`${english.copy.ui.scoreResult}: 25%`);
  await expect(assessment.getByText(english.copy.ui.assessmentPassed, { exact: true }))
    .toHaveCount(0);
  await expect(assessment.getByText(english.copy.ui.correct, { exact: true })).toHaveCount(0);
  await expect(assessment.getByText(/^Correct answer:/)).toHaveCount(
    english.copy.assessment.length,
  );
});

test("unit-circle labels stay attached and unclipped at the four benchmark angles", async ({ page }) => {
  await page.goto(DASHBOARD);
  const timeline = page.locator('input[type="range"]');
  const point = page.getByTestId("unit-circle-live-point");
  const label = page.getByTestId("unit-circle-value-label");

  for (const value of ["0", "250", "500", "750"]) {
    await timeline.fill(value);
    const geometry = await label.evaluate((labelElement, pointElement) => {
      const labelGraphic = labelElement as SVGGraphicsElement;
      const pointCircle = pointElement as SVGCircleElement;
      const box = labelGraphic.getBBox();
      return {
        labelX: Number(labelGraphic.getAttribute("x")),
        pointX: Number(pointCircle.getAttribute("cx")),
        textAnchor: labelGraphic.getAttribute("text-anchor"),
        box: { x: box.x, y: box.y, width: box.width, height: box.height },
      };
    }, await point.elementHandle());

    expect(Math.abs(geometry.labelX - geometry.pointX)).toBeCloseTo(10, 6);
    expect(geometry.textAnchor).toBe(geometry.pointX >= 165 ? "end" : "start");
    expect(geometry.box.x).toBeGreaterThanOrEqual(0);
    expect(geometry.box.x + geometry.box.width).toBeLessThanOrEqual(340);
    expect(geometry.box.y).toBeGreaterThanOrEqual(0);
    expect(geometry.box.y + geometry.box.height).toBeLessThanOrEqual(310);
  }
});

test("unit-circle sine and cosine projection names match their geometry", async ({ page }) => {
  await page.goto(DASHBOARD);
  await page.locator('input[type="range"]').fill("125");

  const point = page.getByTestId("unit-circle-live-point");
  const sineProjection = page.getByTestId("unit-circle-sine-projection");
  const cosineProjection = page.getByTestId("unit-circle-cosine-projection");

  await expect(sineProjection).toHaveCount(1);
  await expect(cosineProjection).toHaveCount(1);

  const geometry = await page.evaluate(({ pointElement, sineElement, cosineElement }) => {
    const numberAttribute = (element: Element, name: string) => (
      Number(element.getAttribute(name))
    );
    return {
      point: {
        x: numberAttribute(pointElement, "cx"),
        y: numberAttribute(pointElement, "cy"),
      },
      sine: {
        x1: numberAttribute(sineElement, "x1"),
        y1: numberAttribute(sineElement, "y1"),
        x2: numberAttribute(sineElement, "x2"),
        y2: numberAttribute(sineElement, "y2"),
      },
      cosine: {
        x1: numberAttribute(cosineElement, "x1"),
        y1: numberAttribute(cosineElement, "y1"),
        x2: numberAttribute(cosineElement, "x2"),
        y2: numberAttribute(cosineElement, "y2"),
      },
    };
  }, {
    pointElement: await point.elementHandle() as ElementHandle<Element>,
    sineElement: await sineProjection.elementHandle() as ElementHandle<Element>,
    cosineElement: await cosineProjection.elementHandle() as ElementHandle<Element>,
  });

  expect(geometry.sine.x1).toBeCloseTo(geometry.point.x, 6);
  expect(geometry.sine.x2).toBeCloseTo(geometry.point.x, 6);
  expect(geometry.sine.y1).toBeCloseTo(geometry.point.y, 6);
  expect(geometry.sine.y2).toBeCloseTo(155, 6);
  expect(geometry.cosine.x1).toBeCloseTo(165, 6);
  expect(geometry.cosine.x2).toBeCloseTo(geometry.point.x, 6);
  expect(geometry.cosine.y1).toBeCloseTo(geometry.point.y, 6);
  expect(geometry.cosine.y2).toBeCloseTo(geometry.point.y, 6);
});

test("the eight-second 15 fps preview reports valid zero-based frame indices", async ({ page }) => {
  await page.goto(DASHBOARD);

  const frameLedger = page.getByText("Frame", { exact: true }).locator("..");
  const timeline = page.locator('input[type="range"]');
  await expect(frameLedger.locator("strong")).toHaveText("0");
  await expect(frameLedger.locator("small")).toHaveText("/ 119");

  await timeline.fill("500");
  await expect(frameLedger.locator("strong")).toHaveText("60");

  await timeline.fill("1000");
  await expect(frameLedger.locator("strong")).toHaveText("119");
  await expect(frameLedger.locator("small")).toHaveText("/ 119");
});

test("reduced-motion disables autoplay but keeps the timeline keyboard-operable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(DASHBOARD);
  expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);

  const play = page.getByRole("button", { name: "Play", exact: true });
  await expect(play).toBeDisabled();
  await expect(page.getByText(/Continuous playback is off because your system requests reduced motion/))
    .toBeVisible();

  const timeline = page.locator('input[type="range"]');
  await expect(timeline).toHaveAttribute("value", "0");
  await timeline.focus();
  await expect(timeline).toBeFocused();
  await page.keyboard.press("End");
  await expect(timeline).toHaveAttribute("value", "1000");
  await expect(timeline).toHaveAttribute("aria-valuetext", /360/);
});

test("scrollable code examples remain keyboard-focusable at narrow widths", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto(`${DASHBOARD}motion-canvas-web-track/`);

  const codeRegion = page.locator('section[aria-labelledby="module-code-title"] pre');
  await expect(codeRegion).toBeVisible();
  const dimensions = await codeRegion.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeGreaterThan(dimensions.clientWidth);
  await expect(codeRegion).toHaveAttribute("tabindex", "0");

  await codeRegion.focus();
  await expect(codeRegion).toBeFocused();
  expect(await codeRegion.evaluate((element) => {
    const style = getComputedStyle(element);
    return style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0;
  })).toBe(true);
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => codeRegion.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(0);
});

test("mobile fallback and RTL shells keep provenance accessible without console failures", async ({ page }, testInfo) => {
  const browserProblems: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      browserProblems.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => browserProblems.push(`pageerror: ${error.message}`));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ar/math-animation/");
  await page.waitForLoadState("networkidle");

  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  const course = page.getByTestId("math-animation-course");
  await expect(course).toHaveAttribute("lang", "en");
  await expect(course).toHaveAttribute("dir", "ltr");
  await expect(page.getByText(english.copy.ui.languageFallback, { exact: true })).toBeVisible();

  const repositoryCards = page.locator(
    'section[aria-labelledby="repository-lab-title"] article',
  );
  await expect(repositoryCards).toHaveCount(9);
  const traceDisclosures = repositoryCards.locator("details").filter({
    hasText: "Open pins, rights, and claim evidence",
  });
  await expect(traceDisclosures).toHaveCount(9);
  expect(await traceDisclosures.evaluateAll((details) => (
    details.every((element) => !(element as HTMLDetailsElement).open)
  ))).toBe(true);
  const closedPrintProbe = traceDisclosures.nth(1).locator("dl");
  expect(await closedPrintProbe.evaluate((element) => element.getClientRects().length)).toBe(0);
  const collapsedDimensions = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.body.scrollHeight,
  }));
  expect(collapsedDimensions.scrollWidth).toBeLessThanOrEqual(collapsedDimensions.viewportWidth);
  // The pre-disclosure mobile page measured 26,559px; keep a stable margin
  // below that regression point while allowing small font-metric variance.
  expect(collapsedDimensions.scrollHeight).toBeLessThan(25_500);

  const firstDisclosure = traceDisclosures.first();
  const firstSummary = firstDisclosure.locator("summary");
  await firstSummary.focus();
  await expect(firstSummary).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(firstDisclosure).toHaveAttribute("open", "");
  await expect(firstDisclosure.getByText("Claim evidence", { exact: true })).toBeVisible();
  expect(await firstSummary.evaluate((element) => element.getBoundingClientRect().height))
    .toBeGreaterThanOrEqual(44);

  const expandedDimensions = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(expandedDimensions.scrollWidth).toBeLessThanOrEqual(expandedDimensions.viewportWidth);
  await page.waitForTimeout(100);
  expect(await closedPrintProbe.evaluate((element) => element.getClientRects().length))
    .toBe(0);
  await firstSummary.press("Enter");
  await expect(firstDisclosure).not.toHaveAttribute("open", "");

  await page.emulateMedia({ media: "print" });
  const pdfPath = testInfo.outputPath("course-19-print.pdf");
  const printTextPath = testInfo.outputPath("course-19-print.txt");
  await page.pdf({ path: pdfPath, format: "A4", printBackground: true });
  execFileSync("pdftotext", [pdfPath, printTextPath]);
  const printText = readFileSync(printTextPath, "utf8");
  expect(printText).toContain("Claim evidence");
  expect(printText).toContain("github.com/3b1b/manim");
  // Chromium may warn about a Next.js-prefetched course-catalog stylesheet
  // that the current route does not consume. Wait past the browser's warning
  // window so genuine late errors are still observed, and allow only that
  // narrowly identified framework prefetch message.
  await page.waitForTimeout(4_200);
  const unexpectedBrowserProblems = browserProblems.filter((problem) => !(
    /^warning: The resource https?:\/\/[^ ]+\/_next\/static\/chunks\/[^ ]+\.css was preloaded using link preload but not used within a few seconds from the window's load event\./.test(problem)
  ));
  expect(unexpectedBrowserProblems).toEqual([]);
});

test("Simplified Chinese repository decisions keep all learner-facing evidence localized", async ({ page }) => {
  await page.goto("/zh-Hans/math-animation/");
  const repositoryCards = page.locator(
    'section[aria-labelledby="repository-lab-title"] article',
  );
  await expect(repositoryCards).toHaveCount(9);
  await expect(repositoryCards.getByText("最适合", { exact: true })).toHaveCount(9);
  await expect(repositoryCards.getByText("主要限制", { exact: true })).toHaveCount(9);
  await expect(repositoryCards.getByText("实测证据", { exact: true })).toHaveCount(9);
  await expect(repositoryCards.getByText("Best for", { exact: true })).toHaveCount(0);
  await expect(repositoryCards.getByText("Known limit", { exact: true })).toHaveCount(0);
  await expect(repositoryCards.getByText("Smoke evidence", { exact: true })).toHaveCount(0);
  for (const repository of english.repositories) {
    const source = MATH_ANIMATION_SOURCES.find((record) => record.id === repository.sourceId);
    if (!source) throw new Error(`Missing source fixture for ${repository.sourceId}`);
    const repositoryCard = repositoryCards.filter({
      has: page.getByRole("heading", { level: 4, name: source.title, exact: true }),
    });
    await expect(repositoryCard).toHaveCount(1);
    await expect(repositoryCard).toContainText(source.licenseOrRightsZhHans);
    await expect(repositoryCard).not.toContainText(source.licenseOrRights);
  }
});

test("all source media remains link-only and no external media source is emitted", async ({ page }) => {
  await page.goto(DASHBOARD);
  await expect(page.locator('img[src^="http"], video[src^="http"], source[src^="http"]'))
    .toHaveCount(0);
  for (const source of MATH_ANIMATION_SOURCES.filter((record) => record.kind === "x-post")) {
    await expect(page.locator(`a[href="${source.url}"]`)).toHaveCount(0);
  }
  await page.goto(`${DASHBOARD}claude-direction-review/`);
  const xSources = MATH_ANIMATION_SOURCES.filter((record) => (
    claudeReviewModule.sourceIds.includes(record.id) && record.kind === "x-post"
  ));
  expect(xSources).toHaveLength(3);
  for (const source of xSources) {
    for (const url of new Set([source.url, ...source.claimEvidenceUrls])) {
      const sourceLinks = page.locator(`a[href="${url}"]`);
      expect(await sourceLinks.count(), `${source.id} should expose ${url}`).toBeGreaterThan(0);
      expect(await sourceLinks.evaluateAll((links) => links.every((link) => (
        link.getAttribute("target") === "_blank"
        && link.getAttribute("rel") === "noopener noreferrer"
      )))).toBe(true);
    }
  }
});
