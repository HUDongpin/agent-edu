import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { nextAction } from "../course/check";
import {
  createExecutionContext,
  formatReport,
  load,
  parseStage9Command,
  record,
  recordStage9State,
} from "../course/report";

const STAGE_FOLDERS = [
  "stage0-hello",
  "stage1-kiosk",
  "stage2-prompt",
  "stage3-evals",
  "stage4-context",
  "stage5-loop",
  "stage6-harness",
  "stage7-graph",
  "stage8-security",
  "stage9-project",
] as const;

function context(overrides: {
  offline?: boolean;
  provider?: string;
  model?: string;
  effort?: string;
  sourceIdentity?: string;
  evalIdentity?: string;
  runId?: string;
  recordedAt?: string;
} = {}) {
  return createExecutionContext({
    offline: overrides.offline ?? false,
    provider: overrides.provider ?? "deepseek",
    model: overrides.model ?? "deepseek-v4-flash",
    effort: overrides.effort ?? "low",
    networkResponseReceived: !(overrides.offline ?? false),
    sourceIdentity: overrides.sourceIdentity ?? `sha256:${"a".repeat(64)}`,
    evalIdentity: overrides.evalIdentity ?? `sha256:${"b".repeat(64)}`,
    runId: overrides.runId ?? "run-a",
    recordedAt: overrides.recordedAt ?? "2026-08-29T10:00:00.000Z",
  });
}

test("an empty report starts with offline Stage 0, never Stage 1", () => {
  const output = formatReport({});
  assert.match(output, /Start with Stage 0/i);
  assert.match(output, /course\/check\.ts 0 --offline/);
  assert.doesNotMatch(output, /course\/check\.ts 1/);
  assert.match(output, /Stage 9.*not started/i);
  assert.match(output, /manual evidence state.*not automatic mastery/i);
});

