"use client";

import { AGENTIC_TEACHING_PROGRESS_EVENT } from "@/lib/ai-teaching/progress";
import {
  failedPersistence,
  persistenceFailureReason,
  successfulPersistence,
  verifySharedProgressReset,
} from "@/lib/progress-persistence";
import {
  AI_TEACHING_CORRUPT_PROGRESS_BACKUP_KEY,
  AI_TEACHING_PROGRESS_PROBE_KEY,
} from "@/lib/progress-storage-contract";
import type { PersistenceResult } from "@/lib/public-progress-contract";
import { PROG } from "@/lib/progress-storage-key";

export const AI_TEACHING_PROGRESS_STORAGE_KEY = PROG;
export const AI_TEACHING_PROGRESS_PREFIX = "agenticTeaching." as const;
export const AI_TEACHING_PROGRESS_RESET_EVENT =
  "ai-teaching:progress-reset" as const;

type ProgressRecord = Record<string, unknown>;

const EMPTY_SNAPSHOT = "{}";
let memorySnapshot = EMPTY_SNAPSHOT;
let persistenceResult: PersistenceResult | null = null;
let activeRaw: string | null = null;
const subscribers = new Set<() => void>();
let listenersAttached = false;

function isPlainRecord(value: unknown): value is ProgressRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function parseRecord(raw: string): ProgressRecord | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    return isPlainRecord(parsed) ? { ...parsed } : null;
  } catch {
    return null;
  }
}

function publish(record: ProgressRecord): void {
  memorySnapshot = JSON.stringify(record);
  for (const subscriber of subscribers) subscriber();
}

function preserveCorruptCopy(raw: string): boolean {
  try {
    const existing = window.sessionStorage.getItem(
      AI_TEACHING_CORRUPT_PROGRESS_BACKUP_KEY,
    );
    if (existing !== null && existing !== raw) return false;
    if (existing === null) {
      window.sessionStorage.setItem(AI_TEACHING_CORRUPT_PROGRESS_BACKUP_KEY, raw);
    }
    return window.sessionStorage.getItem(AI_TEACHING_CORRUPT_PROGRESS_BACKUP_KEY)
      === raw;
  } catch {
    return false;
  }
}

function markCorrupt(raw: string): PersistenceResult {
  activeRaw = raw;
  publish({});
  persistenceResult = {
    persisted: false,
    reason: "corrupt",
    ...(preserveCorruptCopy(raw) ? { quarantined: true } : {}),
  };
  return persistenceResult;
}

function verifyCapability(): PersistenceResult {
  let previous: string | null = null;
  try {
    previous = window.localStorage.getItem(AI_TEACHING_PROGRESS_PROBE_KEY);
    window.localStorage.setItem(AI_TEACHING_PROGRESS_PROBE_KEY, "1");
    if (window.localStorage.getItem(AI_TEACHING_PROGRESS_PROBE_KEY) !== "1") {
      return failedPersistence("unavailable");
    }
    if (previous === null) window.localStorage.removeItem(AI_TEACHING_PROGRESS_PROBE_KEY);
    else window.localStorage.setItem(AI_TEACHING_PROGRESS_PROBE_KEY, previous);
    return window.localStorage.getItem(AI_TEACHING_PROGRESS_PROBE_KEY) === previous
      ? successfulPersistence()
      : failedPersistence("unavailable");
  } catch (error) {
    try {
      if (previous === null) window.localStorage.removeItem(AI_TEACHING_PROGRESS_PROBE_KEY);
      else window.localStorage.setItem(AI_TEACHING_PROGRESS_PROBE_KEY, previous);
    } catch {
      // The classified failure below remains authoritative.
    }
    return failedPersistence(persistenceFailureReason(error));
  }
}

function load(): ProgressRecord {
  if (typeof window === "undefined") return parseRecord(memorySnapshot) ?? {};
  try {
    const capability = verifyCapability();
    if (!capability.persisted) {
      persistenceResult = capability;
      return parseRecord(memorySnapshot) ?? {};
    }
    const raw = window.localStorage.getItem(AI_TEACHING_PROGRESS_STORAGE_KEY);
    activeRaw = raw;
    const record = raw === null ? {} : parseRecord(raw);
    if (!record) {
      markCorrupt(raw ?? "");
      return {};
    }
    persistenceResult = successfulPersistence();
    publish(record);
    return { ...record };
  } catch (error) {
    persistenceResult = failedPersistence(persistenceFailureReason(error));
    return parseRecord(memorySnapshot) ?? {};
  }
}

