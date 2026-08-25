import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";
import {
  appendFile,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";
import test from "node:test";
import {
  CODEX_MEDIA_AUDIT_SCHEMA,
  CODEX_MEDIA_ALLOWED_HOST_MARKER,
  CODEX_MEDIA_CHECKLIST,
  CODEX_MEDIA_FILESYSTEM_ATTRIBUTE_POLICY,
  CODEX_MEDIA_PATTERN_VERSION,
  CODEX_MEDIA_PRIVACY_CHECKLIST_VERSION,
  CODEX_MEDIA_TRANSFORM,
  assessPathConfinement,
  buildAssetInventory,
  crc32,
  inspectPng,
  inspectWebp,
  isRealIsoDate,
  parseGetfattrNames,
  parseMacOsXattrHex,
  parseMacOsXattrNames,
  rejectImageMetadataAndFeatures,
  scanOcrText,
  sha256,
  validateAuditRecord,
  validateFilesystemAttributes,
} from "../scripts/lib/codex-media.mjs";

const execFile = promisify(execFileCallback);
const TEST_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CLI = join(TEST_ROOT, "scripts", "codex-media.mjs");

function prepareArguments(input, output) {
  return [
    CLI,
    "prepare",
    "--id", "fig-01",
    "--input", input,
    "--output", output,
    "--captured-on", "2026-08-23",
    "--product-version", "test-version",
    "--operating-system", "test-os",
    "--surface", "app",
    "--source-id", "openai-quickstart",
  ];
}

function pngChunk(type, data = Buffer.alloc(0)) {
  const typeBytes = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
  return Buffer.concat([length, typeBytes, data, checksum]);
}

function makePng({ width = 1, height = 1, metadata = false, interlace = 0 } = {}) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = interlace;
  const rows = [];
  for (let row = 0; row < height; row += 1) rows.push(Buffer.alloc(1 + width * 3));
  const chunks = [pngChunk("IHDR", ihdr)];
  if (metadata) chunks.push(pngChunk("tEXt", Buffer.from("Author\0Private")));
  chunks.push(pngChunk("IDAT", deflateSync(Buffer.concat(rows))), pngChunk("IEND"));
  return Buffer.concat([signature, ...chunks]);
}

function webpChunk(type, data) {
  const header = Buffer.alloc(8);
  header.write(type, 0, 4, "ascii");
  header.writeUInt32LE(data.length, 4);
  return Buffer.concat([header, data, data.length % 2 === 1 ? Buffer.from([0]) : Buffer.alloc(0)]);
}

function makeWebp({ width = 1, height = 1, metadata = false, animation = false } = {}) {
  const packed = ((height - 1) << 14) | (width - 1);
  const vp8l = Buffer.alloc(5);
  vp8l[0] = 0x2f;
  vp8l.writeUInt32LE(packed >>> 0, 1);
  const chunks = [];
  if (animation) chunks.push(webpChunk("ANIM", Buffer.alloc(6)));
  if (metadata) chunks.push(webpChunk("EXIF", Buffer.from("private")));
  chunks.push(webpChunk("VP8L", vp8l));
  const body = Buffer.concat([Buffer.from("WEBP"), ...chunks]);
  const riff = Buffer.alloc(8);
  riff.write("RIFF", 0, 4, "ascii");
  riff.writeUInt32LE(body.length, 4);
  return Buffer.concat([riff, body]);
}

function inventoryFixture() {
  const filesystemAttributes = {
    policy: CODEX_MEDIA_FILESYSTEM_ATTRIBUTE_POLICY,
    inspection: "passed",
    allowedHostLocalMarker: null,
  };
  return [
    {
      name: "fig-01-master.png",
      mediaType: "image/png",
      bytes: 10,
      width: 2240,
      height: 800,
      sha256: "a".repeat(64),
      containerComplete: true,
      metadataFree: true,
      filesystemAttributes: structuredClone(filesystemAttributes),
    },
    {
      name: "fig-01-2240.webp",
      mediaType: "image/webp",
      bytes: 8,
      width: 2240,
      height: 800,
      sha256: "b".repeat(64),
      containerComplete: true,
      metadataFree: true,
      filesystemAttributes: structuredClone(filesystemAttributes),
    },
    {
      name: "fig-01-1120.webp",
      mediaType: "image/webp",
      bytes: 6,
      width: 1120,
      height: 400,
      sha256: "c".repeat(64),
      containerComplete: true,
      metadataFree: true,
      filesystemAttributes: structuredClone(filesystemAttributes),
    },
  ];
}

