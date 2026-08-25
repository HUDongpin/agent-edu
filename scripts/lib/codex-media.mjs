import { createHash } from "node:crypto";
import { isAbsolute, relative, resolve } from "node:path";

export const CODEX_MEDIA_AUDIT_SCHEMA = "aicourse.codex.media-audit.v2";
export const CODEX_MEDIA_PATTERN_VERSION = "2";
export const CODEX_MEDIA_PRIVACY_CHECKLIST_VERSION = "codex-figure-privacy.v2";
export const CODEX_MEDIA_FILESYSTEM_ATTRIBUTE_POLICY = "codex-media-xattr.v2";
export const CODEX_MEDIA_ALLOWED_HOST_MARKER = Object.freeze({
  name: "com.apple.provenance",
  markerHex: "0102",
  hostLocalNontransported: true,
});
export const CODEX_MEDIA_TRANSFORM = Object.freeze({
  png: "ImageMagick width 2240, RGB 8-bit, non-interlaced, strip all ancillary chunks",
  webp: "cwebp lossless, near_lossless 95, method 6, metadata none",
  filesystemAttributes: "remove user-attached extended attributes; permit only the macOS-managed provenance form 010200 plus eight opaque host-local bytes, recorded only as marker 0102 and never transported",
  responsiveWidths: Object.freeze([2240, 1120]),
});
export const CODEX_MEDIA_CHECKLIST = Object.freeze([
  "applicationWindowOnly",
  "syntheticRepositoryOnly",
  "noAccountIdentifiers",
  "noCredentialsOrSecrets",
  "noPersonalPaths",
  "noPrivateRemotes",
  "visibleHistoryAndNotificationsReviewedNoPrivateContent",
  "noCustomerOrPersonalData",
  "allPublishedDerivativesReviewed",
  "altAndCaptionMatchFinalPixels",
]);

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const PNG_ALLOWED_COLOR_TYPES = new Set([0, 2, 3, 4, 6]);
const PNG_ALLOWED_BIT_DEPTHS = new Map([
  [0, new Set([1, 2, 4, 8, 16])],
  [2, new Set([8, 16])],
  [3, new Set([1, 2, 4, 8])],
  [4, new Set([8, 16])],
  [6, new Set([8, 16])],
]);
const PNG_METADATA_CHUNKS = new Set([
  "cHRM",
  "eXIf",
  "gAMA",
  "iCCP",
  "iTXt",
  "pHYs",
  "sBIT",
  "sPLT",
  "sRGB",
  "tEXt",
  "tIME",
  "zTXt",
]);
const PNG_SAFE_CRITICAL_CHUNKS = new Set(["IHDR", "PLTE", "IDAT", "IEND"]);
const WEBP_IMAGE_CHUNKS = new Set(["VP8 ", "VP8L"]);
const WEBP_ALLOWED_CHUNKS = new Set(["VP8X", "ALPH", "VP8 ", "VP8L"]);
const WEBP_METADATA_CHUNKS = new Set(["ICCP", "EXIF", "XMP "]);
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const FIGURE_ID_PATTERN = /^fig-(?:0[1-9]|1\d|2[0-4])$/;
const PLACEHOLDER_HUMAN_REVIEWER = /(?:^|[-_.\s])(?:tbd|pending|unknown|anonymous|ai|codex|bot|agent)(?:$|[-_.\s])/iu;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const REVIEWABLE_FIRST_PARTY_URLS = Object.freeze([
  "https://chatgpt.com/codex/settings/usage",
]);

