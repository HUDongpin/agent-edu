import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { checkSecrets } from "../scripts/check-secrets.mjs";
import { checkTrackedArtifacts } from "../scripts/check-tracked-artifacts.mjs";
import { sourceInventory } from "../scripts/lib/source-inventory.mjs";

function uploadedSourceFixture() {
  const root = mkdtempSync(join(tmpdir(), "agent-edu-uploaded-source-"));
  mkdirSync(join(root, "scripts"), { recursive: true });
  mkdirSync(join(root, "node_modules/package"), { recursive: true });
  mkdirSync(join(root, ".next/cache"), { recursive: true });
  mkdirSync(join(root, "out"), { recursive: true });
  mkdirSync(join(root, "output/playwright"), { recursive: true });
  mkdirSync(join(root, "tmp"), { recursive: true });
  writeFileSync(join(root, "scripts/safe.mjs"), "export const safe = true;\n");
  writeFileSync(join(root, "node_modules/package/index.js"), "ignored dependency\n");
  writeFileSync(join(root, ".next/cache/build"), "ignored cache\n");
  writeFileSync(join(root, "out/index.html"), "ignored export\n");
  writeFileSync(join(root, "output/playwright/report.html"), "ignored report\n");
  writeFileSync(join(root, "tmp/ledger.json"), "ignored runtime ledger\n");
  return root;
}

test("no-git uploaded source inventory supports both release scanners", () => {
  const root = uploadedSourceFixture();
  try {
    assert.deepEqual(sourceInventory({ root }), {
      mode: "uploaded-source",
      files: ["scripts/safe.mjs"],
    });
    assert.doesNotThrow(() => checkSecrets({ root }));
    assert.doesNotThrow(() => checkTrackedArtifacts({ root }));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("no-git secret scanning fails closed on non-regular uploaded entries", () => {
  const root = uploadedSourceFixture();
  try {
    symlinkSync("safe.mjs", join(root, "scripts/linked.mjs"));
    assert.throws(() => checkSecrets({ root }), /tracked-file finding/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the style and i18n structural gates share the no-git source inventory", () => {
  const styleSource = readFileSync(
    new URL("../scripts/check-styles.mjs", import.meta.url),
    "utf8",
  );
  const i18nSource = readFileSync(
    new URL("../scripts/check-i18n-release.mjs", import.meta.url),
    "utf8",
  );
  assert.match(styleSource, /sourceInventory\(\{ root: ROOT \}\)\.files/);
  assert.match(i18nSource, /sourceInventory\(\{ root: ROOT \}\)\.files/);
});
