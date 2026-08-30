import assert from "node:assert/strict";
import test from "node:test";
import {
  DEEPSEEK_CHAT_ENDPOINT,
  DEEPSEEK_MODELS_ENDPOINT,
  MAX_PROVIDER_MESSAGES,
  MAX_PROVIDER_MESSAGES_CHARACTERS,
  MAX_PROVIDER_MESSAGES_UTF8_BYTES,
  MAX_PROVIDER_MESSAGE_CHARACTERS,
  MAX_PROVIDER_MESSAGE_UTF8_BYTES,
  MAX_PROVIDER_RESPONSE_BYTES,
  createDeepSeekClient,
} from "../lib/byok/client";
import { ProviderError, type Msg } from "../lib/byok/types";

const MODEL = "deepseek-v4-flash" as const;
const OPTIONS = { model: MODEL, maxTokens: 250 };
const MESSAGES = [{ role: "user" as const, content: "hello" }];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function successBody(overrides: Record<string, unknown> = {}) {
  return {
    choices: [{ finish_reason: "stop", message: { content: "hello back" } }],
    model: MODEL,
    system_fingerprint: "fp_test",
    created: 1_787_270_400,
    usage: {
      prompt_tokens: 12,
      prompt_cache_hit_tokens: 5,
      prompt_cache_miss_tokens: 7,
      completion_tokens: 3,
    },
    ...overrides,
  };
}

async function providerError(promise: Promise<unknown>): Promise<ProviderError> {
  try {
    await promise;
  } catch (error) {
    assert.ok(error instanceof ProviderError);
    return error;
  }
  assert.fail("Expected ProviderError");
}

test("missing key fails before dispatch and performs no fetch", async () => {
  let fetches = 0;
  const client = createDeepSeekClient({
    getApiKey: () => "",
    fetchImpl: async () => { fetches++; return jsonResponse(successBody()); },
  });

  const error = await providerError(client.call(MESSAGES, OPTIONS));
  assert.equal(fetches, 0);
  assert.equal(error.code, "no-key");
  assert.equal(error.billing, "not-sent");
});

test("a transport failure is attempted once, never auto-retried", async () => {
  let fetches = 0;
  const client = createDeepSeekClient({
    getApiKey: () => "not-a-real-key",
    fetchImpl: async () => {
      fetches++;
      throw new TypeError("offline");
    },
  });

  const error = await providerError(client.call(MESSAGES, OPTIONS));
  assert.equal(fetches, 1);
  assert.equal(error.code, "network");
  assert.equal(error.billing, "unknown-after-send");
});

test("an already-aborted action performs no fetch and is not sent", async () => {
  const controller = new AbortController();
  controller.abort();
  let fetches = 0;
  const client = createDeepSeekClient({
    getApiKey: () => "not-a-real-key",
    fetchImpl: async () => { fetches++; return jsonResponse(successBody()); },
  });

  const error = await providerError(client.call(MESSAGES, { ...OPTIONS, signal: controller.signal }));
  assert.equal(fetches, 0);
  assert.equal(error.code, "aborted");
  assert.equal(error.billing, "not-sent");
});

test("request limits accept exact character and UTF-8 aggregate boundaries", async (t) => {
  await t.test("one message at the exact character boundary", async () => {
    let fetches = 0;
    const client = createDeepSeekClient({
      getApiKey: () => "not-a-real-key",
      fetchImpl: async () => { fetches++; return jsonResponse(successBody()); },
    });

    const result = await client.call([
      { role: "user", content: "a".repeat(MAX_PROVIDER_MESSAGE_CHARACTERS) },
    ], OPTIONS);
    assert.equal(result.text, "hello back");
    assert.equal(fetches, 1);
  });

  await t.test("two messages at the exact aggregate character boundary", async () => {
    let fetches = 0;
    const client = createDeepSeekClient({
      getApiKey: () => "not-a-real-key",
      fetchImpl: async () => { fetches++; return jsonResponse(successBody()); },
    });

    const result = await client.call([
      { role: "system", content: "a".repeat(MAX_PROVIDER_MESSAGE_CHARACTERS) },
      { role: "user", content: "b".repeat(MAX_PROVIDER_MESSAGE_CHARACTERS) },
    ], OPTIONS);
    assert.equal(result.text, "hello back");
    assert.equal(fetches, 1);
  });

  await t.test("two multibyte messages at both exact UTF-8 byte boundaries", async () => {
    const exactBytes = "學".repeat(Math.floor(MAX_PROVIDER_MESSAGE_UTF8_BYTES / 3))
      + "a".repeat(MAX_PROVIDER_MESSAGE_UTF8_BYTES % 3);
    assert.equal(new TextEncoder().encode(exactBytes).byteLength, MAX_PROVIDER_MESSAGE_UTF8_BYTES);
    assert.equal(new TextEncoder().encode(exactBytes + exactBytes).byteLength, MAX_PROVIDER_MESSAGES_UTF8_BYTES);
    let fetches = 0;
    const client = createDeepSeekClient({
      getApiKey: () => "not-a-real-key",
      fetchImpl: async () => { fetches++; return jsonResponse(successBody()); },
    });

    const result = await client.call([
      { role: "system", content: exactBytes },
      { role: "user", content: exactBytes },
    ], OPTIONS);
    assert.equal(result.billing, "usage-confirmed");
    assert.equal(fetches, 1);
  });
});

