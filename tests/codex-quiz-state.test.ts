import assert from "node:assert/strict";
import test from "node:test";
import {
  CODEX_QUIZ_DRAFT_STORAGE_KEY,
  didCodexQuizStorageSliceChange,
  deriveCodexQuizResultState,
  deriveCodexQuizViewState,
  parseCodexQuizDraft,
  recordCodexQuizAttemptResult,
  type CodexQuizDraft,
} from "../lib/codex/quiz-draft";
import { CODEX_CAPSTONE_DRAFT_STORAGE_KEY } from "../lib/codex/capstone-draft";
import { CODEX_FINAL_QUIZ, CODEX_QUIZ } from "../lib/codex/quiz";
import {
  CODEX_PROGRESS_EVENT,
  CODEX_PROGRESS_RESET_EVENT,
  resetAllCourseProgress,
  resetCodexProgress,
} from "../components/codex/progress-store";

const ATTEMPT_IDS = [
  "q01", "q02", "q03",
  "q09", "q10", "q11",
  "q17", "q18", "q19",
  "q22", "q23", "q24",
] as const;

const DRAFT_QUESTIONS = CODEX_QUIZ.map((question) => ({
  id: question.id,
  unitId: question.unitId,
  optionCount: 4,
}));

const DRAFT_CONFIG = {
  bankVersion: CODEX_FINAL_QUIZ.bankVersion,
  questionCount: CODEX_FINAL_QUIZ.questionCount,
  questionsPerUnit: CODEX_FINAL_QUIZ.questionsPerUnit,
  questions: DRAFT_QUESTIONS,
} as const;

function validDraft(overrides: Partial<CodexQuizDraft> = {}): CodexQuizDraft {
  return {
    version: 1,
    bankVersion: CODEX_FINAL_QUIZ.bankVersion,
    questionIds: ATTEMPT_IDS,
    questionIndex: 1,
    selectedIndex: 2,
    answers: { q01: 1 },
    ...overrides,
  };
}

test("Codex quiz draft accepts only a current, exact stratified attempt with ordered prefix answers", () => {
  assert.deepEqual(parseCodexQuizDraft(validDraft(), DRAFT_CONFIG), validDraft());

  const invalidDrafts: readonly unknown[] = [
    { ...validDraft(), version: 2 },
    { ...validDraft(), bankVersion: "stale" },
    { ...validDraft(), questionIds: ATTEMPT_IDS.slice(0, -1) },
    { ...validDraft(), questionIds: [...ATTEMPT_IDS.slice(0, -1), "q01"] },
    { ...validDraft(), questionIds: [...ATTEMPT_IDS.slice(0, -1), "unknown"] },
    { ...validDraft(), questionIds: [...ATTEMPT_IDS.slice(0, -1), "q04"] },
    { ...validDraft(), questionIndex: -1 },
    { ...validDraft(), questionIndex: CODEX_FINAL_QUIZ.questionCount },
    { ...validDraft(), selectedIndex: 4 },
    { ...validDraft(), answers: { q02: 2 } },
    { ...validDraft(), answers: { q01: 1, q02: 2, q03: 3 } },
    { ...validDraft(), answers: { q01: 1, q02: 2 }, selectedIndex: 1 },
    { ...validDraft(), answers: { q01: true } },
  ];

  for (const draft of invalidDrafts) {
    assert.equal(parseCodexQuizDraft(draft, DRAFT_CONFIG), null, JSON.stringify(draft));
  }
});

test("Codex quiz view and result states keep fresh, resumable, active, pass, and lower-retake meanings distinct", () => {
  assert.equal(deriveCodexQuizViewState({
    active: false,
    completedScore: null,
    draft: null,
    bestScore: null,
    passed: false,
  }), "not-started");
  assert.equal(deriveCodexQuizViewState({
    active: false,
    completedScore: null,
    draft: validDraft(),
    bestScore: null,
    passed: false,
  }), "resumable");
  assert.equal(deriveCodexQuizViewState({
    active: true,
    completedScore: null,
    draft: validDraft(),
    bestScore: null,
    passed: false,
  }), "active");
  assert.equal(deriveCodexQuizViewState({
    active: false,
    completedScore: null,
    draft: null,
    bestScore: 0,
    passed: false,
  }), "finished");
  assert.equal(deriveCodexQuizViewState({
    active: false,
    completedScore: null,
    draft: null,
    bestScore: 12,
    passed: true,
  }), "passed-idle");

  assert.equal(deriveCodexQuizResultState(10, 10, true), "passed");
  assert.equal(deriveCodexQuizResultState(10, 10, false), "needs-review");
  assert.equal(deriveCodexQuizResultState(9, 10, true), "prior-pass-preserved");
  assert.equal(deriveCodexQuizResultState(9, 10, false), "needs-review");
});

