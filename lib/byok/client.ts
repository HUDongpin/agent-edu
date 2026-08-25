import { asJSON } from "./json";
import {
  ProviderError,
  type BillingState,
  type CallOptions,
  type CallResult,
  type Model,
  type Msg,
  type ProviderErrorCode,
  type Usage,
} from "./types";

export const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
export const DEEPSEEK_CHAT_ENDPOINT = `${DEEPSEEK_BASE_URL}/chat/completions`;
export const DEEPSEEK_MODELS_ENDPOINT = `${DEEPSEEK_BASE_URL}/models`;

/**
 * Browser-side resource limits for every Provider call path.
 *
 * `String.length` deliberately matches the UTF-16 units enforced by an HTML
 * `maxLength`; UTF-8 limits are checked separately so non-ASCII input cannot
 * consume an unbounded request body. The aggregate limits also bound JSON
 * serialization overhead by capping the number of message records.
 */
export const MAX_PROVIDER_MESSAGES = 64;
export const MAX_PROVIDER_MESSAGE_CHARACTERS = 32_000;
export const MAX_PROVIDER_MESSAGE_UTF8_BYTES = 80 * 1024;
export const MAX_PROVIDER_MESSAGES_CHARACTERS = 64_000;
export const MAX_PROVIDER_MESSAGES_UTF8_BYTES = 160 * 1024;
export const MAX_PROVIDER_RESPONSE_BYTES = 256 * 1024;

export interface ModelListOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface DeepSeekClient {
  call(messages: Msg[], options: CallOptions): Promise<CallResult>;
  listModels(options?: ModelListOptions): Promise<string[]>;
}

export interface DeepSeekClientDependencies {
  getApiKey: () => string;
  fetchImpl?: typeof fetch;
}

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : undefined;
}

function count(value: unknown): number | undefined {
  return Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : undefined;
}

/** Missing or inconsistent cache fields are conservatively all cache misses. */
export function usageFromResponse(body: unknown): Usage | undefined {
  const usage = record(record(body)?.usage);
  if (!usage) return undefined;
  const promptTokens = count(usage.prompt_tokens);
  const completionTokens = count(usage.completion_tokens);
  if (promptTokens === undefined || completionTokens === undefined) return undefined;

  const cacheHit = count(usage.prompt_cache_hit_tokens);
  const cacheMiss = count(usage.prompt_cache_miss_tokens);
  const hasCompleteSplit = cacheHit !== undefined
    && cacheMiss !== undefined
    && cacheHit + cacheMiss === promptTokens;

  return {
    promptTokens,
    promptCacheHitTokens: hasCompleteSplit ? cacheHit : 0,
    promptCacheMissTokens: hasCompleteSplit ? cacheMiss : promptTokens,
    completionTokens,
  };
}

function stringField(body: unknown, key: string): string | undefined {
  const value = record(body)?.[key];
  return typeof value === "string" ? value : undefined;
}

function numberField(body: unknown, key: string): number | undefined {
  const value = record(body)?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function choiceFrom(body: unknown): JsonRecord | undefined {
  const choices = record(body)?.choices;
  return Array.isArray(choices) ? record(choices[0]) : undefined;
}

function responseMetadata(body: unknown, requestedModel: Model) {
  const choice = choiceFrom(body);
  return {
    requestedModel,
    responseModel: stringField(body, "model"),
    finishReason: typeof choice?.finish_reason === "string" ? choice.finish_reason : undefined,
    systemFingerprint: stringField(body, "system_fingerprint"),
    createdAt: numberField(body, "created"),
    usage: usageFromResponse(body),
  };
}

function codeForStatus(status: number): ProviderErrorCode {
  if (status === 401 || status === 403) return "auth";
  if (status === 402) return "credit";
  if (status === 429) return "rate-limit";
  return "provider";
}

function safeProviderMessage(status: number): string {
  // A provider-controlled error body can reflect the submitted prompt,
  // credentials, upstream request details, or arbitrary HTML. Keep the
  // diagnostic local and typed; the UI localizes the actionable category.
  return `Provider returned HTTP ${status}.`;
}

interface AbortScope {
  signal: AbortSignal;
  didTimeout: () => boolean;
  abort: (reason?: unknown) => void;
  cleanup: () => void;
}

function abortScope(external: AbortSignal | undefined, timeoutMs: number | undefined): AbortScope {
  const controller = new AbortController();
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const forwardAbort = () => controller.abort(external?.reason);
  if (external?.aborted) forwardAbort();
  else external?.addEventListener("abort", forwardAbort, { once: true });

  if (timeoutMs !== undefined) {
    timer = setTimeout(() => {
      timedOut = true;
      controller.abort(new DOMException("Request timed out", "TimeoutError"));
    }, timeoutMs);
  }

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    abort: (reason?: unknown) => controller.abort(reason),
    cleanup: () => {
      if (timer !== undefined) clearTimeout(timer);
      external?.removeEventListener("abort", forwardAbort);
    },
  };
}

