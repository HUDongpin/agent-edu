import assert from "node:assert/strict";
import test from "node:test";
import {
  CODEX_CAPSTONE_DRAFT_STORAGE_KEY,
  createCodexCapstoneDraft,
  parseCodexCapstoneDraft,
} from "../lib/codex/capstone-draft";

const contract = {
  receiptSchema: "aicourse.codex.capstone.v1",
  fixtureVersion: "1",
  fixtureSha256: "a".repeat(64),
};

test("capstone draft is version-bound and restores exact receipt text", () => {
  assert.equal(CODEX_CAPSTONE_DRAFT_STORAGE_KEY, "aicourse.codex.capstone-draft.v1");
  const input = "{\n  \"checks\": {\"tests\": true}\n}";
  const draft = createCodexCapstoneDraft(input, contract);
  assert.equal(parseCodexCapstoneDraft(draft, contract), input);
  assert.equal(parseCodexCapstoneDraft(JSON.stringify(draft), contract), input);
});

test("capstone draft rejects stale, malformed, empty, and oversized values", () => {
  const valid = createCodexCapstoneDraft("{}", contract);
  assert.equal(parseCodexCapstoneDraft({ ...valid, version: 2 }, contract), null);
  assert.equal(parseCodexCapstoneDraft({ ...valid, receiptSchema: "wrong" }, contract), null);
  assert.equal(parseCodexCapstoneDraft({ ...valid, fixtureVersion: "2" }, contract), null);
  assert.equal(parseCodexCapstoneDraft({ ...valid, fixtureSha256: "b".repeat(64) }, contract), null);
  assert.equal(parseCodexCapstoneDraft({ ...valid, input: "" }, contract), null);
  assert.equal(parseCodexCapstoneDraft({ ...valid, input: "x".repeat(262_145) }, contract), null);
  assert.equal(parseCodexCapstoneDraft("not json", contract), null);
  assert.equal(parseCodexCapstoneDraft(null, contract), null);
});