test("Stage 9 states bind to a deterministic, materialized artifact scope", () => {
  const directory = mkdtempSync(join(tmpdir(), "course3-stage9-state-"));
  const file = join(directory, "progress.json");
  const evidence = join(directory, "evidence");
  try {
    mkdirSync(evidence);
    writeFileSync(join(evidence, "artifact.md"), "# Safe artifact\n");
    writeFileSync(join(evidence, "eval.json"), "{\"cases\":[]}\n");
    symlinkSync(join(evidence, "artifact.md"), join(evidence, "linked.md"));

    for (const unsafePath of [
      join(evidence, "artifact.md"),
      "../outside.md",
      "evidence",
      "evidence/linked.md",
      "evidence/sk-abcdefghijklmnop.md",
    ]) {
      assert.throws(
        () => recordStage9State("artifact-assembled", {
          artifacts: [unsafePath], file, root: directory,
        }),
        (error: unknown) => {
          assert.ok(error instanceof Error);
          assert.match(error.message, /artifact scope is invalid/i);
          assert.doesNotMatch(error.message, new RegExp(unsafePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
          return true;
        },
      );
    }

    assert.throws(
      () => recordStage9State("artifact-assembled", { file, root: directory }),
      /artifact scope is required/i,
    );
    assert.throws(
      () => recordStage9State("self-reviewed", { file, root: directory }),
      /artifact scope is required/i,
    );

    recordStage9State("artifact-assembled", {
      artifacts: ["evidence/eval.json", "evidence/artifact.md", "evidence/eval.json"],
      file,
      root: directory,
      recordedAt: "2026-08-29T11:00:00.000Z",
    });
    const assembledData = load(file);
    assert.deepEqual(assembledData["9"]?.scopePaths, [
      "evidence/artifact.md",
      "evidence/eval.json",
    ]);
    assert.equal(assembledData["9"]?.scopeCount, 2);
    assert.match(String(assembledData["9"]?.scopeDigest), /^sha256:[0-9a-f]{64}$/);
    assert.equal(assembledData["9"]?.scopeRecordedAt, "2026-08-29T11:00:00.000Z");
    assert.doesNotMatch(readFileSync(file, "utf8"), /Safe artifact|\"cases\"/);

    const assembled = formatReport(assembledData, { root: directory });
    assert.match(assembled, /Stage 9.*artifact assembled/i);
    assert.match(assembled, /scope [0-9a-f]{12}/i);
    assert.match(assembled, /2 files/i);
    assert.match(assembled, /manual evidence state.*not automatic mastery/i);

    recordStage9State("self-reviewed", {
      file,
      root: directory,
      recordedAt: "2026-08-29T12:00:00.000Z",
    });
    const reviewedData = load(file);
    const reviewed = formatReport(reviewedData, { root: directory });
    assert.match(reviewed, /Stage 9.*self-reviewed.*learner-attested/i);
    assert.match(reviewed, /review recorded 2026-08-29T12:00:00.000Z/i);
    assert.match(reviewed, /scope [0-9a-f]{12}/i);
    assert.doesNotMatch(reviewed, /Stage 9.*(?:passed|mastered|complete)/i);

    writeFileSync(join(evidence, "artifact.md"), "# Changed after review\n");
    const invalidated = formatReport(reviewedData, { root: directory });
    assert.match(invalidated, /review invalidated.*scope.*changed/i);
    assert.doesNotMatch(invalidated, /\bself-reviewed\b/i);

    assert.throws(
      () => recordStage9State("reviewed sk-super-secret" as "self-reviewed", {
        artifacts: ["evidence/artifact.md"], file, root: directory,
      }),
      /not-started.*artifact-assembled.*self-reviewed/i,
    );
    assert.doesNotMatch(readFileSync(file, "utf8"), /sk-super-secret/);

    recordStage9State("not-started", {
      file,
      root: directory,
      recordedAt: "2026-08-29T13:00:00.000Z",
    });
    assert.deepEqual(load(file)["9"], {
      state: "not-started",
      stateRecordedAt: "2026-08-29T13:00:00.000Z",
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("Stage 9 CLI parsing accepts repeated artifact flags without free-form evidence", () => {
  assert.deepEqual(parseStage9Command([
    "--stage9", "artifact-assembled",
    "--artifact", "notes/artifact.md",
    "--artifact=notes/eval.json",
  ]), {
    state: "artifact-assembled",
    artifacts: ["notes/artifact.md", "notes/eval.json"],
  });
  assert.throws(() => parseStage9Command(["--stage9", "artifact-assembled", "--artifact"]),
    /artifact path is required/i);
  assert.throws(() => parseStage9Command([
    "--stage9", "not-started", "--artifact", "notes/artifact.md",
  ]), /not-started.*artifact/i);
});

test("Stage 0 distinguishes offline, verified-live and unbound legacy evidence", () => {
  const offline = formatReport({
    "0": { ok: true, context: context({ offline: true }) },
  });
  assert.match(offline, /offline path works/i);
  assert.match(offline, /live credential (?:was )?not checked/i);
  assert.doesNotMatch(offline, /key works/i);

  const live = formatReport({
    "0": { ok: true, context: context() },
  });
  assert.match(live, /live credential and network path worked/i);
  assert.match(live, /deepseek/i);
  assert.match(live, /deepseek-v4-flash/i);

  const legacy = formatReport({ "0": { ok: true } });
  assert.match(legacy, /legacy record/i);
  assert.match(legacy, /does not prove/i);
  assert.doesNotMatch(legacy, /key works/i);

  const contradictory = context({ offline: true });
  contradictory.network = "response-received";
  const malformedOffline = formatReport({ "0": { ok: true, context: contradictory } });
  assert.doesNotMatch(malformedOffline, /offline path works/i);
  assert.match(malformedOffline, /does not prove/i);

  const falseRecord = formatReport({ "0": { ok: false, context: context({ offline: true }) } });
  assert.doesNotMatch(falseRecord, /offline path works|completed/i);
});

test("Stage 2 reports the denominator it actually sampled", () => {
  const output = formatReport({
    "2": { distinct: 2, questions: 3, context: context() },
  });
  assert.match(output, /2 distinct answers from 3 identical questions/);
  assert.doesNotMatch(output, /5 identical questions/);

  const legacy = formatReport({ "2": { distinct: 2 } });
  assert.match(legacy, /legacy record omitted the question count/i);
});

test("record keeps a truthful latest score and a separate best score", () => {
  const directory = mkdtempSync(join(tmpdir(), "course3-progress-"));
  const file = join(directory, "progress.json");
  try {
    writeFileSync(file, JSON.stringify({ "3": { score: 18 } }));

    record(3, { score: 12, scoreTotal: 20 }, context({ runId: "run-latest" }), file);
    const first = load(file);
    assert.equal(first["3"]?.score, 12);
    assert.equal(first["3"]?.bestScore, 18);
    assert.equal(first["3"]?.scoreTotal, 20);
    assert.equal(first["3"]?.context?.runId, "run-latest");
    assert.match(formatReport(first), /12\/20 latest.*18\/20 best/i);

    record(3, { score: 19, scoreTotal: 20 }, context({ runId: "run-best" }), file);
    const second = load(file);
    assert.equal(second["3"]?.score, 19);
    assert.equal(second["3"]?.bestScore, 19);
    assert.equal(second["3"]?.bestContext?.runId, "run-best");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("progress persistence allowlists public context fields and never serializes secrets", () => {
  const directory = mkdtempSync(join(tmpdir(), "course3-secret-safety-"));
  const file = join(directory, "progress.json");
  try {
    const unsafe = {
      ...context(),
      apiKey: "sk-super-secret",
      authorization: "Bearer very-secret",
    } as ReturnType<typeof context> & { apiKey: string; authorization: string };
    record(0, { ok: true }, unsafe, file);
    record(2, { distinct: 2, questions: 3 }, context({ runId: "safe-stage-2" }), file);
    record(2, { distinct: 1, questions: 3 }, {
      ...context(),
      model: "sk-super-secret-model-slot",
      sourceIdentity: "token-super-secret-source-slot",
      runId: "api-key-super-secret-run-slot",
      recordedAt: "Bearer very-secret timestamp slot",
    }, file);
    const serialized = readFileSync(file, "utf8");
    assert.doesNotMatch(
      serialized,
      /sk-super-secret|very-secret|token-super-secret|api-key-super-secret|apiKey|authorization/i,
    );
    assert.match(serialized, /deepseek-v4-flash/);
    assert.equal(load(file)["2"]?.context, undefined, "invalid new context must clear stale evidence");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("load, format and record normalize every stage through explicit allowlists", () => {
  const directory = mkdtempSync(join(tmpdir(), "course3-normalize-"));
  const file = join(directory, "progress.json");
  // Build secret-shaped negative fixtures at runtime so the tracked source
  // itself never becomes a credential-shaped artifact.
  const rejected = ["sk", "-", "rejected-value-must-never-echo"].join("");
  try {
    const future = { ...context(), schemaVersion: 2, model: rejected };
    writeFileSync(file, JSON.stringify({
      "0": { ok: true, score: 99, unknown: rejected, context: future },
      "1": [1, 2, 3],
      "2": null,
      "3": "malformed",
      "4": { score: "19", scoreTotal: [], context: context(), extra: rejected },
      "5": { orders: -1, context: { ...context(), provider: "openai", effort: "turbo" } },
      "6": { gated: null },
      "7": { blocked: 1, authorization: rejected },
      "8": 42,
      "9": { state: "self-reviewed", scopePaths: [rejected], note: rejected },
      "10": { ok: true, secret: rejected },
    }));

    const normalized = load(file);
    assert.deepEqual(Object.keys(normalized).sort(), ["0", "4", "5", "6", "7", "9"]);
    assert.deepEqual(normalized["0"], { ok: true });
    assert.deepEqual(normalized["4"], { context: context() });
    assert.equal(normalized["5"]?.context?.provider, undefined);
    assert.equal(normalized["5"]?.context?.effort, undefined);
    assert.equal(normalized["5"]?.context?.model, "deepseek-v4-flash");
    assert.deepEqual(normalized["6"], {});
    assert.deepEqual(normalized["7"], { blocked: 1 });
    assert.deepEqual(normalized["9"], { state: "self-reviewed" });
    const output = formatReport(normalized, { root: directory });
    assert.doesNotMatch(output, new RegExp(rejected));
    assert.doesNotThrow(() => formatReport({
      "0": null,
      "1": [],
      "3": 7,
      "4": "bad",
    } as unknown as Parameters<typeof formatReport>[0]));

    record(1, { passing: 3 }, undefined, file);
    const rewritten = readFileSync(file, "utf8");
    assert.doesNotMatch(rewritten, new RegExp(rejected));
    assert.doesNotMatch(rewritten, /"10"|"unknown"|"authorization"|"note"/);
    assert.deepEqual(load(file)["1"], { passing: 3 });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("execution context enforces schema, Provider, effort and high-confidence secret boundaries", () => {
  const rejected = [
    "sk-live-secret",
    ["gh", "p_", "abcdefghijklmnopqrstuvwxyz123456"].join(""),
    ["AK", "IA", "ABCDEFGHIJKLMNOP"].join(""),
    ["AI", "za", "SyABCDEFGHIJKLMNOPQRSTUVWXYZ12345"].join(""),
    ["gsk", "_", "abcdefghijklmnopqrstuvwxyz123456"].join(""),
    ["xai", "-", "abcdefghijklmnopqrstuvwxyz123456"].join(""),
    "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signaturevalue",
    "Bearer abcdefghijklmnopqrstuvwxyz",
    ["-----BEGIN ", "PRIVATE KEY-----"].join(""),
    "aB3dE5fG7hI9jK1mN3pQ5rS7tU9vW1xY3zA5bC7dE9fG1hI3",
  ];
  for (const value of rejected) {
    const candidate = createExecutionContext({
      offline: false,
      provider: "openai",
      model: value,
      effort: "turbo",
      networkResponseReceived: true,
      runId: value,
      recordedAt: "2026-08-29T10:00:00.000Z",
    });
    assert.equal(candidate.provider, undefined);
    assert.equal(candidate.model, undefined);
    assert.equal(candidate.effort, undefined);
    assert.notEqual(candidate.runId, value);
    assert.doesNotMatch(JSON.stringify(candidate), new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  const future = context();
  (future as { schemaVersion: number }).schemaVersion = 2;
  const output = formatReport({
    "3": { score: 7, scoreTotal: 20, context: future },
    "4": {
      score: 19,
      scoreTotal: 20,
      baselineRunId: future.runId,
      context: context({ runId: "run-4", recordedAt: "2026-08-29T11:00:00.000Z" }),
    },
  });
  assert.match(output, /not directly comparable/i);
  assert.match(output, /missing execution context/i);
});

test("Stage 3 and 4 compare only under the same execution, eval and source identities", () => {
  const baseContext = context({ runId: "run-3" });
  const stage4Context = context({ runId: "run-4", recordedAt: "2026-08-29T11:00:00.000Z" });
  const comparable = formatReport({
    "3": { score: 7, bestScore: 9, scoreTotal: 20, context: baseContext },
    "4": {
      score: 19,
      bestScore: 19,
      scoreTotal: 20,
      baselineRunId: "run-3",
      context: stage4Context,
    },
  });
  assert.match(comparable, /Configuration-matched paired results: 7\/20 → 19\/20 \(\+12\)/);
  assert.match(comparable, /Stage 3.*2026-08-29T10:00:00.000Z/i);
  assert.match(comparable, /Stage 4.*2026-08-29T11:00:00.000Z/i);
  assert.match(comparable, /Provider aliases may drift/i);
  assert.match(comparable, /attribution requires inspecting the Stage 2–4 prompt diff/i);
  assert.doesNotMatch(comparable, /adding the menu improved/i);

  for (const [label, changed] of [
    ["model", context({ model: "claude-opus-5", runId: "run-4", recordedAt: "2026-08-29T11:00:00.000Z" })],
    ["effort", context({ effort: "high", runId: "run-4", recordedAt: "2026-08-29T11:00:00.000Z" })],
    ["eval", context({ evalIdentity: `sha256:${"c".repeat(64)}`, runId: "run-4", recordedAt: "2026-08-29T11:00:00.000Z" })],
    ["source", context({ sourceIdentity: `sha256:${"d".repeat(64)}`, runId: "run-4", recordedAt: "2026-08-29T11:00:00.000Z" })],
    ["mode", context({ offline: true, runId: "run-4", recordedAt: "2026-08-29T11:00:00.000Z" })],
  ] as const) {
    const output = formatReport({
      "3": { score: 7, scoreTotal: 20, context: context({ runId: "run-3" }) },
      "4": { score: 19, scoreTotal: 20, baselineRunId: "run-3", context: changed },
    });
    assert.match(output, /not directly comparable/i, `${label} mismatch must fail closed`);
    assert.match(output, new RegExp(label, "i"));
    assert.doesNotMatch(output, /Configuration-matched paired results/);
  }

  const legacy = formatReport({
    "3": { score: 7 },
    "4": { score: 19 },
  });
  assert.match(legacy, /not directly comparable/i);
  assert.match(legacy, /missing execution context/i);

  const missingLiveIdentity = context({ runId: "run-4" });
  delete missingLiveIdentity.provider;
  delete missingLiveIdentity.model;
  const missingProviderModel = formatReport({
    "3": { score: 7, scoreTotal: 20, context: context({ runId: "run-3" }) },
    "4": { score: 19, scoreTotal: 20, baselineRunId: "run-3", context: missingLiveIdentity },
  });
  assert.match(missingProviderModel, /not directly comparable/i);
  assert.match(missingProviderModel, /Provider.*model.*missing/i);

  const missingDenominators = formatReport({
    "3": { score: 7, context: context({ runId: "run-3" }) },
    "4": {
      score: 19,
      baselineRunId: "run-3",
      context: context({ runId: "run-4", recordedAt: "2026-08-29T11:00:00.000Z" }),
    },
  });
  assert.match(missingDenominators, /not directly comparable/i);
  assert.match(missingDenominators, /score denominator.*missing/i);

  const contradictoryOffline3 = context({ offline: true, runId: "run-3" });
  const contradictoryOffline4 = context({
    offline: true,
    runId: "run-4",
    recordedAt: "2026-08-29T11:00:00.000Z",
  });
  contradictoryOffline3.network = "response-received";
  contradictoryOffline4.network = "response-received";
  const contradictoryOffline = formatReport({
    "3": { score: 7, scoreTotal: 20, context: contradictoryOffline3 },
    "4": {
      score: 19,
      scoreTotal: 20,
      baselineRunId: "run-3",
      context: contradictoryOffline4,
    },
  });
  assert.match(contradictoryOffline, /not directly comparable/i);
  assert.match(contradictoryOffline, /missing execution context|offline network evidence/i);
});

test("Stage 4 binds the current Stage 3 run and enforces ordering and a 24-hour window", () => {
  const directory = mkdtempSync(join(tmpdir(), "course3-pairing-"));
  const file = join(directory, "progress.json");
  try {
    record(3, { score: 7, scoreTotal: 20 }, context({
      runId: "baseline-a",
      recordedAt: "2026-08-29T10:00:00.000Z",
    }), file);
    record(4, { score: 19, scoreTotal: 20 }, context({
      runId: "context-a",
      recordedAt: "2026-08-29T11:00:00.000Z",
    }), file);
    let data = load(file);
    assert.equal(data["4"]?.baselineRunId, "baseline-a");
    assert.match(formatReport(data), /Configuration-matched paired results/i);

    record(3, { score: 8, scoreTotal: 20 }, context({
      runId: "baseline-b",
      recordedAt: "2026-08-29T12:00:00.000Z",
    }), file);
    data = load(file);
    const rerun = formatReport(data);
    assert.match(rerun, /not directly comparable/i);
    assert.match(rerun, /baseline run binding/i);

    const base = context({ runId: "baseline-z", recordedAt: "2026-08-29T10:00:00.000Z" });
    for (const [label, stage4] of [
      ["baseline run binding", {
        baselineRunId: "wrong-baseline",
        context: context({ runId: "context-z", recordedAt: "2026-08-29T11:00:00.000Z" }),
      }],
      ["timestamp order", {
        baselineRunId: "baseline-z",
        context: context({ runId: "context-z", recordedAt: "2026-08-29T09:59:59.999Z" }),
      }],
      ["24-hour pairing window", {
        baselineRunId: "baseline-z",
        context: context({ runId: "context-z", recordedAt: "2026-08-30T10:00:00.001Z" }),
      }],
    ] as const) {
      const output = formatReport({
        "3": { score: 7, scoreTotal: 20, context: base },
        "4": { score: 19, scoreTotal: 20, ...stage4 },
      });
      assert.match(output, /not directly comparable/i);
      assert.match(output, new RegExp(label, "i"));
      assert.doesNotMatch(output, /Configuration-matched paired results/i);
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("terminal completion always gives a concrete next action", () => {
  for (let stage = 0; stage < 8; stage++) {
    assert.match(nextAction(stage), new RegExp(`Stage ${stage + 1}`));
  }
  assert.match(nextAction(8), /Guided stages 0–8 complete/);
  assert.match(nextAction(8), /Stage 9 transfer project/);
  assert.match(nextAction(8), /course\/stage9-project\/README\.md/);
});

test("Stage 1 remains local evidence and never claims a model network response", () => {
  const source = readFileSync("course/check.ts", "utf8");
  const stage1 = source.slice(source.indexOf("async 1(m)"), source.indexOf("async 2(m)"));
  assert.match(stage1, /record\(1,/);
  assert.doesNotMatch(stage1, /executionContext|response-received/);
});

test("the shared source identity binds the npm ci dependency lock", () => {
  const source = readFileSync("course/report.ts", "utf8");
  assert.match(source, /(?:join|resolve)\(ROOT_DIR, "package-lock\.json"\)/);
});

test("every Stage 0–9 guide has position, previous, index and next navigation", () => {
  for (let stage = 0; stage <= 9; stage++) {
    const source = readFileSync(`course/${STAGE_FOLDERS[stage]}/README.md`, "utf8");
    assert.match(source, new RegExp(`Stage ${stage} of 10`), `Stage ${stage} needs its position`);
    assert.match(source, /Previous:/, `Stage ${stage} needs Previous navigation`);
    assert.match(source, /Course index/, `Stage ${stage} needs Course index navigation`);
    assert.match(source, /Next:/, `Stage ${stage} needs Next navigation`);
    if (stage > 0) assert.match(source, new RegExp(`\.\./${STAGE_FOLDERS[stage - 1]}/README\\.md`));
    if (stage < 9) assert.match(source, new RegExp(`\.\./${STAGE_FOLDERS[stage + 1]}/README\\.md`));
  }

  const stage8 = readFileSync("course/stage8-security/README.md", "utf8");
  assert.doesNotMatch(stage8, /\*\*Done\.\*\*/);
  assert.match(stage8, /guided stages 0–8 (?:are )?complete/i);
  assert.match(stage8, /stage9-project\/README\.md/);

  const stage9 = readFileSync("course/stage9-project/README.md", "utf8");
  assert.match(stage9, /## Completion checklist/);
  assert.match(stage9, /review state/i);
  assert.match(stage9, /Course 3/i);
  assert.match(stage9, /All courses/i);
});

test("clean-clone instructions use npm ci, edit Stage 0 before running, and cover PowerShell", () => {
  const course = readFileSync("course/README.md", "utf8");
  const stage0 = readFileSync("course/stage0-hello/README.md", "utf8");

  assert.match(course, /npm ci/);
  assert.doesNotMatch(course, /npm install/);
  assert.ok(course.indexOf("npm ci") < course.indexOf("QUESTION"));
  assert.ok(course.indexOf("QUESTION") < course.indexOf("course/stage0-hello/run.ts"));
  assert.match(course, /\$env:DEEPSEEK_API_KEY/);
  assert.match(course, /\$env:ANTHROPIC_API_KEY/);
  assert.doesNotMatch(course, /If you only do two stages/i);
  assert.doesNotMatch(course, /\| 0 \|[^\n]*one model call/i);
  assert.match(course, /\| 0 \|[^\n]*local stand-in[^\n]*live response/i);

  assert.match(stage0, /npm ci/);
  assert.doesNotMatch(stage0, /^# Stage 0 — one call$/m);
  assert.match(stage0, /^# Stage 0 — .*call seam$/m);
  assert.ok(stage0.indexOf("QUESTION") < stage0.indexOf("course/stage0-hello/run.ts"));
  assert.match(stage0, /\$env:DEEPSEEK_API_KEY/);
  assert.match(stage0, /\$env:ANTHROPIC_API_KEY/);
});

test("the POSIX clean-copy commands run literally offline without mutating the source worktree", {
  skip: process.platform === "win32",
}, () => {
  const sourceRoot = process.cwd();
  const directory = mkdtempSync(join(tmpdir(), "course3-clean-copy-"));
  const sourceStage0 = readFileSync("course/stage0-hello/run.ts", "utf8");
  const sourceProgress = existsSync("course/progress.json")
    ? readFileSync("course/progress.json")
    : undefined;
  const env = {
    ...process.env,
    ANTHROPIC_API_KEY: "",
    CAFE_EFFORT: "",
    CAFE_MODEL: "",
    CAFE_PROVIDER: "",
    DEEPSEEK_API_KEY: "",
  };
  const run = (command: string, args: string[]) => spawnSync(command, args, {
    cwd: directory,
    encoding: "utf8",
    env,
  });

  try {
    for (const file of ["package.json", "package-lock.json"]) {
      cpSync(resolve(sourceRoot, file), join(directory, file));
    }
    cpSync(resolve(sourceRoot, "lib"), join(directory, "lib"), { recursive: true });
    cpSync(resolve(sourceRoot, "course"), join(directory, "course"), {
      recursive: true,
      filter: (source) => source !== resolve(sourceRoot, "course/progress.json"),
    });

    const installCheck = run("npm", ["ci", "--dry-run", "--ignore-scripts", "--offline"]);
    assert.equal(installCheck.status, 0, installCheck.stderr || installCheck.stdout);
    if (existsSync(join(directory, "node_modules"))) {
      rmSync(join(directory, "node_modules"), { recursive: true, force: true });
    }
    symlinkSync(resolve(sourceRoot, "node_modules"), join(directory, "node_modules"), "dir");

    const preflight = run("npm", ["run", "course:offline"]);
    assert.equal(preflight.status, 0, preflight.stderr || preflight.stdout);
    assert.match(preflight.stdout, /PASS  no API key is required/);

    const copiedStage0 = join(directory, "course/stage0-hello/run.ts");
    const edited = readFileSync(copiedStage0, "utf8").replace(
      'export const QUESTION = "";',
      'export const QUESTION = "Explain one safe local check.";',
    );
    assert.notEqual(edited, sourceStage0);
    writeFileSync(copiedStage0, edited);

    const stageRun = run("npx", ["tsx", "course/stage0-hello/run.ts", "--offline"]);
    assert.equal(stageRun.status, 0, stageRun.stderr || stageRun.stdout);
    assert.match(stageRun.stdout, /scripted offline response/i);

    const check = run("npx", ["tsx", "course/check.ts", "0", "--offline"]);
    assert.equal(check.status, 0, check.stderr || check.stdout);
    assert.match(check.stdout, /PASS  you wrote a question/);
    assert.match(check.stdout, /PASS  the local stand-in returned an answer/);
    assert.doesNotMatch(check.stdout, /asked the model|live model response came back/i);

    const progress = JSON.parse(readFileSync(join(directory, "course/progress.json"), "utf8"));
    assert.equal(progress["0"].ok, true);
    assert.equal(progress["0"].context.mode, "offline");
    assert.equal(progress["0"].context.network, "not-attempted");
    assert.equal(progress["0"].context.provider, undefined);
    assert.equal(progress["0"].context.model, undefined);

    const assembled = run("npx", [
      "tsx", "course/report.ts",
      "--stage9", "artifact-assembled",
      "--artifact", "course/stage9-project/artifact-template.md",
      "--artifact", "course/stage9-project/eval-template.json",
    ]);
    assert.equal(assembled.status, 0, assembled.stderr || assembled.stdout);
    assert.match(assembled.stdout, /artifact assembled.*scope [0-9a-f]{12}/i);
    const selfReviewed = run("npx", ["tsx", "course/report.ts", "--stage9", "self-reviewed"]);
    assert.equal(selfReviewed.status, 0, selfReviewed.stderr || selfReviewed.stdout);
    assert.match(selfReviewed.stdout, /self-reviewed.*review recorded.*scope [0-9a-f]{12}/i);

    assert.equal(readFileSync("course/stage0-hello/run.ts", "utf8"), sourceStage0);
    if (sourceProgress === undefined) assert.equal(existsSync("course/progress.json"), false);
    else assert.deepEqual(readFileSync("course/progress.json"), sourceProgress);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("the compatibility CI gate includes the Course 3 Phase 1 browser suite", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
    scripts: Record<string, string>;
  };
  assert.match(pkg.scripts["test:compat"], /e2e\/compat\.spec\.ts/);
  assert.match(pkg.scripts["test:compat"], /e2e\/course3-phase1\.spec\.ts/);
});