const HARD_PRIVACY_PATTERNS = Object.freeze([
  {
    id: "user-path-unix",
    label: "Unix user-home path",
    expression: /\/(?:Users|home)\/[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._~+ -]+)*/giu,
  },
  {
    id: "user-path-windows",
    label: "Windows user-home path",
    expression: /\b[A-Za-z]:\\Users\\[^\s\\/:*?"<>|]+(?:\\[^\r\n]*)?/giu,
  },
  {
    id: "email-address",
    label: "Email address",
    expression: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu,
  },
  {
    id: "openai-api-key",
    label: "OpenAI-style API key",
    expression: /\bsk-(?:proj-)?[A-Za-z0-9_-]{8,}\b/gu,
  },
  {
    id: "github-token",
    label: "GitHub-style access token",
    expression: /\bgh[pousr]_[A-Za-z0-9]{8,}\b/gu,
  },
  {
    id: "bearer-credential",
    label: "Bearer credential",
    expression: /\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/giu,
  },
  {
    id: "private-key",
    label: "Private-key material",
    expression: /-----BEGIN(?: [A-Z0-9]+)* PRIVATE KEY-----/giu,
  },
  {
    id: "dotenv-file",
    label: "Environment-file path",
    expression: /(?:^|[\s/\\])\.env(?:\.[A-Za-z0-9_-]+)?\b/gimu,
  },
  {
    id: "url",
    label: "Remote URL",
    expression: /\bhttps?:\/\/[^\s<>{}\[\]"']+/giu,
  },
  {
    id: "git-remote",
    label: "Git or hosted-repository remote",
    expression: /(?:\bgit@[A-Za-z0-9.-]+:[^\s]+|\bssh:\/\/[^\s]+|\b(?:github|gitlab|bitbucket)\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?\b)/giu,
  },
]);

const REVIEW_PRIVACY_PATTERNS = Object.freeze([
  { id: "token-word", label: "Token wording", expression: /\btoken(?:s)?\b/giu },
  { id: "secret-word", label: "Secret wording", expression: /\bsecret(?:s)?\b/giu },
  { id: "password-word", label: "Password wording", expression: /\bpassword(?:s)?\b/giu },
  { id: "credential-word", label: "Credential wording", expression: /\bcredential(?:s)?\b/giu },
  { id: "api-key-word", label: "API-key wording", expression: /\bapi[ _-]?key(?:s)?\b/giu },
]);

const CRC32_TABLE = new Uint32Array(256);
for (let index = 0; index < CRC32_TABLE.length; index += 1) {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) === 1 ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
  }
  CRC32_TABLE[index] = value >>> 0;
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function isRealIsoDate(value) {
  if (typeof value !== "string" || !ISO_DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

export function crc32(value) {
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(value);
  let result = 0xffffffff;
  for (const byte of bytes) {
    result = CRC32_TABLE[(result ^ byte) & 0xff] ^ (result >>> 8);
  }
  return (result ^ 0xffffffff) >>> 0;
}

export function isPathInside(candidatePath, rootPath) {
  if (!isAbsolute(candidatePath) || !isAbsolute(rootPath)) return false;
  const candidate = resolve(candidatePath);
  const root = resolve(rootPath);
  const difference = relative(root, candidate);
  return difference === "" || (!difference.startsWith("..") && !isAbsolute(difference));
}

export function assessPathConfinement({
  requestedPath,
  realPath,
  forbiddenRoots = [],
  targetIsSymlink = false,
  label = "path",
}) {
  const errors = [];
  if (typeof requestedPath !== "string" || !isAbsolute(requestedPath)) {
    errors.push(`${label} must be an absolute path`);
    return { ok: false, errors };
  }
  if (typeof realPath !== "string" || !isAbsolute(realPath)) {
    errors.push(`${label} must resolve to an absolute path`);
  }
  if (targetIsSymlink) errors.push(`${label} must not be a symbolic link`);

  for (const forbiddenRoot of forbiddenRoots) {
    if (typeof forbiddenRoot !== "string" || !isAbsolute(forbiddenRoot)) {
      errors.push(`forbidden root must be absolute: ${String(forbiddenRoot)}`);
      continue;
    }
    if (isPathInside(requestedPath, forbiddenRoot)) {
      errors.push(`${label} is lexically inside forbidden root ${forbiddenRoot}`);
    }
    if (typeof realPath === "string" && isPathInside(realPath, forbiddenRoot)) {
      errors.push(`${label} resolves inside forbidden root ${forbiddenRoot}`);
    }
  }

  return { ok: errors.length === 0, errors };
}

export function parseMacOsXattrNames(value) {
  return String(value ?? "")
    .split(/\r?\n/u)
    .map((name) => name.trim())
    .filter(Boolean);
}

export function parseGetfattrNames(value) {
  const names = [];
  for (const rawLine of String(value ?? "").split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const equals = line.indexOf("=");
    names.push(equals === -1 ? line : line.slice(0, equals));
  }
  return names;
}

export function parseMacOsXattrHex(value) {
  const text = String(value ?? "");
  if (text.trim().length === 0 || /[^a-fA-F0-9\s]/u.test(text)) return null;
  const compact = text.replace(/\s/gu, "").toLowerCase();
  if (compact.length === 0 || compact.length % 2 !== 0) return null;
  return compact;
}

function filesystemAttributeAuditState(allowedHostLocalMarker) {
  return {
    policy: CODEX_MEDIA_FILESYSTEM_ATTRIBUTE_POLICY,
    inspection: "passed",
    allowedHostLocalMarker,
  };
}

export function validateFilesystemAttributes(value) {
  const errors = [];
  if (!Array.isArray(value)) {
    return {
      ok: false,
      errors: ["filesystem extended-attribute inspection result is unavailable"],
      names: [],
      auditState: null,
    };
  }

  const attributes = [];
  for (const [index, attribute] of value.entries()) {
    if (!attribute || typeof attribute !== "object" || Array.isArray(attribute)) {
      errors.push(`extended attribute at index ${index} must be an inspected attribute object`);
      continue;
    }
    const { name, valueHex } = attribute;
    if (typeof name !== "string" || name.trim().length === 0 || /[\r\n\0]/u.test(name)) {
      errors.push(`extended attribute name at index ${index} is invalid`);
      continue;
    }
    attributes.push({ name: name.trim(), valueHex });
  }

  attributes.sort((left, right) => left.name.localeCompare(right.name));
  const names = attributes.map((attribute) => attribute.name);
  if (new Set(names).size !== names.length) errors.push("extended attribute names must be unique");

  let allowedHostLocalMarker = null;
  for (const attribute of attributes) {
    if (attribute.name !== CODEX_MEDIA_ALLOWED_HOST_MARKER.name) {
      errors.push(`disallowed filesystem extended attribute remains: ${attribute.name}`);
      continue;
    }
    if (typeof attribute.valueHex !== "string" || !/^[a-f0-9]+$/u.test(attribute.valueHex)) {
      errors.push(`${attribute.name} value could not be inspected as hexadecimal bytes`);
      continue;
    }
    const normalizedHex = attribute.valueHex.toLowerCase();
    if (!/^010200[a-f0-9]{16}$/u.test(normalizedHex)) {
      errors.push(
        `${attribute.name} must use marker 0102 in the exact managed payload form 010200 plus eight opaque host-local bytes`,
      );
      continue;
    }
    allowedHostLocalMarker = { ...CODEX_MEDIA_ALLOWED_HOST_MARKER };
  }

  return {
    ok: errors.length === 0,
    errors,
    names,
    auditState: errors.length === 0 ? filesystemAttributeAuditState(allowedHostLocalMarker) : null,
  };
}

export function validateFilesystemAttributeAuditState(value) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, errors: ["filesystemAttributes must be an object"] };
  }
  if (value.policy !== CODEX_MEDIA_FILESYSTEM_ATTRIBUTE_POLICY) {
    errors.push(`filesystemAttributes.policy must be ${CODEX_MEDIA_FILESYSTEM_ATTRIBUTE_POLICY}`);
  }
  if (value.inspection !== "passed") errors.push("filesystemAttributes.inspection must be passed");
  const marker = value.allowedHostLocalMarker;
  if (marker !== null) {
    if (!marker || typeof marker !== "object" || Array.isArray(marker)) {
      errors.push("filesystemAttributes.allowedHostLocalMarker must be null or an object");
    } else {
      if (marker.name !== CODEX_MEDIA_ALLOWED_HOST_MARKER.name) {
        errors.push(`allowed host-local marker name must be ${CODEX_MEDIA_ALLOWED_HOST_MARKER.name}`);
      }
      if (marker.markerHex !== CODEX_MEDIA_ALLOWED_HOST_MARKER.markerHex) {
        errors.push(`allowed host-local marker hex must be ${CODEX_MEDIA_ALLOWED_HOST_MARKER.markerHex}`);
      }
      if (marker.hostLocalNontransported !== true) {
        errors.push("allowed host-local marker must be recorded as hostLocalNontransported");
      }
      const markerKeys = Object.keys(marker).sort();
      if (markerKeys.join(",") !== "hostLocalNontransported,markerHex,name") {
        errors.push("allowed host-local marker must not retain the opaque managed payload");
      }
    }
  }
  const keys = Object.keys(value).sort();
  if (keys.join(",") !== "allowedHostLocalMarker,inspection,policy") {
    errors.push("filesystemAttributes contains unsupported or missing fields");
  }
  return { ok: errors.length === 0, errors };
}