test("finishing a Codex quiz atomically clears its draft and preserves a same-version best pass", () => {
  const progress: Record<string, unknown> = {
    unrelated: "keep",
    [CODEX_QUIZ_DRAFT_STORAGE_KEY]: validDraft(),
    [CODEX_FINAL_QUIZ.bestScoreStorageKey]: 12,
    [CODEX_FINAL_QUIZ.passedStorageKey]: true,
    [CODEX_FINAL_QUIZ.versionStorageKey]: CODEX_FINAL_QUIZ.bankVersion,
  };

  recordCodexQuizAttemptResult(progress, CODEX_FINAL_QUIZ, 9);

  assert.deepEqual(progress, {
    unrelated: "keep",
    [CODEX_FINAL_QUIZ.bestScoreStorageKey]: 12,
    [CODEX_FINAL_QUIZ.passedStorageKey]: true,
    [CODEX_FINAL_QUIZ.versionStorageKey]: CODEX_FINAL_QUIZ.bankVersion,
  });

  recordCodexQuizAttemptResult(progress, CODEX_FINAL_QUIZ, 10);
  assert.equal(progress[CODEX_FINAL_QUIZ.bestScoreStorageKey], 12);
  assert.equal(progress[CODEX_FINAL_QUIZ.passedStorageKey], true);
  assert.throws(
    () => recordCodexQuizAttemptResult(progress, CODEX_FINAL_QUIZ, 13),
    RangeError,
  );
});

test("cross-tab quiz reconciliation ignores unrelated writes and detects reset or attempt changes", () => {
  const draft = validDraft();
  const before = JSON.stringify({
    unrelated: "before",
    [CODEX_QUIZ_DRAFT_STORAGE_KEY]: draft,
    [CODEX_FINAL_QUIZ.bestScoreStorageKey]: 9,
    [CODEX_FINAL_QUIZ.passedStorageKey]: false,
    [CODEX_FINAL_QUIZ.versionStorageKey]: CODEX_FINAL_QUIZ.bankVersion,
  });
  const unrelated = JSON.stringify({
    unrelated: "after",
    [CODEX_QUIZ_DRAFT_STORAGE_KEY]: draft,
    [CODEX_FINAL_QUIZ.bestScoreStorageKey]: 9,
    [CODEX_FINAL_QUIZ.passedStorageKey]: false,
    [CODEX_FINAL_QUIZ.versionStorageKey]: CODEX_FINAL_QUIZ.bankVersion,
  });
  const advanced = JSON.stringify({
    unrelated: "after",
    [CODEX_QUIZ_DRAFT_STORAGE_KEY]: validDraft({
      questionIndex: 2,
      selectedIndex: null,
      answers: { q01: 1, q02: 2 },
    }),
    [CODEX_FINAL_QUIZ.bestScoreStorageKey]: 9,
    [CODEX_FINAL_QUIZ.passedStorageKey]: false,
    [CODEX_FINAL_QUIZ.versionStorageKey]: CODEX_FINAL_QUIZ.bankVersion,
  });

  assert.equal(didCodexQuizStorageSliceChange(before, unrelated, CODEX_FINAL_QUIZ), false);
  assert.equal(didCodexQuizStorageSliceChange(before, advanced, CODEX_FINAL_QUIZ), true);
  assert.equal(didCodexQuizStorageSliceChange(before, "{}", CODEX_FINAL_QUIZ), true);
  assert.equal(didCodexQuizStorageSliceChange(before, null, CODEX_FINAL_QUIZ), true);
  assert.equal(didCodexQuizStorageSliceChange(before, "{malformed", CODEX_FINAL_QUIZ), true);
});

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number { return this.values.size; }
  clear(): void { this.values.clear(); }
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  key(index: number): string | null { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string): void { this.values.delete(key); }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

class ReadBlockedStorage extends MemoryStorage {
  override getItem(): string | null {
    throw new DOMException("Storage denied", "SecurityError");
  }
}

