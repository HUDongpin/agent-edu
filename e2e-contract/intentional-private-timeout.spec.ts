import { test } from "../e2e/private-fixtures";
import { PRIVATE_TIMEOUT_CONTRACT_ANNOTATION } from "../e2e/private-reporter";

test("private full-test input timeout is redacted from reporter output", async ({ page }, testInfo) => {
  test.setTimeout(5_000);
  const timeoutKey = ["contract", "timeout", "key", "7c3a"].join("-");
  await page.goto("/en/lab/");
  const keyField = page.getByLabel("Your API key");
  await keyField.evaluate((element) => element.setAttribute("disabled", ""));
  testInfo.annotations.push({ type: PRIVATE_TIMEOUT_CONTRACT_ANNOTATION });
  await keyField.fill(timeoutKey);
});
