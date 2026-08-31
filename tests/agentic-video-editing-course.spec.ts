import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { expect, test, type Locator, type Page } from "@playwright/test";
import axe from "axe-core";
import {
  AGENTIC_VIDEO_EDITING_CAPSTONE_KEY,
  AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS,
  AGENTIC_VIDEO_EDITING_COURSE_MANIFEST,
  AGENTIC_VIDEO_EDITING_EN_COPY,
  AGENTIC_VIDEO_EDITING_LEGACY_PROGRESS_KEY,
  AGENTIC_VIDEO_EDITING_PROGRESS_VERSION,
  AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY,
  AGENTIC_VIDEO_EDITING_QUIZ_DIAGNOSTIC_KEY,
  AGENTIC_VIDEO_EDITING_QUIZ_PASSED_KEY,
  COURSE20_FINAL_ASSESSMENT_BLUEPRINTS,
  agenticVideoEditingArtifactKey,
  agenticVideoEditingCheckpointKey,
  agenticVideoEditingModuleProgressKey,
  createCourse20ArtifactStarter,
  createCourse20ArtifactSubmission,
  createCourse20CheckpointReceipt,
  createCourse20ModuleReceipt,
  getCourse20CheckpointBlueprint,
  type AgenticVideoEditingArtifactId,
  type AgenticVideoEditingModuleSlug,
} from "../staging/course-src/agentic-video-editing";

const DASHBOARD = "/en/agentic-video-editing/";
const PROGRESS_STORAGE_KEY = "ae.progress";
const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost"]);

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

async function buildFormalReadyProgress(): Promise<Record<string, unknown>> {
  const progress: Record<string, unknown> = {
    [AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY]:
      AGENTIC_VIDEO_EDITING_PROGRESS_VERSION,
  };
  const submissions: Record<string, Awaited<ReturnType<
    typeof createCourse20ArtifactSubmission
  >>> = {};
  for (const contract of AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS.filter(
    (candidate) => candidate.requiredForModuleCompletion,
  )) {
    const submission = await createCourse20ArtifactSubmission({
      artifactId: contract.id,
      path: "core",
      contentText: createCourse20ArtifactStarter(contract.id),
      dependencySubmissions: submissions,
      ...(contract.id === "plan-diff-independent-approval"
        ? {
          reviewDecision: {
            decision: "approved" as const,
            reviewerRole: "independent Playwright fixture reviewer",
          },
        }
        : {}),
    });
    expect(submission.validationReceipt.status, contract.id).toBe("valid");
    submissions[contract.id] = submission;
    progress[agenticVideoEditingArtifactKey(contract.id, "core")] =
      submission;
  }
  for (const moduleRecord of AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules) {
    const blueprint = getCourse20CheckpointBlueprint(moduleRecord.slug);
    const checkpoint = createCourse20CheckpointReceipt(
      moduleRecord.slug,
      blueprint.correctOptionId,
    );
    expect(checkpoint).toBeTruthy();
    progress[agenticVideoEditingCheckpointKey(moduleRecord.slug)] =
      checkpoint;
    const moduleReceipt = createCourse20ModuleReceipt(
      progress,
      moduleRecord.slug,
      "core",
    );
    expect(moduleReceipt, moduleRecord.slug).toBeTruthy();
    progress[agenticVideoEditingModuleProgressKey(
      moduleRecord.slug,
      "core",
    )] = moduleReceipt;
  }
  return progress;
}

async function seedProgressBeforeNavigation(
  page: Page,
  progress: Record<string, unknown>,
): Promise<void> {
  await page.addInitScript(({ key, value }) => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, { key: PROGRESS_STORAGE_KEY, value: progress });
}

async function answerAssessmentWithWrongQuestions(
  page: Page,
  wrongQuestionIds: readonly string[],
): Promise<Locator> {
  const assessment = page.locator("#agentic-video-editing-assessment");
  for (const blueprint of Object.values(
    COURSE20_FINAL_ASSESSMENT_BLUEPRINTS,
  )) {
    const selected = wrongQuestionIds.includes(blueprint.questionId)
      ? blueprint.optionIds.find(
        (optionId) => optionId !== blueprint.correctOptionId,
      )!
      : blueprint.correctOptionId;
    await assessment.locator(
      `input[name="assessment-${blueprint.questionId}"][value="${selected}"]`,
    ).check();
  }
  await assessment.getByRole("button", {
    name: /Score assessment|提交并评分/u,
  }).click();
  return assessment;
}

async function readProgress(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    const value: unknown = JSON.parse(raw);
    return value && typeof value === "object" && !Array.isArray(value)
      ? value as Record<string, unknown>
      : {};
  }, PROGRESS_STORAGE_KEY);
}

async function expectNoSeriousAxeViolations(
  page: Page,
  label: string,
): Promise<void> {
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
      .filter((violation) => (
        violation.impact === "serious" || violation.impact === "critical"
      ))
      .map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        targets: violation.nodes.map((node) => node.target),
      }));
  });
  expect(violations, label).toEqual([]);
}

function coreWorkbench(
  page: Page,
  artifactId: AgenticVideoEditingArtifactId,
): Locator {
  return page.locator('[data-artifact-status]')
    .filter({ hasText: artifactId })
    .filter({ hasText: AGENTIC_VIDEO_EDITING_EN_COPY.ui.auditCore })
    .first();
}

function coreCompletion(
  page: Page,
  slug: AgenticVideoEditingModuleSlug,
): Locator {
  return page.locator(
    `section[aria-labelledby="completion-core-${slug}"]`,
  );
}

