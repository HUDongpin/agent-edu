import assert from "node:assert/strict";
import test from "node:test";
import {
  GITHUB_CAPSTONE_DRAFT_KEY,
  GITHUB_CAPSTONE_DRAFT_SCHEMA_VERSION,
  GITHUB_QUIZ_DRAFT_KEY,
  GITHUB_QUIZ_DRAFT_SCHEMA_VERSION,
  clearInvalidGithubCapstoneDraft,
  clearInvalidGithubQuizDraft,
  clearGithubCapstoneDraft,
  clearGithubQuizDraft,
  decodeGithubCapstoneDraft,
  decodeGithubQuizDraft,
  encodeGithubCapstoneDraft,
  encodeGithubQuizDraft,
  getGithubCapstoneDraft,
  getGithubQuizDraft,
  setGithubCapstoneDraft,
  setGithubQuizDraft,
  type GithubCapstoneDraftContext,
  type GithubQuizDraftContext,
  type GithubQuizDraftState,
} from "../lib/github/draft";
import { GITHUB_FINAL_QUIZ, GITHUB_QUIZ } from "../lib/github/quiz";
import {
  COURSE_PROGRESS_STORAGE_KEY,
  isCourseProgressPersistenceAvailable,
  readCourseProgressSnapshot,
  updateCourseProgress,
} from "../components/github/progress-store";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  setCalls = 0;

  get length(): number { return this.values.size; }
  clear(): void { this.values.clear(); }
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  key(index: number): string | null { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string): void { this.values.delete(key); }
  setItem(key: string, value: string): void {
    this.setCalls += 1;
    this.values.set(key, value);
  }
}

const quizContext: GithubQuizDraftContext = {
  bankVersion: GITHUB_FINAL_QUIZ.bankVersion,
  questionCount: GITHUB_FINAL_QUIZ.questionCount,
  questionsPerUnit: GITHUB_FINAL_QUIZ.questionsPerUnit,
  questions: GITHUB_QUIZ.map((question) => ({
    id: question.id,
    unitId: question.unitId,
    optionCount: 4,
  })),
};

const orderedQuestionIds = [
  "q17", "q01", "q09", "q18", "q02", "q10",
  "q19", "q03", "q11", "q20", "q04", "q12",
] as const;

const quizState: GithubQuizDraftState = {
  orderedQuestionIds,
  questionIndex: 2,
  selectedIndex: 3,
  submittedAnswers: {
    q17: 2,
    q01: 1,
  },
};

const artifactIds = [
  "repository",
  "issue",
  "branch",
  "commits",
  "pull-request",
  "project",
  "automation",
  "release",
] as const;

const capstoneContext: GithubCapstoneDraftContext = {
  artifactSetVersion: "github-capstone-artifacts-2026-08-30-v1",
  artifactIds,
};

test("quiz draft encodes only resumable selections and round-trips against the current bank", () => {
  const encoded = encodeGithubQuizDraft(quizState, quizContext);
  assert.deepEqual(encoded, {
    schemaVersion: GITHUB_QUIZ_DRAFT_SCHEMA_VERSION,
    bankVersion: GITHUB_FINAL_QUIZ.bankVersion,
    orderedQuestionIds,
    questionIndex: 2,
    selectedIndex: 3,
    submittedAnswers: { q17: 2, q01: 1 },
  });
  assert.deepEqual(decodeGithubQuizDraft(encoded, quizContext), encoded);
  assert.equal(JSON.stringify(encoded).includes("correct"), false);
});

test("quiz draft rejects stale metadata, malformed attempts, and non-stratified selection", () => {
  const good = encodeGithubQuizDraft(quizState, quizContext);
  assert.ok(good);
  assert.equal(decodeGithubQuizDraft({ ...good, schemaVersion: 2 }, quizContext), null);
  assert.equal(decodeGithubQuizDraft({ ...good, bankVersion: "stale-bank" }, quizContext), null);
  assert.equal(decodeGithubQuizDraft({ ...good, orderedQuestionIds: orderedQuestionIds.slice(0, 11) }, quizContext), null);
  assert.equal(decodeGithubQuizDraft({
    ...good,
    orderedQuestionIds: [...orderedQuestionIds.slice(0, 11), orderedQuestionIds[0]],
  }, quizContext), null);
  assert.equal(decodeGithubQuizDraft({
    ...good,
    orderedQuestionIds: [...orderedQuestionIds.slice(0, 11), "q99"],
  }, quizContext), null);
  assert.equal(decodeGithubQuizDraft({
    ...good,
    orderedQuestionIds: [
      "q01", "q02", "q03", "q04", "q05", "q06",
      "q09", "q10", "q17", "q18", "q19", "q20",
    ],
  }, quizContext), null);
});

