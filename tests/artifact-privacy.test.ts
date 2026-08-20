import assert from "node:assert/strict";
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
import { deflateRawSync } from "node:zlib";
import {
  ArtifactPrivacyError,
  MAX_EMBEDDED_REPORT_BASE64_CHARS,
  MAX_FILE_BYTES,
  crc32,
  scanArtifactRoots,
} from "../scripts/check-artifacts.mjs";

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
    "node scripts/check-artifacts.mjs test-results playwright-report",
  );
  assert.equal((workflow.match(/id: artifact_privacy/g) ?? []).length, 2);
  assert.equal((workflow.match(/run: npm run artifacts:check/g) ?? []).length, 2);
  assert.equal((workflow.match(/uses: actions\/upload-artifact@v7/g) ?? []).length, 2);
  assert.equal(
    (
      workflow.match(
        /if: \$\{\{ failure\(\) && steps\.artifact_privacy\.outcome == 'success' \}\}\n\s+uses: actions\/upload-artifact@v7/g,
      ) ?? []
    ).length,
    2,
  );
});