async function saveCurrentWorkbench(
  page: Page,
  artifactId: AgenticVideoEditingArtifactId,
): Promise<void> {
  const workbench = coreWorkbench(page, artifactId);
  await expect(workbench).toBeVisible();
  if (await workbench.locator("select").count()) {
    await workbench.locator("select").selectOption("approved");
    await workbench.locator('input[type="text"]').fill(
      "E2E accountable human reviewer",
    );
  }
  await expect(workbench).toHaveAttribute("data-artifact-status", "valid", {
    timeout: 15_000,
  });
  const beforeSave = record((await readProgress(page))[
    agenticVideoEditingArtifactKey(artifactId, "core")
  ]);
  const previousRevision = typeof beforeSave.revision === "number"
    ? beforeSave.revision
    : 0;
  await workbench.getByRole("button", {
    name: AGENTIC_VIDEO_EDITING_EN_COPY.ui.saveArtifact,
  }).click();
  await expect.poll(async () => {
    const progress = await readProgress(page);
    const submission = record(progress[
      agenticVideoEditingArtifactKey(artifactId, "core")
    ]);
    return {
      revision: submission.revision,
      status: record(submission.validationReceipt).status,
    };
  }, { message: `${artifactId} should have a persisted valid receipt` })
    .toEqual({ revision: previousRevision + 1, status: "valid" });
}

async function passCheckpoint(
  page: Page,
  slug: AgenticVideoEditingModuleSlug,
): Promise<void> {
  const checkpoint = AGENTIC_VIDEO_EDITING_EN_COPY.modules[slug].checkpoint;
  const blueprint = getCourse20CheckpointBlueprint(slug);
  const optionIndex = checkpoint.options.findIndex(
    (option) => option.id === blueprint.correctOptionId,
  );
  expect(optionIndex, `${slug} checkpoint must expose its stable answer ID`)
    .toBeGreaterThanOrEqual(0);
  const section = page.locator(
    `section[aria-labelledby="checkpoint-${slug}"]`,
  );
  await section.locator('input[type="radio"]').nth(optionIndex).check();
  await section.getByRole("button", {
    name: AGENTIC_VIDEO_EDITING_EN_COPY.ui.checkAnswer,
  }).click();
  await expect(section.getByRole("status")).toContainText(
    AGENTIC_VIDEO_EDITING_EN_COPY.ui.correct,
  );
  await expect.poll(async () => record((
    await readProgress(page)
  )[agenticVideoEditingCheckpointKey(slug)]).schemaVersion)
    .toBe("aicourse.course20.checkpoint-receipt.v1");
}

async function completeCoreModule(
  page: Page,
  slug: AgenticVideoEditingModuleSlug,
): Promise<void> {
  const response = await page.goto(`/en/agentic-video-editing/${slug}/`);
  expect(response?.status(), slug).toBe(200);
  const moduleRecord = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.find(
    (candidate) => candidate.slug === slug,
  );
  expect(moduleRecord, `manifest entry for ${slug}`).toBeTruthy();
  for (const artifactId of moduleRecord!.artifactIds) {
    await saveCurrentWorkbench(page, artifactId);
  }
  await passCheckpoint(page, slug);
  const completion = coreCompletion(page, slug);
  const button = completion.getByRole("button", {
    name: AGENTIC_VIDEO_EDITING_EN_COPY.ui.markComplete,
  });
  await expect(button).toBeEnabled();
  await button.click();
  await expect.poll(async () => record((
    await readProgress(page)
  )[agenticVideoEditingModuleProgressKey(slug, "core")]).schemaVersion)
    .toBe("aicourse.course20.module-receipt.v1");
}

async function answerAssessmentCorrectly(page: Page): Promise<Locator> {
  const assessment = page.locator("#agentic-video-editing-assessment");
  for (const question of Object.values(
    COURSE20_FINAL_ASSESSMENT_BLUEPRINTS,
  )) {
    await assessment.locator(
      `input[name="assessment-${question.questionId}"][value="${question.correctOptionId}"]`,
    ).check();
  }
  return assessment;
}

async function replaceJsonWorkbench(
  page: Page,
  artifactId: AgenticVideoEditingArtifactId,
  update: (value: Record<string, unknown>) => void,
): Promise<void> {
  const workbench = coreWorkbench(page, artifactId);
  const textarea = workbench.locator("textarea");
  const parsed: unknown = JSON.parse(await textarea.inputValue());
  const value = record(parsed);
  update(value);
  await textarea.fill(JSON.stringify(value, null, 2));
  await saveCurrentWorkbench(page, artifactId);
}

test.beforeEach(async ({ page }) => {
  // Course acceptance must not depend on third-party pages, analytics, fonts,
  // uploads, or any other external network request.
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (LOCAL_HOSTS.has(url.hostname)) await route.continue();
    else await route.abort("blockedbyclient");
  });
});

