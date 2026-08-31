import axe from "axe-core";
import type { Page } from "@playwright/test";
import { expect, test } from "../e2e/fixtures";

const DASHBOARD = "/en/product-management/";
const FIRST_MODULE = `${DASHBOARD}product-judgment-operating-model/`;
const RICE_MODULE = `${DASHBOARD}prioritization-roadmaps-portfolio/`;

async function criticalOrSeriousAxeViolations(page: Page) {
  await page.addScriptTag({ content: axe.source });
  return page.evaluate(async () => {
    const axeApi = (window as unknown as {
      axe: {
        run: (
          root: Document,
          options: { resultTypes: string[] },
        ) => Promise<{
          violations: Array<{
            id: string;
            impact: string | null;
            nodes: Array<{ target: string[] }>;
          }>;
        }>;
      };
    }).axe;
    const results = await axeApi.run(document, { resultTypes: ["violations"] });
    return results.violations
      .filter((violation) => violation.impact === "critical" || violation.impact === "serious")
      .map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        targets: violation.nodes.map((node) => node.target),
      }));
  });
}

test("Course 14 mobile module flow preserves work, orientation, and accessible completion", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const dashboardResponse = await page.goto(DASHBOARD);
  expect(dashboardResponse?.status()).toBe(200);

  const dashboard = page.getByTestId("product-management-course-dashboard");
  await expect(dashboard.getByText("Course 14", { exact: true }).first()).toBeVisible();
  await expect(dashboard.getByText("Module 14", { exact: true })).toHaveCount(0);

  const heroJourney = dashboard.getByRole("link", { name: "Begin the product loop" }).first();
  const heroBox = await heroJourney.boundingBox();
  expect(heroBox, "the primary course action is rendered").not.toBeNull();
  expect(heroBox!.y, "the primary course action is available in the first mobile viewport")
    .toBeLessThan(844);
  await heroJourney.click();
  await expect(page).toHaveURL(new RegExp(`${FIRST_MODULE}$`));

  const moduleView = page.getByTestId("product-management-module-product-judgment-operating-model");
  const mobileMap = moduleView.locator(":scope > details").first();
  await expect(mobileMap.locator("summary small"))
    .toHaveText("Product Judgment and the Operating Model");
  await mobileMap.locator("summary").click();
  const mapHeights = await mobileMap.locator("nav a").evaluateAll((links) =>
    links.map((link) => link.getBoundingClientRect().height)
  );
  expect(mapHeights).toHaveLength(14);
  expect(Math.min(...mapHeights)).toBeGreaterThanOrEqual(44);
  await mobileMap.locator("summary").click();

  const sourceRegister = page.locator("#module-sources details");
  await expect(sourceRegister).not.toHaveAttribute("open", "");
  const completionBeforeSources = await page.evaluate(() => {
    const completion = document.querySelector("#module-completion");
    const sources = document.querySelector("#module-sources");
    return Boolean(completion && sources
      && (completion.compareDocumentPosition(sources) & Node.DOCUMENT_POSITION_FOLLOWING));
  });
  expect(completionBeforeSources).toBe(true);

  const artifactEditor = page.getByRole("textbox", { name: "Working draft" });
  const untouchedTemplate = await artifactEditor.inputValue();
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByText("Edit the template before completing this module.", { exact: true }))
    .toBeVisible();
  const completeButton = page.getByRole("button", { name: "Mark module complete" });
  await expect(completeButton).toBeDisabled();

  await artifactEditor.fill([
    "# Product operating charter",
    "",
    "User: Independent course creator",
    "Outcome: Publish an accessible learning path",
    "Constraint: No learner data leaves the browser",
    "Decision owner: Product lead",
  ].join("\n"));
  const authoredDraft = await artifactEditor.inputValue();
  await expect(page.getByText("Changes autosaved in this browser.", { exact: true }))
    .toBeVisible({ timeout: 5_000 });
  await expect(completeButton).toBeDisabled();

  await page.getByRole("radio", {
    name: "The PM stewards decisions about customer and business value across a cross-functional system.",
  }).check();
  await page.getByRole("button", { name: "Check decision" }).click();
  await expect(page.getByText("Correct answer", { exact: true })).toBeVisible();
  await expect(completeButton).toBeEnabled();
  await completeButton.click();
  await expect(page.getByRole("heading", { name: "Module complete" })).toBeFocused();
  await expect(page.getByRole("button", { name: "Recorded as complete" })).toBeDisabled();

  await page.reload();
  await expect(artifactEditor).toHaveValue(authoredDraft);
  await expect(page.getByText("Saved locally", { exact: true })).toBeVisible();

  await page.evaluate(() => {
    const progress = JSON.parse(localStorage.getItem("ae.progress") || "{}") as Record<string, unknown>;
    for (const key of Object.keys(progress)) {
      if (key.startsWith("product-management.")
        && key !== "product-management.progress.version") delete progress[key];
    }
    localStorage.setItem("ae.progress", JSON.stringify(progress));
    window.dispatchEvent(new CustomEvent("product-management:progress-change"));
    window.dispatchEvent(new CustomEvent("product-management:progress-reset"));
  });
  await expect(artifactEditor).toHaveValue(untouchedTemplate);
  await expect(page.getByText("Template", { exact: true })).toBeVisible();
  await page.waitForTimeout(900);
  const artifactAfterReset = await page.evaluate(() => {
    const progress = JSON.parse(localStorage.getItem("ae.progress") || "{}") as Record<string, unknown>;
    return progress["product-management.artifact.product-judgment-operating-model.draft"];
  });
  expect(artifactAfterReset).toBeUndefined();

  const immediateNavigationDraft = "A decision note that must survive immediate navigation.";
  await artifactEditor.fill(immediateNavigationDraft);
  await page.locator('a[rel="next"]').click();
  await page.locator('a[rel="prev"]').click();
  await expect(artifactEditor).toHaveValue(immediateNavigationDraft);

  const immediateReloadDraft = "A decision note that must survive an immediate hard refresh.";
  await artifactEditor.fill(immediateReloadDraft);
  await page.reload();
  await expect(artifactEditor).toHaveValue(immediateReloadDraft);

  const horizontalOverflow = await page.evaluate(() =>
    Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)
      - document.documentElement.clientWidth
  );
  expect(horizontalOverflow).toBeLessThanOrEqual(1);
  expect(await criticalOrSeriousAxeViolations(page)).toEqual([]);
});

