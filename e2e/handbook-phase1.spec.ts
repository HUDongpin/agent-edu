import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const SECTION_ORDER = [
  "start",
  "code",
  "prompt",
  "context",
  "loop",
  "graph",
  "harness",
  "evals",
  "security",
  "compare",
  "play",
] as const;

type SectionId = (typeof SECTION_ORDER)[number];

async function expectActiveSection(page: Page, section: SectionId) {
  await expect(page.locator(`#tab-${section}`)).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(`#p-${section}`)).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`#${section}$`));
}

async function completeControlRoom(page: Page) {
  for (let round = 1; round <= 10; round += 1) {
    await expect(page.locator("#gRound")).toHaveText(String(round));
    await page.locator("#gOpts .gopt").first().click();
    await expect(page.locator("#gNext")).toBeVisible();
    await page.locator("#gNext").click();
  }
  await expect(page.locator("#gEnd")).toBeVisible();
}

async function activeControlRoomRegion(page: Page) {
  return page.evaluate(() => {
    const active = document.activeElement;
    if (!active) return "none";
    const regions = [
      ["feedback", document.querySelector("#gFeedback")],
      ["next", document.querySelector("#gNext")],
      ["brief", document.querySelector("#gBrief")],
      ["options", document.querySelector("#gOpts")],
    ] as const;
    for (const [name, region] of regions) {
      if (region === active || region?.contains(active)) return name;
    }
    const id = active.id ? `#${active.id}` : "";
    return `${active.tagName.toLowerCase()}${id}`;
  });
}

test("the primary Course 1 journey visits all eleven required sections in order", async ({ page }) => {
  await page.goto("/en/handbook/#start");
  await expectActiveSection(page, "start");

  for (let index = 0; index < SECTION_ORDER.length - 1; index += 1) {
    const current = SECTION_ORDER[index];
    const next = SECTION_ORDER[index + 1];
    await test.step(`${current} -> ${next}`, async () => {
      const primaryNext = page.locator(
        `#p-${current} .section-nav .btn.primary[data-goto]`,
      );
      await expect(primaryNext).toHaveCount(1);
      await expect(primaryNext).toHaveAttribute("data-goto", next);
      await primaryNext.click();
      await expectActiveSection(page, next);
    });
  }
});

test("Course 1 Back controls follow the exact inverse of the required journey", async ({ page }) => {
  await page.goto("/en/handbook/#play");
  await expectActiveSection(page, "play");

  for (let index = SECTION_ORDER.length - 1; index > 0; index -= 1) {
    const current = SECTION_ORDER[index];
    const previous = SECTION_ORDER[index - 1];
    await test.step(`${current} -> ${previous}`, async () => {
      const back = page.locator(`#p-${current} .section-nav [data-goto]`).first();
      await expect(back).toHaveAttribute("data-goto", previous);
      await back.click();
      await expectActiveSection(page, previous);
    });
  }
});

test("keyboard focus advances meaningfully through consecutive Control Room rounds", async ({ browserName, page }) => {
  await page.goto("/en/handbook/#play");
  await expect(page.locator("#gNext"), "Next brief stays unavailable until an answer").toBeHidden();
  const forwardTab = browserName === "webkit" ? "Alt+Tab" : "Tab";

  const firstOption = page.locator("#gOpts .gopt").first();
  await firstOption.focus();
  await page.keyboard.press("Enter");

  await expect.poll(
    () => activeControlRoomRegion(page),
    { message: "answering must move focus to the feedback or Next brief action" },
  ).toMatch(/^(feedback|next)$/);
  if (await activeControlRoomRegion(page) === "feedback") {
    await page.keyboard.press(forwardTab);
  }
  await expect(page.locator("#gNext")).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page.locator("#gRound")).toHaveText("2");
  await expect.poll(
    () => activeControlRoomRegion(page),
    { message: "the next round must focus its brief or first answer" },
  ).toMatch(/^(brief|options)$/);
  if (await activeControlRoomRegion(page) === "brief") {
    await page.keyboard.press(forwardTab);
  }
  await expect(page.locator("#gOpts .gopt").first()).toBeFocused();
  await page.keyboard.press("Enter");
  await expect.poll(
    () => activeControlRoomRegion(page),
    { message: "the second answer must keep the keyboard journey moving" },
  ).toMatch(/^(feedback|next)$/);
});

test("a direct Start to Control Room run is submitted separately from section exploration", async ({ page }) => {
  await page.goto("/en/handbook/#start");
  await page.locator('#p-start [data-goto="play"]').click();
  await expectActiveSection(page, "play");
  await completeControlRoom(page);

  const result = page.locator("#gEnd");
  await expect(result.getByText(/\bAssessment submitted\b/i)).toBeVisible();
  await expect(result).toContainText(/Sections explored\s*:?\s*2\s*(?:of|\/)\s*11/i);

  const continueToLab = result.locator('a[href$="/lab/"]');
  await expect(continueToLab).toBeVisible();
  await expect(continueToLab).toContainText(/Continue to (?:the )?Lab/i);

  await page.goto("/en/courses/");
  const handbookCard = page.locator('a[href="/en/handbook/#code"]');
  await expect(handbookCard, "catalog resumes at the first unexplored required section").toHaveCount(1);
  await expect(handbookCard).toContainText(/Assessment submitted/i);
  await expect(handbookCard).toContainText(/Sections explored\s*2\/11/i);
  await expect(handbookCard).toContainText(/Resume/i);
});

