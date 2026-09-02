import assert from "node:assert/strict";
import test from "node:test";
import {
  PROGRESS_BACKUP_MAX_BYTES,
  exportProgressBackup,
  parseProgressBackupText,
  readProgressBackupFile,
  restoreProgressBackup,
  type ProgressBackupStorage,
} from "../lib/progress-backup";
import {
  PROGRESS_LOCAL_DURABLE_KEYS,
  PROGRESS_LOCAL_EPHEMERAL_KEYS,
  PROGRESS_LOCAL_QUARANTINE_KEYS,
  PROGRESS_SESSION_EPHEMERAL_KEYS,
} from "../lib/progress-storage-contract";

class MemoryStorage implements ProgressBackupStorage {
  protected readonly values = new Map<string, string>();

  constructor(initial: Readonly<Record<string, string>> = {}) {
    for (const [key, value] of Object.entries(initial)) this.values.set(key, value);
  }

  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  removeItem(key: string): void { this.values.delete(key); }
  entries(): Readonly<Record<string, string>> { return Object.fromEntries(this.values); }
}

type Operation = "getItem" | "setItem" | "removeItem";

class FaultingStorage extends MemoryStorage {
  private readonly oneShotFaults = new Set<string>();
  private readonly permanentFaults = new Set<string>();

  failOnce(operation: Operation, key: string): void {
    this.oneShotFaults.add(`${operation}:${key}`);
  }

  failAlways(operation: Operation, key: string): void {
    this.permanentFaults.add(`${operation}:${key}`);
  }

  private fault(operation: Operation, key: string): void {
    const id = `${operation}:${key}`;
    if (!this.oneShotFaults.delete(id) && !this.permanentFaults.has(id)) return;
    throw new Error(`${id} failed`);
  }

  override getItem(key: string): string | null {
    this.fault("getItem", key);
    return super.getItem(key);
  }

  override setItem(key: string, value: string): void {
    this.fault("setItem", key);
    super.setItem(key, value);
  }

  override removeItem(key: string): void {
    this.fault("removeItem", key);
    super.removeItem(key);
  }
}

function validStorage(overrides: Readonly<Record<string, string>> = {}): MemoryStorage {
  return new MemoryStorage({
    "ae.learning.v2": JSON.stringify({ version: 2, handbook: {}, lab: {} }),
    "tch.section": "security",
    "tch.seen": "start,security",
    "ae.progress": "{\"exact\":\"before 界\"}",
    "aicourse.grok.progress.v1": JSON.stringify({ schemaVersion: 1 }),
    "aicourse.cursor.progress.v1": "{\"cursor.lesson.one\":true}",
    "ae.progress.recent.v1": JSON.stringify({ version: 1, activity: {} }),
    ...overrides,
  });
}

test("schema v1 exports only durable progress keys and preserves record bytes", () => {
  const storage = validStorage({
    [PROGRESS_LOCAL_EPHEMERAL_KEYS[0]]: "probe",
    [PROGRESS_LOCAL_QUARANTINE_KEYS[0]]: "quarantine",
    [PROGRESS_SESSION_EPHEMERAL_KEYS[0]]: "recovery",
    theme: "dark",
    language: "fr",
    providerKey: "must-not-leave-device",
  });
  const result = exportProgressBackup(storage, () => new Date("2026-08-28T00:00:00.000Z"));
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.backup.kind, "aicourse-progress-backup");
  assert.equal(result.backup.schemaVersion, 1);
  assert.deepEqual(Object.keys(result.backup.records), [...PROGRESS_LOCAL_DURABLE_KEYS]);
  assert.equal(result.backup.records["ae.progress"], "{\"exact\":\"before 界\"}");
  for (const forbidden of [
    ...PROGRESS_LOCAL_EPHEMERAL_KEYS,
    ...PROGRESS_LOCAL_QUARANTINE_KEYS,
    ...PROGRESS_SESSION_EPHEMERAL_KEYS,
    "theme",
    "language",
    "providerKey",
  ]) assert.equal(result.text.includes(forbidden), false, forbidden);
});

