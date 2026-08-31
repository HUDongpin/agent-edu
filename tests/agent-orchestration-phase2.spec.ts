import { existsSync, readFileSync } from "node:fs";
import type { Page } from "@playwright/test";
import axe from "axe-core";
import { expect, test } from "../e2e/fixtures";
import {
  AGENT_ORCHESTRATION_QUIZ_BEST_KEY,
  AGENT_ORCHESTRATION_QUIZ_PASSED_KEY,
} from "../lib/agent-orchestration/assessment-validation";
import { AGENT_ORCHESTRATION_EN_COPY } from "../lib/agent-orchestration/copy/en";
import {
  AGENT_ORCHESTRATION_MODULE_SLUGS,
} from "../lib/agent-orchestration/types";
import {
  createAgentOrchestrationWorkspace,
  serializeAgentOrchestrationWorkspace,
} from "../lib/agent-orchestration/workspace";
import { AGENT_ORCHESTRATION_PROGRESS_SCHEMA } from "../lib/progress-topology";

const PROGRESS_KEY = "ae.progress";
const OVERVIEW = "/en/agent-orchestration/";
const ASSESSMENT = "/en/agent-orchestration/assessment/";
const CAPSTONE = "/en/agent-orchestration/capstone/";
const MODULE_ONE = "/en/agent-orchestration/workflow-agent-boundary/";
const EN_QUESTIONS = AGENT_ORCHESTRATION_MODULE_SLUGS.map((moduleSlug) => ({
  moduleSlug,
  checkpoint: AGENT_ORCHESTRATION_EN_COPY.modules[moduleSlug].checkpoint,
}));
const NAVIGATION = [
  ["Overview", "/en/agent-orchestration/"],
  ["Curriculum", "/en/agent-orchestration/#agent-orchestration-curriculum"],
  ["Assessment", ASSESSMENT],
  ["Capstone", CAPSTONE],
  ["Sources", "/en/agent-orchestration/#agent-orchestration-sources"],
] as const;

async function waitForAssessment(page: Page): Promise<void> {
  await expect(page.getByTestId("agent-orchestration-assessment")
    .locator('input[type="radio"]')
    .first()).toBeEnabled();
}

async function waitForCapstone(page: Page): Promise<void> {
  await expect(page.getByTestId("agent-orchestration-capstone")
    .locator('input[type="text"]')
    .first()).toBeEnabled();
}

async function expectNoDefiniteAxeViolations(page: Page): Promise<void> {
  await page.addScriptTag({ content: axe.source });
  const violations = await page.evaluate(async () => {
    const axeApi = (window as unknown as { axe: typeof import("axe-core") }).axe;
    const result = await axeApi.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
      },
      resultTypes: ["violations"],
    });
    return result.violations.map((violation) => violation.id);
  });
  expect(violations).toEqual([]);
}