function validateTimeout(timeoutMs: number | undefined): void {
  if (timeoutMs !== undefined && (!Number.isFinite(timeoutMs) || timeoutMs <= 0)) {
    throw new ProviderError("provider", "timeoutMs must be a positive number.", {
      billing: "not-sent",
    });
  }
}

function validateCall(messages: Msg[], options: CallOptions): Msg[] {
  validateTimeout(options.timeoutMs);
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new ProviderError("provider", "At least one message is required.", {
      billing: "not-sent",
      requestedModel: options.model,
    });
  }
  const messageCount = messages.length;
  if (messageCount > MAX_PROVIDER_MESSAGES) {
    throw new ProviderError("provider", `At most ${MAX_PROVIDER_MESSAGES} messages may be sent at once.`, {
      billing: "not-sent",
      requestedModel: options.model,
    });
  }

  let totalCharacters = 0;
  let totalUtf8Bytes = 0;
  const encoder = new TextEncoder();
  const validatedMessages: Msg[] = [];
  // Iterate only the already bounded length and copy the approved fields.
  // That keeps custom iterators, extra object fields, and later mutations out
  // of the serialized request body.
  for (let index = 0; index < messageCount; index++) {
    const message: unknown = messages[index];
    if (
      message === null
      || typeof message !== "object"
    ) {
      throw new ProviderError("provider", "Every message must have a supported role and text content.", {
        billing: "not-sent",
        requestedModel: options.model,
      });
    }
    const candidate = message as Record<string, unknown>;
    const role = candidate.role;
    const content = candidate.content;
    if (
      (role !== "system" && role !== "user" && role !== "assistant")
      || typeof content !== "string"
    ) {
      throw new ProviderError("provider", "Every message must have a supported role and text content.", {
        billing: "not-sent",
        requestedModel: options.model,
      });
    }

    const characters = content.length;
    if (characters > MAX_PROVIDER_MESSAGE_CHARACTERS) {
      throw new ProviderError(
        "provider",
        `A message exceeded the ${MAX_PROVIDER_MESSAGE_CHARACTERS}-character safety limit.`,
        { billing: "not-sent", requestedModel: options.model },
      );
    }
    totalCharacters += characters;
    if (totalCharacters > MAX_PROVIDER_MESSAGES_CHARACTERS) {
      throw new ProviderError(
        "provider",
        `The messages exceeded the ${MAX_PROVIDER_MESSAGES_CHARACTERS}-character safety limit.`,
        { billing: "not-sent", requestedModel: options.model },
      );
    }

    const utf8Bytes = encoder.encode(content).byteLength;
    if (utf8Bytes > MAX_PROVIDER_MESSAGE_UTF8_BYTES) {
      throw new ProviderError(
        "provider",
        `A message exceeded the ${MAX_PROVIDER_MESSAGE_UTF8_BYTES}-byte UTF-8 safety limit.`,
        { billing: "not-sent", requestedModel: options.model },
      );
    }
    totalUtf8Bytes += utf8Bytes;
    if (totalUtf8Bytes > MAX_PROVIDER_MESSAGES_UTF8_BYTES) {
      throw new ProviderError(
        "provider",
        `The messages exceeded the ${MAX_PROVIDER_MESSAGES_UTF8_BYTES}-byte UTF-8 safety limit.`,
        { billing: "not-sent", requestedModel: options.model },
      );
    }
    validatedMessages.push({ role, content });
  }

  if (!Number.isSafeInteger(options.maxTokens) || options.maxTokens <= 0) {
    throw new ProviderError("provider", "maxTokens must be a positive integer.", {
      billing: "not-sent",
      requestedModel: options.model,
    });
  }
  if (options.temperature !== undefined
    && (!Number.isFinite(options.temperature) || options.temperature < 0 || options.temperature > 2)) {
    throw new ProviderError("provider", "temperature must be between 0 and 2.", {
      billing: "not-sent",
      requestedModel: options.model,
    });
  }
  return validatedMessages;
}

