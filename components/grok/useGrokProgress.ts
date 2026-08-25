"use client";

import { useSyncExternalStore } from "react";
import {
  EMPTY_GROK_PROGRESS,
  grokStorageAvailable,
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
    () => () => undefined,
    grokStorageAvailable,
    () => true,
  );
}

export function useGrokHydrated(): boolean {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}