test("quiz draft rejects invalid cursor and submitted-answer state", () => {
  const good = encodeGithubQuizDraft(quizState, quizContext);
  assert.ok(good);
  for (const questionIndex of [-1, 12, 1.5]) {
    assert.equal(decodeGithubQuizDraft({ ...good, questionIndex }, quizContext), null);
  }
  for (const selectedIndex of [-1, 4, 1.5, "1"]) {
    assert.equal(decodeGithubQuizDraft({ ...good, selectedIndex }, quizContext), null);
  }
  assert.equal(decodeGithubQuizDraft({ ...good, submittedAnswers: { ...good.submittedAnswers, q17: 4 } }, quizContext), null);
  assert.equal(decodeGithubQuizDraft({ ...good, submittedAnswers: { ...good.submittedAnswers, q99: 0 } }, quizContext), null);
  assert.equal(decodeGithubQuizDraft({ ...good, submittedAnswers: { ...good.submittedAnswers, q10: 1 } }, quizContext), null);
  assert.equal(decodeGithubQuizDraft({ ...good, submittedAnswers: { q17: 2 } }, quizContext), null);
  assert.equal(decodeGithubQuizDraft({
    ...good,
    submittedAnswers: { ...good.submittedAnswers, q09: 1 },
    selectedIndex: 3,
  }, quizContext), null);
});

test("quiz record helpers touch only the exact Course 6 draft field", () => {
  const unrelated = { nested: true };
  const progress: Record<string, unknown> = {
    "github.future.setting": "preserve-me",
    "codex.lesson.meet-codex": true,
    unrelated,
  };
  assert.equal(setGithubQuizDraft(progress, quizState, quizContext), true);
  assert.deepEqual(getGithubQuizDraft(progress, quizContext), encodeGithubQuizDraft(quizState, quizContext));
  assert.equal(progress["github.future.setting"], "preserve-me");
  assert.equal(progress["codex.lesson.meet-codex"], true);
  assert.equal(progress.unrelated, unrelated);

  const snapshot = structuredClone(progress);
  assert.equal(setGithubQuizDraft(progress, { ...quizState, questionIndex: 99 }, quizContext), false);
  assert.deepEqual(progress, snapshot);
  assert.equal(clearGithubQuizDraft(progress), true);
  assert.equal(progress[GITHUB_QUIZ_DRAFT_KEY], undefined);
  assert.equal(clearGithubQuizDraft(progress), false);
  assert.deepEqual(progress, {
    "github.future.setting": "preserve-me",
    "codex.lesson.meet-codex": true,
    unrelated,
  });
});

test("capstone draft binds checked IDs to the exact current artifact set and version", () => {
  const encoded = encodeGithubCapstoneDraft({
    checkedArtifactIds: ["release", "repository", "release"],
  }, capstoneContext);
  assert.deepEqual(encoded, {
    schemaVersion: GITHUB_CAPSTONE_DRAFT_SCHEMA_VERSION,
    artifactSetVersion: capstoneContext.artifactSetVersion,
    artifactIds,
    checkedArtifactIds: ["repository", "release"],
  });
  assert.deepEqual(decodeGithubCapstoneDraft(encoded, capstoneContext), encoded);
  assert.equal(decodeGithubCapstoneDraft({ ...encoded, schemaVersion: 2 }, capstoneContext), null);
  assert.equal(decodeGithubCapstoneDraft({ ...encoded, artifactSetVersion: "stale" }, capstoneContext), null);
  assert.equal(decodeGithubCapstoneDraft({ ...encoded, artifactIds: artifactIds.slice(0, 7) }, capstoneContext), null);
  assert.equal(decodeGithubCapstoneDraft({
    ...encoded,
    artifactIds: [...artifactIds.slice(0, 7), artifactIds[0]],
  }, capstoneContext), null);
  assert.equal(decodeGithubCapstoneDraft({ ...encoded, checkedArtifactIds: ["unknown"] }, capstoneContext), null);
  assert.equal(decodeGithubCapstoneDraft({ ...encoded, checkedArtifactIds: ["repository", "repository"] }, capstoneContext), null);
  assert.equal(encodeGithubCapstoneDraft({ checkedArtifactIds: ["unknown"] }, capstoneContext), null);
});

test("capstone record helpers preserve every unrelated field and clear only their own draft", () => {
  const quizDraft = encodeGithubQuizDraft(quizState, quizContext);
  const progress: Record<string, unknown> = {
    [GITHUB_QUIZ_DRAFT_KEY]: quizDraft,
    "github.capstone.v1": false,
    "github.future.setting": "preserve-me",
    unrelated: { keep: true },
  };
  assert.equal(setGithubCapstoneDraft(progress, {
    checkedArtifactIds: ["branch", "project"],
  }, capstoneContext), true);
  assert.deepEqual(getGithubCapstoneDraft(progress, capstoneContext)?.checkedArtifactIds, [
    "branch",
    "project",
  ]);
  assert.equal(progress[GITHUB_QUIZ_DRAFT_KEY], quizDraft);
  assert.equal(progress["github.future.setting"], "preserve-me");

  assert.equal(clearGithubCapstoneDraft(progress), true);
  assert.equal(progress[GITHUB_CAPSTONE_DRAFT_KEY], undefined);
  assert.equal(progress[GITHUB_QUIZ_DRAFT_KEY], quizDraft);
  assert.deepEqual(progress.unrelated, { keep: true });
});

