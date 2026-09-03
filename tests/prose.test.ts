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
const CHECKER = "scripts/check-prose.mjs";

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
  assert.match(result.stdout, /every path, identifier and citation resolves/);
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

/**
 * The citation rule runs repo-wide rather than over a fixture, because what it
 * checks is the relationship between a document and the tree it cites. These
 * drive it through a temporary document instead — written into docs/, removed
 * afterwards — so the assertions are about real files at real line numbers.
 */
function withDoc(body: string, assertOn: () => void) {
  const path = join("docs", "prose-check-fixture.md");
  writeFileSync(path, body);
  try {
    assertOn();
  } finally {
    rmSync(path, { force: true });
  }
}

test("a citation whose line has drifted fails, and the message says where it went", () => {
  // `.hb .rail-list::before` really is in globals.css, just not at line 100.
  withDoc(
    "# fixture\n\n`.hb .rail-list::before` at `app/globals.css:100` draws the rail.\n",
    () => {
      const result = run();
      assert.equal(result.status, 1);
      assert.match(result.stderr, /citation `app\/globals\.css:100` is not where/);
      assert.match(result.stderr, /`\.hb \.rail-list::before` is at app\/globals\.css:602/);
    },
  );
});

test("a citation that lands on its subject passes", () => {
  withDoc(
    "# fixture\n\n`.hb .rail-list::before` at `app/globals.css:602` draws the rail.\n",
    () => {
      const result = run();
      assert.equal(result.status, 0, result.stderr || result.stdout);
    },
  );
});

test("a citation past the end of a file is named as such, not as a drift", () => {
  withDoc(
    "# fixture\n\n`.hb .rail-list::before` at `app/globals.css:99999` draws the rail.\n",
    () => {
      const result = run();
      assert.equal(result.status, 1);
      assert.match(result.stderr, /points past the end of app\/globals\.css, which has \d+ lines/);
    },
  );
});

test("a paragraph naming nothing the file contains is left alone, not guessed at", () => {
  // No anchor means no evidence either way. Reporting here would be inventing.
  withDoc(
    "# fixture\n\nSomething unrelated is discussed at `app/globals.css:100`.\n",
    () => {
      const result = run();
      assert.equal(result.status, 0, result.stderr || result.stdout);
    },
  );
});

test("a neighbouring bullet's subject is not read as this bullet's", () => {
  // The first bullet's citation is correct. Without per-item scoping the
  // second bullet's selector would be borrowed to judge it, and it would fail.
  withDoc(
    "# fixture\n\n"
    + "- `.hb .rail-list::before` at `app/globals.css:602` draws the rail.\n"
    + "- `.hb .t-model` is a different rule entirely.\n",
    () => {
      const result = run();
      assert.equal(result.status, 0, result.stderr || result.stdout);
    },
  );
});

test("an en-dash range is read as a range, not truncated to its first number", () => {
  // `.hb .slider-row` is at 807 and the range input at 808. Citing 807–808 is
  // correct; a reader of only "807" would still pass, so the proof is the
  // reverse — a range whose *end* carries the subject.
  withDoc(
    "# fixture\n\n`.hb input[type=range]` at `app/globals.css:800\u2013808` styles it.\n",
    () => {
      const result = run();
      assert.equal(result.status, 0, result.stderr || result.stdout);
    },
  );
});

test("the briefs are exempt from identifier resolution but not from citations", () => {
  // The house rule exempts docs/course-briefs/ because those courses do not
  // exist yet. Their citations point into lib/ and app/, which do.
  const src = readFileSync(CHECKER, "utf8");
  assert.match(src, /course-briefs/);
  const result = run();
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /file:line citations/);
});

test("the gate is wired into CI beside the other prose checkers", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(pkg.scripts["prose:check"], `node ${CHECKER}`);
  assert.match(readFileSync(".github/workflows/ci.yml", "utf8"), /^\s+- run: npm run prose:check$/m);
});