test("export rejects corrupt and oversized durable records", () => {
  const corrupt = exportProgressBackup(validStorage({ "ae.progress": "{broken" }));
  assert.deepEqual(corrupt, {
    ok: false,
    reason: "invalid-record",
    key: "ae.progress",
  });

  const oversized = exportProgressBackup(validStorage({
    "ae.progress": JSON.stringify({ body: "x".repeat(PROGRESS_BACKUP_MAX_BYTES) }),
  }));
  assert.equal(oversized.ok, false);
  if (!oversized.ok) {
    assert.equal(oversized.reason, "too-large");
    assert.equal(oversized.key, "ae.progress");
  }

  const corruptRecency = exportProgressBackup(validStorage({
    "ae.progress.recent.v1": JSON.stringify({
      version: 1,
      activity: { "not-a-published-course": 12 },
    }),
  }));
  assert.deepEqual(corruptRecency, {
    ok: false,
    reason: "invalid-record",
    key: "ae.progress.recent.v1",
  });
});

test("file.size is checked before reading and actual UTF-8 bytes are checked afterwards", async () => {
  let reads = 0;
  const preflight = await readProgressBackupFile({
    size: PROGRESS_BACKUP_MAX_BYTES + 1,
    async text() {
      reads += 1;
      return "{}";
    },
  });
  assert.deepEqual(preflight, { ok: false, reason: "too-large" });
  assert.equal(reads, 0, "oversized files must not be allocated");

  const underReported = await readProgressBackupFile({
    size: 1,
    async text() { return "界".repeat(Math.ceil(PROGRESS_BACKUP_MAX_BYTES / 3) + 1); },
  });
  assert.deepEqual(underReported, { ok: false, reason: "too-large" });
});

test("parser rejects unknown keys, invalid records, and oversized JSON", () => {
  const base = {
    kind: "aicourse-progress-backup",
    schemaVersion: 1,
    createdAt: "2026-08-28T00:00:00.000Z",
  };
  assert.deepEqual(parseProgressBackupText(JSON.stringify({
    ...base,
    records: { theme: "dark" },
  })), { ok: false, reason: "invalid" });
  assert.deepEqual(parseProgressBackupText(JSON.stringify({
    ...base,
    records: { "ae.progress": "[]" },
  })), { ok: false, reason: "invalid" });
  assert.deepEqual(
    parseProgressBackupText("x".repeat(PROGRESS_BACKUP_MAX_BYTES + 1)),
    { ok: false, reason: "too-large" },
  );
});

test("replace restore removes absent durable keys and preserves imported bytes", () => {
  const source = validStorage({ "ae.progress": "{\n  \"spacing\": true\n}" });
  source.removeItem("tch.seen");
  const exported = exportProgressBackup(source, () => new Date("2026-08-28T00:00:00.000Z"));
  assert.equal(exported.ok, true);
  if (!exported.ok) return;

  const target = validStorage({ "tch.seen": "start,code", "ae.progress": "{\"old\":true}" });
  const restored = restoreProgressBackup(target, exported.backup);
  assert.deepEqual(restored, { ok: true });
  assert.equal(target.getItem("tch.seen"), null);
  assert.equal(target.getItem("ae.progress"), "{\n  \"spacing\": true\n}");
});

test("failed replacement rolls every durable key back byte for byte", () => {
  const before = validStorage().entries();
  const storage = new FaultingStorage(before);
  const replacement = exportProgressBackup(validStorage({
    "ae.learning.v2": JSON.stringify({ version: 2, handbook: { changed: true }, lab: {} }),
    "tch.section": "code",
    "ae.progress": "{\"replacement\":true}",
  }));
  assert.equal(replacement.ok, true);
  if (!replacement.ok) return;

  storage.failOnce("setItem", "tch.section");
  assert.deepEqual(restoreProgressBackup(storage, replacement.backup), {
    ok: false,
    reason: "write-failed",
    unchanged: true,
  });
  assert.deepEqual(storage.entries(), before);
});

test("rollback failure is explicit and does not claim the device is unchanged", () => {
  const storage = new FaultingStorage(validStorage().entries());
  const replacement = exportProgressBackup(validStorage({ "tch.section": "code" }));
  assert.equal(replacement.ok, true);
  if (!replacement.ok) return;

  storage.failAlways("setItem", "tch.section");
  assert.deepEqual(restoreProgressBackup(storage, replacement.backup), {
    ok: false,
    reason: "rollback-failed",
    unchanged: false,
  });
});
