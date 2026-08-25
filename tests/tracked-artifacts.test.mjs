import test from "node:test";
import assert from "node:assert/strict";
import { artifactFindings } from "../scripts/check-tracked-artifacts.mjs";

test("tracked artifact rules reject only generated output", () => {
  assert.deepEqual(
    artifactFindings([
      "tmp/node-compile-cache/v24/cache",
      "tmp/docx-render/page-1.png",
      "nested/node_modules/pkg/index.js",
      "playwright-report/index.html",
      "outputs/grok-audit/contact-sheet.png",
    ]).map(({ id }) => id),
    ["temporary-output", "temporary-output", "dependency-tree", "browser-run", "legacy-output-root"],
  );
  assert.deepEqual(
    artifactFindings([
      "tests/fixtures/catalog.json",
      "evidence/mcp_release_v1/evidence.json",
    ]),
    [],
  );
  assert.deepEqual(
    artifactFindings(["outputs/release-readiness.json"]).map(({ id }) => id),
    ["legacy-output-root"],
  );
});
