import type { PersistenceResult } from "@/lib/public-progress-contract";
import { persistenceFailureReason } from "@/lib/progress-persistence";
import { GROK_TASK_CONTRACT_DRAFT_KEY } from "@/lib/progress-storage-contract";

const GROK_TASK_CONTRACT_DRAFT_EVENT = "aicourse:grok-task-contract-draft";

let memoryRaw: string | null = null;
let persistenceAvailable: boolean | null = null;
let failureReason: PersistenceResult["reason"];
let beforeUnloadGuardInstalled = false;

function warnBeforeUnload(event: BeforeUnloadEvent): void {
  event.preventDefault();
  event.returnValue = "";
}

function syncBeforeUnloadGuard(): void {
  if (typeof window === "undefined") return;
  const needed = memoryRaw !== null && persistenceAvailable === false;
  if (needed && !beforeUnloadGuardInstalled) {
    window.addEventListener("beforeunload", warnBeforeUnload);
    beforeUnloadGuardInstalled = true;
  } else if (!needed && beforeUnloadGuardInstalled) {
    window.removeEventListener("beforeunload", warnBeforeUnload);
    beforeUnloadGuardInstalled = false;
  }
}

function markFailure(error?: unknown): PersistenceResult {
  persistenceAvailable = false;
  failureReason = error === undefined
    ? failureReason ?? "unavailable"
    : persistenceFailureReason(error);
  syncBeforeUnloadGuard();
  return { persisted: false, reason: failureReason };
}

function announce(): void {
  window.dispatchEvent(new Event(GROK_TASK_CONTRACT_DRAFT_EVENT));
}

export function readGrokTaskContractSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  if (persistenceAvailable === false) return memoryRaw;
  try {
    const raw = window.sessionStorage.getItem(GROK_TASK_CONTRACT_DRAFT_KEY);
    memoryRaw = raw;
    persistenceAvailable = true;
    failureReason = undefined;
    syncBeforeUnloadGuard();
    return raw;
  } catch (error) {
    markFailure(error);
    return memoryRaw;
  }
}

export function subscribeToGrokTaskContract(callback: () => void): () => void {
  window.addEventListener(GROK_TASK_CONTRACT_DRAFT_EVENT, callback);
  return () => window.removeEventListener(GROK_TASK_CONTRACT_DRAFT_EVENT, callback);
}

export function grokTaskContractPersistenceAvailable(): boolean {
  if (typeof window === "undefined") return true;
  readGrokTaskContractSnapshot();
  return persistenceAvailable !== false;
}

/** Always writes memory first so a denied session store survives an SPA remount. */
export function writeGrokTaskContract(raw: string): PersistenceResult {
  memoryRaw = raw;
  if (typeof window === "undefined") return markFailure();
  try {
    window.sessionStorage.setItem(GROK_TASK_CONTRACT_DRAFT_KEY, raw);
    if (window.sessionStorage.getItem(GROK_TASK_CONTRACT_DRAFT_KEY) !== raw) {
      announce();
      return markFailure();
    }
    persistenceAvailable = true;
    failureReason = undefined;
    syncBeforeUnloadGuard();
    announce();
    return { persisted: true };
  } catch (error) {
    const failure = markFailure(error);
    announce();
    return failure;
  }
}

/** Clear memory only after the session copy is verifiably absent. */
export function clearGrokTaskContract(): PersistenceResult {
  if (typeof window === "undefined") return markFailure();
  try {
    window.sessionStorage.removeItem(GROK_TASK_CONTRACT_DRAFT_KEY);
    if (window.sessionStorage.getItem(GROK_TASK_CONTRACT_DRAFT_KEY) !== null) {
      announce();
      return markFailure();
    }
    memoryRaw = null;
    persistenceAvailable = true;
    failureReason = undefined;
    syncBeforeUnloadGuard();
    announce();
    return { persisted: true };
  } catch (error) {
    const failure = markFailure(error);
    announce();
    return failure;
  }
}
