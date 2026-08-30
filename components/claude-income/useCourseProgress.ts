"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  isProgressPersistenceAvailable,
  readProgressSnapshot,
  subscribeToProgress,
  type ProgressRecord,
} from "./progress-store";

const EMPTY_SNAPSHOT = "{}";

export function useCourseProgress(): ProgressRecord {
  const snapshot = useSyncExternalStore(
    subscribeToProgress,
    readProgressSnapshot,
    () => EMPTY_SNAPSHOT,
  );

  return useMemo(() => {
    try {
      const value = JSON.parse(snapshot);
      return value && typeof value === "object" && !Array.isArray(value)
        ? value as ProgressRecord
        : {};
    } catch {
      return {};
    }
  }, [snapshot]);
}

export function useCourseStorageAvailable(): boolean {
  return useSyncExternalStore(
    subscribeToProgress,
    isProgressPersistenceAvailable,
    () => true,
  );
}

export function useCourseHydrated(): boolean {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}
