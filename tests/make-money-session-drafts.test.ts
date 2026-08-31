import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  MAKE_MONEY_WITH_CODEX_MARGIN_DRAFT_KEY,
  MAKE_MONEY_WITH_CODEX_OFFER_DRAFT_KEY,
  MAKE_MONEY_WITH_CODEX_QUIZ_ANSWERS_DRAFT_KEY,
  MAKE_MONEY_WITH_CODEX_SCORECARD_DRAFT_KEY,
  MAKE_MONEY_WITH_CODEX_SESSION_DRAFT_KEYS,
  MAKE_MONEY_WITH_CODEX_SESSION_DRAFT_PROBE_KEY,
} from "../lib/make-money-session-draft-contract";
import {
  parseMarginSessionDraft,
  parseOfferSessionDraft,
  parseQuizAnswersSessionDraft,
  parseScorecardSessionDraft,
  OFFER_SESSION_DRAFT_FIELD_MAX_LENGTH,
  SCORECARD_SESSION_DRAFT_CANDIDATE_MAX_LENGTH,
  SCORECARD_SESSION_DRAFT_EVIDENCE_MAX_LENGTH,
} from "../lib/make-money-with-codex/session-draft-schemas";
import {
  clearIncomeSessionDraft,
  isIncomeSessionDraftStorageAvailable,
  readIncomeSessionDraft,
  resetIncomeSessionDraftsAfterProgressReset,
  writeIncomeSessionDraft,
} from "../components/make-money-with-codex/session-draft-store";
import { createPublishedProgressAdapters } from "../components/progress-adapters";

class MemoryStorage implements Storage {
  protected readonly values = new Map<string, string>();

  get length(): number { return this.values.size; }
  clear(): void { this.values.clear(); }
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  key(index: number): string | null { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string): void { this.values.delete(key); }
  setItem(key: string, value: string): void { this.values.set(key, String(value)); }
}

type Operation = "getItem" | "setItem" | "removeItem";

class AdversarialStorage extends MemoryStorage {
  private readonly silent = new Set<string>();
  private readonly thrown = new Map<string, string>();

  silentlyIgnore(operation: Operation, key: string): void {
    this.silent.add(`${operation}:${key}`);
  }

  throwOn(operation: Operation, key: string, name = "SecurityError"): void {
    this.thrown.set(`${operation}:${key}`, name);
  }

  private fault(operation: Operation, key: string): "silent" | null {
    const token = `${operation}:${key}`;
    const name = this.thrown.get(token);
    if (name) {
      const error = new Error("browser storage denied");
      error.name = name;
      throw error;
    }
    return this.silent.has(token) ? "silent" : null;
  }

  override getItem(key: string): string | null {
    if (this.fault("getItem", key)) return null;
    return super.getItem(key);
  }

  override setItem(key: string, value: string): void {
    if (this.fault("setItem", key)) return;
    super.setItem(key, value);
  }

  override removeItem(key: string): void {
    if (this.fault("removeItem", key)) return;
    super.removeItem(key);
  }
}

class BrowserEvents extends EventTarget {
  constructor(
    readonly sessionStorage: Storage,
    readonly localStorage: Storage = new MemoryStorage(),
  ) {
    super();
  }
}

async function withBrowser(
  storage: Storage,
  run: (browser: BrowserEvents) => void | Promise<void>,
): Promise<void> {
  const hadWindow = "window" in globalThis;
  const previousWindow = globalThis.window;
  const browser = new BrowserEvents(storage);
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: browser as unknown as Window & typeof globalThis,
  });
  try {
    await run(browser);
  } finally {
    if (hadWindow) {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: previousWindow,
      });
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }
  }
}

