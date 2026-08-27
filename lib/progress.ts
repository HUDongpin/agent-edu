/**
 * The local, versioned learning record.
 *
 * `ae.learning.v2` is the only source of truth. The three older keys are read
 * once when v2 is absent, then kept in sync for one release so a tab still
 * running the previous build does not present a completely different journey.
 * Nothing in this module leaves the browser.
 */

export const LEARNING_KEY = "ae.learning.v2";
/** Same-tab notification for the canonical Course 1 learning record. */
export const LEARNING_PROGRESS_EVENT = "ae:learning-progress";
export const LEGACY_PROGRESS_KEY = "ae.progress";
export const LEGACY_SECTION_KEY = "tch.section";
export const LEGACY_SEEN_KEY = "tch.seen";

/** Kept temporarily for the Lab compatibility exports at the bottom. */
export const PROG = LEGACY_PROGRESS_KEY;

export const HANDBOOK_SECTION_IDS = [
  "start", "code", "prompt", "context", "loop", "graph",
  "harness", "evals", "security", "compare", "play",
] as const;

export type HandbookSectionId = (typeof HANDBOOK_SECTION_IDS)[number];

export const LAB_STEPS = ["first-call", "rules", "prompt-trial", "full-eval"] as const;

export type LabStep = (typeof LAB_STEPS)[number];
export type LearningStatus = "not-started" | "in-progress" | "completed";
export type ResetScope = "handbook" | "lab" | "all";

export interface LearningStateV2 {
  readonly version: 2;
  readonly handbook: {
    readonly lastSection: HandbookSectionId;
    readonly visitedSections: readonly HandbookSectionId[];
    readonly controlRoom: {
      readonly completedRuns: number;
      readonly bestScore?: number;
      readonly lastFinishedAt?: string;
    };
  };
  readonly lab: {
    readonly completedSteps: readonly LabStep[];
    readonly rulesBest?: number;
    readonly evalRunsCompleted: number;
    readonly evalBest?: number;
  };
}

export interface HandbookProgress {
  readonly status: LearningStatus;
  readonly completed: boolean;
  readonly exploredSections: number;
  readonly totalSections: number;
  readonly lastSection: HandbookSectionId;
  readonly completedRuns: number;
  readonly bestScore?: number;
}

export interface LabProgress {
  readonly status: LearningStatus;
  readonly completed: boolean;
  readonly completedSteps: readonly LabStep[];
  readonly completedCount: number;
  readonly totalSteps: number;
  readonly rulesBest?: number;
  readonly evalRunsCompleted: number;
  readonly evalBest?: number;
  readonly suggestedTargetMet: boolean;
}

export type CourseProgress =
  | {
      readonly kind: "tracked";
      readonly courseId: "handbook" | "lab";
      readonly status: LearningStatus;
      /** A display measure, not a claim of mastery. */
      readonly current: number;
      readonly total: number;
      readonly percent: number;
    }
  | {
      readonly kind: "external";
      readonly courseId: "build";
      readonly action: "open";
      readonly percent: null;
    }
  | {
      readonly kind: "untracked";
      readonly courseId: string;
      readonly action: "unavailable";
      readonly percent: null;
    };

export interface LabStepEvidence {
  /** Rules scores are 0..10; full Eval scores are 0..20. */
  readonly score?: number;
}