class RemoveBlockedStorage extends MemoryStorage {
  override removeItem(): void {
    throw new DOMException("Storage denied", "SecurityError");
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

test("Codex course and every browser-side all-reset path emit reset and clear owned drafts", () => {
  const previousWindow = globalThis.window;
  const hadWindow = "window" in globalThis;

  const installWindow = (localStorage: Storage, sessionStorage: Storage) => {
    const browser = new BrowserEvents(localStorage, sessionStorage);
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: browser as unknown as Window & typeof globalThis,
    });
    return browser;
  };

  try {
    const courseStorage = new MemoryStorage();
    const courseSession = new MemoryStorage();
    const courseWindow = installWindow(courseStorage, courseSession);
    courseStorage.setItem("ae.progress", JSON.stringify({
      unrelated: "keep",
      "codex.lesson.meet-codex": true,
      [CODEX_QUIZ_DRAFT_STORAGE_KEY]: validDraft(),
    }));
    courseSession.setItem(CODEX_CAPSTONE_DRAFT_STORAGE_KEY, "private receipt draft");
    let courseResetEvents = 0;
    courseWindow.addEventListener(CODEX_PROGRESS_RESET_EVENT, () => { courseResetEvents += 1; });

    assert.equal(resetCodexProgress().persisted, true);
    assert.deepEqual(JSON.parse(courseStorage.getItem("ae.progress") || "{}"), {
      unrelated: "keep",
    });
    assert.equal(courseSession.getItem(CODEX_CAPSTONE_DRAFT_STORAGE_KEY), null);
    assert.equal(courseResetEvents, 1);

    for (const raw of [JSON.stringify({ "codex.quizPassed": true }), "{malformed"]) {
      const storage = new MemoryStorage();
      const session = new MemoryStorage();
      const browser = installWindow(storage, session);
      storage.setItem("ae.progress", raw);
      session.setItem(CODEX_CAPSTONE_DRAFT_STORAGE_KEY, "private receipt draft");
      let progressEvents = 0;
      let resetEvents = 0;
      browser.addEventListener(CODEX_PROGRESS_EVENT, () => { progressEvents += 1; });
      browser.addEventListener(CODEX_PROGRESS_RESET_EVENT, () => { resetEvents += 1; });

      assert.equal(resetAllCourseProgress().persisted, true);
      assert.equal(storage.getItem("ae.progress"), null);
      assert.equal(session.getItem(CODEX_CAPSTONE_DRAFT_STORAGE_KEY), null);
      assert.equal(progressEvents, 1);
      assert.equal(resetEvents, 1);
    }

    const blockedStorage = new ReadBlockedStorage();
    const blockedSession = new MemoryStorage();
    const blockedWindow = installWindow(blockedStorage, blockedSession);
    blockedSession.setItem(CODEX_CAPSTONE_DRAFT_STORAGE_KEY, "private receipt draft");
    let blockedResetEvents = 0;
    blockedWindow.addEventListener(CODEX_PROGRESS_RESET_EVENT, () => { blockedResetEvents += 1; });

    assert.equal(resetAllCourseProgress().persisted, false);
    assert.equal(blockedSession.getItem(CODEX_CAPSTONE_DRAFT_STORAGE_KEY), null);
    assert.equal(blockedResetEvents, 1);

    blockedSession.setItem(CODEX_CAPSTONE_DRAFT_STORAGE_KEY, "private receipt draft");
    assert.equal(resetCodexProgress().persisted, false);
    assert.equal(blockedSession.getItem(CODEX_CAPSTONE_DRAFT_STORAGE_KEY), null);
    assert.equal(blockedResetEvents, 2);

    const writableStorage = new MemoryStorage();
    const unclearedSession = new RemoveBlockedStorage();
    const unclearedWindow = installWindow(writableStorage, unclearedSession);
    writableStorage.setItem("ae.progress", JSON.stringify({ "codex.lesson.meet-codex": true }));
    unclearedSession.setItem(CODEX_CAPSTONE_DRAFT_STORAGE_KEY, "private receipt draft");
    let unclearedResetEvents = 0;
    unclearedWindow.addEventListener(CODEX_PROGRESS_RESET_EVENT, () => { unclearedResetEvents += 1; });

    const incompleteReset = resetCodexProgress();
    assert.equal(incompleteReset.persisted, false);
    assert.equal(incompleteReset.reason, "unavailable");
    assert.equal(unclearedSession.getItem(CODEX_CAPSTONE_DRAFT_STORAGE_KEY), "private receipt draft");
    assert.equal(unclearedResetEvents, 1);
  } finally {
    if (hadWindow) {
      Object.defineProperty(globalThis, "window", { configurable: true, value: previousWindow });
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }
  }
});
