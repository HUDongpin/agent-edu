"use client";

import { useSyncExternalStore } from "react";
import {
  RAG_PROGRESS_EVENT,
  isRagProgressStorageAvailable,
  readRagProgress,
  type RagProgressRecord,
} from "./progress-store";

function subscribe(notify: () => void): () => void {
  window.addEventListener(RAG_PROGRESS_EVENT, notify);
  window.addEventListener("storage", notify);
  window.addEventListener("focus", notify);
  return () => {
    window.removeEventListener(RAG_PROGRESS_EVENT, notify);
    window.removeEventListener("storage", notify);
    window.removeEventListener("focus", notify);
  };
}

function progressSnapshot(): string {
  return JSON.stringify(readRagProgress());
}

export default function useRagProgress(): {
  readonly progress: RagProgressRecord;
  readonly storageAvailable: boolean;
} {
  const serialised = useSyncExternalStore(subscribe, progressSnapshot, () => "{}");
  const storageAvailable = useSyncExternalStore(
    subscribe,
    isRagProgressStorageAvailable,
    () => true,
  );
  let progress: RagProgressRecord = {};
  try {
    const value: unknown = JSON.parse(serialised);
    if (value && typeof value === "object" && !Array.isArray(value)) {
      progress = value as RagProgressRecord;
    }
  } catch {
    progress = {};
  }
  return { progress, storageAvailable };
}