function addContainerError(result, message) {
  result.errors.push(message);
  result.ok = false;
}

function pngChunkIsAncillary(type) {
  return (type.charCodeAt(0) & 0x20) !== 0;
}

export function inspectPng(value) {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value);
  const result = {
    format: "png",
    ok: true,
    complete: false,
    errors: [],
    width: null,
    height: null,
    bitDepth: null,
    colorType: null,
    interlace: null,
    chunks: [],
    metadataChunks: [],
    ancillaryChunks: [],
  };

  if (buffer.length < PNG_SIGNATURE.length || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    addContainerError(result, "invalid PNG signature");
    return result;
  }

  let offset = 8;
  let sawIhdr = false;
  let sawIdat = false;
  let sawIend = false;
  let sawPlte = false;
  let endedIdatRun = false;

  while (offset < buffer.length) {
    if (buffer.length - offset < 12) {
      addContainerError(result, `truncated PNG chunk header at byte ${offset}`);
      break;
    }
    const length = buffer.readUInt32BE(offset);
    const typeBytes = buffer.subarray(offset + 4, offset + 8);
    const type = typeBytes.toString("ascii");
    const chunkEnd = offset + 12 + length;
    if (!/^[A-Za-z]{4}$/.test(type)) {
      addContainerError(result, `invalid PNG chunk type at byte ${offset}`);
      break;
    }
    if (length > 0x7fffffff) addContainerError(result, `PNG ${type} exceeds the maximum chunk length`);
    if ((type.charCodeAt(2) & 0x20) !== 0) addContainerError(result, `PNG ${type} has an invalid reserved bit`);
    if (!pngChunkIsAncillary(type) && !PNG_SAFE_CRITICAL_CHUNKS.has(type)) {
      addContainerError(result, `PNG contains unknown critical chunk ${type}`);
    }
    if (chunkEnd > buffer.length || chunkEnd < offset) {
      addContainerError(result, `truncated PNG ${type} chunk at byte ${offset}`);
      break;
    }

    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const expectedCrc = buffer.readUInt32BE(dataEnd);
    const actualCrc = crc32(buffer.subarray(offset + 4, dataEnd));
    if (actualCrc !== expectedCrc) {
      addContainerError(result, `PNG ${type} CRC mismatch at byte ${offset}`);
    }
    result.chunks.push({ type, length });
    if (pngChunkIsAncillary(type)) result.ancillaryChunks.push(type);
    if (PNG_METADATA_CHUNKS.has(type)) result.metadataChunks.push(type);

    if (!sawIhdr && type !== "IHDR") {
      addContainerError(result, "PNG IHDR must be the first chunk");
    }
    if (type === "IHDR") {
      if (sawIhdr) addContainerError(result, "PNG contains more than one IHDR chunk");
      if (length !== 13) {
        addContainerError(result, "PNG IHDR length must be 13 bytes");
      } else {
        result.width = buffer.readUInt32BE(dataStart);
        result.height = buffer.readUInt32BE(dataStart + 4);
        result.bitDepth = buffer[dataStart + 8];
        result.colorType = buffer[dataStart + 9];
        result.interlace = buffer[dataStart + 12];
        if (result.width === 0 || result.height === 0) {
          addContainerError(result, "PNG dimensions must be positive");
        }
        if (!PNG_ALLOWED_COLOR_TYPES.has(result.colorType)) {
          addContainerError(result, `unsupported PNG color type ${result.colorType}`);
        } else if (!PNG_ALLOWED_BIT_DEPTHS.get(result.colorType)?.has(result.bitDepth)) {
          addContainerError(
            result,
            `invalid PNG bit depth ${result.bitDepth} for color type ${result.colorType}`,
          );
        }
        if (buffer[dataStart + 10] !== 0 || buffer[dataStart + 11] !== 0) {
          addContainerError(result, "PNG uses an unsupported compression or filter method");
        }
        if (result.interlace !== 0 && result.interlace !== 1) {
          addContainerError(result, `invalid PNG interlace method ${result.interlace}`);
        }
      }
      sawIhdr = true;
    } else if (type === "IDAT") {
      if (!sawIhdr) addContainerError(result, "PNG IDAT precedes IHDR");
      if (endedIdatRun) addContainerError(result, "PNG IDAT chunks must be consecutive");
      sawIdat = true;
    } else if (type === "PLTE") {
      if (sawPlte) addContainerError(result, "PNG contains more than one PLTE chunk");
      if (sawIdat) addContainerError(result, "PNG PLTE must precede IDAT");
      if (length === 0 || length > 768 || length % 3 !== 0) {
        addContainerError(result, "PNG PLTE length must contain 1 to 256 RGB entries");
      }
      if (result.colorType === 0 || result.colorType === 4) {
        addContainerError(result, `PNG color type ${result.colorType} must not contain PLTE`);
      }
      sawPlte = true;
    } else if (sawIdat && type !== "IEND") {
      endedIdatRun = true;
    }

    if (type === "IEND") {
      if (length !== 0) addContainerError(result, "PNG IEND must have zero length");
      if (!sawIdat) addContainerError(result, "PNG IEND precedes image data");
      sawIend = true;
      offset = chunkEnd;
      if (offset !== buffer.length) {
        addContainerError(result, `PNG has ${buffer.length - offset} trailing byte(s) after IEND`);
      }
      break;
    }

    offset = chunkEnd;
  }

  if (!sawIhdr) addContainerError(result, "PNG is missing IHDR");
  if (!sawIdat) addContainerError(result, "PNG is missing IDAT");
  if (!sawIend) addContainerError(result, "PNG is missing IEND");
  if (result.colorType === 3 && !sawPlte) addContainerError(result, "indexed PNG is missing PLTE");
  result.complete = sawIend && offset === buffer.length;
  return result;
}

