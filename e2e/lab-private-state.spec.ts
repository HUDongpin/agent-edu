import type { Route } from "@playwright/test";
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

/* The first three cases of the eval set, in order. A run that dies after they
   have landed must keep exactly these. */
const ANSWERED_CASES = [
  ["large-flat-white", "large flat white please"],
  ["two-teas", "two teas"],
  ["latte-americano", "a small latte and a large americano"],
] as const;
const ANSWERED_SAID: readonly string[] = ANSWERED_CASES.map(([, said]) => said);
const VALID_ORDER = JSON.stringify({ items: [{ name: "flat white", size: "L", price: 5.1 }], total: 5.1, needs_confirmation: false });
const JUDGE_PASS = JSON.stringify({ passes: true, why: "Meets the standard." });

function chatCompletion(content: string) {
  return JSON.stringify({
    id: "mock-completion",
    model: "deepseek-v4-flash",
    choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content } }],
    usage: { prompt_tokens: 10, prompt_cache_hit_tokens: 0, prompt_cache_miss_tokens: 10, completion_tokens: 2, total_tokens: 12 },
  });
}

/* Which case a chat request is for, and whether it is that case's judge. */
function caseOf(route: Route): { said: string; judge: boolean } {
  const body = route.request().postDataJSON() as { messages?: { content?: string }[] };
  const system = body.messages?.[0]?.content ?? "";
  const user = body.messages?.at(-1)?.content ?? "";
  const quoted = /said: ("(?:[^"\\]|\\.)*")/.exec(user);
  return { said: quoted ? JSON.parse(quoted[1]) as string : "", judge: system.startsWith("You grade") };
}

async function openStepFour(page: import("@playwright/test").Page, privateKey: string, privatePrompt: string) {
  await page.goto("/en/lab/");
  await page.evaluate(() => {
    localStorage.removeItem("ae.learning.v2");
    localStorage.removeItem("ae.lab.run.v1");
  });
  await page.reload();
  await page.getByLabel("Your API key").fill(privateKey);
  await page.getByRole("button", { name: "Save & test" }).click();
  await expect(page.getByText("Credential and selected model verified")).toBeVisible();
  await page.locator('.steps [role="tab"]').nth(3).click();
  await page.locator("#sys").fill(privatePrompt);
}

const evalRunsCompleted = (page: import("@playwright/test").Page) => page.evaluate(() => {
  const raw = localStorage.getItem("ae.learning.v2");
  return raw ? JSON.parse(raw).lab.evalRunsCompleted as number : 0;
});

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
  /* Every case failed before an order came back, so all twenty order cells are
     empty: a missing order must never render as the text "null". */
  const orderCells = page.locator('.scroll table td[dir="ltr"]');
  await expect(orderCells).toHaveCount(20);
  const orderTexts = await orderCells.allTextContents();
  expect(orderTexts.every((text) => text === "")).toBe(true);
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

  /* A reload brings back the last complete run, the 0/20, into the real state:
     every cell as it was, a note that it came from this device, no announcement
     replayed and nothing counted a second time. */
  const tableBeforeReload = await page.locator(".scroll table").first().innerText();
  await page.reload();
  await expect(page.locator(".meter .big").first()).toHaveText("0");
  expect(await page.locator(".scroll table").first().innerText() === tableBeforeReload).toBe(true);
  await expect(page.getByText("Restored from this device")).toBeVisible();
  await expect(page.locator('.scroll table td[dir="ltr"]')).toHaveCount(20);
  await expectEmptyText(page, "#lab-eval-result");
  await expect.poll(() => page.evaluate((storageKey) => {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw).lab.evalRunsCompleted as number : 0;
  }, learningKey)).toBe(1);
  const storedRun = await page.evaluate(() => localStorage.getItem("ae.lab.run.v1") ?? "");
  expect(storedRun.length > 0).toBe(true);
  expect(storedRun.includes(privateKey)).toBe(false);
  expect(storedRun.includes(privatePrompt)).toBe(false);

  /* Clear draft takes the saved run with it. */
  await page.getByRole("button", { name: "Clear draft" }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("ae.lab.run.v1"))).toBeNull();
});

