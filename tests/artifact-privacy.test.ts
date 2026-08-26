import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  truncateSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import test from "node:test";
import { deflateRawSync, deflateSync } from "node:zlib";
import {
  ArtifactPrivacyError,
  MAX_EMBEDDED_REPORT_BASE64_CHARS,
  MAX_FILE_BYTES,
  crc32,
  scanArtifactRoots,
} from "../scripts/check-artifacts.mjs";
import { validatePrivateReporterOutput } from "../scripts/run-private-playwright.mjs";

type ZipEntry = {
  name: string;
  content: string | Buffer;
  mode?: number;
  descriptor?: boolean;
  timestampExtra?: boolean;
};

function zip(entries: ZipEntry[]): Buffer {
  const localRecords: Buffer[] = [];
  const centralRecords: Buffer[] = [];
  let localOffset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const content = Buffer.isBuffer(entry.content)
      ? entry.content
      : Buffer.from(entry.content, "utf8");
    const compressed = deflateRawSync(content);
    const checksum = crc32(content);
    const flags = 0x0800 | (entry.descriptor ? 0x0008 : 0);
    const timestampExtra = entry.timestampExtra
      ? Buffer.from([0x55, 0x54, 0x05, 0x00, 0x03, 0x00, 0x00, 0x00, 0x00])
      : Buffer.alloc(0);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(flags, 6);
    local.writeUInt16LE(8, 8);
    if (!entry.descriptor) {
      local.writeUInt32LE(checksum, 14);
      local.writeUInt32LE(compressed.length, 18);
      local.writeUInt32LE(content.length, 22);
    }
    local.writeUInt16LE(name.length, 26);

    const descriptor = entry.descriptor ? Buffer.alloc(16) : Buffer.alloc(0);
    if (entry.descriptor) {
      descriptor.writeUInt32LE(0x08074b50, 0);
      descriptor.writeUInt32LE(checksum, 4);
      descriptor.writeUInt32LE(compressed.length, 8);
      descriptor.writeUInt32LE(content.length, 12);
    }

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE((3 << 8) | 20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(flags, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(content.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(timestampExtra.length, 30);
    central.writeUInt32LE(((entry.mode ?? 0o100644) << 16) >>> 0, 38);
    central.writeUInt32LE(localOffset, 42);

    localRecords.push(local, name, compressed, descriptor);
    centralRecords.push(central, name, timestampExtra);
    localOffset += local.length + name.length + compressed.length + descriptor.length;
  }

  const central = Buffer.concat(centralRecords);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(central.length, 12);
  end.writeUInt32LE(localOffset, 16);
  return Buffer.concat([...localRecords, central, end]);
}

function embeddedReportHtml(
  archive: Buffer,
  carrier: "template" | "script" = "template",
): string {
  const data = `data:application/zip;base64,${archive.toString("base64")}`;
  if (carrier === "script") {
    return `<html><body><script id="playwrightReportBase64" type="application/zip">${data}</script></body></html>`;
  }
  return `<html><body><template id="playwrightReportBase64">${data}</template></body></html>`;
}

async function inWorkspace(
  run: (fixture: { workspace: string; artifacts: string; root: string }) => Promise<void>,
) {
  const workspace = mkdtempSync(join(tmpdir(), "agent-edu-artifact-privacy-"));
  const artifacts = join(workspace, "artifacts");
  mkdirSync(artifacts);
  try {
    await run({ workspace, artifacts, root: basename(artifacts) });
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
}

function category(error: unknown): string | undefined {
  return error instanceof ArtifactPrivacyError ? error.category : undefined;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBytes = Buffer.from(type, "ascii");
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  typeBytes.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 8 + data.length);
  return chunk;
}

function strictPng(metadata = false, rgba = [0xe5, 0xe7, 0xeb, 0xff]): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(1, 0);
  header.writeUInt32BE(1, 4);
  header[8] = 8;
  header[9] = 6;
  const chunks = [pngChunk("IHDR", header)];
  if (metadata) chunks.push(pngChunk("tEXt", Buffer.from("Comment\0private metadata", "utf8")));
  chunks.push(pngChunk("IDAT", deflateSync(Buffer.from([0, ...rgba]))));
  chunks.push(pngChunk("IEND", Buffer.alloc(0)));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ...chunks,
  ]);
}