test("Course 11 owns exactly four fixed session drafts and one fixed probe", () => {
  assert.deepEqual(MAKE_MONEY_WITH_CODEX_SESSION_DRAFT_KEYS, [
    MAKE_MONEY_WITH_CODEX_MARGIN_DRAFT_KEY,
    MAKE_MONEY_WITH_CODEX_QUIZ_ANSWERS_DRAFT_KEY,
    MAKE_MONEY_WITH_CODEX_SCORECARD_DRAFT_KEY,
    MAKE_MONEY_WITH_CODEX_OFFER_DRAFT_KEY,
  ]);
  assert.equal(new Set(MAKE_MONEY_WITH_CODEX_SESSION_DRAFT_KEYS).size, 4);
  assert.equal(new Set([
    ...MAKE_MONEY_WITH_CODEX_SESSION_DRAFT_KEYS,
    MAKE_MONEY_WITH_CODEX_SESSION_DRAFT_PROBE_KEY,
  ]).size, 5);

  const hook = readFileSync(
    new URL("../components/make-money-with-codex/useSessionDraft.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(hook, /`\$\{storageKey\}\.probe`/);
});

test("Course 11 draft writes and clears verify storage and preserve unrelated keys", async () => {
  const storage = new MemoryStorage();
  storage.setItem("unrelated.session", "preserve-me");

  await withBrowser(storage, () => {
    const raw = JSON.stringify({ buyer: "Synthetic buyer" });
    assert.deepEqual(writeIncomeSessionDraft(MAKE_MONEY_WITH_CODEX_OFFER_DRAFT_KEY, raw), {
      persisted: true,
    });
    assert.deepEqual(readIncomeSessionDraft(MAKE_MONEY_WITH_CODEX_OFFER_DRAFT_KEY), {
      raw,
      persisted: true,
    });
    assert.deepEqual(clearIncomeSessionDraft(MAKE_MONEY_WITH_CODEX_OFFER_DRAFT_KEY), {
      persisted: true,
    });
    assert.equal(storage.getItem(MAKE_MONEY_WITH_CODEX_OFFER_DRAFT_KEY), null);
    assert.equal(storage.getItem("unrelated.session"), "preserve-me");
  });
});

test("Course 11 draft writes and clears fail closed on silent storage failures", async () => {
  const silentWrite = new AdversarialStorage();
  silentWrite.silentlyIgnore("setItem", MAKE_MONEY_WITH_CODEX_MARGIN_DRAFT_KEY);
  await withBrowser(silentWrite, () => {
    const result = writeIncomeSessionDraft(
      MAKE_MONEY_WITH_CODEX_MARGIN_DRAFT_KEY,
      JSON.stringify({ currency: "USD" }),
    );
    assert.deepEqual(result, { persisted: false, reason: "unavailable" });
    assert.equal(silentWrite.getItem(MAKE_MONEY_WITH_CODEX_MARGIN_DRAFT_KEY), null);
    assert.deepEqual(readIncomeSessionDraft(MAKE_MONEY_WITH_CODEX_MARGIN_DRAFT_KEY), {
      raw: JSON.stringify({ currency: "USD" }),
      persisted: false,
      reason: "unavailable",
    });
  });

  const silentRemove = new AdversarialStorage();
  silentRemove.setItem(MAKE_MONEY_WITH_CODEX_SCORECARD_DRAFT_KEY, "owned");
  silentRemove.silentlyIgnore("removeItem", MAKE_MONEY_WITH_CODEX_SCORECARD_DRAFT_KEY);
  await withBrowser(silentRemove, () => {
    assert.deepEqual(clearIncomeSessionDraft(MAKE_MONEY_WITH_CODEX_SCORECARD_DRAFT_KEY), {
      persisted: false,
      reason: "unavailable",
    });
    assert.equal(silentRemove.getItem(MAKE_MONEY_WITH_CODEX_SCORECARD_DRAFT_KEY), "owned");
  });
});

test("a failed Course 11 draft write does not hide another readable draft", async () => {
  const storage = new AdversarialStorage();
  const existingOffer = JSON.stringify({ buyer: "Existing synthetic buyer" });
  storage.setItem(MAKE_MONEY_WITH_CODEX_OFFER_DRAFT_KEY, existingOffer);
  storage.throwOn("setItem", MAKE_MONEY_WITH_CODEX_MARGIN_DRAFT_KEY, "QuotaExceededError");

  await withBrowser(storage, () => {
    assert.deepEqual(writeIncomeSessionDraft(
      MAKE_MONEY_WITH_CODEX_MARGIN_DRAFT_KEY,
      JSON.stringify({ currency: "USD" }),
    ), { persisted: false, reason: "quota" });
    assert.deepEqual(readIncomeSessionDraft(MAKE_MONEY_WITH_CODEX_OFFER_DRAFT_KEY), {
      raw: existingOffer,
      persisted: true,
    });
  });
});

test("Course 11 draft access classifies thrown and denied sessionStorage without leaking errors", async () => {
  const quota = new AdversarialStorage();
  quota.throwOn("setItem", MAKE_MONEY_WITH_CODEX_QUIZ_ANSWERS_DRAFT_KEY, "QuotaExceededError");
  await withBrowser(quota, () => {
    assert.deepEqual(writeIncomeSessionDraft(
      MAKE_MONEY_WITH_CODEX_QUIZ_ANSWERS_DRAFT_KEY,
      "{}",
    ), { persisted: false, reason: "quota" });
  });

  const browser = new EventTarget();
  Object.defineProperty(browser, "sessionStorage", {
    configurable: true,
    get() {
      const error = new Error("private detail must not escape");
      error.name = "SecurityError";
      throw error;
    },
  });
  const hadWindow = "window" in globalThis;
  const previousWindow = globalThis.window;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: browser as unknown as Window & typeof globalThis,
  });
  try {
    assert.equal(isIncomeSessionDraftStorageAvailable(), false);
    assert.deepEqual(readIncomeSessionDraft(MAKE_MONEY_WITH_CODEX_OFFER_DRAFT_KEY), {
      raw: null,
      persisted: false,
      reason: "unavailable",
    });
    assert.deepEqual(resetIncomeSessionDraftsAfterProgressReset(), {
      persisted: false,
      reason: "unavailable",
    });
  } finally {
    if (hadWindow) {
      Object.defineProperty(globalThis, "window", { configurable: true, value: previousWindow });
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }
  }
});

