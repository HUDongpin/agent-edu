import assert from "node:assert/strict";
import test from "node:test";
import {
  CURSOR_CAPSTONE_DRAFT_STORAGE_KEY,
  CURSOR_CAPSTONE_RECEIPT_MEMORY_KEY,
  CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY,
  CURSOR_SESSION_DRAFT_PROBE_KEY,
  clearCursorAssessmentDrafts,
  clearSessionDraft,
  isCursorSessionDraftStorageAvailable,
  readSessionDraft,
  writeSessionDraft,
} from "../components/cursor/session-draft-store";
import {
  CURSOR_PROGRESS_STORAGE_KEY,
} from "../lib/progress-topology";
import {
  resetCursorProgressAfterGlobalReset,
} from "../components/cursor/progress-store";
import { createAllProgressAdapters } from "../components/progress-adapters";

type StorageOperation = "getItem" | "setItem" | "removeItem";

class ControlledStorage implements Storage {
  private readonly values = new Map<string, string>();
  private readonly thrown = new Set<string>();
  private readonly silent = new Set<string>();

  get length(): number { return this.values.size; }
  clear(): void { this.values.clear(); }
  key(index: number): string | null { return [...this.values.keys()][index] ?? null; }

  fail(operation: StorageOperation, key: string): void {
    this.thrown.add(`${operation}:${key}`);
  }

  ignore(operation: Exclude<StorageOperation, "getItem">, key: string): void {
    this.silent.add(`${operation}:${key}`);
  }

  allow(operation: StorageOperation, key: string): void {
    this.thrown.delete(`${operation}:${key}`);
    this.silent.delete(`${operation}:${key}`);
  }

  getItem(key: string): string | null {
    this.throwIfNeeded("getItem", key);
    return this.values.get(key) ?? null;
  }

  removeItem(key: string): void {
    this.throwIfNeeded("removeItem", key);
    if (this.silent.has(`removeItem:${key}`)) return;
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.throwIfNeeded("setItem", key);
    if (this.silent.has(`setItem:${key}`)) return;
    this.values.set(key, String(value));
  }

  private throwIfNeeded(operation: StorageOperation, key: string): void {
    if (!this.thrown.has(`${operation}:${key}`)) return;
    throw new DOMException(`${operation} denied`, "SecurityError");
  }
}

class BrowserWindow extends EventTarget {
  constructor(
    readonly localStorage: Storage,
    readonly sessionStorage: Storage,
  ) {
    super();
  }
}

async function withBrowser<T>(
  run: (storage: ControlledStorage, session: ControlledStorage) => T | Promise<T>,
): Promise<T> {
  const storage = new ControlledStorage();
  const session = new ControlledStorage();
  const browser = new BrowserWindow(storage, session);
  const descriptors = new Map<PropertyKey, PropertyDescriptor | undefined>();
  for (const key of ["window", "localStorage", "sessionStorage"] as const) {
    descriptors.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
  }
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: browser as unknown as Window & typeof globalThis,
  });
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: session });
  try {
    return await run(storage, session);
  } finally {
    for (const operation of ["getItem", "setItem", "removeItem"] as const) {
      for (const key of [
        CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY,
        CURSOR_CAPSTONE_DRAFT_STORAGE_KEY,
        CURSOR_CAPSTONE_RECEIPT_MEMORY_KEY,
        CURSOR_SESSION_DRAFT_PROBE_KEY,
      ]) {
        session.allow(operation, key);
      }
    }
    clearCursorAssessmentDrafts();
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
}

const draft = Object.freeze({
  schemaVersion: 2 as const,
  phase: "answering" as const,
  bankVersion: "course4-test-bank",
  questionIds: ["q1"],
  questionIndex: 0,
  selectedOptionId: null,
  checkedAnswers: {},
});
if (false) {
  // @ts-expect-error Course 4 draft APIs reject caller-manufactured keys.
  writeSessionDraft("ae.cursor.attacker-controlled", draft);
}
const acceptsDraft = (value: unknown): value is typeof draft => (
  typeof value === "object"
  && value !== null
  && !Array.isArray(value)
  && (value as Record<string, unknown>).schemaVersion === 2
  && (value as Record<string, unknown>).phase === "answering"
  && (value as Record<string, unknown>).bankVersion === "course4-test-bank"
  && Object.keys(value).length === 7
);

test("Cursor draft writes fail closed when sessionStorage silently drops the write", async () => {
  await withBrowser((_storage, session) => {
    session.ignore("setItem", CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY);

    const result = writeSessionDraft(CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY, draft);

    assert.deepEqual(result, { persisted: false, reason: "unavailable" });
    assert.equal(session.getItem(CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY), null);
    assert.deepEqual(
      readSessionDraft(CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY, acceptsDraft),
      draft,
      "the same-document memory fallback must retain the valid draft",
    );
  });
});

test("Cursor draft writes fail closed on thrown and denied sessionStorage", async () => {
  await withBrowser((_storage, session) => {
    session.fail("setItem", CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY);
    assert.deepEqual(
      writeSessionDraft(CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY, draft),
      { persisted: false, reason: "unavailable" },
    );
    assert.deepEqual(readSessionDraft(CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY, acceptsDraft), draft);
  });

  const storage = new ControlledStorage();
  const deniedWindow = new EventTarget() as EventTarget & { readonly localStorage: Storage };
  Object.defineProperty(deniedWindow, "localStorage", { configurable: true, value: storage });
  Object.defineProperty(deniedWindow, "sessionStorage", {
    configurable: true,
    get() { throw new DOMException("sessionStorage denied", "SecurityError"); },
  });
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: deniedWindow as unknown as Window & typeof globalThis,
  });
  try {
    assert.deepEqual(
      writeSessionDraft(CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY, draft),
      { persisted: false, reason: "unavailable" },
    );
    assert.deepEqual(readSessionDraft(CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY, acceptsDraft), draft);
    assert.deepEqual(
      clearSessionDraft(CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY),
      { persisted: false, reason: "unavailable" },
    );
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
});

