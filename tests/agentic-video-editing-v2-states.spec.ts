import { createHash } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import axe from "axe-core";

import {
  AGENTIC_VIDEO_EDITING_CAPSTONE_ATTESTED_KEY,
  AGENTIC_VIDEO_EDITING_CAPSTONE_EVIDENCE_IDS,
  AGENTIC_VIDEO_EDITING_CAPSTONE_EVIDENCE_KEY,
  AGENTIC_VIDEO_EDITING_CAPSTONE_KEY,
  AGENTIC_VIDEO_EDITING_COURSE_MANIFEST,
  AGENTIC_VIDEO_EDITING_EN_COPY,
  AGENTIC_VIDEO_EDITING_FIXTURE_LEDGER_SHA256,
  AGENTIC_VIDEO_EDITING_MODULE_RECEIPT_SCHEMA,
  AGENTIC_VIDEO_EDITING_PREFLIGHT_KEY,
  AGENTIC_VIDEO_EDITING_PREFLIGHT_RECEIPT_SCHEMA,
  AGENTIC_VIDEO_EDITING_PROGRESS_VERSION,
  AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY,
  AGENTIC_VIDEO_EDITING_PROJECT_ID,
  AGENTIC_VIDEO_EDITING_QUIZ_BEST_KEY,
  AGENTIC_VIDEO_EDITING_QUIZ_BEST_PASSED_KEY,
  AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_FORM_KEY,
  AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_PASSED_KEY,
  AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_SCORE_KEY,
  AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_VERSION_KEY,
  AGENTIC_VIDEO_EDITING_QUIZ_FORM,
  AGENTIC_VIDEO_EDITING_QUIZ_VERSION,
  agenticVideoEditingArtifactReceiptKey,
  agenticVideoEditingCheckpointKey,
} from "../lib/agentic-video-editing";

const hash = (value: string) => createHash("sha256").update(value).digest("hex");

async function allWcagViolations(page: Page) {
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
            tags: readonly string[];
            nodes: readonly { target: readonly string[]; html: string }[];
          }[];
        }>;
      };
    }).axe;
    const result = await axeApi.run(document, { resultTypes: ["violations"] });
    return result.violations
      .filter((violation) => violation.tags.some((tag) => /^wcag/iu.test(tag)))
      .map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      tags: violation.tags,
      nodes: violation.nodes.map((node) => ({
        target: node.target,
        html: node.html,
      })),
      }));
  });
}