function auditFixture() {
  return {
    schema: CODEX_MEDIA_AUDIT_SCHEMA,
    figureId: "fig-01",
    createdAt: "2026-08-23T00:00:00.000Z",
    publishable: false,
    rawSource: {
      kind: "course-authored-capture",
      format: "png",
      mediaType: "image/png",
      bytes: 100,
      width: 2240,
      height: 800,
      sha256: "d".repeat(64),
      retainedOutsidePublic: true,
      retainedOutsideRepository: true,
    },
    provenance: {
      sourceId: "openai-quickstart",
      surface: "app",
      productVersion: "0.149.0-alpha.4",
      operatingSystem: "macOS 15",
      capturedOn: "2026-08-23",
    },
    tools: {
      magick: "ImageMagick 7",
      cwebp: "1.6.0",
      tesseract: "tesseract 5",
      extendedAttributes: "macOS /usr/bin/xattr (system tool; no version flag)",
    },
    transform: {
      png: CODEX_MEDIA_TRANSFORM.png,
      webp: CODEX_MEDIA_TRANSFORM.webp,
      filesystemAttributes: CODEX_MEDIA_TRANSFORM.filesystemAttributes,
      responsiveWidths: [...CODEX_MEDIA_TRANSFORM.responsiveWidths],
    },
    assets: inventoryFixture(),
    ocr: {
      patternVersion: CODEX_MEDIA_PATTERN_VERSION,
      modes: [6, 11],
      digestSha256: "e".repeat(64),
      textBytes: 0,
      hardFindingCount: 0,
      hardFindings: [],
      reviewFindingCount: 0,
      reviewFindings: [],
    },
    automatedChecks: {
      fullDecode: "passed",
      containerIntegrity: "passed",
      metadataAndFeatures: "passed",
      filesystemAttributePolicy: "passed",
      hardPrivacyPatterns: "passed",
    },
    privacyReview: {
      status: "pending",
      reviewer: null,
      reviewedAt: null,
      automatedChecksDoNotConstituteApproval: true,
      checklistVersion: CODEX_MEDIA_PRIVACY_CHECKLIST_VERSION,
      checklist: Object.fromEntries(CODEX_MEDIA_CHECKLIST.map((item) => [item, "pending"])),
    },
  };
}