export interface LegacyLearningInput {
  readonly section: string | null;
  readonly seen: string | null;
  readonly progress: string | null;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface LearningStoreOptions {
  /** `null` deliberately models a server or unavailable browser storage. */
  readonly storage?: StorageLike | null;
  /** Injectable so node:test can exercise cross-tab storage events. */
  readonly events?: EventTarget | null;
  readonly now?: () => Date;
}

export interface LearningStore {
  readLearningState(): LearningStateV2;
  subscribeLearningState(listener: () => void): () => void;
  recordHandbookVisit(section: HandbookSectionId): LearningStateV2;
  recordHandbookControlRoomFinish(score: number): LearningStateV2;
  recordLabStep(step: LabStep, evidence?: LabStepEvidence): LearningStateV2;
  resetLearningState(scope: ResetScope): LearningStateV2;
}

const SECTION_SET = new Set<string>(HANDBOOK_SECTION_IDS);
const STEP_SET = new Set<string>(LAB_STEPS);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIntegerIn(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= min && value <= max;
}

function isSection(value: unknown): value is HandbookSectionId {
  return typeof value === "string" && SECTION_SET.has(value);
}

function isLabStep(value: unknown): value is LabStep {
  return typeof value === "string" && STEP_SET.has(value);
}

function uniqueSections(value: unknown): HandbookSectionId[] {
  if (!Array.isArray(value)) return [];
  const out: HandbookSectionId[] = [];
  const seen = new Set<HandbookSectionId>();
  for (const item of value) {
    if (isSection(item) && !seen.has(item)) {
      seen.add(item);
      out.push(item);
    }
  }
  return out;
}

function uniqueSteps(value: unknown): LabStep[] {
  if (!Array.isArray(value)) return [];
  const present = new Set(value.filter(isLabStep));
  // Canonical order keeps snapshots deterministic even after malformed input.
  return LAB_STEPS.filter((step) => present.has(step));
}

function optionalInteger(
  object: Record<string, unknown>,
  key: string,
  min: number,
  max: number,
): number | undefined {
  const value = object[key];
  return isIntegerIn(value, min, max) ? value : undefined;
}

function optionalDate(object: Record<string, unknown>, key: string): string | undefined {
  const value = object[key];
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : undefined;
}

function freezeState(state: LearningStateV2): LearningStateV2 {
  Object.freeze(state.handbook.visitedSections);
  Object.freeze(state.handbook.controlRoom);
  Object.freeze(state.handbook);
  Object.freeze(state.lab.completedSteps);
  Object.freeze(state.lab);
  return Object.freeze(state);
}

function makeDefaultState(): LearningStateV2 {
  return freezeState({
    version: 2,
    handbook: {
      lastSection: "start",
      visitedSections: [],
      controlRoom: { completedRuns: 0 },
    },
    lab: {
      completedSteps: [],
      evalRunsCompleted: 0,
    },
  });
}

export const EMPTY_LEARNING_STATE = makeDefaultState();

function normaliseLearningState(value: unknown): LearningStateV2 {
  if (!isRecord(value) || value.version !== 2) return EMPTY_LEARNING_STATE;

  const handbook = isRecord(value.handbook) ? value.handbook : {};
  const controlRoom = isRecord(handbook.controlRoom) ? handbook.controlRoom : {};
  const lab = isRecord(value.lab) ? value.lab : {};

  const bestScore = optionalInteger(controlRoom, "bestScore", 0, 10);
  const lastFinishedAt = optionalDate(controlRoom, "lastFinishedAt");
  const rulesBest = optionalInteger(lab, "rulesBest", 0, 10);
  const evalBest = optionalInteger(lab, "evalBest", 0, 20);

  return freezeState({
    version: 2,
    handbook: {
      lastSection: isSection(handbook.lastSection) ? handbook.lastSection : "start",
      visitedSections: uniqueSections(handbook.visitedSections),
      controlRoom: {
        completedRuns: isIntegerIn(controlRoom.completedRuns, 0, Number.MAX_SAFE_INTEGER)
          ? controlRoom.completedRuns : 0,
        ...(bestScore === undefined ? {} : { bestScore }),
        ...(lastFinishedAt === undefined ? {} : { lastFinishedAt }),
      },
    },
    lab: {
      completedSteps: uniqueSteps(lab.completedSteps),
      ...(rulesBest === undefined ? {} : { rulesBest }),
      evalRunsCompleted: isIntegerIn(lab.evalRunsCompleted, 0, Number.MAX_SAFE_INTEGER)
        ? lab.evalRunsCompleted : 0,
      ...(evalBest === undefined ? {} : { evalBest }),
    },
  });
}

/** Decode v2 only. A bad or different version never falls through to legacy. */
export function decodeLearningState(raw: string | null): LearningStateV2 {
  if (raw === null) return EMPTY_LEARNING_STATE;
  try {
    return normaliseLearningState(JSON.parse(raw) as unknown);
  } catch {
    return EMPTY_LEARNING_STATE;
  }
}

function legacyObject(raw: string | null): Record<string, unknown> {
  if (raw === null) return {};
  try {
    const value = JSON.parse(raw) as unknown;
    return isRecord(value) ? value : {};
  } catch {
    return {};
  }
}

/** The one allowed conversion from the unversioned keys into v2. */
export function migrateLegacyLearningState(input: LegacyLearningInput): LearningStateV2 {
  const progress = legacyObject(input.progress);
  const visitedSections: HandbookSectionId[] = [];
  const seen = new Set<HandbookSectionId>();
  for (const raw of (input.seen ?? "").split(",")) {
    const section = raw.trim();
    if (isSection(section) && !seen.has(section)) {
      seen.add(section);
      visitedSections.push(section);
    }
  }

  const completedSteps: LabStep[] = [];
  if (progress.play0 === true) completedSteps.push("first-call");
  if (progress.play1 === true) completedSteps.push("rules");
  if (progress.play2 === true) completedSteps.push("prompt-trial");

  const evalBest = isIntegerIn(progress.evalBest, 0, 20) ? progress.evalBest : undefined;
  const hasCompletedEval = evalBest !== undefined || progress.play3 === true;
  if (hasCompletedEval) completedSteps.push("full-eval");

  // `part2` is intentionally absent: the website cannot observe progress.json.
  return freezeState({
    version: 2,
    handbook: {
      lastSection: isSection(input.section) ? input.section : "start",
      visitedSections,
      controlRoom: { completedRuns: 0 },
    },
    lab: {
      completedSteps,
      evalRunsCompleted: hasCompletedEval ? 1 : 0,
      ...(evalBest === undefined ? {} : { evalBest }),
    },
  });
}

function serialise(state: LearningStateV2): string {
  return JSON.stringify(state);
}

function browserStorage(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function browserEvents(): EventTarget | null {
  return typeof window === "undefined" ? null : window;
}

type ReadResult = { readonly ok: true; readonly value: string | null } | { readonly ok: false };

function safeRead(storage: StorageLike, key: string): ReadResult {
  try {
    return { ok: true, value: storage.getItem(key) };
  } catch {
    return { ok: false };
  }
}

function safeWrite(storage: StorageLike, key: string, value: string): boolean {
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeRemove(storage: StorageLike, key: string): boolean {
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function incrementSafely(value: number): number {
  return Math.min(Number.MAX_SAFE_INTEGER, value + 1);
}

function stateWithHandbookReset(state: LearningStateV2): LearningStateV2 {
  return freezeState({
    ...state,
    handbook: EMPTY_LEARNING_STATE.handbook,
  });
}

function stateWithLabReset(state: LearningStateV2): LearningStateV2 {
  return freezeState({
    ...state,
    lab: EMPTY_LEARNING_STATE.lab,
  });
}

export function selectHandbookProgress(state: LearningStateV2): HandbookProgress {
  const completed = state.handbook.controlRoom.completedRuns > 0;
  const exploredSections = state.handbook.visitedSections.length;
  const status: LearningStatus = completed
    ? "completed"
    : exploredSections > 0 ? "in-progress" : "not-started";
  return {
    status,
    completed,
    exploredSections,
    totalSections: HANDBOOK_SECTION_IDS.length,
    lastSection: state.handbook.lastSection,
    completedRuns: state.handbook.controlRoom.completedRuns,
    ...(state.handbook.controlRoom.bestScore === undefined
      ? {} : { bestScore: state.handbook.controlRoom.bestScore }),
  };
}

export function selectLabProgress(state: LearningStateV2): LabProgress {
  const completedSteps = state.lab.completedSteps;
  const completedCount = completedSteps.length;
  const completed = completedCount === LAB_STEPS.length;
  const status: LearningStatus = completed
    ? "completed"
    : completedCount > 0 ? "in-progress" : "not-started";
  return {
    status,
    completed,
    completedSteps,
    completedCount,
    totalSteps: LAB_STEPS.length,
    ...(state.lab.rulesBest === undefined ? {} : { rulesBest: state.lab.rulesBest }),
    evalRunsCompleted: state.lab.evalRunsCompleted,
    ...(state.lab.evalBest === undefined ? {} : { evalBest: state.lab.evalBest }),
    suggestedTargetMet: state.lab.evalBest !== undefined && state.lab.evalBest >= 16,
  };
}

export function selectCourseProgress(state: LearningStateV2, courseId: string): CourseProgress {
  if (courseId === "handbook") {
    const progress = selectHandbookProgress(state);
    return {
      kind: "tracked",
      courseId,
      status: progress.status,
      current: progress.exploredSections,
      total: progress.totalSections,
      percent: Math.round((progress.exploredSections / progress.totalSections) * 100),
    };
  }
  if (courseId === "lab") {
    const progress = selectLabProgress(state);
    return {
      kind: "tracked",
      courseId,
      status: progress.status,
      current: progress.completedCount,
      total: progress.totalSteps,
      percent: Math.round((progress.completedCount / progress.totalSteps) * 100),
    };
  }
  if (courseId === "build") {
    return { kind: "external", courseId, action: "open", percent: null };
  }
  return { kind: "untracked", courseId, action: "unavailable", percent: null };
}

export function createLearningStore(options: LearningStoreOptions = {}): LearningStore {
  const hasInjectedStorage = Object.prototype.hasOwnProperty.call(options, "storage");
  const hasInjectedEvents = Object.prototype.hasOwnProperty.call(options, "events");
  const getStorage = () => hasInjectedStorage ? options.storage ?? null : browserStorage();
  const getEvents = () => hasInjectedEvents ? options.events ?? null : browserEvents();
  const now = options.now ?? (() => new Date());

  const watchers = new Set<() => void>();
  let listeningTarget: EventTarget | null = null;
  let cachedToken: string | undefined;
  let cachedState = EMPTY_LEARNING_STATE;

  const notify = () => {
    for (const watcher of watchers) watcher();
  };

  const onStorage = (event: Event) => {
    const key = (event as StorageEvent).key;
    if (key !== LEARNING_KEY && key !== null) return;
    cachedToken = undefined;
    notify();
  };

  function writeLegacy(state: LearningStateV2, storage: StorageLike): void {
    safeWrite(storage, LEGACY_SECTION_KEY, state.handbook.lastSection);
    safeWrite(storage, LEGACY_SEEN_KEY, state.handbook.visitedSections.join(","));

    const old = safeRead(storage, LEGACY_PROGRESS_KEY);
    const progress = old.ok ? legacyObject(old.value) : {};
    for (const key of ["play0", "play1", "play2", "play3", "evalBest"]) delete progress[key];

    if (state.lab.completedSteps.includes("first-call")) progress.play0 = true;
    if (state.lab.completedSteps.includes("rules")) progress.play1 = true;
    if (state.lab.completedSteps.includes("prompt-trial")) progress.play2 = true;
    if (state.lab.evalBest !== undefined) progress.evalBest = state.lab.evalBest;
    // In the old UI play3 meant the 16/20 target, not merely a completed Eval.
    if (state.lab.evalBest !== undefined && state.lab.evalBest >= 16) progress.play3 = true;

    if (Object.keys(progress).length) {
      safeWrite(storage, LEGACY_PROGRESS_KEY, JSON.stringify(progress));
    } else {
      safeRemove(storage, LEGACY_PROGRESS_KEY);
    }
  }

  function readLearningState(): LearningStateV2 {
    const storage = getStorage();
    if (!storage) return EMPTY_LEARNING_STATE;

    const current = safeRead(storage, LEARNING_KEY);
    if (!current.ok) return EMPTY_LEARNING_STATE;

    if (current.value !== null) {
      const token = `v2\u0000${current.value}`;
      if (token === cachedToken) return cachedState;

      const state = decodeLearningState(current.value);
      const canonical = serialise(state);
      const repaired = canonical === current.value || safeWrite(storage, LEARNING_KEY, canonical);
      cachedToken = repaired ? `v2\u0000${canonical}` : token;
      cachedState = state;
      return state;
    }

    const section = safeRead(storage, LEGACY_SECTION_KEY);
    const seen = safeRead(storage, LEGACY_SEEN_KEY);
    const progress = safeRead(storage, LEGACY_PROGRESS_KEY);
    if (!section.ok || !seen.ok || !progress.ok) return EMPTY_LEARNING_STATE;

    const token = `legacy\u0000${JSON.stringify([section.value, seen.value, progress.value])}`;
    if (token === cachedToken) return cachedState;

    const state = migrateLegacyLearningState({
      section: section.value,
      seen: seen.value,
      progress: progress.value,
    });
    const canonical = serialise(state);
    const persisted = safeWrite(storage, LEARNING_KEY, canonical);
    if (persisted) writeLegacy(state, storage);
    cachedToken = persisted ? `v2\u0000${canonical}` : token;
    cachedState = state;
    return state;
  }

  function commit(update: (state: LearningStateV2) => LearningStateV2): LearningStateV2 {
    const current = readLearningState();
    const next = update(current);
    const currentRaw = serialise(current);
    const nextRaw = serialise(next);
    if (nextRaw === currentRaw) return current;

    const storage = getStorage();
    if (!storage || !safeWrite(storage, LEARNING_KEY, nextRaw)) return current;

    writeLegacy(next, storage);
    cachedToken = `v2\u0000${nextRaw}`;
    cachedState = next;
    notify();
    getEvents()?.dispatchEvent(new Event(LEARNING_PROGRESS_EVENT));
    return next;
  }

  function recordHandbookVisit(section: HandbookSectionId): LearningStateV2 {
    if (!isSection(section)) return readLearningState();
    return commit((state) => {
      const visitedSections = state.handbook.visitedSections.includes(section)
        ? state.handbook.visitedSections
        : [...state.handbook.visitedSections, section];
      return freezeState({
        ...state,
        handbook: {
          ...state.handbook,
          lastSection: section,
          visitedSections,
        },
      });
    });
  }

  function recordHandbookControlRoomFinish(score: number): LearningStateV2 {
    if (!isIntegerIn(score, 0, 10)) return readLearningState();
    return commit((state) => {
      const previous = state.handbook.controlRoom.bestScore;
      let finishedAt: string;
      try {
        finishedAt = now().toISOString();
      } catch {
        finishedAt = new Date().toISOString();
      }
      return freezeState({
        ...state,
        handbook: {
          ...state.handbook,
          controlRoom: {
            completedRuns: incrementSafely(state.handbook.controlRoom.completedRuns),
            bestScore: previous === undefined ? score : Math.max(previous, score),
            lastFinishedAt: finishedAt,
          },
        },
      });
    });
  }

  function recordLabStep(step: LabStep, evidence: LabStepEvidence = {}): LearningStateV2 {
    if (!isLabStep(step)) return readLearningState();
    const scoreLimit = step === "rules" ? 10 : step === "full-eval" ? 20 : null;
    if (evidence.score !== undefined && (scoreLimit === null || !isIntegerIn(evidence.score, 0, scoreLimit))) {
      return readLearningState();
    }

    return commit((state) => {
      const completedSteps = state.lab.completedSteps.includes(step)
        ? state.lab.completedSteps
        : LAB_STEPS.filter((candidate) =>
            state.lab.completedSteps.includes(candidate) || candidate === step);
      const score = evidence.score;
      const rulesBest = step === "rules" && score !== undefined
        ? state.lab.rulesBest === undefined ? score : Math.max(state.lab.rulesBest, score)
        : state.lab.rulesBest;
      const evalBest = step === "full-eval" && score !== undefined
        ? state.lab.evalBest === undefined ? score : Math.max(state.lab.evalBest, score)
        : state.lab.evalBest;

      return freezeState({
        ...state,
        lab: {
          completedSteps,
          ...(rulesBest === undefined ? {} : { rulesBest }),
          evalRunsCompleted: step === "full-eval"
            ? incrementSafely(state.lab.evalRunsCompleted)
            : state.lab.evalRunsCompleted,
          ...(evalBest === undefined ? {} : { evalBest }),
        },
      });
    });
  }

  function resetLearningState(scope: ResetScope): LearningStateV2 {
    if (scope !== "handbook" && scope !== "lab" && scope !== "all") return readLearningState();
    const result = commit((state) => {
      if (scope === "handbook") return stateWithHandbookReset(state);
      if (scope === "lab") return stateWithLabReset(state);
      return EMPTY_LEARNING_STATE;
    });

    const storage = getStorage();
    if (!storage) return result;
    const handbookWasReset = result.handbook.lastSection === "start"
      && result.handbook.visitedSections.length === 0
      && result.handbook.controlRoom.completedRuns === 0
      && result.handbook.controlRoom.bestScore === undefined
      && result.handbook.controlRoom.lastFinishedAt === undefined;
    const labWasReset = result.lab.completedSteps.length === 0
      && result.lab.rulesBest === undefined
      && result.lab.evalRunsCompleted === 0
      && result.lab.evalBest === undefined;

    if ((scope === "handbook" && handbookWasReset) || (scope === "all" && handbookWasReset && labWasReset)) {
      safeRemove(storage, LEGACY_SECTION_KEY);
      safeRemove(storage, LEGACY_SEEN_KEY);
    }
    if (scope === "all" && handbookWasReset && labWasReset) {
      safeRemove(storage, LEGACY_PROGRESS_KEY);
    } else if (scope === "lab" && labWasReset) {
      // `commit` already rewrote only the expressible Lab fields and preserved
      // unrelated legacy data such as part2 for the retirement window.
      writeLegacy(result, storage);
    }
    return result;
  }

  function subscribeLearningState(listener: () => void): () => void {
    watchers.add(listener);
    if (watchers.size === 1) {
      listeningTarget = getEvents();
      listeningTarget?.addEventListener("storage", onStorage);
    }
    return () => {
      watchers.delete(listener);
      if (!watchers.size && listeningTarget) {
        listeningTarget.removeEventListener("storage", onStorage);
        listeningTarget = null;
      }
    };
  }

  return {
    readLearningState,
    subscribeLearningState,
    recordHandbookVisit,
    recordHandbookControlRoomFinish,
    recordLabStep,
    resetLearningState,
  };
}

const learningStore = createLearningStore();

export function readLearningState(): LearningStateV2 {
  return learningStore.readLearningState();
}

/** Static export and SSR have no browser-local learning record. */
export function readLearningStateOnServer(): LearningStateV2 {
  return EMPTY_LEARNING_STATE;
}

export function subscribeLearningState(listener: () => void): () => void {
  return learningStore.subscribeLearningState(listener);
}

export function recordHandbookVisit(section: HandbookSectionId): LearningStateV2 {
  return learningStore.recordHandbookVisit(section);
}

export function recordHandbookControlRoomFinish(score: number): LearningStateV2 {
  return learningStore.recordHandbookControlRoomFinish(score);
}

export function recordLabStep(step: LabStep, evidence?: LabStepEvidence): LearningStateV2 {
  return learningStore.recordLabStep(step, evidence);
}

export function resetLearningState(scope: ResetScope): LearningStateV2 {
  return learningStore.resetLearningState(scope);
}

/* --------------------------------------------------------------------------
 * One-release compatibility for the Lab branch.
 *
 * These functions expose a legacy-shaped VIEW of v2 so the existing Lab stays
 * buildable while its separate trust-controls branch moves to recordLabStep.
 * They never read ae.progress after migration, and unknown/part2 writes are
 * deliberately ignored.
 * ------------------------------------------------------------------------ */

function legacyView(state: LearningStateV2): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (state.lab.completedSteps.includes("first-call")) out.play0 = true;
  if (state.lab.completedSteps.includes("rules")) out.play1 = true;
  if (state.lab.completedSteps.includes("prompt-trial")) out.play2 = true;
  if (state.lab.evalBest !== undefined) out.evalBest = state.lab.evalBest;
  if (state.lab.evalBest !== undefined && state.lab.evalBest >= 16) out.play3 = true;
  return out;
}

export function subscribeProgress(listener: () => void): () => void {
  return subscribeLearningState(listener);
}

export function progressSnapshot(): string {
  return JSON.stringify(legacyView(readLearningState()));
}

export function progressOnServer(): string {
  return "{}";
}

export function readProgress(raw: string): Record<string, unknown> {
  return legacyObject(raw);
}

export function mark(key: string, value: unknown = true): void {
  if (key === "play0" && value === true) recordLabStep("first-call");
  else if (key === "play1" && value === true) recordLabStep("rules");
  else if (key === "play2" && value === true) recordLabStep("prompt-trial");
  else if (key === "evalBest" && isIntegerIn(value, 0, 20)) {
    recordLabStep("full-eval", { score: value });
  } else if (key === "play3" && value === true) {
    const state = readLearningState();
    if (!state.lab.completedSteps.includes("full-eval")) recordLabStep("full-eval");
  }
}
