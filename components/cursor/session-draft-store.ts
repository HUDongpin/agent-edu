"use client";

import type { PersistenceResult } from "@/lib/public-progress-contract";
import { persistenceFailureReason } from "@/lib/progress-persistence";
import {
  CURSOR_CAPSTONE_DRAFT_STORAGE_KEY,
  CURSOR_CAPSTONE_RECEIPT_MEMORY_KEY,
  CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY,
  CURSOR_PERSISTED_SESSION_DRAFT_KEYS,
  CURSOR_SESSION_DRAFT_PROBE_KEY,
  CURSOR_SESSION_OWNED_KEYS,
  type CursorPersistedSessionDraftKey,
  type CursorSessionOwnedKey,
} from "@/lib/progress-storage-contract";

export {
  CURSOR_CAPSTONE_DRAFT_STORAGE_KEY,
  CURSOR_CAPSTONE_RECEIPT_MEMORY_KEY,
  CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY,
  CURSOR_SESSION_DRAFT_PROBE_KEY,
};

type SessionDraftValidator<T> = (value: unknown) => value is T;

type CursorFinalQuizSessionDraftBase = {
  readonly schemaVersion: 2;
  readonly bankVersion: string;
  readonly questionIds: readonly string[];
  readonly checkedAnswers: Readonly<Record<string, string>>;
};

export type CursorFinalQuizSessionDraft = CursorFinalQuizSessionDraftBase & (
  | {
      readonly phase: "answering";
      readonly questionIndex: number;
      readonly selectedOptionId: string | null;
    }
  | { readonly phase: "failed-review" }
);

export type CursorCapstoneSessionDraft = {
  readonly schemaVersion: 1;
  readonly receiptSchema: string;
  readonly receiptVersion: string;
  readonly fixtureVersion: string;
  readonly fixtureSha256: string;
  readonly archiveSha256: string;
  readonly artifactIds: readonly string[];
  readonly rubricIds: readonly string[];
};

type CursorSessionDraftByKey = {
  readonly [CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY]: CursorFinalQuizSessionDraft;
  readonly [CURSOR_CAPSTONE_DRAFT_STORAGE_KEY]: CursorCapstoneSessionDraft;
};

export const CURSOR_ASSESSMENT_DRAFT_RESET_EVENT = "ae:cursor-assessment-drafts-reset";
export const CURSOR_ASSESSMENT_DRAFT_CHANGE_EVENT = "ae:cursor-assessment-drafts-change";

type RuntimeState = {
  readonly memoryDrafts: Map<CursorSessionOwnedKey, unknown>;
  readonly pendingSync: Set<CursorPersistedSessionDraftKey>;
  readonly pendingClear: Set<CursorSessionOwnedKey>;
  persistenceAvailable: boolean | null;
  failureReason: PersistenceResult["reason"];
};

const runtimeByWindow = new WeakMap<object, RuntimeState>();

function createRuntimeState(): RuntimeState {
  return {
    memoryDrafts: new Map(),
    pendingSync: new Set(),
    pendingClear: new Set(),
    persistenceAvailable: null,
    failureReason: undefined,
  };
}

function runtimeState(): RuntimeState {
  if (typeof window === "undefined") return createRuntimeState();
  const owner = window as unknown as object;
  const current = runtimeByWindow.get(owner);
  if (current) return current;
  const created = createRuntimeState();
  runtimeByWindow.set(owner, created);
  return created;
}

function failure(state: RuntimeState, error?: unknown): PersistenceResult {
  state.persistenceAvailable = false;
  state.failureReason = error === undefined
    ? "unavailable"
    : persistenceFailureReason(error);
  return { persisted: false, reason: state.failureReason };
}

function operationSucceeded(state: RuntimeState): PersistenceResult {
  if (state.pendingSync.size === 0 && state.pendingClear.size === 0) {
    state.persistenceAvailable = true;
    state.failureReason = undefined;
  } else {
    state.persistenceAvailable = false;
  }
  return { persisted: true };
}

