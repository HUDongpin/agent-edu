import {
  AGENT_ORCHESTRATION_PROGRESS_EVENT,
  AGENT_ORCHESTRATION_PROGRESS_MIGRATION_NOTICE_KEY,
  AGENT_ORCHESTRATION_PROGRESS_RECOVERY_ENVELOPE_KEY,
  AGENT_ORCHESTRATION_PROGRESS_RESET_EVENT,
  AGENT_ORCHESTRATION_PROGRESS_SCHEMA,
  migrateAgentOrchestrationProgressRecord,
  readAgentOrchestrationProgressRecoveryEnvelope,
  type AgentOrchestrationProgressMigrationNotice,
  type AgentOrchestrationProgressRecoveryEnvelope,
} from "@/lib/progress-topology";
import type { PersistenceResult } from "@/lib/public-progress-contract";
import {
  failedPersistence,
  persistenceFailureReason,
  successfulPersistence,
  verifySharedProgressReset,
} from "@/lib/progress-persistence";
import {
  AGENT_ORCHESTRATION_CORRUPT_PROGRESS_BACKUP_KEY,
  AGENT_ORCHESTRATION_PROGRESS_PROBE_KEY,
} from "@/lib/progress-storage-contract";

const AGENT_ORCHESTRATION_PROGRESS_PREFIX =
  AGENT_ORCHESTRATION_PROGRESS_SCHEMA.prefix;
const AGENT_ORCHESTRATION_PROGRESS_VERSION =
  AGENT_ORCHESTRATION_PROGRESS_SCHEMA.version;
const AGENT_ORCHESTRATION_PROGRESS_VERSION_KEY =
  AGENT_ORCHESTRATION_PROGRESS_SCHEMA.versionKey;

export const AGENT_ORCHESTRATION_PROGRESS_STORAGE_KEY = "ae.progress";
export type AgentOrchestrationProgressRecord = Record<string, unknown>;
export type AgentOrchestrationStorageStatus =
  | "checking"
  | "available"
  | "unavailable"
  | "corrupt"
  | "quota-exceeded";

export interface AgentOrchestrationProgressSnapshot {
  readonly status: AgentOrchestrationStorageStatus;
  readonly record: Readonly<AgentOrchestrationProgressRecord>;
  readonly migrationNotice: AgentOrchestrationProgressMigrationNotice | null;
}

export interface AgentOrchestrationRecoveryExport {
  readonly status: AgentOrchestrationStorageStatus;
  readonly activeRaw: string | null;
  readonly sessionBackupRaw: string | null;
  readonly migrationNotice: AgentOrchestrationProgressMigrationNotice | null;
  readonly recoveryEnvelope: AgentOrchestrationProgressRecoveryEnvelope | null;
  readonly pendingRecord: Readonly<AgentOrchestrationProgressRecord> | null;
  readonly exportText: string | null;
}

const SERVER_PROGRESS_RECORD = Object.freeze({}) as Readonly<
  AgentOrchestrationProgressRecord
>;

export const SERVER_AGENT_ORCHESTRATION_PROGRESS_SNAPSHOT = Object.freeze({
  status: "checking",
  record: SERVER_PROGRESS_RECORD,
  migrationNotice: null,
}) satisfies AgentOrchestrationProgressSnapshot;

let progressSnapshot: AgentOrchestrationProgressSnapshot =
  SERVER_AGENT_ORCHESTRATION_PROGRESS_SNAPSHOT;
let initialized = false;
let writeCapabilityChecked = false;
let activeRaw: string | null = null;
let hasReadActiveRaw = false;
let pendingRecord: Readonly<AgentOrchestrationProgressRecord> | null = null;
let pendingBaseRaw: string | null = null;
let currentStorage: Storage | null = null;
let blockedGlobalResetRaw: string | null | undefined;
const subscribers = new Set<() => void>();
let browserListenersAttached = false;
let dispatchingInternalEvent = false;