test("request size failures are typed, not sent, and never read the key or call fetch", async (t) => {
  const cases: Array<{ name: string; messages: Msg[] }> = [
    {
      name: "one character beyond the per-message character limit",
      messages: [{ role: "user", content: "a".repeat(MAX_PROVIDER_MESSAGE_CHARACTERS + 1) }],
    },
    {
      name: "multibyte text beyond the per-message UTF-8 limit",
      messages: [{
        role: "user",
        content: "學".repeat(Math.floor(MAX_PROVIDER_MESSAGE_UTF8_BYTES / 3) + 1),
      }],
    },
    {
      name: "messages beyond the aggregate character limit",
      messages: [
        { role: "system", content: "a".repeat(30_000) },
        { role: "user", content: "b".repeat(30_000) },
        { role: "assistant", content: "c".repeat(MAX_PROVIDER_MESSAGES_CHARACTERS - 60_000 + 1) },
      ],
    },
    {
      name: "multibyte messages beyond the aggregate UTF-8 limit",
      messages: (() => {
        const exactBytes = "學".repeat(Math.floor(MAX_PROVIDER_MESSAGE_UTF8_BYTES / 3))
          + "a".repeat(MAX_PROVIDER_MESSAGE_UTF8_BYTES % 3);
        return [
          { role: "system" as const, content: exactBytes },
          { role: "user" as const, content: exactBytes },
          { role: "assistant" as const, content: "a" },
        ];
      })(),
    },
    {
      name: "too many empty message records",
      messages: Array.from({ length: MAX_PROVIDER_MESSAGES + 1 }, () => ({
        role: "user" as const,
        content: "",
      })),
    },
  ];

  for (const fixture of cases) {
    await t.test(fixture.name, async () => {
      let keyReads = 0;
      let fetches = 0;
      const client = createDeepSeekClient({
        getApiKey: () => { keyReads++; return "not-a-real-key"; },
        fetchImpl: async () => { fetches++; return jsonResponse(successBody()); },
      });

      const error = await providerError(client.call(fixture.messages, OPTIONS));
      assert.equal(error.code, "provider");
      assert.equal(error.billing, "not-sent");
      assert.equal(error.requestedModel, MODEL);
      assert.equal(keyReads, 0);
      assert.equal(fetches, 0);
    });
  }
});

test("timeout aborts the sole in-flight fetch and leaves billing unknown", async () => {
  let fetches = 0;
  const client = createDeepSeekClient({
    getApiKey: () => "not-a-real-key",
    fetchImpl: async (_input, init) => {
      fetches++;
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(init.signal?.reason), { once: true });
      });
    },
  });

  const error = await providerError(client.call(MESSAGES, { ...OPTIONS, timeoutMs: 5 }));
  assert.equal(fetches, 1);
  assert.equal(error.code, "timeout");
  assert.equal(error.billing, "unknown-after-send");
});

test("success preserves model metadata and the complete cache usage split", async () => {
  let requestUrl = "";
  let requestBody = "";
  let requestInit: RequestInit | undefined;
  const client = createDeepSeekClient({
    getApiKey: () => "not-a-real-key",
    fetchImpl: async (input, init) => {
      requestUrl = String(input);
      requestBody = String(init?.body);
      requestInit = init;
      return jsonResponse(successBody());
    },
  });

  const result = await client.call(MESSAGES, OPTIONS);
  assert.equal(requestUrl, DEEPSEEK_CHAT_ENDPOINT);
  assert.equal(JSON.parse(requestBody).max_tokens, 250);
  assert.equal(requestInit?.cache, "no-store");
  assert.equal(requestInit?.credentials, "omit");
  assert.equal(requestInit?.redirect, "error");
  assert.equal(requestInit?.referrerPolicy, "no-referrer");
  assert.equal(result.text, "hello back");
  assert.equal(result.requestedModel, MODEL);
  assert.equal(result.responseModel, MODEL);
  assert.equal(result.finishReason, "stop");
  assert.equal(result.systemFingerprint, "fp_test");
  assert.equal(result.createdAt, 1_787_270_400);
  assert.equal(result.billing, "usage-confirmed");
  assert.deepEqual(result.usage, {
    promptTokens: 12,
    promptCacheHitTokens: 5,
    promptCacheMissTokens: 7,
    completionTokens: 3,
  });
});