function completedProgress(): Record<string, unknown> {
  const progress: Record<string, unknown> = {
    [AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY]: AGENTIC_VIDEO_EDITING_PROGRESS_VERSION,
    [AGENTIC_VIDEO_EDITING_PREFLIGHT_KEY]: JSON.stringify({
      schemaVersion: AGENTIC_VIDEO_EDITING_PREFLIGHT_RECEIPT_SCHEMA,
      courseId: "agentic-video-editing",
      courseVersion: "2.0.0",
      projectId: AGENTIC_VIDEO_EDITING_PROJECT_ID,
      fixtureLedgerSha256: AGENTIC_VIDEO_EDITING_FIXTURE_LEDGER_SHA256,
      lane: "audit-only",
      directories: {
        input: "fixtures/read-only/",
        work: "work/course22/",
        cache: "work/course22/cache/",
        receipts: "work/course22/receipts/",
        output: "work/course22/output/",
      },
      contractFormats: ["json", "yaml"],
      clockProbeConfirmed: true,
      secretInjection: "host-secret-store-or-environment",
      uploadDataPath: "offline-fixture-no-upload",
      offline: true,
      noSecrets: true,
      validatedAt: "2026-08-28T00:00:00+08:00",
    }),
  };
  const guidedHashes = new Map<string, string>();
  for (const moduleManifest of AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.slice(0, 9)) {
    progress[agenticVideoEditingCheckpointKey(moduleManifest.slug)] = true;
    const inputs = Object.fromEntries(moduleManifest.consumesArtifactIds.map(
      (artifactId) => [artifactId, guidedHashes.get(artifactId)],
    ));
    const receipts = moduleManifest.producesArtifactIds.map((artifactId) => {
      const artifactSha256 = hash(`${moduleManifest.slug}:${artifactId}`);
      guidedHashes.set(artifactId, artifactSha256);
      const artifactPath = `work/course22/${artifactId}.json`;
      return {
        schemaVersion: AGENTIC_VIDEO_EDITING_MODULE_RECEIPT_SCHEMA,
        courseId: "agentic-video-editing",
        courseVersion: "2.0.0",
        moduleSlug: moduleManifest.slug,
        projectId: AGENTIC_VIDEO_EDITING_PROJECT_ID,
        artifactId,
        artifactPath,
        artifactSha256,
        inputArtifactIdsAndHashes: inputs,
        artifactSchemaId: moduleManifest.artifactSchemaId,
        validatorId: moduleManifest.validatorId,
        validatorVersion: "2.0.0",
        executedCommand: moduleManifest.validatorCommand
          .replace("<project-root>", "/tmp/aicourse-course22-browser-guided")
          .replace("<artifact-id>", artifactId)
          .replace("<artifact-path>", artifactPath)
          .replace("<validated-at>", "2026-08-28T00:00:00+08:00"),
        validatedAt: "2026-08-28T00:00:00+08:00",
        status: "validated",
        limitations: [
          "The browser fixture is synthetic and contains no playable learner media.",
          "Receipt structure does not grant publication or deployment authority.",
        ],
      };
    });
    progress[agenticVideoEditingArtifactReceiptKey(moduleManifest.slug)] = JSON.stringify(receipts);
  }

  const capstone = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules[9];
  const learnerProjectId = "learner-browser-project-v2";
  const inputArtifactIdsAndHashes = Object.fromEntries(
    capstone.consumesArtifactIds.map((artifactId) => [
      artifactId,
      hash(`${learnerProjectId}:${artifactId}`),
    ]),
  );
  const capstoneReceipts = capstone.producesArtifactIds.map((artifactId) => {
    const artifactPath = `work/learner/${artifactId}.json`;
    return {
      schemaVersion: AGENTIC_VIDEO_EDITING_MODULE_RECEIPT_SCHEMA,
      courseId: "agentic-video-editing",
      courseVersion: "2.0.0",
      moduleSlug: capstone.slug,
      projectId: learnerProjectId,
      artifactId,
      artifactPath,
      artifactSha256: hash(`${learnerProjectId}:${artifactId}`),
      inputArtifactIdsAndHashes,
      artifactSchemaId: capstone.artifactSchemaId,
      validatorId: capstone.validatorId,
      validatorVersion: "2.0.0",
      executedCommand: capstone.validatorCommand
        .replace("<project-root>", "/tmp/aicourse-course22-browser-learner")
        .replace("<artifact-id>", artifactId)
        .replace("<artifact-path>", artifactPath)
        .replace("<validated-at>", "2026-08-28T00:00:00+08:00"),
      validatedAt: "2026-08-28T00:00:00+08:00",
      status: "validated",
      limitations: [
        "The named reviewer and learner authorization remain externally accountable claims.",
        "Validation does not grant publication or deployment authority.",
      ],
    };
  });
  const capstoneReceiptJson = JSON.stringify(capstoneReceipts);
  progress[agenticVideoEditingCheckpointKey(capstone.slug)] = true;
  progress[agenticVideoEditingArtifactReceiptKey(capstone.slug)] = capstoneReceiptJson;
  progress[AGENTIC_VIDEO_EDITING_CAPSTONE_KEY] = capstoneReceiptJson;
  progress[AGENTIC_VIDEO_EDITING_QUIZ_BEST_KEY] = 100;
  progress[AGENTIC_VIDEO_EDITING_QUIZ_BEST_PASSED_KEY] = true;
  progress[AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_SCORE_KEY] = 100;
  progress[AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_PASSED_KEY] = true;
  progress[AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_VERSION_KEY] = AGENTIC_VIDEO_EDITING_QUIZ_VERSION;
  progress[AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_FORM_KEY] = AGENTIC_VIDEO_EDITING_QUIZ_FORM;
  const releaseHash = capstoneReceipts.find(
    (receipt) => receipt.artifactId === "release-decision",
  )!.artifactSha256;
  progress[AGENTIC_VIDEO_EDITING_CAPSTONE_EVIDENCE_KEY] =
    AGENTIC_VIDEO_EDITING_CAPSTONE_EVIDENCE_IDS.map((artifactId) => {
      const baseArtifactId = artifactId.replace(/^capstone-/u, "");
      const evidenceModule = artifactId === "release-decision"
        ? capstone
        : AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.find(
          (moduleManifest) => (moduleManifest.producesArtifactIds as readonly string[])
            .includes(baseArtifactId),
        )!;
      return {
        artifactId,
        locator: `artifacts/${artifactId}.json`,
        sha256: artifactId === "release-decision"
          ? releaseHash
          : inputArtifactIdsAndHashes[artifactId],
        reviewState: "reviewed-pass",
        reviewerId: "named-human-browser-fixture",
        reviewedAt: "2026-08-28T00:00:00+08:00",
        learnerProjectId,
        artifactSchemaId: evidenceModule.artifactSchemaId,
        validatorId: evidenceModule.validatorId,
      };
    });
  progress[AGENTIC_VIDEO_EDITING_CAPSTONE_ATTESTED_KEY] = true;
  return progress;
}

