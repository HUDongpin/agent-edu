"use client";

import { useSyncExternalStore } from "react";
import {
  PROMPT_PROGRESS_EVENT,
  isPromptProgressStorageAvailable,
  readPromptProgress,
  type PromptProgressRecord,
} from "./progress-store";

function subscribePromptProgress(notify: () => void): () => void {
  window.addEventListener(PROMPT_PROGRESS_EVENT, notify);
  window.addEventListener("storage", notify);
  window.addEventListener("focus", notify);
  return () => {
    window.removeEventListener(PROMPT_PROGRESS_EVENT, notify);
    window.removeEventListener("storage", notify);
    window.removeEventListener("focus", notify);
  };
}

function progressSnapshot(): string {
  return JSON.stringify(readPromptProgress());
}

function storageSnapshot(): boolean {
  return isPromptProgressStorageAvailable();
}

export function usePromptProgress(): {
  progress: PromptProgressRecord;
  storageAvailable: boolean;
} {
  const serialized = useSyncExternalStore(subscribePromptProgress, progressSnapshot, () => "{}");
  const storageAvailable = useSyncExternalStore(subscribePromptProgress, storageSnapshot, () => true);
  let progress: PromptProgressRecord = {};
  try {
    const value: unknown = JSON.parse(serialized);
    if (value && typeof value === "object" && !Array.isArray(value)) {
      progress = value as PromptProgressRecord;
    }
  } catch {
    progress = {};
  }
  return { progress, storageAvailable };
}
