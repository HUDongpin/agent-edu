import assert from "node:assert/strict";
import test from "node:test";

import { compareMessageRegistryIds } from "../scripts/i18n-message-registry-contracts.mjs";

test("an absent optional top-level quiz or figure registry is not course drift", () => {
  assert.deepEqual(compareMessageRegistryIds({ lessons: {} }, "quiz", ["q1"]), {
    applicable: false,
    validShape: true,
    observed: [],
    missing: [],
    extra: [],
  });
});

test("a present message registry must match the typed IDs exactly", () => {
  assert.deepEqual(compareMessageRegistryIds({ quiz: { q1: {}, stale: {} } }, "quiz", ["q1", "q2"]), {
    applicable: true,
    validShape: true,
    observed: ["q1", "stale"],
    missing: ["q2"],
    extra: ["stale"],
  });
  assert.deepEqual(compareMessageRegistryIds({ quiz: { q1: {}, q2: {} } }, "quiz", ["q1", "q2"]), {
    applicable: true,
    validShape: true,
    observed: ["q1", "q2"],
    missing: [],
    extra: [],
  });
});

test("a present non-object registry fails closed instead of becoming not applicable", () => {
  assert.deepEqual(compareMessageRegistryIds({ figures: [] }, "figures", ["fig-1"]), {
    applicable: true,
    validShape: false,
    observed: [],
    missing: ["fig-1"],
    extra: [],
  });
});
