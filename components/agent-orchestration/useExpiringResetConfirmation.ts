"use client";

import { useEffect, useState } from "react";

export const AGENT_ORCHESTRATION_RESET_CONFIRMATION_MS = 10_000;

export type AgentOrchestrationResetConfirmationState =
  "idle" | "confirming" | "cancelled" | "expired";

interface ResetConfirmationOptions {
  readonly delayMs?: number;
  readonly schedule?: (callback: () => void, delayMs: number) => unknown;
  readonly cancel?: (handle: unknown) => void;
  readonly onStateChange?: (
    state: AgentOrchestrationResetConfirmationState,
  ) => void;
}

export function createAgentOrchestrationResetConfirmation(
  options: ResetConfirmationOptions = {},
) {
  const delayMs = options.delayMs
    ?? AGENT_ORCHESTRATION_RESET_CONFIRMATION_MS;
  const schedule = options.schedule
    ?? ((callback, delay) => globalThis.setTimeout(callback, delay));
  const cancel = options.cancel
    ?? ((handle) => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>));
  let currentState: AgentOrchestrationResetConfirmationState = "idle";
  let nextExpiryToken = 1;
  let expiry: { handle: unknown; readonly token: number } | null = null;

  const clearExpiry = () => {
    if (expiry === null) return;
    const pendingExpiry = expiry;
    expiry = null;
    cancel(pendingExpiry.handle);
  };

  const transition = (nextState: AgentOrchestrationResetConfirmationState) => {
    if (currentState === nextState) return;
    currentState = nextState;
    options.onStateChange?.(nextState);
  };
  const close = (nextState: "cancelled" | "idle") => {
    if (currentState !== "confirming") return false;
    clearExpiry();
    transition(nextState);
    return true;
  };

  return {
    get state() {
      return currentState;
    },
    arm() {
      clearExpiry();
      transition("confirming");
      const token = nextExpiryToken;
      nextExpiryToken += 1;
      const pendingExpiry = {
        handle: null as unknown,
        token,
      };
      expiry = pendingExpiry;
      pendingExpiry.handle = schedule(() => {
        if (expiry?.token !== token) return;
        expiry = null;
        if (currentState === "confirming") transition("expired");
      }, delayMs);
    },
    cancel() {
      return close("cancelled");
    },
    consumeConfirmation() {
      return close("idle");
    },
    dispose() {
      clearExpiry();
    },
  };
}

export function useExpiringResetConfirmation() {
  const [state, setState] = useState<AgentOrchestrationResetConfirmationState>(
    "idle",
  );
  const [controller] = useState(() =>
    createAgentOrchestrationResetConfirmation({ onStateChange: setState }),
  );

  useEffect(() => () => controller.dispose(), [controller]);

  return {
    state,
    arm: controller.arm,
    cancel: controller.cancel,
    consumeConfirmation: controller.consumeConfirmation,
  };
}