function isProgressObject(value: unknown): value is AgentOrchestrationProgressRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function storageStatusForResult(
  result: PersistenceResult,
): Exclude<AgentOrchestrationStorageStatus, "checking" | "available"> {
  if (result.reason === "corrupt") return "corrupt";
  if (result.reason === "quota") return "quota-exceeded";
  return "unavailable";
}

function resultForStatus(status: AgentOrchestrationStorageStatus): PersistenceResult {
  if (status === "available") return successfulPersistence();
  if (status === "corrupt") return failedPersistence("corrupt");
  if (status === "quota-exceeded") return failedPersistence("quota");
  return failedPersistence("unavailable");
}

function freezeNotice(
  notice: AgentOrchestrationProgressMigrationNotice | null,
): AgentOrchestrationProgressMigrationNotice | null {
  if (!notice) return null;
  return Object.freeze({
    ...notice,
    preservedKeys: Object.freeze([...notice.preservedKeys]),
    invalidatedKeys: Object.freeze([...notice.invalidatedKeys]),
    recoveryKeys: Object.freeze([...notice.recoveryKeys]),
  });
}

function immutableRecord(
  record: AgentOrchestrationProgressRecord,
  notice: AgentOrchestrationProgressMigrationNotice | null,
): Readonly<AgentOrchestrationProgressRecord> {
  const next = { ...record };
  if (notice) next[AGENT_ORCHESTRATION_PROGRESS_MIGRATION_NOTICE_KEY] = notice;
  return Object.freeze(next);
}

function publishSnapshot(
  status: AgentOrchestrationStorageStatus,
  record: AgentOrchestrationProgressRecord | Readonly<AgentOrchestrationProgressRecord>,
  notice: AgentOrchestrationProgressMigrationNotice | null,
): void {
  const frozenNotice = freezeNotice(notice);
  progressSnapshot = Object.freeze({
    status,
    record: immutableRecord({ ...record }, frozenNotice),
    migrationNotice: frozenNotice,
  });
  for (const subscriber of subscribers) subscriber();
}

function preserveCorruptSessionCopy(raw: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const storage = window.sessionStorage;
    const existing = storage.getItem(
      AGENT_ORCHESTRATION_CORRUPT_PROGRESS_BACKUP_KEY,
    );
    if (existing !== null && existing !== raw) return false;
    if (existing === null) {
      storage.setItem(AGENT_ORCHESTRATION_CORRUPT_PROGRESS_BACKUP_KEY, raw);
    }
    return storage.getItem(AGENT_ORCHESTRATION_CORRUPT_PROGRESS_BACKUP_KEY)
      === raw;
  } catch {
    return false;
  }
}

function corruptProgressResult(raw: string): PersistenceResult {
  initialized = true;
  writeCapabilityChecked = false;
  activeRaw = raw;
  hasReadActiveRaw = true;
  pendingRecord = null;
  pendingBaseRaw = null;
  const quarantined = preserveCorruptSessionCopy(raw);
  publishSnapshot("corrupt", {}, null);
  return {
    persisted: false,
    reason: "corrupt",
    ...(quarantined ? { quarantined: true } : {}),
  };
}