test("Cursor uses one fixed probe and rejects silent probe writes and removals", async () => {
  await withBrowser((_storage, session) => {
    session.ignore("setItem", CURSOR_SESSION_DRAFT_PROBE_KEY);
    assert.equal(isCursorSessionDraftStorageAvailable(), false);
    session.allow("setItem", CURSOR_SESSION_DRAFT_PROBE_KEY);
    assert.equal(isCursorSessionDraftStorageAvailable(), true);

    session.setItem(CURSOR_SESSION_DRAFT_PROBE_KEY, "stale-probe");
    session.ignore("removeItem", CURSOR_SESSION_DRAFT_PROBE_KEY);
    assert.equal(isCursorSessionDraftStorageAvailable(), false);
    assert.equal(session.getItem(CURSOR_SESSION_DRAFT_PROBE_KEY), "stale-probe");
  });
});

test("Cursor draft clear stays retryable when removeItem is a silent no-op", async () => {
  await withBrowser((_storage, session) => {
    session.setItem(CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    assert.deepEqual(readSessionDraft(CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY, acceptsDraft), draft);
    session.ignore("removeItem", CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY);

    const failed = clearSessionDraft(CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY);

    assert.deepEqual(failed, { persisted: false, reason: "unavailable" });
    assert.deepEqual(readSessionDraft(CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY, acceptsDraft), draft);

    session.allow("removeItem", CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY);
    assert.deepEqual(clearSessionDraft(CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY), { persisted: true });
    assert.equal(session.getItem(CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY), null);

    session.setItem(CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    assert.deepEqual(readSessionDraft(CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY, acceptsDraft), draft);
    session.fail("removeItem", CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY);
    assert.deepEqual(
      clearSessionDraft(CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY),
      { persisted: false, reason: "unavailable" },
    );
    assert.deepEqual(readSessionDraft(CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY, acceptsDraft), draft);
    session.allow("removeItem", CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY);
    assert.deepEqual(clearSessionDraft(CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY), { persisted: true });
  });
});

test("Cursor assessment reset reports partial failure, retries, and preserves unrelated session state", async () => {
  await withBrowser((_storage, session) => {
    session.setItem(CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    session.setItem(CURSOR_CAPSTONE_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    session.setItem("unrelated.session.key", "must-survive");
    session.ignore("removeItem", CURSOR_CAPSTONE_DRAFT_STORAGE_KEY);

    assert.deepEqual(clearCursorAssessmentDrafts(), {
      persisted: false,
      reason: "unavailable",
    });
    assert.equal(session.getItem(CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY), null);
    assert.deepEqual(
      readSessionDraft(CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY, acceptsDraft),
      draft,
      "a partial multi-key reset retains the removed draft in memory until retry",
    );
    assert.equal(session.getItem("unrelated.session.key"), "must-survive");

    session.allow("removeItem", CURSOR_CAPSTONE_DRAFT_STORAGE_KEY);
    assert.deepEqual(clearCursorAssessmentDrafts(), { persisted: true });
    assert.equal(session.getItem(CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY), null);
    assert.equal(session.getItem(CURSOR_CAPSTONE_DRAFT_STORAGE_KEY), null);
    assert.equal(session.getItem("unrelated.session.key"), "must-survive");
  });
});

test("Cursor global reset merges durable and tab-scoped persistence results", async () => {
  await withBrowser(async (storage, session) => {
    storage.setItem(CURSOR_PROGRESS_STORAGE_KEY, JSON.stringify({
      "cursor.lesson.orient-privacy": true,
    }));
    session.setItem(CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    session.ignore("removeItem", CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY);

    const failed = await resetCursorProgressAfterGlobalReset();

    assert.equal(failed.persisted, false);
    assert.equal(failed.reason, "unavailable");
    assert.equal(storage.getItem(CURSOR_PROGRESS_STORAGE_KEY), null);
    assert.notEqual(session.getItem(CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY), null);

    session.allow("removeItem", CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY);
    assert.deepEqual(await resetCursorProgressAfterGlobalReset(), {
      progress: {},
      persisted: true,
    });
  });
});

test("Cursor progress adapter owns the durable record, fixed probe, and every draft key", async () => {
  await withBrowser(async (storage, session) => {
    const cursor = createAllProgressAdapters("en").find((adapter) => adapter.courseId === "cursor");
    assert.ok(cursor);
    assert.deepEqual(cursor.storageKeys, [
      CURSOR_PROGRESS_STORAGE_KEY,
      CURSOR_SESSION_DRAFT_PROBE_KEY,
      CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY,
      CURSOR_CAPSTONE_DRAFT_STORAGE_KEY,
      CURSOR_CAPSTONE_RECEIPT_MEMORY_KEY,
    ]);

    storage.setItem(CURSOR_PROGRESS_STORAGE_KEY, JSON.stringify({
      "cursor.lesson.orient-privacy": true,
    }));
    session.setItem(CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    session.ignore("removeItem", CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY);
    assert.deepEqual(await cursor.resetAfterGlobalReset(), {
      progress: {},
      persisted: false,
      reason: "unavailable",
    });
  });
});