/* Explicit switches make every browser operation statically auditable. */
function readOwnedPersistedDraft(key: CursorPersistedSessionDraftKey): string | null {
  switch (key) {
    case CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY:
      return window.sessionStorage.getItem(CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY);
    case CURSOR_CAPSTONE_DRAFT_STORAGE_KEY:
      return window.sessionStorage.getItem(CURSOR_CAPSTONE_DRAFT_STORAGE_KEY);
  }
}

function writeOwnedPersistedDraft(
  key: CursorPersistedSessionDraftKey,
  raw: string,
): void {
  switch (key) {
    case CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY:
      window.sessionStorage.setItem(CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY, raw);
      return;
    case CURSOR_CAPSTONE_DRAFT_STORAGE_KEY:
      window.sessionStorage.setItem(CURSOR_CAPSTONE_DRAFT_STORAGE_KEY, raw);
  }
}

function readOwnedDraft(key: CursorSessionOwnedKey): string | null {
  switch (key) {
    case CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY:
      return window.sessionStorage.getItem(CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY);
    case CURSOR_CAPSTONE_DRAFT_STORAGE_KEY:
      return window.sessionStorage.getItem(CURSOR_CAPSTONE_DRAFT_STORAGE_KEY);
    case CURSOR_CAPSTONE_RECEIPT_MEMORY_KEY:
      return window.sessionStorage.getItem(CURSOR_CAPSTONE_RECEIPT_MEMORY_KEY);
  }
}

function removeOwnedDraft(key: CursorSessionOwnedKey): void {
  switch (key) {
    case CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY:
      window.sessionStorage.removeItem(CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY);
      return;
    case CURSOR_CAPSTONE_DRAFT_STORAGE_KEY:
      window.sessionStorage.removeItem(CURSOR_CAPSTONE_DRAFT_STORAGE_KEY);
      return;
    case CURSOR_CAPSTONE_RECEIPT_MEMORY_KEY:
      window.sessionStorage.removeItem(CURSOR_CAPSTONE_RECEIPT_MEMORY_KEY);
  }
}

/**
 * Fixed capability probe covering initial cleanup, write/read-back, and final
 * cleanup. A stale marker and every silent no-op therefore fail closed.
 */
function probeSessionDraftStorage(state: RuntimeState): PersistenceResult {
  if (typeof window === "undefined") return failure(state);
  try {
    window.sessionStorage.removeItem(CURSOR_SESSION_DRAFT_PROBE_KEY);
    if (window.sessionStorage.getItem(CURSOR_SESSION_DRAFT_PROBE_KEY) !== null) {
      return failure(state);
    }
    window.sessionStorage.setItem(
      CURSOR_SESSION_DRAFT_PROBE_KEY,
      "course4-session-draft-probe",
    );
    if (window.sessionStorage.getItem(CURSOR_SESSION_DRAFT_PROBE_KEY)
      !== "course4-session-draft-probe") {
      return failure(state);
    }
    window.sessionStorage.removeItem(CURSOR_SESSION_DRAFT_PROBE_KEY);
    if (window.sessionStorage.getItem(CURSOR_SESSION_DRAFT_PROBE_KEY) !== null) {
      return failure(state);
    }
    return operationSucceeded(state);
  } catch (error) {
    return failure(state, error);
  }
}

function hasDrafts(state: RuntimeState): boolean {
  if (CURSOR_SESSION_OWNED_KEYS.some((key) => state.memoryDrafts.has(key))) return true;
  if (typeof window === "undefined") return false;
  try {
    return CURSOR_SESSION_OWNED_KEYS.some((key) => readOwnedDraft(key) !== null);
  } catch {
    return false;
  }
}

export function hasCursorAssessmentDrafts(): boolean {
  return hasDrafts(runtimeState());
}

