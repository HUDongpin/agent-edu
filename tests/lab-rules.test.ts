import assert from "node:assert/strict";
import test from "node:test";
import { LAB_DRAFT_MAX_RULES_LENGTH } from "../lib/lab/draft";
import {
  MAX_LAB_RULES,
  MAX_LAB_RULE_CONDITION_LENGTH,
  decodeLabRules,
  encodeLabRules,
  freshLabRules,
} from "../lib/lab/rules";

test("the Lab rule codec round-trips the exact UI schema", () => {
  const rules = freshLabRules();
  assert.deepEqual(decodeLabRules(encodeLabRules(rules)), rules);
  assert.deepEqual(Object.keys(rules[0]).sort(), ["c", "n", "s"]);
});

test("normal UI rule boundaries always remain restorable", () => {
  const rules = Array.from({ length: MAX_LAB_RULES }, () => ({
    // Backslashes are the worst ordinary UI input for JSON.stringify: every
    // character must be escaped, so this catches expansion hidden by ASCII.
    c: "\\".repeat(MAX_LAB_RULE_CONDITION_LENGTH),
    n: "hot chocolate",
    s: "S" as const,
  }));
  const encoded = encodeLabRules(rules);
  assert.ok(encoded.length <= LAB_DRAFT_MAX_RULES_LENGTH);
  assert.deepEqual(decodeLabRules(encoded), rules);
});

test("the rule codec rejects hidden fields, unknown menu items and overflow", () => {
  assert.equal(decodeLabRules('[{"c":"tea","n":"tea","s":"S","key":"hidden"}]'), null);
  assert.equal(decodeLabRules('[{"c":"tea","n":"not-on-menu","s":"S"}]'), null);
  assert.equal(decodeLabRules(JSON.stringify([{
    c: "x".repeat(MAX_LAB_RULE_CONDITION_LENGTH + 1),
    n: "tea",
    s: "S",
  }])), null);
  assert.equal(decodeLabRules(JSON.stringify(Array.from(
    { length: MAX_LAB_RULES + 1 },
    () => ({ c: "tea", n: "tea", s: "S" }),
  ))), null);
});
