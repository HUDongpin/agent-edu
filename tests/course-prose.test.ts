import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

/**
 * The course READMEs point at real identifiers in real files, and until
 * `prose:check` existed nothing read them — which is how three names left over
 * from the Python original sat in stage 2 telling learners to open functions
 * that had never been written. The gate closes that class, so these tests are
 * about the gate rather than the prose: they prove it still passes on the tree
 * as it stands, and that each of its four rules still fails on the shape it
 * was written to catch. A checker nobody has watched fail is indistinguishable
 * from one that returns zero.
 */
const CHECKER = "scripts/check-course-prose.mjs";

function run(courseDir?: string) {
  return spawnSync(
    process.execPath,
    courseDir ? [CHECKER, `--course=${courseDir}`] : [CHECKER],
    { cwd: process.cwd(), encoding: "utf8" },
  );
}

/**
 * The real course, copied, so a deliberate defect can be injected into it.
 *
 * The copy sits in a mirror of the repository root — `course/README.md` links
 * `../LICENSE` and `../legacy/course-python/`, and a fixture those cannot reach
 * would fail for reasons the test never asked about, which is how a suite ends
 * up green on the wrong evidence.
 */
function withBrokenProse(edit: (readme: string) => string, assertOn: (dir: string) => void) {
  const dir = mkdtempSync(join(tmpdir(), "prose-"));
  try {
    for (const entry of readdirSync(".")) {
      if (entry === "course" || entry.startsWith(".")) continue;
      symlinkSync(join(process.cwd(), entry), join(dir, entry));
    }
    cpSync("course", join(dir, "course"), { recursive: true });
    const readme = join(dir, "course", "stage2-prompt", "README.md");
    writeFileSync(readme, edit(readFileSync(readme, "utf8")));
    assertOn(join(dir, "course"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** One injected defect should produce exactly the problems it is meant to. */
function onlyProblems(stderr: string, n: number) {
  assert.match(stderr, new RegExp(`prose: ${n} problem\\(s\\)`));
}

test("every path and identifier the course prose names resolves against the tree", () => {
  const result = run();
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /every path and identifier the course names resolves/);
});

test("an identifier that exists nowhere fails, and the message names the near miss", () => {
  withBrokenProse(
    (src) => src.replace("`extractJSON`", "`extract_json`"),
    (dir) => {
      const result = run(dir);
      assert.equal(result.status, 1);
      onlyProblems(result.stderr, 1);
      assert.match(result.stderr, /`extract_json`, which exists nowhere/);
      assert.match(result.stderr, /`extractJSON` is spelled that way in the tree/);
    },
  );
});

test("Python's leading-underscore naming fails, and the message names the real function", () => {
  withBrokenProse(
    (src) => src.replace("`schemaFallback`", "`_schema_fallback`"),
    (dir) => {
      const result = run(dir);
      assert.equal(result.status, 1);
      onlyProblems(result.stderr, 2);   // the shape rule and the unknown name
      assert.match(result.stderr, /leading-underscore private naming/);
      assert.match(result.stderr, /the name in the tree is `schemaFallback`/);
    },
  );
});

test("a Python keyword argument fails even when every name in it is real", () => {
  withBrokenProse(
    (src) => src.replace("`ask(prompt, { schema })`", "`ask(prompt, schema=schema)`"),
    (dir) => {
      const result = run(dir);
      assert.equal(result.status, 1);
      onlyProblems(result.stderr, 1);
      assert.match(result.stderr, /passes a Python keyword argument/);
    },
  );
});

test("an arrow function is not mistaken for a Python keyword argument", () => {
  // `=` inside a call is the tell for `schema=schema`, and `x => x` contains
  // one. Prose that shows a lambda must not be read as prose that shows Python.
  withBrokenProse(
    (src) => src.replace("`ask(prompt, { schema })`", "`CASES.map(c => c.said)`"),
    (dir) => {
      const result = run(dir);
      assert.equal(result.status, 0, result.stderr || result.stdout);
    },
  );
});

test("a path the prose tells the reader to open must exist", () => {
  withBrokenProse(
    (src) => src.replace("`cafe/llm.ts`", "`cafe/llm_client.ts`"),
    (dir) => {
      const result = run(dir);
      assert.equal(result.status, 1);
      onlyProblems(result.stderr, 1);
      assert.match(result.stderr, /`cafe\/llm_client\.ts` resolves to nothing/);
    },
  );
});

test("an identifier named beside a file must be in that file, not merely somewhere", () => {
  // `menuText` is real, exported, and used across the course — but it is not in
  // llm.ts, which is the file this paragraph tells the reader to open. Presence
  // somewhere in course/ is not the claim the sentence makes.
  withBrokenProse(
    (src) => src.replace("read `schemaFallback` and `extractJSON`", "read `menuText` and `extractJSON`"),
    (dir) => {
      const result = run(dir);
      assert.equal(result.status, 1);
      onlyProblems(result.stderr, 1);
      assert.match(result.stderr, /`menuText` is named in a paragraph about .*llm\.ts, but it is not in that file/);
    },
  );
});

test("the gate is wired into CI beside the other prose checkers", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(pkg.scripts["prose:check"], `node ${CHECKER}`);
  assert.match(readFileSync(".github/workflows/ci.yml", "utf8"), /^\s+- run: npm run prose:check$/m);
});