function dispatch(eventName: string, result: PersistenceResult): void {
  if (typeof window === "undefined") return;
  if (eventName === AGENTIC_TEACHING_PROGRESS_EVENT) {
    window.dispatchEvent(new CustomEvent(AGENTIC_TEACHING_PROGRESS_EVENT, {
      detail: result,
    }));
  } else {
    window.dispatchEvent(new CustomEvent(eventName, { detail: result }));
  }
}

function write(record: ProgressRecord): PersistenceResult {
  publish(record);
  if (typeof window === "undefined") {
    persistenceResult = failedPersistence("unavailable");
    return persistenceResult;
  }
  if (persistenceResult?.reason === "corrupt") {
    dispatch(AGENTIC_TEACHING_PROGRESS_EVENT, persistenceResult);
    return persistenceResult;
  }
  const serialized = JSON.stringify(record);
  try {
    const beforeWrite = window.localStorage.getItem(AI_TEACHING_PROGRESS_STORAGE_KEY);
    if (beforeWrite !== activeRaw) {
      persistenceResult = failedPersistence("unavailable");
      dispatch(AGENTIC_TEACHING_PROGRESS_EVENT, persistenceResult);
      return persistenceResult;
    }
    if (beforeWrite !== null && !parseRecord(beforeWrite)) {
      const result = markCorrupt(beforeWrite);
      dispatch(AGENTIC_TEACHING_PROGRESS_EVENT, result);
      return result;
    }
    window.localStorage.setItem(AI_TEACHING_PROGRESS_STORAGE_KEY, serialized);
    if (window.localStorage.getItem(AI_TEACHING_PROGRESS_STORAGE_KEY) !== serialized) {
      persistenceResult = failedPersistence("unavailable");
    } else {
      activeRaw = serialized;
      persistenceResult = successfulPersistence();
    }
  } catch (error) {
    persistenceResult = failedPersistence(persistenceFailureReason(error));
  }
  dispatch(AGENTIC_TEACHING_PROGRESS_EVENT, persistenceResult);
  return persistenceResult;
}

export function readAiTeachingProgress(): ProgressRecord {
  return load();
}

export function markAiTeachingProgress(key: string, value: unknown = true): PersistenceResult {
  if (!key.startsWith(AI_TEACHING_PROGRESS_PREFIX)) {
    return failedPersistence("unavailable");
  }
  const record = load();
  record[key] = value;
  return write(record);
}

export function isAiTeachingProgressPersistenceAvailable(): boolean {
  load();
  return persistenceResult?.persisted === true;
}

export function aiTeachingProgressSnapshot(): string {
  load();
  return memorySnapshot;
}

export function aiTeachingProgressOnServer(): string {
  return EMPTY_SNAPSHOT;
}

function onStorage(event: StorageEvent): void {
  if (
    event.storageArea === window.localStorage
    && (event.key === AI_TEACHING_PROGRESS_STORAGE_KEY || event.key === null)
  ) {
    persistenceResult = null;
    load();
  }
}

function onProgressEvent(): void {
  load();
}

function attachListeners(): void {
  if (listenersAttached || typeof window === "undefined") return;
  window.addEventListener("storage", onStorage);
  window.addEventListener(AGENTIC_TEACHING_PROGRESS_EVENT, onProgressEvent);
  listenersAttached = true;
}

function detachListeners(): void {
  if (!listenersAttached || typeof window === "undefined") return;
  window.removeEventListener("storage", onStorage);
  window.removeEventListener(AGENTIC_TEACHING_PROGRESS_EVENT, onProgressEvent);
  listenersAttached = false;
}

export function subscribeAiTeachingProgress(listener: () => void): () => void {
  subscribers.add(listener);
  attachListeners();
  return () => {
    subscribers.delete(listener);
    if (subscribers.size === 0) detachListeners();
  };
}

export function resetAiTeachingProgress(): PersistenceResult {
  const record = load();
  for (const key of Object.keys(record)) {
    if (key.startsWith(AI_TEACHING_PROGRESS_PREFIX)) delete record[key];
  }
  const result = write(record);
  dispatch(AI_TEACHING_PROGRESS_RESET_EVENT, result);
  return result;
}

export function resetAiTeachingProgressAfterGlobalReset(): PersistenceResult {
  publish({});
  if (typeof window === "undefined") return failedPersistence("unavailable");
  const result = verifySharedProgressReset(
    window.localStorage,
    AI_TEACHING_PROGRESS_STORAGE_KEY,
  );
  persistenceResult = result;
  activeRaw = result.persisted ? null : window.localStorage.getItem(AI_TEACHING_PROGRESS_STORAGE_KEY);
  dispatch(AGENTIC_TEACHING_PROGRESS_EVENT, result);
  dispatch(AI_TEACHING_PROGRESS_RESET_EVENT, result);
  return result;
}
