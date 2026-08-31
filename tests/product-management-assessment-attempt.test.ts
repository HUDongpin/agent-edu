import assert from "node:assert/strict";
import test from "node:test";
import { PRODUCT_MANAGEMENT_EN_COPY } from "../lib/product-management/copy/en";
import { PRODUCT_MANAGEMENT_COURSE_MANIFEST } from "../lib/product-management/manifest";
import {
  PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_KEY,
  PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_PROBE_KEY,
} from "../lib/progress-storage-contract";
import {
  clearProductManagementAssessmentAttempt,
  createProductManagementAssessmentAttemptConfig,
  isProductManagementAssessmentAttemptPersistenceAvailable,
  parseProductManagementAssessmentAttempt,
  writeProductManagementAssessmentAttempt,
  type ProductManagementAssessmentAttemptDraft,
} from "../components/product-management/assessment-attempt-store";
import {
  resetProductManagementProgress,
} from "../components/product-management/progress-store";
import { createAllProgressAdapters } from "../components/progress-adapters";
import { resetEveryCourseProgress } from "../components/progress-reset";

type StorageOperation = "getItem" | "setItem" | "removeItem";

class FaultingStorage implements Storage {
  private readonly values = new Map<string, string>();
  private readonly throws = new Set<string>();
  private readonly silentRemovals = new Set<string>();

  get length(): number { return this.values.size; }
  clear(): void { this.values.clear(); }
  key(index: number): string | null { return [...this.values.keys()][index] ?? null; }

  fail(operation: StorageOperation, key: string): void {
    this.throws.add(`${operation}:${key}`);
  }

  allow(operation: StorageOperation, key: string): void {
    this.throws.delete(`${operation}:${key}`);
  }

  silentlyKeep(key: string): void {
    this.silentRemovals.add(key);
  }

  allowRemoval(key: string): void {
    this.silentRemovals.delete(key);
  }

  private throwIfDenied(operation: StorageOperation, key: string): void {
    if (!this.throws.has(`${operation}:${key}`)) return;
    throw new DOMException(`${operation} denied`, "SecurityError");
  }

  getItem(key: string): string | null {
    this.throwIfDenied("getItem", key);
    return this.values.get(key) ?? null;
  }

  removeItem(key: string): void {
    this.throwIfDenied("removeItem", key);
    if (!this.silentRemovals.has(key)) this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.throwIfDenied("setItem", key);
    this.values.set(key, value);
  }
}

class BrowserEvents extends EventTarget {
  constructor(
    readonly localStorage: Storage,
    readonly sessionStorage: Storage,
  ) {
    super();
  }
}

const questions = PRODUCT_MANAGEMENT_EN_COPY.finalAssessment.questions;
const config = createProductManagementAssessmentAttemptConfig({
  bankVersion: PRODUCT_MANAGEMENT_COURSE_MANIFEST.version,
  questions,
});

function validDraft(index = 1): ProductManagementAssessmentAttemptDraft {
  return {
    schemaVersion: 1,
    bankVersion: PRODUCT_MANAGEMENT_COURSE_MANIFEST.version,
    questionIds: questions.map((question) => question.id),
    index,
    answers: Object.fromEntries(
      questions.slice(0, index).map((question, answerIndex) => [
        question.id,
        answerIndex % 2 === 0,
      ]),
    ),
  };
}

function parse(value: unknown) {
  return parseProductManagementAssessmentAttempt(JSON.stringify(value), config);
}

async function withBrowser<T>(
  local: Storage,
  session: Storage,
  run: (browser: BrowserEvents) => T | Promise<T>,
): Promise<T> {
  const browser = new BrowserEvents(local, session);
  const hadWindow = "window" in globalThis;
  const previousWindow = globalThis.window;
  const hadLocalStorage = "localStorage" in globalThis;
  const previousLocalStorage = globalThis.localStorage;
  const hadSessionStorage = "sessionStorage" in globalThis;
  const previousSessionStorage = globalThis.sessionStorage;

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: browser as unknown as Window & typeof globalThis,
  });
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: local });
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: session });
  try {
    return await run(browser);
  } finally {
    if (hadWindow) {
      Object.defineProperty(globalThis, "window", { configurable: true, value: previousWindow });
    } else Reflect.deleteProperty(globalThis, "window");
    if (hadLocalStorage) {
      Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        value: previousLocalStorage,
      });
    } else Reflect.deleteProperty(globalThis, "localStorage");
    if (hadSessionStorage) {
      Object.defineProperty(globalThis, "sessionStorage", {
        configurable: true,
        value: previousSessionStorage,
      });
    } else Reflect.deleteProperty(globalThis, "sessionStorage");
  }
}