test("decoders fail closed for absent, scalar, array, and malformed record fields", () => {
  for (const value of [undefined, null, "{broken", 1, true, [], { schemaVersion: 1 }]) {
    assert.equal(decodeGithubQuizDraft(value, quizContext), null);
    assert.equal(decodeGithubCapstoneDraft(value, capstoneContext), null);
  }
  assert.equal(getGithubQuizDraft({ unrelated: true }, quizContext), null);
  assert.equal(getGithubCapstoneDraft({ unrelated: true }, capstoneContext), null);
});

test("stale-draft cleanup revalidates the latest record and never deletes a valid replacement", () => {
  const validQuizDraft = encodeGithubQuizDraft(quizState, quizContext);
  const validCapstoneDraft = encodeGithubCapstoneDraft({
    checkedArtifactIds: ["repository", "release"],
  }, capstoneContext);
  assert.ok(validQuizDraft);
  assert.ok(validCapstoneDraft);

  const staleQuiz: Record<string, unknown> = {
    [GITHUB_QUIZ_DRAFT_KEY]: { ...validQuizDraft, bankVersion: "stale" },
    unrelated: true,
  };
  const staleCapstone: Record<string, unknown> = {
    [GITHUB_CAPSTONE_DRAFT_KEY]: {
      ...validCapstoneDraft,
      artifactSetVersion: "stale",
    },
    unrelated: true,
  };
  assert.equal(clearInvalidGithubQuizDraft(staleQuiz, quizContext), true);
  assert.equal(staleQuiz[GITHUB_QUIZ_DRAFT_KEY], undefined);
  assert.equal(staleQuiz.unrelated, true);
  assert.equal(
    clearInvalidGithubCapstoneDraft(staleCapstone, capstoneContext),
    true,
  );
  assert.equal(staleCapstone[GITHUB_CAPSTONE_DRAFT_KEY], undefined);
  assert.equal(staleCapstone.unrelated, true);

  const replacedQuiz: Record<string, unknown> = {
    [GITHUB_QUIZ_DRAFT_KEY]: validQuizDraft,
    unrelated: true,
  };
  const replacedCapstone: Record<string, unknown> = {
    [GITHUB_CAPSTONE_DRAFT_KEY]: validCapstoneDraft,
    unrelated: true,
  };
  assert.equal(clearInvalidGithubQuizDraft(replacedQuiz, quizContext), false);
  assert.deepEqual(replacedQuiz[GITHUB_QUIZ_DRAFT_KEY], validQuizDraft);
  assert.equal(
    clearInvalidGithubCapstoneDraft(replacedCapstone, capstoneContext),
    false,
  );
  assert.deepEqual(
    replacedCapstone[GITHUB_CAPSTONE_DRAFT_KEY],
    validCapstoneDraft,
  );
});

test("a no-op Course 6 update never recreates a site-wide removed shared record", () => {
  const storage = new MemoryStorage();
  const browser = new EventTarget() as EventTarget & { localStorage: Storage };
  Object.defineProperty(browser, "localStorage", { value: storage });
  const hadWindow = "window" in globalThis;
  const previousWindow = globalThis.window;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: browser as unknown as Window & typeof globalThis,
  });

  try {
    assert.equal(storage.getItem(COURSE_PROGRESS_STORAGE_KEY), null);
    const result = updateCourseProgress(() => undefined);
    assert.equal(result.persisted, true);
    assert.equal(storage.getItem(COURSE_PROGRESS_STORAGE_KEY), null);
    assert.equal(storage.setCalls, 0);
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
});

test("empty malformed shared progress stays byte-exact and fails closed", () => {
  const storage = new MemoryStorage();
  storage.setItem(COURSE_PROGRESS_STORAGE_KEY, "");
  const initialSetCalls = storage.setCalls;
  const browser = new EventTarget() as EventTarget & { localStorage: Storage };
  Object.defineProperty(browser, "localStorage", { value: storage });
  const hadWindow = "window" in globalThis;
  const previousWindow = globalThis.window;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: browser as unknown as Window & typeof globalThis,
  });

  try {
    assert.equal(readCourseProgressSnapshot(), "{}");
    assert.equal(isCourseProgressPersistenceAvailable(), false);
    assert.equal(storage.getItem(COURSE_PROGRESS_STORAGE_KEY), "");

    const noOp = updateCourseProgress(() => undefined);
    assert.equal(noOp.persisted, false);
    const mutation = updateCourseProgress((progress) => {
      progress["github.lesson.start-secure"] = true;
    });
    assert.equal(mutation.persisted, false);
    assert.equal(storage.getItem(COURSE_PROGRESS_STORAGE_KEY), "");
    assert.equal(storage.setCalls, initialSetCalls);
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
});
