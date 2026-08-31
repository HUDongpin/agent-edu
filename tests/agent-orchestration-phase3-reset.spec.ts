import type { Page } from "@playwright/test";
import { expect, test } from "../e2e/fixtures";
import {
  AGENT_ORCHESTRATION_RESET_CONFIRMATION_MS,
} from "../components/agent-orchestration/useExpiringResetConfirmation";
import { AGENT_ORCHESTRATION_EN_COPY } from "../lib/agent-orchestration/copy/en";
import { AGENT_ORCHESTRATION_PROGRESS_SCHEMA } from "../lib/progress-topology";

const PROGRESS_KEY = "ae.progress";
const DASHBOARD = "/en/agent-orchestration/";
const MODULE_SLUG = "workflow-agent-boundary";
const COURSE_ARTIFACT_KEY =
  `agent-orchestration.module.${MODULE_SLUG}.artifact`;
const UNRELATED_SENTINEL_KEY = "another-course.reset-sentinel";
const UI = AGENT_ORCHESTRATION_EN_COPY.ui;

async function storedProgressBytes(page: Page): Promise<string | null> {
  return page.evaluate((key) => localStorage.getItem(key), PROGRESS_KEY);
}

test.describe("Course 15 Phase 3 reset confirmation", () => {
  test("cancel, Escape, and expiry preserve exact bytes before a live owned reset", async ({
    page,
  }) => {
    test.setTimeout(45_000);
    const unrelatedSentinel = {
      keep: true,
      byteMarker: "unrelated  value\r\nwith spacing 🧭",
    };
    const seedBytes = JSON.stringify({
      [UNRELATED_SENTINEL_KEY]: unrelatedSentinel,
      [AGENT_ORCHESTRATION_PROGRESS_SCHEMA.versionKey]:
        AGENT_ORCHESTRATION_PROGRESS_SCHEMA.version,
      [COURSE_ARTIFACT_KEY]:
        "# learner artifact\r\nExact  Course 15 bytes remain until confirmed.",
    }, null, 2);

    await page.addInitScript(({ key, raw }) => {
      if (sessionStorage.getItem("ao15-phase3-reset-seeded") === "1") return;
      localStorage.setItem(key, raw);
      sessionStorage.setItem("ao15-phase3-reset-seeded", "1");
    }, { key: PROGRESS_KEY, raw: seedBytes });
    await page.goto(DASHBOARD);

    const reset = page.getByTestId("agent-orchestration-reset");
    const cancel = page.getByTestId("agent-orchestration-reset-cancel");
    const status = page.getByTestId("agent-orchestration-reset-status");
    await expect(reset).toHaveAccessibleName(UI.reset);

    await reset.click();
    await expect(reset).toBeFocused();
    await expect(reset).toHaveAccessibleName(UI.confirmReset);
    await expect(reset).toHaveAttribute("aria-expanded", "true");
    await expect(status).toHaveText(UI.resetConfirmationOpen.replace(
      "{seconds}",
      String(AGENT_ORCHESTRATION_RESET_CONFIRMATION_MS / 1_000),
    ));
    expect(await storedProgressBytes(page)).toBe(seedBytes);

    await cancel.click();
    await expect(reset).toBeFocused();
    await expect(reset).toHaveAccessibleName(UI.reset);
    await expect(status).toHaveText(UI.resetCancelled);
    expect(await storedProgressBytes(page)).toBe(seedBytes);

    await reset.click();
    await expect(reset).toHaveAccessibleName(UI.confirmReset);
    await reset.press("Escape");
    await expect(reset).toBeFocused();
    await expect(reset).toHaveAccessibleName(UI.reset);
    await expect(status).toHaveText(UI.resetCancelled);
    expect(await storedProgressBytes(page)).toBe(seedBytes);

    await reset.click();
    await expect(reset).toHaveAccessibleName(UI.confirmReset);
    await expect(status).toHaveText(UI.resetExpired, {
      timeout: AGENT_ORCHESTRATION_RESET_CONFIRMATION_MS + 3_000,
    });
    await expect(reset).toBeFocused();
    await expect(reset).toHaveAccessibleName(UI.reset);
    await expect(reset).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByRole("button", { name: UI.confirmReset }))
      .toHaveCount(0);
    expect(await storedProgressBytes(page)).toBe(seedBytes);

    await reset.press("Enter");
    await expect(reset).toHaveAccessibleName(UI.confirmReset);
    expect(await storedProgressBytes(page)).toBe(seedBytes);
    await reset.click();
    await expect(status).toHaveText(UI.resetComplete);

    const restoredSharedRecord = await page.evaluate((key) => (
      JSON.parse(localStorage.getItem(key) ?? "{}") as Record<string, unknown>
    ), PROGRESS_KEY);
    expect(restoredSharedRecord[UNRELATED_SENTINEL_KEY])
      .toEqual(unrelatedSentinel);
    expect(restoredSharedRecord[COURSE_ARTIFACT_KEY]).toBeUndefined();
    expect(restoredSharedRecord[AGENT_ORCHESTRATION_PROGRESS_SCHEMA.versionKey])
      .toBe(AGENT_ORCHESTRATION_PROGRESS_SCHEMA.version);
    expect(Object.keys(restoredSharedRecord).some((key) => (
      key.startsWith(AGENT_ORCHESTRATION_PROGRESS_SCHEMA.prefix)
      && key !== AGENT_ORCHESTRATION_PROGRESS_SCHEMA.versionKey
    ))).toBe(false);
  });
});