test("a response at the exact byte boundary remains readable", async () => {
  const encoded = JSON.stringify(successBody());
  const encodedBytes = new TextEncoder().encode(encoded).byteLength;
  assert.ok(encodedBytes < MAX_PROVIDER_RESPONSE_BYTES);
  const body = encoded + " ".repeat(MAX_PROVIDER_RESPONSE_BYTES - encodedBytes);
  let fetches = 0;
  const client = createDeepSeekClient({
    getApiKey: () => "not-a-real-key",
    fetchImpl: async () => {
      fetches++;
      return new Response(body, {
        status: 200,
        headers: { "Content-Length": String(MAX_PROVIDER_RESPONSE_BYTES) },
      });
    },
  });

  const result = await client.call(MESSAGES, OPTIONS);
  assert.equal(result.text, "hello back");
  assert.equal(result.billing, "usage-confirmed");
  assert.equal(fetches, 1);
});

test("an oversized declared Content-Length cancels and aborts without reading content", async () => {
  const sentinel = "private-provider-content-must-not-leak";
  let cancelled = false;
  let requestSignal: AbortSignal | null = null;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(sentinel));
    },
    cancel() {
      cancelled = true;
    },
  }, { highWaterMark: 0 });
  const client = createDeepSeekClient({
    getApiKey: () => "not-a-real-key",
    fetchImpl: async (_input, init) => {
      requestSignal = init?.signal ?? null;
      return new Response(stream, {
        status: 200,
        headers: { "Content-Length": String(MAX_PROVIDER_RESPONSE_BYTES + 1) },
      });
    },
  });

  const error = await providerError(client.call(MESSAGES, OPTIONS));
  assert.equal(error.code, "invalid-response");
  assert.equal(error.billing, "unknown-after-send");
  assert.equal(error.httpStatus, 200);
  assert.equal(error.requestedModel, MODEL);
  assert.equal(error.usage, undefined);
  assert.equal(error.message.includes(sentinel), false);
  assert.equal(cancelled, true);
  assert.equal((requestSignal as AbortSignal | null)?.aborted, true);
});

test("a no-Content-Length stream is cancelled when cumulative bytes exceed the limit", async () => {
  const sentinel = "private-stream-tail-must-not-leak";
  let cancelled = false;
  let pulls = 0;
  let requestSignal: AbortSignal | null = null;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      pulls++;
      if (pulls === 1) {
        controller.enqueue(new Uint8Array(MAX_PROVIDER_RESPONSE_BYTES));
      } else {
        controller.enqueue(new TextEncoder().encode(sentinel));
      }
    },
    cancel() {
      cancelled = true;
    },
  }, { highWaterMark: 0 });
  const client = createDeepSeekClient({
    getApiKey: () => "not-a-real-key",
    fetchImpl: async (_input, init) => {
      requestSignal = init?.signal ?? null;
      return new Response(stream, { status: 200 });
    },
  });

  const error = await providerError(client.call(MESSAGES, OPTIONS));
  assert.equal(error.code, "invalid-response");
  assert.equal(error.billing, "unknown-after-send");
  assert.equal(error.usage, undefined);
  assert.equal(error.message.includes(sentinel), false);
  assert.equal(cancelled, true);
  assert.equal((requestSignal as AbortSignal | null)?.aborted, true);
  assert.equal(pulls, 2);
});

test("missing cache split is priced conservatively as all cache miss", async () => {
  const client = createDeepSeekClient({
    getApiKey: () => "not-a-real-key",
    fetchImpl: async () => jsonResponse(successBody({
      usage: { prompt_tokens: 12, completion_tokens: 3 },
    })),
  });

  const result = await client.call(MESSAGES, OPTIONS);
  assert.deepEqual(result.usage, {
    promptTokens: 12,
    promptCacheHitTokens: 0,
    promptCacheMissTokens: 12,
    completionTokens: 3,
  });
});

test("missing usage is explicit unknown-after-send, never a confirmed zero", async () => {
  const client = createDeepSeekClient({
    getApiKey: () => "not-a-real-key",
    fetchImpl: async () => jsonResponse(successBody({ usage: undefined })),
  });

  const result = await client.call(MESSAGES, OPTIONS);
  assert.equal(result.usage, undefined);
  assert.equal(result.billing, "unknown-after-send");
});

