/**
 * The one place this course talks to a model.
 *
 * Everything else imports from here. Three reasons:
 *
 * 1.  When the SDK or a model id changes, exactly one file needs editing.
 * 2.  It gives us a seam for --offline, so someone without an API key can
 *     still run all nine guided stages (0–8); Stage 9 is the transfer project.
 * 3.  It gives us a seam for *which vendor*. This course runs on DeepSeek or
 *     on Anthropic's Claude, and not one line of any stage changes between
 *     them. Swapping the model underneath your system without rewriting the
 *     system is a real thing you will want to do, and the only reason it is
 *     cheap here is that every call goes through this file.
 *
 * Read this file. It is the whole "how do I call a model" answer that the
 * rest of the course takes for granted.
 *
 *     export DEEPSEEK_API_KEY=sk-...        # then just run any stage
 *     export ANTHROPIC_API_KEY=sk-ant-...   # or this one
 *     export CAFE_PROVIDER=deepseek         # only needed if you have both
 */

import Anthropic from "@anthropic-ai/sdk";
import Ajv, { type ValidateFunction } from "ajv";
import { DEEPSEEK_PRICING, priceBandAt } from "../../lib/byok/pricing";
import { createOfflineClient, offlineText } from "./offline";
import {
  EMPTY_COURSE_USAGE_LEDGER,
  priceAnthropicCourseUsage,
  priceDeepSeekCourseUsage,
  recordCourseUsage,
} from "./pricing";

/** --offline anywhere on the command line uses the deterministic local stand-in. */
export const OFFLINE = process.argv.includes("--offline");

/* ---------------------------------------------------------------------------
 * Providers
 * ---------------------------------------------------------------------------
 * DeepSeek publishes an Anthropic-compatible endpoint, so the official SDK
 * drives it with nothing but a different baseURL. That is why stages 5 and 6
 * — which build raw tool_use / tool_result blocks by hand — work unchanged on
 * both. The differences that remain are listed in `quirks`, and every one of
 * them is handled in this file.
 */

interface Provider {
  label: string;
  env: string;
  baseURL: string;
  model: string;
  quirks: { jsonSchema: boolean };
  help: string;
}

export const PROVIDERS: Record<string, Provider> = {
  anthropic: {
    label: "Anthropic",
    env: "ANTHROPIC_API_KEY",
    baseURL: "https://api.anthropic.com",
    model: "claude-opus-5",
    quirks: { jsonSchema: true },
    help: "https://console.anthropic.com/settings/keys",
  },
  deepseek: {
    label: "DeepSeek",
    env: "DEEPSEEK_API_KEY",
    baseURL: "https://api.deepseek.com/anthropic",
    model: "deepseek-v4-flash",
    // Flash and Pro pricing come from lib/byok/pricing.ts, the same dated
    // source used by the browser Lab. Keeping one snapshot prevents the CLI
    // from silently pricing a CAFE_MODEL=deepseek-v4-pro run as Flash.
    // DeepSeek's Anthropic-format documentation currently supports only
    // `effort` inside output_config, not `format`. The course therefore asks
    // for JSON in the prompt, parses it and validates every constraint in the
    // supplied draft-7-compatible Schema locally before returning the result.
    quirks: { jsonSchema: false },
    help: "https://platform.deepseek.com/api_keys",
  },
};

function pickProvider(): string {
  const chosen = (process.env.CAFE_PROVIDER ?? "").trim().toLowerCase();
  if (chosen) {
    if (!Object.hasOwn(PROVIDERS, chosen)) {
      throw new Error(
        `\n  CAFE_PROVIDER must be one of: ${Object.keys(PROVIDERS).join(", ")}\n`,
      );
    }
    return chosen;
  }

  const configured = Object.entries(PROVIDERS)
    .filter(([, cfg]) => Boolean(process.env[cfg.env]?.trim()))
    .map(([name]) => name);
  if (configured.length > 1) {
    throw new Error(
      "\n  Both ANTHROPIC_API_KEY and DEEPSEEK_API_KEY are set. " +
      "Choose the Provider explicitly with either:\n\n" +
      "    CAFE_PROVIDER=deepseek\n" +
      "    CAFE_PROVIDER=anthropic\n",
    );
  }
  if (configured.length === 1) return configured[0];
  return "deepseek"; // the course's deterministic no-key default; preflight
                     // explains the missing-key boundary before a live run
}

