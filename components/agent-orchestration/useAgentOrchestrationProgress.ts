"use client";

import { useSyncExternalStore } from "react";
import {
  getAgentOrchestrationProgressServerSnapshot,
  getAgentOrchestrationProgressSnapshot,
  subscribeAgentOrchestrationProgress,
  type AgentOrchestrationProgressSnapshot,
} from "./progress-store";

/** Hydration-safe access to the shared Course 15 progress snapshot. */
export function useAgentOrchestrationProgress(): AgentOrchestrationProgressSnapshot {
  return useSyncExternalStore(
    subscribeAgentOrchestrationProgress,
    getAgentOrchestrationProgressSnapshot,
    getAgentOrchestrationProgressServerSnapshot,
  );
}