function digest(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function writeCuratedBundle(
  artifacts: string,
  options: { metadataPng?: boolean; screenshot?: Buffer; trace?: string } = {},
) {
  const bundle = join(artifacts, "safe-failure-0123456789abcdefabcd");
  mkdirSync(bundle);
  const screenshot = options.screenshot ?? strictPng(options.metadataPng);
  const trace = Buffer.from(options.trace ?? `${JSON.stringify({
    schemaVersion: "agent-edu.curated-browser-evidence.v1",
    tracePolicy: "structural-metadata-only-no-url-query-header-body-text",
    screenshots: false,
    sources: false,
    attachments: false,
    events: [{ sequence: 1, event: "response", status: 200 }],
  })}\n`);
  const consoleFile = Buffer.from(`${JSON.stringify({
    schemaVersion: "agent-edu.curated-browser-evidence.v1",
    consolePolicy: "counts-only-no-console-or-error-text",
    counts: { warning: 1 },
    pageErrorCount: 0,
  })}\n`);
  writeFileSync(join(bundle, "screenshot.png"), screenshot);
  writeFileSync(join(bundle, "trace.json"), trace);
  writeFileSync(join(bundle, "console.json"), consoleFile);
  const manifest = {
    schemaVersion: "agent-edu.curated-browser-evidence.v1",
    kind: "curated-safe-browser-failure",
    provenance: {
      sanitizerPolicy: "uniform-redaction-surface-v2",
      fixturePolicy: "public-fixed-safe-smoke-only",
      testIdSha256: "a".repeat(64),
      browserName: "chromium",
      projectName: "chromium",
      commitSha: "local-uncommitted",
    },
    files: {
      "console.json": { contentType: "application/json", bytes: consoleFile.length, sha256: digest(consoleFile) },
      "screenshot.png": {
        contentType: "image/png",
        sanitization: "uniform-redaction-surface-v2",
        bytes: screenshot.length,
        sha256: digest(screenshot),
      },
      "trace.json": { contentType: "application/json", bytes: trace.length, sha256: digest(trace) },
    },
  };
  writeFileSync(join(bundle, "manifest.json"), `${JSON.stringify(manifest)}\n`);
  return bundle;
}

function rewriteBoundJson(
  bundle: string,
  name: "console.json" | "trace.json",
  mutate: (value: Record<string, unknown>) => void,
) {
  const path = join(bundle, name);
  const value = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  mutate(value);
  const bytes = Buffer.from(`${JSON.stringify(value)}\n`);
  writeFileSync(path, bytes);
  const manifestPath = join(bundle, "manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
    files: Record<string, { bytes: number; sha256: string }>;
  };
  manifest.files[name].bytes = bytes.length;
  manifest.files[name].sha256 = digest(bytes);
  writeFileSync(manifestPath, `${JSON.stringify(manifest)}\n`);
}

function rewriteManifest(
  bundle: string,
  mutate: (value: Record<string, unknown>) => void,
) {
  const path = join(bundle, "manifest.json");
  const value = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  mutate(value);
  writeFileSync(path, `${JSON.stringify(value)}\n`);
}

test("missing and empty artifact roots pass safely", async () => {
  await inWorkspace(async ({ workspace, root }) => {
    const result = await scanArtifactRoots([root, "missing-results"], { cwd: workspace });
    assert.deepEqual(result, {
      roots: 1,
      missingRoots: 1,
      files: 0,
      zipEntries: 0,
      embeddedReports: 0,
      bytesScanned: 0,
    });
  });
});

test("safe UTF-8 files and safe compressed ZIP entries pass", async () => {
  await inWorkspace(async ({ workspace, artifacts, root }) => {
    const text = "Playwright run complete. No private request data retained.\n";
    writeFileSync(join(artifacts, "summary.txt"), text);
    writeFileSync(join(artifacts, "trace.zip"), zip([
      {
        name: "trace.trace",
        content: "safe trace metadata\n",
        descriptor: true,
        timestampExtra: true,
      },
      { name: "nested/report.json", content: '{"status":"failed","privateData":false}' },
    ]));
    const result = await scanArtifactRoots([root], { cwd: workspace });
    assert.equal(result.files, 2);
    assert.equal(result.zipEntries, 2);
    assert.equal(result.embeddedReports, 0);
    assert.ok(result.bytesScanned > Buffer.byteLength(text));
  });
});

for (const carrier of ["template", "script"] as const) {
  test(`safe embedded Playwright report in the exact ${carrier} carrier passes`, async () => {
    await inWorkspace(async ({ workspace, artifacts, root }) => {
      writeFileSync(join(artifacts, "index.html"), embeddedReportHtml(zip([
        { name: "report.json", content: '{"status":"safe"}' },
      ]), carrier));
      const result = await scanArtifactRoots([root], { cwd: workspace });
      assert.equal(result.files, 1);
      assert.equal(result.embeddedReports, 1);
      assert.equal(result.zipEntries, 1);
    });
  });
}

test("sensitive content inside the embedded report ZIP fails closed", async () => {
  await inWorkspace(async ({ workspace, artifacts, root }) => {
    const secret = ["PW", "FAKE", "KEY", "DO", "NOT", "LEAK", "7f3d9c2a"].join("_");
    writeFileSync(join(artifacts, "index.html"), embeddedReportHtml(zip([
      { name: "report.json", content: JSON.stringify({ output: secret }) },
    ])));
    await assert.rejects(
      () => scanArtifactRoots([root], { cwd: workspace }),
      (error: unknown) => {
        assert.ok(error instanceof ArtifactPrivacyError);
        assert.equal(error.category, "known-private-test-value");
        assert.equal(error.message.includes(secret), false);
        return true;
      },
    );
  });
});

test("malformed carrier and non-canonical base64 fail closed", async () => {
  await inWorkspace(async ({ workspace, artifacts, root }) => {
    const safeData = `data:application/zip;base64,${zip([
      { name: "report.json", content: "safe" },
    ]).toString("base64")}`;
    writeFileSync(
      join(artifacts, "index.html"),
      `<script type="application/zip" id="playwrightReportBase64">${safeData}</script>`,
    );
    await assert.rejects(
      () => scanArtifactRoots([root], { cwd: workspace }),
      (error: unknown) => category(error) === "embedded-report-shape-invalid",
    );
    writeFileSync(
      join(artifacts, "index.html"),
      '<template id="playwrightReportBase64">data:application/zip;base64,AB==</template>',
    );
    await assert.rejects(
      () => scanArtifactRoots([root], { cwd: workspace }),
      (error: unknown) => category(error) === "embedded-report-base64-invalid",
    );
  });
});

test("duplicate embedded carriers and additional ZIP data URIs fail closed", async () => {
  await inWorkspace(async ({ workspace, artifacts, root }) => {
    const report = embeddedReportHtml(zip([{ name: "report.json", content: "safe" }]));
    writeFileSync(join(artifacts, "index.html"), `${report}${report}`);
    await assert.rejects(
      () => scanArtifactRoots([root], { cwd: workspace }),
      (error: unknown) => category(error) === "embedded-report-duplicate",
    );
    writeFileSync(
      join(artifacts, "index.html"),
      `${report}<span>data:application/zip;base64,AAAA</span>`,
    );
    await assert.rejects(
      () => scanArtifactRoots([root], { cwd: workspace }),
      (error: unknown) => category(error) === "embedded-report-extra-data",
    );
  });
});

test("a second embedded report in another artifact file fails closed", async () => {
  await inWorkspace(async ({ workspace, artifacts, root }) => {
    const report = embeddedReportHtml(zip([{ name: "report.json", content: "safe" }]));
    writeFileSync(join(artifacts, "a.html"), report);
    writeFileSync(join(artifacts, "b.html"), report);
    await assert.rejects(
      () => scanArtifactRoots([root], { cwd: workspace }),
      (error: unknown) => category(error) === "embedded-report-duplicate",
    );
  });
});

test("an oversized embedded report is rejected before base64 decoding", async () => {
  await inWorkspace(async ({ workspace, artifacts, root }) => {
    const oversized = "A".repeat(MAX_EMBEDDED_REPORT_BASE64_CHARS + 4);
    writeFileSync(
      join(artifacts, "index.html"),
      `<template id="playwrightReportBase64">data:application/zip;base64,${oversized}</template>`,
    );
    await assert.rejects(
      () => scanArtifactRoots([root], { cwd: workspace }),
      (error: unknown) => category(error) === "embedded-report-too-large",
    );
  });
});

const sensitiveCases = [
  {
    expected: "authorization-header",
    content: ["Authorization: Bearer ", "private-session-value-12345"].join(""),
  },
  {
    expected: "cookie-header",
    content: ["Cookie: session=", "private-session-value"].join(""),
  },
  {
    expected: "provider-api-key",
    content: ["sk", "-", "A".repeat(28)].join(""),
  },
  {
    expected: "api-key-field",
    content: JSON.stringify({ apiKey: ["private", "credential", "value"].join("-") }),
  },
  {
    expected: "signed-url",
    content: ["https://preview.example.test/run?X-Amz-Signature=", "private-signature"].join(""),
  },
  {
    expected: "known-private-test-value",
    content: ["PW", "FAKE", "KEY", "DO", "NOT", "LEAK", "7f3d9c2a"].join("_"),
  },
  {
    expected: "raw-request-body",
    content: JSON.stringify({ requestBody: "private learner prompt" }),
  },
  {
    expected: "provider-response-payload",
    content: JSON.stringify({ choices: [{ message: { content: "private provider reply" } }] }),
  },
];

for (const [index, fixture] of sensitiveCases.entries()) {
  test(`sensitive text category ${index + 1} fails closed`, async () => {
    await inWorkspace(async ({ workspace, artifacts, root }) => {
      writeFileSync(join(artifacts, "result.txt"), fixture.content);
      await assert.rejects(
        () => scanArtifactRoots([root], { cwd: workspace }),
        (error: unknown) => category(error) === fixture.expected,
      );
    });
  });
}

test("sensitive content in a trace ZIP entry is detected without echoing it", async () => {
  await inWorkspace(async ({ workspace, artifacts, root }) => {
    const secret = ["Bearer ", "zip-private-value-987654321"].join("");
    writeFileSync(join(artifacts, "trace.zip"), zip([
      { name: "trace.network", content: secret },
    ]));
    await assert.rejects(
      () => scanArtifactRoots([root], { cwd: workspace }),
      (error: unknown) => {
        assert.ok(error instanceof ArtifactPrivacyError);
        assert.equal(error.category, "bearer-token");
        assert.match(error.path, /trace\.zip!\/trace\.network$/);
        assert.equal(error.message.includes(secret), false);
        return true;
      },
    );
  });
});

test("filesystem and ZIP symlinks fail closed", async () => {
  await inWorkspace(async ({ workspace, artifacts, root }) => {
    const target = join(artifacts, "target.txt");
    writeFileSync(target, "safe target");
    symlinkSync(target, join(artifacts, "link.txt"));
    await assert.rejects(
      () => scanArtifactRoots([root], { cwd: workspace }),
      (error: unknown) => category(error) === "symlink",
    );
    rmSync(join(artifacts, "link.txt"));
    writeFileSync(join(artifacts, "trace.zip"), zip([
      { name: "link", content: "target.txt", mode: 0o120777 },
    ]));
    await assert.rejects(
      () => scanArtifactRoots([root], { cwd: workspace }),
      (error: unknown) => category(error) === "zip-symlink",
    );
  });
});

test("oversized and binary files fail closed", async () => {
  await inWorkspace(async ({ workspace, artifacts, root }) => {
    const oversized = join(artifacts, "oversized.txt");
    writeFileSync(oversized, "");
    truncateSync(oversized, MAX_FILE_BYTES + 1);
    await assert.rejects(
      () => scanArtifactRoots([root], { cwd: workspace }),
      (error: unknown) => category(error) === "file-too-large",
    );
    rmSync(oversized);
    writeFileSync(join(artifacts, "screenshot.png"), Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x00, 0x0d, 0x0a, 0x1a, 0x0a,
    ]));
    await assert.rejects(
      () => scanArtifactRoots([root], { cwd: workspace }),
      (error: unknown) => category(error) === "binary-or-invalid-utf8",
    );
  });
});

