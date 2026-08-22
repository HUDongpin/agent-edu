import { priceUsage } from "./pricing";
import type { BillingState, CallResult, Model, ProviderError, Usage } from "./types";

export interface BillingEntry {
  state: BillingState;
  requestedModel: Model;
  usage?: Usage;
  occurredAt?: number;
}

export interface BillingSnapshot {
  dispatchedCalls: number;
  usageConfirmedCalls: number;
  providerRejectedCalls: number;
  unknownAfterSendCalls: number;
  notSentAttempts: number;
  knownUsd: number;
  hasUnknown: boolean;
  usage: Usage;
}

export interface BillingLedger {
  snapshot(): BillingSnapshot;
  serverSnapshot(): BillingSnapshot;
  subscribe(listener: () => void): () => void;
  record(entry: BillingEntry): void;
  recordResult(result: CallResult, occurredAt?: number): void;
  recordError(error: ProviderError, fallbackModel: Model, occurredAt?: number): void;
  reset(): void;
}

const ZERO_USAGE: Usage = {
  promptTokens: 0,
  promptCacheHitTokens: 0,
  promptCacheMissTokens: 0,
  completionTokens: 0,
};

const EMPTY: BillingSnapshot = {
  dispatchedCalls: 0,
  usageConfirmedCalls: 0,
  providerRejectedCalls: 0,
  unknownAfterSendCalls: 0,
  notSentAttempts: 0,
  knownUsd: 0,
  hasUnknown: false,
  usage: ZERO_USAGE,
};

export function createBillingLedger(): BillingLedger {
  const listeners = new Set<() => void>();
  let current = EMPTY;

  function emit(next: BillingSnapshot): void {
    current = next;
    for (const listener of listeners) listener();
  }

  function record(entry: BillingEntry): void {
    const usage = entry.usage;
    const priced = entry.state === "usage-confirmed"
      ? priceUsage(entry.requestedModel, usage, entry.occurredAt ?? Date.now())
      : undefined;
    const usageWasUnknown = entry.state === "usage-confirmed" && !priced?.known;
    const unknownAfterSend = entry.state === "unknown-after-send" || usageWasUnknown;
    const dispatched = entry.state !== "not-sent";

    emit({
      dispatchedCalls: current.dispatchedCalls + (dispatched ? 1 : 0),
      usageConfirmedCalls: current.usageConfirmedCalls
        + (entry.state === "usage-confirmed" && priced?.known ? 1 : 0),
      providerRejectedCalls: current.providerRejectedCalls
        + (entry.state === "provider-rejected-no-usage" ? 1 : 0),
      unknownAfterSendCalls: current.unknownAfterSendCalls + (unknownAfterSend ? 1 : 0),
      notSentAttempts: current.notSentAttempts + (entry.state === "not-sent" ? 1 : 0),
      knownUsd: current.knownUsd + (priced?.known ? priced.usd : 0),
      hasUnknown: current.hasUnknown || unknownAfterSend,
      usage: usage && priced?.known ? {
        promptTokens: current.usage.promptTokens + usage.promptTokens,
        promptCacheHitTokens: current.usage.promptCacheHitTokens + usage.promptCacheHitTokens,
        promptCacheMissTokens: current.usage.promptCacheMissTokens + usage.promptCacheMissTokens,
        completionTokens: current.usage.completionTokens + usage.completionTokens,
      } : current.usage,
    });
  }

  return {
    snapshot: () => current,
    serverSnapshot: () => EMPTY,
    subscribe(listener) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    record,
    recordResult(result, occurredAt) {
      record({
        state: result.billing,
        requestedModel: result.requestedModel,
        usage: result.usage,
        occurredAt: result.createdAt ?? occurredAt,
      });
    },
    recordError(error, fallbackModel, occurredAt) {
      record({
        state: error.billing,
        requestedModel: error.requestedModel ?? fallbackModel,
        usage: error.usage,
        occurredAt: error.createdAt ?? occurredAt,
      });
    },
    reset() { emit(EMPTY); },
  };
}
