import type { Page, Route } from "@playwright/test";
import { expect, test } from "./fixtures";

const LAB_URL = "/en/lab/";
const MODELS_ENDPOINT = "https://api.deepseek.com/models";
const CHAT_ENDPOINT = "https://api.deepseek.com/chat/completions";
const KEY_STORAGE = "ae.ds.key";
const LEARNING_STORAGE = "ae.learning.v2";
const SENTINEL = "PW_FAKE_KEY_DO_NOT_LEAK_7f3d9c2a";

// Automatic trace/video/screenshots can contain request headers when a test
// fails. This contract suite uses only an explicit in-memory screenshot for its
// redaction assertion; CI must never persist the fake credential as an artifact.
test.use({ trace: "off", screenshot: "off", video: "off" });

type ProviderRequest = {
  url: string;
  method: string;
  body: string;
};

type BrowserAudit = {
  providerRequests: ProviderRequest[];
  unexpectedExternalRequests: string[];
  consoleMessages: string[];
  pageErrors: string[];
  downloads: string[];
};

type Scenario = {
  name: string;
  respond(route: Route, controls: { releaseTimeout: Promise<void> }): Promise<void>;
  expectedMessage: RegExp;
  expectedDetail?: RegExp;
  billing: "known" | "provider-rejected" | "unknown";
  sessionKey: "deleted" | "retained";
  useClock?: boolean;
};

function completion(
  content: string,
  finishReason = "stop",
): Record<string, unknown> {
  return {
    id: "provider-contract-completion",
    model: "deepseek-v4-flash",
    choices: [{
      index: 0,
      finish_reason: finishReason,
      message: { role: "assistant", content },
    }],
    usage: {
      prompt_tokens: 12,
      prompt_cache_hit_tokens: 0,
      prompt_cache_miss_tokens: 12,
      completion_tokens: 4,
      total_tokens: 16,
    },
  };
}

function jsonError(status: number, message: string) {
  return async (route: Route) => {
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({ error: { message } }),
    });
  };
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((yes) => { resolve = yes; });
  return { promise, resolve };
}

function installAudit(page: Page): BrowserAudit {
  const audit: BrowserAudit = {
    providerRequests: [],
    unexpectedExternalRequests: [],
    consoleMessages: [],
    pageErrors: [],
    downloads: [],
  };

  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin === "https://api.deepseek.com") {
      audit.providerRequests.push({
        url: request.url(),
        method: request.method(),
        body: request.postData() ?? "",
      });
    } else if (url.origin !== "http://127.0.0.1:4173") {
      audit.unexpectedExternalRequests.push(request.url());
    }
  });
  page.on("console", (message) => audit.consoleMessages.push(message.text()));
  page.on("pageerror", (error) => audit.pageErrors.push(error.message));
  page.on("download", (download) => audit.downloads.push(download.suggestedFilename()));
  return audit;
}

async function installProviderRoutes(
  page: Page,
  scenario: Scenario,
  releaseTimeout: Promise<void>,
) {
  await page.route("**/_vercel/insights/**", (route) => route.fulfill({
    status: 200,
    contentType: "text/javascript",
    body: "",
  }));
  await page.route(MODELS_ENDPOINT, async (route) => {
    const request = route.request();
    expect(request.method()).toBe("GET");
    expect(request.url()).toBe(MODELS_ENDPOINT);
    expect(request.postData()).toBeNull();
    expect(request.headers().authorization === `Bearer ${SENTINEL}`).toBe(true);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [{ id: "deepseek-v4-flash" }] }),
    });
  });
  await page.route(CHAT_ENDPOINT, async (route) => {
    const request = route.request();
    expect(request.method()).toBe("POST");
    expect(request.url()).toBe(CHAT_ENDPOINT);
    expect(request.headers().authorization === `Bearer ${SENTINEL}`).toBe(true);
    expect((request.postData() ?? "").includes(SENTINEL)).toBe(false);
    await scenario.respond(route, { releaseTimeout });
  });
}

async function verifyKey(page: Page) {
  const response = await page.goto(LAB_URL);
  expect(response?.status()).toBe(200);
  const keyInput = page.getByLabel("Your API key");
  await expect(keyInput).toHaveAttribute("type", "password");
  await keyInput.fill(SENTINEL);
  await page.getByRole("button", { name: "Save & test" }).click();
  await expect(page.getByText("Credential and selected model verified")).toBeVisible();
  await expect.poll(() => page.evaluate(
    ({ key, value }) => sessionStorage.getItem(key) === value,
    { key: KEY_STORAGE, value: SENTINEL },
  )).toBe(true);
}