test("a complete manifest-bound curated browser bundle passes", async () => {
  await inWorkspace(async ({ workspace, artifacts, root }) => {
    writeCuratedBundle(artifacts);
    const stats = await scanArtifactRoots([root], {
      cwd: workspace,
      curated: true,
      requireRoots: true,
    });
    assert.equal(stats.files, 4);
  });
});

test("curated JSON schemas reject ordinary confidential fields at every boundary", async () => {
  const confidential = "ordinary learner confidential phrase 42b7";
  const cases: Array<{
    expected: string;
    mutate(bundle: string): void;
  }> = [
    {
      expected: "curated-trace-invalid",
      mutate: (bundle) => rewriteBoundJson(bundle, "trace.json", (value) => {
        value.privateLearnerPrompt = confidential;
      }),
    },
    {
      expected: "curated-console-invalid",
      mutate: (bundle) => rewriteBoundJson(bundle, "console.json", (value) => {
        value.privateModelReply = confidential;
      }),
    },
    {
      expected: "curated-trace-invalid",
      mutate: (bundle) => rewriteBoundJson(bundle, "trace.json", (value) => {
        const events = value.events as Array<Record<string, unknown>>;
        events[0].privateRequestBody = confidential;
      }),
    },
    {
      expected: "curated-manifest-invalid",
      mutate: (bundle) => rewriteManifest(bundle, (value) => {
        value.privateLearnerPrompt = confidential;
      }),
    },
    {
      expected: "curated-manifest-invalid",
      mutate: (bundle) => rewriteManifest(bundle, (value) => {
        const provenance = value.provenance as Record<string, unknown>;
        provenance.privateLearnerPrompt = confidential;
      }),
    },
    {
      expected: "curated-hash-mismatch",
      mutate: (bundle) => rewriteManifest(bundle, (value) => {
        const files = value.files as Record<string, Record<string, unknown>>;
        files["trace.json"].privateLearnerPrompt = confidential;
      }),
    },
  ];
  for (const fixture of cases) {
    await inWorkspace(async ({ workspace, artifacts, root }) => {
      const bundle = writeCuratedBundle(artifacts);
      fixture.mutate(bundle);
      await assert.rejects(
        () => scanArtifactRoots([root], { cwd: workspace, curated: true, requireRoots: true }),
        (error: unknown) => category(error) === fixture.expected,
      );
    });
  }
});