function readUInt24LE(buffer, offset) {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}

function parseVp8Dimensions(payload) {
  if (payload.length < 10) return null;
  if (payload[3] !== 0x9d || payload[4] !== 0x01 || payload[5] !== 0x2a) return null;
  return {
    width: payload.readUInt16LE(6) & 0x3fff,
    height: payload.readUInt16LE(8) & 0x3fff,
  };
}

function parseVp8lDimensions(payload) {
  if (payload.length < 5 || payload[0] !== 0x2f) return null;
  const packed = payload.readUInt32LE(1);
  return {
    width: (packed & 0x3fff) + 1,
    height: ((packed >>> 14) & 0x3fff) + 1,
  };
}

export function inspectWebp(value) {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value);
  const result = {
    format: "webp",
    ok: true,
    complete: false,
    errors: [],
    width: null,
    height: null,
    chunks: [],
    metadataChunks: [],
    unknownChunks: [],
    animated: false,
    extendedFlags: 0,
  };

  if (buffer.length < 12 || buffer.toString("ascii", 0, 4) !== "RIFF") {
    addContainerError(result, "invalid WebP RIFF signature");
    return result;
  }
  if (buffer.toString("ascii", 8, 12) !== "WEBP") {
    addContainerError(result, "invalid WebP form type");
    return result;
  }
  const declaredLength = buffer.readUInt32LE(4) + 8;
  if (declaredLength !== buffer.length) {
    addContainerError(
      result,
      declaredLength < buffer.length
        ? `WebP has ${buffer.length - declaredLength} trailing byte(s)`
        : `WebP is truncated by ${declaredLength - buffer.length} byte(s)`,
    );
  }

  let offset = 12;
  let imageChunkCount = 0;
  let vp8xCount = 0;
  let alphaChunkCount = 0;
  let imageChunkType = null;
  let frameDimensions = null;
  while (offset < buffer.length) {
    if (buffer.length - offset < 8) {
      addContainerError(result, `truncated WebP chunk header at byte ${offset}`);
      break;
    }
    const type = buffer.toString("ascii", offset, offset + 4);
    const length = buffer.readUInt32LE(offset + 4);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const paddedEnd = dataEnd + (length & 1);
    if (dataEnd > buffer.length || paddedEnd > buffer.length || dataEnd < offset) {
      addContainerError(result, `truncated WebP ${type} chunk at byte ${offset}`);
      break;
    }
    if ((length & 1) === 1 && buffer[dataEnd] !== 0) {
      addContainerError(result, `WebP ${type} chunk has a non-zero padding byte`);
    }

    const payload = buffer.subarray(dataStart, dataEnd);
    result.chunks.push({ type, length });
    if (WEBP_METADATA_CHUNKS.has(type)) result.metadataChunks.push(type.trim());
    if (!WEBP_ALLOWED_CHUNKS.has(type) && !WEBP_METADATA_CHUNKS.has(type) && type !== "ANIM" && type !== "ANMF") {
      result.unknownChunks.push(type);
    }
    if (type === "ANIM" || type === "ANMF") result.animated = true;

    if (WEBP_IMAGE_CHUNKS.has(type)) {
      imageChunkCount += 1;
      imageChunkType = type;
      const dimensions = type === "VP8 " ? parseVp8Dimensions(payload) : parseVp8lDimensions(payload);
      if (!dimensions || dimensions.width === 0 || dimensions.height === 0) {
        addContainerError(result, `WebP ${type.trim()} has an invalid frame header`);
      } else {
        frameDimensions = dimensions;
        if (result.width === null) {
          result.width = dimensions.width;
          result.height = dimensions.height;
        }
      }
    }

    if (type === "VP8X") {
      vp8xCount += 1;
      if (result.chunks.length !== 1) addContainerError(result, "WebP VP8X must be the first chunk");
      if (length !== 10) {
        addContainerError(result, "WebP VP8X chunk must be 10 bytes");
      } else {
        const flags = payload[0];
        result.extendedFlags = flags;
        if ((flags & 0xc1) !== 0) addContainerError(result, "WebP VP8X uses reserved feature bits");
        if ((flags & 0x02) !== 0) result.animated = true;
        const dimensions = {
          width: readUInt24LE(payload, 4) + 1,
          height: readUInt24LE(payload, 7) + 1,
        };
        if (result.width !== null && (result.width !== dimensions.width || result.height !== dimensions.height)) {
          addContainerError(result, "WebP VP8X canvas and frame dimensions disagree");
        }
        result.width = dimensions.width;
        result.height = dimensions.height;
      }
    }
    if (type === "ALPH") alphaChunkCount += 1;

    offset = paddedEnd;
  }

  if (offset !== buffer.length) addContainerError(result, "WebP chunk table does not end at EOF");
  if (imageChunkCount !== 1) {
    addContainerError(result, `WebP must contain exactly one image chunk; found ${imageChunkCount}`);
  }
  if (vp8xCount > 1) addContainerError(result, "WebP contains more than one VP8X chunk");
  if (frameDimensions && vp8xCount === 1 && (result.width !== frameDimensions.width || result.height !== frameDimensions.height)) {
    addContainerError(result, "WebP VP8X canvas and frame dimensions disagree");
  }
  if (alphaChunkCount > 1) addContainerError(result, "WebP contains more than one ALPH chunk");
  if (alphaChunkCount > 0 && (vp8xCount !== 1 || imageChunkType !== "VP8 ")) {
    addContainerError(result, "WebP ALPH requires VP8X and a lossy VP8 frame");
  }
  result.complete = offset === buffer.length && declaredLength === buffer.length;
  return result;
}