test("Course 11 progress reset removes only its fixed session keys", async () => {
  const storage = new MemoryStorage();
  for (const key of MAKE_MONEY_WITH_CODEX_SESSION_DRAFT_KEYS) storage.setItem(key, "owned");
  storage.setItem(MAKE_MONEY_WITH_CODEX_SESSION_DRAFT_PROBE_KEY, "stale-probe");
  storage.setItem("unrelated.session", "preserve-me");

  await withBrowser(storage, () => {
    assert.deepEqual(resetIncomeSessionDraftsAfterProgressReset(), { persisted: true });
    for (const key of MAKE_MONEY_WITH_CODEX_SESSION_DRAFT_KEYS) {
      assert.equal(storage.getItem(key), null, key);
    }
    assert.equal(storage.getItem(MAKE_MONEY_WITH_CODEX_SESSION_DRAFT_PROBE_KEY), null);
    assert.equal(storage.getItem("unrelated.session"), "preserve-me");
  });
});

test("Course 11 progress reset reports a silent removal and still attempts every owned key", async () => {
  const storage = new AdversarialStorage();
  for (const key of MAKE_MONEY_WITH_CODEX_SESSION_DRAFT_KEYS) storage.setItem(key, "owned");
  storage.setItem(MAKE_MONEY_WITH_CODEX_SESSION_DRAFT_PROBE_KEY, "stale-probe");
  storage.setItem("unrelated.session", "preserve-me");
  storage.silentlyIgnore("removeItem", MAKE_MONEY_WITH_CODEX_SCORECARD_DRAFT_KEY);

  await withBrowser(storage, () => {
    assert.deepEqual(resetIncomeSessionDraftsAfterProgressReset(), {
      persisted: false,
      reason: "unavailable",
    });
    assert.equal(storage.getItem(MAKE_MONEY_WITH_CODEX_SCORECARD_DRAFT_KEY), "owned");
    for (const key of MAKE_MONEY_WITH_CODEX_SESSION_DRAFT_KEYS) {
      if (key !== MAKE_MONEY_WITH_CODEX_SCORECARD_DRAFT_KEY) {
        assert.equal(storage.getItem(key), null, key);
      }
    }
    assert.equal(storage.getItem(MAKE_MONEY_WITH_CODEX_SESSION_DRAFT_PROBE_KEY), null);
    assert.equal(storage.getItem("unrelated.session"), "preserve-me");
  });
});