test("a manifest-bound screenshot must be the uniform redaction surface", async () => {
  await inWorkspace(async ({ workspace, artifacts, root }) => {
    writeCuratedBundle(artifacts, {
      screenshot: strictPng(false, [0x00, 0x00, 0x00, 0xff]),
    });
    await assert.rejects(
      () => scanArtifactRoots([root], { cwd: workspace, curated: true, requireRoots: true }),
      (error: unknown) => category(error) === "png-redaction-pixels-invalid",
    );
  });
});

test("required curated roots and manifests fail closed when missing", async () => {
  await inWorkspace(async ({ workspace, root }) => {
    await assert.rejects(
      () => scanArtifactRoots(["missing"], { cwd: workspace, curated: true, requireRoots: true }),
      (error: unknown) => category(error) === "root-missing",
    );
    await assert.rejects(
      () => scanArtifactRoots([root], { cwd: workspace, curated: true, requireRoots: true }),
      (error: unknown) => category(error) === "curated-manifest-missing",
    );
  });
});

test("curated evidence rejects hash tampering and unbound extra files", async () => {
  await inWorkspace(async ({ workspace, artifacts, root }) => {
    const bundle = writeCuratedBundle(artifacts);
    writeFileSync(join(bundle, "trace.json"), "{}\n");
    await assert.rejects(
      () => scanArtifactRoots([root], { cwd: workspace, curated: true, requireRoots: true }),
      (error: unknown) => category(error) === "curated-hash-mismatch",
    );
  });
  await inWorkspace(async ({ workspace, artifacts, root }) => {
    const bundle = writeCuratedBundle(artifacts);
    writeFileSync(join(bundle, "extra.txt"), "safe but unbound\n");
    await assert.rejects(
      () => scanArtifactRoots([root], { cwd: workspace, curated: true, requireRoots: true }),
      (error: unknown) => category(error) === "curated-files-invalid",
    );
  });
});

