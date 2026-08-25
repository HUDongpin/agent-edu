import type { PersistenceResult } from "./public-progress-contract";

export type PersistenceFailureReason = NonNullable<PersistenceResult["reason"]>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Classify browser storage exceptions without leaking their messages. */
export function persistenceFailureReason(error: unknown): PersistenceFailureReason {
  if (
    isRecord(error)
    && (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED")
  ) return "quota";
  return "unavailable";
}

export function failedPersistence(reason: PersistenceFailureReason): PersistenceResult {
  return { persisted: false, reason };
}

export function successfulPersistence(): PersistenceResult {
  return { persisted: true };
}

/** Every course progress storage key is a JSON object record. */
export function isJsonObjectRecord(raw: string): boolean {
  try {
    return isRecord(JSON.parse(raw));
  } catch {
    return false;
  }
}

/**
 * Verify a shared progress record after its one owning reset has run.
 *
 * Dependent course stores clear their module caches, but never race the owner
 * by deleting the shared record themselves. A remaining valid object means the
 * owner could not complete the reset; a remaining non-object is quarantined as
 * corrupt and left byte-for-byte untouched.
 */
export function verifySharedProgressReset(
  storage: Pick<Storage, "getItem">,
  key: string,
): PersistenceResult {
  try {
    const raw = storage.getItem(key);
    if (raw === null) return successfulPersistence();
    return failedPersistence(isJsonObjectRecord(raw) ? "unavailable" : "corrupt");
  } catch (error) {
    return failedPersistence(persistenceFailureReason(error));
  }
}
