import type { ModelListOptions } from "./client";
import type { KeyStore } from "./key-store";
import { ProviderError, isProviderError, type Model } from "./types";

export interface KeyTestResult {
  models: string[];
  selectedModel: Model;
  selectedModelVisible: true;
  /** GET /models verifies credentials and visibility, never account balance. */
  balanceVerified: false;
}

export interface KeyVerifier {
  saveAndTest(value: string, model: Model, options?: ModelListOptions): Promise<KeyTestResult>;
  testSaved(model: Model, options?: ModelListOptions): Promise<KeyTestResult>;
}

export function createKeyVerifier(
  store: KeyStore,
  listModels: (options?: ModelListOptions) => Promise<string[]>,
): KeyVerifier {
  async function testSaved(model: Model, options?: ModelListOptions): Promise<KeyTestResult> {
    const attempt = store.beginVerification();
    if (!attempt) {
      throw new ProviderError("no-key", "No API key is saved in this tab.", {
        billing: "not-sent",
        requestedModel: model,
      });
    }

    try {
      // Exactly one credential check. There is intentionally no retry here.
      const models = await listModels(options);
      if (!models.includes(model)) {
        throw new ProviderError("provider", `The selected model ${model} is not visible to this key.`, {
          billing: "provider-rejected-no-usage",
          requestedModel: model,
        });
      }
      if (!store.finishVerification(attempt, "verified")) {
        throw new ProviderError("aborted", "This key check was superseded.", {
          billing: "unknown-after-send",
          requestedModel: model,
        });
      }
      return {
        models,
        selectedModel: model,
        selectedModelVisible: true,
        balanceVerified: false,
      };
    } catch (error) {
      if (isProviderError(error)) {
        if (error.code === "network" || error.code === "timeout" || error.code === "aborted") {
          store.finishVerification(attempt, "unreachable");
        } else if (error.code === "auth" && error.httpStatus === 401) {
          // A confirmed 401 must not leave a rejected credential in storage.
          store.finishVerification(attempt, "rejected", { deleteSavedKey: true });
        } else {
          store.finishVerification(attempt, "rejected");
        }
        throw error;
      }
      store.finishVerification(attempt, "unreachable");
      throw new ProviderError("network", "The provider could not be reached.", {
        billing: "unknown-after-send",
        requestedModel: model,
        cause: error,
      });
    }
  }

  return {
    async saveAndTest(value, model, options) {
      if (!store.save(value)) {
        throw new ProviderError("no-key", "The key could not be saved in this tab.", {
          billing: "not-sent",
          requestedModel: model,
        });
      }
      return testSaved(model, options);
    },
    testSaved,
  };
}