test.describe("Course 15 Phase 2 information architecture", () => {
  test("assessment and capstone use the fixed static locale-page contract", async ({
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "One source audit proves the shared route contract.");
    for (const route of ["assessment", "capstone"] as const) {
      const file = `app/[locale]/agent-orchestration/${route}/page.tsx`;
      const exists = existsSync(file);
      expect.soft(exists, `${file} exists`).toBe(true);
      if (!exists) continue;
      const source = readFileSync(file, "utf8");
      expect.soft(source).toMatch(/export\s+const\s+dynamicParams\s*=\s*false\s*;/u);
      expect.soft(source).toMatch(/generateStaticParams\(\)/u);
      expect.soft(source).toContain('courseLocaleParams("agent-orchestration")');
      expect.soft(source).toMatch(/const\s+\{\s*locale\s*\}\s*=\s*await\s+params/u);
      expect.soft(source).toMatch(/export\s+async\s+function\s+generateMetadata/u);
      expect.soft(source).toContain(`agentOrchestrationFixedPage("${route}")`);
      expect.soft(source).toContain("CourseStaticPageShell");
    }
  });

  test("overview is a compact launch surface with one explicit navigator", async ({
    browserName,
    page,
  }) => {
    test.skip(browserName !== "chromium", "The information architecture is shared across engines.");
    await page.goto(OVERVIEW);
    const navigator = page.getByTestId("agent-orchestration-course-navigator");
    await expect(navigator).toBeVisible();
    await expect(navigator.getByRole("link")).toHaveCount(NAVIGATION.length);
    for (const [name, href] of NAVIGATION) {
      await expect(navigator.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
    }
    await expect(navigator.getByRole("link", { name: "Overview", exact: true }))
      .toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", {
      name: "Comprehensive production practice, with every boundary visible",
    })).toBeVisible();
    await expect(page.getByRole("heading", {
      name: "One accountable path through a dynamic system",
    })).toBeVisible();
    await expect(page.locator("#agent-orchestration-curriculum")).toBeVisible();
    await expect(page.locator("#agent-orchestration-sources")).toBeVisible();
    await expect(page.getByTestId("agent-orchestration-workspace")).toBeVisible();
    await expect(page.getByTestId("agent-orchestration-assessment")).toHaveCount(0);
    await expect(page.getByTestId("agent-orchestration-capstone")).toHaveCount(0);
    await expect(page.getByRole("heading", {
      name: "Six distinctions that prevent category errors",
    })).toHaveCount(0);
    await expect(page.getByRole("heading", {
      name: "Nine patterns, chosen by control need",
    })).toHaveCount(0);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    const compactness = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollHeight: document.documentElement.scrollHeight,
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }));
    expect(compactness.scrollHeight).toBeLessThanOrEqual(20_000);
    expect(compactness.scrollWidth).toBe(compactness.clientWidth);
    expect(compactness.clientWidth).toBe(compactness.viewportWidth);
    const mobileNavigator = page.getByTestId("agent-orchestration-course-navigator");
    for (const link of await mobileNavigator.getByRole("link").all()) {
      const box = await link.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    }
    const currentLink = mobileNavigator.getByRole("link", { name: "Overview", exact: true });
    await expect(currentLink).toHaveAttribute("aria-current", "page");
    await expect(currentLink.locator("[data-nav-state]"))
      .toContainText("Current");
  });

  test("dedicated assessment and capstone documents publish canonical locale siblings", async ({
    browserName,
    page,
    request,
  }) => {
    test.skip(browserName !== "chromium", "One browser proves the shared static documents.");
    for (const locale of ["en", "zh-Hans"] as const) {
      for (const route of ["assessment", "capstone"] as const) {
        const path = `/${locale}/agent-orchestration/${route}/`;
        const response = await request.get(path);
        expect(response.status(), path).toBe(200);
      }
    }

    await page.goto(ASSESSMENT);
    await expect(page.getByTestId("agent-orchestration-assessment-page")).toBeVisible();
    await expect(page.getByTestId("agent-orchestration-assessment")).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://aicourse.top/en/agent-orchestration/assessment/",
    );
    await expect(page.locator('link[rel="alternate"][hreflang="zh-Hans"]')).toHaveAttribute(
      "href",
      "https://aicourse.top/zh-Hans/agent-orchestration/assessment/",
    );
    await expect(page.getByRole("navigation", { name: "Course sections" })
      .getByRole("link", { name: "Assessment", exact: true }))
      .toHaveAttribute("aria-current", "page");

    await page.goto(CAPSTONE);
    await expect(page.getByTestId("agent-orchestration-capstone-page")).toBeVisible();
    await expect(page.getByTestId("agent-orchestration-capstone")).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://aicourse.top/en/agent-orchestration/capstone/",
    );
    await expect(page.locator('link[rel="alternate"][hreflang="zh-Hans"]')).toHaveAttribute(
      "href",
      "https://aicourse.top/zh-Hans/agent-orchestration/capstone/",
    );
    await expect(page.getByRole("navigation", { name: "Course sections" })
      .getByRole("link", { name: "Capstone", exact: true }))
      .toHaveAttribute("aria-current", "page");
  });
});