function notifyDraftPresenceChange(previous: boolean, state: RuntimeState): void {
  if (typeof window !== "undefined" && previous !== hasDrafts(state)) {
    window.dispatchEvent(new Event(CURSOR_ASSESSMENT_DRAFT_CHANGE_EVENT));
  }
}

export function subscribeToCursorAssessmentDrafts(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(CURSOR_ASSESSMENT_DRAFT_CHANGE_EVENT, listener);
  return () => window.removeEventListener(CURSOR_ASSESSMENT_DRAFT_CHANGE_EVENT, listener);
}

export function readSessionDraft<T>(
  storageKey: CursorPersistedSessionDraftKey,
  validate: SessionDraftValidator<T>,
): T | null {
  if (typeof window === "undefined") return null;
  const state = runtimeState();
  const memoryDraft = state.memoryDrafts.get(storageKey);
  if (state.pendingSync.has(storageKey) || state.pendingClear.has(storageKey)) {
    return validate(memoryDraft) ? memoryDraft : null;
  }
  const previouslyPresent = hasDrafts(state);

  let raw: string | null;
  try {
    raw = readOwnedPersistedDraft(storageKey);
  } catch (error) {
    failure(state, error);
    return validate(memoryDraft) ? memoryDraft : null;
  }

  if (raw !== null) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (validate(parsed)) {
        state.memoryDrafts.set(storageKey, parsed);
        state.pendingSync.delete(storageKey);
        operationSucceeded(state);
        return parsed;
      }
    } catch {
      // Invalid JSON and invalid exact-schema records share the same cleanup.
    }
  } else {
    state.memoryDrafts.delete(storageKey);
    operationSucceeded(state);
    notifyDraftPresenceChange(previouslyPresent, state);
    return null;
  }

  state.pendingClear.add(storageKey);
  try {
    removeOwnedDraft(storageKey);
    if (readOwnedDraft(storageKey) !== null) {
      failure(state);
      return null;
    }
    state.memoryDrafts.delete(storageKey);
    state.pendingClear.delete(storageKey);
    state.pendingSync.delete(storageKey);
    operationSucceeded(state);
  } catch (error) {
    failure(state, error);
  }
  notifyDraftPresenceChange(previouslyPresent, state);
  return null;
}

/** Memory is updated first so a denied write survives App Router navigation. */
export function writeSessionDraft<Key extends CursorPersistedSessionDraftKey>(
  storageKey: Key,
  value: CursorSessionDraftByKey[Key],
): PersistenceResult {
  const state = runtimeState();
  const previouslyPresent = hasDrafts(state);
  state.memoryDrafts.set(storageKey, value);
  state.pendingSync.add(storageKey);
  state.pendingClear.delete(storageKey);
  if (typeof window === "undefined") return failure(state);

  try {
    const raw = JSON.stringify(value);
    writeOwnedPersistedDraft(storageKey, raw);
    if (readOwnedPersistedDraft(storageKey) !== raw) {
      const result = failure(state);
      notifyDraftPresenceChange(previouslyPresent, state);
      return result;
    }
    state.pendingSync.delete(storageKey);
    const result = operationSucceeded(state);
    notifyDraftPresenceChange(previouslyPresent, state);
    return result;
  } catch (error) {
    const result = failure(state, error);
    notifyDraftPresenceChange(previouslyPresent, state);
    return result;
  }
}

/** Memory is cleared only after the exact browser record is verifiably absent. */
export function clearSessionDraft(
  storageKey: CursorPersistedSessionDraftKey,
): PersistenceResult {
  const state = runtimeState();
  const previouslyPresent = hasDrafts(state);
  if (typeof window === "undefined") return failure(state);
  const probe = probeSessionDraftStorage(state);
  if (!probe.persisted) return probe;
  state.pendingClear.add(storageKey);

  try {
    removeOwnedDraft(storageKey);
    if (readOwnedDraft(storageKey) !== null) return failure(state);
    state.memoryDrafts.delete(storageKey);
    state.pendingClear.delete(storageKey);
    state.pendingSync.delete(storageKey);
    const result = operationSucceeded(state);
    notifyDraftPresenceChange(previouslyPresent, state);
    return result;
  } catch (error) {
    return failure(state, error);
  }
}