test("Course 22 has no WCAG-tagged axe violations in both authored locales and theme modes", async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem("ae.theme") === null) {
      localStorage.setItem("ae.theme", "dark");
    }
  });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  for (const locale of ["en", "zh-Hans"] as const) {
    await page.goto(`/${locale}/agentic-video-editing/`, { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    const reducedMotionAnimations = await page
      .locator('[class*="__heroCopy"], [class*="__pipelineMap"]')
      .evaluateAll((elements) => elements.map(
        (element) => getComputedStyle(element).animationName,
      ));
    expect(reducedMotionAnimations, `${locale} reduced-motion targets`).toHaveLength(2);
    expect(
      reducedMotionAnimations.every((animationName) => animationName === "none"),
      `${locale} reduced-motion computed animation names: ${reducedMotionAnimations.join(", ")}`,
    ).toBe(true);
    expect(await allWcagViolations(page), `${locale} dark dashboard`).toEqual([]);
  }

  await page.evaluate(() => localStorage.setItem("ae.theme", "light"));
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "no-preference" });
  for (const locale of ["en", "zh-Hans"] as const) {
    await page.goto(`/${locale}/agentic-video-editing/declarative-edit-plan/`, {
      waitUntil: "networkidle",
    });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    expect(await allWcagViolations(page), `${locale} light module`).toEqual([]);
  }
});

test("Course 22 rejects invalid receipts and exposes draft, completed, and stale capstone states", async ({ page }) => {
  await page.goto("/en/agentic-video-editing/agentic-editing-contract/", {
    waitUntil: "networkidle",
  });
  const practice = page.locator("#module-practice");
  await practice.locator("textarea").nth(1).fill(JSON.stringify([{
    schemaVersion: AGENTIC_VIDEO_EDITING_MODULE_RECEIPT_SCHEMA,
    artifactSha256: "0".repeat(64),
  }]));
  await expect(practice.getByRole("button", { name: "Save validator receipt" })).toBeDisabled();

  await page.goto("/en/agentic-video-editing/", { waitUntil: "networkidle" });
  const capstone = page.locator("#agentic-video-editing-capstone");
  await expect(capstone).toHaveAttribute("data-state", "draft");
  await expect(capstone.getByRole("status")).toContainText("Draft:");

  const completed = completedProgress();
  await page.evaluate((record) => {
    localStorage.setItem("ae.progress", JSON.stringify(record));
  }, completed);
  await page.reload({ waitUntil: "networkidle" });
  await expect(capstone).toHaveAttribute("data-state", "completed");
  await expect(capstone.getByRole("status")).toContainText("structurally consistent");

  const assessment = page.locator("#agentic-video-editing-assessment");
  const questions = assessment.locator("fieldset");
  for (const [index, question] of AGENTIC_VIDEO_EDITING_EN_COPY.finalAssessment.questions.entries()) {
    const incorrectIndex = (question.correctIndex + 1) % question.options.length;
    await questions.nth(index).locator('input[type="radio"]').nth(incorrectIndex).check();
  }
  await assessment.getByRole("button", { name: "Score assessment" }).click();
  await expect(capstone).toHaveAttribute("data-state", "stale");
  await page.reload({ waitUntil: "networkidle" });
  const persistedResult = assessment.locator('[role="status"]');
  await expect(persistedResult).toContainText("Score: 0%");
  await expect(persistedResult).toContainText("Current attempt: Pending");
  await expect(persistedResult).toContainText("Historical best pass: Complete");
  await expect(persistedResult).toContainText(
    "Your earlier passing record remains saved; this attempt did not pass.",
  );
  await expect(capstone).toHaveAttribute("data-state", "stale");
  await expect(capstone.getByRole("status")).toContainText("Stale:");
});

test("Course 22 mobile navigation and module map preserve keyboard order and focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/zh-Hans/agentic-video-editing/declarative-edit-plan/", {
    waitUntil: "networkidle",
  });

  const navToggle = page.locator(".navtoggle");
  await navToggle.focus();
  await navToggle.press("Enter");
  await expect(navToggle).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Tab");
  await expect(page.locator(".mainnav a").first()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(navToggle).toHaveAttribute("aria-expanded", "false");
  await expect(navToggle).toBeFocused();

  const courseMap = page.locator("main details").first();
  const summary = courseMap.locator("summary");
  await summary.focus();
  await summary.press("Enter");
  await expect(courseMap).toHaveAttribute("open", "");
  await page.keyboard.press("Tab");
  await expect(courseMap.locator("a").first()).toBeFocused();
});