test.describe("Course 15 Phase 2 guided assessment and capstone", () => {
  test("assessment guides, explains, focuses, links, and retries in every engine", async ({
    page,
  }) => {
    await page.goto(ASSESSMENT);
    await waitForAssessment(page);
    const assessment = page.getByTestId("agent-orchestration-assessment");
    const answered = page.getByTestId("agent-orchestration-assessment-answered");
    const grade = assessment.getByRole("button", { name: "Grade assessment" });
    const fieldsets = assessment.locator("fieldset");
    await expect(fieldsets).toHaveCount(EN_QUESTIONS.length);
    await expect(answered).toContainText("0 of 15");
    await expect(grade).toBeDisabled();

    let firstWrongOptionId = "";
    for (const [index, { checkpoint }] of EN_QUESTIONS.entries()) {
      const optionId = index === 0
        ? checkpoint.options.find(
          (option) => option.id !== checkpoint.correctOptionId,
        )!.id
        : checkpoint.correctOptionId;
      const input = fieldsets.nth(index)
        .locator(`input[type="radio"][value="${optionId}"]`);
      await input.check();
      if (index === 0) {
        firstWrongOptionId = optionId;
        await expect(answered).toContainText("1 of 15");
        await expect(input.locator("..")).toHaveAttribute("data-selected", "true");
      }
    }

    await expect(answered).toContainText("15 of 15");
    await expect(grade).toBeEnabled();
    await grade.click();

    const result = page.getByTestId("agent-orchestration-assessment-result");
    await expect(result).toBeFocused();
    await expect(result).toContainText("93%");
    const missed = page.getByTestId("agent-orchestration-assessment-missed");
    await expect(missed).toHaveCount(1);
    await expect(missed).toContainText(EN_QUESTIONS[0].checkpoint.explanation);
    await expect(missed.getByRole("link")).toHaveAttribute(
      "href",
      `/en/agent-orchestration/${EN_QUESTIONS[0].moduleSlug}/#module-checkpoint`,
    );
    await expect(fieldsets.first()
      .locator(`input[value="${firstWrongOptionId}"]`)
      .locator(".."))
      .toHaveAttribute("data-result", "missed");
    await expect(fieldsets.first()
      .locator(`input[value="${EN_QUESTIONS[0].checkpoint.correctOptionId}"]`)
      .locator(".."))
      .toHaveAttribute("data-result", "correct");

    await result.getByRole("button", { name: "Try the assessment again" }).click();
    await expect(answered).toContainText("0 of 15");
    await expect(result).toHaveCount(0);
    await expect(missed).toHaveCount(0);
    await expect(fieldsets.first().locator('input[type="radio"]').first()).toBeFocused();
    await expect(grade).toBeDisabled();
  });

  test("a lower later assessment cannot reduce the best score or pass", async ({
    browserName,
    page,
  }) => {
    test.skip(browserName !== "chromium", "Monotonic persistence is browser-independent and unit-covered.");
    await page.addInitScript(({ key, seed }) => {
      localStorage.setItem(key, JSON.stringify(seed));
    }, {
      key: PROGRESS_KEY,
      seed: {
        [AGENT_ORCHESTRATION_PROGRESS_SCHEMA.versionKey]:
          AGENT_ORCHESTRATION_PROGRESS_SCHEMA.version,
        [AGENT_ORCHESTRATION_QUIZ_BEST_KEY]: 100,
        [AGENT_ORCHESTRATION_QUIZ_PASSED_KEY]: true,
      },
    });
    await page.goto(ASSESSMENT);
    await waitForAssessment(page);
    const assessment = page.getByTestId("agent-orchestration-assessment");
    const fieldsets = assessment.locator("fieldset");
    for (const [index, { checkpoint }] of EN_QUESTIONS.entries()) {
      const wrong = checkpoint.options.find(
        (option) => option.id !== checkpoint.correctOptionId,
      )!;
      await fieldsets.nth(index).locator(`input[value="${wrong.id}"]`).check();
    }
    await assessment.getByRole("button", { name: "Grade assessment" }).click();
    const result = page.getByTestId("agent-orchestration-assessment-result");
    await expect(result).toContainText("0% · Attempt below threshold; prior pass preserved");
    const stored = await page.evaluate((key) => JSON.parse(
      localStorage.getItem(key) ?? "{}",
    ), PROGRESS_KEY);
    expect(stored[AGENT_ORCHESTRATION_QUIZ_BEST_KEY]).toBe(100);
    expect(stored[AGENT_ORCHESTRATION_QUIZ_PASSED_KEY]).toBe(true);
  });

  test("capstone reason codes and first-unresolved review work in every engine", async ({
    page,
  }) => {
    await page.goto(CAPSTONE);
    await waitForCapstone(page);
    const capstone = page.getByTestId("agent-orchestration-capstone");
    const cards = capstone.locator("ol > li");
    const inputs = capstone.locator('input[type="text"]');
    const reviewFirst = page.getByTestId("agent-orchestration-capstone-review-first");
    await expect(cards).toHaveCount(15);
    await expect(inputs).toHaveCount(15);

    await reviewFirst.click();
    await expect(inputs.first()).toBeFocused();
    await expect(cards.first()).toHaveAttribute("data-reason", "required");
    await expect(inputs.first()).toHaveAttribute("aria-invalid", "true");
    await expect(cards.first()
      .getByTestId("agent-orchestration-capstone-field-feedback"))
      .toContainText("Add an evidence reference");

    await inputs.first().fill("https://evidence.company.org/run/verified-0001");
    await inputs.first().blur();
    await expect(cards.first()).toHaveAttribute("data-valid", "true");
    await expect(cards.first()
      .getByTestId("agent-orchestration-capstone-field-feedback"))
      .toContainText("passes the local format");
    await reviewFirst.click();
    await expect(inputs.nth(1)).toBeFocused();

    const duplicate = "https://evidence.company.org/run/verified-0002";
    await inputs.nth(1).fill(duplicate);
    await inputs.nth(1).blur();
    await inputs.nth(2).fill(`${duplicate}#copy`);
    await inputs.nth(2).blur();
    await expect(capstone.locator('ol > li[data-reason="duplicate"]')).toHaveCount(2);
    await expect(inputs.nth(1)).toHaveAttribute("aria-invalid", "true");
    await expect(inputs.nth(2)).toHaveAttribute("aria-invalid", "true");

    await inputs.nth(3).fill("todo-placeholder-01");
    await inputs.nth(3).blur();
    await expect(cards.nth(3)).toHaveAttribute("data-reason", "placeholder");
    await expect(cards.nth(3)
      .getByTestId("agent-orchestration-capstone-field-feedback"))
      .toContainText(AGENT_ORCHESTRATION_EN_COPY.ui.evidencePlaceholderReason);
  });
});