export function rejectImageMetadataAndFeatures(inspection) {
  const errors = [];
  if (!inspection || typeof inspection !== "object") {
    return { ok: false, errors: ["image inspection is missing"] };
  }
  if (inspection.format === "png") {
    const nonCritical = inspection.chunks
      .map((chunk) => chunk.type)
      .filter((type) => !PNG_SAFE_CRITICAL_CHUNKS.has(type));
    if (nonCritical.length > 0) {
      errors.push(`PNG contains ancillary or unsupported chunk(s): ${[...new Set(nonCritical)].join(", ")}`);
    }
    if (inspection.metadataChunks.length > 0) {
      errors.push(`PNG contains metadata chunk(s): ${[...new Set(inspection.metadataChunks)].join(", ")}`);
    }
    if (inspection.bitDepth !== 8) errors.push("served PNG must use 8-bit samples");
    if (inspection.colorType !== 2) errors.push("served PNG must be normalized to RGB color type 2");
    if (inspection.interlace !== 0) errors.push("served PNG must not be interlaced");
  } else if (inspection.format === "webp") {
    if (inspection.metadataChunks.length > 0 || (inspection.extendedFlags & 0x2c) !== 0) {
      errors.push("WebP contains ICC, EXIF, or XMP metadata");
    }
    if (inspection.animated) errors.push("WebP animation is not allowed");
    if (inspection.unknownChunks.length > 0) {
      errors.push(`WebP contains unsupported chunk(s): ${[...new Set(inspection.unknownChunks)].join(", ")}`);
    }
  } else {
    errors.push(`unsupported image format ${String(inspection.format)}`);
  }
  return { ok: errors.length === 0, errors };
}

function findLineAndColumn(text, offset) {
  const before = text.slice(0, offset);
  const lines = before.split(/\r?\n/u);
  return { line: lines.length, column: (lines.at(-1)?.length ?? 0) + 1 };
}

function comparePrivacyFindings(left, right) {
  return left.line - right.line
    || left.column - right.column
    || left.id.localeCompare(right.id);
}

function collectPrivacyMatches(text, patterns, severity, includeMatch = () => true) {
  const findings = [];
  for (const pattern of patterns) {
    pattern.expression.lastIndex = 0;
    for (const match of text.matchAll(pattern.expression)) {
      const value = match[0];
      if (!includeMatch(pattern, value)) continue;
      const location = findLineAndColumn(text, match.index ?? 0);
      findings.push({
        id: pattern.id,
        label: pattern.label,
        severity,
        line: location.line,
        column: location.column,
        matchSha256: sha256(value.normalize("NFKC").toLocaleLowerCase("en-US")),
      });
    }
  }
  return findings.sort(comparePrivacyFindings);
}

export function scanOcrText(value) {
  const text = String(value ?? "").normalize("NFKC");
  const isReviewableFirstPartyUrl = (pattern, matchedValue) => (
    pattern.id === "url" && REVIEWABLE_FIRST_PARTY_URLS.includes(matchedValue)
  );
  const hardFindings = collectPrivacyMatches(
    text,
    HARD_PRIVACY_PATTERNS,
    "hard",
    (pattern, matchedValue) => !isReviewableFirstPartyUrl(pattern, matchedValue),
  );
  const reviewFindings = [
    ...collectPrivacyMatches(text, REVIEW_PRIVACY_PATTERNS, "review"),
    ...collectPrivacyMatches(
      text,
      HARD_PRIVACY_PATTERNS,
      "review",
      isReviewableFirstPartyUrl,
    ).map((finding) => ({
      ...finding,
      id: "first-party-public-url",
      label: "Allowlisted first-party public URL",
    })),
  ].sort(comparePrivacyFindings);
  return {
    patternVersion: CODEX_MEDIA_PATTERN_VERSION,
    hardFindings,
    reviewFindings,
    hardFindingCount: hardFindings.length,
    reviewFindingCount: reviewFindings.length,
  };
}

export function expectedAssetNames(figureId) {
  return [
    `${figureId}-master.png`,
    `${figureId}-2240.webp`,
    `${figureId}-1120.webp`,
  ];
}

