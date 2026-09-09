import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

/**
 * Scoping the dictionary took 35 kB of JSON out of every page, and put in its
 * place a failure that says nothing: a key a scope does not carry is returned
 * by `t` as itself, so the page still renders, still validates and still
 * passes every other gate in this repository — with `nav.theme` printed where
 * a label should be.
 *
 * `i18n:check` is what stands between that and a reader. These tests are about
 * the gate rather than the scopes: that it passes on the tree as it stands,
 * and that each of its three rules still fails on the shape it was written to
 * catch. A checker nobody has watched fail is indistinguishable from one that
 * returns zero.
 */
const CHECKER = "scripts/extract-i18n-scopes.mjs";

function run(root?: string) {
  const args = [CHECKER, "--check", ...(root ? [`--root=${root}`] : [])];
  return spawnSync(process.execPath, args, { cwd: process.cwd(), encoding: "utf8" });
}

/**
 * The repository, mirrored by symlink, with the named entries copied so they
 * can be edited. Same shape as prose.test.ts: the checker reads `messages/`,
 * `app/`, `config/` and `out/` together, so a fixture that cannot see all of
 * them would fail for a reason the test never asked about.
 *
 * It is handed `--root` rather than a working directory. Node resolves a
 * symlinked entry point to its real path, so a checker that located the tree
 * from `import.meta.url` would quietly read the real repository and report it
 * clean — which is how a negative test passes without ever testing anything.
 */
function withEdit(copy: string[], edit: (dir: string) => void) {
  const dir = mkdtempSync(join(tmpdir(), "i18n-scopes-"));
  try {
    for (const entry of readdirSync(".")) {
      if (entry.startsWith(".") || copy.includes(entry)) continue;
      symlinkSync(join(process.cwd(), entry), join(dir, entry));
    }
    for (const entry of copy) cpSync(entry, join(dir, entry), { recursive: true });
    edit(dir);
    return run(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("the scope manifest matches the code as it stands", () => {
  const result = run();
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("a manifest that has drifted from the code fails", () => {
  const result = withEdit(["config"], (dir) => {
    const file = join(dir, "config/i18n-scopes.json");
    const scopes = JSON.parse(readFileSync(file, "utf8"));
    scopes.chrome.keys = scopes.chrome.keys.filter((k: string) => k !== "nav.theme");
    writeFileSync(file, `${JSON.stringify(scopes, null, 2)}\n`);
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /has drifted from the code/);
});

test("a page that keeps the import but drops the wrapper fails", () => {
  const result = withEdit(["app"], (dir) => {
    const file = join(dir, "app/[locale]/lab/page.tsx");
    const src = readFileSync(file, "utf8");
    writeFileSync(file, src.replace(
      "    <I18nScope messages={messages}>\n      <Lab />\n    </I18nScope>",
      "    <Lab />",
    ));
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /does not wrap it in <I18nScope>/);
});

test("a key rendered as itself in the built export fails", () => {
  const result = withEdit(["out"], (dir) => {
    const file = join(dir, "out/en/about/index.html");
    const src = readFileSync(file, "utf8");
    writeFileSync(file, src.replace(/<h1([^>]*)>[^<]*<\/h1>/, "<h1$1>nav.theme</h1>"));
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /renders the raw key `nav\.theme`/);
});
