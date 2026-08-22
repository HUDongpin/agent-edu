import assert from "node:assert/strict";
import test from "node:test";
import {
  EMPTY_LEARNING_STATE,
  HANDBOOK_SECTION_IDS,
  LEARNING_KEY,
  LEGACY_PROGRESS_KEY,
  LEGACY_SECTION_KEY,
  LEGACY_SEEN_KEY,
  createLearningStore,
  decodeLearningState,
  migrateLegacyLearningState,
  selectCourseProgress,
  selectHandbookProgress,
  selectLabProgress,
  type LearningStateV2,
  type StorageLike,
} from "../lib/progress";

class MemoryStorage implements StorageLike {
  readonly values = new Map<string, string>();

  constructor(seed: Record<string, string> = {}) {
    for (const [key, value] of Object.entries(seed)) this.values.set(key, value);
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

class BrokenStorage implements StorageLike {
  getItem(): string | null { throw new Error("blocked"); }
  setItem(): void { throw new Error("blocked"); }
  removeItem(): void { throw new Error("blocked"); }
}

class StorageEvents extends EventTarget {
  fire(key: string | null): void {
    const event = new Event("storage");
    Object.defineProperty(event, "key", { value: key });
    this.dispatchEvent(event);
  }
}

function v2(overrides: {
  handbook?: Partial<LearningStateV2["handbook"]>;
  lab?: Partial<LearningStateV2["lab"]>;
} = {}): LearningStateV2 {
  return {
    version: 2,
    handbook: {
      lastSection: "start",
      visitedSections: [],
      controlRoom: { completedRuns: 0 },
      ...overrides.handbook,
    },
    lab: {
      completedSteps: [],
      evalRunsCompleted: 0,
      ...overrides.lab,
    },
  };
}

function json(value: unknown): string {
  return JSON.stringify(value);
}

test("empty storage creates and returns the exact v2 default", () => {
  const storage = new MemoryStorage();
  const store = createLearningStore({ storage, events: null });
  const state = store.readLearningState();

  assert.deepEqual(state, EMPTY_LEARNING_STATE);
  assert.deepEqual(JSON.parse(storage.getItem(LEARNING_KEY)!), EMPTY_LEARNING_STATE);
});

test("a legal legacy section becomes lastSection", () => {
  const state = migrateLegacyLearningState({ section: "security", seen: null, progress: null });
  assert.equal(state.handbook.lastSection, "security");
});

test("an illegal legacy section defaults to start and is never inferred from seen", () => {
  const state = migrateLegacyLearningState({
    section: "not-a-section",
    seen: "code,security",
    progress: null,
  });
  assert.equal(state.handbook.lastSection, "start");
  assert.deepEqual(state.handbook.visitedSections, ["code", "security"]);
});

test("legacy seen is trimmed, deduplicated and filtered to known sections", () => {
  const state = migrateLegacyLearningState({
    section: null,
    seen: " code,code,bogus, play, ,security,play ",
    progress: null,
  });
  assert.deepEqual(state.handbook.visitedSections, ["code", "play", "security"]);
});

test("legacy play flags migrate only from the strict boolean true", () => {
  const state = migrateLegacyLearningState({
    section: null,
    seen: null,
    progress: json({ play0: true, play1: 1, play2: "true", play3: false }),
  });
  assert.deepEqual(state.lab.completedSteps, ["first-call"]);
});

test("legacy evalBest zero is valid evidence of a completed full Eval", () => {
  const state = migrateLegacyLearningState({
    section: null,
    seen: null,
    progress: json({ evalBest: 0 }),
  });
  assert.deepEqual(state.lab.completedSteps, ["full-eval"]);
  assert.equal(state.lab.evalRunsCompleted, 1);
  assert.equal(state.lab.evalBest, 0);
});

test("wrong-type and out-of-range legacy scores are rejected", () => {
  for (const evalBest of ["16", -1, 1.5, 21, null]) {
    const state = migrateLegacyLearningState({
      section: null,
      seen: null,
      progress: json({ evalBest }),
    });
    assert.deepEqual(state.lab.completedSteps, []);
    assert.equal(state.lab.evalBest, undefined);
    assert.equal(state.lab.evalRunsCompleted, 0);
  }
});

test("legacy play3 alone records a completed Eval without inventing a score", () => {
  const state = migrateLegacyLearningState({
    section: null,
    seen: null,
    progress: json({ play3: true }),
  });
  assert.deepEqual(state.lab.completedSteps, ["full-eval"]);
  assert.equal(state.lab.evalRunsCompleted, 1);
  assert.equal(state.lab.evalBest, undefined);
});

test("legacy part2 is never migrated into website learning state", () => {
  const state = migrateLegacyLearningState({
    section: null,
    seen: null,
    progress: json({ part2: true }),
  });
  assert.deepEqual(state, EMPTY_LEARNING_STATE);
  assert.equal(selectCourseProgress(state, "build").kind, "external");
});

test("an existing valid v2 record is authoritative over conflicting legacy data", () => {
  const expected = v2({ handbook: { lastSection: "code", visitedSections: ["code"] } });
  const storage = new MemoryStorage({
    [LEARNING_KEY]: json(expected),
    [LEGACY_SECTION_KEY]: "security",
    [LEGACY_SEEN_KEY]: HANDBOOK_SECTION_IDS.join(","),
    [LEGACY_PROGRESS_KEY]: json({ play0: true, evalBest: 20 }),
  });
  const state = createLearningStore({ storage, events: null }).readLearningState();

  assert.equal(state.handbook.lastSection, "code");
  assert.deepEqual(state.handbook.visitedSections, ["code"]);
  assert.deepEqual(state.lab.completedSteps, []);
});

test("a corrupt existing v2 record repairs to default without reabsorbing legacy", () => {
  const storage = new MemoryStorage({
    [LEARNING_KEY]: "{broken",
    [LEGACY_SECTION_KEY]: "security",
    [LEGACY_SEEN_KEY]: "security",
    [LEGACY_PROGRESS_KEY]: json({ play0: true, evalBest: 20 }),
  });
  const state = createLearningStore({ storage, events: null }).readLearningState();

  assert.deepEqual(state, EMPTY_LEARNING_STATE);
  assert.deepEqual(JSON.parse(storage.getItem(LEARNING_KEY)!), EMPTY_LEARNING_STATE);
});

test("v2 decoding safely normalises duplicate ids and invalid scalar fields", () => {
  const state = decodeLearningState(json({
    version: 2,
    handbook: {
      lastSection: "unknown",
      visitedSections: ["code", "code", "bad", "play"],
      controlRoom: { completedRuns: -2, bestScore: 11, lastFinishedAt: "not-a-date" },
    },
    lab: {
      completedSteps: ["full-eval", "rules", "rules", "bad", "first-call"],
      rulesBest: 11,
      evalRunsCompleted: 1.5,
      evalBest: 0,
    },
  }));

  assert.equal(state.handbook.lastSection, "start");
  assert.deepEqual(state.handbook.visitedSections, ["code", "play"]);
  assert.deepEqual(state.handbook.controlRoom, { completedRuns: 0 });
  assert.deepEqual(state.lab.completedSteps, ["first-call", "rules", "full-eval"]);
  assert.equal(state.lab.rulesBest, undefined);
  assert.equal(state.lab.evalRunsCompleted, 0);
  assert.equal(state.lab.evalBest, 0);
});

test("a different version decodes to the safe v2 default", () => {
  assert.deepEqual(decodeLearningState(json({ version: 1, handbook: {}, lab: {} })), EMPTY_LEARNING_STATE);
});

test("visiting six Handbook sections remains in progress, never completed", () => {
  const state = v2({ handbook: { visitedSections: HANDBOOK_SECTION_IDS.slice(0, 6) } });
  const progress = selectHandbookProgress(state);
  assert.equal(progress.status, "in-progress");
  assert.equal(progress.completed, false);
  assert.equal(progress.exploredSections, 6);
});

test("visiting all eleven Handbook sections still does not imply completion", () => {
  const state = v2({ handbook: { visitedSections: [...HANDBOOK_SECTION_IDS] } });
  const progress = selectHandbookProgress(state);
  assert.equal(progress.status, "in-progress");
  assert.equal(progress.completed, false);
  assert.equal(progress.exploredSections, 11);
});

test("a zero-score Control Room run is a real Handbook completion", () => {
  const storage = new MemoryStorage();
  const store = createLearningStore({
    storage,
    events: null,
    now: () => new Date("2026-08-21T01:02:03.000Z"),
  });
  const state = store.recordHandbookControlRoomFinish(0);

  assert.equal(selectHandbookProgress(state).status, "completed");
  assert.deepEqual(state.handbook.controlRoom, {
    completedRuns: 1,
    bestScore: 0,
    lastFinishedAt: "2026-08-21T01:02:03.000Z",
  });
});

test("repeated Control Room runs increment count, retain best and update time", () => {
  const storage = new MemoryStorage();
  const dates = [
    new Date("2026-08-21T01:00:00.000Z"),
    new Date("2026-08-21T02:00:00.000Z"),
    new Date("2026-08-21T03:00:00.000Z"),
  ];
  const store = createLearningStore({ storage, events: null, now: () => dates.shift()! });
  store.recordHandbookControlRoomFinish(7);
  store.recordHandbookControlRoomFinish(4);
  const state = store.recordHandbookControlRoomFinish(9);

  assert.equal(state.handbook.controlRoom.completedRuns, 3);
  assert.equal(state.handbook.controlRoom.bestScore, 9);
  assert.equal(state.handbook.controlRoom.lastFinishedAt, "2026-08-21T03:00:00.000Z");
});

test("run counters saturate at the largest safe integer", () => {
  const storage = new MemoryStorage({
    [LEARNING_KEY]: json(v2({
      handbook: {
        controlRoom: {
          completedRuns: Number.MAX_SAFE_INTEGER,
          bestScore: 4,
        },
      },
      lab: {
        completedSteps: ["full-eval"],
        evalRunsCompleted: Number.MAX_SAFE_INTEGER,
        evalBest: 4,
      },
    })),
  });
  const store = createLearningStore({ storage, events: null });

  assert.equal(
    store.recordHandbookControlRoomFinish(5).handbook.controlRoom.completedRuns,
    Number.MAX_SAFE_INTEGER,
  );
  assert.equal(
    store.recordLabStep("full-eval", { score: 5 }).lab.evalRunsCompleted,
    Number.MAX_SAFE_INTEGER,
  );
});

test("a complete low-scoring Eval completes full-eval without meeting the 16/20 target", () => {
  const store = createLearningStore({ storage: new MemoryStorage(), events: null });
  const state = store.recordLabStep("full-eval", { score: 12 });
  const progress = selectLabProgress(state);

  assert.ok(progress.completedSteps.includes("full-eval"));
  assert.equal(progress.evalRunsCompleted, 1);
  assert.equal(progress.evalBest, 12);
  assert.equal(progress.suggestedTargetMet, false);
});

test("a 16/20 Eval meets the suggested target but is not the whole Lab by itself", () => {
  const store = createLearningStore({ storage: new MemoryStorage(), events: null });
  const progress = selectLabProgress(store.recordLabStep("full-eval", { score: 16 }));

  assert.equal(progress.suggestedTargetMet, true);
  assert.equal(progress.status, "in-progress");
  assert.equal(progress.completed, false);
});

test("repeated complete Evals increment runs while best score only rises", () => {
  const store = createLearningStore({ storage: new MemoryStorage(), events: null });
  store.recordLabStep("full-eval", { score: 12 });
  store.recordLabStep("full-eval", { score: 8 });
  const state = store.recordLabStep("full-eval", { score: 18 });

  assert.equal(state.lab.evalRunsCompleted, 3);
  assert.equal(state.lab.evalBest, 18);
  assert.deepEqual(state.lab.completedSteps, ["full-eval"]);
});

test("invalid runtime scores do not mutate task completion", () => {
  const storage = new MemoryStorage();
  const store = createLearningStore({ storage, events: null });
  const before = store.readLearningState();

  assert.strictEqual(store.recordHandbookControlRoomFinish(11), before);
  assert.strictEqual(store.recordLabStep("rules", { score: 11 }), before);
  assert.strictEqual(store.recordLabStep("first-call", { score: 1 }), before);
});

test("same-tab subscribers are notified exactly once for a real mutation", () => {
  const events = new StorageEvents();
  const store = createLearningStore({ storage: new MemoryStorage(), events });
  let calls = 0;
  const unsubscribe = store.subscribeLearningState(() => { calls += 1; });

  store.recordHandbookVisit("code");
  assert.equal(calls, 1);
  unsubscribe();
});

test("idempotent records do not notify same-tab subscribers again", () => {
  const store = createLearningStore({ storage: new MemoryStorage(), events: new StorageEvents() });
  let calls = 0;
  const unsubscribe = store.subscribeLearningState(() => { calls += 1; });

  store.recordHandbookVisit("code");
  store.recordHandbookVisit("code");
  assert.equal(calls, 1);
  unsubscribe();
});

test("cross-tab subscription ignores unrelated keys and invalidates on v2", () => {
  const storage = new MemoryStorage();
  const events = new StorageEvents();
  const store = createLearningStore({ storage, events });
  store.readLearningState();
  let calls = 0;
  const unsubscribe = store.subscribeLearningState(() => { calls += 1; });

  storage.setItem(LEARNING_KEY, json(v2({ handbook: {
    lastSection: "security",
    visitedSections: ["security"],
  } })));
  events.fire("ae.theme");
  assert.equal(calls, 0);
  events.fire(LEARNING_KEY);
  assert.equal(calls, 1);
  assert.equal(store.readLearningState().handbook.lastSection, "security");

  unsubscribe();
  events.fire(LEARNING_KEY);
  assert.equal(calls, 1);
});

test("unchanged reads return a referentially stable snapshot", () => {
  const store = createLearningStore({ storage: new MemoryStorage(), events: null });
  const first = store.readLearningState();
  const second = store.readLearningState();
  assert.strictEqual(first, second);
});

test("dual-write preserves unrelated legacy data and expresses only supported fields", () => {
  const storage = new MemoryStorage({
    [LEGACY_PROGRESS_KEY]: json({ part2: true, note: "keep" }),
  });
  const store = createLearningStore({ storage, events: null });
  store.recordHandbookVisit("code");
  store.recordLabStep("first-call");
  store.recordLabStep("full-eval", { score: 12 });

  assert.equal(storage.getItem(LEGACY_SECTION_KEY), "code");
  assert.equal(storage.getItem(LEGACY_SEEN_KEY), "code");
  assert.deepEqual(JSON.parse(storage.getItem(LEGACY_PROGRESS_KEY)!), {
    part2: true,
    note: "keep",
    play0: true,
    evalBest: 12,
  });

  store.recordLabStep("full-eval", { score: 16 });
  assert.equal(JSON.parse(storage.getItem(LEGACY_PROGRESS_KEY)!).play3, true);
});

test("handbook reset preserves Lab state and clears both Handbook legacy keys", () => {
  const storage = new MemoryStorage();
  const store = createLearningStore({ storage, events: null });
  store.recordHandbookVisit("security");
  store.recordHandbookControlRoomFinish(8);
  store.recordLabStep("first-call");
  const state = store.resetLearningState("handbook");

  assert.deepEqual(state.handbook, EMPTY_LEARNING_STATE.handbook);
  assert.deepEqual(state.lab.completedSteps, ["first-call"]);
  assert.equal(storage.getItem(LEGACY_SECTION_KEY), null);
  assert.equal(storage.getItem(LEGACY_SEEN_KEY), null);
});

test("lab reset preserves Handbook state and unrelated legacy retirement data", () => {
  const storage = new MemoryStorage({
    [LEGACY_PROGRESS_KEY]: json({ part2: true, note: "keep" }),
  });
  const store = createLearningStore({ storage, events: null });
  store.recordHandbookVisit("graph");
  store.recordLabStep("first-call");
  store.recordLabStep("full-eval", { score: 18 });
  const state = store.resetLearningState("lab");

  assert.deepEqual(state.handbook.visitedSections, ["graph"]);
  assert.deepEqual(state.lab, EMPTY_LEARNING_STATE.lab);
  assert.deepEqual(JSON.parse(storage.getItem(LEGACY_PROGRESS_KEY)!), {
    part2: true,
    note: "keep",
  });
});

test("all reset keeps a v2 marker but clears every legacy progress key", () => {
  const storage = new MemoryStorage({
    [LEGACY_PROGRESS_KEY]: json({ part2: true }),
  });
  const store = createLearningStore({ storage, events: null });
  store.recordHandbookVisit("play");
  store.recordLabStep("first-call");
  const state = store.resetLearningState("all");

  assert.deepEqual(state, EMPTY_LEARNING_STATE);
  assert.deepEqual(JSON.parse(storage.getItem(LEARNING_KEY)!), EMPTY_LEARNING_STATE);
  assert.equal(storage.getItem(LEGACY_SECTION_KEY), null);
  assert.equal(storage.getItem(LEGACY_SEEN_KEY), null);
  assert.equal(storage.getItem(LEGACY_PROGRESS_KEY), null);
});

test("Part 3 is always external/open with no website percentage", () => {
  const state = migrateLegacyLearningState({
    section: null,
    seen: null,
    progress: json({ part2: true }),
  });
  assert.deepEqual(selectCourseProgress(state, "build"), {
    kind: "external",
    courseId: "build",
    action: "open",
    percent: null,
  });
});

test("unavailable catalogue entries are untracked rather than fake zero progress", () => {
  assert.deepEqual(selectCourseProgress(EMPTY_LEARNING_STATE, "tools"), {
    kind: "untracked",
    courseId: "tools",
    action: "unavailable",
    percent: null,
  });
});

test("server-style null storage is safe and cannot claim a transient completion", () => {
  const store = createLearningStore({ storage: null, events: null });
  assert.strictEqual(store.readLearningState(), EMPTY_LEARNING_STATE);
  assert.strictEqual(store.recordHandbookVisit("code"), EMPTY_LEARNING_STATE);
  assert.strictEqual(store.recordLabStep("full-eval", { score: 20 }), EMPTY_LEARNING_STATE);
});

test("blocked browser storage fails closed without throwing", () => {
  const store = createLearningStore({ storage: new BrokenStorage(), events: null });
  assert.doesNotThrow(() => store.readLearningState());
  assert.strictEqual(store.readLearningState(), EMPTY_LEARNING_STATE);
  assert.strictEqual(store.recordHandbookControlRoomFinish(10), EMPTY_LEARNING_STATE);
});