type ResponseBody =
  | { kind: "json"; value: unknown }
  | { kind: "empty"; value: undefined }
  | { kind: "invalid-json"; value: undefined };

function responseSizeError(response: Response, requestedModel?: Model): ProviderError {
  return new ProviderError("invalid-response", "The provider response exceeded the safe size limit.", {
    billing: "unknown-after-send",
    requestedModel,
    httpStatus: response.status,
  });
}

function declaredContentLength(response: Response): number | undefined {
  const value = response.headers.get("content-length")?.trim();
  if (!value || !/^\d+$/.test(value)) return undefined;
  const length = Number(value);
  return Number.isSafeInteger(length) ? length : Number.POSITIVE_INFINITY;
}

function cancelWithoutWaiting(stream: ReadableStream<Uint8Array> | null): void {
  if (!stream) return;
  // Cancellation is best-effort and must not turn a bounded failure into a
  // hang if a custom fetch implementation returns a broken stream.
  void stream.cancel().catch(() => undefined);
}

async function responseBody(
  response: Response,
  requestedModel: Model | undefined,
  abort: (reason?: unknown) => void,
): Promise<ResponseBody> {
  const declaredBytes = declaredContentLength(response);
  if (declaredBytes !== undefined && declaredBytes > MAX_PROVIDER_RESPONSE_BYTES) {
    cancelWithoutWaiting(response.body);
    abort(new DOMException("Provider response exceeded the safe size limit", "AbortError"));
    throw responseSizeError(response, requestedModel);
  }

  let raw = "";
  if (response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let receivedBytes = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        receivedBytes += value.byteLength;
        if (receivedBytes > MAX_PROVIDER_RESPONSE_BYTES) {
          void reader.cancel().catch(() => undefined);
          abort(new DOMException("Provider response exceeded the safe size limit", "AbortError"));
          throw responseSizeError(response, requestedModel);
        }
        raw += decoder.decode(value, { stream: true });
      }
      raw += decoder.decode();
    } finally {
      reader.releaseLock();
    }
  }

  if (!raw.trim()) return { kind: "empty", value: undefined };
  try {
    return { kind: "json", value: JSON.parse(raw) as unknown };
  } catch {
    return { kind: "invalid-json", value: undefined };
  }
}

function billingForUsage(usage: Usage | undefined): Extract<BillingState, "usage-confirmed" | "unknown-after-send"> {
  return usage ? "usage-confirmed" : "unknown-after-send";
}