test("Course 14 accepts only the exact current assessment-attempt schema", () => {
  const draft = validDraft();
  assert.deepEqual(parse(draft), draft);
  assert.deepEqual(Object.keys(draft).sort(), [
    "answers",
    "bankVersion",
    "index",
    "questionIds",
    "schemaVersion",
  ]);

  const cases: ReadonlyArray<readonly [string, unknown]> = [
    ["wrong schema", { ...draft, schemaVersion: 2 }],
    ["stale bank", { ...draft, bankVersion: "stale" }],
    ["stale question order", {
      ...draft,
      questionIds: [draft.questionIds[1], draft.questionIds[0], ...draft.questionIds.slice(2)],
    }],
    ["unknown question", {
      ...draft,
      questionIds: ["unknown", ...draft.questionIds.slice(1)],
    }],
    ["negative index", { ...draft, index: -1 }],
    ["fractional index", { ...draft, index: 0.5 }],
    ["past-end index", { ...draft, index: questions.length }],
    ["missing prior answer", { ...draft, answers: {} }],
    ["future answer", {
      ...draft,
      answers: {
        ...draft.answers,
        [questions[1].id]: true,
      },
    }],
    ["unknown answer id", { ...draft, answers: { ...draft.answers, unknown: true } }],
    ["non-boolean answer", {
      ...draft,
      answers: { [questions[0].id]: 1 },
    }],
    ["sensitive extra field", { ...draft, prompt: "must not persist" }],
  ];

  for (const [label, value] of cases) assert.equal(parse(value), null, label);
  assert.throws(
    () => createProductManagementAssessmentAttemptConfig({
      bankVersion: PRODUCT_MANAGEMENT_COURSE_MANIFEST.version,
      questions: [{ ...questions[0], correctIndex: questions[0].options.length }],
    }),
    /invalid answer range/u,
  );
});

test("Course 14 attempt persistence probes sessionStorage independently", async () => {
  const local = new FaultingStorage();
  const session = new FaultingStorage();
  await withBrowser(local, session, () => {
    assert.equal(isProductManagementAssessmentAttemptPersistenceAvailable(), true);
    session.silentlyKeep(PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_PROBE_KEY);
    assert.equal(isProductManagementAssessmentAttemptPersistenceAvailable(), false);
    session.allowRemoval(PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_PROBE_KEY);
    assert.equal(isProductManagementAssessmentAttemptPersistenceAvailable(), true);
  });
});

test("Course 14 attempt clear rejects silent and throwing removals, then retries safely", async () => {
  const local = new FaultingStorage();
  const session = new FaultingStorage();
  await withBrowser(local, session, () => {
    session.setItem("unrelated.session", "preserve-session");
    assert.deepEqual(writeProductManagementAssessmentAttempt(validDraft()), { persisted: true });

    session.silentlyKeep(PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_KEY);
    assert.deepEqual(clearProductManagementAssessmentAttempt(), {
      persisted: false,
      reason: "unavailable",
    });
    assert.notEqual(session.getItem(PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_KEY), null);

    session.allowRemoval(PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_KEY);
    session.fail("removeItem", PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_KEY);
    assert.deepEqual(clearProductManagementAssessmentAttempt(), {
      persisted: false,
      reason: "unavailable",
    });
    assert.notEqual(session.getItem(PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_KEY), null);

    session.allow("removeItem", PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_KEY);
    assert.deepEqual(clearProductManagementAssessmentAttempt(), { persisted: true });
    assert.equal(session.getItem(PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_KEY), null);
    assert.equal(session.getItem("unrelated.session"), "preserve-session");
  });
});