/** Receipt text is deliberately module-memory-only and never reaches storage. */
export function readMemoryDraft(
  storageKey: typeof CURSOR_CAPSTONE_RECEIPT_MEMORY_KEY,
): string | null {
  const value = runtimeState().memoryDrafts.get(storageKey);
  return typeof value === "string" ? value : null;
}

export function writeMemoryDraft(
  storageKey: typeof CURSOR_CAPSTONE_RECEIPT_MEMORY_KEY,
  value: string,
): void {
  const state = runtimeState();
  const previouslyPresent = hasDrafts(state);
  state.memoryDrafts.set(storageKey, value);
  notifyDraftPresenceChange(previouslyPresent, state);
}

export function clearMemoryDraft(
  storageKey: typeof CURSOR_CAPSTONE_RECEIPT_MEMORY_KEY,
): void {
  const state = runtimeState();
  const previouslyPresent = hasDrafts(state);
  state.memoryDrafts.delete(storageKey);
  notifyDraftPresenceChange(previouslyPresent, state);
}

export function isCursorSessionDraftStorageAvailable(): boolean {
  if (typeof window === "undefined") return true;
  const state = runtimeState();
  if (state.pendingSync.size > 0 || state.pendingClear.size > 0) return false;
  return probeSessionDraftStorage(state).persisted;
}

/**
 * Course/global reset owns only the three fixed Course 4 keys and its probe.
 * Memory copies remain until every removal verifies, keeping a partial reset
 * visible and retryable without enumerating or clearing unrelated tab state.
 */
export function clearCursorAssessmentDrafts(): PersistenceResult {
  const state = runtimeState();
  const previouslyPresent = hasDrafts(state);
  if (typeof window === "undefined") return failure(state);
  const probe = probeSessionDraftStorage(state);
  if (!probe.persisted) return probe;

  for (const key of CURSOR_PERSISTED_SESSION_DRAFT_KEYS) {
    if (state.memoryDrafts.has(key)) continue;
    try {
      const raw = readOwnedPersistedDraft(key);
      if (raw !== null) {
        try {
          state.memoryDrafts.set(key, JSON.parse(raw) as unknown);
        } catch {
          // A corrupt draft is never hydrated, but reset must still remove it.
        }
      }
    } catch (error) {
      return failure(state, error);
    }
  }
  for (const key of CURSOR_SESSION_OWNED_KEYS) state.pendingClear.add(key);

  let firstFailure: PersistenceResult | null = null;
  for (const key of CURSOR_SESSION_OWNED_KEYS) {
    try {
      removeOwnedDraft(key);
      if (readOwnedDraft(key) !== null) firstFailure ??= failure(state);
    } catch (error) {
      firstFailure ??= failure(state, error);
    }
  }
  try {
    window.sessionStorage.removeItem(CURSOR_SESSION_DRAFT_PROBE_KEY);
    if (window.sessionStorage.getItem(CURSOR_SESSION_DRAFT_PROBE_KEY) !== null) {
      firstFailure ??= failure(state);
    }
  } catch (error) {
    firstFailure ??= failure(state, error);
  }

  if (firstFailure) {
    state.persistenceAvailable = false;
    state.failureReason = firstFailure.reason ?? "unavailable";
    notifyDraftPresenceChange(previouslyPresent, state);
    return firstFailure;
  }

  for (const key of CURSOR_SESSION_OWNED_KEYS) {
    state.memoryDrafts.delete(key);
    state.pendingClear.delete(key);
  }
  state.pendingSync.clear();
  operationSucceeded(state);
  notifyDraftPresenceChange(previouslyPresent, state);
  window.dispatchEvent(new Event(CURSOR_ASSESSMENT_DRAFT_RESET_EVENT));
  return { persisted: true };
}