export function buildAssetInventory({ figureId, assets }) {
  const errors = [];
  if (!FIGURE_ID_PATTERN.test(figureId)) errors.push("figureId must match fig-01 through fig-24");
  if (!Array.isArray(assets)) return { ok: false, errors: [...errors, "assets must be an array"], inventory: [] };

  const expected = expectedAssetNames(figureId);
  const names = assets.map((asset) => asset?.name);
  for (const name of expected) {
    if (names.filter((candidate) => candidate === name).length !== 1) {
      errors.push(`asset inventory must contain ${name} exactly once`);
    }
  }
  for (const name of names) {
    if (!expected.includes(name)) errors.push(`unexpected asset ${String(name)}`);
  }

  const inventory = [];
  for (const asset of assets) {
    if (!asset || typeof asset.name !== "string" || !Buffer.isBuffer(asset.buffer)) continue;
    const inspection = asset.name.endsWith(".png") ? inspectPng(asset.buffer) : inspectWebp(asset.buffer);
    if (!inspection.ok) errors.push(`${asset.name}: ${inspection.errors.join("; ")}`);
    const policy = rejectImageMetadataAndFeatures(inspection);
    if (!policy.ok) errors.push(`${asset.name}: ${policy.errors.join("; ")}`);
    const filesystemAttributes = validateFilesystemAttributes(asset.filesystemAttributes);
    if (!filesystemAttributes.ok) errors.push(`${asset.name}: ${filesystemAttributes.errors.join("; ")}`);
    inventory.push({
      name: asset.name,
      mediaType: asset.name.endsWith(".png") ? "image/png" : "image/webp",
      bytes: asset.buffer.length,
      width: inspection.width,
      height: inspection.height,
      sha256: sha256(asset.buffer),
      containerComplete: inspection.complete,
      metadataFree: policy.ok,
      filesystemAttributes: filesystemAttributes.auditState,
    });
  }
  inventory.sort((left, right) => expected.indexOf(left.name) - expected.indexOf(right.name));

  const byName = new Map(inventory.map((asset) => [asset.name, asset]));
  const master = byName.get(`${figureId}-master.png`);
  const large = byName.get(`${figureId}-2240.webp`);
  const small = byName.get(`${figureId}-1120.webp`);
  if (master?.width !== 2240 || large?.width !== 2240 || small?.width !== 1120) {
    errors.push("served assets must have widths 2240, 2240, and 1120 respectively");
  }
  if (master && large && master.height !== large.height) {
    errors.push("2240 PNG and WebP heights must match");
  }
  if (master && small && Number.isInteger(master.height) && Number.isInteger(small.height)) {
    const expectedSmallHeight = Math.round(master.height / 2);
    if (Math.abs(small.height - expectedSmallHeight) > 1) {
      errors.push("1120 WebP aspect ratio does not match the master");
    }
  }

  return { ok: errors.length === 0, errors, inventory };
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireString(errors, value, path, pattern) {
  if (typeof value !== "string" || value.length === 0) {
    errors.push(`${path} must be a non-empty string`);
  } else if (pattern && !pattern.test(value)) {
    errors.push(`${path} has an invalid format`);
  }
}

function requireHumanReviewerId(errors, value, path) {
  requireString(errors, value, path);
  if (typeof value === "string" &&
      (value.trim() !== value || PLACEHOLDER_HUMAN_REVIEWER.test(value))) {
    errors.push(`${path} must be a non-placeholder stable human reviewer ID`);
  }
}

function requireNonFutureIsoTimestamp(errors, value, path) {
  requireString(errors, value, path);
  if (typeof value !== "string") return;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    errors.push(`${path} must be an ISO timestamp`);
  } else if (parsed > Date.now()) {
    errors.push(`${path} must not be in the future`);
  }
}

function requireExactKeys(errors, value, path, expectedKeys) {
  if (!isPlainObject(value)) return;
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (actual.join("\0") !== expected.join("\0")) {
    errors.push(`${path} contains unsupported or missing fields`);
  }
}

function inventoriesEqual(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
  const fields = [
    "name",
    "mediaType",
    "bytes",
    "width",
    "height",
    "sha256",
    "containerComplete",
    "metadataFree",
    "filesystemAttributes",
  ];
  return left.every((asset, index) => fields.every((field) => (
    field === "filesystemAttributes"
      ? JSON.stringify(asset?.[field]) === JSON.stringify(right[index]?.[field])
      : asset?.[field] === right[index]?.[field]
  )));
}

