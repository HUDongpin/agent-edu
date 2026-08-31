"use client";

import type { PersistenceResult } from "@/lib/public-progress-contract";
import { persistenceFailureReason } from "@/lib/progress-persistence";
import {
  MAKE_MONEY_WITH_CODEX_MARGIN_DRAFT_KEY,
  MAKE_MONEY_WITH_CODEX_OFFER_DRAFT_KEY,
  MAKE_MONEY_WITH_CODEX_QUIZ_ANSWERS_DRAFT_KEY,
  MAKE_MONEY_WITH_CODEX_SCORECARD_DRAFT_KEY,
  MAKE_MONEY_WITH_CODEX_SESSION_DRAFT_KEYS,
  MAKE_MONEY_WITH_CODEX_SESSION_DRAFT_PROBE_KEY,
  type MakeMoneyWithCodexSessionDraftKey,
} from "@/lib/make-money-session-draft-contract";

export const INCOME_SESSION_DRAFT_RESET_EVENT =
  "aicourse:make-money-with-codex-session-drafts-reset";

export type IncomeSessionDraftReadResult = {
  readonly raw: string | null;
  readonly persisted: boolean;
  readonly reason?: PersistenceResult["reason"];
};

type RuntimeState = {
  readonly memoryRawByKey: Map<MakeMoneyWithCodexSessionDraftKey, string>;
  readonly pendingMemoryKeys: Set<MakeMoneyWithCodexSessionDraftKey>;
  persistenceAvailable: boolean | null;
  failureReason: PersistenceResult["reason"];
};

const runtimeByWindow = new WeakMap<object, RuntimeState>();

function runtimeState(): RuntimeState {
  if (typeof window === "undefined") {
    return {
      memoryRawByKey: new Map(),
      pendingMemoryKeys: new Set(),
      persistenceAvailable: false,
      failureReason: "unavailable",
    };
  }
  const owner = window as unknown as object;
  const current = runtimeByWindow.get(owner);
  if (current) return current;
  const created: RuntimeState = {
    memoryRawByKey: new Map(),
    pendingMemoryKeys: new Set(),
    persistenceAvailable: null,
    failureReason: undefined,
  };
  runtimeByWindow.set(owner, created);
  return created;
}

function failed(
  state: RuntimeState,
  error?: unknown,
): PersistenceResult {
  state.persistenceAvailable = false;
  state.failureReason = error === undefined
    ? "unavailable"
    : persistenceFailureReason(error);
  return { persisted: false, reason: state.failureReason };
}

function markAvailable(state: RuntimeState): PersistenceResult {
  state.persistenceAvailable = true;
  state.failureReason = undefined;
  return { persisted: true };
}

/*
 * Deliberately explicit switches keep the browser calls statically auditable.
 * No caller can manufacture a fifth draft key and no operation derives a
 * probe from learner-controlled or component-provided input.
 */
function readOwnedDraft(key: MakeMoneyWithCodexSessionDraftKey): string | null {
  switch (key) {
    case MAKE_MONEY_WITH_CODEX_MARGIN_DRAFT_KEY:
      return window.sessionStorage.getItem(MAKE_MONEY_WITH_CODEX_MARGIN_DRAFT_KEY);
    case MAKE_MONEY_WITH_CODEX_QUIZ_ANSWERS_DRAFT_KEY:
      return window.sessionStorage.getItem(MAKE_MONEY_WITH_CODEX_QUIZ_ANSWERS_DRAFT_KEY);
    case MAKE_MONEY_WITH_CODEX_SCORECARD_DRAFT_KEY:
      return window.sessionStorage.getItem(MAKE_MONEY_WITH_CODEX_SCORECARD_DRAFT_KEY);
    case MAKE_MONEY_WITH_CODEX_OFFER_DRAFT_KEY:
      return window.sessionStorage.getItem(MAKE_MONEY_WITH_CODEX_OFFER_DRAFT_KEY);
  }
}

