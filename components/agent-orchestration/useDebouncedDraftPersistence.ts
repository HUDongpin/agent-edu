"use client";

import { useEffect, useState } from "react";
import {
  createAgentOrchestrationDraftWriter,
  type AgentOrchestrationDraftStatus,
  type AgentOrchestrationDraftWriter,
} from "@/lib/agent-orchestration/draft-persistence";

type FlushReason = "manual" | "navigation" | "pagehide" | "popstate";
type RegisteredFlusher = (reason: FlushReason) => void;

const registeredFlushers = new Set<RegisteredFlusher>();
let browserFlushListenersAttached = false;

function flushRegistered(reason: FlushReason): void {
  for (const flush of registeredFlushers) flush(reason);
}

export function flushAgentOrchestrationDrafts(): void {
  flushRegistered("manual");
}

function courseNavigationFromClick(event: MouseEvent): boolean {
  if (
    event.defaultPrevented
    || event.button !== 0
    || event.metaKey
    || event.ctrlKey
    || event.shiftKey
    || event.altKey
  ) return false;
  const target = event.target;
  if (!(target instanceof Element)) return false;
  const anchor = target.closest("a[href]");
  if (!(anchor instanceof HTMLAnchorElement)) return false;
  if (anchor.target === "_blank" || anchor.hasAttribute("download")) return false;
  try {
    const destination = new URL(anchor.href, window.location.href);
    return destination.origin === window.location.origin
      && /\/agent-orchestration(?:\/|$)/u.test(destination.pathname);
  } catch {
    return false;
  }
}

function handleCourseNavigation(event: MouseEvent): void {
  if (courseNavigationFromClick(event)) flushRegistered("navigation");
}

function handlePageHide(): void {
  flushRegistered("pagehide");
}

function handlePopState(): void {
  flushRegistered("popstate");
}

function syncBrowserFlushListeners(): void {
  if (typeof window === "undefined") return;
  const needed = registeredFlushers.size > 0;
  if (needed && !browserFlushListenersAttached) {
    window.addEventListener("click", handleCourseNavigation, true);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("popstate", handlePopState);
    browserFlushListenersAttached = true;
  } else if (!needed && browserFlushListenersAttached) {
    window.removeEventListener("click", handleCourseNavigation, true);
    window.removeEventListener("pagehide", handlePageHide);
    window.removeEventListener("popstate", handlePopState);
    browserFlushListenersAttached = false;
  }
}

function registerFlusher(flush: RegisteredFlusher): () => void {
  registeredFlushers.add(flush);
  syncBrowserFlushListeners();
  return () => {
    registeredFlushers.delete(flush);
    syncBrowserFlushListeners();
  };
}

export interface DebouncedDraftPersistence {
  readonly status: AgentOrchestrationDraftStatus;
  queue(write: () => boolean): void;
  flush(): boolean | null;
  cancelPending(): void;
  markEvidenceAccepted(): void;
}

/**
 * Browser lifecycle adapter for the pure debounced writer. Restoration remains
 * snapshot-driven; this effect exists only to subscribe to page/navigation
 * boundaries and to flush an already-dirty closure during unmount.
 */
export function useDebouncedDraftPersistence(
  initialStatus: AgentOrchestrationDraftStatus,
): DebouncedDraftPersistence {
  const [status, setStatus] = useState(initialStatus);
  const [writer] = useState<AgentOrchestrationDraftWriter>(() =>
    createAgentOrchestrationDraftWriter({
      initialStatus,
    }),
  );

  useEffect(() => {
    writer.setStatusListener(setStatus);
    const unregister = registerFlusher(() => {
      writer.flush();
    });
    return () => {
      unregister();
      writer.setStatusListener(null);
      writer.flush();
    };
  }, [writer]);

  return {
    status,
    queue: (write) => writer.queue(write),
    flush: () => writer.flush(),
    cancelPending: () => writer.cancelPending(),
    markEvidenceAccepted: () => writer.markEvidenceAccepted(),
  };
}