test("HTTP errors map to typed fatal codes and preserve error usage", async (t) => {
  const cases = [
    [401, "auth"],
    [402, "credit"],
    [403, "auth"],
    [429, "rate-limit"],
    [500, "provider"],
    [503, "provider"],
  ] as const;

  for (const [status, code] of cases) {
    await t.test(String(status), async () => {
      let fetches = 0;
      const client = createDeepSeekClient({
        getApiKey: () => "not-a-real-key",
        fetchImpl: async () => {
          fetches++;
          return jsonResponse({
            error: { message: "documented provider message" },
            usage: {
              prompt_tokens: 4,
              prompt_cache_hit_tokens: 0,
              prompt_cache_miss_tokens: 4,
              completion_tokens: 0,
            },
          }, status);
        },
      });
      const error = await providerError(client.call(MESSAGES, OPTIONS));
      assert.equal(fetches, 1);
      assert.equal(error.code, code);
      assert.equal(error.httpStatus, status);
      assert.equal(error.billing, "usage-confirmed");
      assert.equal(error.usage?.promptCacheMissTokens, 4);
    });
  }
});

test("rejected responses without usage are provider-rejected-no-usage", async () => {
  const client = createDeepSeekClient({
    getApiKey: () => "not-a-real-key",
    fetchImpl: async () => jsonResponse({ error: { message: "no" } }, 401),
  });
  const error = await providerError(client.call(MESSAGES, OPTIONS));
  assert.equal(error.billing, "provider-rejected-no-usage");
  assert.equal(error.usage, undefined);
});

test("provider-controlled diagnostics never retain credentials, prompts, or raw errors", async () => {
  const key = "not-a-real-key";
  const prompt = "private prompt that must not be reflected";
  const secondToken = "another-sensitive-token";
  const client = createDeepSeekClient({
    getApiKey: () => key,
    fetchImpl: async () => jsonResponse({
      error: { message: `Rejected ${key}; prompt=${prompt}; token=${secondToken}` },
    }, 401),
  });
  const error = await providerError(client.call(MESSAGES, OPTIONS));
  assert.equal(error.message, "Provider returned HTTP 401.");
  assert.equal(error.message.includes(key), false);
  assert.equal(error.message.includes(prompt), false);
  assert.equal(error.message.includes(secondToken), false);
});

test("200 invalid, empty and truncated content are content failures with usage preserved", async (t) => {
  await t.test("invalid JSON", async () => {
    const client = createDeepSeekClient({
      getApiKey: () => "not-a-real-key",
      fetchImpl: async () => jsonResponse(successBody({
        choices: [{ finish_reason: "stop", message: { content: "not json" } }],
      })),
    });
    const error = await providerError(client.call(MESSAGES, { ...OPTIONS, json: true }));
    assert.equal(error.code, "invalid-response");
    assert.equal(error.billing, "usage-confirmed");
    assert.equal(error.usage?.completionTokens, 3);
    assert.equal(error.systemFingerprint, "fp_test");
  });

  await t.test("empty HTTP body", async () => {
    const client = createDeepSeekClient({
      getApiKey: () => "not-a-real-key",
      fetchImpl: async () => new Response("", { status: 200 }),
    });
    const error = await providerError(client.call(MESSAGES, OPTIONS));
    assert.equal(error.code, "empty-response");
    assert.equal(error.billing, "unknown-after-send");
  });

  await t.test("finish_reason length", async () => {
    const client = createDeepSeekClient({
      getApiKey: () => "not-a-real-key",
      fetchImpl: async () => jsonResponse(successBody({
        choices: [{ finish_reason: "length", message: { content: "{\"partial\":" } }],
      })),
    });
    const error = await providerError(client.call(MESSAGES, { ...OPTIONS, json: true }));
    assert.equal(error.code, "invalid-response");
    assert.equal(error.billing, "usage-confirmed");
  });
});

test("GET /models performs one non-billing credential request", async () => {
  let fetches = 0;
  let method = "";
  let url = "";
  const client = createDeepSeekClient({
    getApiKey: () => "arbitrary-nonempty-value",
    fetchImpl: async (input, init) => {
      fetches++;
      method = String(init?.method);
      url = String(input);
      return jsonResponse({ data: [{ id: MODEL }, { id: "deepseek-v4-pro" }] });
    },
  });

  assert.deepEqual(await client.listModels(), [MODEL, "deepseek-v4-pro"]);
  assert.equal(fetches, 1);
  assert.equal(method, "GET");
  assert.equal(url, DEEPSEEK_MODELS_ENDPOINT);
});
