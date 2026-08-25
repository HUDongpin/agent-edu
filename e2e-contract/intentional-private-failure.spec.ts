import { expect, test } from "../e2e/private-fixtures";
import { PRIVATE_CONTRACT_ANNOTATION } from "../e2e/private-reporter";

test.use({
  trace: { mode: "off", screenshots: false, snapshots: false, sources: false, attachments: false },
  screenshot: "off",
  video: "off",
});

test("intentional private failure emits no persistent evidence", async ({ page }, testInfo) => {
  const fakeKey = ["contract", "private", "key", "91f0"].join("-");
  const privatePrompt = ["contract private", " learner prompt 42b7"].join("");
  await page.goto("/en/lab/");
  await page.getByLabel("Your API key").fill(fakeKey);
  await page.locator('.steps [role="tab"]').last().click();
  await page.locator("#sys").fill(privatePrompt);
  testInfo.annotations.push({ type: PRIVATE_CONTRACT_ANNOTATION });
  expect(Boolean(fakeKey) && Boolean(privatePrompt) && false).toBe(true);
});