function writeOwnedDraft(
  key: MakeMoneyWithCodexSessionDraftKey,
  raw: string,
): void {
  switch (key) {
    case MAKE_MONEY_WITH_CODEX_MARGIN_DRAFT_KEY:
      window.sessionStorage.setItem(MAKE_MONEY_WITH_CODEX_MARGIN_DRAFT_KEY, raw);
      return;
    case MAKE_MONEY_WITH_CODEX_QUIZ_ANSWERS_DRAFT_KEY:
      window.sessionStorage.setItem(MAKE_MONEY_WITH_CODEX_QUIZ_ANSWERS_DRAFT_KEY, raw);
      return;
    case MAKE_MONEY_WITH_CODEX_SCORECARD_DRAFT_KEY:
      window.sessionStorage.setItem(MAKE_MONEY_WITH_CODEX_SCORECARD_DRAFT_KEY, raw);
      return;
    case MAKE_MONEY_WITH_CODEX_OFFER_DRAFT_KEY:
      window.sessionStorage.setItem(MAKE_MONEY_WITH_CODEX_OFFER_DRAFT_KEY, raw);
  }
}

function removeOwnedDraft(key: MakeMoneyWithCodexSessionDraftKey): void {
  switch (key) {
    case MAKE_MONEY_WITH_CODEX_MARGIN_DRAFT_KEY:
      window.sessionStorage.removeItem(MAKE_MONEY_WITH_CODEX_MARGIN_DRAFT_KEY);
      return;
    case MAKE_MONEY_WITH_CODEX_QUIZ_ANSWERS_DRAFT_KEY:
      window.sessionStorage.removeItem(MAKE_MONEY_WITH_CODEX_QUIZ_ANSWERS_DRAFT_KEY);
      return;
    case MAKE_MONEY_WITH_CODEX_SCORECARD_DRAFT_KEY:
      window.sessionStorage.removeItem(MAKE_MONEY_WITH_CODEX_SCORECARD_DRAFT_KEY);
      return;
    case MAKE_MONEY_WITH_CODEX_OFFER_DRAFT_KEY:
      window.sessionStorage.removeItem(MAKE_MONEY_WITH_CODEX_OFFER_DRAFT_KEY);
  }
}

export function readIncomeSessionDraft(
  key: MakeMoneyWithCodexSessionDraftKey,
): IncomeSessionDraftReadResult {
  if (typeof window === "undefined") {
    return { raw: null, persisted: false, reason: "unavailable" };
  }
  const state = runtimeState();
  if (state.pendingMemoryKeys.has(key)) {
    return {
      raw: state.memoryRawByKey.get(key) ?? null,
      persisted: false,
      reason: state.failureReason ?? "unavailable",
    };
  }
  try {
    const raw = readOwnedDraft(key);
    if (raw === null) state.memoryRawByKey.delete(key);
    else state.memoryRawByKey.set(key, raw);
    return { raw, persisted: true };
  } catch (error) {
    const result = failed(state, error);
    return {
      raw: state.memoryRawByKey.get(key) ?? null,
      persisted: false,
      reason: result.reason,
    };
  }
}

/** Memory is updated first so a denied write survives an internal navigation. */
export function writeIncomeSessionDraft(
  key: MakeMoneyWithCodexSessionDraftKey,
  raw: string,
): PersistenceResult {
  const state = runtimeState();
  state.memoryRawByKey.set(key, raw);
  if (typeof window === "undefined") return failed(state);
  try {
    writeOwnedDraft(key, raw);
    if (readOwnedDraft(key) !== raw) {
      state.pendingMemoryKeys.add(key);
      return failed(state);
    }
    state.pendingMemoryKeys.delete(key);
    return markAvailable(state);
  } catch (error) {
    state.pendingMemoryKeys.add(key);
    return failed(state, error);
  }
}