test("Course 14 attempt storage denial fails closed without breaking the in-memory attempt", async () => {
  const local = new FaultingStorage();
  const denied = new FaultingStorage();
  denied.fail("setItem", PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_PROBE_KEY);
  await withBrowser(local, denied, () => {
    assert.equal(isProductManagementAssessmentAttemptPersistenceAvailable(), false);
    assert.deepEqual(writeProductManagementAssessmentAttempt(validDraft()), {
      persisted: false,
      reason: "unavailable",
    });
  });
});

test("Course 14 fails closed when the sessionStorage property itself is denied", () => {
  const deniedWindow = new EventTarget();
  Object.defineProperty(deniedWindow, "sessionStorage", {
    configurable: true,
    get() {
      throw new DOMException("Session storage denied", "SecurityError");
    },
  });
  const hadWindow = "window" in globalThis;
  const previousWindow = globalThis.window;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: deniedWindow as unknown as Window & typeof globalThis,
  });
  try {
    assert.equal(isProductManagementAssessmentAttemptPersistenceAvailable(), false);
    assert.deepEqual(writeProductManagementAssessmentAttempt(validDraft()), {
      persisted: false,
      reason: "unavailable",
    });
  } finally {
    if (hadWindow) {
      Object.defineProperty(globalThis, "window", { configurable: true, value: previousWindow });
    } else Reflect.deleteProperty(globalThis, "window");
  }
});

test("Course 14 adapter and course reset compose durable and session persistence", async () => {
  const local = new FaultingStorage();
  const session = new FaultingStorage();
  await withBrowser(local, session, () => {
    local.setItem("ae.progress", JSON.stringify({
      "product-management.progress.version": 1,
      "product-management.module.test": true,
      "claude-income.lesson.test": true,
    }));
    session.setItem("unrelated.session", "preserve-session");
    assert.deepEqual(writeProductManagementAssessmentAttempt(validDraft()), { persisted: true });

    const adapter = createAllProgressAdapters("en").find(
      (candidate) => candidate.courseId === "product-management",
    );
    assert.ok(adapter);
    assert.ok(adapter.storageKeys.includes(PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_KEY));
    assert.ok(adapter.storageKeys.includes(PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_PROBE_KEY));
    assert.equal(adapter.isPersistent(), true);

    session.silentlyKeep(PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_KEY);
    const failed = resetProductManagementProgress();
    assert.deepEqual(failed, {
      persisted: false,
      progressPersisted: true,
      attemptPersisted: false,
      reason: "unavailable",
    });
    assert.equal(adapter.isPersistent(), false);
    assert.notEqual(session.getItem(PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_KEY), null);
    const afterFailedReset = JSON.parse(local.getItem("ae.progress") || "null") as Record<string, unknown>;
    assert.equal(afterFailedReset["product-management.module.test"], undefined);
    assert.equal(afterFailedReset["claude-income.lesson.test"], true);

    session.allowRemoval(PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_KEY);
    assert.deepEqual(resetProductManagementProgress(), {
      persisted: true,
      progressPersisted: true,
      attemptPersisted: true,
    });
    assert.equal(adapter.isPersistent(), true);
    assert.equal(session.getItem(PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_KEY), null);
    assert.equal(session.getItem("unrelated.session"), "preserve-session");
  });
});

test("the global reset reports a Course 14 attempt failure and succeeds on retry", async () => {
  const local = new FaultingStorage();
  const session = new FaultingStorage();
  await withBrowser(local, session, async () => {
    session.setItem("unrelated.session", "preserve-session");
    assert.deepEqual(writeProductManagementAssessmentAttempt(validDraft()), { persisted: true });
    session.silentlyKeep(PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_KEY);

    const failed = await resetEveryCourseProgress();
    assert.equal(failed.persistent, false);
    assert.ok(failed.failedStores.includes("product-management"));
    assert.equal(failed.failureReasons["product-management"], "unavailable");
    assert.notEqual(session.getItem(PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_KEY), null);

    session.allowRemoval(PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_KEY);
    const retried = await resetEveryCourseProgress();
    assert.equal(retried.persistent, true);
    assert.equal(retried.failedStores.includes("product-management"), false);
    assert.equal(session.getItem(PRODUCT_MANAGEMENT_ASSESSMENT_ATTEMPT_KEY), null);
    assert.equal(session.getItem("unrelated.session"), "preserve-session");
  });
});
