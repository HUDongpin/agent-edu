import assert from "node:assert/strict";
import test from "node:test";
import {
  clearCorruptProgressAfterVerifiedQuarantine,
} from "../lib/progress-persistence";

class TestStorage implements Storage {
  protected readonly values = new Map<string, string>();

  constructor(seed: Record<string, string> = {}) {
    for (const [key, value] of Object.entries(seed)) this.values.set(key, value);
  }

  get length(): number { return this.values.size; }
  clear(): void { this.values.clear(); }
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  key(index: number): string | null { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string): void { this.values.delete(key); }
  setItem(key: string, value: string): void { this.values.set(key, String(value)); }
}

class FaultingStorage extends TestStorage {
  readonly faults = new Map<string, string>();
  readonly silentReads = new Map<string, string | null>();
  readonly silentRemovals = new Set<string>();

  fail(operation: "getItem" | "setItem" | "removeItem", key: string, name = "Error"): void {
    this.faults.set(`${operation}:${key}`, name);
  }

  private throwIfFaulted(operation: "getItem" | "setItem" | "removeItem", key: string): void {
    const name = this.faults.get(`${operation}:${key}`);
    if (!name) return;
    const error = new Error("storage operation unavailable");
    error.name = name;
    throw error;
  }

  override getItem(key: string): string | null {
    this.throwIfFaulted("getItem", key);
    if (this.silentReads.has(key)) return this.silentReads.get(key) ?? null;
    return super.getItem(key);
  }

  override setItem(key: string, value: string): void {
    this.throwIfFaulted("setItem", key);
    super.setItem(key, value);
  }

  override removeItem(key: string): void {
    this.throwIfFaulted("removeItem", key);
    if (!this.silentRemovals.has(key)) super.removeItem(key);
  }
}

class QuarantineReadbackMismatchStorage extends TestStorage {
  private quarantineReads = 0;

  override getItem(key: string): string | null {
    if (key === QUARANTINE && this.quarantineReads++ === 1) {
      return "not-the-written-value";
    }
    return super.getItem(key);
  }
}

const SOURCE = "active.progress";
const QUARANTINE = "inactive.progress.reset-quarantine.v1";
const CORRUPT = "{not-json";

test("verified quarantine preserves exact bytes before removing an active record", () => {
  const storage = new TestStorage({ [SOURCE]: CORRUPT });

  assert.deepEqual(clearCorruptProgressAfterVerifiedQuarantine({
    storage,
    sourceKey: SOURCE,
    quarantineKey: QUARANTINE,
    corruptRaw: CORRUPT,
  }), { persisted: true, quarantined: true });
  assert.equal(storage.getItem(SOURCE), null);
  assert.equal(storage.getItem(QUARANTINE), CORRUPT);
});

test("verified quarantine can replace an active record with a canonical empty guard", () => {
  const canonical = JSON.stringify({ version: 2, empty: true });
  const storage = new TestStorage({ [SOURCE]: CORRUPT });

  assert.deepEqual(clearCorruptProgressAfterVerifiedQuarantine({
    storage,
    sourceKey: SOURCE,
    quarantineKey: QUARANTINE,
    corruptRaw: CORRUPT,
    replacement: canonical,
  }), { persisted: true, quarantined: true });
  assert.equal(storage.getItem(SOURCE), canonical);
  assert.equal(storage.getItem(QUARANTINE), CORRUPT);
});

test("an identical existing quarantine copy makes an interrupted reset idempotent", () => {
  const storage = new TestStorage({
    [SOURCE]: CORRUPT,
    [QUARANTINE]: CORRUPT,
  });

  assert.deepEqual(clearCorruptProgressAfterVerifiedQuarantine({
    storage,
    sourceKey: SOURCE,
    quarantineKey: QUARANTINE,
    corruptRaw: CORRUPT,
  }), { persisted: true, quarantined: true });
  assert.equal(storage.getItem(SOURCE), null);
  assert.equal(storage.getItem(QUARANTINE), CORRUPT);
});

