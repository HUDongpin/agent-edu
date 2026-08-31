import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";

const EFFORTS = ["low", "medium", "high", "xhigh", "max"] as const;
const DEEPSEEK_KEY = "deepseek-fixture-value";
const ANTHROPIC_KEY = "anthropic-fixture-value";

function runModule(
  source: string,
  env: Record<string, string> = {},
  args: readonly string[] = [],
) {
  return spawnSync(process.execPath, [
    "--import", "tsx",
    "--input-type=module",
    "-e", source,
    ...(args.length ? ["--", ...args] : []),
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: {
      ...process.env,
      ANTHROPIC_API_KEY: "",
      ANTHROPIC_AUTH_TOKEN: "",
      ANTHROPIC_BASE_URL: "",
      ANTHROPIC_CONFIG_DIR: "",
      ANTHROPIC_CUSTOM_HEADERS: "",
      ANTHROPIC_LOG: "",
      ANTHROPIC_PROFILE: "",
      ANTHROPIC_WEBHOOK_SIGNING_KEY: "",
      CAFE_EFFORT: "",
      CAFE_MODEL: "",
      CAFE_PROVIDER: "",
      DEEPSEEK_API_KEY: "",
      ...env,
    },
  });
}

function responseFixture(
  stopReason: string,
  text: string,
  schema: object,
  effort = "medium",
) {
  const response = {
    id: "msg_fixture",
    type: "message",
    role: "assistant",
    model: "deepseek-v4-flash",
    content: [{ type: "text", text }],
    stop_reason: stopReason,
    stop_sequence: null,
    usage: {
      input_tokens: 7,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
      output_tokens: 3,
    },
  };
  return runModule(`
    let fetches = 0;
    let body = "";
    globalThis.fetch = async (_url, init) => {
      fetches += 1;
      body = String(init?.body ?? "");
      return new Response(${JSON.stringify(JSON.stringify(response))}, {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };
    const m = await import("./course/cafe/llm.ts");
    try {
      const value = await m.ask("fixture request", {
        schema: ${JSON.stringify(schema)},
        effort: ${JSON.stringify(effort)},
        maxTokens: 64,
      });
      console.log("VALUE:" + JSON.stringify(value));
    } catch (error) {
      console.log("ERROR:" + String(error instanceof Error ? error.message : error));
      console.log("SPEND:" + m.spend());
      process.exitCode = 2;
    }
    console.log("FETCHES:" + fetches);
    console.log("BODY:" + body);
  `, {
    CAFE_PROVIDER: "deepseek",
    DEEPSEEK_API_KEY: DEEPSEEK_KEY,
  });
}

function anthropicSequenceFixture(
  responses: Array<{ stopReason: string; text: string }>,
  schema: object,
) {
  const messages = responses.map(({ stopReason, text }, index) => ({
    id: `msg_anthropic_fixture_${index}`,
    type: "message",
    role: "assistant",
    model: "claude-opus-5",
    content: [{ type: "text", text }],
    stop_reason: stopReason,
    stop_details: stopReason === "refusal" ? { category: "fixture-category" } : null,
    stop_sequence: null,
    usage: {
      input_tokens: 7,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
      output_tokens: 3,
    },
  }));
  return runModule(`
    const responses = ${JSON.stringify(messages)};
    const bodies = [];
    const origins = [];
    globalThis.fetch = async (url, init) => {
      origins.push(new URL(String(url)).origin);
      bodies.push(JSON.parse(String(init?.body ?? "{}")));
      const response = responses.shift();
      if (!response) throw new Error("unexpected extra fetch");
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };
    const m = await import("./course/cafe/llm.ts");
    const outcomes = [];
    for (let index = 0; index < ${messages.length}; index++) {
      try {
        outcomes.push({ value: await m.ask("native fixture", {
          schema: ${JSON.stringify(schema)},
          effort: "medium",
          maxTokens: 64,
        }) });
      } catch (error) {
        outcomes.push({ error: String(error instanceof Error ? error.message : error) });
      }
    }
    console.log("OUTCOMES:" + JSON.stringify(outcomes));
    console.log("BODIES:" + JSON.stringify(bodies));
    console.log("ORIGINS:" + JSON.stringify(origins));
    console.log("FETCHES:" + bodies.length);
    console.log("SPEND:" + m.spend());
  `, {
    ANTHROPIC_API_KEY: ANTHROPIC_KEY,
    CAFE_PROVIDER: "anthropic",
  });
}

const ORDER_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          size: { type: "string", enum: ["S", "L"] },
          price: { type: "number" },
        },
        required: ["name", "size", "price"],
        additionalProperties: false,
      },
    },
    total: { type: "number" },
    needs_confirmation: { type: "boolean" },
  },
  required: ["items", "total", "needs_confirmation"],
  additionalProperties: false,
} as const;

