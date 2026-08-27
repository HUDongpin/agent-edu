import assert from "node:assert/strict";
import test from "node:test";

import { createReadinessLiteralPolicy } from "../scripts/i18n-readiness-literal-policy.mjs";

const entry = {
  catalog: "site",
  key: "brand.name",
  locales: ["de"],
  reason: "The registered product name is intentionally unchanged.",
};

test("readiness literals require an exact domain, locale, key, and identical value", () => {
  const policy = createReadinessLiteralPolicy([entry]);
  assert.equal(policy.issues.length, 0);
  assert.equal(policy.decision("main", "de", "brand.name", "aicourse.top", "aicourse.top")?.id, "release-readiness:site:de:brand.name");
  assert.deepEqual(policy.finalize(), []);

  for (const candidate of [
    ["handbook", "de", "brand.name", "aicourse.top", "aicourse.top"],
    ["main", "fr", "brand.name", "aicourse.top", "aicourse.top"],
    ["main", "de", "hero.title", "aicourse.top", "aicourse.top"],
    ["main", "de", "brand.name", "aicourse.top", "translated"],
  ] as const) {
    assert.equal(createReadinessLiteralPolicy([entry]).decision(...candidate), null);
  }
});

test("an identical token moved into prose does not inherit the project policy", () => {
  const policy = createReadinessLiteralPolicy([entry]);
  assert.equal(policy.decision("main", "de", "hero.description", "aicourse.top", "aicourse.top"), null);
  assert.equal(policy.finalize()[0]?.code, "stale-entry");
});

test("invalid and duplicate policy entries fail closed", () => {
  const policy = createReadinessLiteralPolicy([
    entry,
    entry,
    { ...entry, catalog: "unknown" },
    { ...entry, locales: ["en"] },
    { ...entry, reason: "short" },
    { ...entry, extra: true },
  ]);
  assert.deepEqual(
    policy.issues.map((issue) => issue.code),
    ["duplicate-entry", "invalid-catalog", "invalid-locales", "invalid-reason", "invalid-entry-keys"],
  );
});

test("unmatched valid entries are reported as stale", () => {
  const policy = createReadinessLiteralPolicy([entry]);
  assert.deepEqual(policy.finalize(), [{
    code: "stale-entry",
    path: "release-readiness:site:de:brand.name",
    message: "must point to a currently identical source and locale value",
  }]);
});
