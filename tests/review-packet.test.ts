import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildReviewPacket,
  discoverReviewScope,
  flattenLeaves,
} from "../scripts/make-review-packet.mjs";

test("review packet discovers the current public German namespace scope", () => {
  const scope = discoverReviewScope("de");
  const included = scope.included.map((domain: { name: string }) => domain.name);
  const excluded = new Map(
    scope.excluded.map((entry: { domain: string; reason: string }) => [entry.domain, entry.reason]),
  );

  for (const domain of ["main", "handbook", "widgets", "github", "grok", "mcp", "rag"]) {
    assert.ok(included.includes(domain), `${domain} must be in the reviewed German public scope`);
  }
  for (const blocked of ["codex", "claude", "cursor"]) {
    assert.match(excluded.get(blocked) ?? "", /release state blocked/);
  }
  for (const englishFallback of ["make-money-with-codex", "prompts", "software-engineering"]) {
    assert.match(excluded.get(englishFallback) ?? "", /reviewed content excludes de/);
  }
  assert.equal(scope.approvals.site, "pending");
  assert.equal(scope.approvals.codex, "pending");
});

test("review packet is a byte-bound working aid and leaves approval ledgers untouched", () => {
  const approvalPaths = [
    "i18n-reviews.json",
    "lib/codex/localization-reviews.json",
  ];
  const before = approvalPaths.map((path) => readFileSync(path));
  const result = buildReviewPacket("de");
  const after = approvalPaths.map((path) => readFileSync(path));

  assert.match(result.snapshot.id, /^[0-9a-f]{12}-[0-9a-f]{16}$/);
  assert.match(result.packet, /Generated working aid only/);
  assert.match(result.packet, /Site native-review ledger before generation: \*\*pending\*\*/);
  assert.match(result.packet, /Codex exact-bundle review before generation: \*\*pending\*\*/);
  assert.match(result.packet, /`codex`: release state blocked/);
  assert.doesNotMatch(result.packet, /## Namespace: `codex`/);
  assert.ok(result.domains.includes("main"));
  assert.ok(result.sourceWords > 0);
  assert.equal(result.packet.includes("\u0000"), false);
  assert.deepEqual(after, before);
});

test("review packet flattens nested objects and arrays into stable reviewer keys", () => {
  const leaves = flattenLeaves({
    title: "Course",
    lessons: [{ title: "One", options: ["a", "b"] }],
  });
  assert.deepEqual([...leaves], [
    ["lessons[0].options[0]", "a"],
    ["lessons[0].options[1]", "b"],
    ["lessons[0].title", "One"],
    ["title", "Course"],
  ]);
});
