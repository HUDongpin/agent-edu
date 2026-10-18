import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { delimiter, join } from "node:path";
import test from "node:test";
import {
  DEPENDENCY_MESSAGE,
  dependencyPaths,
  missingDependencies,
} from "../course/preflight";

const EN_MESSAGE = "Dependencies are not installed. From the repo root run: npm ci";
const ZH_MESSAGE = "依赖还没安装。请在仓库根目录运行：npm ci";

const ENTRY_POINTS = [
  ["course/check.ts", "0"],
  ["course/report.ts"],
  ["course/offline-preflight.ts"],
  ["course/stage0-hello/run.ts"],
  ["course/stage1-kiosk/run.ts"],
  ["course/stage2-prompt/run.ts"],
  ["course/stage3-evals/run.ts"],
  ["course/stage4-context/run.ts"],
  ["course/stage5-loop/run.ts"],
  ["course/stage6-harness/run.ts"],
  ["course/stage7-graph/run.ts"],
  ["course/stage8-security/run.ts"],
];

const EN_HEADINGS: Record<string, string> = {
  "0": "## Stage 0",
  "1": "## Stage 1",
  "2": "## Stage 2",
  "3": "## Stage 3",
  "4": "## Stage 4",
  "5": "## Stage 5",
  "5a": "## Stage 5a",
  "5b": "## Stage 5b",
  "6": "## Stage 6",
  "7": "## Stage 7",
  "8": "## Stage 8",
};

const ZH_HEADINGS: Record<string, string> = {
  "0": "## 第 0 阶段",
  "1": "## 第 1 阶段",
  "2": "## 第 2 阶段",
  "3": "## 第 3 阶段",
  "4": "## 第 4 阶段",
  "5": "## 第 5 阶段",
  "5a": "## 第 5a 步",
  "5b": "## 第 5b 步",
  "6": "## 第 6 阶段",
  "7": "## 第 7 阶段",
  "8": "## 第 8 阶段",
};

