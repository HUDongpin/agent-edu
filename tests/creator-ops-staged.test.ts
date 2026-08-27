import assert from "node:assert/strict";
import test from "node:test";
import { checkCreatorOpsStaged } from "../scripts/check-creator-ops-staged.mjs";

test("course 16 remains fully staged while public intake is frozen", () => {
  assert.deepEqual(checkCreatorOpsStaged(), {
    state: "staged",
    reviewedContentLocales: ["en", "zh-Hans"],
    modules: 10,
    publicRoutes: 0,
    publicAssets: 0,
  });
});
