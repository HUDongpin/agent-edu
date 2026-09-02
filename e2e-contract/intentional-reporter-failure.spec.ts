import { expect, test } from "@playwright/test";

test("an unexpected base-fixture failure still receives closed evidence", async ({
  page,
}, testInfo) => {
  const urlCanary = ["REPORTER", "URL", "CANARY", "4f81"].join("_");
  const stdoutCanary = ["REPORTER", "STDOUT", "CANARY", "53ac"].join("_");
  const attachmentCanary = ["REPORTER", "ATTACHMENT", "CANARY", "7bd2"].join("_");
  const errorCanary = ["REPORTER", "ERROR", "CANARY", "9e60"].join("_");
  await page.goto(`/en/?evidence=${urlCanary}`);
  console.log(stdoutCanary);
  await testInfo.attach("safe-reporter-contract-input", {
    body: Buffer.from(attachmentCanary, "utf8"),
    contentType: "text/plain",
  });
  throw new Error(errorCanary);
});