test("Course 14 assessment resumes the exact next question after reload", async ({ page }) => {
  await page.goto(`${DASHBOARD}#product-management-final-assessment`);
  await page.getByRole("button", { name: "Start assessment" }).click();
  await expect(page.getByRole("progressbar", { name: "Assessment question 1 of 14" }))
    .toHaveAttribute("value", "1");

  await page.getByRole("radio", { name: "Let the function with the largest revenue target choose." })
    .check();
  await page.getByRole("button", { name: "Check decision" }).click();
  await expect(page.getByText("Your answer", { exact: true })).toBeVisible();
  await expect(page.getByText("Correct answer", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Next question" }).click();
  await expect(page.getByRole("progressbar", { name: "Assessment question 2 of 14" }))
    .toHaveAttribute("value", "2");

  await page.reload();
  const resume = page.getByRole("button", { name: "Resume question 2" });
  await expect(resume).toBeVisible();
  await resume.click();
  await expect(page.getByRole("progressbar", { name: "Assessment question 2 of 14" }))
    .toHaveAttribute("value", "2");
  await expect(page.getByText(/Question 2 of 14\./)).toBeVisible();

  await page.goto("/en/learning/");
  page.once("dialog", async (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Clear all progress" }).click();
  await expect(page.locator('.learning-feedback[role="status"][aria-live="polite"]'))
    .toHaveText("All active learning progress on this device was cleared.");
  await page.goto(`${DASHBOARD}#product-management-final-assessment`);
  await expect(page.getByRole("button", { name: "Resume question 2" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Start assessment" })).toBeVisible();
});

test("Course 14 RICE validation and capstone review provide recovery paths", async ({ page }) => {
  await page.goto(RICE_MODULE);
  const outlineHrefs = await page.getByRole("navigation", { name: "On this page" })
    .locator("a")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  expect(outlineHrefs.indexOf("#module-rice"))
    .toBeLessThan(outlineHrefs.indexOf("#module-practice"));
  const riceBeforePractice = await page.evaluate(() => {
    const rice = document.querySelector("#module-rice");
    const practice = document.querySelector("#module-practice");
    return Boolean(rice && practice
      && (rice.compareDocumentPosition(practice) & Node.DOCUMENT_POSITION_FOLLOWING));
  });
  expect(riceBeforePractice).toBe(true);
  const desktopAnchorMargins = await page.evaluate(() => [
    "module-rice",
    "module-checkpoint",
    "module-completion",
  ].map((id) => Number.parseFloat(
    getComputedStyle(document.getElementById(id)!).scrollMarginBlockStart,
  )));
  expect(desktopAnchorMargins.every((margin) => margin > 0)).toBe(true);
  const reach = page.locator("#rice-reach");
  const impact = page.locator("#rice-impact");
  const confidence = page.locator("#rice-confidence");
  const effort = page.locator("#rice-effort");

  await confidence.fill("101");
  await expect(confidence).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#rice-confidence-help"))
    .toHaveText("Confidence must be between 0 and 100.");

  await reach.fill("100");
  await impact.fill("2");
  await confidence.fill("50");
  await effort.fill("8");
  await expect(page.locator("#module-rice output")).toHaveText("12.5");
  await expect(confidence).toHaveAttribute("aria-invalid", "false");

  await page.goto(`${DASHBOARD}#product-management-capstone`);
  const capstone = page.locator("#product-management-capstone");
  const checks = capstone.locator('input[type="checkbox"]');
  await expect(checks).toHaveCount(15);
  for (let index = 0; index < await checks.count(); index += 1) {
    await checks.nth(index).check();
  }
  await page.getByRole("button", { name: "Record capstone review" }).click();
  await expect(page.getByRole("button", { name: "Reopen capstone review" })).toBeVisible();
  await expect(checks.first()).toBeDisabled();
  await page.getByRole("button", { name: "Reopen capstone review" }).click();
  await expect(checks.first()).toBeEnabled();
  await expect(checks.first()).toBeChecked();
});