const VALID_ORDER = {
  items: [{ name: "flat white", size: "L", price: 4.8 }],
  total: 4.8,
  needs_confirmation: false,
};

test("Provider selection fails closed when both keys exist without an explicit choice", () => {
  const result = runModule(`
    const m = await import("./course/cafe/llm.ts");
    console.log(JSON.stringify({ provider: m.PROVIDER, model: m.MODEL }));
  `, {
    ANTHROPIC_API_KEY: ANTHROPIC_KEY,
    DEEPSEEK_API_KEY: DEEPSEEK_KEY,
  });

  assert.notEqual(result.status, 0, result.stdout);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.match(output, /CAFE_PROVIDER=deepseek/);
  assert.match(output, /CAFE_PROVIDER=anthropic/);
  assert.doesNotMatch(output, new RegExp(DEEPSEEK_KEY));
  assert.doesNotMatch(output, new RegExp(ANTHROPIC_KEY));
});

test("explicit Provider selection rejects inherited object keys without echoing them", () => {
  for (const invalid of ["constructor", "__proto__"]) {
    const result = runModule(
      'await import("./course/cafe/llm.ts")',
      { CAFE_PROVIDER: invalid },
    );
    assert.notEqual(result.status, 0);
    const output = `${result.stdout}\n${result.stderr}`;
    assert.match(output, /CAFE_PROVIDER must be one of: anthropic, deepseek/);
    assert.doesNotMatch(output, new RegExp(invalid));
  }
});

test("single-key inference, explicit selection, and no-key default remain deterministic", () => {
  const cases = [
    [{ DEEPSEEK_API_KEY: DEEPSEEK_KEY }, "deepseek"],
    [{ ANTHROPIC_API_KEY: ANTHROPIC_KEY }, "anthropic"],
    [{
      ANTHROPIC_API_KEY: ANTHROPIC_KEY,
      DEEPSEEK_API_KEY: DEEPSEEK_KEY,
      CAFE_PROVIDER: "deepseek",
    }, "deepseek"],
    [{
      ANTHROPIC_API_KEY: ANTHROPIC_KEY,
      DEEPSEEK_API_KEY: DEEPSEEK_KEY,
      CAFE_PROVIDER: "anthropic",
    }, "anthropic"],
    [{}, "deepseek"],
  ] as const;

  for (const [env, expected] of cases) {
    const result = runModule(`
      const m = await import("./course/cafe/llm.ts");
      console.log(m.PROVIDER);
    `, { ...env });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), expected);
  }
});