async function firstCallCompleted(page: Page): Promise<boolean> {
  return page.evaluate((storageKey) => {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return false;
    try {
      const state = JSON.parse(raw) as {
        lab?: { completedSteps?: unknown };
      };
      return Array.isArray(state.lab?.completedSteps)
        && state.lab.completedSteps.includes("first-call");
    } catch {
      return false;
    }
  }, LEARNING_STORAGE);
}

async function runStageOne(page: Page) {
  await expect.poll(() => firstCallCompleted(page)).toBe(false);
  await page.locator("#q0").fill("Give one short café greeting.");
  await page.getByRole("button", { name: /^Run/ }).click();
}

async function assertExactProviderTraffic(audit: BrowserAudit) {
  await expect.poll(() => audit.providerRequests.length).toBe(2);
  expect(audit.providerRequests.map(({ url, method }) => ({ url, method }))).toEqual([
    { url: MODELS_ENDPOINT, method: "GET" },
    { url: CHAT_ENDPOINT, method: "POST" },
  ]);
  for (const request of audit.providerRequests) {
    const url = new URL(request.url);
    expect(url.origin).toBe("https://api.deepseek.com");
    expect(url.search).toBe("");
    expect(url.hash).toBe("");
    expect(request.url.includes(SENTINEL)).toBe(false);
    expect(request.body.includes(SENTINEL)).toBe(false);
  }
  expect(audit.unexpectedExternalRequests).toEqual([]);
}

async function assertNoSentinelLeak(page: Page, audit: BrowserAudit) {
  const leakSnapshot = await page.evaluate(() => {
    const local: string[] = [];
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index) ?? "";
      local.push(key, localStorage.getItem(key) ?? "");
    }
    return {
      url: location.href,
      localStorage: local.join("\n"),
      visibleText: document.body.innerText,
      html: document.documentElement.outerHTML,
    };
  });

  expect(leakSnapshot.url.includes(SENTINEL)).toBe(false);
  expect(leakSnapshot.localStorage.includes(SENTINEL)).toBe(false);
  expect(leakSnapshot.visibleText.includes(SENTINEL)).toBe(false);
  expect(leakSnapshot.html.includes(SENTINEL)).toBe(false);
  expect(audit.consoleMessages.some((message) => message.includes(SENTINEL))).toBe(false);
  expect(audit.pageErrors.some((message) => message.includes(SENTINEL))).toBe(false);
  expect(audit.pageErrors).toEqual([]);
  expect(audit.downloads).toEqual([]);
  await expect(page.locator(".shellwrap.lab [download]")).toHaveCount(0);

  // The PNG stays in memory. This catches accidental literal metadata while
  // the password input + DOM assertions above prove the sentinel is not drawn.
  const screenshot = await page.screenshot();
  expect(screenshot.includes(Buffer.from(SENTINEL))).toBe(false);
}

async function assertBilling(page: Page, billing: Scenario["billing"]) {
  const keyPanel = page.locator("#labkey");
  await expect(keyPanel).toContainText(/1 calls/);
  if (billing === "provider-rejected") {
    await expect(keyPanel).toContainText("provider-rejected request(s) with no usage");
    await expect(keyPanel).not.toContainText("request(s) with unknown billing");
  } else if (billing === "unknown") {
    await expect(keyPanel).toContainText("request(s) with unknown billing");
  } else {
    await expect(keyPanel).toContainText(/known subtotal \$0\.\d{5}/);
    await expect(keyPanel).not.toContainText("request(s) with unknown billing");
    await expect(keyPanel).not.toContainText("provider-rejected request(s) with no usage");
  }
}