function verifyWriteCapability(): PersistenceResult {
  let previous: string | null = null;
  try {
    previous = window.localStorage.getItem(AGENT_ORCHESTRATION_PROGRESS_PROBE_KEY);
    window.localStorage.setItem(AGENT_ORCHESTRATION_PROGRESS_PROBE_KEY, "1");
    if (window.localStorage.getItem(AGENT_ORCHESTRATION_PROGRESS_PROBE_KEY) !== "1") {
      return failedPersistence("unavailable");
    }
    if (previous === null) {
      window.localStorage.removeItem(AGENT_ORCHESTRATION_PROGRESS_PROBE_KEY);
    } else {
      window.localStorage.setItem(AGENT_ORCHESTRATION_PROGRESS_PROBE_KEY, previous);
    }
    const restored = window.localStorage.getItem(
      AGENT_ORCHESTRATION_PROGRESS_PROBE_KEY,
    );
    if (restored !== previous) return failedPersistence("unavailable");
    writeCapabilityChecked = true;
    return successfulPersistence();
  } catch (error) {
    // If the probe was written but cleanup failed, make one best-effort restore
    // of this ephemeral key. No durable learning record is touched here.
    try {
      if (previous === null) {
        window.localStorage.removeItem(AGENT_ORCHESTRATION_PROGRESS_PROBE_KEY);
      } else {
        window.localStorage.setItem(
          AGENT_ORCHESTRATION_PROGRESS_PROBE_KEY,
          previous,
        );
      }
    } catch {
      // The classified failure below remains authoritative.
    }
    return failedPersistence(persistenceFailureReason(error));
  }
}

function browserLocalStorage(): Storage {
  if (typeof window === "undefined") {
    const error = new Error("Browser storage is unavailable");
    error.name = "SecurityError";
    throw error;
  }
  return window.localStorage;
}

function adoptStorage(storage: Storage): void {
  if (currentStorage === storage) return;
  currentStorage = storage;
  initialized = false;
  writeCapabilityChecked = false;
  activeRaw = null;
  hasReadActiveRaw = false;
  pendingRecord = null;
  pendingBaseRaw = null;
  blockedGlobalResetRaw = undefined;
  progressSnapshot = SERVER_AGENT_ORCHESTRATION_PROGRESS_SNAPSHOT;
}

function loadProgressFromStorage(): PersistenceResult {
  if (typeof window === "undefined") return failedPersistence("unavailable");

  let storage: Storage;
  let raw: string | null;
  try {
    storage = browserLocalStorage();
    adoptStorage(storage);
    raw = storage.getItem(AGENT_ORCHESTRATION_PROGRESS_STORAGE_KEY);
  } catch (error) {
    const result = failedPersistence(persistenceFailureReason(error));
    initialized = true;
    publishSnapshot(
      storageStatusForResult(result),
      progressSnapshot.record,
      progressSnapshot.migrationNotice,
    );
    return result;
  }

  if (blockedGlobalResetRaw !== undefined) {
    if (raw === blockedGlobalResetRaw) {
      return resultForStatus(progressSnapshot.status);
    }
    blockedGlobalResetRaw = undefined;
  }

  if (
    initialized
    && writeCapabilityChecked
    && progressSnapshot.status === "available"
    && hasReadActiveRaw
    && raw === activeRaw
  ) return successfulPersistence();

  activeRaw = raw;
  hasReadActiveRaw = true;
  let parsed: unknown = {};
  if (raw !== null) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return corruptProgressResult(raw);
    }
    if (!isProgressObject(parsed)) return corruptProgressResult(raw);
  }

  const migration = migrateAgentOrchestrationProgressRecord(
    parsed as AgentOrchestrationProgressRecord,
    new Date().toISOString(),
  );
  const nextRecord = migration.record;
  initialized = true;

  if (raw !== null && migration.migrated) {
    return persistRecord(nextRecord, raw);
  } else if (!writeCapabilityChecked) {
    const capability = verifyWriteCapability();
    if (!capability.persisted) {
      publishSnapshot(
        storageStatusForResult(capability),
        nextRecord,
        migration.notice,
      );
      return capability;
    }
  }

  pendingRecord = null;
  pendingBaseRaw = null;
  publishSnapshot("available", nextRecord, migration.notice);
  return successfulPersistence();
}

function dispatchProgressEvent(result: PersistenceResult): void {
  if (typeof window === "undefined") return;
  dispatchingInternalEvent = true;
  try {
    window.dispatchEvent(new CustomEvent(AGENT_ORCHESTRATION_PROGRESS_EVENT, {
      detail: result,
    }));
  } finally {
    dispatchingInternalEvent = false;
  }
}