test("preflight rejects a whitespace-only selected Provider key before dispatch", () => {
  const whitespaceKey = "   \t   ";
  const result = runModule(`
    let fetches = 0;
    globalThis.fetch = async () => { fetches += 1; throw new Error("must not fetch"); };
    const m = await import("./course/cafe/llm.ts");
    try {
      m.preflight();
      await m.ask("must not run");
    } catch (error) {
      console.log("ERROR:" + String(error instanceof Error ? error.message : error));
    }
    console.log("FETCHES:" + fetches);
  `, {
    CAFE_PROVIDER: "anthropic",
    ANTHROPIC_API_KEY: whitespaceKey,
    DEEPSEEK_API_KEY: DEEPSEEK_KEY,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /ANTHROPIC_API_KEY is not set/);
  assert.match(result.stdout, /FETCHES:0/);
  assert.doesNotMatch(result.stdout, new RegExp(DEEPSEEK_KEY));
});

test("model identifiers fail closed before output or dispatch without echoing secrets", () => {
  const rejected = [
    ["sk", "-", "live-secret-value"].join(""),
    ["sk", "_", "live_secret_value"].join(""),
    ["gh", "p_", "abcdefghijklmnopqrstuvwxyz123456"].join(""),
    ["AK", "IA", "ABCDEFGHIJKLMNOP"].join(""),
    ["AI", "za", "SyABCDEFGHIJKLMNOPQRSTUVWXYZ12345"].join(""),
    ["gs", "k_", "abcdefghijklmnopqrstuvwxyz123456"].join(""),
    ["xa", "i-", "abcdefghijklmnopqrstuvwxyz123456"].join(""),
    ["abcdefghij", ".", "abcdefghij", ".", "abcdefgh"].join(""),
    ["Bear", "er ", "abcdefghijklmnopqrstuvwxyz"].join(""),
    ["-----BEGIN ", "PRIVATE KEY-----"].join(""),
    "Ab3Def5Hij7Lmn9Pqr2Tuv4Xyz6BCD8FGH0JKL2MN",
  ];

  for (const model of rejected) {
    const result = runModule(`
      let fetches = 0;
      globalThis.fetch = async () => { fetches += 1; throw new Error("must not fetch"); };
      try {
        await import("./course/cafe/llm.ts");
      } catch (error) {
        console.log("ERROR:" + String(error instanceof Error ? error.message : error));
        console.log("FETCHES:" + fetches);
        process.exitCode = 2;
      }
    `, {
      CAFE_PROVIDER: "deepseek",
      DEEPSEEK_API_KEY: DEEPSEEK_KEY,
      CAFE_MODEL: model,
    });
    assert.notEqual(result.status, 0, model);
    const output = `${result.stdout}\n${result.stderr}`;
    assert.match(output, /CAFE_MODEL is not a safe public model identifier/);
    assert.match(output, /FETCHES:0/);
    assert.doesNotMatch(output, new RegExp(model.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("blank model values fall back and bounded public custom identifiers remain allowed", () => {
  for (const [value, expected] of [
    ["", "deepseek-v4-flash"],
    ["   \t  ", "deepseek-v4-flash"],
    ["vendor/model.release:2026-08-30", "vendor/model.release:2026-08-30"],
  ] as const) {
    const result = runModule(`
      const m = await import("./course/cafe/llm.ts");
      console.log(m.MODEL);
    `, {
      CAFE_PROVIDER: "deepseek",
      DEEPSEEK_API_KEY: DEEPSEEK_KEY,
      CAFE_MODEL: value,
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), expected);
  }
});

test("selected Provider transport ignores ambient Anthropic base, auth, and profile state", () => {
  for (const [provider, keyName, key, expectedOrigin] of [
    ["anthropic", "ANTHROPIC_API_KEY", ANTHROPIC_KEY, "https://api.anthropic.com"],
    ["deepseek", "DEEPSEEK_API_KEY", DEEPSEEK_KEY, "https://api.deepseek.com"],
  ] as const) {
    const response = {
      id: `msg_${provider}_transport_fixture`,
      type: "message",
      role: "assistant",
      model: provider === "anthropic" ? "claude-opus-5" : "deepseek-v4-flash",
      content: [{ type: "text", text: "fixture complete" }],
      stop_reason: "end_turn",
      stop_details: null,
      stop_sequence: null,
      usage: {
        input_tokens: 7,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
        output_tokens: 3,
      },
    };
    const result = runModule(`
      const origins = [];
      const auth = [];
      globalThis.fetch = async (url, init) => {
        origins.push(new URL(String(url)).origin);
        const headers = new Headers(init?.headers);
        auth.push({
          selectedKey: headers.get("x-api-key") === process.env[${JSON.stringify(keyName)}],
          ambientAuthorization: headers.has("authorization"),
        });
        return new Response(${JSON.stringify(JSON.stringify(response))}, {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      };
      const m = await import("./course/cafe/llm.ts");
      const value = await m.ask("transport fixture", { effort: "low" });
      console.log("VALUE:" + value);
      console.log("ORIGINS:" + JSON.stringify(origins));
      console.log("AUTH:" + JSON.stringify(auth));
      console.log("RETRIES:" + m.getClient().maxRetries);
    `, {
      CAFE_PROVIDER: provider,
      [keyName]: key,
      ANTHROPIC_AUTH_TOKEN: "ambient-bearer-must-not-cross",
      ANTHROPIC_BASE_URL: "https://attacker.invalid/collect",
      ANTHROPIC_PROFILE: "ambient-profile-must-not-load",
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /VALUE:fixture complete/);
    assert.ok(result.stdout.includes(`ORIGINS:${JSON.stringify([expectedOrigin])}`));
    assert.ok(result.stdout.includes(
      'AUTH:[{"selectedKey":true,"ambientAuthorization":false}]',
    ));
    assert.match(result.stdout, /RETRIES:0/);
    const output = `${result.stdout}\n${result.stderr}`;
    assert.doesNotMatch(output, /attacker\.invalid|ambient-bearer-must-not-cross/);
    assert.doesNotMatch(output, new RegExp(key));
  }
});

test("ambient Anthropic custom headers fail closed before dispatch without echoing them", () => {
  const customHeaders = [
    "Authori", "zation: Bear", "er ambient-custom-secret",
    "\nX-Course-Fixture: private",
  ].join("");
  const rejected = runModule(`
    let fetches = 0;
    globalThis.fetch = async () => { fetches += 1; throw new Error("must not fetch"); };
    try {
      await import("./course/cafe/llm.ts");
    } catch (error) {
      console.log("ERROR:" + String(error instanceof Error ? error.message : error));
      console.log("FETCHES:" + fetches);
      process.exitCode = 2;
    }
  `, {
    CAFE_PROVIDER: "deepseek",
    DEEPSEEK_API_KEY: DEEPSEEK_KEY,
    ANTHROPIC_CUSTOM_HEADERS: customHeaders,
  });
  assert.notEqual(rejected.status, 0);
  const output = `${rejected.stdout}\n${rejected.stderr}`;
  assert.match(output, /ANTHROPIC_CUSTOM_HEADERS is not supported by this course runtime/);
  assert.match(output, /FETCHES:0/);
  assert.doesNotMatch(output, /ambient-custom-secret|X-Course-Fixture|private/);

  const whitespace = runModule(`
    const m = await import("./course/cafe/llm.ts");
    console.log(m.PROVIDER);
  `, {
    CAFE_PROVIDER: "deepseek",
    DEEPSEEK_API_KEY: DEEPSEEK_KEY,
    ANTHROPIC_CUSTOM_HEADERS: "  \t  ",
  });
  assert.equal(whitespace.status, 0, whitespace.stderr);
  assert.equal(whitespace.stdout.trim(), "deepseek");
});

test("offline mode ignores ambient custom headers and keeps the no-key local path", () => {
  const ambientHeader = [
    "Authori", "zation: Bear", "er ambient-offline-fixture",
  ].join("");
  const result = runModule(`
    let fetches = 0;
    globalThis.fetch = async () => { fetches += 1; throw new Error("must not fetch"); };
    const m = await import("./course/cafe/llm.ts");
    m.preflight();
    const value = await m.ask("offline ambient-header fixture");
    console.log("OFFLINE:" + m.OFFLINE);
    console.log("VALUE:" + String(value));
    console.log("FETCHES:" + fetches);
  `, {
    ANTHROPIC_CUSTOM_HEADERS: ambientHeader,
  }, ["--offline"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /OFFLINE:true/);
  assert.match(result.stdout, /VALUE:\S/);
  assert.match(result.stdout, /FETCHES:0/);
  assert.match(result.stdout, /scripted local stand-in — no Provider request or real model variation/);
  assert.doesNotMatch(result.stdout, /may incur charges/);
  assert.doesNotMatch(`${result.stdout}\n${result.stderr}`, /ambient-offline-fixture/);
});

test("live preflight gives a generic charge notice before any request", () => {
  const result = runModule(`
    let fetches = 0;
    globalThis.fetch = async () => { fetches += 1; throw new Error("must not fetch"); };
    const m = await import("./course/cafe/llm.ts");
    m.preflight();
    console.log("FETCHES:" + fetches);
  `, {
    CAFE_PROVIDER: "deepseek",
    DEEPSEEK_API_KEY: DEEPSEEK_KEY,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(
    result.stdout,
    /live Provider calls may incur charges; review the printed estimate and Provider dashboard/i,
  );
  assert.match(result.stdout, /FETCHES:0/);
  assert.doesNotMatch(result.stdout, new RegExp(DEEPSEEK_KEY));
});

test("transient Anthropic errors dispatch once with retries disabled", () => {
  for (const status of [500, 429]) {
    const result = runModule(`
      let fetches = 0;
      globalThis.fetch = async () => {
        fetches += 1;
        return new Response(JSON.stringify({
          type: "error",
          error: { type: "api_error", message: "fixture transient failure" },
        }), {
          status: ${status},
          headers: {
            "content-type": "application/json",
            "retry-after-ms": "0",
          },
        });
      };
      const m = await import("./course/cafe/llm.ts");
      try { await m.ask("retry fixture"); } catch { console.log("REJECTED:true"); }
      console.log("FETCHES:" + fetches);
    `, {
      CAFE_PROVIDER: "anthropic",
      ANTHROPIC_API_KEY: ANTHROPIC_KEY,
      ANTHROPIC_BASE_URL: "https://attacker.invalid/collect",
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /REJECTED:true/);
    assert.match(result.stdout, /FETCHES:1/);
    const output = `${result.stdout}\n${result.stderr}`;
    assert.doesNotMatch(output, new RegExp(ANTHROPIC_KEY));
  }
});

test("DeepSeek maps every supported course effort through output_config", () => {
  const result = runModule(`
    const m = await import("./course/cafe/llm.ts");
    const efforts = ${JSON.stringify(EFFORTS)};
    console.log(JSON.stringify(Object.fromEntries(efforts.map((effort) => [effort, m.tuning(effort)]))));
  `, {
    CAFE_PROVIDER: "deepseek",
    DEEPSEEK_API_KEY: DEEPSEEK_KEY,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), {
    low: { output_config: { effort: "low" } },
    medium: { output_config: { effort: "high" } },
    high: { output_config: { effort: "high" } },
    xhigh: { output_config: { effort: "high" } },
    max: { output_config: { effort: "max" } },
  });
  assert.doesNotMatch(result.stdout, /thinking|disabled/);
});

test("Anthropic keeps the five supported effort values one-for-one", () => {
  const result = runModule(`
    const m = await import("./course/cafe/llm.ts");
    const efforts = ${JSON.stringify(EFFORTS)};
    console.log(JSON.stringify(Object.fromEntries(efforts.map((effort) => [effort, m.tuning(effort)]))));
  `, {
    ANTHROPIC_API_KEY: ANTHROPIC_KEY,
    CAFE_PROVIDER: "anthropic",
  });
  assert.equal(result.status, 0, result.stderr);
  const expected = Object.fromEntries(
    EFFORTS.map((effort) => [effort, { output_config: { effort } }]),
  );
  assert.deepEqual(JSON.parse(result.stdout), expected);
});

test("invalid environment and per-call effort fail before dispatch", () => {
  const invalidEnvironment = runModule(
    'await import("./course/cafe/llm.ts")',
    {
      CAFE_EFFORT: "turbo",
      CAFE_PROVIDER: "deepseek",
      DEEPSEEK_API_KEY: DEEPSEEK_KEY,
    },
  );
  assert.notEqual(invalidEnvironment.status, 0);
  assert.match(`${invalidEnvironment.stdout}\n${invalidEnvironment.stderr}`, /CAFE_EFFORT/);

  const fixture = responseFixture("end_turn", JSON.stringify(VALID_ORDER), ORDER_SCHEMA, "turbo");
  assert.notEqual(fixture.status, 0);
  assert.match(fixture.stdout, /ERROR:.*effort/i);
  assert.match(fixture.stdout, /FETCHES:0/);
});

test("the mapped DeepSeek effort reaches the serialized SDK request body", () => {
  const result = responseFixture("end_turn", JSON.stringify(VALID_ORDER), ORDER_SCHEMA, "medium");
  assert.equal(result.status, 0, result.stdout || result.stderr);
  const bodyLine = result.stdout.split("\n").find((line) => line.startsWith("BODY:"));
  assert.ok(bodyLine);
  const body = JSON.parse(bodyLine.slice("BODY:".length)) as Record<string, unknown>;
  assert.deepEqual(body.output_config, { effort: "high" });
});

test("prompted JSON fallback enforces every supplied draft-7 schema constraint", () => {
  const invalid = [
    { ...VALID_ORDER, items: "not-an-array" },
    { ...VALID_ORDER, total: "4.8" },
    { ...VALID_ORDER, needs_confirmation: "false" },
    { ...VALID_ORDER, items: [{ name: "flat white", size: "L" }] },
    { ...VALID_ORDER, items: [{ name: "flat white", size: "XL", price: 4.8 }] },
    { ...VALID_ORDER, extra: true },
    {
      ...VALID_ORDER,
      items: [{ name: "flat white", size: "L", price: 4.8, extra: true }],
    },
  ];
  const result = runModule(`
    const m = await import("./course/cafe/llm.ts");
    const schema = ${JSON.stringify(ORDER_SCHEMA)};
    const invalid = ${JSON.stringify(invalid)};
    const accepted = [];
    for (const value of invalid) {
      try { m.extractJSON(JSON.stringify(value), schema); accepted.push(value); } catch {}
    }
    console.log(JSON.stringify({ accepted, valid: m.extractJSON(JSON.stringify(${JSON.stringify(VALID_ORDER)}), schema) }));
  `, {
    CAFE_PROVIDER: "deepseek",
    DEEPSEEK_API_KEY: DEEPSEEK_KEY,
  });
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout) as { accepted: unknown[]; valid: unknown };
  assert.deepEqual(parsed.accepted, []);
  assert.deepEqual(parsed.valid, VALID_ORDER);
});

test("schema validation cache follows same-object mutations and has no public bypass", () => {
  const result = runModule(`
    const m = await import("./course/cafe/llm.ts");
    const schema = {
      type: "object",
      properties: { value: { type: "string" } },
      required: ["value"],
      additionalProperties: false,
    };
    const first = m.extractJSON(JSON.stringify({ value: "before" }), schema);
    schema.properties.value.type = "number";
    const rejected = [];
    try { m.extractJSON(JSON.stringify({ value: "stale" }), schema); } catch { rejected.push("mutation"); }
    try {
      m.extractJSON(JSON.stringify({ value: "bypass" }), schema, () => true);
    } catch { rejected.push("bypass"); }
    const second = m.extractJSON(JSON.stringify({ value: 2 }), schema);
    console.log(JSON.stringify({ first, second, rejected }));
  `, {
    CAFE_PROVIDER: "deepseek",
    DEEPSEEK_API_KEY: DEEPSEEK_KEY,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), {
    first: { value: "before" },
    second: { value: 2 },
    rejected: ["mutation", "bypass"],
  });
});

test("schema canonicalization preserves special own property names without pollution", () => {
  const result = runModule(`
    const m = await import("./course/cafe/llm.ts");
    const schema = JSON.parse(${JSON.stringify(JSON.stringify({
      type: "object",
      properties: {
        ["__proto__"]: { type: "string" },
        constructor: { type: "string" },
      },
      required: ["__proto__", "constructor"],
      additionalProperties: false,
    }))});
    const valid = JSON.parse('{"__proto__":"safe","constructor":"also-safe"}');
    const wrongProto = JSON.parse('{"__proto__":7,"constructor":"also-safe"}');
    const wrongConstructor = JSON.parse('{"__proto__":"safe","constructor":7}');
    const literalSchema = JSON.parse(
      '{"const":{"properties":{"__proto__":"literal","constructor":"literal"}}}',
    );
    const literal = JSON.parse(
      '{"properties":{"__proto__":"literal","constructor":"literal"}}',
    );
    const accepted = m.extractJSON(JSON.stringify(valid), schema);
    const literalAccepted = m.extractJSON(JSON.stringify(literal), literalSchema);
    const rejected = [];
    try { m.extractJSON(JSON.stringify(wrongProto), schema); } catch { rejected.push("__proto__"); }
    try { m.extractJSON(JSON.stringify(wrongConstructor), schema); } catch { rejected.push("constructor"); }
    console.log(JSON.stringify({
      accepted,
      literalAccepted,
      rejected,
      objectPrototypePolluted: Object.prototype.polluted ?? null,
      plainObjectPolluted: ({}).polluted ?? null,
    }));
  `);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), {
    accepted: { ["__proto__"]: "safe", constructor: "also-safe" },
    literalAccepted: {
      properties: { ["__proto__"]: "literal", constructor: "literal" },
    },
    rejected: ["__proto__", "constructor"],
    objectPrototypePolluted: null,
    plainObjectPolluted: null,
  });
});

test("schema refusals and truncations are metered and rejected before parsing", () => {
  for (const stopReason of ["refusal", "max_tokens", "model_context_window_exceeded"]) {
    const result = responseFixture(stopReason, JSON.stringify(VALID_ORDER), ORDER_SCHEMA);
    assert.notEqual(result.status, 0, `${stopReason}: ${result.stdout}`);
    assert.match(result.stdout, /ERROR:/);
    assert.match(result.stdout, /SPEND:1 call\(s\)/);
    assert.doesNotMatch(result.stdout, /VALUE:/);
  }
});

test("Anthropic native structured output is serialized, locally validated, and stop-safe", () => {
  const nestedWrong = { ...VALID_ORDER, items: [{ name: "flat white", size: "XL", price: 4.8 }] };
  const result = anthropicSequenceFixture([
    { stopReason: "end_turn", text: JSON.stringify(VALID_ORDER) },
    { stopReason: "end_turn", text: JSON.stringify(nestedWrong) },
    { stopReason: "end_turn", text: JSON.stringify([VALID_ORDER]) },
    { stopReason: "refusal", text: JSON.stringify(VALID_ORDER) },
    { stopReason: "max_tokens", text: JSON.stringify(VALID_ORDER) },
    { stopReason: "model_context_window_exceeded", text: JSON.stringify(VALID_ORDER) },
  ], ORDER_SCHEMA);
  assert.equal(result.status, 0, result.stderr);

  const output = Object.fromEntries(result.stdout.trim().split("\n").map((line) => {
    const split = line.indexOf(":");
    return [line.slice(0, split), line.slice(split + 1)];
  }));
  const outcomes = JSON.parse(output.OUTCOMES) as Array<{ value?: unknown; error?: string }>;
  assert.deepEqual(outcomes[0]?.value, VALID_ORDER);
  for (const outcome of outcomes.slice(1)) assert.equal(typeof outcome.error, "string");

  const bodies = JSON.parse(output.BODIES) as Array<Record<string, unknown>>;
  assert.equal(bodies.length, 6);
  for (const body of bodies) {
    assert.deepEqual(body.output_config, {
      effort: "medium",
      format: { type: "json_schema", schema: ORDER_SCHEMA },
    });
  }
  assert.deepEqual(JSON.parse(output.ORIGINS), Array(6).fill("https://api.anthropic.com"));
  assert.equal(output.FETCHES, "6");
  assert.match(output.SPEND, /^6 call\(s\)/);
  assert.doesNotMatch(result.stdout, /fixture-category/);
});

test("shared tool-turn guard rejects every incomplete or unexpected stop before side effects", () => {
  const result = runModule(`
    const m = await import("./course/cafe/llm.ts");
    const allowed = [];
    const rejected = [];
    let executed = 0;
    for (const response of [
      { stop_reason: "end_turn", content: [{ type: "text", text: "done" }] },
      {
        stop_reason: "tool_use",
        content: [{ type: "tool_use", id: "call-1", name: "place_order", input: {} }],
      },
    ]) {
      m.assertCompleteToolTurn(response);
      allowed.push(response.stop_reason);
    }
    for (const response of [
      { stop_reason: "refusal", content: [] },
      { stop_reason: "max_tokens", content: [] },
      { stop_reason: "model_context_window_exceeded", content: [] },
      { stop_reason: "pause_turn", content: [] },
      { stop_reason: "stop_sequence", content: [] },
      { stop_reason: null, content: [] },
      { stop_reason: "end_turn" },
      {
        stop_reason: "end_turn",
        content: [{ type: "tool_use", id: "call-2", name: "place_order", input: {} }],
      },
      { stop_reason: "tool_use", content: [{ type: "text", text: "not a tool" }] },
      {
        stop_reason: "tool_use",
        content: [{ type: "tool_use", id: "", name: "place_order", input: {} }],
      },
      {
        stop_reason: "tool_use",
        content: [
          { type: "tool_use", id: "duplicate", name: "place_order", input: {} },
          { type: "tool_use", id: "duplicate", name: "email_manager", input: {} },
        ],
      },
    ]) {
      try {
        m.assertCompleteToolTurn(response);
        executed += 1;
      } catch { rejected.push(response.stop_reason); }
    }
    console.log(JSON.stringify({ allowed, rejected, executed }));
  `);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), {
    allowed: ["end_turn", "tool_use"],
    rejected: [
      "refusal",
      "max_tokens",
      "model_context_window_exceeded",
      "pause_turn",
      "stop_sequence",
      null,
      "end_turn",
      "end_turn",
      "tool_use",
      "tool_use",
      "tool_use",
    ],
    executed: 0,
  });
});

test("Stage 5 and 6 meter then guard every direct response before tool execution", () => {
  for (const [file, executionMarker] of [
    ["course/stage5-loop/run.ts", "tools.RUNNERS[block.name]"],
    ["course/stage6-harness/run.ts", "await callTool(block.name"],
  ] as const) {
    const source = readFileSync(file, "utf8");
    assert.match(source, /import \{[^}]*assertCompleteToolTurn[^}]*\} from "\.\.\/cafe\/llm"/);
    const metered = source.indexOf("meter(response);");
    const guarded = source.indexOf("assertCompleteToolTurn(response);", metered);
    const executed = source.indexOf(executionMarker, guarded);
    assert.ok(metered >= 0, `${file} must meter the response`);
    assert.ok(guarded > metered, `${file} must guard after metering`);
    assert.ok(executed > guarded, `${file} must guard before tool execution`);
  }

  const solutions = readFileSync("course/SOLUTIONS.md", "utf8");
  assert.match(solutions, /Stage 5[\s\S]*?meter\(response\);[\s\S]*?assertCompleteToolTurn\(response\);/);
  assert.match(solutions, /Stage 6[\s\S]*?meter\(response\);[\s\S]*?assertCompleteToolTurn\(response\);/);
});

test("an invalid schema fails before any Provider dispatch", () => {
  const result = responseFixture("end_turn", "{}", { type: "not-a-schema-type" });
  assert.notEqual(result.status, 0, result.stdout);
  assert.match(result.stdout, /ERROR:.*schema/i);
  assert.match(result.stdout, /FETCHES:0/);
});

test("Ajv 8 is a direct production dependency", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
    dependencies?: Record<string, string>;
  };
  assert.match(pkg.dependencies?.ajv ?? "", /^\^?8\./);
});

test("Claude runtime pricing is one dated, sourced, fail-closed snapshot", async () => {
  const pricing = await import("../course/cafe/pricing");
  const pricingModule = pricing as unknown as Record<string, unknown>;
  const snapshot = pricingModule.ANTHROPIC_COURSE_PRICING as {
    currency: string;
    unitTokens: number;
    checkedAt: string;
    sourceUrl: string;
    scope: string;
    models: Record<string, Record<string, number>>;
  } | undefined;
  assert.ok(snapshot, "ANTHROPIC_COURSE_PRICING must be exported");
  assert.equal(snapshot.currency, "USD");
  assert.equal(snapshot.unitTokens, 1_000_000);
  assert.equal(snapshot.checkedAt, "2026-08-31");
  assert.equal(snapshot.sourceUrl, "https://platform.claude.com/docs/en/about-claude/pricing");
  assert.match(snapshot.scope, /standard.*first-party.*global/i);
  assert.deepEqual(snapshot.models["claude-opus-5"], {
    input: 5,
    output: 25,
    cacheRead: 0.5,
    cacheWrite5m: 6.25,
    cacheWrite1h: 10,
  });

  const price = (pricing.priceAnthropicCourseUsage as unknown as (
    model: string,
    usage: object,
  ) => Record<string, unknown>)("claude-opus-5", {
    inputTokens: 1_000,
    cachedInputTokens: 200,
    cacheCreationInputTokens: 0,
    outputTokens: 100,
  });
  assert.equal(price.known, true);
  assert.equal(price.checkedAt, snapshot.checkedAt);
  assert.equal(price.sourceUrl, snapshot.sourceUrl);
});

test("Claude spend prints its price check date without a Provider request", () => {
  const result = runModule(`
    const m = await import("./course/cafe/llm.ts");
    m.meter({ usage: {
      input_tokens: 800,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 200,
      output_tokens: 100,
    }});
    console.log(m.spend());
  `, {
    ANTHROPIC_API_KEY: ANTHROPIC_KEY,
    CAFE_PROVIDER: "anthropic",
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /prices checked 2026-08-31/);
});

test("Course 3 removes unqualified cost, score, rerun, and model-output predictions", () => {
  const check = readFileSync("course/check.ts", "utf8");
  const llm = readFileSync("course/cafe/llm.ts", "utf8");
  const root = readFileSync("course/README.md", "utf8");
  const stage0 = readFileSync("course/stage0-hello/README.md", "utf8");
  const stage2Source = readFileSync("course/stage2-prompt/run.ts", "utf8");
  const stage3 = readFileSync("course/stage3-evals/README.md", "utf8");
  const stage4 = readFileSync("course/stage4-context/README.md", "utf8");
  const stage5 = readFileSync("course/stage5-loop/README.md", "utf8");
  const stage6 = readFileSync("course/stage6-harness/README.md", "utf8");
  const stage6Source = readFileSync("course/stage6-harness/run.ts", "utf8");
  const stage7 = readFileSync("course/stage7-graph/README.md", "utf8");
  const stage7Source = readFileSync("course/stage7-graph/run.ts", "utf8");
  const evalset = readFileSync("course/cafe/evalset.ts", "utf8");
  const report = readFileSync("course/report.ts", "utf8");
  const solutions = readFileSync("course/SOLUTIONS.md", "utf8");
  const combined = [
    check, llm, root, stage0, stage2Source, stage3, stage4, stage5, stage6,
    stage6Source, stage7, stage7Source, evalset, report, solutions,
  ].join("\n");

  assert.doesNotMatch(check, /pennies|penny|\bcents?\b/i);
  assert.doesNotMatch(check, /Run it again[^\n]*point only lands|Run again until/i);
  assert.doesNotMatch(check, /re-run to see it bite/i);
  assert.doesNotMatch(check, /pennies|penny|\bcents?\b/i);
  assert.match(llm, /Live Provider calls may incur charges/i);
  const stageZeroCostBoundary =
    /Live-cost boundary:[\s\S]{0,240}one live call in the Stage\s+0 run[\s\S]{0,160}checker/i;
  assert.match(root, stageZeroCostBoundary);
  assert.match(stage0, stageZeroCostBoundary);
  assert.doesNotMatch(stage2Source, /invented|guessing|that is luck|fooled but capped/i);
  assert.doesNotMatch(check, /recovering from a failed tool|fooled but capped/i);
  assert.doesNotMatch(stage0, /model[^\n]*giving a[^\n]*different answer/i);
  assert.doesNotMatch(stage6Source, /model[^\n]*will place three/i);
  assert.doesNotMatch(report, /recovering from a failed tool|off-policy draft\(s\) stopped/i);
  assert.doesNotMatch(solutions, /menu removes[^\n]*invented-price failures/i);
  assert.match(check, /do not rerun[^\n]*force/i);
  assert.doesNotMatch(stage3, /It will not be 20|most of them are prices|watch the number move/i);
  assert.doesNotMatch(stage3, /coin flip|need hundreds|14[^\n]*15[^\n]*noise/i);
  assert.match(stage3, /observed score/i);
  assert.match(stage3, /hypothesis/i);
  assert.match(stage3, /configuration-matched/i);
  assert.doesNotMatch(stage5, /turn 8 costs far more/i);
  assert.doesNotMatch(stage6, /will try|will refuse|will draft/i);
  assert.doesNotMatch(stage7, /will be off-policy|second attempt goes out/i);
  assert.doesNotMatch(stage4, /Most [“\"]the model is bad|grows fastest/i);
  assert.doesNotMatch(stage7Source, /cheap decision/i);
  assert.doesNotMatch(evalset, /produces a coin flip/i);
  assert.doesNotMatch(combined, /low[^\n]*thinking-off switch|low[^\n]*disables thinking/i);
});
