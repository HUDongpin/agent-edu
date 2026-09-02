import type { Locator, Page } from "@playwright/test";
import axe from "axe-core";
import { expect, test } from "../e2e/fixtures";
import { AGENT_ORCHESTRATION_EN_COPY } from "../lib/agent-orchestration/copy/en";
import { AGENT_ORCHESTRATION_ZH_HANS_COPY } from "../lib/agent-orchestration/copy/zh-Hans";
import { AGENT_ORCHESTRATION_PROGRESS_SCHEMA } from "../lib/progress-topology";

const PROGRESS_KEY = "ae.progress";
const MODULE_SLUG = "workflow-agent-boundary";
const DASHBOARD = "/en/agent-orchestration/";
const MODULE_ONE = `/en/agent-orchestration/${MODULE_SLUG}/`;
const MODULE_ONE_ZH = `/zh-Hans/agent-orchestration/${MODULE_SLUG}/`;
const MODULE_FIFTEEN = "/en/agent-orchestration/production-orchestration-capstone/";

function completedArtifact(template: string): string {
  const evidence = [
    "- Verified control owner: workflow evidence records authority, budget, rollback, and independent review because release safety requires traceable decisions.",
    "- Recovery verifier: an independent reviewer records the rollback result, authority boundary, budget threshold, and release decision before promotion.",
  ].join("\n");
  return template.replace(/^(## .+)$/gmu, `$1\n${evidence}`);
}

async function waitForStorageState(
  page: Page,
  status: "available" | "unavailable" | "corrupt" | "quota-exceeded",
) {
  await expect(page.getByTestId("agent-orchestration-progress").first())
    .toHaveAttribute("data-storage-status", status);
}

async function expectInside(
  child: Locator,
  container: Locator,
  label: string,
) {
  await expect.poll(async () => {
    const [childBox, containerBox] = await Promise.all([
      child.boundingBox(),
      container.boundingBox(),
    ]);
    if (!childBox || !containerBox) {
      return {
        laidOut: false,
        left: false,
        right: false,
        top: false,
        bottom: false,
      };
    }
    return {
      laidOut: true,
      left: childBox.x >= containerBox.x - 1,
      right:
        childBox.x + childBox.width <= containerBox.x + containerBox.width + 1,
      top: childBox.y >= containerBox.y - 1,
      bottom:
        childBox.y + childBox.height <= containerBox.y + containerBox.height + 1,
    };
  }, {
    message: `${label}: wait for the active link to settle inside its scroller`,
  }).toEqual({
    laidOut: true,
    left: true,
    right: true,
    top: true,
    bottom: true,
  });
}

async function expectMinimumTarget(locator: Locator, minimum = 44) {
  const count = await locator.count();
  expect(count).toBeGreaterThan(0);
  for (let index = 0; index < count; index += 1) {
    const target = locator.nth(index);
    await expect(target).toBeVisible();
    const box = await target.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height, `target ${index + 1} height`).toBeGreaterThanOrEqual(
      minimum - 0.001,
    );
  }
}

test.describe("Course 15 Phase 1 learner-state integrity", () => {
  test("static HTML is honestly pending before browser storage is restored", async ({
    browserName,
    request,
  }) => {
    test.skip(browserName !== "chromium", "One raw static document proves the shared SSR contract.");
    for (const path of [DASHBOARD, MODULE_ONE]) {
      const response = await request.get(path);
      expect(response.status()).toBe(200);
      const html = await response.text();
      expect(html).toContain('aria-busy="true"');
      expect(html).toContain("Restoring local progress");
      expect(html).not.toContain("data-course-journey-action");
      expect(html).not.toMatch(/aria-valuenow="\d+"/u);
    }
  });

  test("native English and Chinese checkpoints never share a selection or pass", async ({ page }) => {
    const enCheckpoint = AGENT_ORCHESTRATION_EN_COPY.modules[MODULE_SLUG].checkpoint;
    const zhCheckpoint = AGENT_ORCHESTRATION_ZH_HANS_COPY.modules[MODULE_SLUG].checkpoint;
    expect(enCheckpoint.checkpointId).not.toBe(zhCheckpoint.checkpointId);

    await page.goto(MODULE_ONE);
    await waitForStorageState(page, "available");
    const english = page.getByTestId("agent-orchestration-checkpoint");
    const correctOption = enCheckpoint.options.find(
      (option) => option.id === enCheckpoint.correctOptionId,
    );
    expect(correctOption).toBeTruthy();
    await english.locator(`input[type="radio"][value="${correctOption!.id}"]`).check();
    await english.getByRole("button", { name: "Check answer" }).click();
    await expect(english.getByRole("status")).toContainText("Correct");

    const englishReceipt = await page.evaluate(({ key, receiptKey }) => {
      const record = JSON.parse(localStorage.getItem(key) ?? "{}");
      return record[receiptKey];
    }, {
      key: PROGRESS_KEY,
      receiptKey: `agent-orchestration.module.${MODULE_SLUG}.checkpoint`,
    });
    expect(englishReceipt).toMatchObject({
      checkpointId: enCheckpoint.checkpointId,
      selectedOptionId: enCheckpoint.correctOptionId,
      passed: true,
      contentVersion: enCheckpoint.contentVersion,
    });

    await page.goto(MODULE_ONE_ZH);
    await waitForStorageState(page, "available");
    const chinese = page.getByTestId("agent-orchestration-checkpoint");
    await expect(chinese.locator('input[type="radio"]:checked')).toHaveCount(0);
    await expect(chinese.getByRole("button", { name: "检查答案" })).toBeDisabled();
    await expect(page.getByTestId("agent-orchestration-module-completion")
      .getByRole("button")).toBeDisabled();

    const unchangedReceipt = await page.evaluate(({ key, receiptKey }) => {
      const record = JSON.parse(localStorage.getItem(key) ?? "{}");
      return record[receiptKey];
    }, {
      key: PROGRESS_KEY,
      receiptKey: `agent-orchestration.module.${MODULE_SLUG}.checkpoint`,
    });
    expect(unchangedReceipt).toEqual(englishReceipt);
  });

  test("v4 migration preserves authored bytes and invalidates derived completion", async ({
    browserName,
    page,
  }) => {
    test.skip(browserName !== "chromium", "Migration is browser-independent and exhaustively unit tested.");
    const artifact = "# accepted\r\nKeep  café 🧭\tbyte-exact";
    const pendingArtifact = "# pending\r\nRestore  this\tbefore enabling";
    const pendingLab = {
      schemaVersion: "old",
      scenarioVersion: "old",
      moduleSlug: MODULE_SLUG,
      labId: "pattern-selector",
      state: { autonomy: 3, orderedDependencies: true },
      learnerEvidence: "Keep\r\nthis  lab explanation\tbyte-exact.",
    };
    await page.addInitScript(({ key, seed }) => {
      if (sessionStorage.getItem("ao15-migration-seeded") === "1") return;
      localStorage.setItem(key, JSON.stringify(seed));
      sessionStorage.setItem("ao15-migration-seeded", "1");
    }, {
      key: PROGRESS_KEY,
      seed: {
        "another-course.state": { keep: true },
        [AGENT_ORCHESTRATION_PROGRESS_SCHEMA.versionKey]: "1.1.1:progress-v4",
        [`agent-orchestration.module.${MODULE_SLUG}.artifact`]: artifact,
        [`agent-orchestration.module.${MODULE_SLUG}.artifact.pending-draft`]: pendingArtifact,
        [`agent-orchestration.module.${MODULE_SLUG}.artifact.evidence`]: { saved: true },
        [`agent-orchestration.module.${MODULE_SLUG}.lab.pattern-selector.pending`]: pendingLab,
        [`agent-orchestration.module.${MODULE_SLUG}.checkpoint`]: 1,
        [`agent-orchestration.module.${MODULE_SLUG}.checkpoint.passed`]: true,
        [`agent-orchestration.module.${MODULE_SLUG}.complete`]: true,
      },
    });

    await page.goto(MODULE_ONE);
    await waitForStorageState(page, "available");
    await expect(page.getByTestId("agent-orchestration-migration-notice").first())
      .toBeVisible();
    const artifactInput = page.getByTestId("agent-orchestration-artifact-draft");
    await expect(artifactInput).toBeEnabled();
    await expect(artifactInput).toHaveValue(pendingArtifact.replaceAll("\r\n", "\n"));

    const migrated = await page.evaluate((key) => (
      JSON.parse(localStorage.getItem(key) ?? "{}")
    ), PROGRESS_KEY);
    expect(migrated["another-course.state"]).toEqual({ keep: true });
    expect(migrated[`agent-orchestration.module.${MODULE_SLUG}.artifact`]).toBe(artifact);
    expect(migrated[`agent-orchestration.module.${MODULE_SLUG}.artifact.pending-draft`])
      .toBe(pendingArtifact);
    expect(migrated[`agent-orchestration.module.${MODULE_SLUG}.lab.pattern-selector.pending`])
      .toEqual(pendingLab);
    expect(migrated[`agent-orchestration.module.${MODULE_SLUG}.artifact.evidence`])
      .toBeUndefined();
    expect(migrated[`agent-orchestration.module.${MODULE_SLUG}.checkpoint`])
      .toBeUndefined();
    expect(migrated[`agent-orchestration.module.${MODULE_SLUG}.complete`])
      .toBeUndefined();
    expect(migrated[AGENT_ORCHESTRATION_PROGRESS_SCHEMA.versionKey])
      .toBe(AGENT_ORCHESTRATION_PROGRESS_SCHEMA.version);
    expect(Object.keys(migrated).some((key) => key.includes("migration"))).toBe(true);
    expect(Object.keys(migrated).some((key) => key.includes("recovery"))).toBe(true);
  });

  test("corrupt shared storage never becomes false zero progress or an enabled course", async ({ page }) => {
    const corruptRaw = "{unreadable-course-progress\nkeep exact bytes";
    await page.addInitScript(({ key, raw }) => {
      localStorage.setItem(key, raw);
    }, { key: PROGRESS_KEY, raw: corruptRaw });

    await page.goto(DASHBOARD);
    await waitForStorageState(page, "corrupt");
    await expect(page.getByTestId("agent-orchestration-storage-state").first())
      .toContainText(/unreadable|无法读取/u);
    await expect(page.getByRole("progressbar")).toHaveCount(0);
    await expect(page.locator("[data-course-journey-action]"))
      .toHaveCount(0);
    expect(await page.evaluate((key) => localStorage.getItem(key), PROGRESS_KEY))
      .toBe(corruptRaw);

    await page.goto(MODULE_ONE);
    await waitForStorageState(page, "corrupt");
    await expect(page.getByTestId("agent-orchestration-artifact-draft"))
      .toBeDisabled();
    await expect(page.getByTestId("agent-orchestration-checkpoint")
      .getByRole("radio").first()).toBeDisabled();
    await expect(page.getByTestId("agent-orchestration-module-completion")
      .getByRole("button")).toBeDisabled();
    expect(await page.evaluate((key) => localStorage.getItem(key), PROGRESS_KEY))
      .toBe(corruptRaw);
  });

  test("storage denial is named honestly and fails closed", async ({
    browserName,
    page,
  }) => {
    test.skip(browserName !== "chromium", "Exception classification is exhaustively unit tested.");
    await page.addInitScript(({ progressKey }) => {
      const originalGet = Storage.prototype.getItem;
      Storage.prototype.getItem = function getItem(key: string) {
        if (this === window.localStorage && key === progressKey) {
          throw new DOMException("denied", "SecurityError");
        }
        return originalGet.call(this, key);
      };
    }, {
      progressKey: PROGRESS_KEY,
    });
    await page.goto(DASHBOARD);
    await waitForStorageState(page, "unavailable");
    await expect(page.getByTestId("agent-orchestration-storage-state").first())
      .toContainText(/unavailable|拒绝/u);
    await expect(page.locator("[data-course-journey-action]"))
      .toHaveCount(0);
  });

  test("quota exhaustion is named honestly and fails closed", async ({
    browserName,
    page,
  }) => {
    test.skip(browserName !== "chromium", "Exception classification is exhaustively unit tested.");
    await page.addInitScript((probeKey) => {
      const originalSet = Storage.prototype.setItem;
      Storage.prototype.setItem = function setItem(key: string, value: string) {
        if (this === window.localStorage && key === probeKey) {
          throw new DOMException("full", "QuotaExceededError");
        }
        return originalSet.call(this, key, value);
      };
    }, "__aicourse_agent_orchestration_storage_probe__");
    await page.goto(DASHBOARD);
    await waitForStorageState(page, "quota-exceeded");
    await expect(page.getByTestId("agent-orchestration-storage-state").first())
      .toContainText(/storage is full|存储空间不足/u);
    await expect(page.locator("[data-course-journey-action]"))
      .toHaveCount(0);
  });

  test("the first enabled artifact value is restored and is never overwritten later", async ({
    browserName,
    page,
  }) => {
    test.skip(browserName !== "chromium", "Hydration timing is exercised once; core flow runs in all engines.");
    const restoredDraft = "# restored\r\nA saved learner draft  with spacing.";
    const immediateEdit = `${restoredDraft}\nImmediate learner edit stays.`;
    await page.addInitScript(({ key, versionKey, version, draftKey, draft }) => {
      localStorage.setItem(key, JSON.stringify({
        [versionKey]: version,
        [draftKey]: draft,
      }));
    }, {
      key: PROGRESS_KEY,
      versionKey: AGENT_ORCHESTRATION_PROGRESS_SCHEMA.versionKey,
      version: AGENT_ORCHESTRATION_PROGRESS_SCHEMA.version,
      draftKey: `agent-orchestration.module.${MODULE_SLUG}.artifact.pending-draft`,
      draft: restoredDraft,
    });

    await page.goto(MODULE_ONE);
    const textarea = page.getByTestId("agent-orchestration-artifact-draft");
    await expect(textarea).toBeEnabled();
    await expect(textarea).toHaveValue(restoredDraft.replaceAll("\r\n", "\n"));
    await textarea.fill(immediateEdit);
    await page.waitForTimeout(250);
    await expect(textarea).toHaveValue(immediateEdit.replaceAll("\r\n", "\n"));
  });

  test("artifact, lab, semantic checkpoint, completion, and owned reset work in every engine", async ({ page }) => {
    await page.addInitScript((key) => {
      if (sessionStorage.getItem("ao15-flow-seeded") === "1") return;
      localStorage.setItem(key, JSON.stringify({
        "another-course.must-survive": { value: "keep" },
      }));
      sessionStorage.setItem("ao15-flow-seeded", "1");
    }, PROGRESS_KEY);
    await page.goto(MODULE_ONE);
    await waitForStorageState(page, "available");

    const template = AGENT_ORCHESTRATION_EN_COPY.modules[MODULE_SLUG].practice.template;
    const artifact = page.getByTestId("agent-orchestration-artifact-workbench");
    await artifact.getByRole("textbox").fill(completedArtifact(template));
    const saveArtifact = artifact.getByRole("button", { name: "Save draft" });
    await expect(saveArtifact).toBeEnabled();
    await saveArtifact.click();
    await expect(artifact.getByRole("button", { name: "Saved" })).toBeVisible();

    const lab = page.getByTestId("agent-orchestration-lab");
    await lab.getByRole("slider").first().fill("3");
    await lab.getByRole("textbox").fill(
      "The simulated decision changed because the active control now enforces a declared boundary; therefore the trace and review record identify the remaining limitation.",
    );
    const saveLab = lab.getByRole("button", { name: "Save lab state" });
    await expect(saveLab).toBeEnabled();
    await saveLab.click();
    await expect(lab.getByRole("button", { name: "Lab state saved" })).toBeVisible();

    const checkpoint = AGENT_ORCHESTRATION_EN_COPY.modules[MODULE_SLUG].checkpoint;
    const correctOption = checkpoint.options.find(
      (option) => option.id === checkpoint.correctOptionId,
    )!;
    const checkpointUi = page.getByTestId("agent-orchestration-checkpoint");
    await checkpointUi.locator(
      `input[type="radio"][value="${correctOption.id}"]`,
    ).check();
    await checkpointUi.getByRole("button", { name: "Check answer" }).click();
    await expect(checkpointUi.getByRole("status")).toContainText("Correct");

    const completion = page.getByTestId("agent-orchestration-module-completion");
    const completeButton = completion.getByRole("button", { name: "Mark module complete" });
    await expect(completeButton).toBeEnabled();
    await completeButton.click();
    await expect(completion).toContainText("Complete");
    await expect(page.getByRole("progressbar", { name: "Course progress" }).first())
      .toHaveAttribute("aria-valuenow", "6");

    await page.goto(DASHBOARD);
    await waitForStorageState(page, "available");
    const fullProgress = page.getByTestId("agent-orchestration-progress").last();
    await fullProgress.getByRole("button", { name: "Reset" }).click();
    await fullProgress.getByRole("button", { name: "Confirm reset" }).click();
    await expect(fullProgress.getByRole("progressbar"))
      .toHaveAttribute("aria-valuenow", "0");
    const unrelated = await page.evaluate((key) => (
      JSON.parse(localStorage.getItem(key) ?? "{}")
    )["another-course.must-survive"], PROGRESS_KEY);
    expect(unrelated).toEqual({ value: "keep" });
  });
});

test.describe("Course 15 Phase 1 navigation and responsive layout", () => {
  test("the state-aware hero action is inside every audited initial viewport", async ({
    browserName,
    page,
  }) => {
    test.skip(browserName !== "chromium", "The full responsive matrix runs once; engines share the CSS.");
    for (const viewport of [
      { width: 320, height: 700 },
      { width: 390, height: 844 },
      { width: 820, height: 1180 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(DASHBOARD);
      await waitForStorageState(page, "available");
      const action = page.getByTestId("agent-orchestration-journey-action").first();
      await expect(action).toBeVisible();
      const box = await action.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.y).toBeGreaterThanOrEqual(0);
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
      expect(await page.evaluate(() => (
        Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)
        - document.documentElement.clientWidth
      ))).toBeLessThanOrEqual(1);
    }
  });

  test("late active modules reveal themselves in both maps in every engine", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(MODULE_FIFTEEN);
    await waitForStorageState(page, "available");
    const mobileMap = page.locator("details").filter({ hasText: "Course map" });
    await mobileMap.locator("summary").click();
    const mobileScroller = mobileMap.locator("nav[data-module-map-scroll]");
    const activeMobile = mobileScroller.locator('a[aria-current="page"]');
    await expect(activeMobile).toBeVisible();
    await expectInside(activeMobile, mobileScroller, "mobile active module");
    await expect(mobileScroller.locator("[data-direction]")).not.toHaveAttribute(
      "data-direction",
      "none",
    );

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.reload();
    await waitForStorageState(page, "available");
    const desktopScroller = page.locator("aside[data-module-map-scroll]");
    const activeDesktop = desktopScroller.locator('a[aria-current="page"]');
    await expect(activeDesktop).toBeVisible();
    await expectInside(activeDesktop, desktopScroller, "desktop active module");
  });

  test("the execution notebook exposes the complete seven-stage path", async ({ page }) => {
    await page.goto(MODULE_ONE);
    const notebook = page.getByRole("navigation", { name: "Execution notebook" });
    const hrefs = await notebook.locator("a").evaluateAll((links) => (
      links.map((link) => (link as HTMLAnchorElement).getAttribute("href"))
    ));
    expect(hrefs).toEqual([
      "#module-learning",
      "#module-contract",
      "#module-artifact",
      "#module-lab",
      "#module-checkpoint",
      "#module-completion",
      "#module-sources",
    ]);
    await expect(page.getByRole("link", { name: "Skip to lesson" }))
      .toHaveAttribute("href", "#module-lesson-content");
  });

  test("the tablet laboratory gives evidence entry full width and stacks the readout", async ({
    browserName,
    page,
  }) => {
    test.skip(browserName !== "chromium", "The tablet geometry matrix runs once; core UI runs in all engines.");
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.goto(MODULE_FIFTEEN);
    await waitForStorageState(page, "available");
    const lab = page.getByTestId("agent-orchestration-lab");
    const textarea = lab.getByRole("textbox");
    await textarea.scrollIntoViewIfNeeded();
    const layout = await textarea.evaluate((element) => {
      const controls = element.closest("label")?.parentElement;
      const grid = controls?.parentElement;
      const readout = grid?.children.item(1);
      if (!controls || !grid || !readout) return null;
      const gridBox = grid.getBoundingClientRect();
      const controlsBox = controls.getBoundingClientRect();
      const textareaBox = element.getBoundingClientRect();
      const readoutBox = readout.getBoundingClientRect();
      return {
        gridWidth: gridBox.width,
        controlsBottom: controlsBox.bottom,
        textareaWidth: textareaBox.width,
        readoutTop: readoutBox.top,
      };
    });
    expect(layout).not.toBeNull();
    expect(layout!.textareaWidth).toBeGreaterThan(layout!.gridWidth * 0.72);
    expect(layout!.readoutTop).toBeGreaterThanOrEqual(layout!.controlsBottom - 1);
  });

  test("Module 15 has no definite WCAG or target-size regressions", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(MODULE_FIFTEEN);
    await waitForStorageState(page, "available");
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
  });
});

test.describe("Course 15 coarse-pointer targets", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

  test("course-map and notebook rows provide 44px touch targets", async ({ page }) => {
    await page.goto(MODULE_FIFTEEN);
    await waitForStorageState(page, "available");
    const mobileMap = page.locator("details").filter({ hasText: "Course map" });
    await mobileMap.locator("summary").click();
    await expectMinimumTarget(mobileMap.locator("nav a"));
    await expectMinimumTarget(page.getByRole("navigation", {
      name: "Execution notebook",
    }).locator("a"));
    const artifact = page.getByTestId("agent-orchestration-artifact-draft");
    await artifact.scrollIntoViewIfNeeded();
    expect(await artifact.evaluate((element) => getComputedStyle(element).fontSize)).toBe("16px");
  });
});
