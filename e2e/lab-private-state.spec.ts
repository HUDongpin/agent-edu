import { expect, test } from "./private-fixtures";

async function expectTextIncludes(page: import("@playwright/test").Page, selector: string, text: string) {
  await expect.poll(async () => (
    (await page.locator(selector).textContent() ?? "").includes(text)
  )).toBe(true);
}

async function expectEmptyText(page: import("@playwright/test").Page, selector: string) {
  await expect.poll(async () => (await page.locator(selector).textContent() ?? "") === "")
    .toBe(true);
}

test.use({
  trace: { mode: "off", screenshots: false, snapshots: false, sources: false, attachments: false },
  screenshot: "off",
  video: "off",
});

test("Lab drafts write only after edits, survive navigation, and stay cleared", async ({ page }) => {
  const key = "ae.lab.draft.v1";
  const firstDraft = ["A private local", " draft with no Provider call."].join("");
  const secondDraft = ["A second draft", " saved by unmount cleanup."].join("");
  await page.goto("/en/lab/");
  await page.evaluate((storageKey) => localStorage.removeItem(storageKey), key);
  await page.reload();

  await page.waitForTimeout(550);
  await expect.poll(() => page.evaluate((storageKey) => localStorage.getItem(storageKey), key))
    .toBeNull();

  await page.locator('.steps [role="tab"]').nth(2).click();
  const prompt = page.locator("#sys");
  await prompt.fill(firstDraft);
  await page.reload();
  expect(await page.locator("#sys").inputValue() === firstDraft).toBe(true);
  const savedAt = await page.evaluate((storageKey) => {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw).savedAt as string : null;
  }, key);
  expect(savedAt).not.toBeNull();

  await page.waitForTimeout(550);
  await expect.poll(() => page.evaluate((storageKey) => {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw).savedAt as string : null;
  }, key)).toBe(savedAt);

  await prompt.fill(secondDraft);
  await page.locator('a[href="/en/"]').first().click();
  await expect.poll(() => new URL(page.url()).pathname === "/en/").toBe(true);
  await page.locator('a[href="/en/lab/"]').first().click();
  await expect.poll(() => new URL(page.url()).pathname === "/en/lab/").toBe(true);
  expect(await page.locator("#sys").inputValue() === secondDraft).toBe(true);

  await page.getByRole("button", { name: "Clear draft" }).click();
  await expect.poll(() => page.evaluate((storageKey) => localStorage.getItem(storageKey), key))
    .toBeNull();
  await page.locator('a[href="/en/"]').first().click();
  await page.locator('a[href="/en/lab/"]').first().click();
  await page.waitForTimeout(550);
  await expect.poll(() => page.evaluate((storageKey) => localStorage.getItem(storageKey), key))
    .toBeNull();
});

test("Lab cancellation, zero-score completion, privacy, and repeat announcements compose safely", async ({ page }) => {
  const learningKey = "ae.learning.v2";
  const reflectionPrediction = ["1", "7"].join("");
  const reflectionReason = ["REFLECTION_TEXT_MUST_NOT_ENTER", "_A_PROVIDER_BODY"].join("");
  const privateKey = ["test", "key"].join("-");
  const privatePrompt = ["Return one café", " order as JSON."].join("");
  const invalidReply = ["not valid", " order JSON"].join("");
  const requestBodies: unknown[] = [];
  let holdChatResponses = false;

  await page.route("https://api.deepseek.com/models", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ data: [{ id: "deepseek-v4-flash" }] }),
  }));
  await page.route("https://api.deepseek.com/chat/completions", async (route) => {
    requestBodies.push(route.request().postDataJSON());
    if (holdChatResponses) await new Promise((resolve) => setTimeout(resolve, 700));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "mock-completion",
        model: "deepseek-v4-flash",
        choices: [{
          index: 0,
          finish_reason: "stop",
          message: { role: "assistant", content: invalidReply },
        }],
        usage: {
          prompt_tokens: 10,
          prompt_cache_hit_tokens: 0,
          prompt_cache_miss_tokens: 10,
          completion_tokens: 2,
          total_tokens: 12,
        },
      }),
    }).catch(() => undefined);
  });

  await page.goto("/en/lab/");
  await page.evaluate((storageKey) => localStorage.removeItem(storageKey), learningKey);
  await page.reload();
  await page.getByLabel("Your API key").fill(privateKey);
  await page.getByRole("button", { name: "Save & test" }).click();
  await expect(page.getByText("Credential and selected model verified")).toBeVisible();

  await page.locator('.steps [role="tab"]').nth(3).click();
  await page.locator("#sys").fill(privatePrompt);
  holdChatResponses = true;
  await page.getByRole("button", { name: "Run eval — up to 28 requests" }).click();
  await page.getByRole("button", { name: "Stop" }).click();
  await expectTextIncludes(page, '.fail[role="alert"]', "This run was stopped");
  await expectEmptyText(page, "#lab-eval-result");
  await expect.poll(() => page.evaluate((storageKey) => {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw).lab.evalRunsCompleted as number : 0;
  }, learningKey)).toBe(0);

  holdChatResponses = false;
  await page.locator('.labreflection input[type="number"]').fill(reflectionPrediction);
  await page.locator(".labreflection textarea").fill(reflectionReason);
  await page.getByRole("button", { name: "Run eval — up to 28 requests" }).click();
  await expectTextIncludes(page, "#lab-eval-result", "0/20");
  const completed = await page.evaluate((storageKey) => {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw).lab : null;
  }, learningKey);
  expect(Array.isArray(completed?.completedSteps) && completed.completedSteps.includes("full-eval")).toBe(true);
  expect(completed?.evalRunsCompleted === 1).toBe(true);
  expect(completed?.evalBest === 0).toBe(true);
  const serializedBodies = JSON.stringify(requestBodies);
  expect(serializedBodies.includes(reflectionPrediction)).toBe(false);
  expect(serializedBodies.includes(reflectionReason)).toBe(false);
  expect(serializedBodies.includes(privateKey)).toBe(false);

  holdChatResponses = true;
  await page.getByRole("button", { name: "Run eval — up to 28 requests" }).click();
  await expectEmptyText(page, "#lab-eval-result");
  await page.getByRole("button", { name: "Stop" }).click();
  await expectTextIncludes(page, '.fail[role="alert"]', "This run was stopped");
  await expectEmptyText(page, "#lab-eval-result");
  await expect.poll(() => page.evaluate((storageKey) => {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw).lab.evalRunsCompleted as number : 0;
  }, learningKey)).toBe(1);
});