test("manifest-bound malformed curated JSON fails with a safe category", async () => {
  await inWorkspace(async ({ workspace, artifacts, root }) => {
    writeCuratedBundle(artifacts, { trace: "{\n" });
    await assert.rejects(
      () => scanArtifactRoots([root], { cwd: workspace, curated: true, requireRoots: true }),
      (error: unknown) => category(error) === "curated-json-invalid",
    );
  });
});

test("manifest-bound PNG metadata and secret text are still blocked", async () => {
  await inWorkspace(async ({ workspace, artifacts, root }) => {
    writeCuratedBundle(artifacts, { metadataPng: true });
    await assert.rejects(
      () => scanArtifactRoots([root], { cwd: workspace, curated: true, requireRoots: true }),
      (error: unknown) => category(error) === "png-chunk-unsupported",
    );
  });
  await inWorkspace(async ({ workspace, artifacts, root }) => {
    const secret = ["Bearer ", "curated-private-value-987654321"].join("");
    writeCuratedBundle(artifacts, { trace: `${JSON.stringify({
      schemaVersion: "agent-edu.curated-browser-evidence.v1",
      tracePolicy: "structural-metadata-only-no-url-query-header-body-text",
      screenshots: false,
      sources: false,
      attachments: false,
      events: [],
      secret,
    })}\n` });
    await assert.rejects(
      () => scanArtifactRoots([root], { cwd: workspace, curated: true, requireRoots: true }),
      (error: unknown) => category(error) === "curated-trace-invalid" || category(error) === "bearer-token",
    );
  });
});

