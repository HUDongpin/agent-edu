import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

const LEARNING_KEY = "ae.learning.v2";

function learningRecord(visitedSections: readonly string[]): string {
  return JSON.stringify({
    version: 2,
    handbook: {
      lastSection: visitedSections.at(-1) ?? "start",
      visitedSections,
      controlRoom: { completedRuns: 0 },
    },
    lab: {
      completedSteps: [],
      evalRunsCompleted: 0,
    },
    declared: { completed: [] },
  });
}

function backupWithLearningRecord(record: string): string {
  return JSON.stringify({
    kind: "aicourse-progress-backup",
    schemaVersion: 1,
    createdAt: "2026-08-28T00:00:00.000Z",
    records: { [LEARNING_KEY]: record },
  });
}

test("My Learning renders four published-only groups and exports a bounded backup", async ({ page }) => {
  await page.goto("/en/learning/");

  const groups = page.locator(".learning-group");
  await expect(groups).toHaveCount(4);
  await expect(page.locator('[aria-labelledby="learning-continue-title"] .learning-course-card'))
    .toHaveCount(0);
  await expect(page.locator('[aria-labelledby="learning-in-progress-title"] .learning-course-card'))
    .toHaveCount(0);
  await expect(page.locator('[aria-labelledby="learning-completed-title"] .learning-course-card'))
    .toHaveCount(0);
  await expect(page.locator('[aria-labelledby="learning-suggested-title"] .learning-course-card'))
    .toHaveCount(3);

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export progress" }).click(),
  ]);
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  const backup = JSON.parse(await readFile(downloadPath!, "utf8")) as {
    kind: string;
    schemaVersion: number;
    records: Record<string, string>;
  };
  expect(backup.kind).toBe("aicourse-progress-backup");
  expect(backup.schemaVersion).toBe(1);
  expect(Object.keys(backup.records)).not.toContain("theme");
  expect(Object.keys(backup.records)).not.toContain("language");
  expect(Object.keys(backup.records)).not.toContain("providerKey");
});

test("restore cancellation is inert and confirmed restore preserves unrelated settings", async ({ page }) => {
  await page.goto("/en/learning/");
  const before = learningRecord(["start"]);
  const replacement = learningRecord(["start", "code"]);
  await page.evaluate(({ key, value }) => {
    localStorage.setItem(key, value);
    localStorage.setItem("theme", "dark");
  }, { key: LEARNING_KEY, value: before });
  await page.reload();

  const input = page.locator('input[type="file"][accept*="json"]');
  page.once("dialog", (dialog) => dialog.dismiss());
  await input.setInputFiles({
    name: "cancelled-progress.json",
    mimeType: "application/json",
    buffer: Buffer.from(backupWithLearningRecord(replacement)),
  });
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), LEARNING_KEY))
    .toBe(before);

  page.once("dialog", (dialog) => dialog.accept());
  await input.setInputFiles({
    name: "confirmed-progress.json",
    mimeType: "application/json",
    buffer: Buffer.from(backupWithLearningRecord(replacement)),
  });
  await expect(page.getByText("Progress restored from the backup.")).toBeVisible();
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), LEARNING_KEY))
    .toBe(replacement);
  expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe("dark");

  const continueGroup = page.locator('[aria-labelledby="learning-continue-title"]');
  await expect(continueGroup.locator('[data-learning-state="in-progress"]')).toHaveCount(1);

  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "Clear all progress" }).click();
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), LEARNING_KEY))
    .toBe(replacement);
});

test("CourseShell hydrates only progress and keeps native keyboard disclosure", async ({ page }) => {
  await page.goto("/en/prompts/");

  const shell = page.locator('[data-course-shell="prompts"]');
  await expect(shell).toBeVisible();
  await expect(shell).toHaveAttribute("data-course-publication-state", "published");
  await expect(shell).toHaveAttribute("data-course-content-language", "en");
  await expect(shell.locator("[data-course-shell-field]")).toHaveCount(6);

  const progress = shell.locator('[data-course-shell-field="progress"]');
  await expect(progress).not.toHaveAttribute("data-course-progress-state", "pending");
  await expect(progress).toHaveAttribute("data-course-progress-state", "not-started");

  const details = shell.locator("details.course-shell-syllabus");
  const summary = details.locator("summary");
  await expect(details).not.toHaveAttribute("open", "");
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(details).toHaveAttribute("open", "");
  await page.keyboard.press("Space");
  await expect(details).not.toHaveAttribute("open", "");

  const action = shell.locator(".course-shell-action");
  const actionBox = await action.boundingBox();
  expect(actionBox?.height ?? 0).toBeGreaterThanOrEqual(44);
});