function dispatchProgressResetEvent(result: PersistenceResult): void {
  if (typeof window === "undefined") return;
  dispatchingInternalEvent = true;
  try {
    window.dispatchEvent(new CustomEvent(AGENT_ORCHESTRATION_PROGRESS_RESET_EVENT, {
      detail: result,
    }));
  } finally {
    dispatchingInternalEvent = false;
  }
}

function persistRecord(
  record: AgentOrchestrationProgressRecord,
  expectedRaw: string | null,
): PersistenceResult {
  const nextRecord = {
    ...record,
    [AGENT_ORCHESTRATION_PROGRESS_VERSION_KEY]:
      AGENT_ORCHESTRATION_PROGRESS_VERSION,
  };
  const notice = migrateAgentOrchestrationProgressRecord(nextRecord).notice;
  const serialized = JSON.stringify(nextRecord);
  try {
    const storage = browserLocalStorage();
    adoptStorage(storage);
    const rawBeforeWrite = storage.getItem(
      AGENT_ORCHESTRATION_PROGRESS_STORAGE_KEY,
    );
    if (rawBeforeWrite !== expectedRaw) {
      const result = failedPersistence("unavailable");
      pendingRecord = immutableRecord(nextRecord, notice);
      pendingBaseRaw = expectedRaw;
      activeRaw = rawBeforeWrite;
      hasReadActiveRaw = true;
      publishSnapshot(storageStatusForResult(result), pendingRecord, notice);
      return result;
    }
    if (rawBeforeWrite !== null) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(rawBeforeWrite);
      } catch {
        return corruptProgressResult(rawBeforeWrite);
      }
      if (!isProgressObject(parsed)) return corruptProgressResult(rawBeforeWrite);
    }
    storage.setItem(AGENT_ORCHESTRATION_PROGRESS_STORAGE_KEY, serialized);
    if (storage.getItem(AGENT_ORCHESTRATION_PROGRESS_STORAGE_KEY) !== serialized) {
      const result = failedPersistence("unavailable");
      pendingRecord = immutableRecord(nextRecord, notice);
      pendingBaseRaw = rawBeforeWrite;
      publishSnapshot(storageStatusForResult(result), pendingRecord, notice);
      return result;
    }
  } catch (error) {
    const result = failedPersistence(persistenceFailureReason(error));
    pendingRecord = immutableRecord(nextRecord, notice);
    pendingBaseRaw = expectedRaw;
    publishSnapshot(storageStatusForResult(result), pendingRecord, notice);
    return result;
  }

  activeRaw = serialized;
  hasReadActiveRaw = true;
  initialized = true;
  writeCapabilityChecked = true;
  pendingRecord = null;
  pendingBaseRaw = null;
  publishSnapshot("available", nextRecord, notice);
  return successfulPersistence();
}

export function isAgentOrchestrationProgressStorageEvent(
  event: Pick<StorageEvent, "key" | "storageArea">,
): boolean {
  if (typeof window === "undefined") return false;
  try {
    return event.storageArea === window.localStorage
      && (
        event.key === AGENT_ORCHESTRATION_PROGRESS_STORAGE_KEY
        || event.key === null
      );
  } catch {
    return false;
  }
}

function handleProgressStorageEvent(event: Event): void {
  if (isAgentOrchestrationProgressStorageEvent(event as StorageEvent)) {
    writeCapabilityChecked = false;
    loadProgressFromStorage();
  }
}

function handleProgressCustomEvent(): void {
  if (dispatchingInternalEvent) return;
  loadProgressFromStorage();
}

function attachBrowserListeners(): void {
  if (browserListenersAttached || typeof window === "undefined") return;
  window.addEventListener("storage", handleProgressStorageEvent);
  window.addEventListener(
    AGENT_ORCHESTRATION_PROGRESS_EVENT,
    handleProgressCustomEvent,
  );
  window.addEventListener(
    AGENT_ORCHESTRATION_PROGRESS_RESET_EVENT,
    handleProgressCustomEvent,
  );
  browserListenersAttached = true;
}

