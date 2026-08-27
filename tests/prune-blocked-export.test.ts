import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { pruneBlockedExport } from "../scripts/prune-blocked-export.mjs";

function registry(codexState: "published" | "blocked" = "blocked") {
  return {
    siteLocales: ["en", "ar"],
    courses: [
      { id: "published", state: "published", routes: ["published/"] },
      { id: "codex", state: codexState, routes: ["codex/", "codex/lesson/"] },
    ],
  };
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "agent-edu-prune-blocked-"));
  mkdirSync(join(root, "out/en"), { recursive: true });
  mkdirSync(join(root, "out/courses/codex"), { recursive: true });
  mkdirSync(join(root, "out/courses/published"), { recursive: true });
  writeFileSync(join(root, "out/en/index.html"), "<!doctype html><title>Published</title>");
  writeFileSync(join(root, "out/courses/codex/blocked.png"), "blocked-source\n");
  writeFileSync(join(root, "out/courses/published/kept.png"), "published-source\n");
  return root;
}

test("blocked export pruning removes exact media roots and preserves published assets", () => {
  const root = fixture();
  try {
    const result = pruneBlockedExport({ projectRoot: root, emit: false, registry: registry() });
    assert.deepEqual(result.blockedCourseIds, ["codex"]);
    assert.deepEqual(result.removed, ["codex"]);
    assert.equal(existsSync(join(root, "out/courses/codex")), false);
    assert.equal(existsSync(join(root, "out/courses/published/kept.png")), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("blocked export pruning is a safe no-op after every course is published", () => {
  const root = fixture();
  try {
    const result = pruneBlockedExport({
      projectRoot: root,
      emit: false,
      registry: registry("published"),
    });
    assert.deepEqual(result.blockedCourseIds, []);
    assert.deepEqual(result.removed, []);
    assert.equal(existsSync(join(root, "out/courses/codex/blocked.png")), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("blocked export pruning fails before deletion when published HTML references blocked media", () => {
  const root = fixture();
  try {
    writeFileSync(
      join(root, "out/en/index.html"),
      '<!doctype html><img src="/courses/codex/blocked.png">',
    );
    assert.throws(
      () => pruneBlockedExport({ projectRoot: root, emit: false, registry: registry() }),
      /published export references blocked course media/,
    );
    assert.equal(existsSync(join(root, "out/courses/codex/blocked.png")), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("blocked export pruning fails rather than deleting a generated public route", () => {
  const root = fixture();
  try {
    mkdirSync(join(root, "out/en/codex"), { recursive: true });
    writeFileSync(join(root, "out/en/codex/index.html"), "<!doctype html><title>Blocked</title>");
    assert.throws(
      () => pruneBlockedExport({ projectRoot: root, emit: false, registry: registry() }),
      /blocked public route was generated/,
    );
    assert.equal(existsSync(join(root, "out/courses/codex/blocked.png")), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
