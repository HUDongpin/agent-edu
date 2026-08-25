import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { checkStaticAssets } from "../scripts/check-static-assets.mjs";

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "agent-edu-assets-"));
  for (const path of [
    ".next",
    "out/_next/static/build-one",
    "out/en",
    "out/docs",
    "public/docs",
  ]) mkdirSync(join(root, path), { recursive: true });
  writeFileSync(join(root, ".next/BUILD_ID"), "build-one\n");
  writeFileSync(join(root, ".next/prerender-manifest.json"), JSON.stringify({
    routes: { "/en/": {} },
  }));
  writeFileSync(join(root, "out/_next/static/build-one/app.js"), "const ready = true;\n");
  writeFileSync(join(root, "out/en/index.html"), "<!doctype html><title>safe</title>\n");
  writeFileSync(join(root, "public/docs/card.png"), "public-image-fixture\n");
  writeFileSync(join(root, "out/docs/card.png"), "public-image-fixture\n");
  return root;
}

test("static inventory covers Next chunks, emitted public files, and route payloads", () => {
  const root = fixture();
  try {
    const inventory = checkStaticAssets({ projectRoot: root, emit: false });
    assert.equal(inventory.schemaVersion, 2);
    assert.deepEqual(inventory.categories, {
      nextStatic: { fileCount: 1, bytes: 20 },
      emittedPublic: { fileCount: 1, bytes: 21 },
      routePayloads: { fileCount: 1, bytes: 35 },
    });
    assert.deepEqual(
      inventory.files.map((file) => [file.path, file.category]),
      [
        ["out/_next/static/<build-id>/app.js", "next-static"],
        ["out/docs/card.png", "emitted-public"],
        ["out/en/index.html", "route-payload"],
      ],
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("static inventory fails when a same-size public asset was not emitted byte-for-byte", () => {
  const root = fixture();
  try {
    writeFileSync(join(root, "out/docs/card.png"), `${"x".repeat(20)}\n`);
    assert.throws(
      () => checkStaticAssets({ projectRoot: root, emit: false }),
      /emitted public asset contents drifted/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
