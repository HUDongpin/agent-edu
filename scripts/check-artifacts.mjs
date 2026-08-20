import { constants } from "node:fs";
import {
  lstat,
  open,
  readdir,
  realpath,
} from "node:fs/promises";
import { basename, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { inflateRawSync } from "node:zlib";

export const DEFAULT_ARTIFACT_ROOTS = ["test-results", "playwright-report"];
export const MAX_FILE_BYTES = 32 * 1024 * 1024;
export const MAX_ZIP_ENTRY_BYTES = 16 * 1024 * 1024;
export const MAX_ZIP_TOTAL_BYTES = 64 * 1024 * 1024;
export const MAX_ZIP_ENTRIES = 2_000;
export const MAX_EMBEDDED_REPORT_ZIP_BYTES = 16 * 1024 * 1024;
export const MAX_EMBEDDED_REPORT_BASE64_CHARS = 4 * Math.ceil(
  MAX_EMBEDDED_REPORT_ZIP_BYTES / 3,
);

const ZIP_LOCAL_FILE = 0x04034b50;
const ZIP_CENTRAL_FILE = 0x02014b50;
const ZIP_DATA_DESCRIPTOR = 0x08074b50;
const ZIP_END = 0x06054b50;
const ZIP64_SENTINEL_16 = 0xffff;
const ZIP64_SENTINEL_32 = 0xffffffff;
const UNIX_FILE_TYPE = 0o170000;
const UNIX_REGULAR = 0o100000;
const UNIX_DIRECTORY = 0o040000;
const UNIX_SYMLINK = 0o120000;
const CRC_TABLE = makeCrcTable();

const KNOWN_PRIVATE_TEST_VALUES = [
  ["PW", "FAKE", "KEY", "DO", "NOT", "LEAK", "7f3d9c2a"].join("_"),
  ["REFLECTION", "TEXT", "MUST", "NOT", "ENTER", "A", "PROVIDER", "BODY"].join("_"),
  ["test", "key"].join("-"),
  "A private local draft, with no Provider call.",
  "A second draft saved by the Lab unmount cleanup.",
  "Give one short café greeting.",
  "Welcome to the café.",
  "A partial answer",
  "not valid order JSON",
];

const TEXT_RULES = [
  {
    category: "authorization-header",
    pattern: /\bauthorization\s*["']?\s*[:=]\s*["']?\s*(?:bearer\s+)?[A-Za-z0-9._~+/=-]{4,}/i,
  },
  {
    category: "cookie-header",
    pattern: /\b(?:set-cookie|cookie)\s*["']?\s*[:=]\s*["']?\s*[^\s"'{};,]{3,}/i,
  },
  {
    category: "bearer-token",
    pattern: /\bbearer\s+[A-Za-z0-9._~+/=-]{8,}/i,
  },
  {
    category: "private-key",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  },
  {
    category: "provider-api-key",
    pattern: /(?:^|[^A-Za-z0-9])(?:sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{30,}|AIza[A-Za-z0-9_-]{30,}|AKIA[A-Z0-9]{16}|gsk_[A-Za-z0-9]{20,}|xai-[A-Za-z0-9_-]{20,})/i,
  },
  {
    category: "api-key-field",
    pattern: /\b(?:api[_-]?key|x-api-key)\s*["']?\s*[:=]\s*["']\s*(?!\$\{|\[?redacted\]?|your[_ -]?key|example|placeholder)[^"'\r\n]{4,}["']/i,
  },
  {
    category: "signed-url",
    pattern: /(?:https?:\/\/|\/?[^\s"']+\?)[^\s"']*(?:x-amz-signature|x-goog-signature|signature|sig|access_token|token|key-pair-id)=[^&\s"']{3,}/i,
  },
  {
    category: "raw-request-body",
    pattern: /["'](?:postData|postDataJSON|requestBody|request_body)["']\s*:\s*(?!null\b|undefined\b)["'{\[]/i,
  },
  {
    category: "provider-message-payload",
    pattern: /["']messages["']\s*:\s*\[[\s\S]{0,4096}?["']content["']\s*:/i,
  },
  {
    category: "raw-response-body",
    pattern: /["'](?:responseBody|response_body)["']\s*:\s*(?!null\b|undefined\b)["'{\[]/i,
  },
  {
    category: "provider-response-payload",
    pattern: /["']choices["']\s*:\s*\[[\s\S]{0,4096}?["']message["']\s*:/i,
  },
];

export class ArtifactPrivacyError extends Error {
  constructor(category, path) {
    super(`artifact privacy check failed: ${category}: ${displayPath(path)}`);
    this.name = "ArtifactPrivacyError";
    this.category = category;
    this.path = displayPath(path);
  }
}

function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
}

export function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) value = CRC_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}

function displayPath(path) {
  let redacted = String(path);
  for (const value of KNOWN_PRIVATE_TEST_VALUES) {
    redacted = redacted.split(value).join("[redacted-test-value]");
  }
  redacted = redacted
    .replace(
      /(?:sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{30,}|AIza[A-Za-z0-9_-]{30,}|AKIA[A-Z0-9]{16}|gsk_[A-Za-z0-9]{20,}|xai-[A-Za-z0-9_-]{20,})/gi,
      "[redacted-credential]",
    )
    .replace(/\bbearer\s+[A-Za-z0-9._~+/=-]{8,}/gi, "Bearer [redacted]")
    .replace(
      /([?&](?:x-amz-signature|x-goog-signature|signature|sig|access_token|token|key-pair-id)=)[^&#\s]{3,}/gi,
      "$1[redacted]",
    )
    .replace(
      /(\b(?:api[_-]?key|x-api-key)\s*[=:]\s*)[^&#\s]{4,}/gi,
      "$1[redacted]",
    );
  redacted = redacted
    .split("/")
    .map((segment) => (
      sensitiveTextCategory(segment) ? "[redacted-sensitive-path]" : segment
    ))
    .join("/");
  return redacted
    .replace(/[\u0000-\u001f\u007f]/g, "?")
    .slice(0, 500);
}

function fail(category, path) {
  throw new ArtifactPrivacyError(category, path);
}

function isInside(base, target) {
  const rel = relative(base, target);
  return rel === "" || (!rel.startsWith(`..${sep}`) && rel !== ".." && !rel.startsWith(sep));
}

function artifactPath(rootLabel, absoluteRoot, absolutePath) {
  const child = relative(absoluteRoot, absolutePath).split(sep).join("/");
  return child ? `${rootLabel}/${child}` : rootLabel;
}

function decodeText(bytes, path) {
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail("binary-or-invalid-utf8", path);
  }
  if (/\u0000/.test(text)) fail("binary-or-invalid-utf8", path);
  let controls = 0;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    if (code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d) controls += 1;
  }
  if (controls > Math.max(2, Math.floor(text.length / 1_000))) {
    fail("binary-or-invalid-utf8", path);
  }
  return text;
}

export function sensitiveTextCategory(text) {
  for (const value of KNOWN_PRIVATE_TEST_VALUES) {
    if (text.includes(value)) return "known-private-test-value";
  }
  for (const rule of TEXT_RULES) {
    rule.pattern.lastIndex = 0;
    if (rule.pattern.test(text)) return rule.category;
  }
  return null;
}

function rejectSensitivePathValue(value, display) {
  const category = sensitiveTextCategory(value);
  if (category) fail(`sensitive-path-${category}`, display);
}

function rejectSensitivePathSegments(relativePath, display) {
  for (const segment of relativePath.split("/")) {
    if (segment) rejectSensitivePathValue(segment, display);
  }
}

function occurrenceOffsets(text, needle) {
  const offsets = [];
  let offset = 0;
  while (offset <= text.length - needle.length) {
    const found = text.indexOf(needle, offset);
    if (found === -1) break;
    offsets.push(found);
    offset = found + needle.length;
  }
  return offsets;
}

function strictBase64Decode(payload, path) {
  if (!payload || payload.length > MAX_EMBEDDED_REPORT_BASE64_CHARS) {
    fail(payload ? "embedded-report-too-large" : "embedded-report-base64-invalid", path);
  }
  if (payload.length % 4 !== 0) fail("embedded-report-base64-invalid", path);
  let padding = 0;
  if (payload.endsWith("==")) padding = 2;
  else if (payload.endsWith("=")) padding = 1;
  const contentLength = payload.length - padding;
  for (let index = 0; index < contentLength; index += 1) {
    const code = payload.charCodeAt(index);
    const valid =
      (code >= 0x41 && code <= 0x5a) ||
      (code >= 0x61 && code <= 0x7a) ||
      (code >= 0x30 && code <= 0x39) ||
      code === 0x2b ||
      code === 0x2f;
    if (!valid) fail("embedded-report-base64-invalid", path);
  }
  for (let index = contentLength; index < payload.length; index += 1) {
    if (payload.charCodeAt(index) !== 0x3d) fail("embedded-report-base64-invalid", path);
  }
  const expectedBytes = payload.length / 4 * 3 - padding;
  if (expectedBytes > MAX_EMBEDDED_REPORT_ZIP_BYTES) {
    fail("embedded-report-too-large", path);
  }
  let decoded;
  try {
    decoded = Buffer.from(payload, "base64");
  } catch {
    fail("embedded-report-base64-invalid", path);
  }
  if (
    decoded.length !== expectedBytes ||
    decoded.length > MAX_EMBEDDED_REPORT_ZIP_BYTES ||
    decoded.toString("base64") !== payload
  ) {
    fail("embedded-report-base64-invalid", path);
  }
  return decoded;
}

function scanEmbeddedPlaywrightReport(text, path, stats) {
  const idPattern = /\bid\s*=\s*(?:"playwrightReportBase64"|'playwrightReportBase64'|playwrightReportBase64(?=[\s>]))/g;
  const idMatches = [...text.matchAll(idPattern)];
  const lowered = text.toLowerCase();
  const dataPrefix = "data:application/zip;base64,";
  const dataOffsets = occurrenceOffsets(lowered, dataPrefix);
  if (idMatches.length === 0 && dataOffsets.length === 0) return text;
  if (idMatches.length === 0) fail("embedded-report-unbound-data", path);
  if (idMatches.length > 1) fail("embedded-report-duplicate", path);

  const carriers = [
    {
      open: '<template id="playwrightReportBase64">',
      close: "</template>",
    },
    {
      open: '<script id="playwrightReportBase64" type="application/zip">',
      close: "</script>",
    },
  ];
  const carrierMatches = carriers.flatMap((carrier) => (
    occurrenceOffsets(text, carrier.open).map((offset) => ({ ...carrier, offset }))
  ));
  if (carrierMatches.length !== 1) fail("embedded-report-shape-invalid", path);
  const carrier = carrierMatches[0];
  if (
    idMatches[0].index < carrier.offset ||
    idMatches[0].index >= carrier.offset + carrier.open.length
  ) {
    fail("embedded-report-shape-invalid", path);
  }
  if (dataOffsets.length !== 1) {
    fail(dataOffsets.length > 1 ? "embedded-report-extra-data" : "embedded-report-shape-invalid", path);
  }
  const payloadStart = carrier.offset + carrier.open.length;
  const closeOffset = text.indexOf(carrier.close, payloadStart);
  if (closeOffset === -1) fail("embedded-report-shape-invalid", path);
  const envelope = text.slice(payloadStart, closeOffset);
  if (!envelope.startsWith(dataPrefix)) fail("embedded-report-shape-invalid", path);
  const payload = envelope.slice(dataPrefix.length);
  const embeddedPath = `${path}![embedded-report.zip]`;
  const archive = strictBase64Decode(payload, embeddedPath);
  if (stats.embeddedReports > 0) fail("embedded-report-duplicate", path);
  stats.embeddedReports += 1;
  stats.bytesScanned += archive.length;
  scanZip(archive, embeddedPath, stats);
  return `${text.slice(0, payloadStart)}[embedded report ZIP scanned]${text.slice(closeOffset)}`;
}

function scanText(bytes, path, stats) {
  const text = decodeText(bytes, path);
  const inspectedText = scanEmbeddedPlaywrightReport(text, path, stats);
  const category = sensitiveTextCategory(inspectedText);
  if (category) fail(category, path);
}

function validateZipName(name, outerPath) {
  if (
    !name ||
    name.includes("\\") ||
    name.includes("\u0000") ||
    name.startsWith("/") ||
    /^[A-Za-z]:/.test(name)
  ) {
    fail("zip-path-invalid", outerPath);
  }
  const directory = name.endsWith("/");
  const path = directory ? name.slice(0, -1) : name;
  const segments = path.split("/");
  if (!path || segments.some((segment) => !segment || segment === "." || segment === "..")) {
    fail("zip-path-invalid", outerPath);
  }
  return directory;
}

function findZipEnd(bytes, path) {
  if (bytes.length < 22) fail("zip-invalid", path);
  const earliest = Math.max(0, bytes.length - 22 - 0xffff);
  for (let offset = bytes.length - 22; offset >= earliest; offset -= 1) {
    if (bytes.readUInt32LE(offset) !== ZIP_END) continue;
    const commentLength = bytes.readUInt16LE(offset + 20);
    if (offset + 22 + commentLength === bytes.length) return offset;
  }
  fail("zip-invalid", path);
}

function decodeZipName(bytes, path) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail("zip-path-invalid", path);
  }
}

function validateZipExtra(bytes, path) {
  if (bytes.length === 0) return;
  // Playwright's ZIP writer emits one central-directory extended timestamp:
  // ID (2), size=5 (2), flags (1), and mtime (4). Accept exactly that shape,
  // rather than leaving arbitrary extra-field bytes unexamined.
  if (
    bytes.length !== 9 ||
    bytes.readUInt16LE(0) !== 0x5455 ||
    bytes.readUInt16LE(2) !== 5 ||
    (bytes[4] & ~0x07) !== 0
  ) {
    fail("zip-extra-unsupported", path);
  }
}

function unixEntryType(versionMadeBy, externalAttributes) {
  if ((versionMadeBy >>> 8) !== 3) return 0;
  return (externalAttributes >>> 16) & UNIX_FILE_TYPE;
}

function inflateEntry(compressed, entry, entryPath) {
  let content;
  if (entry.method === 0) {
    if (entry.compressedSize !== entry.uncompressedSize) fail("zip-invalid", entryPath);
    content = compressed;
  } else if (entry.method === 8) {
    try {
      content = inflateRawSync(compressed, {
        maxOutputLength: Math.max(1, entry.uncompressedSize),
      });
    } catch {
      fail("zip-invalid", entryPath);
    }
  } else {
    fail("zip-compression-unsupported", entryPath);
  }
  if (content.length !== entry.uncompressedSize || crc32(content) !== entry.crc) {
    fail("zip-integrity", entryPath);
  }
  return content;
}

function scanZip(bytes, outerPath, stats) {
  const endOffset = findZipEnd(bytes, outerPath);
  const disk = bytes.readUInt16LE(endOffset + 4);
  const centralDisk = bytes.readUInt16LE(endOffset + 6);
  const diskEntries = bytes.readUInt16LE(endOffset + 8);
  const totalEntries = bytes.readUInt16LE(endOffset + 10);
  const centralSize = bytes.readUInt32LE(endOffset + 12);
  const centralOffset = bytes.readUInt32LE(endOffset + 16);
  const endCommentLength = bytes.readUInt16LE(endOffset + 20);
  if (disk !== 0 || centralDisk !== 0 || diskEntries !== totalEntries) {
    fail("zip-multidisk-unsupported", outerPath);
  }
  if (
    totalEntries === ZIP64_SENTINEL_16 ||
    centralSize === ZIP64_SENTINEL_32 ||
    centralOffset === ZIP64_SENTINEL_32
  ) {
    fail("zip64-unsupported", outerPath);
  }
  if (totalEntries > MAX_ZIP_ENTRIES) fail("zip-too-many-entries", outerPath);
  if (centralOffset + centralSize !== endOffset) fail("zip-invalid", outerPath);
  if (endCommentLength) fail("zip-comment-unsupported", outerPath);

  const entries = [];
  const names = new Set();
  let offset = centralOffset;
  let totalUncompressed = 0;
  for (let index = 0; index < totalEntries; index += 1) {
    if (offset + 46 > endOffset || bytes.readUInt32LE(offset) !== ZIP_CENTRAL_FILE) {
      fail("zip-invalid", outerPath);
    }
    const versionMadeBy = bytes.readUInt16LE(offset + 4);
    const flags = bytes.readUInt16LE(offset + 8);
    const method = bytes.readUInt16LE(offset + 10);
    const crc = bytes.readUInt32LE(offset + 16);
    const compressedSize = bytes.readUInt32LE(offset + 20);
    const uncompressedSize = bytes.readUInt32LE(offset + 24);
    const nameLength = bytes.readUInt16LE(offset + 28);
    const extraLength = bytes.readUInt16LE(offset + 30);
    const commentLength = bytes.readUInt16LE(offset + 32);
    const startDisk = bytes.readUInt16LE(offset + 34);
    const externalAttributes = bytes.readUInt32LE(offset + 38);
    const localOffset = bytes.readUInt32LE(offset + 42);
    const recordEnd = offset + 46 + nameLength + extraLength + commentLength;
    if (recordEnd > endOffset || startDisk !== 0) fail("zip-invalid", outerPath);
    if (flags & 0x2041) fail("zip-encrypted", outerPath);
    if (flags & ~0x080e) fail("zip-flags-unsupported", outerPath);
    if (method !== 0 && method !== 8) fail("zip-compression-unsupported", outerPath);
    if (
      compressedSize === ZIP64_SENTINEL_32 ||
      uncompressedSize === ZIP64_SENTINEL_32 ||
      localOffset === ZIP64_SENTINEL_32
    ) {
      fail("zip64-unsupported", outerPath);
    }
    const nameBytes = bytes.subarray(offset + 46, offset + 46 + nameLength);
    const name = decodeZipName(nameBytes, outerPath);
    const directory = validateZipName(name, outerPath);
    const entryPath = `${outerPath}!/${name}`;
    const normalizedName = directory ? name.slice(0, -1) : name;
    rejectSensitivePathValue(normalizedName, entryPath);
    rejectSensitivePathSegments(normalizedName, entryPath);
    if (names.has(name)) fail("zip-duplicate-entry", entryPath);
    names.add(name);
    const centralExtraStart = offset + 46 + nameLength;
    validateZipExtra(
      bytes.subarray(centralExtraStart, centralExtraStart + extraLength),
      entryPath,
    );
    if (commentLength) fail("zip-comment-unsupported", entryPath);
    const type = unixEntryType(versionMadeBy, externalAttributes);
    if (type === UNIX_SYMLINK) fail("zip-symlink", entryPath);
    if (type && type !== UNIX_REGULAR && type !== UNIX_DIRECTORY) {
      fail("zip-non-regular-entry", entryPath);
    }
    if (directory && (compressedSize !== 0 || uncompressedSize !== 0)) {
      fail("zip-invalid", entryPath);
    }
    if (!directory && uncompressedSize > MAX_ZIP_ENTRY_BYTES) {
      fail("zip-entry-too-large", entryPath);
    }
    totalUncompressed += uncompressedSize;
    if (totalUncompressed > MAX_ZIP_TOTAL_BYTES) fail("zip-expanded-too-large", outerPath);
    entries.push({
      name,
      nameBytes,
      directory,
      flags,
      method,
      crc,
      compressedSize,
      uncompressedSize,
      localOffset,
      entryPath,
    });
    offset = recordEnd;
  }
  if (offset !== endOffset) fail("zip-invalid", outerPath);

  const ranges = [];
  for (const entry of entries) {
    if (entry.localOffset + 30 > centralOffset) fail("zip-invalid", entry.entryPath);
    if (bytes.readUInt32LE(entry.localOffset) !== ZIP_LOCAL_FILE) {
      fail("zip-invalid", entry.entryPath);
    }
    const localFlags = bytes.readUInt16LE(entry.localOffset + 6);
    const localMethod = bytes.readUInt16LE(entry.localOffset + 8);
    const localNameLength = bytes.readUInt16LE(entry.localOffset + 26);
    const localExtraLength = bytes.readUInt16LE(entry.localOffset + 28);
    const localCrc = bytes.readUInt32LE(entry.localOffset + 14);
    const localCompressedSize = bytes.readUInt32LE(entry.localOffset + 18);
    const localUncompressedSize = bytes.readUInt32LE(entry.localOffset + 22);
    const localNameStart = entry.localOffset + 30;
    const localExtraStart = localNameStart + localNameLength;
    const dataStart = localExtraStart + localExtraLength;
    const dataEnd = dataStart + entry.compressedSize;
    if (
      dataEnd > centralOffset ||
      localFlags !== entry.flags ||
      localMethod !== entry.method ||
      localNameLength !== entry.nameBytes.length ||
      !bytes.subarray(localNameStart, localNameStart + localNameLength).equals(entry.nameBytes)
    ) {
      fail("zip-invalid", entry.entryPath);
    }
    validateZipExtra(bytes.subarray(localExtraStart, dataStart), entry.entryPath);
    const usesDescriptor = (entry.flags & 0x0008) !== 0;
    if (!usesDescriptor && (
      localCrc !== entry.crc ||
      localCompressedSize !== entry.compressedSize ||
      localUncompressedSize !== entry.uncompressedSize
    )) {
      fail("zip-integrity", entry.entryPath);
    }
    if (usesDescriptor && (
      (localCrc !== 0 && localCrc !== entry.crc) ||
      (localCompressedSize !== 0 && localCompressedSize !== entry.compressedSize) ||
      (localUncompressedSize !== 0 && localUncompressedSize !== entry.uncompressedSize)
    )) {
      fail("zip-integrity", entry.entryPath);
    }
    let recordEnd = dataEnd;
    if (usesDescriptor) {
      let descriptorOffset = dataEnd;
      if (
        descriptorOffset + 4 <= centralOffset &&
        bytes.readUInt32LE(descriptorOffset) === ZIP_DATA_DESCRIPTOR
      ) {
        descriptorOffset += 4;
      }
      if (descriptorOffset + 12 > centralOffset) fail("zip-invalid", entry.entryPath);
      if (
        bytes.readUInt32LE(descriptorOffset) !== entry.crc ||
        bytes.readUInt32LE(descriptorOffset + 4) !== entry.compressedSize ||
        bytes.readUInt32LE(descriptorOffset + 8) !== entry.uncompressedSize
      ) {
        fail("zip-integrity", entry.entryPath);
      }
      recordEnd = descriptorOffset + 12;
    }
    ranges.push({ start: entry.localOffset, end: recordEnd, path: entry.entryPath });
    if (entry.directory) continue;
    const content = inflateEntry(bytes.subarray(dataStart, dataEnd), entry, entry.entryPath);
    scanText(content, entry.entryPath, stats);
    stats.zipEntries += 1;
    stats.bytesScanned += content.length;
  }
  ranges.sort((left, right) => left.start - right.start);
  if (ranges.length > 0 && ranges[0].start !== 0) fail("zip-unreferenced-data", outerPath);
  for (let index = 1; index < ranges.length; index += 1) {
    if (ranges[index].start < ranges[index - 1].end) {
      fail("zip-overlapping-entry", ranges[index].path);
    }
    if (ranges[index].start !== ranges[index - 1].end) {
      fail("zip-unreferenced-data", ranges[index].path);
    }
  }
  if (ranges.length === 0 ? centralOffset !== 0 : ranges.at(-1).end !== centralOffset) {
    fail("zip-unreferenced-data", outerPath);
  }
}

async function readRegularFile(path, label) {
  let handle;
  try {
    handle = await open(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  } catch {
    fail("file-open-failed", label);
  }
  try {
    const before = await handle.stat();
    if (!before.isFile()) fail("non-regular-file", label);
    if (before.size > MAX_FILE_BYTES) fail("file-too-large", label);
    const bytesWithSentinel = Buffer.alloc(before.size + 1);
    let bytesRead = 0;
    while (bytesRead < bytesWithSentinel.length) {
      const result = await handle.read(
        bytesWithSentinel,
        bytesRead,
        bytesWithSentinel.length - bytesRead,
        null,
      );
      if (result.bytesRead === 0) break;
      bytesRead += result.bytesRead;
    }
    const bytes = bytesWithSentinel.subarray(0, bytesRead);
    const after = await handle.stat();
    if (
      bytes.length !== before.size ||
      before.dev !== after.dev ||
      before.ino !== after.ino ||
      before.size !== after.size ||
      before.mtimeMs !== after.mtimeMs
    ) {
      fail("file-changed-during-scan", label);
    }
    return bytes;
  } finally {
    await handle.close();
  }
}

async function walk(root, rootLabel, rootReal, directory, stats) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    fail("directory-read-failed", artifactPath(rootLabel, rootReal, directory));
  }
  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    const label = artifactPath(rootLabel, rootReal, path);
    if (!isInside(rootReal, path)) fail("path-outside-root", label);
    rejectSensitivePathValue(entry.name, label);
    let info;
    try {
      info = await lstat(path);
    } catch {
      fail("file-stat-failed", label);
    }
    if (info.isSymbolicLink()) fail("symlink", label);
    if (info.isDirectory()) {
      let directoryReal;
      try {
        directoryReal = await realpath(path);
      } catch {
        fail("directory-realpath-failed", label);
      }
      if (directoryReal !== path || !isInside(rootReal, directoryReal)) {
        fail("path-outside-root", label);
      }
      await walk(root, rootLabel, rootReal, path, stats);
      continue;
    }
    if (!info.isFile()) fail("non-regular-file", label);
    const bytes = await readRegularFile(path, label);
    if (basename(path).toLowerCase().endsWith(".zip")) scanZip(bytes, label, stats);
    else scanText(bytes, label, stats);
    stats.files += 1;
    stats.bytesScanned += bytes.length;
  }
}

export async function scanArtifactRoots(roots = DEFAULT_ARTIFACT_ROOTS, options = {}) {
  const cwd = resolve(options.cwd ?? process.cwd());
  const cwdReal = await realpath(cwd);
  const requestedRoots = [...roots];
  if (requestedRoots.length === 0) {
    return {
      roots: 0,
      missingRoots: 0,
      files: 0,
      zipEntries: 0,
      embeddedReports: 0,
      bytesScanned: 0,
    };
  }
  const stats = {
    roots: 0,
    missingRoots: 0,
    files: 0,
    zipEntries: 0,
    embeddedReports: 0,
    bytesScanned: 0,
  };
  const seen = new Set();

  for (const requested of requestedRoots) {
    if (typeof requested !== "string" || !requested.trim()) fail("root-invalid", "[root]");
    const root = resolve(cwd, requested);
    const rootLabel = relative(cwd, root).split(sep).join("/") || ".";
    if (root === cwd || !isInside(cwd, root)) fail("root-outside-workspace", rootLabel);
    rejectSensitivePathSegments(rootLabel, rootLabel);
    let info;
    try {
      info = await lstat(root);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
        stats.missingRoots += 1;
        continue;
      }
      fail("root-stat-failed", rootLabel);
    }
    if (info.isSymbolicLink()) fail("symlink", rootLabel);
    if (!info.isDirectory()) fail("root-not-directory", rootLabel);
    let rootReal;
    try {
      rootReal = await realpath(root);
    } catch {
      fail("root-realpath-failed", rootLabel);
    }
    const expectedReal = resolve(cwdReal, relative(cwd, root));
    if (rootReal !== expectedReal || !isInside(cwdReal, rootReal)) {
      fail("root-outside-workspace", rootLabel);
    }
    if (seen.has(rootReal)) fail("root-duplicate", rootLabel);
    seen.add(rootReal);
    stats.roots += 1;
    await walk(root, rootLabel, rootReal, rootReal, stats);
  }
  return stats;
}

const invoked = process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (invoked) {
  try {
    const roots = process.argv.length > 2 ? process.argv.slice(2) : DEFAULT_ARTIFACT_ROOTS;
    const stats = await scanArtifactRoots(roots);
    console.log(
      `artifact privacy: PASS — ${stats.files} regular file(s), ${stats.zipEntries} ZIP entry file(s), and ${stats.embeddedReports} embedded report(s) scanned; ${stats.missingRoots} root(s) absent`,
    );
  } catch (error) {
    if (error instanceof ArtifactPrivacyError) console.error(error.message);
    else console.error("artifact privacy check failed: scanner-error: [internal]");
    process.exitCode = 1;
  }
}