export const PROVIDER = pickProvider();
const CFG = PROVIDERS[PROVIDER];

if (!OFFLINE && process.env.ANTHROPIC_CUSTOM_HEADERS?.trim()) {
  throw new Error("ANTHROPIC_CUSTOM_HEADERS is not supported by this course runtime.");
}

/** One line to change for a different model; CAFE_MODEL overrides without editing. */
function looksLikeHighConfidenceSecret(value: string): boolean {
  if (/(?:^|[^A-Za-z0-9])sk[-_][A-Za-z0-9_-]{8,}/i.test(value)) return true;
  if (/(?:^|[^A-Za-z0-9])gh[pousr]_[A-Za-z0-9]{12,}/i.test(value)) return true;
  if (/(?:^|[^A-Za-z0-9])AKIA[A-Z0-9]{16}(?:$|[^A-Z0-9])/.test(value)) return true;
  if (/(?:^|[^A-Za-z0-9])AIza[A-Za-z0-9_-]{20,}/.test(value)) return true;
  if (/(?:^|[^A-Za-z0-9])(?:gsk_|xai-)[A-Za-z0-9_-]{12,}/i.test(value)) return true;
  if (/\bBearer\s+\S{8,}/i.test(value)) return true;
  if (/-----BEGIN [A-Z ]*PRIVATE KEY-----/i.test(value)) return true;
  if (/^[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{8,}$/.test(value)) return true;

  const token = value.match(/[A-Za-z0-9+/=_-]{40,}/)?.[0];
  if (!token) return false;
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/]
    .filter((pattern) => pattern.test(token)).length;
  return classes >= 3 && new Set(token).size >= 16;
}

function publicModelIdentifier(value: string | undefined, fallback: string): string {
  const candidate = (value ?? "").trim();
  if (!candidate) return fallback;
  if (
    !/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,159}$/.test(candidate)
    || looksLikeHighConfidenceSecret(candidate)
  ) {
    throw new Error("CAFE_MODEL is not a safe public model identifier.");
  }
  return candidate;
}

export const MODEL = publicModelIdentifier(process.env.CAFE_MODEL, CFG.model);

/**
 * Effort: low | medium | high | xhigh | max. The course defaults to "low"
 * because these are small, well-specified tasks and you pay per token. Raise
 * it and watch the eval score in stage 3 — that is the point of having one.
 *
 * DeepSeek's Anthropic-compatible endpoint exposes the same field but supports
 * a smaller set of values, so tuning() applies the documented mapping there.
 */
const COURSE_EFFORTS = ["low", "medium", "high", "xhigh", "max"] as const;
export type CourseEffort = typeof COURSE_EFFORTS[number];

function parseEffort(value: string, label: string): CourseEffort {
  const candidate = value.trim();
  if ((COURSE_EFFORTS as readonly string[]).includes(candidate)) {
    return candidate as CourseEffort;
  }
  throw new Error(
    `${label} must be one of: ${COURSE_EFFORTS.join(", ")}.`,
  );
}

export const EFFORT = parseEffort(
  (process.env.CAFE_EFFORT ?? "").trim() || "low",
  "CAFE_EFFORT",
);

let spent = { ...EMPTY_COURSE_USAGE_LEDGER };
let client: Anthropic | null = null;

export function getClient(): Anthropic {
  if (!client) {
    client = OFFLINE
      ? createOfflineClient() as unknown as Anthropic
      : new Anthropic({
          baseURL: CFG.baseURL,
          apiKey: (process.env[CFG.env] ?? "").trim(),
          authToken: null,
          credentials: null,
          config: null,
          profile: null,
          webhookKey: null,
          maxRetries: 0,
          logLevel: "off",
        });
  }
  return client;
}

/**
 * The vendor-specific knobs for "how hard should it think?".
 * Stages 5 and 6 spread this into their own messages.create calls, which is
 * how they stay provider-neutral without knowing any of this.
 */
