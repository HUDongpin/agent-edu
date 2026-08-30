"use client";

import { useSyncExternalStore } from "react";
import {
  EMPTY_GROK_PROGRESS,
  grokStorageAvailable,
  grokStorageFailureReason,
  readGrokProgress,
  subscribeToGrokProgress,
} from "./progress-store";

export default function useGrokProgress() {
  return useSyncExternalStore(
    subscribeToGrokProgress,
    readGrokProgress,
    () => EMPTY_GROK_PROGRESS,
  );
}

export function useGrokStorageAvailable(): boolean {
  return useSyncExternalStore(
    subscribeToGrokProgress,
    grokStorageAvailable,
    () => true,
  );
}

export function useGrokStorageFailureReason() {
  return useSyncExternalStore(
    subscribeToGrokProgress,
    grokStorageFailureReason,
    () => undefined,
  );
}

export function useGrokHydrated(): boolean {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}
