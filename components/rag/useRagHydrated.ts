"use client";

import { useSyncExternalStore } from "react";

function subscribeToHydration(notify: () => void): () => void {
  queueMicrotask(notify);
  return () => undefined;
}

export default function useRagHydrated(): boolean {
  return useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
}
