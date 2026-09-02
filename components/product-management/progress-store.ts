import {
  PRODUCT_MANAGEMENT_PROGRESS_SCHEMA,
} from "@/lib/progress-topology";
import type { PersistenceResult } from "@/lib/public-progress-contract";
import { verifySharedProgressReset } from "@/lib/progress-persistence";
import {
  PRODUCT_MANAGEMENT_CORRUPT_PROGRESS_BACKUP_KEY,
  PRODUCT_MANAGEMENT_PROGRESS_PROBE_KEY,
} from "@/lib/progress-storage-contract";
import { clearProductManagementAssessmentAttempt } from "./assessment-attempt-store";

const PRODUCT_MANAGEMENT_PROGRESS_EVENT =
  PRODUCT_MANAGEMENT_PROGRESS_SCHEMA.progressEvent;
const PRODUCT_MANAGEMENT_PROGRESS_PREFIX = PRODUCT_MANAGEMENT_PROGRESS_SCHEMA.prefix;
const PRODUCT_MANAGEMENT_PROGRESS_RESET_EVENT =
  PRODUCT_MANAGEMENT_PROGRESS_SCHEMA.resetEvent;
const PRODUCT_MANAGEMENT_PROGRESS_VERSION = PRODUCT_MANAGEMENT_PROGRESS_SCHEMA.version;
const PRODUCT_MANAGEMENT_PROGRESS_VERSION_KEY =
  PRODUCT_MANAGEMENT_PROGRESS_SCHEMA.versionKey;

function isCurrentProductManagementProgress(
  progress: Record<string, unknown>,
): boolean {
  return progress[PRODUCT_MANAGEMENT_PROGRESS_VERSION_KEY]
    === PRODUCT_MANAGEMENT_PROGRESS_VERSION;
}

export const PRODUCT_MANAGEMENT_PROGRESS_STORAGE_KEY = "ae.progress";
export type ProductManagementProgressRecord = Record<string, unknown>;
export type ProductManagementResetResult = PersistenceResult & {
  readonly progressPersisted: boolean;
  readonly attemptPersisted: boolean;
};

let memoryProgress: ProductManagementProgressRecord = {};
let storageAvailable: boolean | null = null;

function holdCorruptProgress(raw: string | null): void {
  memoryProgress = {};
  if (raw) {
    try {
      sessionStorage.setItem(PRODUCT_MANAGEMENT_CORRUPT_PROGRESS_BACKUP_KEY, raw);
    } catch {
      // Preserve the unreadable shared record when session storage is unavailable.
    }
  }
  storageAvailable = false;
}

function ensureStorageAccess(): boolean {
  if (typeof window === "undefined") return true;
  if (storageAvailable !== null) return storageAvailable;
  try {
    localStorage.setItem(PRODUCT_MANAGEMENT_PROGRESS_PROBE_KEY, "1");
    localStorage.removeItem(PRODUCT_MANAGEMENT_PROGRESS_PROBE_KEY);
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  return storageAvailable;
}

export function isProductManagementStorageAvailable(): boolean {
  if (typeof window === "undefined") return true;
  if (storageAvailable !== false) readProductManagementProgress();
  return storageAvailable === true;
}

export function readProductManagementProgress(): ProductManagementProgressRecord {
  if (typeof window === "undefined" || !ensureStorageAccess()) {
    return { ...memoryProgress };
  }
  try {
    const raw = localStorage.getItem(PRODUCT_MANAGEMENT_PROGRESS_STORAGE_KEY);
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw || "{}");
    } catch {
      holdCorruptProgress(raw);
      return { ...memoryProgress };
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      holdCorruptProgress(raw);
      return { ...memoryProgress };
    }
    memoryProgress = { ...(parsed as ProductManagementProgressRecord) };
  } catch {
    storageAvailable = false;
  }
  return { ...memoryProgress };
}

export function writeProductManagementProgress(
  record: ProductManagementProgressRecord,
): boolean {
  memoryProgress = {
    ...record,
    [PRODUCT_MANAGEMENT_PROGRESS_VERSION_KEY]: PRODUCT_MANAGEMENT_PROGRESS_VERSION,
  };
  let persisted = false;
  try {
    if (storageAvailable !== false) {
      const raw = localStorage.getItem(PRODUCT_MANAGEMENT_PROGRESS_STORAGE_KEY) || "{}";
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        holdCorruptProgress(raw);
      } else {
        storageAvailable = true;
      }
    }
    if (storageAvailable === true) {
      localStorage.setItem(
        PRODUCT_MANAGEMENT_PROGRESS_STORAGE_KEY,
        JSON.stringify(memoryProgress),
      );
      persisted = true;
    }
  } catch {
    storageAvailable = false;
  }
  window.dispatchEvent(new CustomEvent(PRODUCT_MANAGEMENT_PROGRESS_EVENT));
  return persisted;
}

export function updateProductManagementProgress(
  mutator: (record: ProductManagementProgressRecord) => void,
): boolean {
  const record = readProductManagementProgress();
  if (!isCurrentProductManagementProgress(record)) {
    for (const key of Object.keys(record)) {
      if (key.startsWith(PRODUCT_MANAGEMENT_PROGRESS_PREFIX)) delete record[key];
    }
  }
  mutator(record);
  return writeProductManagementProgress(record);
}

export function resetProductManagementProgress(): ProductManagementResetResult {
  const record = readProductManagementProgress();
  for (const key of Object.keys(record)) {
    if (key.startsWith(PRODUCT_MANAGEMENT_PROGRESS_PREFIX)) delete record[key];
  }
  const progressPersisted = writeProductManagementProgress(record);
  const attemptResult = clearProductManagementAssessmentAttempt();
  window.dispatchEvent(new CustomEvent(PRODUCT_MANAGEMENT_PROGRESS_RESET_EVENT));
  const persisted = progressPersisted && attemptResult.persisted;
  return {
    persisted,
    progressPersisted,
    attemptPersisted: attemptResult.persisted,
    ...(!persisted
      ? { reason: progressPersisted ? attemptResult.reason ?? "unavailable" : "unavailable" }
      : {}),
  };
}

/** Reset this module's session cache after the site-wide owner removed `ae.progress`. */
export function resetProductManagementProgressAfterGlobalReset(): PersistenceResult {
  memoryProgress = {};
  const progressResult = typeof window === "undefined"
    ? { persisted: false, reason: "unavailable" } as const
    : verifySharedProgressReset(localStorage, PRODUCT_MANAGEMENT_PROGRESS_STORAGE_KEY);
  const attemptResult = clearProductManagementAssessmentAttempt();
  storageAvailable = progressResult.persisted;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PRODUCT_MANAGEMENT_PROGRESS_EVENT));
    window.dispatchEvent(new CustomEvent(PRODUCT_MANAGEMENT_PROGRESS_RESET_EVENT));
  }
  if (!progressResult.persisted) return progressResult;
  if (!attemptResult.persisted) return attemptResult;
  return progressResult;
}