const scenarios: Scenario[] = [
  {
    name: "401 deletes the rejected key",
    respond: jsonError(401, `Rejected ${SENTINEL}`),
    expectedMessage: /key was not accepted/i,
    expectedDetail: /Rejected \[redacted\]/,
    billing: "provider-rejected",
    sessionKey: "deleted",
  },
  {
    name: "403 rejects but retains the key",
    respond: jsonError(403, `Rejected ${SENTINEL}`),
    expectedMessage: /key was not accepted/i,
    expectedDetail: /Rejected \[redacted\]/,
    billing: "provider-rejected",
    sessionKey: "retained",
  },
  {
    name: "402 reports exhausted credit",
    respond: jsonError(402, "Insufficient balance"),
    expectedMessage: /no credit left/i,
    billing: "provider-rejected",
    sessionKey: "retained",
  },
  {
    name: "429 reports a busy provider",
    respond: jsonError(429, "Rate limit reached"),
    expectedMessage: /busy right now/i,
    billing: "provider-rejected",
    sessionKey: "retained",
  },
  ...[500, 503].map((status): Scenario => ({
    name: `${status} reports a busy provider`,
    respond: jsonError(status, `Provider error ${status}`),
    expectedMessage: /busy right now/i,
    billing: "provider-rejected",
    sessionKey: "retained",
  })),
  {
    name: "a non-JSON HTTP body is an unknown-billing content failure",
    async respond(route) {
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<html><body>upstream error page</body></html>",
      });
    },
    expectedMessage: /provider answered.*invalid content/i,
    expectedDetail: /non-JSON response/i,
    billing: "unknown",
    sessionKey: "retained",
  },
  {
    name: "an empty HTTP body is an unknown-billing content failure",
    async respond(route) {
      await route.fulfill({ status: 200, contentType: "application/json", body: "" });
    },
    expectedMessage: /provider answered.*empty/i,
    expectedDetail: /empty answer/i,
    billing: "unknown",
    sessionKey: "retained",
  },
  {
    name: "finish_reason length is a metered truncated-content failure",
    async respond(route) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(completion("A partial answer", "length")),
      });
    },
    expectedMessage: /provider answered.*truncated/i,
    expectedDetail: /truncated at the output limit/i,
    billing: "known",
    sessionKey: "retained",
  },
  {
    name: "a network failure is reported once with unknown billing",
    async respond(route) {
      await route.abort("connectionfailed");
    },
    expectedMessage: /could not be reached/i,
    expectedDetail: /could not be reached/i,
    billing: "unknown",
    sessionKey: "retained",
  },
  {
    name: "the production timeout is clock-driven without waiting 45 seconds",
    async respond(route, { releaseTimeout }) {
      await releaseTimeout;
      await route.abort("timedout").catch(() => undefined);
    },
    expectedMessage: /could not be reached/i,
    expectedDetail: /timed out/i,
    billing: "unknown",
    sessionKey: "retained",
    useClock: true,
  },
];

test("Stage 1 success is one exact, metered request and records progress", async ({ page }) => {
  const audit = installAudit(page);
  const unusedTimeout = Promise.resolve();
  const success: Scenario = {
    name: "success",
    async respond(route) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(completion("Welcome to the café.")),
      });
    },
    expectedMessage: /Welcome to the café/,
    billing: "known",
    sessionKey: "retained",
  };
  await installProviderRoutes(page, success, unusedTimeout);
  await verifyKey(page);
  await runStageOne(page);

  await expect(page.locator(".outbox")).toContainText(success.expectedMessage);
  await expect.poll(() => firstCallCompleted(page)).toBe(true);
  await assertBilling(page, "known");
  await assertExactProviderTraffic(audit);
  await assertNoSentinelLeak(page, audit);

  await page.getByRole("button", { name: "Forget" }).click();
  await expect.poll(() => page.evaluate((key) => sessionStorage.getItem(key), KEY_STORAGE)).toBeNull();
});

for (const scenario of scenarios) {
  test(`Stage 1 ${scenario.name}`, async ({ page }) => {
    const timeout = deferred();
    if (scenario.useClock) await page.clock.install();
    const audit = installAudit(page);
    await installProviderRoutes(page, scenario, timeout.promise);
    await verifyKey(page);
    await runStageOne(page);

    if (scenario.useClock) {
      await expect.poll(() => audit.providerRequests.length).toBe(2);
      await page.clock.fastForward(45_001);
      timeout.resolve();
    }

    const alert = page.locator('.fail[role="alert"]');
    await expect(alert).toContainText(scenario.expectedMessage);
    if (scenario.expectedDetail) await expect(alert).toContainText(scenario.expectedDetail);
    await expect.poll(() => firstCallCompleted(page)).toBe(false);
    await assertBilling(page, scenario.billing);
    await assertExactProviderTraffic(audit);

    const sessionKeyMatches = await page.evaluate(
      ({ key, value }) => sessionStorage.getItem(key) === value,
      { key: KEY_STORAGE, value: SENTINEL },
    );
    expect(sessionKeyMatches).toBe(scenario.sessionKey === "retained");
    await assertNoSentinelLeak(page, audit);

    if (scenario.sessionKey === "retained") {
      await page.getByRole("button", { name: "Forget" }).click();
      await expect.poll(() => page.evaluate((key) => sessionStorage.getItem(key), KEY_STORAGE)).toBeNull();
    }
  });
}