test("Course 11 adapter owns, probes, and resets every session draft key", async () => {
  const session = new MemoryStorage();
  const local = new MemoryStorage();
  const browser = new BrowserEvents(session, local);
  const hadWindow = "window" in globalThis;
  const previousWindow = globalThis.window;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: browser as unknown as Window & typeof globalThis,
  });
  try {
    const adapter = createPublishedProgressAdapters("en").find(
      (candidate) => candidate.courseId === "make-money-with-codex",
    );
    assert.ok(adapter);
    assert.deepEqual(adapter.storageKeys, [
      "ae.progress",
      "ae.progress.income-probe",
      MAKE_MONEY_WITH_CODEX_SESSION_DRAFT_PROBE_KEY,
      ...MAKE_MONEY_WITH_CODEX_SESSION_DRAFT_KEYS,
    ]);
    assert.equal(adapter.isPersistent(), true);

    for (const key of MAKE_MONEY_WITH_CODEX_SESSION_DRAFT_KEYS) session.setItem(key, "owned");
    session.setItem(MAKE_MONEY_WITH_CODEX_SESSION_DRAFT_PROBE_KEY, "stale-probe");
    session.setItem("unrelated.session", "preserve-me");
    assert.deepEqual(await adapter.resetAfterGlobalReset(), { persisted: true });
    for (const key of MAKE_MONEY_WITH_CODEX_SESSION_DRAFT_KEYS) {
      assert.equal(session.getItem(key), null, key);
    }
    assert.equal(session.getItem(MAKE_MONEY_WITH_CODEX_SESSION_DRAFT_PROBE_KEY), null);
    assert.equal(session.getItem("unrelated.session"), "preserve-me");
  } finally {
    if (hadWindow) {
      Object.defineProperty(globalThis, "window", { configurable: true, value: previousWindow });
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }
  }

  const deniedSession = new AdversarialStorage();
  deniedSession.silentlyIgnore("setItem", MAKE_MONEY_WITH_CODEX_SESSION_DRAFT_PROBE_KEY);
  await withBrowser(deniedSession, () => {
    const adapter = createPublishedProgressAdapters("en").find(
      (candidate) => candidate.courseId === "make-money-with-codex",
    );
    assert.ok(adapter);
    assert.equal(adapter.isPersistent(), false);
  });
});

test("Course 11 draft schemas reject unknown privacy-bearing fields", () => {
  const margin = {
    currency: "USD",
    observedOn: "2026-08-23",
    takeHome: 60000,
    annualHours: 1840,
    utilisation: 55,
    overhead: 20,
    reserve: 20,
    projectHours: 40,
    directCosts: 250,
    riskBuffer: 20,
    quote: 6500,
  };
  assert.deepEqual(parseMarginSessionDraft(margin), margin);
  assert.equal(parseMarginSessionDraft({ ...margin, apiKey: "must-not-survive" }), null);

  const questions = [
    { id: "q1", options: ["a", "b", "c", "d"] },
    { id: "q2", options: ["a", "b", "c", "d"] },
  ] as const;
  assert.deepEqual(parseQuizAnswersSessionDraft({ q1: 2 }, questions), { q1: 2 });
  assert.equal(parseQuizAnswersSessionDraft({ q1: 2, privateEmail: 0 }, questions), null);

  const scorecard = {
    scores: {
      pain: 1,
      frequency: 2,
      buyerAccess: 3,
      budget: 4,
      evidence: 5,
      speed: 1,
      repeatability: 2,
      dataRisk: 3,
      support: 4,
      dependency: 5,
    },
    candidate: "Synthetic accessibility audit",
    evidence: {
      pain: "dated observation",
      frequency: "",
      buyerAccess: "",
      budget: "",
      evidence: "",
      speed: "",
      repeatability: "",
      dataRisk: "",
      support: "",
      dependency: "",
    },
  };
  assert.deepEqual(parseScorecardSessionDraft(scorecard), scorecard);
  assert.equal(parseScorecardSessionDraft({ ...scorecard, customerRecord: "private" }), null);
  assert.equal(parseScorecardSessionDraft({
    ...scorecard,
    evidence: { ...scorecard.evidence, privatePath: "/private/customer" },
  }), null);
  assert.equal(parseScorecardSessionDraft({
    ...scorecard,
    candidate: "x".repeat(SCORECARD_SESSION_DRAFT_CANDIDATE_MAX_LENGTH + 1),
  }), null);
  assert.equal(parseScorecardSessionDraft({
    ...scorecard,
    evidence: {
      ...scorecard.evidence,
      pain: "x".repeat(SCORECARD_SESSION_DRAFT_EVIDENCE_MAX_LENGTH + 1),
    },
  }), null);

  const offer = {
    buyer: "Synthetic buyer",
    problem: "Synthetic problem",
    outcome: "",
    inputs: "",
    scope: "",
    nonGoals: "",
    acceptance: "",
    handoff: "",
    stop: "",
  };
  assert.deepEqual(parseOfferSessionDraft(offer), offer);
  assert.equal(parseOfferSessionDraft({ ...offer, accessToken: "must-not-survive" }), null);
  assert.equal(parseOfferSessionDraft({
    ...offer,
    buyer: "x".repeat(OFFER_SESSION_DRAFT_FIELD_MAX_LENGTH + 1),
  }), null);
});