test.describe("Course 20 v1.2 public and reading contracts", () => {
  test("dashboard exposes the v1.2 workload, fallback disclosure, and two offline MP4 controls", async ({ page, request }) => {
    const response = await page.goto(DASHBOARD);
    expect(response?.status()).toBe(200);
    const dashboard = page.getByTestId(
      "agentic-video-editing-course-dashboard",
    );
    await expect(dashboard).toBeVisible();
    await expect(dashboard).toHaveAttribute("lang", "en");
    await expect(dashboard.getByRole("heading", {
      level: 1,
      name: AGENTIC_VIDEO_EDITING_EN_COPY.meta.title,
    })).toBeVisible();
    await expect(dashboard).toContainText("750 guided minutes");
    await expect(dashboard).toContainText("up to 180 optional");
    await expect(dashboard).toContainText("approximately 240 minutes");

    const courseReference = dashboard.locator(
      "#agentic-video-course-reference",
    );
    await expect(courseReference).not.toHaveAttribute("open", "");
    await courseReference.locator(":scope > summary").click();
    const videos = dashboard.locator("video");
    await expect(videos).toHaveCount(2);
    await expect(videos.nth(0)).toBeVisible();
    await expect(videos.nth(1)).toBeVisible();
    const sourcePaths = await videos.locator("source").evaluateAll((sources) =>
      sources.map((source) => new URL((source as HTMLSourceElement).src).pathname)
    );
    expect(sourcePaths).toEqual([
      "/courses/agentic-video-editing/lab/frozen/course20-original-fixture.mp4",
      "/courses/agentic-video-editing/lab/frozen/course20-fault-reel.mp4",
    ]);
    for (const path of sourcePaths) {
      const mediaResponse = await request.get(path);
      expect(mediaResponse.status(), path).toBe(200);
      expect((await mediaResponse.body()).byteLength, path).toBeGreaterThan(1_000);
    }

    const nodes = await page.locator('script[type="application/ld+json"]')
      .evaluateAll((scripts) => scripts.flatMap((script) => {
        const value = JSON.parse(script.textContent ?? "{}") as Record<string, unknown>;
        return Array.isArray(value["@graph"])
          ? value["@graph"] as Record<string, unknown>[]
          : [value];
      }));
    const course = nodes.find((node) => node["@type"] === "Course");
    expect(record(record(course).hasCourseInstance).courseWorkload)
      .toBe("PT750M");
    expect(record(course).hasPart).toHaveLength(10);
    expect(record(record(course).hasCourseInstance).additionalProperty)
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ name: "Optional fixture-safe local media lab", value: "PT180M" }),
        expect.objectContaining({ name: "Independent capstone estimate", value: "PT240M" }),
        expect.objectContaining({ name: "Final assessment", value: "PT30M" }),
      ]));

    await page.goto("/fr/agentic-video-editing/");
    const fallback = page.getByTestId(
      "agentic-video-editing-course-dashboard",
    );
    await expect(fallback).toHaveAttribute("lang", "en");
    await expect(fallback.getByRole("heading", {
      level: 1,
      name: AGENTIC_VIDEO_EDITING_EN_COPY.meta.title,
    })).toBeVisible();
    await expect(fallback).toContainText(
      "displays the reviewed English course edition",
    );
  });

  test("private dashboard derives 10-of-12 while public surfaces keep the blocked adapter dormant", async ({ page }) => {
    await seedProgressBeforeNavigation(page, await buildFormalReadyProgress());
    await page.goto(DASHBOARD);
    const dashboardProgress = page.locator(
      'section[aria-labelledby="agentic-video-progress-title"] progress',
    ).first();
    await expect(dashboardProgress).toHaveAttribute("value", "10");
    await expect(dashboardProgress).toHaveAttribute("max", "12");
    await expect(page.locator(
      'section[aria-labelledby="agentic-video-progress-title"]',
    )).toContainText("83%");

    await page.goto("/en/courses/");
    await expect(page.locator("#agentic-video-editing")).toHaveCount(0);

    await page.goto("/en/");
    const homeCard = page.locator("article.progress-course").filter({
      hasText: "Agentic Video Editing: From Intent to a Verified Cut",
    });
    await expect(homeCard).toHaveCount(0);
  });

  test("all routes are readable early, but an unmet prerequisite cannot be completed", async ({ page }) => {
    for (const moduleRecord of AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules) {
      const response = await page.goto(
        `/en/agentic-video-editing/${moduleRecord.slug}/`,
      );
      expect(response?.status(), moduleRecord.slug).toBe(200);
      const modulePage = page.getByTestId(
        `agentic-video-editing-module-${moduleRecord.slug}`,
      );
      await expect(modulePage, moduleRecord.slug).toBeVisible();
      await expect(modulePage.locator("dl").first(), moduleRecord.slug).toBeVisible();
      await expect(modulePage.locator("#module-sources li").first(), moduleRecord.slug)
        .toBeVisible();
      await expect(modulePage.locator("#module-practice textarea").first(), moduleRecord.slug)
        .toBeVisible();
      await expect(modulePage.locator(`#checkpoint-${moduleRecord.slug}`), moduleRecord.slug)
        .toBeVisible();
      const moduleContract = modulePage.getByTestId(
        "course20-module-contract",
      );
      await expect(moduleContract).toContainText("Consumes");
      await expect(moduleContract).toContainText("Produces");
      await expect(moduleContract).toContainText("Entry gate");
      await expect(moduleContract).toContainText("Invalidates when");
    }

    const last = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.at(-1)!;
    const completion = coreCompletion(page, last.slug);
    await expect(completion.getByRole("button", {
      name: AGENTIC_VIDEO_EDITING_EN_COPY.ui.markComplete,
    })).toBeDisabled();
    await expect(completion).toContainText(
      `${last.requires[0]}: prerequisite milestone is not current`,
    );
  });

  test("local files are SHA-256 hashed in-browser without storing their bytes or name", async ({ page }) => {
    await page.goto("/en/agentic-video-editing/agentic-editing-contract/");
    const workbench = coreWorkbench(
      page,
      "creative-brief-responsibility-map",
    );
    const localHash = workbench.locator("details").filter({
      hasText: "Hash a local file without uploading it",
    });
    await localHash.locator("summary").click();
    await localHash.locator('input[type="file"]').setInputFiles({
      name: "browser-only-control.bin",
      mimeType: "application/octet-stream",
      buffer: Buffer.from("abc", "utf8"),
    });
    const expectedHash = createHash("sha256").update("abc").digest("hex");
    await expect(localHash).toContainText(expectedHash);
    await expect(localHash).toContainText("3");
    const stored = await page.evaluate((key) => (
      window.localStorage.getItem(key) ?? ""
    ), PROGRESS_STORAGE_KEY);
    expect(stored).not.toContain("browser-only-control.bin");
    expect(stored).not.toContain(expectedHash);
  });

  test("two concurrent same-artifact saves produce one revision and one explicit conflict", async ({ page, context }) => {
    const secondPage = await context.newPage();
    await secondPage.addInitScript(({ progressKey, artifactLockName }) => {
      const storageGet = Storage.prototype.getItem;
      const staleProgress = storageGet.call(window.localStorage, progressKey);
      let holdStaleProgress = false;
      let markExternalProgressObserved: () => void = () => undefined;
      const externalProgressObserved = new Promise<void>((resolve) => {
        markExternalProgressObserved = resolve;
      });
      window.addEventListener("storage", (event) => {
        if (event.key !== progressKey) return;
        holdStaleProgress = true;
        markExternalProgressObserved();
      }, { capture: true });
      Object.defineProperty(Storage.prototype, "getItem", {
        configurable: true,
        value(key: string): string | null {
          if (this === window.localStorage
            && key === progressKey
            && holdStaleProgress) return staleProgress;
          return storageGet.call(this, key);
        },
      });
      if (!window.navigator.locks) return;
      const requestLock = window.navigator.locks.request.bind(
        window.navigator.locks,
      );
      Object.defineProperty(window.navigator.locks, "request", {
        configurable: true,
        async value(
          name: string,
          options: LockOptions,
          callback: LockGrantedCallback<unknown>,
        ): Promise<unknown> {
          // Force this tab to enter the same lock only after the winning tab's
          // StorageEvent arrives, while getItem deliberately remains stale.
          // The app must use event.newValue and the editor-bound fingerprint.
          if (name === artifactLockName) await externalProgressObserved;
          return requestLock(name, options, callback);
        },
      });
    }, {
      progressKey: PROGRESS_STORAGE_KEY,
      artifactLockName:
        "aicourse-course20-artifact:core:creative-brief-responsibility-map",
    });
    await secondPage.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (LOCAL_HOSTS.has(url.hostname)) await route.continue();
      else await route.abort("blockedbyclient");
    });
    const route = "/en/agentic-video-editing/agentic-editing-contract/";
    await Promise.all([page.goto(route), secondPage.goto(route)]);
    const artifactId = "creative-brief-responsibility-map" as const;
    const workbenches = [
      coreWorkbench(page, artifactId),
      coreWorkbench(secondPage, artifactId),
    ];
    const notes = ["concurrent draft from page A", "concurrent draft from page B"];
    for (let index = 0; index < workbenches.length; index += 1) {
      const textarea = workbenches[index].locator("textarea");
      const value = record(JSON.parse(await textarea.inputValue()));
      value.nonProductionNotes = notes[index];
      await textarea.fill(JSON.stringify(value, null, 2));
      await expect(workbenches[index]).toHaveAttribute(
        "data-artifact-status",
        "valid",
      );
    }
    const saveButtons = workbenches.map((workbench) => workbench.getByRole(
      "button",
      { name: /Validate and save artifact/u },
    ));
    await Promise.all(saveButtons.map((button) => button.evaluate(
      (element) => (element as HTMLButtonElement).click(),
    )));
    const artifactKey = agenticVideoEditingArtifactKey(artifactId, "core");
    await expect.poll(async () => {
      const saved = record((await readProgress(page))[artifactKey]);
      const conflicts = await Promise.all(workbenches.map(async (workbench) => {
        const messages = await workbench.getByRole("status").allTextContents();
        return messages.some((message) => (
          message.includes("Nothing was overwritten")
          || message.includes("Saved evidence changed in another tab")
        ));
      }));
      return {
        revision: saved.revision,
        conflicts: conflicts.filter(Boolean).length,
      };
    }).toEqual({ revision: 1, conflicts: 1 });
    const saved = record((await readProgress(page))[artifactKey]);
    const savedContent = record(JSON.parse(String(saved.contentText)));
    expect(notes).toContain(savedContent.nonProductionNotes);
    const draftValues = await Promise.all(workbenches.map(
      (workbench) => workbench.locator("textarea").inputValue(),
    ));
    const retainedNotes = draftValues.map(
      (value) => record(JSON.parse(value)).nonProductionNotes,
    );
    expect(retainedNotes).toEqual(expect.arrayContaining(notes));
    await secondPage.close();
  });

  test("recovered artifact scratch cannot silently overwrite a newer saved revision", async ({ page, context }) => {
    const secondPage = await context.newPage();
    const route = "/en/agentic-video-editing/agentic-editing-contract/";
    await Promise.all([page.goto(route), secondPage.goto(route)]);
    const artifactId = "creative-brief-responsibility-map" as const;
    const firstWorkbench = coreWorkbench(page, artifactId);
    const firstTextarea = firstWorkbench.locator("textarea");
    const recovered = record(JSON.parse(await firstTextarea.inputValue()));
    recovered.nonProductionNotes = "recover this older unsaved draft";
    await firstTextarea.fill(JSON.stringify(recovered, null, 2));

    const secondWorkbench = coreWorkbench(secondPage, artifactId);
    const secondTextarea = secondWorkbench.locator("textarea");
    const newer = record(JSON.parse(await secondTextarea.inputValue()));
    newer.nonProductionNotes = "newer saved evidence from another tab";
    await secondTextarea.fill(JSON.stringify(newer, null, 2));
    await secondWorkbench.getByRole("button", {
      name: /Validate and save artifact/u,
    }).click();
    await expect.poll(async () => record((await readProgress(secondPage))[
      agenticVideoEditingArtifactKey(artifactId, "core")
    ]).revision).toBe(1);

    await page.reload();
    const recoveredWorkbench = coreWorkbench(page, artifactId);
    await expect(recoveredWorkbench).toContainText(
      "Recovered draft is based on an older or unknown saved revision",
    );
    await expect(recoveredWorkbench.getByRole("button", {
      name: /Validate and save artifact/u,
    })).toBeDisabled();
    expect(record(JSON.parse(
      await recoveredWorkbench.locator("textarea").inputValue(),
    )).nonProductionNotes).toBe("recover this older unsaved draft");
    await recoveredWorkbench.getByRole("button", {
      name: "Load latest saved",
    }).click();
    expect(record(JSON.parse(
      await recoveredWorkbench.locator("textarea").inputValue(),
    )).nonProductionNotes).toBe("newer saved evidence from another tab");
    await secondPage.close();
  });

  test("malformed Cut Plan scratch is repaired without a page error or trusted stale result", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.addInitScript(() => {
      window.sessionStorage.setItem(
        "agentic-video-editing:1.2.0:cut-plan:en",
        JSON.stringify({
          schemaVersion: "aicourse.course20.cut-plan-scratch.v1",
          selected: { hook: "false", context: true, unknown: true },
          reasons: { hook: { unsafe: true }, context: "short" },
          target: 1e100,
          receipt: { json: "{}", issues: [7, "stale-pass"] },
        }),
      );
    });
    await page.goto("/en/agentic-video-editing/declarative-edit-plan/");
    await expect(page.getByRole("status").filter({
      hasText: "invalid or legacy fields were reset",
    })).toBeVisible();
    await expect(page.getByTestId("course20-cut-plan-result")).toHaveCount(0);
    await page.getByRole("button", {
      name: "Generate and run contract gate",
    }).click();
    await expect(page.getByTestId("course20-cut-plan-result")).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test("reset reconciles mounted assessment state and clears its tab scratch", async ({ page }) => {
    await seedProgressBeforeNavigation(page, await buildFormalReadyProgress());
    await page.goto(DASHBOARD);
    const assessment = await answerAssessmentCorrectly(page);
    await assessment.getByRole("button", {
      name: AGENTIC_VIDEO_EDITING_EN_COPY.ui.submitAssessment,
    }).click();
    await expect(assessment.getByTestId("course20-assessment-result"))
      .toHaveAttribute("data-passed", "true");
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", {
      name: AGENTIC_VIDEO_EDITING_EN_COPY.ui.resetProgress,
    }).click();
    await expect(assessment.getByTestId("course20-assessment-result"))
      .toHaveCount(0);
    await expect(assessment.locator('input[type="radio"]:checked')).toHaveCount(0);
    await expect(page.getByText("0 of 12 milestones")).toBeVisible();
    const scratchKeys = await page.evaluate(() => Object.keys(sessionStorage)
      .filter((key) => key.startsWith("agentic-video-editing:")));
    expect(scratchKeys).toEqual([]);
  });

  test("Course 20 backup round-trip restores known records and preserves other courses", async ({ page }) => {
    await seedProgressBeforeNavigation(page, {
      [AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY]:
        AGENTIC_VIDEO_EDITING_PROGRESS_VERSION,
      [AGENTIC_VIDEO_EDITING_QUIZ_DIAGNOSTIC_KEY]: {
        score: 40,
        passed: false,
        criticalMiss: true,
        answeredOnCourseVersion: AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.version,
      },
      "another-course.progress": { retained: "before-export" },
    });
    await page.goto(DASHBOARD);
    const backupTools = page.getByText("Back up or move this course");
    await backupTools.click();
    await expect(page.getByText("Unsubmitted artifact, assessment, Capstone, and Cut Plan scratch from this tab is excluded"))
      .toBeVisible();
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", {
      name: "Export Course 20 backup",
    }).click();
    const download = await downloadPromise;
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    const backupBytes = await readFile(downloadPath!);
    const backup = JSON.parse(backupBytes.toString("utf8")) as {
      entries: [string, unknown][];
      checksumAlgorithm: string;
    };
    expect(backup.checksumAlgorithm).toBe(
      "sha256-canonical-json-codepoint-v1",
    );
    expect(backup.entries.every(([key]) => key.startsWith(
      "agentic-video-editing.",
    ))).toBe(true);

    await page.evaluate(() => {
      const current = JSON.parse(localStorage.getItem("ae.progress") ?? "{}");
      current["agentic-video-editing.v2.assessment.last-diagnostic"] = {
        score: 0,
      };
      current["another-course.progress"] = { retained: "at-restore" };
      localStorage.setItem("ae.progress", JSON.stringify(current));
      window.dispatchEvent(new Event("focus"));
    });
    page.once("dialog", (dialog) => dialog.accept());
    await page.locator('input[name="course20-backup-file"]').setInputFiles({
      name: "course20-backup.json",
      mimeType: "application/json",
      buffer: backupBytes,
    });
    await expect(page.getByRole("status").filter({
      hasText: "Course 20 backup restored",
    })).toBeVisible();
    const restored = await readProgress(page);
    expect(record(restored[AGENTIC_VIDEO_EDITING_QUIZ_DIAGNOSTIC_KEY]).score)
      .toBe(40);
    expect(restored["another-course.progress"]).toEqual({
      retained: "at-restore",
    });
  });

  test("three lines of invalid text produce a blocked receipt and cannot complete a module", async ({ page }) => {
    const slug = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules[0].slug;
    const artifactId = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules[0]
      .artifactIds[0];
    await page.goto(`/en/agentic-video-editing/${slug}/`);
    const workbench = coreWorkbench(page, artifactId);
    await workbench.locator("textarea").fill("line one\nline two\nline three");
    if (await workbench.locator("select").count()) {
      await workbench.locator("select").selectOption("approved");
      await workbench.locator('input[type="text"]').fill("human reviewer");
    }
    await expect(workbench).not.toHaveAttribute("data-artifact-status", "valid");
    await workbench.getByRole("button", {
      name: AGENTIC_VIDEO_EDITING_EN_COPY.ui.saveArtifact,
    }).click();
    await expect.poll(async () => {
      const progress = await readProgress(page);
      const submission = record(progress[
        agenticVideoEditingArtifactKey(artifactId, "core")
      ]);
      return record(submission.validationReceipt).status;
    }).not.toBe("valid");
    await passCheckpoint(page, slug);
    const completion = coreCompletion(page, slug);
    await expect(completion.getByRole("button", {
      name: AGENTIC_VIDEO_EDITING_EN_COPY.ui.markComplete,
    })).toBeDisabled();
    await expect(completion).toContainText("Artifact valid and current");
  });

  test("assessment may run diagnostically but cannot create an early formal milestone", async ({ page }) => {
    await page.goto(DASHBOARD);
    const assessment = await answerAssessmentCorrectly(page);
    await assessment.getByRole("button", {
      name: AGENTIC_VIDEO_EDITING_EN_COPY.ui.submitAssessment,
    }).click();
    const result = assessment.getByTestId("course20-assessment-result");
    await expect(result).toContainText("Diagnostic only");
    await expect(result).not.toHaveAttribute("data-passed", "true");
    const progress = await readProgress(page);
    expect(progress[AGENTIC_VIDEO_EDITING_QUIZ_PASSED_KEY]).toBeUndefined();
    expect(record(progress[AGENTIC_VIDEO_EDITING_QUIZ_DIAGNOSTIC_KEY]).passed)
      .toBe(true);
    const capstone = page.locator(
      "#agentic-video-editing-capstone-verified-cut",
    );
    await capstone.getByRole("textbox").fill("accountable reviewer");
    await expect(capstone.getByRole("button", {
      name: "Validate and record registry",
    })).toBeDisabled();
    await expect(capstone).toContainText(
      "an early diagnostic does not satisfy this gate",
    );
  });

  test("current-version booleans, numeric answers, stale blueprints, and malformed capstones are rejected", async ({ page }) => {
    const malformed: Record<string, unknown> = {
      [AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY]:
        AGENTIC_VIDEO_EDITING_PROGRESS_VERSION,
      [AGENTIC_VIDEO_EDITING_QUIZ_PASSED_KEY]: true,
      [AGENTIC_VIDEO_EDITING_QUIZ_DIAGNOSTIC_KEY]: {
        answers: { q1: 2 },
        assessmentBlueprintFingerprint: "stale-blueprint",
        passed: true,
      },
      [AGENTIC_VIDEO_EDITING_CAPSTONE_KEY]: {
        schemaVersion: "aicourse.course20.capstone.v2",
        status: "valid",
        checklist: Array(12).fill(true),
      },
    };
    for (const moduleRecord of AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules) {
      malformed[agenticVideoEditingCheckpointKey(moduleRecord.slug)] = true;
      malformed[agenticVideoEditingModuleProgressKey(
        moduleRecord.slug,
        "core",
      )] = true;
    }
    await seedProgressBeforeNavigation(page, malformed);
    await page.goto(DASHBOARD);
    await expect(page.getByText("0 of 12 milestones")).toBeVisible();
    const capstone = page.locator(
      "#agentic-video-editing-capstone-verified-cut",
    );
    await expect(capstone.getByRole("button", {
      name: "Validate and record registry",
    })).toBeDisabled();
    await expect(capstone).toContainText(
      "The formal assessment is missing or stale",
    );
  });

  test("formal assessment accepts exactly 8/10 when every critical control is correct", async ({ page }) => {
    await seedProgressBeforeNavigation(page, await buildFormalReadyProgress());
    await page.goto(DASHBOARD);
    const assessment = await answerAssessmentWithWrongQuestions(
      page,
      ["q1", "q3"],
    );
    const result = assessment.getByTestId("course20-assessment-result");
    await expect(result).toHaveAttribute("data-passed", "true");
    await expect(result).toContainText("80%");
    await expect(result.locator("ol > li")).toHaveCount(10);
    const progress = await readProgress(page);
    expect(record(progress[AGENTIC_VIDEO_EDITING_QUIZ_PASSED_KEY])
      .schemaVersion).toBe("aicourse.course20.quiz-receipt.v1");
  });

  test("formal assessment rejects 7/10 even when critical controls are correct", async ({ page }) => {
    await seedProgressBeforeNavigation(page, await buildFormalReadyProgress());
    await page.goto(DASHBOARD);
    const assessment = await answerAssessmentWithWrongQuestions(
      page,
      ["q1", "q3", "q4"],
    );
    const result = assessment.getByTestId("course20-assessment-result");
    await expect(result).not.toHaveAttribute("data-passed", "true");
    await expect(result).toContainText("70%");
    await expect(result.locator("ol > li")).toHaveCount(10);
    expect((await readProgress(page))[
      AGENTIC_VIDEO_EDITING_QUIZ_PASSED_KEY
    ]).toBeUndefined();
  });

  test("Simplified Chinese rejects 9/10 when one critical control is wrong", async ({ page }) => {
    await seedProgressBeforeNavigation(page, await buildFormalReadyProgress());
    await page.goto("/zh-Hans/agentic-video-editing/");
    const assessment = await answerAssessmentWithWrongQuestions(page, ["q2"]);
    const result = assessment.getByTestId("course20-assessment-result");
    await expect(result).not.toHaveAttribute("data-passed", "true");
    await expect(result).toContainText("90%");
    await expect(result).toContainText("关键控制题");
    await expect(result.locator("ol > li")).toHaveCount(10);
    expect((await readProgress(page))[
      AGENTIC_VIDEO_EDITING_QUIZ_PASSED_KEY
    ]).toBeUndefined();
  });

  test("the complete evidence chain gates capstone and invalidates only semantic descendants", async ({ page }) => {
    test.setTimeout(180_000);
    for (const moduleRecord of AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules) {
      await completeCoreModule(page, moduleRecord.slug);
    }

    await page.goto(DASHBOARD);
    const capstone = page.locator(
      "#agentic-video-editing-capstone-verified-cut",
    );
    await expect(capstone.locator(":scope > ol > li")).toHaveCount(12);
    await expect(capstone.getByRole("button", {
      name: "Validate and record registry",
    })).toBeDisabled();
    await expect(capstone).toContainText("The formal assessment is missing");

    const assessment = await answerAssessmentCorrectly(page);
    await assessment.getByRole("button", {
      name: AGENTIC_VIDEO_EDITING_EN_COPY.ui.submitAssessment,
    }).click();
    await expect(assessment.getByTestId("course20-assessment-result"))
      .toHaveAttribute("data-passed", "true");
    await saveCurrentWorkbench(page, "release-decision-postmortem");
    await expect(capstone.getByRole("button", {
      name: "Validate and record registry",
    })).toBeDisabled();
    await expect(capstone).toContainText("accountable reviewer role is required");

    await capstone.getByRole("textbox", {
      name: "Accountable reviewer role",
    }).fill("Accountable release reviewer");
    const rubric = capstone.getByRole("group", {
      name: /Capstone rubric/u,
    });
    await expect(rubric.getByRole("combobox")).toHaveCount(5);
    for (const score of await rubric.getByRole("combobox").all()) {
      await score.selectOption("3");
    }
    await expect(rubric).toContainText("15/15");
    const capstoneButton = capstone.getByRole("button", {
      name: "Validate and record registry",
    });
    await expect(capstoneButton).toBeEnabled();
    await capstoneButton.click();
    await expect(capstone.getByRole("button", {
      name: AGENTIC_VIDEO_EDITING_EN_COPY.ui.capstoneComplete,
    })).toBeDisabled();
    let progress = await readProgress(page);
    const capstoneRecord = record(progress[AGENTIC_VIDEO_EDITING_CAPSTONE_KEY]);
    expect(capstoneRecord.status).toBe("valid");
    expect(capstoneRecord.releaseAttestation).toBe(true);
    expect(capstoneRecord.decision).toBe("do-not-publish");
    expect(Object.keys(record(capstoneRecord.artifactHashes))).toHaveLength(12);
    expect(record(capstoneRecord.rubric).total).toBe(15);
    expect(record(capstoneRecord.rubric).unresolvedCriticalBlockers)
      .toEqual([]);

    const creativeId = "creative-brief-responsibility-map";
    const renderId = "render-receipt-output-probe";
    const beforeCreative = record(progress[
      agenticVideoEditingArtifactKey(creativeId, "core")
    ]);
    const beforeRender = record(progress[
      agenticVideoEditingArtifactKey(renderId, "core")
    ]);
    await page.goto("/en/agentic-video-editing/agentic-editing-contract/");
    await replaceJsonWorkbench(page, creativeId, (value) => {
      value.nonProductionNotes =
        "Editorial spelling note changed; production semantics are unchanged.";
    });

    progress = await readProgress(page);
    const afterCreative = record(progress[
      agenticVideoEditingArtifactKey(creativeId, "core")
    ]);
    const afterRender = record(progress[
      agenticVideoEditingArtifactKey(renderId, "core")
    ]);
    expect(afterCreative.contentSha256).not.toBe(beforeCreative.contentSha256);
    expect(afterCreative.semanticSha256).toBe(beforeCreative.semanticSha256);
    expect(record(afterRender.validationReceipt).status).toBe("valid");
    expect(afterRender.contentSha256).toBe(beforeRender.contentSha256);
    expect(record(progress[agenticVideoEditingModuleProgressKey(
      "deterministic-rendering",
      "core",
    )]).schemaVersion).toBe("aicourse.course20.module-receipt.v1");
    expect(record(progress[AGENTIC_VIDEO_EDITING_CAPSTONE_KEY]).status)
      .toBe("valid");

    const firstCompletion = coreCompletion(page, "agentic-editing-contract");
    await firstCompletion.getByRole("button", {
      name: AGENTIC_VIDEO_EDITING_EN_COPY.ui.markComplete,
    }).click();
    await expect.poll(async () => record((
      await readProgress(page)
    )[agenticVideoEditingModuleProgressKey(
      "agentic-editing-contract",
      "core",
    )]).schemaVersion).toBe("aicourse.course20.module-receipt.v1");

    const policyId = "tool-policy-adversarial-recovery";
    await page.goto("/en/agentic-video-editing/agent-tools-mcp/");
    await replaceJsonWorkbench(page, policyId, (value) => {
      const execution = record(value.execution);
      execution.timeoutSeconds = 121;
      value.execution = execution;
    });
    progress = await readProgress(page);
    expect(record(record(progress[
      agenticVideoEditingArtifactKey(policyId, "core")
    ]).validationReceipt).status).toBe("valid");
    for (const preservedId of [
      "creative-brief-responsibility-map",
      "media-manifest-provenance-quarantine",
      "evidence-index-transcript-shots",
      "candidate-segments-system-card",
      "edit-plan-v3-validation-approval",
      "plan-diff-independent-approval",
    ] as const) {
      expect(record(record(progress[
        agenticVideoEditingArtifactKey(preservedId, "core")
      ]).validationReceipt).status, preservedId).toBe("valid");
    }
    for (const staleId of [
      "delivery-matrix-accessibility",
      "render-receipt-output-probe",
      "candidate-media-reference",
      "verification-repair-approval",
      "release-package-runbook-recovery",
      "release-decision-postmortem",
    ] as const) {
      expect(record(record(progress[
        agenticVideoEditingArtifactKey(staleId, "core")
      ]).validationReceipt).status, staleId).toBe("stale");
    }
    expect(record(progress[agenticVideoEditingModuleProgressKey(
      "captions-audio-formats",
      "core",
    )]).schemaVersion).toBeUndefined();
    expect(progress[agenticVideoEditingModuleProgressKey(
      "agent-tools-mcp",
      "core",
    )]).toBeUndefined();
    expect(record(progress[AGENTIC_VIDEO_EDITING_CAPSTONE_KEY]).status)
      .toBe("stale");
  });

  test("beta migration and reset preserve every other course key", async ({ page }) => {
    const oldDraftKey =
      "agentic-video-editing.module.agentic-editing-contract.artifact";
    const oldCompletionKey =
      "agentic-video-editing.module.agentic-editing-contract.complete";
    const otherCourseKey = "mathematical-animation.v1.module.scene.complete";
    await page.addInitScript(({ key, seed }) => {
      window.localStorage.setItem(key, JSON.stringify(seed));
    }, {
      key: PROGRESS_STORAGE_KEY,
      seed: {
        play0: true,
        [otherCourseKey]: { complete: true, owner: "course-19" },
        [AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY]: "1.1.0:progress-v1",
        [oldDraftKey]: "My learner-authored legacy draft remains recoverable.",
        [oldCompletionKey]: true,
        "agentic-video-editing.quiz.passed": true,
        "agentic-video-editing.capstone.audit": true,
      },
    });

    await page.goto(DASHBOARD);
    let progress = await readProgress(page);
    expect(progress.play0).toBe(true);
    expect(progress[otherCourseKey]).toEqual({
      complete: true,
      owner: "course-19",
    });
    expect(progress[AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY])
      .toBe(AGENTIC_VIDEO_EDITING_PROGRESS_VERSION);
    expect(progress[oldCompletionKey]).toBeUndefined();
    expect(progress["agentic-video-editing.quiz.passed"]).toBeUndefined();
    expect(progress["agentic-video-editing.capstone.audit"]).toBeUndefined();
    const legacy = record(progress[AGENTIC_VIDEO_EDITING_LEGACY_PROGRESS_KEY]);
    expect(record(legacy.drafts)[oldDraftKey])
      .toBe("My learner-authored legacy draft remains recoverable.");

    page.once("dialog", async (dialog) => dialog.accept());
    await page.getByRole("button", {
      name: AGENTIC_VIDEO_EDITING_EN_COPY.ui.resetProgress,
    }).click();
    await expect(page.getByRole("status").filter({
      hasText: AGENTIC_VIDEO_EDITING_EN_COPY.ui.resetDone,
    })).toBeVisible();
    await expect(page.getByRole("status").filter({
      hasText: AGENTIC_VIDEO_EDITING_EN_COPY.ui.resetDone,
    })).toBeFocused();
    progress = await readProgress(page);
    expect(progress.play0).toBe(true);
    expect(progress[otherCourseKey]).toEqual({
      complete: true,
      owner: "course-19",
    });
    expect(progress[AGENTIC_VIDEO_EDITING_LEGACY_PROGRESS_KEY]).toBeUndefined();
    expect(progress[AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY])
      .toBe(AGENTIC_VIDEO_EDITING_PROGRESS_VERSION);
    expect(Object.keys(progress).filter((key) =>
      key.startsWith("agentic-video-editing.")
      && key !== AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY
    )).toEqual([]);
  });

  test("public fixture provenance binds every published learning file and missing routes remain 404", async ({ request }) => {
    const provenanceResponse = await request.get(
      "/courses/agentic-video-editing/fixtures.provenance.json",
    );
    expect(provenanceResponse.status()).toBe(200);
    const provenance = await provenanceResponse.json() as {
      fixtureSetVersion: string;
      rights: { shipsFrozenReferenceMedia: boolean };
      files: { path: string; sha256: string; byteLength: number }[];
    };
    expect(provenance.fixtureSetVersion).toBe("1.2.0");
    expect(provenance.rights.shipsFrozenReferenceMedia).toBe(true);
    expect(provenance.files.map((item) => item.path)).toEqual(
      expect.arrayContaining([
        "artifact-submission.schema.json",
        "edit-plan.schema.json",
        "edit-plan-v3.schema.json",
        "lab/fixture-manifest.v1.json",
        "media-manifest.fixture.yaml",
      ]),
    );
    for (const item of provenance.files) {
      const response = await request.get(
        `/courses/agentic-video-editing/${item.path}`,
      );
      expect(response.status(), item.path).toBe(200);
      const body = await response.body();
      expect(body.byteLength, item.path).toBe(item.byteLength);
      expect(createHash("sha256").update(body).digest("hex"), item.path)
        .toBe(item.sha256);
    }
    const missing = await request.get(
      "/en/agentic-video-editing/not-a-real-module/",
    );
    expect(missing.status()).toBe(404);
  });

  test("the browser Cut Plan remains selection-only and never grants execution or publication", async ({ page }) => {
    await page.goto("/en/agentic-video-editing/declarative-edit-plan/");
    await page.getByRole("button", {
      name: "Generate and run contract gate",
    }).click();
    const receipt = page.getByTestId("course20-cut-plan-result");
    await expect(receipt).toBeVisible();
    await expect(receipt).toContainText(
      '\"schemaVersion\": \"aicourse.agentic-video-editing.selection-plan.v2\"',
    );
    await expect(receipt).toContainText('\"status\": \"blocked\"');
    await expect(receipt).not.toContainText('\"allowPublish\": true');
    await expect(receipt).not.toContainText("releaseDecision");
    await page.getByRole("checkbox", {
      name: /Unverified archive insert/,
    }).check();
    await page.getByRole("button", {
      name: "Generate and run contract gate",
    }).click();
    await expect(page.getByRole("listitem").filter({
      hasText: /rights-unresolved/,
    })).toBeVisible();
  });

  test("assessment supports keyboard selection and moves focus to the submitted result", async ({ page }) => {
    await page.goto(DASHBOARD);
    const assessment = page.locator("#agentic-video-editing-assessment");
    const blueprints = Object.values(
      COURSE20_FINAL_ASSESSMENT_BLUEPRINTS,
    );
    const first = blueprints[0];
    const firstInput = assessment.locator(
      `input[name="assessment-${first.questionId}"][value="${first.correctOptionId}"]`,
    );
    await firstInput.focus();
    await page.keyboard.press("Space");
    await expect(firstInput).toBeChecked();
    for (const blueprint of blueprints.slice(1)) {
      await assessment.locator(
        `input[name="assessment-${blueprint.questionId}"][value="${blueprint.correctOptionId}"]`,
      ).check();
    }
    const submit = assessment.getByRole("button", {
      name: AGENTIC_VIDEO_EDITING_EN_COPY.ui.submitAssessment,
    });
    await submit.focus();
    await page.keyboard.press("Enter");
    const result = assessment.locator('[role="status"][tabindex="-1"]');
    await expect(result).toBeVisible();
    await expect(result).toBeFocused();
  });

  test("dashboard and permission-boundary module have no serious or critical axe violations", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(DASHBOARD);
    await expectNoSeriousAxeViolations(page, "Course 20 dashboard");
    await page.goto("/en/agentic-video-editing/agent-tools-mcp/");
    await expectNoSeriousAxeViolations(
      page,
      "Course 20 M6 permission-boundary module",
    );
  });

  test("mobile controls remain labelled without page-level horizontal overflow", async ({ page }) => {
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(
        "/zh-Hans/agentic-video-editing/declarative-edit-plan/",
      );
      await expect(page.getByLabel("目标时长（秒）")).toBeVisible();
      await expect(page.getByRole("button", {
        name: "生成并运行合同门",
      })).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, `${width}px viewport`).toBeLessThanOrEqual(1);
      const unlabeledControls = await page.locator(
        "input, textarea, button, select",
      ).evaluateAll((controls) => controls.filter((control) => {
        const element = control as HTMLElement;
        const id = element.id;
        return !(
          element.getAttribute("aria-label")
          || element.getAttribute("aria-labelledby")
          || element.closest("label")
          || (id && document.querySelector(
            `label[for=\"${CSS.escape(id)}\"]`,
          ))
          || element.textContent?.trim()
        );
      }).length);
      expect(unlabeledControls, `${width}px viewport`).toBe(0);
    }
  });
});