export function createDeepSeekClient({
  getApiKey,
  fetchImpl,
}: DeepSeekClientDependencies): DeepSeekClient {
  function fetcher(): typeof fetch {
    const implementation = fetchImpl ?? globalThis.fetch;
    if (!implementation) {
      throw new ProviderError("network", "Fetch is unavailable in this browser.", {
        billing: "not-sent",
      });
    }
    return implementation.bind(globalThis);
  }

  async function request(
    url: string,
    init: RequestInit,
    signal: AbortSignal | undefined,
    timeoutMs: number | undefined,
    requestedModel?: Model,
  ): Promise<{ response: Response; body: unknown; bodyKind: ResponseBody["kind"] }> {
    validateTimeout(timeoutMs);
    if (signal?.aborted) {
      throw new ProviderError("aborted", "Request stopped before it was sent.", {
        billing: "not-sent",
        requestedModel,
      });
    }

    const scope = abortScope(signal, timeoutMs);
    let dispatched = false;
    try {
      // Calling fetch is the observable dispatch boundary. There is no retry
      // loop here: one user action creates at most one network request.
      dispatched = true;
      const response = await fetcher()(url, { ...init, signal: scope.signal });
      const parsed = await responseBody(response, requestedModel, scope.abort);
      return { response, body: parsed.value, bodyKind: parsed.kind };
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      const billing = dispatched ? "unknown-after-send" : "not-sent";
      if (scope.didTimeout()) {
        throw new ProviderError("timeout", "The provider request timed out.", {
          billing,
          requestedModel,
          cause: error,
        });
      }
      if (scope.signal.aborted || signal?.aborted) {
        throw new ProviderError("aborted", "The provider request was stopped.", {
          billing,
          requestedModel,
          cause: error,
        });
      }
      throw new ProviderError("network", "The provider could not be reached.", {
        billing,
        requestedModel,
        cause: error,
      });
    } finally {
      scope.cleanup();
    }
  }

  function requireKey(requestedModel?: Model): string {
    const key = getApiKey().trim();
    if (!key) {
      throw new ProviderError("no-key", "No API key is saved in this tab.", {
        billing: "not-sent",
        requestedModel,
      });
    }
    return key;
  }

  return {
    async call(messages, options) {
      const validatedMessages = validateCall(messages, options);
      const key = requireKey(options.model);
      const payload: Record<string, unknown> = {
        model: options.model,
        max_tokens: options.maxTokens,
        messages: validatedMessages,
        thinking: { type: "disabled" },
      };
      if (options.json) payload.response_format = { type: "json_object" };
      if (options.temperature !== undefined) payload.temperature = options.temperature;

      const { response, body, bodyKind } = await request(
        DEEPSEEK_CHAT_ENDPOINT,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify(payload),
          cache: "no-store",
          credentials: "omit",
          referrerPolicy: "no-referrer",
          redirect: "error",
        },
        options.signal,
        options.timeoutMs,
        options.model,
      );

      const metadata = responseMetadata(body, options.model);
      if (!response.ok) {
        throw new ProviderError(codeForStatus(response.status), safeProviderMessage(response.status), {
          ...metadata,
          billing: metadata.usage ? "usage-confirmed" : "provider-rejected-no-usage",
          httpStatus: response.status,
        });
      }
      if (bodyKind === "empty") {
        throw new ProviderError("empty-response", "The provider returned an empty answer.", {
          ...metadata,
          billing: "unknown-after-send",
          httpStatus: response.status,
        });
      }
      if (bodyKind !== "json") {
        throw new ProviderError("invalid-response", "The provider returned a non-JSON response.", {
          ...metadata,
          billing: "unknown-after-send",
          httpStatus: response.status,
        });
      }

      const choice = choiceFrom(body);
      const message = record(choice?.message);
      const content = message?.content;
      const billing = billingForUsage(metadata.usage);
      if (typeof content !== "string" || !content.trim()) {
        throw new ProviderError("empty-response", "The provider returned an empty answer.", {
          ...metadata,
          billing,
          httpStatus: response.status,
        });
      }
      if (metadata.finishReason === "length") {
        throw new ProviderError("invalid-response", "The answer was truncated at the output limit.", {
          ...metadata,
          billing,
          httpStatus: response.status,
        });
      }
      if (options.json) {
        try {
          asJSON(content);
        } catch (error) {
          throw new ProviderError("invalid-response", "The provider answer was not valid JSON.", {
            ...metadata,
            billing,
            httpStatus: response.status,
            cause: error,
          });
        }
      }

      return { text: content, ...metadata, billing };
    },

    async listModels(options = {}) {
      const key = requireKey();
      const { response, body } = await request(
        DEEPSEEK_MODELS_ENDPOINT,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${key}` },
          cache: "no-store",
          credentials: "omit",
          referrerPolicy: "no-referrer",
          redirect: "error",
        },
        options.signal,
        options.timeoutMs,
      );

      if (!response.ok) {
        throw new ProviderError(codeForStatus(response.status), safeProviderMessage(response.status), {
          billing: "provider-rejected-no-usage",
          httpStatus: response.status,
        });
      }
      const data = record(body)?.data;
      const models = Array.isArray(data)
        ? data.map((item) => record(item)?.id).filter((id): id is string => typeof id === "string")
        : [];
      if (models.length === 0) {
        throw new ProviderError("invalid-response", "The provider returned no visible model IDs.", {
          billing: "unknown-after-send",
          httpStatus: response.status,
        });
      }
      return models;
    },
  };
}