/** Memory is cleared only after the owned session record is verifiably absent. */
export function clearIncomeSessionDraft(
  key: MakeMoneyWithCodexSessionDraftKey,
): PersistenceResult {
  const state = runtimeState();
  if (typeof window === "undefined") return failed(state);
  try {
    removeOwnedDraft(key);
    if (readOwnedDraft(key) !== null) {
      state.pendingMemoryKeys.add(key);
      return failed(state);
    }
    state.memoryRawByKey.delete(key);
    state.pendingMemoryKeys.delete(key);
    return markAvailable(state);
  } catch (error) {
    return failed(state, error);
  }
}

/**
 * A single fixed probe verifies remove, write, read-back, and final cleanup.
 * Removing first prevents a stale matching value from masking a silent write.
 */
export function isIncomeSessionDraftStorageAvailable(): boolean {
  if (typeof window === "undefined") return true;
  const state = runtimeState();
  try {
    window.sessionStorage.removeItem(MAKE_MONEY_WITH_CODEX_SESSION_DRAFT_PROBE_KEY);
    if (window.sessionStorage.getItem(MAKE_MONEY_WITH_CODEX_SESSION_DRAFT_PROBE_KEY) !== null) {
      failed(state);
      return false;
    }
    window.sessionStorage.setItem(
      MAKE_MONEY_WITH_CODEX_SESSION_DRAFT_PROBE_KEY,
      "course11-session-draft-probe",
    );
    if (window.sessionStorage.getItem(MAKE_MONEY_WITH_CODEX_SESSION_DRAFT_PROBE_KEY)
      !== "course11-session-draft-probe") {
      failed(state);
      return false;
    }
    window.sessionStorage.removeItem(MAKE_MONEY_WITH_CODEX_SESSION_DRAFT_PROBE_KEY);
    if (window.sessionStorage.getItem(MAKE_MONEY_WITH_CODEX_SESSION_DRAFT_PROBE_KEY) !== null) {
      failed(state);
      return false;
    }
    markAvailable(state);
    return true;
  } catch (error) {
    failed(state, error);
    return false;
  }
}

/**
 * Course-specific and global progress resets call this exact-key routine.
 * Every owned key is attempted and verified; unrelated sessionStorage entries
 * are neither enumerated nor cleared.
 */
export function resetIncomeSessionDraftsAfterProgressReset(): PersistenceResult {
  if (typeof window === "undefined") {
    return failed(runtimeState());
  }
  const state = runtimeState();
  let firstFailure: PersistenceResult | null = null;

  for (const key of MAKE_MONEY_WITH_CODEX_SESSION_DRAFT_KEYS) {
    try {
      removeOwnedDraft(key);
      if (readOwnedDraft(key) !== null) {
        firstFailure ??= failed(state);
      } else {
        state.memoryRawByKey.delete(key);
        state.pendingMemoryKeys.delete(key);
      }
    } catch (error) {
      firstFailure ??= failed(state, error);
    }
  }

  try {
    window.sessionStorage.removeItem(MAKE_MONEY_WITH_CODEX_SESSION_DRAFT_PROBE_KEY);
    if (window.sessionStorage.getItem(MAKE_MONEY_WITH_CODEX_SESSION_DRAFT_PROBE_KEY) !== null) {
      firstFailure ??= failed(state);
    }
  } catch (error) {
    firstFailure ??= failed(state, error);
  }

  if (firstFailure) {
    state.persistenceAvailable = false;
    state.failureReason = firstFailure.reason ?? "unavailable";
  } else {
    markAvailable(state);
  }
  window.dispatchEvent(new Event(INCOME_SESSION_DRAFT_RESET_EVENT));
  return firstFailure ?? { persisted: true };
}

export function subscribeToIncomeSessionDraftReset(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(INCOME_SESSION_DRAFT_RESET_EVENT, listener);
  return () => window.removeEventListener(INCOME_SESSION_DRAFT_RESET_EVENT, listener);
}