test("root and ZIP path traversal attempts fail closed", async () => {
  await inWorkspace(async ({ workspace, artifacts, root }) => {
    const outside = join(workspace, "..", `${basename(workspace)}-outside`);
    mkdirSync(outside);
    try {
      await assert.rejects(
        () => scanArtifactRoots([`../${basename(outside)}`], { cwd: workspace }),
        (error: unknown) => category(error) === "root-outside-workspace",
      );
    } finally {
      rmSync(outside, { recursive: true, force: true });
    }
    writeFileSync(join(artifacts, "trace.zip"), zip([
      { name: "../escape.txt", content: "safe text" },
    ]));
    await assert.rejects(
      () => scanArtifactRoots([root], { cwd: workspace }),
      (error: unknown) => category(error) === "zip-path-invalid",
    );
  });
});

test("error messages contain category and path but never the matched value", async () => {
  await inWorkspace(async ({ workspace, artifacts, root }) => {
    const secret = ["gh", "p_", "Q".repeat(40)].join("");
    writeFileSync(join(artifacts, "leak.txt"), secret);
    await assert.rejects(
      () => scanArtifactRoots([root], { cwd: workspace }),
      (error: unknown) => {
        assert.ok(error instanceof ArtifactPrivacyError);
        assert.equal(error.category, "provider-api-key");
        assert.match(error.message, /provider-api-key: artifacts\/leak\.txt$/);
        assert.equal(error.message.includes(secret), false);
        return true;
      },
    );
  });
});

const sensitivePathCases = [
  {
    value: ["sk", "-", "P".repeat(28)].join(""),
    expected: "sensitive-path-provider-api-key",
    filename(value: string) { return `failure-${value}.bin`; },
  },
  {
    value: "path-private-bearer-value-12345",
    expected: "sensitive-path-bearer-token",
    filename(value: string) { return `failure-Bearer ${value}.bin`; },
  },
  {
    value: "path-private-signature-value",
    expected: "sensitive-path-signed-url",
    filename(value: string) { return `failure?sig=${value}`; },
  },
  {
    value: ["PW", "FAKE", "KEY", "DO", "NOT", "LEAK", "7f3d9c2a"].join("_"),
    expected: "sensitive-path-known-private-test-value",
    filename(value: string) { return `failure-${value}.bin`; },
  },
];