function sectionStarting(md: string, heading: string): string {
  const blocks = md.split(/\n(?=## )/);
  const block = blocks.find((part) => part.startsWith(`${heading}\n`));
  assert.ok(block, `missing heading ${heading}`);
  return block;
}

function assertGraduated(section: string, first: string, second: string): void {
  const atFirst = section.indexOf(first);
  const atSecond = section.indexOf(second);
  assert.ok(atFirst >= 0 && atSecond > atFirst, section.slice(0, 160));
  assert.match(section.slice(0, atFirst), /<details>/);
  assert.match(section.slice(atFirst, atSecond), /<\/details>\s*<details>/);
  assert.match(section.slice(atSecond), /<\/details>/);
  assert.match(section, /SOLUTIONS\.md/);
}

function fencedBodies(md: string): string[] {
  return [...md.matchAll(/```[^\n]*\n([\s\S]*?)```/g)].map((match) => match[1].trim());
}

test("the dependency message names npm ci in English and Chinese", () => {
  assert.equal(DEPENDENCY_MESSAGE, `${EN_MESSAGE}\n${ZH_MESSAGE}`);
  assert.deepEqual(
    missingDependencies([join(process.cwd(), "node_modules", "tsx"), "/no/such/course-dependency"]),
    ["/no/such/course-dependency"],
  );
  assert.deepEqual(missingDependencies([join(process.cwd(), "node_modules", "tsx")]), []);
});

test("COURSE_DEP_CHECK replaces the directories the preflight looks for", () => {
  const previous = process.env.COURSE_DEP_CHECK;
  process.env.COURSE_DEP_CHECK = ["/no/course-dep-a", "/no/course-dep-b"].join(delimiter);
  try {
    assert.deepEqual(dependencyPaths(), ["/no/course-dep-a", "/no/course-dep-b"]);
    assert.deepEqual(missingDependencies(), ["/no/course-dep-a", "/no/course-dep-b"]);
  } finally {
    if (previous === undefined) delete process.env.COURSE_DEP_CHECK;
    else process.env.COURSE_DEP_CHECK = previous;
  }
});

test("the default preflight looks for the SDK and tsx, both installed here", () => {
  const previous = process.env.COURSE_DEP_CHECK;
  delete process.env.COURSE_DEP_CHECK;
  try {
    const paths = dependencyPaths();
    assert.ok(paths.some((path) => path.endsWith("/node_modules/@anthropic-ai/sdk")));
    assert.ok(paths.some((path) => path.endsWith("/node_modules/tsx")));
    assert.deepEqual(missingDependencies(paths), []);
  } finally {
    if (previous === undefined) delete process.env.COURSE_DEP_CHECK;
    else process.env.COURSE_DEP_CHECK = previous;
  }
});

test("course entry points do not statically import the SDK", () => {
  const preflight = readFileSync("course/preflight.ts", "utf8");
  assert.match(preflight, /import\("\.\/cafe\/llm"\)/);
  assert.match(preflight, /import\("\.\/cafe\/evalset"\)/);
  assert.doesNotMatch(preflight, /from ["']@anthropic-ai\/sdk["']/);
  assert.doesNotMatch(preflight, /from ["']\.\/cafe\/llm["']/);

  for (const [file] of ENTRY_POINTS) {
    const src = readFileSync(file, "utf8").replace(/import\s+type\s+[^;]+;/g, "");
    assert.match(src, /preflight/, file);
    assert.doesNotMatch(src, /from ["'][^"']*cafe\/llm["']/, file);
    assert.doesNotMatch(src, /from ["'][^"']*cafe\/evalset["']/, file);
    assert.doesNotMatch(src, /from ["']@anthropic-ai\/sdk["']/, file);
  }
});

test("a missing dependency exits 1 with both languages and no module stack", { timeout: 180_000 }, () => {
  for (const args of ENTRY_POINTS) {
    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", ...args],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        env: { ...process.env, COURSE_DEP_CHECK: "/no/such/course-dependency" },
      },
    );
    const out = `${result.stdout}\n${result.stderr}`;
    assert.equal(result.status, 1, `${args.join(" ")}\n${out}`);
    assert.match(out, /Dependencies are not installed\. From the repo root run: npm ci/, args.join(" "));
    assert.match(out, /依赖还没安装。请在仓库根目录运行：npm ci/, args.join(" "));
    assert.doesNotMatch(out, /ERR_MODULE_NOT_FOUND/, args.join(" "));
  }
});

test("an installed override does not block stage 1 or the checker usage line", () => {
  const installed = join(process.cwd(), "node_modules", "tsx");
  const env = { ...process.env, COURSE_DEP_CHECK: installed };
  const stage1 = spawnSync(
    process.execPath,
    ["--import", "tsx", "course/stage1-kiosk/run.ts"],
    { cwd: process.cwd(), encoding: "utf8", env },
  );
  assert.equal(stage1.status, 0, stage1.stderr || stage1.stdout);
  assert.match(stage1.stdout, /large flat white/);
  assert.doesNotMatch(`${stage1.stdout}\n${stage1.stderr}`, /Dependencies are not installed/);

  const usage = spawnSync(
    process.execPath,
    ["--import", "tsx", "course/check.ts"],
    { cwd: process.cwd(), encoding: "utf8", env },
  );
  assert.equal(usage.status, 1);
  assert.match(usage.stdout, /usage: npx tsx course\/check\.ts <0-8>/);
  assert.doesNotMatch(`${usage.stdout}\n${usage.stderr}`, /Dependencies are not installed/);
});

test("HINTS names Hint 1 and Hint 2 for stages 0–8, 5a and 5b, in both languages", () => {
  const english = readFileSync("course/HINTS.md", "utf8");
  const chinese = readFileSync("course/HINTS.zh-Hans.md", "utf8");
  for (const id of Object.keys(EN_HEADINGS)) {
    assertGraduated(sectionStarting(english, EN_HEADINGS[id]), "Hint 1", "Hint 2");
    const zh = sectionStarting(chinese, ZH_HEADINGS[id]);
    assertGraduated(zh, "提示 1", "提示 2");
    assert.match(zh, /Hint 1/);
    assert.match(zh, /Hint 2/);
  }
});

test("stage READMEs and the course README link the hint files", () => {
  const course = readFileSync("course/README.md", "utf8");
  const courseZh = readFileSync("course/README.zh-Hans.md", "utf8");
  assert.match(course, /Stuck\?/);
  assert.match(course, /\]\(HINTS\.md\)/);
  assert.match(course, /npm ci/);
  assert.match(course, /npx tsx/);
  assert.match(courseZh, /\]\(HINTS\.zh-Hans\.md\)/);
  assert.match(courseZh, /npm ci/);

  const stages = readdirSync("course", { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^stage\d+-/.test(entry.name))
    .map((entry) => entry.name);
  assert.ok(stages.length >= 10);
  for (const stage of stages) {
    const readme = readFileSync(`course/${stage}/README.md`, "utf8");
    const zh = readFileSync(`course/${stage}/README.zh-Hans.md`, "utf8");
    assert.match(readme, /Stuck\?/, stage);
    const n = /^stage(\d+)-/.exec(stage)![1];
    const guided = Number(n) <= 8;
    // Guided stages link straight to their own section; the transfer stage to the file.
    assert.ok(readme.includes(guided ? `](../HINTS.md#stage-${n})` : "](../HINTS.md)"), stage);
    assert.match(readme, /\]\(\.\.\/SOLUTIONS\.md\)/, stage);
    assert.ok(zh.includes(guided ? `](../HINTS.zh-Hans.md#第-${n}-阶段)` : "](../HINTS.zh-Hans.md)"), stage);
    assert.match(zh, /\]\(\.\.\/SOLUTIONS\.md\)/, stage);
  }
});

test("hints do not paste a solution code block from SOLUTIONS.md", () => {
  const solutions = fencedBodies(readFileSync("course/SOLUTIONS.md", "utf8")).filter((body) => body.length > 0);
  assert.ok(solutions.length >= 8, "SOLUTIONS.md should contain the stage code blocks");
  for (const file of ["course/HINTS.md", "course/HINTS.zh-Hans.md"]) {
    const hints = readFileSync(file, "utf8");
    for (const body of solutions) {
      assert.equal(hints.includes(body), false, `${file} contains a solution block:\n${body.slice(0, 80)}`);
    }
  }
});

test("a failing check names the next edit and points at Hint 1", () => {
  const check = readFileSync("course/check.ts", "utf8");
  assert.match(check, /see course\/HINTS\.md, Stage \$\{hintStage\}, Hint 1/);
  assert.match(check, /SYSTEM never mentions a menu price — put menuText\(\) into SYSTEM so the model knows what it sells/);
  assert.match(check, /re-read course\/\$\{STAGES\[checking\]\}\/README\.md/);
  assert.match(check, /function bad\(m: string, hint\?: string\): never/);
});