export function validateAuditRecord(record, { expectedInventory, requirePending = false } = {}) {
  const errors = [];
  if (!isPlainObject(record)) return { ok: false, errors: ["audit record must be an object"] };
  requireExactKeys(errors, record, "audit record", [
    "schema",
    "figureId",
    "createdAt",
    "publishable",
    "rawSource",
    "provenance",
    "tools",
    "transform",
    "assets",
    "ocr",
    "automatedChecks",
    "privacyReview",
  ]);
  if (record.schema !== CODEX_MEDIA_AUDIT_SCHEMA) errors.push(`schema must be ${CODEX_MEDIA_AUDIT_SCHEMA}`);
  requireString(errors, record.figureId, "figureId", FIGURE_ID_PATTERN);
  requireString(errors, record.createdAt, "createdAt");
  if (Number.isNaN(Date.parse(record.createdAt))) errors.push("createdAt must be an ISO timestamp");
  if (record.publishable !== false) errors.push("publishable must remain false in the staging audit");

  if (!isPlainObject(record.rawSource)) {
    errors.push("rawSource must be an object");
  } else {
    requireExactKeys(errors, record.rawSource, "rawSource", [
      "kind",
      "format",
      "mediaType",
      "bytes",
      "width",
      "height",
      "sha256",
      "retainedOutsidePublic",
      "retainedOutsideRepository",
    ]);
    if (record.rawSource.kind !== "course-authored-capture") errors.push("rawSource.kind must be course-authored-capture");
    if (record.rawSource.retainedOutsidePublic !== true) errors.push("rawSource.retainedOutsidePublic must be true");
    if (record.rawSource.retainedOutsideRepository !== true) errors.push("rawSource.retainedOutsideRepository must be true");
    requireString(errors, record.rawSource.sha256, "rawSource.sha256", SHA256_PATTERN);
    if (!Number.isInteger(record.rawSource.bytes) || record.rawSource.bytes <= 0) errors.push("rawSource.bytes must be positive");
    if (!Number.isInteger(record.rawSource.width) || record.rawSource.width < 2240) errors.push("rawSource.width must be at least 2240");
    if (!Number.isInteger(record.rawSource.height) || record.rawSource.height <= 0) errors.push("rawSource.height must be positive");
    if (record.rawSource.format !== "png") errors.push("rawSource.format must be png");
    if (record.rawSource.mediaType !== "image/png") errors.push("rawSource.mediaType must be image/png");
    if ("path" in record.rawSource || "name" in record.rawSource) errors.push("rawSource must not disclose a path or filename");
  }

  if (!isPlainObject(record.provenance)) {
    errors.push("provenance must be an object");
  } else {
    requireExactKeys(errors, record.provenance, "provenance", [
      "sourceId",
      "surface",
      "productVersion",
      "operatingSystem",
      "capturedOn",
    ]);
    requireString(errors, record.provenance.sourceId, "provenance.sourceId", /^openai-[a-z0-9-]{2,120}$/);
    requireString(errors, record.provenance.surface, "provenance.surface", /^[A-Za-z0-9][A-Za-z0-9 ._/-]{1,79}$/);
    if (!["app", "cli", "ide", "cloud", "github"].includes(record.provenance.surface)) {
      errors.push("provenance.surface must be app, cli, ide, cloud, or github");
    }
    requireString(errors, record.provenance.productVersion, "provenance.productVersion");
    requireString(errors, record.provenance.operatingSystem, "provenance.operatingSystem");
    requireString(errors, record.provenance.capturedOn, "provenance.capturedOn", ISO_DATE_PATTERN);
    if (!isRealIsoDate(record.provenance.capturedOn)) {
      errors.push("provenance.capturedOn must be a real date");
    }
    const provenanceScan = scanOcrText([
      record.provenance.sourceId,
      record.provenance.surface,
      record.provenance.productVersion,
      record.provenance.operatingSystem,
    ].join("\n"));
    if (provenanceScan.hardFindingCount > 0) errors.push("provenance contains a hard privacy pattern");
  }

  if (!isPlainObject(record.tools)) {
    errors.push("tools must be an object");
  } else {
    requireExactKeys(errors, record.tools, "tools", ["magick", "cwebp", "tesseract", "extendedAttributes"]);
    for (const tool of ["magick", "cwebp", "tesseract", "extendedAttributes"]) {
      requireString(errors, record.tools[tool], `tools.${tool}`);
    }
  }

  if (!isPlainObject(record.transform)) {
    errors.push("transform must be an object");
  } else {
    requireExactKeys(errors, record.transform, "transform", ["png", "webp", "filesystemAttributes", "responsiveWidths"]);
    if (record.transform.png !== CODEX_MEDIA_TRANSFORM.png) errors.push("transform.png does not match the locked transform");
    if (record.transform.webp !== CODEX_MEDIA_TRANSFORM.webp) errors.push("transform.webp does not match the locked transform");
    if (record.transform.filesystemAttributes !== CODEX_MEDIA_TRANSFORM.filesystemAttributes) {
      errors.push("transform.filesystemAttributes does not match the locked transform");
    }
    if (!Array.isArray(record.transform.responsiveWidths) || record.transform.responsiveWidths.join(",") !== "2240,1120") {
      errors.push("transform.responsiveWidths must be [2240, 1120]");
    }
  }

  if (!Array.isArray(record.assets) || record.assets.length !== 3) {
    errors.push("assets must contain exactly three served assets");
  } else {
    const expectedNames = expectedAssetNames(record.figureId);
    for (const [index, asset] of record.assets.entries()) {
      const path = `assets[${index}]`;
      if (!isPlainObject(asset)) {
        errors.push(`${path} must be an object`);
        continue;
      }
      requireExactKeys(errors, asset, path, [
        "name",
        "mediaType",
        "bytes",
        "width",
        "height",
        "sha256",
        "containerComplete",
        "metadataFree",
        "filesystemAttributes",
      ]);
      requireString(errors, asset.name, `${path}.name`);
      requireString(errors, asset.sha256, `${path}.sha256`, SHA256_PATTERN);
      if (!expectedNames.includes(asset.name)) errors.push(`${path}.name is not deterministic for ${record.figureId}`);
      const expectedMediaType = asset.name?.endsWith(".png") ? "image/png" : "image/webp";
      if (asset.mediaType !== expectedMediaType) errors.push(`${path}.mediaType must be ${expectedMediaType}`);
      if ("path" in asset || "source" in asset || "url" in asset) errors.push(`${path} must not disclose a path or remote source`);
      if (!Number.isInteger(asset.bytes) || asset.bytes <= 0) errors.push(`${path}.bytes must be positive`);
      if (!Number.isInteger(asset.width) || asset.width <= 0) errors.push(`${path}.width must be positive`);
      if (!Number.isInteger(asset.height) || asset.height <= 0) errors.push(`${path}.height must be positive`);
      if (asset.containerComplete !== true) errors.push(`${path}.containerComplete must be true`);
      if (asset.metadataFree !== true) errors.push(`${path}.metadataFree must be true`);
      const filesystemAttributes = validateFilesystemAttributeAuditState(asset.filesystemAttributes);
      if (!filesystemAttributes.ok) {
        errors.push(`${path}.filesystemAttributes: ${filesystemAttributes.errors.join("; ")}`);
      }
    }
    if (new Set(record.assets.map((asset) => asset?.name)).size !== 3) errors.push("asset names must be unique");
    if (record.assets.map((asset) => asset?.name).join(",") !== expectedNames.join(",")) {
      errors.push("assets must use deterministic master, 2240 WebP, and 1120 WebP order");
    }
    const [master, large, small] = record.assets;
    if (master?.width !== 2240 || large?.width !== 2240 || small?.width !== 1120) {
      errors.push("audit assets must have widths 2240, 2240, and 1120");
    }
    if (master?.height !== large?.height) errors.push("audit master and 2240 WebP heights must match");
    if (Number.isInteger(master?.height) && Number.isInteger(small?.height) && Math.abs(small.height - Math.round(master.height / 2)) > 1) {
      errors.push("audit 1120 WebP aspect ratio must match the master");
    }
    if (expectedInventory && !inventoriesEqual(record.assets, expectedInventory)) {
      errors.push("asset inventory does not match the current files");
    }
  }

  if (!isPlainObject(record.ocr)) {
    errors.push("ocr must be an object");
  } else {
    requireExactKeys(errors, record.ocr, "ocr", [
      "patternVersion",
      "modes",
      "digestSha256",
      "textBytes",
      "hardFindingCount",
      "hardFindings",
      "reviewFindingCount",
      "reviewFindings",
    ]);
    if (record.ocr.patternVersion !== CODEX_MEDIA_PATTERN_VERSION) errors.push("ocr.patternVersion is stale");
    if (!Array.isArray(record.ocr.modes) || record.ocr.modes.join(",") !== "6,11") errors.push("ocr.modes must be [6, 11]");
    requireString(errors, record.ocr.digestSha256, "ocr.digestSha256", SHA256_PATTERN);
    if (!Number.isInteger(record.ocr.textBytes) || record.ocr.textBytes < 0) errors.push("ocr.textBytes must be non-negative");
    if (record.ocr.hardFindingCount !== 0) errors.push("ocr.hardFindingCount must be zero");
    if (!Array.isArray(record.ocr.hardFindings) || record.ocr.hardFindings.length !== 0) errors.push("ocr.hardFindings must be empty");
    if (!Array.isArray(record.ocr.reviewFindings)) errors.push("ocr.reviewFindings must be an array");
    if (!Number.isInteger(record.ocr.reviewFindingCount) || record.ocr.reviewFindingCount !== record.ocr.reviewFindings?.length) {
      errors.push("ocr.reviewFindingCount must match ocr.reviewFindings");
    }
    for (const finding of record.ocr.reviewFindings ?? []) {
      if (!isPlainObject(finding) || finding.severity !== "review" || !SHA256_PATTERN.test(finding.matchSha256 ?? "")) {
        errors.push("ocr.reviewFindings must contain redacted review findings");
        break;
      }
      requireExactKeys(errors, finding, "ocr.reviewFindings[]", [
        "id",
        "label",
        "severity",
        "mode",
        "line",
        "column",
        "matchSha256",
      ]);
      if (typeof finding.id !== "string" || finding.id.length === 0 || typeof finding.label !== "string" || finding.label.length === 0) {
        errors.push("ocr review findings must identify the matched review rule");
        break;
      }
      if (![6, 11].includes(finding.mode) || !Number.isInteger(finding.line) || finding.line <= 0 || !Number.isInteger(finding.column) || finding.column <= 0) {
        errors.push("ocr review findings must bind an OCR mode and location");
        break;
      }
      if ("match" in finding || "text" in finding || "preview" in finding) {
        errors.push("ocr findings must not store recognized text");
        break;
      }
    }
  }

  if (!isPlainObject(record.automatedChecks)) {
    errors.push("automatedChecks must be an object");
  } else {
    const automatedCheckKeys = ["fullDecode", "containerIntegrity", "metadataAndFeatures", "filesystemAttributePolicy", "hardPrivacyPatterns"];
    requireExactKeys(errors, record.automatedChecks, "automatedChecks", automatedCheckKeys);
    for (const check of automatedCheckKeys) {
      if (record.automatedChecks[check] !== "passed") errors.push(`automatedChecks.${check} must be passed`);
    }
  }

  if (!isPlainObject(record.privacyReview)) {
    errors.push("privacyReview must be an object");
  } else {
    requireExactKeys(errors, record.privacyReview, "privacyReview", [
      "status",
      "reviewer",
      "reviewedAt",
      "automatedChecksDoNotConstituteApproval",
      "checklistVersion",
      "checklist",
    ]);
    if (!["pending", "approved", "rejected"].includes(record.privacyReview.status)) {
      errors.push("privacyReview.status is invalid");
    }
    if (requirePending && record.privacyReview.status !== "pending") {
      errors.push("privacyReview.status must be pending for a newly prepared draft");
    }
    if (record.privacyReview.automatedChecksDoNotConstituteApproval !== true) {
      errors.push("privacyReview must state that automated checks do not constitute approval");
    }
    if (record.privacyReview.checklistVersion !== CODEX_MEDIA_PRIVACY_CHECKLIST_VERSION) {
      errors.push(`privacyReview.checklistVersion must be ${CODEX_MEDIA_PRIVACY_CHECKLIST_VERSION}`);
    }
    if (!isPlainObject(record.privacyReview.checklist)) {
      errors.push("privacyReview.checklist must be an object");
    } else {
      requireExactKeys(errors, record.privacyReview.checklist, "privacyReview.checklist", CODEX_MEDIA_CHECKLIST);
      for (const item of CODEX_MEDIA_CHECKLIST) {
        const value = record.privacyReview.checklist[item];
        if (record.privacyReview.status === "pending" && value !== "pending") {
          errors.push(`privacyReview.checklist.${item} must remain pending`);
        }
        if (record.privacyReview.status === "approved" && value !== true) {
          errors.push(`privacyReview.checklist.${item} must be true for approval`);
        }
        if (record.privacyReview.status === "rejected" && value !== false && value !== true) {
          errors.push(`privacyReview.checklist.${item} must be boolean after rejection`);
        }
      }
    }
    if (record.privacyReview.status === "pending") {
      if (record.privacyReview.reviewer !== null || record.privacyReview.reviewedAt !== null) {
        errors.push("pending privacy review must not name a reviewer or review time");
      }
    } else {
      requireHumanReviewerId(errors, record.privacyReview.reviewer, "privacyReview.reviewer");
      requireNonFutureIsoTimestamp(errors, record.privacyReview.reviewedAt, "privacyReview.reviewedAt");
    }
  }

  return { ok: errors.length === 0, errors };
}
