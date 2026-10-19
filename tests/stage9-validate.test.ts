import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  LEARNER_MIN_CASES,
  TEMPLATE_MIN_CASES,
  TEMPLATE_PATH,
  minimumFor,
  validateEvalDocument,
} from "../course/stage9-project/validate";

function doc(count: number, risk = "reversible") {
  return {
    version: 1,
    systemUnderTest: "the returns desk",
    scoringRule: "a person checks the evidence",
    cases: Array.from({ length: count }, (_, index) => ({
      id: `case-${index}`,
      input: `input ${index}`,
      expectedEvidence: "the desk logged it",
      risk: index === 0 ? risk : "reversible",
    })),
    runs: [],
  };
}

test("the shipped template passes at three cases and a learner file needs five", () => {
  const template = JSON.parse(readFileSync(TEMPLATE_PATH, "utf8")) as unknown;
  assert.deepEqual(validateEvalDocument(template, TEMPLATE_MIN_CASES), []);
  const short = validateEvalDocument(template, LEARNER_MIN_CASES);
  assert.equal(short.length, 1);
  assert.match(short[0]?.message ?? "", /at least 5/);
  assert.equal(minimumFor(TEMPLATE_PATH), TEMPLATE_MIN_CASES);
  assert.equal(minimumFor("course/stage9-project/eval-template.json"), TEMPLATE_MIN_CASES);
  assert.equal(minimumFor("/tmp/learner-eval.json"), LEARNER_MIN_CASES);
});

test("a bad risk and a missing runs array are format errors", () => {
  const badRisk = doc(5, "catastrophic");
  assert.ok(validateEvalDocument(badRisk, LEARNER_MIN_CASES).some((issue) => issue.path.endsWith(".risk")));
  const { runs: _runs, ...withoutRuns } = doc(5);
  const issues = validateEvalDocument(withoutRuns, LEARNER_MIN_CASES);
  assert.ok(issues.some((issue) => issue.path === "runs"));
});

test("the default command passes the template, and a learner file is judged at five cases", () => {
  const directory = mkdtempSync(join(tmpdir(), "stage9-eval-"));
  try {
    const bare = spawnSync(
      process.execPath,
      ["--import", "tsx", "course/stage9-project/validate.ts"],
      { cwd: process.cwd(), encoding: "utf8", timeout: 20_000 },
    );
    assert.equal(bare.status, 0, bare.stderr || bare.stdout);
    assert.match(bare.stdout, /PASS/);
    assert.match(bare.stdout, /NOTE/);
    assert.match(bare.stdout, /at least 5/);

    const four = join(directory, "four.json");
    writeFileSync(four, JSON.stringify(doc(4)));
    const tooFew = spawnSync(
      process.execPath,
      ["--import", "tsx", "course/stage9-project/validate.ts", four],
      { cwd: process.cwd(), encoding: "utf8", timeout: 20_000 },
    );
    assert.equal(tooFew.status, 1, tooFew.stdout);
    assert.match(`${tooFew.stdout}\n${tooFew.stderr}`, /at least 5/);

    const five = join(directory, "five.json");
    writeFileSync(five, JSON.stringify(doc(5)));
    const enough = spawnSync(
      process.execPath,
      ["--import", "tsx", "course/stage9-project/validate.ts", five],
      { cwd: process.cwd(), encoding: "utf8", timeout: 20_000 },
    );
    assert.equal(enough.status, 0, enough.stderr || enough.stdout);
    assert.match(enough.stdout, /PASS/);
    assert.doesNotMatch(enough.stdout, /NOTE/);

    const hostile = join(directory, "hostile.json");
    writeFileSync(hostile, JSON.stringify(doc(5, "banned")));
    const refused = spawnSync(
      process.execPath,
      ["--import", "tsx", "course/stage9-project/validate.ts", hostile],
      { cwd: process.cwd(), encoding: "utf8", timeout: 20_000 },
    );
    assert.equal(refused.status, 1);
    assert.match(`${refused.stdout}\n${refused.stderr}`, /risk must be one of/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("stage 9 points at a first hour, and the worked example opens with the score it lost", () => {
  const english = readFileSync("course/stage9-project/README.md", "utf8");
  const chinese = readFileSync("course/stage9-project/README.zh-Hans.md", "utf8");
  assert.match(english, /## The first hour/);
  assert.match(chinese, /## 第一个小时/);
  for (const text of [english, chinese]) {
    assert.match(text, /npx tsx course\/stage9-project\/validate\.ts/);
    assert.match(text, /eval-template\.json/);
  }
  const example = readFileSync("course/stage9-project/worked-example.md", "utf8");
  const summaryAt = example.indexOf("The short version.");
  const sectionAt = example.indexOf("## 1. Domain and problem boundary");
  assert.ok(summaryAt !== -1 && summaryAt < sectionAt);
  assert.match(example.slice(0, sectionAt), /11 of 12/);
  assert.match(example.slice(0, sectionAt), /8 of 20 to 16 of 20/);
});
