import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { applyRecord, formatReport, parsePrediction, parseProgress } from "../course/report";

const PROGRESS = "course/progress.json";

test("parsePrediction reads a whole number and never waits for a keyboard", () => {
  assert.deepEqual(parsePrediction(["3", "--offline"]), { status: "absent" });
  assert.deepEqual(parsePrediction(["3", "--predict", "12", "--offline"]), { status: "ok", value: 12 });
  assert.deepEqual(parsePrediction(["--predict", "0"]), { status: "ok", value: 0 });
  for (const argv of [
    ["3", "--predict"],
    ["3", "--predict", "12.5"],
    ["3", "--predict", "-1"],
    ["3", "--predict", "01"],
    ["3", "--predict", "--offline"],
  ]) {
    const parsed = parsePrediction(argv);
    assert.equal(parsed.status, "bad", argv.join(" "));
  }
});

test("a later passing run drops a prediction it did not make, and the report says both numbers", () => {
  const first = applyRecord({}, 3, { score: 8, prediction: 12 });
  assert.equal(first["3"]?.prediction, 12);
  assert.equal(first["3"]?.latest, 8);
  assert.match(formatReport(first), /you predicted 12, got 8/);

  const again = applyRecord(first, 3, { score: 6 }, ["prediction"]);
  assert.equal(again["3"]?.score, 8);
  assert.equal(again["3"]?.latest, 6);
  assert.equal("prediction" in (again["3"] ?? {}), false);
  const text = formatReport(again);
  assert.match(text, /your best was 8\/20/);
  assert.doesNotMatch(text, /you predicted/);

  const replaced = applyRecord(again, 4, { score: 16, prediction: 16 });
  assert.match(formatReport(replaced), /you predicted 16, got 16/);
});

test("an invalid --predict exits before a stage starts and does not touch progress", () => {
  const before = existsSync(PROGRESS) ? readFileSync(PROGRESS, "utf8") : null;
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", "course/check.ts", "3", "--predict", "nope", "--offline"],
    { cwd: process.cwd(), encoding: "utf8", timeout: 20_000 },
  );
  const out = `${result.stdout}\n${result.stderr}`;
  assert.equal(result.status, 1, out);
  assert.match(out, /--predict needs a whole number/);
  assert.doesNotMatch(out, /checking stage/);
  assert.equal(existsSync(PROGRESS) ? readFileSync(PROGRESS, "utf8") : null, before);
});

test("stage 3 and 4 --predict --offline fail on the empty TODO and do not hang or record", () => {
  const before = existsSync(PROGRESS) ? readFileSync(PROGRESS, "utf8") : null;
  for (const [stage, needle] of [
    ["3", "SYSTEM_UNDER_TEST is still null"],
    ["4", "SYSTEM is still empty"],
  ] as const) {
    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", "course/check.ts", stage, "--predict", "12", "--offline"],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        timeout: 20_000,
        env: { ...process.env, DEEPSEEK_API_KEY: "", ANTHROPIC_API_KEY: "" },
      },
    );
    const out = `${result.stdout}\n${result.stderr}`;
    assert.equal(result.status, 1, `${stage}\n${out}`);
    assert.match(out, new RegExp(needle), out);
    assert.doesNotMatch(out, /recorded/);
    assert.equal(result.error?.name === "Error" && /timed out/.test(result.error.message), false, out);
  }
  assert.equal(existsSync(PROGRESS) ? readFileSync(PROGRESS, "utf8") : null, before);
});

test("stage 3 and 4 READMEs document the optional non-interactive prediction", () => {
  for (const file of [
    "course/stage3-evals/README.md",
    "course/stage3-evals/README.zh-Hans.md",
  ]) {
    const text = readFileSync(file, "utf8");
    assert.match(text, /npx tsx course\/check\.ts 3 --predict 12/);
    assert.match(text, /progress\.json/);
  }
  for (const file of [
    "course/stage4-context/README.md",
    "course/stage4-context/README.zh-Hans.md",
  ]) {
    const text = readFileSync(file, "utf8");
    assert.match(text, /npx tsx course\/check\.ts 4 --predict 16/);
    assert.match(text, /progress\.json/);
  }
});

test("a half-written progress file is reported and left in place", () => {
  assert.equal(parseProgress("{").status, "invalid");
  assert.equal(parseProgress("null").status, "invalid");
  assert.equal(parseProgress("[]").status, "invalid");
  assert.equal(parseProgress('{"0":{"ok":true}}').status, "ok");

  const broken = {
    "0": { ok: true },
    "1": { passing: "no" },
    "3": 8,
    "6": { gated: "oops" },
  } as never;
  const text = formatReport(broken);
  assert.match(text, /your key works/);
  assert.match(text, /kiosk {6}·/);
  assert.match(text, /evals {6}·/);
  assert.match(text, /harness {4}·/);
  assert.doesNotMatch(text, /undefined|\$NaN/);

  const replaced = applyRecord({ "3": "hello" } as never, 3, { score: 4 });
  assert.deepEqual(replaced["3"], { latest: 4, score: 4 });

  const dir = mkdtempSync(join(tmpdir(), "progress-report-"));
  try {
    symlinkSync(join(process.cwd(), "node_modules"), join(dir, "node_modules"));
    symlinkSync(join(process.cwd(), "package.json"), join(dir, "package.json"));
    cpSync("course", join(dir, "course"), { recursive: true });
    const file = join(dir, "course", "progress.json");
    const half = '{\n "0": { "ok": true }';
    writeFileSync(file, half);
    const report = spawnSync(process.execPath, ["--import", "tsx", "course/report.ts"], {
      cwd: dir,
      encoding: "utf8",
      timeout: 20_000,
    });
    assert.equal(report.status, 1, report.stdout + report.stderr);
    assert.match(report.stderr, /could not be read/);
    assert.match(report.stderr, /left unchanged/);
    assert.equal(readFileSync(file, "utf8"), half);

    writeFileSync(join(dir, "keep.ts"), [
      'import { record } from "./course/report.ts";',
      "record(1, { passing: 3 });",
      'console.log("WROTE");',
    ].join("\n"));
    const kept = spawnSync(process.execPath, ["--import", "tsx", "keep.ts"], {
      cwd: dir,
      encoding: "utf8",
      timeout: 20_000,
    });
    assert.equal(kept.status, 1, kept.stdout + kept.stderr);
    assert.doesNotMatch(kept.stdout, /WROTE/);
    assert.equal(readFileSync(file, "utf8"), half);

    rmSync(file);
    const missing = spawnSync(process.execPath, ["--import", "tsx", "course/report.ts"], {
      cwd: dir,
      encoding: "utf8",
      timeout: 20_000,
    });
    assert.equal(missing.status, 0, missing.stderr || missing.stdout);
    assert.match(missing.stdout, /Nothing recorded yet/);
    assert.equal(existsSync(file), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
