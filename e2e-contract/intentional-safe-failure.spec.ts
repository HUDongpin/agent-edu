import { expect, test } from "../e2e/fixtures";

test("intentional public-fixture failure emits curated evidence", async ({ page }) => {
  const reachedMarker = ["safe evidence contract:", " reached intentional assertion"].join("");
  await page.goto("/en/");
  console.warn("public-fixed-fixture-warning");
  console.log(reachedMarker);
  expect(["public", "fixture"].length === 3).toBe(true);
});