function detachBrowserListeners(): void {
  if (!browserListenersAttached || typeof window === "undefined") return;
  window.removeEventListener("storage", handleProgressStorageEvent);
  window.removeEventListener(
    AGENT_ORCHESTRATION_PROGRESS_EVENT,
    handleProgressCustomEvent,
  );
  window.removeEventListener(
    AGENT_ORCHESTRATION_PROGRESS_RESET_EVENT,
    handleProgressCustomEvent,
  );
  browserListenersAttached = false;
}

export function getAgentOrchestrationProgressServerSnapshot(): AgentOrchestrationProgressSnapshot {
  return SERVER_AGENT_ORCHESTRATION_PROGRESS_SNAPSHOT;
}

export function getAgentOrchestrationProgressSnapshot(): AgentOrchestrationProgressSnapshot {
  if (typeof window === "undefined") {
    return SERVER_AGENT_ORCHESTRATION_PROGRESS_SNAPSHOT;
  }
  try {
    adoptStorage(window.localStorage);
  } catch {
    initialized = false;
  }
  if (!initialized) loadProgressFromStorage();
  return progressSnapshot;
}

export function subscribeAgentOrchestrationProgress(
  subscriber: () => void,
): () => void {
  subscribers.add(subscriber);
  attachBrowserListeners();
  return () => {
    subscribers.delete(subscriber);
    if (subscribers.size === 0) detachBrowserListeners();
  };
}

export function isAgentOrchestrationStorageAvailable(): boolean {
  if (typeof window !== "undefined") loadProgressFromStorage();
  return progressSnapshot.status === "available";
}

export function readAgentOrchestrationProgress(): AgentOrchestrationProgressRecord {
  if (typeof window !== "undefined") loadProgressFromStorage();
  return { ...progressSnapshot.record };
}

export function writeAgentOrchestrationProgressResult(
  record: AgentOrchestrationProgressRecord,
): PersistenceResult {
  const snapshot = getAgentOrchestrationProgressSnapshot();
  if (snapshot.status !== "available") return resultForStatus(snapshot.status);
  const result = persistRecord(record, activeRaw);
  if (result.persisted) {
    blockedGlobalResetRaw = undefined;
    dispatchProgressEvent(result);
  }
  return result;
}

/** Backward-compatible boolean facade; new UI should consume the result API. */
export function writeAgentOrchestrationProgress(
  record: AgentOrchestrationProgressRecord,
): boolean {
  return writeAgentOrchestrationProgressResult(record).persisted;
}

export function updateAgentOrchestrationProgressResult(
  mutator: (record: AgentOrchestrationProgressRecord) => void,
): PersistenceResult {
  const refreshed = loadProgressFromStorage();
  if (!refreshed.persisted) return refreshed;
  const record = { ...progressSnapshot.record };
  mutator(record);
  const result = persistRecord(record, activeRaw);
  if (result.persisted) {
    dispatchProgressEvent(result);
  }
  return result;
}

/** Backward-compatible boolean facade; new UI should consume the result API. */
export function updateAgentOrchestrationProgress(
  mutator: (record: AgentOrchestrationProgressRecord) => void,
): boolean {
  return updateAgentOrchestrationProgressResult(mutator).persisted;
}

export function resetAgentOrchestrationProgressResult(): PersistenceResult {
  const refreshed = loadProgressFromStorage();
  if (!refreshed.persisted) return refreshed;
  const record = { ...progressSnapshot.record };
  for (const key of Object.keys(record)) {
    if (key.startsWith(AGENT_ORCHESTRATION_PROGRESS_PREFIX)) delete record[key];
  }
  const result = persistRecord(record, activeRaw);
  if (result.persisted) {
    dispatchProgressEvent(result);
    dispatchProgressResetEvent(result);
  }
  return result;
}

