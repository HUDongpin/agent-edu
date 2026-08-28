import { expect, test } from "../e2e/fixtures";
import { PUBLIC_EVIDENCE_CONTRACT_ANNOTATION } from "../e2e/curated-evidence";

test("intentional public-fixture failure emits curated evidence", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/en/");
  await page.evaluate(() => {
    document.documentElement.style.overflow = "scroll";
    const overflowCanary = document.createElement("div");
    overflowCanary.setAttribute("aria-hidden", "true");
    Object.assign(overflowCanary.style, {
      width: "200vw",
      height: "1px",
      pointerEvents: "none",
    });
    document.body.appendChild(overflowCanary);
  });
  console.warn("public-fixed-fixture-warning");
  testInfo.annotations.push({ type: PUBLIC_EVIDENCE_CONTRACT_ANNOTATION });
  expect(["public", "fixture"].length === 3).toBe(true);
});

test("a closed public page still emits synthetic curated evidence", async ({ page }) => {
  await page.goto("/en/");
  await page.close();
  expect(false, "safe closed-page evidence contract").toBe(true);
});