test.describe("Course 15 Phase 2 draft and workspace integrity", () => {
  test("artifact and lab drafts debounce, flush, and name their status", async ({
    browserName,
    page,
  }) => {
    test.skip(browserName !== "chromium", "Timer and localStorage semantics are engine-independent and unit-covered.");
    await page.goto(MODULE_ONE);
    const artifact = page.getByTestId("agent-orchestration-artifact-draft");
    await expect(artifact).toBeEnabled();
    await page.evaluate((key) => {
      const original = Storage.prototype.setItem;
      (window as unknown as { __aoWriteCount: number }).__aoWriteCount = 0;
      Storage.prototype.setItem = function setItem(storageKey, value) {
        if (storageKey === key) {
          (window as unknown as { __aoWriteCount: number }).__aoWriteCount += 1;
        }
        return original.call(this, storageKey, value);
      };
    }, PROGRESS_KEY);
    const resetWrites = () => page.evaluate(() => {
      (window as unknown as { __aoWriteCount: number }).__aoWriteCount = 0;
    });
    const writeCount = () => page.evaluate(() => (
      (window as unknown as { __aoWriteCount: number }).__aoWriteCount
    ));

    await resetWrites();
    await artifact.focus();
    await artifact.press("End");
    await artifact.pressSequentially(" debounced artifact edits 1234567890");
    const workbench = page.getByTestId("agent-orchestration-artifact-workbench");
    await expect(workbench).toHaveAttribute("data-draft-status", "editing");
    await expect(workbench.getByRole("status")).toContainText("Editing");
    expect(await writeCount()).toBe(0);
    await page.waitForTimeout(700);
    expect(await writeCount()).toBe(1);
    await expect(workbench).toHaveAttribute("data-draft-status", "draft-saved");
    await expect(workbench.getByRole("status")).toContainText("Draft saved");

    await resetWrites();
    await artifact.pressSequentially(" blur flush");
    expect(await writeCount()).toBe(0);
    await artifact.blur();
    expect(await writeCount()).toBe(1);
    await expect(workbench).toHaveAttribute("data-draft-status", "draft-saved");

    const lab = page.getByTestId("agent-orchestration-lab");
    const labEvidence = lab.locator("textarea");
    await resetWrites();
    await labEvidence.pressSequentially(
      "Because the route is bounded, therefore the evidence remains reviewable.",
    );
    await expect(lab).toHaveAttribute("data-draft-status", "editing");
    expect(await writeCount()).toBe(0);
    await page.waitForTimeout(700);
    expect(await writeCount()).toBe(1);
    await expect(lab).toHaveAttribute("data-draft-status", "draft-saved");

    await resetWrites();
    await labEvidence.pressSequentially(" Pagehide flushes the latest bytes.");
    expect(await writeCount()).toBe(0);
    await page.evaluate(() => {
      window.dispatchEvent(new PageTransitionEvent("pagehide"));
    });
    expect(await writeCount()).toBe(1);
    const pending = await page.evaluate((key) => JSON.parse(
      localStorage.getItem(key) ?? "{}",
    ), PROGRESS_KEY);
    expect(Object.entries(pending).some(([key, value]) => (
      key.endsWith(".pending")
      && JSON.stringify(value).includes("Pagehide flushes the latest bytes.")
    ))).toBe(true);
  });

  test("workspace preview and apply are add-only, Course 15-only, and fail closed", async ({
    browserName,
    page,
  }) => {
    test.skip(browserName !== "chromium", "File parsing and add-only apply are engine-independent and unit-covered.");
    const localKey = "agent-orchestration.module.workflow-agent-boundary.artifact.pending-draft";
    const addKey = "agent-orchestration.module.task-graphs-contracts.artifact.pending-draft";
    const seed = {
      "another-course.keep": { exact: true },
      [AGENT_ORCHESTRATION_PROGRESS_SCHEMA.versionKey]:
        AGENT_ORCHESTRATION_PROGRESS_SCHEMA.version,
      [localKey]: "newer local artifact — preserve exactly",
    };
    const workspaceText = serializeAgentOrchestrationWorkspace(
      createAgentOrchestrationWorkspace({
        [AGENT_ORCHESTRATION_PROGRESS_SCHEMA.versionKey]:
          AGENT_ORCHESTRATION_PROGRESS_SCHEMA.version,
        [localKey]: "older imported artifact",
        [addKey]: "imported module-two draft with exact  spacing",
      }, "2026-08-30T06:07:08.901Z"),
    );
    await page.addInitScript(({ key, value }) => {
      localStorage.setItem(key, JSON.stringify(value));
    }, { key: PROGRESS_KEY, value: seed });
    await page.goto(OVERVIEW);
    await expect(page.getByTestId("agent-orchestration-progress").first())
      .toHaveAttribute("data-storage-status", "available");
    const input = page.getByTestId("agent-orchestration-workspace-import");
    await input.setInputFiles({
      name: "course-15-workspace.json",
      mimeType: "application/json",
      buffer: Buffer.from(workspaceText),
    });
    const preview = page.getByTestId("agent-orchestration-workspace-preview");
    await expect(preview).toBeVisible();
    await expect(preview.locator("dl > div").filter({ hasText: "Will add" }).locator("dd"))
      .toHaveText("1");
    await expect(preview.locator("dl > div").filter({ hasText: "Already identical" }).locator("dd"))
      .toHaveText("1");
    await expect(preview.locator("dl > div").filter({ hasText: "Keep local" }).locator("dd"))
      .toHaveText("1");
    const apply = page.getByTestId("agent-orchestration-workspace-apply");
    await expect(apply).toHaveText("Restore new content (1)");
    await apply.click();
    await expect(page.getByTestId("agent-orchestration-workspace-result"))
      .toContainText("Restore complete: 1 added; 1 kept local.");
    const restored = await page.evaluate((key) => JSON.parse(
      localStorage.getItem(key) ?? "{}",
    ), PROGRESS_KEY);
    expect(restored[localKey]).toBe(seed[localKey]);
    expect(restored[addKey]).toBe("imported module-two draft with exact  spacing");
    expect(restored["another-course.keep"]).toEqual({ exact: true });

    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("agent-orchestration-workspace-export").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^agent-orchestration-workspace-\d{4}-\d{2}-\d{2}\.json$/u);
    const stream = await download.createReadStream();
    expect(stream).not.toBeNull();
    const chunks: Buffer[] = [];
    for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
    const exported = JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
      fields: { key: string; value: unknown }[];
    };
    expect(exported.fields.every(({ key }) => key.startsWith("agent-orchestration.")))
      .toBe(true);
    expect(exported.fields.some(({ key }) => key === "another-course.keep")).toBe(false);
    expect(exported.fields.find(({ key }) => key === localKey)?.value).toBe(seed[localKey]);

    const crafted = JSON.parse(workspaceText) as {
      fields: { key: string; value: unknown }[];
    };
    crafted.fields.push({
      key: "agent-orchestration.module.workflow-agent-boundary.complete",
      value: true,
    });
    const rawBeforeRejection = await page.evaluate(
      (key) => localStorage.getItem(key),
      PROGRESS_KEY,
    );
    await input.setInputFiles({
      name: "crafted-completion.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(crafted)),
    });
    await expect(page.getByTestId("agent-orchestration-workspace-errors"))
      .toContainText("learning evidence did not pass validation");
    expect(await page.evaluate((key) => localStorage.getItem(key), PROGRESS_KEY))
      .toBe(rawBeforeRejection);
  });
});