test("a completed course keeps submission status without promising an unavailable saved result", async ({ page }) => {
  await page.addInitScript((sections) => {
    localStorage.setItem("ae.learning.v2", JSON.stringify({
      version: 2,
      handbook: {
        lastSection: "security",
        visitedSections: sections,
        controlRoom: {
          completedRuns: 1,
          bestScore: 4,
          lastFinishedAt: "2026-08-29T00:00:00.000Z",
        },
      },
      lab: { completedSteps: [], evalRunsCompleted: 0 },
    }));
  }, SECTION_ORDER);

  await page.goto("/en/courses/");
  const handbookCard = page.locator('main .ccard a.cinner[href="/en/handbook/"]');
  await expect(handbookCard).toHaveCount(1);
  await expect(handbookCard).toContainText(/Assessment submitted/i);
  await expect(handbookCard).toContainText(/Sections explored\s*11\/11/i);
  await expect(handbookCard.locator(".cgo")).toHaveText(/Review/i);
  await expect(handbookCard).not.toContainText(/Review result/i);

  await handbookCard.click();
  await expectActiveSection(page, "security");
});

test("the completed Control Room result receives focus and announces the submission", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en/handbook/#play");
  await completeControlRoom(page);

  await expect.poll(() => page.evaluate(() => {
    const active = document.activeElement;
    if (!active) return false;
    const rect = active.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight;
  }), { message: "the result focus scroll must settle inside the mobile viewport" }).toBe(true);

  const resultState = await page.evaluate(() => {
    const result = document.querySelector("#gEnd");
    const active = document.activeElement;
    const live = result?.matches('[role="status"], [role="alert"], [aria-live]')
      ? result
      : result?.querySelector('[role="status"], [role="alert"], [aria-live]');
    return {
      focused: Boolean(result && active && (result === active || result.contains(active))),
      visible: Boolean(active && (() => {
        const rect = active.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= window.innerHeight;
      })()),
      announced: Boolean(live),
      announcement: live?.textContent ?? "",
    };
  });

  expect.soft(resultState.focused, "focus must land in the completed result").toBe(true);
  expect.soft(resultState.visible, "the focused result heading must be visible in the mobile viewport").toBe(true);
  expect.soft(resultState.announced, "the completed result must be a live status").toBe(true);
  expect.soft(resultState.announcement).toMatch(/\bAssessment submitted\b/i);
  await expect(
    page.locator('#gEnd a[href$="/lab/"]'),
    "the recommended Lab action belongs in the first mobile result viewport",
  ).toBeInViewport();
  const labAction = await page.locator('#gEnd a[href$="/lab/"]').boundingBox();
  expect(labAction, "the recommended Lab action must be rendered").not.toBeNull();
  expect(labAction!.width, "recommended Lab action width").toBeGreaterThanOrEqual(44);
  expect(labAction!.height, "recommended Lab action height").toBeGreaterThanOrEqual(44);
});

test("leaving Course 1 removes its global listeners and cannot corrupt the next route", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/en/handbook/#security");
  const labLink = page
    .getByRole("navigation", { name: "Menu" })
    .locator('a[href="/en/lab/"]');
  await labLink.click();
  await expect(page).toHaveURL(/\/en\/lab\/$/);
  await expect(page.locator(".shellwrap.lab")).toBeVisible();
  const stableUrl = page.url();

  await page.evaluate(() => {
    window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
    window.dispatchEvent(new StorageEvent("storage", {
      key: "ae.learning.v2",
      oldValue: localStorage.getItem("ae.learning.v2"),
      newValue: localStorage.getItem("ae.learning.v2"),
      storageArea: localStorage,
      url: window.location.href,
    }));
    window.dispatchEvent(new Event("focus"));
  });
  await page.waitForTimeout(100);

  expect.soft(pageErrors, "Course 1 listeners must not execute after route exit").toEqual([]);
  await expect.soft(page, "Course 1 listeners must not add a hash to the Lab URL").toHaveURL(stableUrl);
});

test("the keyboard-opened mobile menu sends forward Tab to its first visible link", async ({ browserName, page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en/handbook/#start");

  const menu = page.getByRole("navigation", { name: "Menu" });
  const toggle = page.getByRole("button", { name: "Menu" });
  const firstLink = menu.getByRole("link").first();

  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(firstLink).toBeVisible();
  // Headless WebKit follows Safari's default macOS Option+Tab convention for
  // including page links and controls in forward keyboard navigation.
  await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
  await expect(firstLink).toBeFocused();
});

test.describe("Course 1 without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("a mobile security deep link exposes its requested section and global navigation", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const response = await page.goto("/en/handbook/#security");
    expect(response?.status()).toBe(200);

    const security = page.locator("#p-security");
    await expect.soft(security).toBeVisible();
    await expect.soft(security.locator(".eyebrow")).toContainText(/08/);

    const menu = page.getByRole("navigation", { name: "Menu" });
    await expect.soft(menu).toBeVisible();
    await expect.soft(menu.getByRole("link").first()).toBeVisible();
  });
});
