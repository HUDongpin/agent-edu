"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  isMcpPersistenceAvailable,
  readMcpProgressSnapshot,
  subscribeToMcpProgress,
  type McpProgressRecord,
} from "./progress-store";

export function useMcpProgress(): McpProgressRecord {
  const snapshot = useSyncExternalStore(
    subscribeToMcpProgress,
    readMcpProgressSnapshot,
    () => "{}",
  );
  return useMemo(() => {
    try {
      const value = JSON.parse(snapshot);
      return value && typeof value === "object" && !Array.isArray(value)
        ? value as McpProgressRecord
        : {};
    } catch {
      return {};
    }
  }, [snapshot]);
}

export function useMcpStorageAvailable(): boolean {
  return useSyncExternalStore(
    subscribeToMcpProgress,
    isMcpPersistenceAvailable,
    () => true,
  );
}