test.describe("Course 15 Phase 2 localization and accessibility", () => {
  test("native Chinese routes keep interaction and rejection copy localized", async ({
    browserName,
    page,
  }) => {
    test.skip(browserName !== "chromium", "One browser proves the native copy boundary.");
    await page.goto("/zh-Hans/agent-orchestration/assessment/");
    await waitForAssessment(page);
    await expect(page.getByRole("heading", { level: 1, name: "结课测验" })).toBeVisible();
    await expect(page.getByTestId("agent-orchestration-assessment-answered"))
      .toContainText("0 共 15");
    await expect(page.getByRole("navigation", { name: "课程分区" })
      .getByRole("link", { name: "结课测评", exact: true }))
      .toHaveAttribute("aria-current", "page");

    await page.goto("/zh-Hans/agent-orchestration/");
    await expect(page.getByTestId("agent-orchestration-progress").first())
      .toHaveAttribute("data-storage-status", "available");
    await page.getByTestId("agent-orchestration-workspace-import").setInputFiles({
      name: "invalid.json",
      mimeType: "application/json",
      buffer: Buffer.from("{invalid"),
    });
    const errors = page.getByTestId("agent-orchestration-workspace-errors");
    await expect(errors).toContainText("未接受此文件");
    await expect(errors).toContainText("未通过验证");
    await expect(errors).not.toContainText("File not accepted");
  });

  test("assessment and capstone have no definite WCAG or mobile overflow regressions", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const path of [ASSESSMENT, CAPSTONE]) {
      await page.goto(path);
      if (path === ASSESSMENT) await waitForAssessment(page);
      else await waitForCapstone(page);
      const geometry = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(geometry.scrollWidth).toBe(geometry.clientWidth);
      await expectNoDefiniteAxeViolations(page);
    }
    await page.goto(CAPSTONE);
    await waitForCapstone(page);
    expect(await page.getByTestId("agent-orchestration-capstone")
      .locator('input[type="text"]')
      .first()
      .evaluate((element) => getComputedStyle(element).fontSize)).toBe("16px");
  });
});

test.describe("Course 15 Phase 2 coarse-pointer targets", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

  test("navigator, assessment options, and capstone inputs meet 44px", async ({ page }) => {
    await page.goto(ASSESSMENT);
    await waitForAssessment(page);
    for (const locator of [
      page.getByTestId("agent-orchestration-course-navigator").getByRole("link"),
      page.getByTestId("agent-orchestration-assessment").locator("label"),
    ]) {
      for (const target of await locator.all()) {
        const box = await target.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.height).toBeGreaterThanOrEqual(44);
      }
    }
    await page.goto(CAPSTONE);
    await waitForCapstone(page);
    for (const input of await page.getByTestId("agent-orchestration-capstone")
      .locator('input[type="text"]')
      .all()) {
      const box = await input.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });
});
