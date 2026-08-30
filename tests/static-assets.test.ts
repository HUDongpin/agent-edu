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
    "out/sitemaps",
    "public/docs",
    "config",
  ]) mkdirSync(join(root, path), { recursive: true });
  writeFileSync(join(root, "config/course-release-surface.json"), JSON.stringify({
    courses: [
      { id: "published", state: "published" },
      { id: "codex", state: "blocked" },
      { id: "claude", state: "blocked" },
      { id: "cursor", state: "blocked" },
    ],
  }));
  writeFileSync(join(root, ".next/BUILD_ID"), "build-one\n");
  writeFileSync(join(root, ".next/prerender-manifest.json"), JSON.stringify({
    routes: { "/en/": {} },
  }));
  writeFileSync(join(root, "out/_next/static/build-one/app.js"), "const ready = true;\n");
  writeFileSync(join(root, "out/en/index.html"), "<!doctype html><title>safe</title>\n");
  writeFileSync(join(root, "out/sitemaps/core-en.xml"), "<urlset></urlset>\n");
  writeFileSync(join(root, "public/docs/card.png"), "public-image-fixture\n");
  writeFileSync(join(root, "out/docs/card.png"), "public-image-fixture\n");
  return root;
}

test("static inventory covers Next chunks, emitted public files, and route payloads", () => {
  const root = fixture();
  try {
    const inventory = checkStaticAssets({ projectRoot: root, emit: false });
    assert.equal(inventory.schemaVersion, 3);
    assert.deepEqual(inventory.categories, {
      nextStatic: { fileCount: 1, bytes: 20 },
      emittedPublic: { fileCount: 1, bytes: 21 },
      routePayloads: { fileCount: 2, bytes: 53 },
      htmlRscPayloads: { fileCount: 1, bytes: 35 },
      sitemapShards: { fileCount: 1, bytes: 18 },
      publicMedia: { fileCount: 1, bytes: 21 },
      excludedBlockedSourceAssets: { fileCount: 0, bytes: 0 },
    });
    assert.deepEqual(
      inventory.files.map((file) => [file.path, file.category]),
      [
        ["out/_next/static/<build-id>/app.js", "next-static"],
        ["out/docs/card.png", "emitted-public"],
        ["out/en/index.html", "route-payload"],
        ["out/sitemaps/core-en.xml", "route-payload"],
      ],
    );
    assert.equal(inventory.budgets.routePayloadBytes.limit, 550 * 1024);
    assert.equal(inventory.budgets.totalExportBytes.limit, (64 * 1024 * 1024) + (600 * 1024));
    assert.equal(
      inventory.budgets.javascriptBytes.limit,
      Math.ceil(inventory.budgets.javascriptBytes.baseline * 1.1),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("static inventory enforces the 500 KiB public-media, HTML/RSC, and sitemap caps", () => {
  for (const [path, expected] of [
    ["out/docs/card.png", /largestPublicMediaBytes 512001 > 512000/],
    ["out/en/index.html", /largestHtmlRscBytes 512001 > 512000/],
    ["out/sitemaps/core-en.xml", /largestSitemapShardBytes 512001 > 512000/],
  ] as const) {
    const root = fixture();
    try {
      if (path === "out/docs/card.png") {
        writeFileSync(join(root, "public/docs/card.png"), Buffer.alloc(512_001));
      }
      writeFileSync(join(root, path), Buffer.alloc(512_001));
      assert.throws(
        () => checkStaticAssets({ projectRoot: root, emit: false }),
        expected,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }
});

test("static inventory fails closed for a course media directory without an audited baseline", () => {
  const root = fixture();
  try {
    mkdirSync(join(root, "public/courses/unreviewed"), { recursive: true });
    mkdirSync(join(root, "out/courses/unreviewed"), { recursive: true });
    writeFileSync(join(root, "public/courses/unreviewed/new.png"), "media\n");
    writeFileSync(join(root, "out/courses/unreviewed/new.png"), "media\n");
    assert.throws(
      () => checkStaticAssets({ projectRoot: root, emit: false }),
      /courseMediaBytes\.unreviewed has no audited baseline/,
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

test("static inventory preserves blocked source evidence but requires it to be absent from out", () => {
  const root = fixture();
  try {
    mkdirSync(join(root, "public/courses/codex"), { recursive: true });
    writeFileSync(join(root, "public/courses/codex/evidence.png"), "blocked-evidence\n");
    const inventory = checkStaticAssets({ projectRoot: root, emit: false });
    assert.deepEqual(inventory.categories.excludedBlockedSourceAssets, {
      fileCount: 1,
      bytes: 17,
    });

    mkdirSync(join(root, "out/courses/codex"), { recursive: true });
    writeFileSync(join(root, "out/courses/codex/evidence.png"), "blocked-evidence\n");
    assert.throws(
      () => checkStaticAssets({ projectRoot: root, emit: false }),
      /blocked course asset was emitted/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("static inventory accepts an empty blocked-course set", () => {
  const root = fixture();
  try {
    writeFileSync(join(root, "config/course-release-surface.json"), JSON.stringify({
      courses: [
        { id: "published", state: "published" },
        { id: "codex", state: "published" },
      ],
    }));
    const inventory = checkStaticAssets({ projectRoot: root, emit: false });
    assert.deepEqual(inventory.categories.excludedBlockedSourceAssets, {
      fileCount: 0,
      bytes: 0,
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("publishing a course stops treating its curriculum sentinel as a blocked leak", () => {
  const root = fixture();
  try {
    writeFileSync(join(root, "config/course-release-surface.json"), JSON.stringify({
      courses: [
        { id: "published", state: "published" },
        { id: "codex", state: "published" },
      ],
    }));
    writeFileSync(
      join(root, "out/_next/static/build-one/app.js"),
      'const publishedCurriculum = "practice-meet-codex";\n',
    );
    assert.doesNotThrow(() => checkStaticAssets({ projectRoot: root, emit: false }));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("static inventory rejects blocked gate and curriculum internals in client chunks", () => {
  for (const sentinel of [
    "capture-evidence-required",
    "publication-permission-required",
    "publication-rights-evidence-required",
    "practice-meet-codex",
    "practice-choose-your-surface",
    "practice-orient-privacy",
    "The surface does not change the responsibility model",
    "Claude is a family of working surfaces",
    "Privacy Mode is not local-only mode",
  ]) {
    const root = fixture();
    try {
      writeFileSync(
        join(root, "out/_next/static/build-one/app.js"),
        `const leakedBlockedInternal = ${JSON.stringify(sentinel)};\n`,
      );
      assert.throws(
        () => checkStaticAssets({ projectRoot: root, emit: false }),
        /blocked course internals entered the public export/,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }
});

test("static inventory rejects registry-owned blocked media paths in public payloads", () => {
  const root = fixture();
  try {
    writeFileSync(
      join(root, "out/_next/static/build-one/app.js"),
      'const blockedMedia = "/courses/codex/figures/figure.png";\n',
    );
    assert.throws(
      () => checkStaticAssets({ projectRoot: root, emit: false }),
      /blocked course media path entered the public export: codex/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