/** Backward-compatible boolean facade; new UI should consume the result API. */
export function resetAgentOrchestrationProgress(): boolean {
  return resetAgentOrchestrationProgressResult().persisted;
}

/**
 * Retry a failed read/write without ever clearing shared corruption.
 *
 * A pending write is retried only when the active bytes still match the exact
 * base it was derived from. Corrupt bytes are merely copied and verified in
 * the registered session recovery slot; the site-wide reset owner is the only
 * component allowed to quarantine and clear the durable shared record.
 */
export function repairAgentOrchestrationProgress(): PersistenceResult {
  if (typeof window === "undefined") return failedPersistence("unavailable");
  if (pendingRecord) {
    const result = persistRecord({ ...pendingRecord }, pendingBaseRaw);
    if (result.persisted) {
      dispatchProgressEvent(result);
    }
    return result;
  }
  initialized = false;
  writeCapabilityChecked = false;
  return loadProgressFromStorage();
}

export function readAgentOrchestrationRecoveryExport(): AgentOrchestrationRecoveryExport {
  let raw = hasReadActiveRaw ? activeRaw : null;
  if (!hasReadActiveRaw && typeof window !== "undefined") {
    try {
      raw = window.localStorage.getItem(
        AGENT_ORCHESTRATION_PROGRESS_STORAGE_KEY,
      );
    } catch {
      raw = null;
    }
  }
  let sessionBackupRaw: string | null = null;
  if (typeof window !== "undefined") {
    try {
      sessionBackupRaw = window.sessionStorage.getItem(
        AGENT_ORCHESTRATION_CORRUPT_PROGRESS_BACKUP_KEY,
      );
    } catch {
      sessionBackupRaw = null;
    }
  }
  let pendingText: string | null = null;
  if (pendingRecord) {
    try {
      pendingText = JSON.stringify(pendingRecord);
    } catch {
      pendingText = null;
    }
  }
  return Object.freeze({
    status: progressSnapshot.status,
    activeRaw: raw,
    sessionBackupRaw,
    migrationNotice: progressSnapshot.migrationNotice,
    recoveryEnvelope: readAgentOrchestrationProgressRecoveryEnvelope(
      progressSnapshot.record[
        AGENT_ORCHESTRATION_PROGRESS_RECOVERY_ENVELOPE_KEY
      ],
    ),
    pendingRecord,
    exportText: pendingText ?? raw,
  });
}

/** Reset this module's session cache after the site-wide owner removed `ae.progress`. */
export function resetAgentOrchestrationProgressAfterGlobalReset(): PersistenceResult {
  if (typeof window === "undefined") return failedPersistence("unavailable");
  const storage = window.localStorage;
  adoptStorage(storage);
  const result = verifySharedProgressReset(
    storage,
    AGENT_ORCHESTRATION_PROGRESS_STORAGE_KEY,
  );
  initialized = true;
  pendingRecord = null;
  pendingBaseRaw = null;
  if (result.persisted) {
    blockedGlobalResetRaw = undefined;
    activeRaw = null;
    hasReadActiveRaw = true;
    writeCapabilityChecked = true;
    publishSnapshot("available", {
      [AGENT_ORCHESTRATION_PROGRESS_VERSION_KEY]:
        AGENT_ORCHESTRATION_PROGRESS_VERSION,
    }, null);
  } else {
    let raw: string | null = null;
    try {
      raw = storage.getItem(AGENT_ORCHESTRATION_PROGRESS_STORAGE_KEY);
    } catch {
      // The verified reset result remains authoritative.
    }
    activeRaw = raw;
    blockedGlobalResetRaw = raw;
    hasReadActiveRaw = true;
    initialized = true;
    writeCapabilityChecked = false;
    if (result.reason === "corrupt" && raw !== null) {
      corruptProgressResult(raw);
    } else {
      publishSnapshot(storageStatusForResult(result), {}, null);
    }
  }
  dispatchProgressEvent(result);
  dispatchProgressResetEvent(result);
  return result;
}
