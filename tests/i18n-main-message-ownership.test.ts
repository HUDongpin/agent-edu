import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  MAIN_MESSAGE_DYNAMIC_OWNER_GROUPS,
  RESERVED_MAIN_MESSAGE_KEYS,
  collectLiteralMainMessageReferences,
  findUnownedMainMessageKeys,
  validateDynamicMainMessageOwners,
  validateReservedMainMessageKeys,
} from "../scripts/i18n-main-message-ownership.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOCALES = ["en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar"];

function messages(locale: string): Record<string, string> {
  return JSON.parse(readFileSync(join(ROOT, "messages", `${locale}.json`), "utf8"));
}

test("main message files parse and retain exact nine-locale key parity", () => {
  const englishKeys = Object.keys(messages("en")).sort();
  assert.ok(englishKeys.length > 0);
  for (const locale of LOCALES.slice(1)) {
    assert.deepEqual(Object.keys(messages(locale)).sort(), englishKeys, `${locale} key parity`);
  }
});

test("all 150 non-literal callers have named runtime owners", () => {
  const englishKeys = new Set(Object.keys(messages("en")));
  const { issues, owners } = validateDynamicMainMessageOwners();
  assert.deepEqual(issues, []);
  assert.equal(owners.size, 150);
  for (const group of MAIN_MESSAGE_DYNAMIC_OWNER_GROUPS) {
    for (const owner of group.owner.split(" + ")) {
      assert.equal(existsSync(join(ROOT, owner)), true, `${owner} exists`);
    }
    for (const key of group.keys) assert.equal(englishKeys.has(key), true, `${key} exists`);
  }
});

test("every main message has a literal, dynamic, or governed reserved owner", () => {
  const englishKeys = Object.keys(messages("en"));
  const literalReferences = collectLiteralMainMessageReferences(ROOT, englishKeys);
  const dynamic = validateDynamicMainMessageOwners();
  const reserved = validateReservedMainMessageKeys();
  assert.deepEqual(dynamic.issues, []);
  assert.deepEqual(reserved.issues, []);
  assert.equal(RESERVED_MAIN_MESSAGE_KEYS.length, 0);
  assert.deepEqual(findUnownedMainMessageKeys({
    messageKeys: englishKeys,
    literalReferences,
    dynamicOwners: dynamic.owners,
    reservedKeys: reserved.keys,
  }), []);

  assert.deepEqual(findUnownedMainMessageKeys({
    messageKeys: [...englishKeys, "test.ownerless-dead-key"],
    literalReferences,
    dynamicOwners: dynamic.owners,
    reservedKeys: reserved.keys,
  }), ["test.ownerless-dead-key"]);
});

test("a reserved unused key requires owner, purpose, and removal condition", () => {
  const invalid = validateReservedMainMessageKeys([
    { key: "future.key", owner: "", purpose: "", removalCondition: "" },
  ]);
  assert.deepEqual(invalid.issues, [
    "future.key is missing owner.",
    "future.key is missing purpose.",
    "future.key is missing a removal condition.",
  ]);

  const valid = validateReservedMainMessageKeys([
    {
      key: "future.key",
      owner: "components/Future.tsx",
      purpose: "Pre-staged copy for an approved route.",
      removalCondition: "Remove if the approved route is cancelled or misses its release window.",
    },
  ]);
  assert.deepEqual(valid.issues, []);
  assert.deepEqual([...valid.keys], ["future.key"]);
});
