import { expect, test, type Page } from "@playwright/test";

async function expectActiveHandbookTab(page: Page, id: string) {
  await expect(page.locator('.rail-btn[tabindex="0"]')).toHaveCount(1);
  await expect(page.locator('.rail-btn[aria-selected="true"]')).toHaveCount(1);
  await expect(page.locator(id)).toHaveAttribute("tabindex", "0");
  await expect(page.locator(id)).toHaveAttribute("aria-selected", "true");
}

test("static home → Handbook → Lab journey stays local", async ({ page }) => {
  const providerRequests: string[] = [];
  const unexpectedOrigins = new Set<string>();
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  await page.route("https://api.deepseek.com/**", async (route) => {
    providerRequests.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ choices: [{ message: { content: "mock" } }] }),
    });
  });
  await page.route("**/_vercel/insights/script.js", (route) =>
    route.fulfill({ status: 200, contentType: "text/javascript", body: "" }),
  );

  page.on("request", (request) => {
    const origin = new URL(request.url()).origin;
    if (origin !== "http://127.0.0.1:4173" && origin !== "https://api.deepseek.com") {
      unexpectedOrigins.add(origin);
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/");
  await expect(page).toHaveURL(/\/en\/$/);
  await expect(page.locator("h1")).toHaveCount(1);

  await page.locator('a[href="/en/handbook/"]').first().click();
  await expect(page).toHaveURL(/\/en\/handbook\/$/);
  await expect(page.locator("h1")).toHaveCount(1);

  await page.locator('a[href="/en/lab/"]').first().click();
  await expect(page).toHaveURL(/\/en\/lab\/$/);
  await expect(page.locator("h1")).toHaveCount(1);

  expect(providerRequests, "navigation must not make a paid Provider request").toEqual([]);
  expect([...unexpectedOrigins], "all network origins must be allow-listed").toEqual([]);
  expect(pageErrors, "page errors").toEqual([]);
  expect(consoleErrors, "console errors").toEqual([]);
});

test("Handbook tabs switch orientation at 979/980 and reveal the active tab", async ({ page }) => {
  await page.setViewportSize({ width: 979, height: 800 });
  await page.goto("/en/handbook/#play");

  const rail = page.locator("#rail");
  const active = page.locator("#tab-play");
  await expect(rail).toHaveAttribute("aria-orientation", "horizontal");
  await expectActiveHandbookTab(page, "#tab-play");

  const activeBox = await active.boundingBox();
  expect(activeBox).not.toBeNull();
  expect(activeBox!.x).toBeGreaterThanOrEqual(0);
  expect(activeBox!.x + activeBox!.width).toBeLessThanOrEqual(979);

  await page.setViewportSize({ width: 980, height: 800 });
  await expect(rail).toHaveAttribute("aria-orientation", "vertical");
  await expectActiveHandbookTab(page, "#tab-play");
});

test("Handbook tabs rove, wrap, support Home/End, and preserve the intended focus", async ({ page }) => {
  await page.setViewportSize({ width: 980, height: 800 });
  await page.goto("/en/handbook/#start");

  await page.locator("#tab-start").focus();
  await page.keyboard.press("End");
  await expectActiveHandbookTab(page, "#tab-play");
  await expect(page.locator("#tab-play")).toBeFocused();

  await page.keyboard.press("Home");
  await expectActiveHandbookTab(page, "#tab-start");
  await page.keyboard.press("ArrowUp");
  await expectActiveHandbookTab(page, "#tab-play");

  await page.locator("#tab-code").click();
  await expectActiveHandbookTab(page, "#tab-code");
  await expect(page.locator("#tab-code")).toBeFocused();

  await page.locator('#p-code [data-goto="prompt"]').last().click();
  await expectActiveHandbookTab(page, "#tab-prompt");
  await expect(page.locator("#p-prompt")).toBeFocused();

  await page.setViewportSize({ width: 979, height: 800 });
  await page.locator("#tab-start").click();
  await page.keyboard.press("ArrowLeft");
  await expectActiveHandbookTab(page, "#tab-play");
  await page.keyboard.press("ArrowRight");
  await expectActiveHandbookTab(page, "#tab-start");
});

test("Arabic horizontal tabs mirror arrows in both Handbook and Lab", async ({ page }) => {
  await page.setViewportSize({ width: 979, height: 800 });
  await page.goto("/ar/handbook/#start");

  await page.locator("#tab-start").focus();
  await page.keyboard.press("ArrowLeft");
  await expectActiveHandbookTab(page, "#tab-code");
  await page.keyboard.press("ArrowRight");
  await expectActiveHandbookTab(page, "#tab-start");

  await page.goto("/ar/lab/");
  const stages = page.locator('.steps [role="tab"]');
  await stages.nth(0).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(stages.nth(1)).toHaveAttribute("aria-selected", "true");
  await expect(stages.nth(1)).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(stages.nth(0)).toHaveAttribute("aria-selected", "true");
  await expect(stages.nth(0)).toBeFocused();
});

test("Handbook deep links, history, restoration, and the page-level H1 stay consistent", async ({ page }) => {
  await page.goto("/en/handbook/#security");
  await expectActiveHandbookTab(page, "#tab-security");
  await expect(page.locator("#p-security")).toHaveClass(/\bon\b/);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator(".panel h1")).toHaveCount(0);
  await expect(page.locator('#p-compare a[href="../build/"]')).toHaveAttribute("href", "../build/");

  await page.locator('#p-security [data-goto="compare"]').last().click();
  await expect(page).toHaveURL(/#compare$/);
  await expect(page.locator("#p-compare")).toBeFocused();
  await page.goBack();
  await expect(page).toHaveURL(/#security$/);
  await expectActiveHandbookTab(page, "#tab-security");

  await page.goto("/en/");
  await page.evaluate(() => localStorage.setItem("tch.section", "graph"));
  await page.goto("/en/handbook/");
  await expect(page).toHaveURL(/#graph$/);
  await expectActiveHandbookTab(page, "#tab-graph");
  await expect(page.locator("h1")).toHaveCount(1);
});

test("Handbook core judgements stay task-complete when diagrams are hidden", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en/handbook/#start");
  await page.addStyleTag({ content: "svg { display: none !important; }" });

  await expect(page.locator("#dialSvg")).toHaveAttribute("role", "group");
  await page.locator('#p-start .c4[data-goto="loop"]').click();
  await expectActiveHandbookTab(page, "#tab-loop");

  const limit = page.locator("#lMax");
  await limit.evaluate((node) => {
    const input = node as HTMLInputElement;
    input.value = "4";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(page.locator("#lMaxV")).toHaveText("4");
  await page.locator("#lRun").click();
  await expect(page.locator("#lStatus")).toHaveText(/stopped at limit/i);
  await expect(page.locator("#stepLog .sl")).toHaveCount(4);
  await expect(page.locator("#lStepAnnounce")).toContainText(/Step 4/i);

  await page.locator("#tab-graph").click();
  const reviewer = page.locator("#gRev");
  await reviewer.click();
  await expect(reviewer).toHaveAttribute("aria-pressed", "false");
  await page.locator("#gButtons button").filter({ hasText: "Complaint" }).click();
  await expect(page.locator("#gLog")).toContainText(/Reviewer.*skipped/i);
  await expect(page.locator("#gResultBox")).toContainText(/outside refund policy/i);

  await page.locator("#tab-security").click();
  await page.locator("#secNone").click();
  await page.locator("#secRun").click();
  await expect(page.locator("#secVerdict")).toContainText(/taken over by an email/i);
  await expect(page.locator("#secActions")).toContainText(/Refunded \$4,210/i);
  await expect(page.locator("#secActions")).toContainText(/1,284 customer addresses/i);

  await page.locator("#tab-compare").click();
  const questions = page.locator("#decider fieldset.q");
  await expect(questions).toHaveCount(3);
  const exactRules = questions.nth(0).getByRole("button", { name: /fixed rules/i });
  await exactRules.click();
  await expect(exactRules).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#recTitle")).toContainText(/plain code/i);
  await expect(page.locator("#recBody")).toContainText(/rules are complete and exact/i);

  const needsJudgement = questions.nth(0).getByRole("button", { name: /needs judgement/i });
  await needsJudgement.click();
  await questions.nth(1).getByRole("button", { name: "One step", exact: true }).click();
  await questions.nth(2).getByRole("button", { name: /non-negotiable/i }).click();
  await expect(needsJudgement).toHaveAttribute("aria-pressed", "true");
  await expect(exactRules).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("#recBox")).toHaveAttribute("role", "status");
  await expect(page.locator("#recTitle")).toContainText(/small graph/i);
  await expect(page.locator("#recBody")).toContainText(/mandatory check/i);
});