test("SHA-256 and path confinement helpers are deterministic and fail closed", () => {
  assert.equal(sha256("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  assert.equal(isRealIsoDate("2026-08-23"), true);
  assert.equal(isRealIsoDate("2026-02-30"), false);
  assert.deepEqual(
    assessPathConfinement({
      requestedPath: "/private/tmp/raw.png",
      realPath: "/private/tmp/raw.png",
      forbiddenRoots: ["/workspace/repo"],
    }),
    { ok: true, errors: [] },
  );
  const lexicalEscape = assessPathConfinement({
    requestedPath: "/workspace/repo/public/raw.png",
    realPath: "/workspace/repo/public/raw.png",
    forbiddenRoots: ["/workspace/repo"],
    label: "raw input",
  });
  assert.equal(lexicalEscape.ok, false);
  assert.match(lexicalEscape.errors.join("\n"), /lexically inside forbidden root/u);
  assert.match(lexicalEscape.errors.join("\n"), /resolves inside forbidden root/u);

  const symlinkEscape = assessPathConfinement({
    requestedPath: "/private/tmp/raw.png",
    realPath: "/workspace/repo/public/raw.png",
    forbiddenRoots: ["/workspace/repo"],
    targetIsSymlink: true,
    label: "raw input",
  });
  assert.equal(symlinkEscape.ok, false);
  assert.match(symlinkEscape.errors.join("\n"), /symbolic link/u);
  assert.match(symlinkEscape.errors.join("\n"), /resolves inside forbidden root/u);
});

test("filesystem attribute policy permits only the exact managed macOS provenance form", () => {
  assert.deepEqual(
    parseMacOsXattrNames("com.apple.provenance\nuser.course-review\n"),
    ["com.apple.provenance", "user.course-review"],
  );
  assert.deepEqual(
    parseGetfattrNames('# file: /tmp/figure.png\nuser.course-review="pending"\nsecurity.label=0sAQ==\n'),
    ["user.course-review", "security.label"],
  );
  assert.equal(parseMacOsXattrHex("01 02 00 11 22 33 44 55 66 77 88\n"), "0102001122334455667788");
  assert.equal(parseMacOsXattrHex("01 0g"), null);

  const absent = validateFilesystemAttributes([]);
  assert.equal(absent.ok, true);
  assert.deepEqual(absent.auditState, {
    policy: CODEX_MEDIA_FILESYSTEM_ATTRIBUTE_POLICY,
    inspection: "passed",
    allowedHostLocalMarker: null,
  });
  assert.equal(validateFilesystemAttributes(undefined).ok, false);

  const managed = validateFilesystemAttributes([{
    name: "com.apple.provenance",
    valueHex: "0102001122334455667788",
  }]);
  assert.equal(managed.ok, true, managed.errors.join("\n"));
  assert.deepEqual(managed.auditState.allowedHostLocalMarker, CODEX_MEDIA_ALLOWED_HOST_MARKER);
  assert.equal(JSON.stringify(managed.auditState).includes("1122334455667788"), false);

  for (const name of [
    "com.apple.quarantine",
    "com.apple.metadata:kMDItemWhereFroms",
    "com.apple.ResourceFork",
    "user.course-review",
  ]) {
    const disallowed = validateFilesystemAttributes([{ name, valueHex: null }]);
    assert.equal(disallowed.ok, false, name);
    assert.match(disallowed.errors.join("\n"), new RegExp(name.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
  }

  for (const valueHex of [
    "0102",
    "ffff0011223344556677",
    "0102011122334455667788",
    "01020011223344556677",
    "010200112233445566778899",
  ]) {
    const wrongProvenance = validateFilesystemAttributes([{
      name: "com.apple.provenance",
      valueHex,
    }]);
    assert.equal(wrongProvenance.ok, false, valueHex);
    assert.match(wrongProvenance.errors.join("\n"), /exact managed payload form/u);
  }
});

test("PNG inspection verifies chunks, CRC, IEND, EOF, and metadata-free policy", () => {
  const clean = makePng({ width: 2240, height: 2 });
  const inspected = inspectPng(clean);
  assert.equal(inspected.ok, true, inspected.errors.join("\n"));
  assert.equal(inspected.complete, true);
  assert.equal(inspected.width, 2240);
  assert.equal(rejectImageMetadataAndFeatures(inspected).ok, true);

  const withMetadata = inspectPng(makePng({ metadata: true }));
  assert.equal(withMetadata.ok, true);
  assert.equal(rejectImageMetadataAndFeatures(withMetadata).ok, false);
  assert.deepEqual(withMetadata.metadataChunks, ["tEXt"]);

  const badCrc = Buffer.from(clean);
  badCrc[29] ^= 0xff;
  assert.match(inspectPng(badCrc).errors.join("\n"), /CRC mismatch/u);
  assert.match(inspectPng(Buffer.concat([clean, Buffer.from([0])])).errors.join("\n"), /trailing byte/u);
  assert.match(inspectPng(clean.subarray(0, -4)).errors.join("\n"), /truncated|missing IEND/u);
  assert.equal(rejectImageMetadataAndFeatures(inspectPng(makePng({ interlace: 1 }))).ok, false);
});

test("WebP inspection enforces exact RIFF length and rejects metadata and animation", () => {
  const clean = makeWebp({ width: 2240, height: 800 });
  const inspected = inspectWebp(clean);
  assert.equal(inspected.ok, true, inspected.errors.join("\n"));
  assert.equal(inspected.complete, true);
  assert.equal(inspected.width, 2240);
  assert.equal(inspected.height, 800);
  assert.equal(rejectImageMetadataAndFeatures(inspected).ok, true);

  const metadata = inspectWebp(makeWebp({ metadata: true }));
  assert.equal(metadata.ok, true);
  assert.equal(rejectImageMetadataAndFeatures(metadata).ok, false);
  assert.deepEqual(metadata.metadataChunks, ["EXIF"]);

  const animated = inspectWebp(makeWebp({ animation: true }));
  assert.equal(rejectImageMetadataAndFeatures(animated).ok, false);
  assert.match(rejectImageMetadataAndFeatures(animated).errors.join("\n"), /animation/u);
  assert.match(inspectWebp(Buffer.concat([clean, Buffer.from([0])])).errors.join("\n"), /trailing byte/u);
  assert.match(inspectWebp(clean.subarray(0, -1)).errors.join("\n"), /truncated/u);
});

test("OCR scanner separates hard stops from review wording without retaining matched text", () => {
  const scan = scanOcrText([
    ["", "Users", "alice", "project"].join("/"),
    ["alice", "example.com"].join("@"),
    ["sk", "proj", "1234567890"].join("-"),
    ["ghp", "1234567890abcdef"].join("_"),
    ["Authorization:", "Bearer", "abcdefghijklmnop"].join(" "),
    ["-----BEGIN", "PRIVATE", "KEY-----"].join(" "),
    ".env.local",
    "https://github.com/example/private.git",
    "token secret password credential API key",
  ].join("\n"));
  const hardIds = new Set(scan.hardFindings.map((finding) => finding.id));
  for (const id of [
    "user-path-unix",
    "email-address",
    "openai-api-key",
    "github-token",
    "bearer-credential",
    "private-key",
    "dotenv-file",
    "url",
    "git-remote",
  ]) assert.equal(hardIds.has(id), true, `missing ${id}`);
  assert.equal(scan.reviewFindingCount, 5);
  for (const finding of [...scan.hardFindings, ...scan.reviewFindings]) {
    assert.match(finding.matchSha256, /^[a-f0-9]{64}$/u);
    assert.equal("match" in finding, false);
    assert.equal("text" in finding, false);
    assert.equal("preview" in finding, false);
  }
});

test("OCR scanner downgrades only the exact allowlisted first-party usage URL", () => {
  const allowlistedUrl = "https://chatgpt.com/codex/settings/usage";
  const exact = scanOcrText(allowlistedUrl);
  assert.equal(exact.patternVersion, CODEX_MEDIA_PATTERN_VERSION);
  assert.equal(exact.hardFindingCount, 0);
  assert.equal(exact.reviewFindingCount, 1);
  assert.deepEqual(exact.reviewFindings[0], {
    id: "first-party-public-url",
    label: "Allowlisted first-party public URL",
    severity: "review",
    line: 1,
    column: 1,
    matchSha256: sha256(allowlistedUrl),
  });

  for (const unknownUrl of [
    `${allowlistedUrl}/`,
    `${allowlistedUrl}?account=synthetic`,
    `${allowlistedUrl}#details`,
    "http://chatgpt.com/codex/settings/usage",
    "https://chatgpt.com/codex/settings/other",
    "https://example.com/codex/settings/usage",
  ]) {
    const scan = scanOcrText(unknownUrl);
    assert.equal(scan.hardFindings.some((finding) => finding.id === "url"), true, unknownUrl);
  }

  const privateRemote = scanOcrText(`${allowlistedUrl}\nhttps://github.com/example/private.git`);
  assert.equal(privateRemote.reviewFindings.some((finding) => finding.id === "first-party-public-url"), true);
  assert.equal(privateRemote.hardFindings.some((finding) => finding.id === "url"), true);
  assert.equal(privateRemote.hardFindings.some((finding) => finding.id === "git-remote"), true);
});

test("asset inventory binds deterministic names, dimensions, hashes, and metadata state", () => {
  const master = makePng({ width: 2240, height: 4 });
  const large = makeWebp({ width: 2240, height: 4 });
  const small = makeWebp({ width: 1120, height: 2 });
  const result = buildAssetInventory({
    figureId: "fig-01",
    assets: [
      { name: "fig-01-master.png", buffer: master, filesystemAttributes: [] },
      { name: "fig-01-2240.webp", buffer: large, filesystemAttributes: [] },
      { name: "fig-01-1120.webp", buffer: small, filesystemAttributes: [] },
    ],
  });
  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.deepEqual(result.inventory.map((asset) => asset.width), [2240, 2240, 1120]);
  assert.deepEqual(result.inventory.map((asset) => asset.sha256), [sha256(master), sha256(large), sha256(small)]);

  const wrongName = buildAssetInventory({
    figureId: "fig-01",
    assets: [{ name: "master.png", buffer: master, filesystemAttributes: [] }],
  });
  assert.equal(wrongName.ok, false);
  assert.match(wrongName.errors.join("\n"), /deterministic|must contain|unexpected asset/u);
});

test("audit-record validation requires a pending manual checklist and exact asset binding", () => {
  const record = auditFixture();
  assert.deepEqual(validateAuditRecord(record, { expectedInventory: inventoryFixture(), requirePending: true }), {
    ok: true,
    errors: [],
  });

  const withManagedMarkers = structuredClone(record);
  for (const asset of withManagedMarkers.assets) {
    asset.filesystemAttributes.allowedHostLocalMarker = { ...CODEX_MEDIA_ALLOWED_HOST_MARKER };
  }
  assert.deepEqual(
    validateAuditRecord(withManagedMarkers, {
      expectedInventory: structuredClone(withManagedMarkers.assets),
      requirePending: true,
    }),
    { ok: true, errors: [] },
  );

  const autoApproved = structuredClone(record);
  autoApproved.privacyReview.status = "approved";
  assert.equal(validateAuditRecord(autoApproved).ok, false);
  assert.match(validateAuditRecord(autoApproved).errors.join("\n"), /reviewer|checklist/u);

  const humanApproved = structuredClone(record);
  humanApproved.privacyReview.status = "approved";
  humanApproved.privacyReview.reviewer = "project-owner";
  humanApproved.privacyReview.reviewedAt = "2026-08-23T04:01:44Z";
  humanApproved.privacyReview.checklist = Object.fromEntries(CODEX_MEDIA_CHECKLIST.map((item) => [item, true]));
  assert.deepEqual(validateAuditRecord(humanApproved), { ok: true, errors: [] });

  const automatedReviewer = structuredClone(humanApproved);
  automatedReviewer.privacyReview.reviewer = "codex-agent";
  assert.equal(validateAuditRecord(automatedReviewer).ok, false);
  assert.match(validateAuditRecord(automatedReviewer).errors.join("\n"), /stable human reviewer ID/u);

  const futureReview = structuredClone(humanApproved);
  futureReview.privacyReview.reviewedAt = "9999-01-01T00:00:00Z";
  assert.equal(validateAuditRecord(futureReview).ok, false);
  assert.match(validateAuditRecord(futureReview).errors.join("\n"), /future/u);

  const tampered = structuredClone(record);
  tampered.assets[0].sha256 = "f".repeat(64);
  assert.equal(validateAuditRecord(tampered, { expectedInventory: inventoryFixture() }).ok, false);
  assert.match(validateAuditRecord(tampered, { expectedInventory: inventoryFixture() }).errors.join("\n"), /inventory/u);

  const leaked = structuredClone(record);
  leaked.rawSource.path = ["", "Users", "alice", "raw.png"].join("/");
  assert.equal(validateAuditRecord(leaked).ok, false);
  assert.match(validateAuditRecord(leaked).errors.join("\n"), /must not disclose/u);

  const invalidDate = structuredClone(record);
  invalidDate.provenance.capturedOn = "2026-02-30";
  assert.equal(validateAuditRecord(invalidDate).ok, false);
  assert.match(validateAuditRecord(invalidDate).errors.join("\n"), /real date/u);

  const wrongMarker = structuredClone(record);
  wrongMarker.assets[0].filesystemAttributes.allowedHostLocalMarker = {
    name: "com.apple.provenance",
    markerHex: "ffff",
    hostLocalNontransported: true,
  };
  assert.equal(validateAuditRecord(wrongMarker).ok, false);
  assert.match(validateAuditRecord(wrongMarker).errors.join("\n"), /marker hex/u);

  const leakedManagedPayload = structuredClone(record);
  leakedManagedPayload.assets[0].filesystemAttributes.allowedHostLocalMarker = {
    ...CODEX_MEDIA_ALLOWED_HOST_MARKER,
    managedPayloadHex: "0102001122334455667788",
  };
  assert.equal(validateAuditRecord(leakedManagedPayload).ok, false);
  assert.match(validateAuditRecord(leakedManagedPayload).errors.join("\n"), /must not retain/u);

  for (const [label, mutate] of [
    ["OCR transcript alias", (draft) => { draft.ocr.transcript = "UNREDACTED OCR"; }],
    ["privacy path alias", (draft) => { draft.privacyReview.privatePath = "/home/alice/private-repo"; }],
    ["checklist private field", (draft) => { draft.privacyReview.checklist.extraPrivateField = "account-123"; }],
    ["automated-check detail", (draft) => { draft.automatedChecks.rawDiagnostic = "private output"; }],
  ]) {
    const draft = structuredClone(record);
    mutate(draft);
    const validation = validateAuditRecord(draft);
    assert.equal(validation.ok, false, `${label} must be rejected`);
    assert.match(validation.errors.join("\n"), /unsupported or missing fields/u);
  }

  const leakedFinding = structuredClone(record);
  leakedFinding.ocr.reviewFindingCount = 1;
  leakedFinding.ocr.reviewFindings = [{
    id: "possible-name",
    label: "Possible name",
    severity: "review",
    mode: 6,
    line: 1,
    column: 1,
    matchSha256: "e".repeat(64),
    transcript: "UNREDACTED OCR",
  }];
  const leakedFindingValidation = validateAuditRecord(leakedFinding);
  assert.equal(leakedFindingValidation.ok, false);
  assert.match(leakedFindingValidation.errors.join("\n"), /unsupported or missing fields/u);
});

async function toolsAvailable() {
  try {
    const tools = [
      execFile("magick", ["-version"]),
      execFile("cwebp", ["-version"]),
      execFile("tesseract", ["--version"]),
    ];
    if (process.platform === "darwin") tools.push(execFile("/usr/bin/xattr", ["-h"]));
    else if (process.platform === "linux") {
      tools.push(execFile("getfattr", ["--version"]), execFile("setfattr", ["--version"]));
    } else return false;
    await Promise.all(tools);
    return true;
  } catch {
    return false;
  }
}

async function inspectTestExtendedAttributes(path) {
  if (process.platform === "darwin") {
    const result = await execFile("/usr/bin/xattr", [path]);
    return parseMacOsXattrNames(result.stdout);
  }
  if (process.platform === "linux") {
    const result = await execFile("getfattr", ["--absolute-names", "-d", "-m", "-", "--", path]);
    return parseGetfattrNames(result.stdout);
  }
  throw new Error(`unsupported test platform ${process.platform}`);
}

async function readTestProvenanceHex(path) {
  if (process.platform !== "darwin") return null;
  const result = await execFile("/usr/bin/xattr", ["-px", "com.apple.provenance", path]);
  return parseMacOsXattrHex(result.stdout);
}

async function inspectTestFilesystemAttributes(path) {
  const names = await inspectTestExtendedAttributes(path);
  const attributes = [];
  for (const name of names) {
    attributes.push({
      name,
      valueHex: name === "com.apple.provenance" ? await readTestProvenanceHex(path) : null,
    });
  }
  return validateFilesystemAttributes(attributes);
}

async function attachNamedTestExtendedAttribute(path, name) {
  if (process.platform === "darwin") {
    await execFile("/usr/bin/xattr", ["-w", name, "reattached", path]);
    return;
  }
  if (process.platform === "linux") {
    await execFile("setfattr", ["-n", name, "-v", "reattached", "--", path]);
    return;
  }
  throw new Error(`unsupported test platform ${process.platform}`);
}

async function attachTestExtendedAttribute(path) {
  const name = process.platform === "darwin" ? "com.aicourse.test" : "user.aicourse_test";
  await attachNamedTestExtendedAttribute(path, name);
}

async function removeNamedTestExtendedAttribute(path, name) {
  if (process.platform === "darwin") {
    await execFile("/usr/bin/xattr", ["-d", name, path]);
    return;
  }
  if (process.platform === "linux") {
    await execFile("setfattr", ["-x", name, "--", path]);
    return;
  }
  throw new Error(`unsupported test platform ${process.platform}`);
}

test("prepare rejects repository inputs before image processing", async () => {
  const temporaryRoot = await mkdtemp(join(tmpdir(), "aicourse-codex-media-path-test-"));
  try {
    await assert.rejects(
      execFile(process.execPath, prepareArguments(CLI, join(temporaryRoot, "output")), {
        cwd: TEST_ROOT,
        maxBuffer: 2 * 1024 * 1024,
      }),
      (error) => {
        assert.match(error.stderr, /inside forbidden root/u);
        return true;
      },
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("prepare rejects a symlinked raw input before image processing", async () => {
  const temporaryRoot = await mkdtemp(join(tmpdir(), "aicourse-codex-media-symlink-test-"));
  const linkedInput = join(temporaryRoot, "raw.png");
  try {
    await symlink(CLI, linkedInput);
    await assert.rejects(
      execFile(process.execPath, prepareArguments(linkedInput, join(temporaryRoot, "output")), {
        cwd: TEST_ROOT,
        maxBuffer: 2 * 1024 * 1024,
      }),
      (error) => {
        assert.match(error.stderr, /symbolic link/u);
        return true;
      },
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("prepare rejects a raw capture narrower than 2240 pixels", { timeout: 30_000 }, async (context) => {
  if (!await toolsAvailable()) {
    context.skip("ImageMagick is required to generate the disposable narrow PNG");
    return;
  }
  const temporaryRoot = await mkdtemp(join(tmpdir(), "aicourse-codex-media-width-test-"));
  const source = join(temporaryRoot, "narrow.png");
  try {
    await execFile("magick", ["-size", "1120x640", "xc:white", "-strip", `PNG24:${source}`]);
    await assert.rejects(
      execFile(process.execPath, prepareArguments(source, join(temporaryRoot, "output")), {
        cwd: TEST_ROOT,
        maxBuffer: 2 * 1024 * 1024,
      }),
      (error) => {
        assert.match(error.stderr, /at least 2240 pixels/u);
        return true;
      },
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("audit rejects user, quarantine, source-URL, and resource-fork attributes", { timeout: 60_000 }, async (context) => {
  if (!await toolsAvailable()) {
    context.skip("Image and filesystem-attribute inspection tools are required for this regression");
    return;
  }
  const temporaryRoot = await mkdtemp(join(tmpdir(), "aicourse-codex-media-xattr-audit-test-"));
  const master = join(temporaryRoot, "fig-01-master.png");
  const large = join(temporaryRoot, "fig-01-2240.webp");
  const small = join(temporaryRoot, "fig-01-1120.webp");
  try {
    await execFile("magick", ["-size", "2240x640", "xc:white", "-strip", `PNG24:${master}`]);
    await execFile("cwebp", ["-quiet", "-lossless", master, "-o", large]);
    await execFile("cwebp", ["-quiet", "-lossless", "-resize", "1120", "0", master, "-o", small]);
    await writeFile(join(temporaryRoot, "fig-01-audit.json"), '{"figureId":"fig-01"}\n', "utf8");
    const names = process.platform === "darwin"
      ? [
        "com.aicourse.test",
        "com.apple.quarantine",
        "com.apple.metadata:kMDItemWhereFroms",
        "com.apple.ResourceFork",
      ]
      : ["user.aicourse_test"];
    for (const name of names) {
      await attachNamedTestExtendedAttribute(master, name);
      await assert.rejects(
        execFile(process.execPath, [CLI, "audit", "--dir", temporaryRoot], {
          cwd: TEST_ROOT,
          maxBuffer: 2 * 1024 * 1024,
        }),
        (error) => {
          assert.match(error.stderr, /disallowed filesystem extended attribute/u);
          assert.match(error.stderr, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
          return true;
        },
      );
      await removeNamedTestExtendedAttribute(master, name);
    }
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("prepare removes user attributes, records only an allowed host marker, and audits later tampering", { timeout: 120_000 }, async (context) => {
  if (!await toolsAvailable()) {
    context.skip("ImageMagick, cwebp, and tesseract are required for the integration regression");
    return;
  }
  const temporaryRoot = await mkdtemp(join(tmpdir(), "aicourse-codex-media-test-"));
  const source = join(temporaryRoot, "raw.png");
  const output = join(temporaryRoot, "fig-01-staging");
  try {
    await execFile("magick", ["-size", "2240x640", "xc:white", "-strip", `PNG24:${source}`]);
    const prepared = await execFile(process.execPath, prepareArguments(source, output), {
      cwd: TEST_ROOT,
      maxBuffer: 2 * 1024 * 1024,
    });
    const prepareResult = JSON.parse(prepared.stdout);
    assert.equal(prepareResult.ok, true);
    assert.equal(prepareResult.privacyReviewStatus, "pending");
    assert.equal(prepareResult.publishable, false);
    assert.equal(
      prepareResult.filesystemAttributes,
      "user-attached-attributes-removed-and-policy-verified",
    );

    const auditRecord = JSON.parse(await readFile(join(output, "fig-01-audit.json"), "utf8"));
    assert.equal(auditRecord.privacyReview.status, "pending");
    assert.equal(auditRecord.publishable, false);
    assert.equal(auditRecord.assets.length, 3);
    assert.deepEqual(auditRecord.assets.map((asset) => asset.width), [2240, 2240, 1120]);
    for (const asset of auditRecord.assets) {
      assert.equal(asset.filesystemAttributes.policy, CODEX_MEDIA_FILESYSTEM_ATTRIBUTE_POLICY);
      assert.equal(asset.filesystemAttributes.inspection, "passed");
      if (asset.filesystemAttributes.allowedHostLocalMarker !== null) {
        assert.deepEqual(asset.filesystemAttributes.allowedHostLocalMarker, CODEX_MEDIA_ALLOWED_HOST_MARKER);
      }
      assert.equal(JSON.stringify(asset.filesystemAttributes).includes("managedPayload"), false);
    }
    assert.equal(auditRecord.ocr.hardFindingCount, 0);
    for (const name of ["fig-01-master.png", "fig-01-2240.webp", "fig-01-1120.webp"]) {
      const validation = await inspectTestFilesystemAttributes(join(output, name));
      assert.equal(validation.ok, true, validation.errors.join("\n"));
    }

    const audited = await execFile(process.execPath, [CLI, "audit", "--dir", output], {
      cwd: TEST_ROOT,
      maxBuffer: 2 * 1024 * 1024,
    });
    const auditResult = JSON.parse(audited.stdout);
    assert.equal(auditResult.ok, true);
    assert.equal(auditResult.publishable, false);
    assert.equal(auditResult.filesystemAttributes, "policy-verified");

    const reattachedPath = join(output, "fig-01-master.png");
    await attachTestExtendedAttribute(reattachedPath);
    await assert.rejects(
      execFile(process.execPath, [CLI, "audit", "--dir", output], {
        cwd: TEST_ROOT,
        maxBuffer: 2 * 1024 * 1024,
      }),
      (error) => {
        assert.match(error.stderr, /extended attribute/u);
        return true;
      },
    );
    await removeNamedTestExtendedAttribute(
      reattachedPath,
      process.platform === "darwin" ? "com.aicourse.test" : "user.aicourse_test",
    );

    await appendFile(join(output, "fig-01-1120.webp"), Buffer.from([0]));
    await assert.rejects(
      execFile(process.execPath, [CLI, "audit", "--dir", output], {
        cwd: TEST_ROOT,
        maxBuffer: 2 * 1024 * 1024,
      }),
      (error) => {
        assert.match(error.stderr, /trailing byte|inventory/u);
        return true;
      },
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
