/**
 * Browser-facing facade for the Lab's single DeepSeek client.
 *
 * Network code lives only in `lib/byok/client.ts`. This module binds that
 * client to the current tab's key, records billing evidence, and exposes the
 * small compatibility surface used by the React Lab.
 */
import { createDeepSeekClient } from "./byok/client";
import { getKey, keyStore } from "./byok/key-store";
import { createKeyVerifier } from "./byok/key-verifier";
import { createBillingLedger } from "./byok/ledger";
import {
  isProviderError,
  type CallOptions,
  type CallResult,
  type Model,
  type Msg,
} from "./byok/types";

export type { KeyStatus, Model } from "./byok/types";
export { isProviderError } from "./byok/types";
export { asJSON } from "./byok/json";
export {
  DEEPSEEK_PRICING,
  conservativePromptTokenUpperBound,
  conservativePrice,
  priceBandAt,
  priceUsage,
  ratesForModel,
} from "./byok/pricing";
export {
  forgetKey,
  getKey,
  hasKey,
  hasKeyOnServer,
  keyStatusOnServer,
  keyStatusSnapshot,
  markKeyUnverified,
  subscribeKey,
} from "./byok/key-store";

const client = createDeepSeekClient({ getApiKey: getKey });
const verifier = createKeyVerifier(keyStore, (options) => client.listModels(options));
const ledger = createBillingLedger();

export const billingSnapshot = ledger.snapshot;
export const billingSnapshotOnServer = ledger.serverSnapshot;
export const subscribeBilling = ledger.subscribe;

export async function call(messages: Msg[], options: CallOptions): Promise<CallResult> {
  const occurredAt = Date.now();
  try {
    const result = await client.call(messages, options);
    ledger.recordResult(result, occurredAt);
    return result;
  } catch (error) {
    if (isProviderError(error)) {
      ledger.recordError(error, options.model, occurredAt);
      // An auth rejection must not leave the credential presented as
      // verified. A confirmed 401 also removes the rejected secret; a 403
      // keeps it available for an explicit re-test, matching Save & test.
      if (error.code === "auth") {
        keyStore.reject({ deleteSavedKey: error.httpStatus === 401 });
      }
    }
    throw error;
  }
}

export function saveAndTestKey(
  value: string,
  model: Model,
  options: { signal?: AbortSignal; timeoutMs?: number } = {},
) {
  return verifier.saveAndTest(value, model, options);
}

export function testSavedKey(
  model: Model,
  options: { signal?: AbortSignal; timeoutMs?: number } = {},
) {
  return verifier.testSaved(model, options);
}

export function errorKey(error: unknown): string {
  if (isProviderError(error)) {
    switch (error.code) {
      case "no-key": return "lab.err.noKey";
      case "auth": return "lab.err.badKey";
      case "credit": return "lab.err.noCredit";
      case "rate-limit": return "lab.err.busy";
      case "network":
      case "timeout": return "lab.err.network";
      case "aborted": return "lab.err.cancelled";
      case "provider": return error.httpStatus && error.httpStatus >= 500
        ? "lab.err.busy"
        : "lab.err.generic";
      case "invalid-response":
      case "empty-response": return "lab.err.content";
    }
  }
  return "lab.err.generic";
}