test("a different existing quarantine copy is never overwritten", () => {
  const storage = new TestStorage({
    [SOURCE]: CORRUPT,
    [QUARANTINE]: "{older-corrupt-record",
  });

  assert.deepEqual(clearCorruptProgressAfterVerifiedQuarantine({
    storage,
    sourceKey: SOURCE,
    quarantineKey: QUARANTINE,
    corruptRaw: CORRUPT,
  }), { persisted: false, reason: "unavailable" });
  assert.equal(storage.getItem(SOURCE), CORRUPT);
  assert.equal(storage.getItem(QUARANTINE), "{older-corrupt-record");
});

test("quota while writing quarantine leaves the active record byte-for-byte intact", () => {
  const storage = new FaultingStorage({ [SOURCE]: CORRUPT });
  storage.fail("setItem", QUARANTINE, "QuotaExceededError");

  assert.deepEqual(clearCorruptProgressAfterVerifiedQuarantine({
    storage,
    sourceKey: SOURCE,
    quarantineKey: QUARANTINE,
    corruptRaw: CORRUPT,
  }), { persisted: false, reason: "quota" });
  assert.equal(storage.getItem(SOURCE), CORRUPT);
  assert.equal(storage.getItem(QUARANTINE), null);
});

test("a failed or mismatched quarantine readback leaves the active record intact", () => {
  const blocked = new FaultingStorage({ [SOURCE]: CORRUPT });
  blocked.fail("getItem", QUARANTINE);
  assert.deepEqual(clearCorruptProgressAfterVerifiedQuarantine({
    storage: blocked,
    sourceKey: SOURCE,
    quarantineKey: QUARANTINE,
    corruptRaw: CORRUPT,
  }), { persisted: false, reason: "unavailable" });
  assert.equal(blocked.getItem(SOURCE), CORRUPT);

  const mismatched = new QuarantineReadbackMismatchStorage({ [SOURCE]: CORRUPT });
  assert.deepEqual(clearCorruptProgressAfterVerifiedQuarantine({
    storage: mismatched,
    sourceKey: SOURCE,
    quarantineKey: QUARANTINE,
    corruptRaw: CORRUPT,
  }), { persisted: false, reason: "unavailable" });
  assert.equal(mismatched.getItem(SOURCE), CORRUPT);
});

test("remove failure or silent no-op never reports a destructive success", () => {
  const blocked = new FaultingStorage({ [SOURCE]: CORRUPT });
  blocked.fail("removeItem", SOURCE);
  assert.deepEqual(clearCorruptProgressAfterVerifiedQuarantine({
    storage: blocked,
    sourceKey: SOURCE,
    quarantineKey: QUARANTINE,
    corruptRaw: CORRUPT,
  }), { persisted: false, reason: "unavailable" });
  assert.equal(blocked.getItem(SOURCE), CORRUPT);
  assert.equal(blocked.getItem(QUARANTINE), CORRUPT);

  const silent = new FaultingStorage({ [SOURCE]: CORRUPT });
  silent.silentRemovals.add(SOURCE);
  assert.deepEqual(clearCorruptProgressAfterVerifiedQuarantine({
    storage: silent,
    sourceKey: SOURCE,
    quarantineKey: QUARANTINE,
    corruptRaw: CORRUPT,
  }), { persisted: false, reason: "unavailable" });
  assert.equal(silent.getItem(SOURCE), CORRUPT);
  assert.equal(silent.getItem(QUARANTINE), CORRUPT);
});

test("a concurrent active-record change is never cleared", () => {
  const storage = new FaultingStorage({ [SOURCE]: CORRUPT });
  let sourceReads = 0;
  const originalGetItem = storage.getItem.bind(storage);
  storage.getItem = (key: string) => {
    if (key === SOURCE && sourceReads++ === 0) {
      storage.setItem(SOURCE, "{newer-corrupt-record");
    }
    return originalGetItem(key);
  };

  assert.deepEqual(clearCorruptProgressAfterVerifiedQuarantine({
    storage,
    sourceKey: SOURCE,
    quarantineKey: QUARANTINE,
    corruptRaw: CORRUPT,
  }), { persisted: false, reason: "unavailable" });
  assert.equal(storage.getItem(SOURCE), "{newer-corrupt-record");
  assert.equal(storage.getItem(QUARANTINE), CORRUPT);
});