export function tuning(effort: string = EFFORT): Record<string, unknown> {
  const checked = parseEffort(effort, "effort");
  if (PROVIDER === "deepseek") {
    const mapped: Record<CourseEffort, "low" | "high" | "max"> = {
      low: "low",
      medium: "high",
      high: "high",
      xhigh: "high",
      max: "max",
    };
    return { output_config: { effort: mapped[checked] } };
  }
  return { output_config: { effort: checked } };
}

/* ---------------- prompted JSON fallback for compatibility --------------- */

const AJV_OPTIONS = {
  strict: true,
  allErrors: true,
  ownProperties: true,
  coerceTypes: false,
  removeAdditional: false,
  useDefaults: false,
} as const;

interface PreparedSchema {
  snapshot: string;
  schema: object;
  validator: ValidateFunction<unknown>;
}

const validators = new WeakMap<object, PreparedSchema>();

function invalidSchema(): never {
  // Do not include the Schema or Ajv's diagnostic in the thrown message:
  // Schemas can be assembled from application-specific names or examples.
  throw new Error("The supplied JSON Schema is invalid.");
}

function canonicalSchemaValue(value: unknown, ancestors: Set<object>): unknown {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) invalidSchema();
    return value;
  }
  if (typeof value !== "object") invalidSchema();
  if (ancestors.has(value)) invalidSchema();
  ancestors.add(value);

  try {
    if (Array.isArray(value)) {
      return Array.from({ length: value.length }, (_, index) => {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (!descriptor || !("value" in descriptor)) return invalidSchema();
        return canonicalSchemaValue(descriptor.value, ancestors);
      });
    }

    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) invalidSchema();
    const canonical = Object.create(null) as Record<string, unknown>;
    for (const key of Object.keys(value).sort()) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !("value" in descriptor)) invalidSchema();
      canonical[key] = canonicalSchemaValue(descriptor.value, ancestors);
    }
    return canonical;
  } finally {
    ancestors.delete(value);
  }
}

const PROTO_PROPERTY_PATTERN = "^__proto__$(?![\\s\\S])";

/**
 * Ajv 8's `properties` code path omits an own `__proto__` key internally.
 * Rewrite only the immutable compile clone to the equivalent exact
 * patternProperties constraint; the caller's Schema and snapshot stay intact.
 */
function preserveSpecialPropertySchemas(value: unknown): void {
  if (Array.isArray(value)) {
    for (const item of value) preserveSpecialPropertySchemas(item);
    return;
  }
  if (value === null || typeof value !== "object") return;

  const schema = value as Record<string, unknown>;
  const properties = schema.properties;
  if (
    properties !== null
    && typeof properties === "object"
    && !Array.isArray(properties)
    && Object.hasOwn(properties, "__proto__")
  ) {
    const propertySchemas = properties as Record<string, unknown>;
    let patternProperties = schema.patternProperties;
    if (patternProperties === undefined) {
      patternProperties = Object.create(null) as Record<string, unknown>;
      schema.patternProperties = patternProperties;
    }
    if (
      patternProperties !== null
      && typeof patternProperties === "object"
      && !Array.isArray(patternProperties)
    ) {
      const protoSchema = propertySchemas.__proto__;
      delete propertySchemas.__proto__;
      const patterns = patternProperties as Record<string, unknown>;
      if (Object.hasOwn(patterns, PROTO_PROPERTY_PATTERN)) {
        patterns[PROTO_PROPERTY_PATTERN] = {
          allOf: [patterns[PROTO_PROPERTY_PATTERN], protoSchema],
        };
      } else {
        patterns[PROTO_PROPERTY_PATTERN] = protoSchema;
      }
    }
    // A malformed existing patternProperties value remains untouched for Ajv
    // to reject; never hide one invalid Schema feature while fixing another.
  }

  for (const keyword of ["properties", "patternProperties", "definitions", "$defs"]) {
    const map = schema[keyword];
    if (map === null || typeof map !== "object" || Array.isArray(map)) continue;
    for (const key of Object.keys(map)) {
      preserveSpecialPropertySchemas((map as Record<string, unknown>)[key]);
    }
  }
  for (const keyword of [
    "additionalItems",
    "additionalProperties",
    "contains",
    "propertyNames",
    "not",
    "if",
    "then",
    "else",
  ]) {
    preserveSpecialPropertySchemas(schema[keyword]);
  }
  preserveSpecialPropertySchemas(schema.items);
  for (const keyword of ["allOf", "anyOf", "oneOf"]) {
    const schemas = schema[keyword];
    if (Array.isArray(schemas)) {
      for (const child of schemas) preserveSpecialPropertySchemas(child);
    }
  }
  const dependencies = schema.dependencies;
  if (dependencies !== null && typeof dependencies === "object" && !Array.isArray(dependencies)) {
    for (const key of Object.keys(dependencies)) {
      const dependency = (dependencies as Record<string, unknown>)[key];
      if (!Array.isArray(dependency)) preserveSpecialPropertySchemas(dependency);
    }
  }
}

