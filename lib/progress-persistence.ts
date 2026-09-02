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

export interface VerifiedQuarantineOptions {
  readonly storage: Pick<Storage, "getItem" | "setItem" | "removeItem">;
  readonly sourceKey: string;
  readonly quarantineKey: string;
  /** Exact unreadable bytes observed by the owning reset immediately before this call. */
  readonly corruptRaw: string;
  /** Agentic keeps a canonical empty v2 guard; other stores remove their active key. */
  readonly replacement?: string;
}

/**
 * Preserve unreadable bytes before an explicitly confirmed reset clears them.
 *
 * There is deliberately no best-effort destructive path. The inactive copy is
 * written and read back byte-for-byte before the active key is touched. A
 * different existing copy is never overwritten. The final active state is also
 * read back so a silent/no-op host cannot be reported as a successful reset.
 */
export function clearCorruptProgressAfterVerifiedQuarantine(
  options: VerifiedQuarantineOptions,
): PersistenceResult {
  const {
    storage,
    sourceKey,
    quarantineKey,
    corruptRaw,
    replacement,
  } = options;

  try {
    const existingCopy = storage.getItem(quarantineKey);
    if (existingCopy !== null && existingCopy !== corruptRaw) {
      return failedPersistence("unavailable");
    }
    if (existingCopy === null) storage.setItem(quarantineKey, corruptRaw);
    if (storage.getItem(quarantineKey) !== corruptRaw) {
      return failedPersistence("unavailable");
    }

    const activeBeforeClear = storage.getItem(sourceKey);
    if (activeBeforeClear !== null && activeBeforeClear !== corruptRaw) {
      return failedPersistence("unavailable");
    }

    if (activeBeforeClear !== null) {
      if (replacement === undefined) storage.removeItem(sourceKey);
      else storage.setItem(sourceKey, replacement);
    }

    const expectedActive = replacement ?? null;
    if (storage.getItem(sourceKey) !== expectedActive) {
      return failedPersistence("unavailable");
    }
    return { persisted: true, quarantined: true };
  } catch (error) {
    return failedPersistence(persistenceFailureReason(error));
  }
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