for (const [index, fixture] of sensitivePathCases.entries()) {
  test(`filesystem error path ${index + 1} redacts its sensitive filename value`, async () => {
    await inWorkspace(async ({ workspace, artifacts, root }) => {
      writeFileSync(
        join(artifacts, fixture.filename(fixture.value)),
        "safe UTF-8 artifact content\n",
      );
      await assert.rejects(
        () => scanArtifactRoots([root], { cwd: workspace }),
        (error: unknown) => {
          assert.ok(error instanceof ArtifactPrivacyError);
          assert.equal(error.category, fixture.expected);
          assert.equal(error.path.includes(fixture.value), false);
          assert.equal(error.message.includes(fixture.value), false);
          assert.match(error.path, /\[redacted/);
          return true;
        },
      );
    });
  });
}

test("ZIP entry error paths redact a sensitive entry name", async () => {
  await inWorkspace(async ({ workspace, artifacts, root }) => {
    const secret = ["PW", "FAKE", "KEY", "DO", "NOT", "LEAK", "7f3d9c2a"].join("_");
    writeFileSync(join(artifacts, "trace.zip"), zip([
      { name: `nested/${secret}.txt`, content: "safe UTF-8 ZIP entry content\n" },
    ]));
    await assert.rejects(
      () => scanArtifactRoots([root], { cwd: workspace }),
      (error: unknown) => {
        assert.ok(error instanceof ArtifactPrivacyError);
        assert.equal(error.category, "sensitive-path-known-private-test-value");
        assert.equal(error.path.includes(secret), false);
        assert.equal(error.message.includes(secret), false);
        assert.match(error.path, /nested\/\[redacted-test-value\]\.txt$/);
        return true;
      },
    );
  });
});

test("a sensitive directory segment fails before its safe child is scanned", async () => {
  await inWorkspace(async ({ workspace, artifacts, root }) => {
    const secret = ["sk", "-", "D".repeat(28)].join("");
    const directory = join(artifacts, `nested-${secret}`);
    mkdirSync(directory);
    writeFileSync(join(directory, "safe.txt"), "safe UTF-8 child content\n");
    await assert.rejects(
      () => scanArtifactRoots([root], { cwd: workspace }),
      (error: unknown) => {
        assert.ok(error instanceof ArtifactPrivacyError);
        assert.equal(error.category, "sensitive-path-provider-api-key");
        assert.equal(error.path.includes(secret), false);
        assert.equal(error.message.includes(secret), false);
        assert.match(error.path, /artifacts\/nested-\[redacted-credential\]$/);
        return true;
      },
    );
  });
});

test("CI uploads browser evidence only after the privacy scanner succeeds", () => {
  const workflow = readFileSync(
    new URL("../.github/workflows/ci.yml", import.meta.url),
    "utf8",
  );
  const packageJson = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  ) as { scripts?: Record<string, string> };

  assert.equal(
    packageJson.scripts?.["artifacts:check"],
    "node scripts/check-artifacts.mjs --curated --require-root browser-evidence",
  );
  assert.equal((workflow.match(/id: artifact_privacy/g) ?? []).length, 3);
  assert.equal((workflow.match(/run: npm run artifacts:check/g) ?? []).length, 3);
  const pinnedUploadArtifact =
    "actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a";
  assert.equal(workflow.split(pinnedUploadArtifact).length - 1, 5);
  assert.equal(
    (
      workflow.match(
        /if: \$\{\{ failure\(\) && steps\.artifact_privacy\.outcome == 'success' \}\}\n\s+uses: actions\/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a/g,
      ) ?? []
    ).length,
    3,
  );
  assert.equal((workflow.match(/path: browser-evidence\//g) ?? []).length, 3);
  assert.equal((workflow.match(/if-no-files-found: error/g) ?? []).length, 5);
  assert.match(
    workflow,
    /if: \$\{\{ always\(\) \}\}[\s\S]{0,240}name: vercel-preview-verification[\s\S]{0,160}path: tmp\/release\/vercel-preview-verification\.json/,
  );
  assert.doesNotMatch(workflow, /path:[\s\S]{0,100}(?:test-results|playwright-report)/);
  const contractOffset = workflow.indexOf("run: npm run test:evidence-contract");
  const smokeOffset = workflow.indexOf("run: npm run test:smoke");
  const scannerOffset = workflow.indexOf("run: npm run artifacts:check", smokeOffset);
  assert.ok(contractOffset >= 0 && contractOffset < smokeOffset && smokeOffset < scannerOffset);
});

test("private reporter output accepts only its closed status vocabulary", () => {
  const ordinary = [
    "private-suite: 2 test(s)",
    "private evidence contract: reached intentional assertion",
    "private-suite: test 1/2 failed",
    "private evidence contract: reached full-test input timeout",
    "private-suite: test 2/2 timedOut",
    "private-suite: run failed",
    "",
  ].join("\n");
  const parsed = validatePrivateReporterOutput(ordinary, "", true);
  assert.deepEqual(parsed, {
    total: 2,
    testStatuses: ["failed", "timedOut"],
    runStatus: "failed",
    assertionMarkerCount: 1,
    timeoutMarkerCount: 1,
  });
  assert.equal(
    validatePrivateReporterOutput(
      ordinary.replace(
        "private-suite: run failed",
        "ordinary confidential prompt from a worker\nprivate-suite: run failed",
      ),
      "",
      true,
    ),
    null,
  );
  assert.equal(
    validatePrivateReporterOutput(ordinary, "worker stderr with a private reply", true),
    null,
  );
});

test("browser suites that handle private Lab state disable automatic artifacts", () => {
  const smoke = readFileSync(new URL("../e2e/smoke.spec.ts", import.meta.url), "utf8");
  const privateState = readFileSync(
    new URL("../e2e/lab-private-state.spec.ts", import.meta.url),
    "utf8",
  );
  const provider = readFileSync(
    new URL("../e2e/lab-provider-contract.spec.ts", import.meta.url),
    "utf8",
  );
  const privateConfig = readFileSync(
    new URL("../playwright.private.config.ts", import.meta.url),
    "utf8",
  );
  const privateReporter = readFileSync(
    new URL("../e2e/private-reporter.ts", import.meta.url),
    "utf8",
  );
  const privateWrapper = readFileSync(
    new URL("../scripts/run-private-playwright.mjs", import.meta.url),
    "utf8",
  );
  const packageJson = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  ) as { scripts?: Record<string, string> };

  assert.doesNotMatch(smoke, /Lab drafts write only after edits|Lab cancellation, zero-score/);
  assert.match(privateState, /Lab drafts write only after edits/);
  assert.match(privateState, /Lab cancellation, zero-score completion, privacy/);
  assert.match(privateState, /privatePrompt = \[.*\]\.join/);
  assert.match(provider, /SENTINEL = \[.*\]\.join/);
  for (const source of [privateState, provider, privateConfig]) {
    assert.match(source, /screenshots: false/);
    assert.match(source, /sources: false/);
    assert.match(source, /attachments: false/);
    assert.match(source, /screenshot: "off"/);
    assert.match(source, /video: "off"/);
  }
  assert.match(privateConfig, /reporter: \[\["\.\/e2e\/private-reporter\.ts"\]\]/);
  assert.doesNotMatch(privateConfig, /reporter: \[\["list"\]\]/);
  assert.match(privateConfig, /preserveOutput: "never"/);
  assert.match(privateReporter, /printsToStdio\(\): boolean \{\s+return true/);
  assert.doesNotMatch(privateReporter, /onStdOut|onStdErr|result\.errors|test\.title/);
  assert.match(privateWrapper, /stderr\.trim\(\) !== ""/);
  assert.match(privateWrapper, /raw browser output was suppressed/);
  assert.doesNotMatch(privateWrapper, /process\.(?:stdout|stderr)\.write\([^\n]*(?:child\.stdout|child\.stderr)/);
  assert.equal(
    packageJson.scripts?.["test:smoke:private"],
    "node scripts/run-private-playwright.mjs",
  );
});

test("safe failure evidence is curated without raw Playwright outputs", () => {
  const fixture = readFileSync(new URL("../e2e/fixtures.ts", import.meta.url), "utf8");
  const config = readFileSync(new URL("../playwright.config.ts", import.meta.url), "utf8");
  const privateContract = readFileSync(
    new URL("../e2e-contract/intentional-private-failure.spec.ts", import.meta.url),
    "utf8",
  );
  const privateTimeoutContract = readFileSync(
    new URL("../e2e-contract/intentional-private-timeout.spec.ts", import.meta.url),
    "utf8",
  );
  const safeContract = readFileSync(
    new URL("../e2e-contract/intentional-safe-failure.spec.ts", import.meta.url),
    "utf8",
  );
  const privateReporter = readFileSync(
    new URL("../e2e/private-reporter.ts", import.meta.url),
    "utf8",
  );
  const privateEvidenceConfig = readFileSync(
    new URL("../playwright.evidence-private.config.ts", import.meta.url),
    "utf8",
  );
  const verifier = readFileSync(
    new URL("../scripts/verify-browser-evidence.mjs", import.meta.url),
    "utf8",
  );
  assert.match(config, /reporter: \[\["list"\]\]/);
  assert.match(config, /preserveOutput: "never"/);
  assert.match(config, /screenshot: "off"/);
  assert.match(config, /trace: "off"/);
  assert.match(fixture, /uniform-redaction-surface-v2/);
  assert.match(fixture, /new URL\(request\.url\(\)\)\.origin/);
  assert.match(fixture, /page\.locator\(`#\$\{REDACTION_SURFACE_ID\}`\)\.screenshot/);
  assert.match(fixture, /structural-metadata-only-no-url-query-header-body-text/);
  assert.match(fixture, /counts-only-no-console-or-error-text/);
  assert.match(fixture, /screenshots: false/);
  assert.match(fixture, /sources: false/);
  assert.match(fixture, /attachments: false/);
  assert.match(privateContract, /\.steps \[role="tab"\].*\.last\(\)\.click/);
  assert.match(privateContract, /PRIVATE_CONTRACT_ANNOTATION/);
  assert.doesNotMatch(
    privateContract,
    /private evidence contract: reached intentional assertion/,
  );
  assert.doesNotMatch(
    safeContract,
    /safe evidence contract: reached intentional assertion/,
  );
  assert.match(privateTimeoutContract, /test\.setTimeout\(5_000\)/);
  assert.match(privateTimeoutContract, /PRIVATE_TIMEOUT_CONTRACT_ANNOTATION/);
  assert.match(privateTimeoutContract, /await keyField\.fill\(timeoutKey\);/);
  assert.doesNotMatch(privateTimeoutContract, /fill\(timeoutKey,\s*\{/);
  assert.match(
    privateEvidenceConfig,
    /reporter: \[\["\.\/e2e\/private-reporter\.ts"\]\]/,
  );
  assert.match(privateReporter, /private evidence contract: reached intentional assertion/);
  assert.match(privateReporter, /private evidence contract: reached full-test input timeout/);
  assert.match(verifier, /safeMarker/);
  assert.match(verifier, /runPrivatePlaywright/);
  assert.match(verifier, /timeoutMarkerCount !== 1/);
  assert.match(verifier, /\.last-run\.json/);
  assert.match(verifier, /lastRun\.failedTests\.length !== 2/);
  assert.match(verifier, /persisted an output other than the fixed last-run status file/);
});