function prepareSchema(schema: object): PreparedSchema {
  let snapshot: string;
  try {
    snapshot = JSON.stringify(canonicalSchemaValue(schema, new Set<object>()));
  } catch {
    return invalidSchema();
  }
  const cached = validators.get(schema);
  if (cached?.snapshot === snapshot) return cached;

  try {
    // Compile an immutable JSON clone. Ajv also caches by object identity, so
    // recompiling the caller's mutated object could otherwise reuse stale code.
    const compiledSchema = JSON.parse(snapshot) as object;
    preserveSpecialPropertySchemas(compiledSchema);
    const prepared = {
      snapshot,
      schema: compiledSchema,
      validator: new Ajv(AJV_OPTIONS).compile(compiledSchema),
    };
    validators.set(schema, prepared);
    return prepared;
  } catch {
    return invalidSchema();
  }
}

function schemaFallback(system: string | undefined, schema: object): string {
  /* Supported Claude models use constrained decoding, with documented
     exceptions such as refusals and max_tokens truncation. DeepSeek's
     Anthropic-format interface does not support output_config.format, so this
     path prompts for JSON and validates the result locally against every
     constraint in the same draft-7-compatible Schema before it reaches code.
     Instructions last, because the end of a prompt has the most pull. */
  const demand =
    "Reply with a single JSON object and nothing else. No prose, no " +
    "explanation, no ``` fence. It must validate against this JSON Schema:\n" +
    JSON.stringify(schema, null, 1);
  return system ? `${system}\n\n${demand}` : demand;
}

const FENCE = /```(?:json)?\s*([\s\S]*?)\s*```/;

export function extractJSON<T>(
  text: string,
  schema: object,
): T {
  return extractValidatedJSON<T>(text, prepareSchema(schema).validator);
}

function extractValidatedJSON<T>(
  text: string,
  validator: ValidateFunction<unknown>,
): T {
  let candidate = text.trim();
  const fenced = FENCE.exec(candidate);
  if (fenced) candidate = fenced[1].trim();

  let data: unknown;
  try {
    data = JSON.parse(candidate) as unknown;
  } catch {
    const a = candidate.indexOf("{");
    const b = candidate.lastIndexOf("}");
    if (a === -1 || b <= a) {
      throw new Error("The model response did not contain a JSON object.");
    }
    try {
      data = JSON.parse(candidate.slice(a, b + 1)) as unknown;
    } catch {
      throw new Error("The model response was not valid JSON.");
    }
  }
  if (!validator(data)) {
    // The validation result is intentionally fail-closed without echoing model
    // output, schema property names, or values into a loggable error message.
    throw new Error("The model response did not match the requested JSON Schema.");
  }
  return data as T;
}

/* ------------------------------ the two calls --------------------------- */

export interface AskOptions {
  system?: string;
  schema?: { required?: readonly string[] } & object;
  effort?: string;
  maxTokens?: number;
  variant?: number;
}

