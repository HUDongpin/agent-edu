import assert from "node:assert/strict";
import test from "node:test";
import {
  LAB_DRAFT_KEY,
  clearLabDraft,
  decodeLabDraft,
  readLabDraft,
  writeLabDraft,
  type DraftStorage,
} from "../lib/lab/draft";

class MemoryStorage implements DraftStorage {
  values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

const input = {
  stage: 2,
  rules: '[{"c":"tea","n":"tea","s":"S"}]',
  prompt: "You are the till at a small café.",
  completedPreviewIds: ["preview-1", "preview-2"],
};

test("Lab draft writes only the approved local fields and round-trips", () => {
  const storage = new MemoryStorage();
  const saved = writeLabDraft(input, storage, () => new Date("2026-08-21T12:34:56.000Z"));
  assert.deepEqual(saved, {
    version: 1,
    ...input,
    savedAt: "2026-08-21T12:34:56.000Z",
  });
  assert.deepEqual(readLabDraft(storage), saved);
  assert.deepEqual(Object.keys(JSON.parse(storage.getItem(LAB_DRAFT_KEY)!)).sort(), [
    "completedPreviewIds",
    "prompt",
    "rules",
    "savedAt",
    "stage",
    "version",
  ]);
});

test("Lab draft never carries keys, responses, errors, or billing fields", () => {
  const storage = new MemoryStorage();
  writeLabDraft({
    ...input,
    apiKey: "not-a-real-key",
    response: "private model output",
    providerError: "private error body",
    billing: "usage-confirmed",
  } as typeof input, storage, () => new Date("2026-08-21T00:00:00.000Z"));
  const raw = storage.getItem(LAB_DRAFT_KEY)!;
  assert.equal(raw.includes("apiKey"), false);
  assert.equal(raw.includes("private model output"), false);
  assert.equal(raw.includes("private error body"), false);
  assert.equal(raw.includes("billing"), false);
});

test("Lab draft rejects corrupt, wrong-version, and out-of-range data", () => {
  const good = {
    version: 1,
    ...input,
    savedAt: "2026-08-21T00:00:00.000Z",
  };
  assert.equal(decodeLabDraft({ ...good, version: 2 }), null);
  assert.equal(decodeLabDraft({ ...good, stage: -1 }), null);
  assert.equal(decodeLabDraft({ ...good, stage: 4 }), null);
  assert.equal(decodeLabDraft({ ...good, stage: 1.5 }), null);
  assert.equal(decodeLabDraft({ ...good, prompt: 42 }), null);
  assert.equal(decodeLabDraft({ ...good, savedAt: "not-a-date" }), null);

  const storage = new MemoryStorage();
  storage.setItem(LAB_DRAFT_KEY, "{broken");
  assert.equal(readLabDraft(storage), null);
});

test("Lab draft de-duplicates safe preview ids and rejects unsafe ids", () => {
  const good = {
    version: 1,
    ...input,
    completedPreviewIds: ["preview-1", "preview-1", "case:20"],
    savedAt: "2026-08-21T00:00:00.000Z",
  };
  assert.deepEqual(decodeLabDraft(good)?.completedPreviewIds, ["preview-1", "case:20"]);
  assert.equal(decodeLabDraft({ ...good, completedPreviewIds: ["contains spaces"] }), null);
});

test("Lab draft storage failures are safe and clear is explicit", () => {
  const throwing: DraftStorage = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); },
    removeItem() { throw new Error("blocked"); },
  };
  assert.equal(readLabDraft(throwing), null);
  assert.equal(writeLabDraft(input, throwing), null);
  assert.equal(clearLabDraft(throwing), false);

  const storage = new MemoryStorage();
  writeLabDraft(input, storage);
  assert.equal(clearLabDraft(storage), true);
  assert.equal(readLabDraft(storage), null);
});
