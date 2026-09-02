"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  isCourseProgressPersistenceAvailable,
  readCourseProgressSnapshot,
  subscribeToCourseProgress,
  type CourseProgressRecord,
} from "./progress-store";

const EMPTY_PROGRESS = "{}";

export default function useCourseProgress(): CourseProgressRecord {
  const snapshot = useSyncExternalStore(
    subscribeToCourseProgress,
    readCourseProgressSnapshot,
    () => EMPTY_PROGRESS,
  );

  return useMemo(() => {
    try {
      const value = JSON.parse(snapshot);
      return value && typeof value === "object" && !Array.isArray(value)
        ? value as CourseProgressRecord
        : {};
    } catch {
      return {};
    }
  }, [snapshot]);
}

export function useCourseStorageAvailable(): boolean {
  return useSyncExternalStore(
    subscribeToCourseProgress,
    isCourseProgressPersistenceAvailable,
    () => true,
  );
}