export async function ask(prompt: string, opts?: AskOptions): Promise<string>;
export async function ask<T>(prompt: string, opts: AskOptions & { schema: object }): Promise<T>;
export async function ask<T>(prompt: string, opts: AskOptions = {}): Promise<string | T> {
  const { schema, effort = EFFORT, maxTokens = 2000, variant = 0 } = opts;
  // Validate both local controls before constructing the SDK client or making
  // a request. An invalid Schema or effort therefore cannot consume tokens.
  const checkedEffort = parseEffort(effort, "effort");
  const preparedSchema = schema ? prepareSchema(schema) : undefined;
  let system = opts.system;

  const nativeSchema = !!preparedSchema && CFG.quirks.jsonSchema;
  if (preparedSchema && !nativeSchema) {
    system = schemaFallback(system, preparedSchema.schema);
  }

  const request: Record<string, unknown> = {
    model: MODEL,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
    ...tuning(checkedEffort),
  };
  if (system) request.system = system;
  if (nativeSchema) {
    request.output_config = {
      ...(request.output_config as object ?? {}),
      format: { type: "json_schema", schema: preparedSchema.schema },
    };
  }

  let text: string;

  if (OFFLINE) {
    text = offlineText(prompt, { system, schema: preparedSchema?.schema, variant });
  } else {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const response: any = await getClient().messages.create(request as any);
    // Meter every HTTP-success response before interpreting its content. A
    // refusal can still consume billable input/output tokens.
    meter(response);

    // A declined request is a normal HTTP-success response. Reject it only
    // after meter(), because refusals can still consume billable tokens.
    if (response.stop_reason === "refusal") {
      throw new Error("The model declined this request.");
    }
    if (
      preparedSchema
      && (
        response.stop_reason === "max_tokens"
        || response.stop_reason === "model_context_window_exceeded"
      )
    ) {
      throw new Error(
        `${CFG.label} stopped before completing the requested structured response. ` +
        "No partial JSON was accepted.",
      );
    }
    text = (response.content ?? [])
      .filter((b: any) => b.type === "text").map((b: any) => b.text).join("");

    // Surface max-token exhaustion with no final text where the response
    // reports it; that does not establish how every Provider spent the budget.
    if (!text.trim() && response.stop_reason === "max_tokens") {
      throw new Error(
        `${CFG.label} reached the ${maxTokens}-token limit without final text. ` +
        "Raise maxTokens or lower the requested effort.");
    }
  }

  if (!preparedSchema) return text;
  return extractValidatedJSON<T>(text, preparedSchema.validator);
}

/**
 * Count a call you made yourself.
 * Stages 5 and 6 drive the client directly, so ask() never sees them. Without
 * this their spend is invisible — and a cost you cannot see is one you will
 * not manage.
 */
export function meter(response: unknown): void {
  const usage = response !== null && typeof response === "object" && !Array.isArray(response)
    ? (response as Record<string, unknown>).usage
    : undefined;
  spent = recordCourseUsage(spent, usage);
}

/**
 * Fail closed before a direct tool loop inspects content or executes a tool.
 * Callers meter the HTTP-success response first, then invoke this guard.
 */
export function assertCompleteToolTurn(response: unknown): void {
  const record = response !== null && typeof response === "object" && !Array.isArray(response)
    ? response as Record<string, unknown>
    : undefined;
  const stopReason = record?.stop_reason;
  if (stopReason === "refusal") {
    throw new Error("The model declined this tool turn. No tools were executed.");
  }
  if (stopReason === "max_tokens" || stopReason === "model_context_window_exceeded") {
    throw new Error("The model stopped before completing this tool turn. No tools were executed.");
  }
  if (stopReason !== "end_turn" && stopReason !== "tool_use") {
    throw new Error("The model returned an incomplete tool turn. No tools were executed.");
  }

  const content = record?.content;
  if (!Array.isArray(content)) {
    throw new Error("The model returned an invalid tool turn. No tools were executed.");
  }

  let toolUses = 0;
  const toolUseIds = new Set<string>();
  for (const block of content) {
    if (block === null || typeof block !== "object" || Array.isArray(block)) {
      throw new Error("The model returned an invalid tool turn. No tools were executed.");
    }
    const item = block as Record<string, unknown>;
    if (item.type !== "tool_use") continue;
    if (
      typeof item.id !== "string"
      || !item.id.trim()
      || typeof item.name !== "string"
      || !item.name.trim()
      || item.input === null
      || typeof item.input !== "object"
      || Array.isArray(item.input)
      || toolUseIds.has(item.id)
    ) {
      throw new Error("The model returned an invalid tool turn. No tools were executed.");
    }
    toolUseIds.add(item.id);
    toolUses += 1;
  }

  if (
    (stopReason === "end_turn" && toolUses !== 0)
    || (stopReason === "tool_use" && toolUses === 0)
  ) {
    throw new Error("The model returned an inconsistent tool turn. No tools were executed.");
  }
}

let baseline: number | null = null;

