export type Model = "deepseek-v4-flash" | "deepseek-v4-pro";

export interface Msg {
  role: "system" | "user" | "assistant";
  content: string;
}

/** The complete, explicit contract for one paid chat-completion request. */
export interface CallOptions {
  model: Model;
  json?: boolean;
  maxTokens: number;
  temperature?: number;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface Usage {
  promptTokens: number;
  promptCacheHitTokens: number;
  promptCacheMissTokens: number;
  completionTokens: number;
}

export type BillingState =
  | "not-sent"
  | "usage-confirmed"
  | "provider-rejected-no-usage"
  | "unknown-after-send";

export interface CallResult {
  text: string;
  requestedModel: Model;
  responseModel?: string;
  finishReason?: string;
  systemFingerprint?: string;
  createdAt?: number;
  usage?: Usage;
  /**
   * A successful HTTP response can still have unknown billing when the
   * provider omits usage. Keeping that state on the result prevents UI code
   * from silently presenting an unknown charge as $0.
   */
  billing: Extract<BillingState, "usage-confirmed" | "unknown-after-send">;
}

export type ProviderErrorCode =
  | "no-key"
  | "auth"
  | "credit"
  | "rate-limit"
  | "network"
  | "timeout"
  | "aborted"
  | "provider"
  | "invalid-response"
  | "empty-response";

export interface ProviderErrorInit {
  billing: BillingState;
  httpStatus?: number;
  usage?: Usage;
  requestedModel?: Model;
  responseModel?: string;
  finishReason?: string;
  systemFingerprint?: string;
  createdAt?: number;
  cause?: unknown;
}

export class ProviderError extends Error {
  readonly code: ProviderErrorCode;
  readonly billing: BillingState;
  readonly httpStatus?: number;
  readonly usage?: Usage;
  readonly requestedModel?: Model;
  readonly responseModel?: string;
  readonly finishReason?: string;
  readonly systemFingerprint?: string;
  readonly createdAt?: number;

  constructor(code: ProviderErrorCode, message: string, init: ProviderErrorInit) {
    super(message, init.cause === undefined ? undefined : { cause: init.cause });
    this.name = "ProviderError";
    this.code = code;
    this.billing = init.billing;
    this.httpStatus = init.httpStatus;
    this.usage = init.usage;
    this.requestedModel = init.requestedModel;
    this.responseModel = init.responseModel;
    this.finishReason = init.finishReason;
    this.systemFingerprint = init.systemFingerprint;
    this.createdAt = init.createdAt;
  }
}

export function isProviderError(error: unknown): error is ProviderError {
  return error instanceof ProviderError;
}

export type KeyStatus =
  | "empty"
  | "saved-unverified"
  | "verifying"
  | "verified"
  | "rejected"
  | "unreachable";