test("a failed eval keeps the cases it had already paid for, unscored and unsaved", async ({ page }) => {
  /* B1's own success signal. One provider error mid-run used to discard every
     row already billed. The first three cases answer at once; the fifth meets a
     500 once they have landed; everything else is held in flight, so exactly
     three are kept and the rest are aborted with the run. */
  const privateKey = ["test", "key"].join("-");
  const privatePrompt = ["Return one café", " order as JSON."].join("");
  const held: Route[] = [];
  const requestedCases = new Set<string>();

  await page.route("https://api.deepseek.com/models", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ data: [{ id: "deepseek-v4-flash" }] }),
  }));
  await page.route("https://api.deepseek.com/chat/completions", async (route) => {
    const { said, judge } = caseOf(route);
    requestedCases.add(`${judge ? "judge" : "order"}:${said}`);
    if (!judge && ANSWERED_SAID.includes(said)) {
      await route.fulfill({ status: 200, contentType: "application/json", body: chatCompletion(VALID_ORDER) })
        .catch(() => undefined);
    } else if (!judge && said === "hot chocolate please") {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: { message: "Provider error 500" } }),
      }).catch(() => undefined);
    } else {
      held.push(route);
    }
  });

  await openStepFour(page, privateKey, privatePrompt);
  await page.getByRole("button", { name: "Run eval — up to 28 requests" }).click();
  await expectTextIncludes(page, '.fail[role="alert"]', "The model is busy right now");

  /* What was paid for is on screen, in its own block, in case order. */
  await expect(page.locator('p[role="status"]')
    .filter({ hasText: "3 of 20 cases finished before the run stopped" })).toBeVisible();
  const kept = page.locator('p[role="status"] + .scroll tbody tr');
  await expect(kept).toHaveCount(3);
  const keptIds = await kept.evaluateAll((rows) => rows.map((row) => row.querySelector("td")?.textContent ?? ""));
  expect(keptIds.join(",") === ANSWERED_CASES.map(([id]) => id).join(",")).toBe(true);
  const keptOrders = await kept.evaluateAll((rows) =>
    rows.map((row) => row.querySelector('td[dir="ltr"]')?.textContent ?? ""));
  expect(keptOrders.every((order) => order.includes('"items"'))).toBe(true);

  /* The run ended there: once it has failed, no case is sent for the first time.
     Counted by case rather than by request, because in 21 runs the raw request
     count once moved after the failure, which a settled runner cannot cause; a
     runner that kept dispatching would still send a new case and fail this. */
  const casesAtFailure = new Set(requestedCases);
  await page.waitForTimeout(1000);
  expect([...requestedCases].every((requested) => casesAtFailure.has(requested))).toBe(true);

  /* Unscored, unrecorded and unsaved. */
  await expectEmptyText(page, "#lab-eval-result");
  await expect(page.locator(".meter .big")).toHaveCount(0);
  expect(await evalRunsCompleted(page) === 0).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem("ae.lab.run.v1")) === null).toBe(true);

  /* Kept on screen, never persisted: a reload brings neither the rows nor a run. */
  await page.reload();
  await page.waitForTimeout(600);
  await expect(page.getByText("cases finished before the run stopped")).toHaveCount(0);
  await expect(page.locator(".meter .big")).toHaveCount(0);

  await Promise.all(held.map((route) => route.abort().catch(() => undefined)));
});

test("a stopped eval keeps what it bought beside the score it did not replace", async ({ page }) => {
  /* lab.err.cancelled promises the previous score was kept. One complete run,
     then a second stopped once three of its cases have landed: the three are
     shown on their own, the first run's score and saved record stand, and a
     reload restores the complete run, never the stopped one. */
  const privateKey = ["test", "key"].join("-");
  const privatePrompt = ["Return one café", " order as JSON."].join("");
  const held: Route[] = [];
  let holdAllButThree = false;

  await page.route("https://api.deepseek.com/models", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ data: [{ id: "deepseek-v4-flash" }] }),
  }));
  await page.route("https://api.deepseek.com/chat/completions", async (route) => {
    const { said, judge } = caseOf(route);
    if (holdAllButThree && (judge || !ANSWERED_SAID.includes(said))) {
      held.push(route);
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: chatCompletion(judge ? JUDGE_PASS : VALID_ORDER),
    }).catch(() => undefined);
  });

  await openStepFour(page, privateKey, privatePrompt);
  await page.getByRole("button", { name: "Run eval — up to 28 requests" }).click();
  await expectTextIncludes(page, "#lab-eval-result", "/20");
  const firstScore = await page.locator(".meter .big").first().textContent();
  const savedBefore = await page.evaluate(() => localStorage.getItem("ae.lab.run.v1"));
  expect(savedBefore !== null && await evalRunsCompleted(page) === 1).toBe(true);

  /* The progress counter moves only once a result is recorded, so "3 / 20" is the
     moment exactly three cases have landed; every other request is held. */
  holdAllButThree = true;
  await page.getByRole("button", { name: "Run eval — up to 28 requests" }).click();
  await expect(page.getByText("3 / 20", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Stop" }).click();
  await expectTextIncludes(page, '.fail[role="alert"]', "This run was stopped");

  await expect(page.locator('p[role="status"]')
    .filter({ hasText: "3 of 20 cases finished before the run stopped" })).toBeVisible();
  await expect(page.locator('p[role="status"] + .scroll tbody tr')).toHaveCount(3);

  /* The previous score stands, as the message says, and so does its record. */
  expect(await page.locator(".meter .big").first().textContent() === firstScore).toBe(true);
  await expectEmptyText(page, "#lab-eval-result");
  expect(await evalRunsCompleted(page) === 1).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem("ae.lab.run.v1")) === savedBefore).toBe(true);

  /* A reload restores the complete run, never the stopped one. */
  await page.reload();
  await expect(page.getByText("Restored from this device")).toBeVisible();
  expect(await page.locator(".meter .big").first().textContent() === firstScore).toBe(true);
  await expect(page.getByText("cases finished before the run stopped")).toHaveCount(0);

  await Promise.all(held.map((route) => route.abort().catch(() => undefined)));
});