/**
 * Count the tokens in `text`, the way the API counts them.
 *
 * The endpoint estimates a whole *request*, not a bare string, and may include
 * system-added wrapping. Rather than treating any token floor as a stable
 * Provider constant, measure the empty request once and subtract that
 * local baseline for stage 4's relative budgeting exercise.
 */
export async function tokens(text: string): Promise<number> {
  if (OFFLINE) return Math.floor(text.length / 4); // rough; offline has no API
  const count = async (t: string) =>
    (await getClient().messages.countTokens({
      model: MODEL, messages: [{ role: "user", content: t || "x" }],
    })).input_tokens;
  if (baseline === null) baseline = (await count("")) - 1;
  return Math.max(0, (await count(text)) - baseline);
}

export function spend(): string {
  if (OFFLINE) return "offline — no tokens spent";
  let note = "";
  if (spent.cachedInputTokens) {
    note += ` (${spent.cachedInputTokens.toLocaleString()} cache-read)`;
  }
  if (spent.cacheCreationInputTokens) {
    note += ` (${spent.cacheCreationInputTokens.toLocaleString()} cache-created)`;
  }
  const usage = `${spent.calls} call(s) · ${spent.inputTokens.toLocaleString()} confirmed in / ` +
    `${spent.outputTokens.toLocaleString()} confirmed out${note}`;

  if (spent.unknownCalls > 0) {
    return `${usage} · cost unknown on ${MODEL} ` +
      `(${spent.unknownCalls} call(s) had missing, invalid, or unrecognised usage)`;
  }

  if (PROVIDER === "deepseek") {
    const band = priceBandAt();
    const priced = priceDeepSeekCourseUsage(MODEL, {
      inputTokens: spent.inputTokens,
      cachedInputTokens: spent.cachedInputTokens,
      cacheCreationInputTokens: spent.cacheCreationInputTokens,
      outputTokens: spent.outputTokens,
    }, band);
    if (!priced.known) {
      return `${usage} · cost unknown on ${MODEL} ` +
        `(not safely priceable from the ${priced.checkedAt} DeepSeek snapshot)`;
    }
    return `${usage} · $${priced.usd.toFixed(4)} on ${MODEL} · ${band} rate · ` +
      `prices checked ${DEEPSEEK_PRICING.checkedAt}`;
  }

  const priced = priceAnthropicCourseUsage(MODEL, {
    inputTokens: spent.inputTokens,
    cachedInputTokens: spent.cachedInputTokens,
    cacheCreationInputTokens: spent.cacheCreationInputTokens,
    outputTokens: spent.outputTokens,
  });
  if (!priced.known) {
    const detail = priced.reason === "cache-creation-price-unknown"
      ? "cache-creation usage needs a separate rate"
      : priced.reason === "unknown-model"
        ? "no matching model exists in the dated Claude snapshot"
        : "usage is not safely priceable";
    return `${usage} · cost unknown on ${MODEL} (${detail}; ` +
      `prices checked ${priced.checkedAt})`;
  }
  return `${usage} · $${priced.usd.toFixed(4)} on ${MODEL} · ` +
    `prices checked ${priced.checkedAt}`;
}

/** Fail early and clearly, instead of deep inside a stack trace. */
export function preflight(): void {
  if (OFFLINE) {
    console.log("  [offline] scripted local stand-in — no Provider request or real model variation.\n");
    return;
  }
  if (!process.env[CFG.env]?.trim()) {
    const others = Object.entries(PROVIDERS)
      .filter(([n, c]) => n !== PROVIDER && Boolean(process.env[c.env]?.trim()))
      .map(([n]) => n);
    const hint = others.length
      ? `\n  (${PROVIDERS[others[0]].label} is configured — run with CAFE_PROVIDER=${others[0]} to use it.)\n`
      : "";
    throw new Error(
      `\n  ${CFG.env} is not set, so the ${CFG.label} provider cannot run.\n\n` +
      `    export ${CFG.env}=...\n\n  Get a key: ${CFG.help}\n${hint}` +
      "  Or run any stage with --offline to use the scripted local stand-in.\n");
  }
  console.log(
    "  Live Provider calls may incur charges; review the printed estimate and Provider dashboard.",
  );
  console.log(`  [${CFG.label}] ${MODEL} · effort=${EFFORT}\n`);
}
