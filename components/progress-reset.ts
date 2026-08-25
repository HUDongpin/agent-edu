"use client";

/**
 * One site-wide progress reset registry.
 *
 * `ae.learning.v2` owns the Agentic Handbook/Lab journey. The remaining
 * courses still keep namespaced fields in the legacy shared `ae.progress`
 * record (Cursor and Grok use their declared storage keys). Several stores
 * also retain a session-memory snapshot after browser storage fails. Removing
 * a key alone would therefore let a later write revive progress the learner
 * explicitly cleared. Every store must reset its memory and dispatch its own
 * repaint event through this registry.
 */

import {
  createAllProgressAdapters,
  type PersistenceResult,
} from "./progress-adapters";
import { persistenceFailureReason } from "@/lib/progress-persistence";
import {
  PROGRESS_RECENCY_STORAGE_KEY,
  isProgressRecencyPersistent,
  resetProgressRecencyAfterGlobalReset,
} from "./progress-recency";

export interface ProgressPersistenceReport {
  readonly persistent: boolean;
  readonly sessionOnlyStores: readonly string[];
}

export interface ProgressResetResult extends ProgressPersistenceReport {
  /** Stores whose reset stayed only in memory or otherwise failed to persist. */
  readonly failedStores: readonly string[];
  /** Machine-readable, non-sensitive cause for each failed store. */
  readonly failureReasons: Readonly<Record<string, NonNullable<PersistenceResult["reason"]>>>;
  /** Stores whose unreadable active record was moved to inactive recovery storage. */
  readonly quarantinedStores: readonly string[];
}

export interface ProgressResetEntry {
  readonly id: string;
  readonly storageKeys: readonly string[];
  readonly reset: () => PersistenceResult | Promise<PersistenceResult>;
  readonly isPersistent: () => boolean;
}

/**
 * The order is intentional: clear the shared record first, then clear every
 * module-level fallback against the already-empty record. Cursor runs last so
 * its cross-tab lock covers the final shared-record mutation it owns.
 */
const ALL_PROGRESS_ADAPTERS = createAllProgressAdapters("en");
const CODEX_RESET_ADAPTER = ALL_PROGRESS_ADAPTERS.find(
  (adapter) => adapter.courseId === "codex",
);
const CURSOR_RESET_ADAPTER = ALL_PROGRESS_ADAPTERS.find(
  (adapter) => adapter.courseId === "cursor",
);
if (!CODEX_RESET_ADAPTER || !CURSOR_RESET_ADAPTER) {
  throw new Error("Global progress reset requires Codex and Cursor adapters");
}
const [SHARED_PROGRESS_STORAGE_KEY] = CODEX_RESET_ADAPTER.storageKeys;
if (!SHARED_PROGRESS_STORAGE_KEY) {
  throw new Error("Codex reset adapter must declare its shared storage key");
}

export const PROGRESS_RESET_REGISTRY: readonly ProgressResetEntry[] = [
  {
    id: "codex/shared-record",
    storageKeys: CODEX_RESET_ADAPTER.storageKeys,
    reset: CODEX_RESET_ADAPTER.resetAfterGlobalReset,
    isPersistent: CODEX_RESET_ADAPTER.isPersistent,
  },
  ...ALL_PROGRESS_ADAPTERS
    .filter((adapter) => adapter.courseId !== "codex" && adapter.courseId !== "cursor")
    .map((adapter) => ({
      id: adapter.courseId,
      storageKeys: adapter.storageKeys,
      reset: adapter.resetAfterGlobalReset,
      isPersistent: adapter.isPersistent,
    })),
  {
    id: "cursor",
    storageKeys: CURSOR_RESET_ADAPTER.storageKeys,
    reset: CURSOR_RESET_ADAPTER.resetAfterGlobalReset,
    isPersistent: CURSOR_RESET_ADAPTER.isPersistent,
  },
  {
    // Progress reset events can update recency, so this ledger must run last.
    id: "recency",
    storageKeys: [PROGRESS_RECENCY_STORAGE_KEY],
    reset: resetProgressRecencyAfterGlobalReset,
    isPersistent: isProgressRecencyPersistent,
  },
] as const;

export function inspectProgressPersistence(): ProgressPersistenceReport {
  const sessionOnlyStores: string[] = [];
  for (const entry of PROGRESS_RESET_REGISTRY) {
    try {
      if (!entry.isPersistent()) sessionOnlyStores.push(entry.id);
    } catch {
      sessionOnlyStores.push(entry.id);
    }
  }
  return {
    persistent: sessionOnlyStores.length === 0,
    sessionOnlyStores,
  };
}

export async function resetEveryCourseProgress(): Promise<ProgressResetResult> {
  const failedStores: string[] = [];
  const quarantinedStores: string[] = [];
  const failureReasons: Record<string, NonNullable<PersistenceResult["reason"]>> = {};
  let sharedOwnerFailure: NonNullable<PersistenceResult["reason"]> | undefined;
  for (const entry of PROGRESS_RESET_REGISTRY) {
    try {
      const ownResult = await entry.reset();
      const inheritedSharedFailure = entry.id !== "codex/shared-record"
        && entry.storageKeys.includes(SHARED_PROGRESS_STORAGE_KEY)
        ? sharedOwnerFailure
        : undefined;
      const result = inheritedSharedFailure
        ? { persisted: false, reason: inheritedSharedFailure } as const
        : ownResult;
      if (ownResult.quarantined) quarantinedStores.push(entry.id);
      if (!result.persisted) {
        const reason = result.reason ?? "unavailable";
        failedStores.push(entry.id);
        failureReasons[entry.id] = reason;
        if (entry.id === "codex/shared-record") sharedOwnerFailure = reason;
      }
    } catch (error) {
      failedStores.push(entry.id);
      failureReasons[entry.id] = persistenceFailureReason(error);
      if (entry.id === "codex/shared-record") {
        sharedOwnerFailure = failureReasons[entry.id];
      }
    }
  }

  const persistence = inspectProgressPersistence();
  return {
    persistent: failedStores.length === 0 && persistence.persistent,
    failedStores,
    failureReasons,
    quarantinedStores,
    sessionOnlyStores: persistence.sessionOnlyStores,
  };
}
