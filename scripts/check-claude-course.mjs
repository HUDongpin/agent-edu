#!/usr/bin/env node

/**
 * Deterministic, offline quality and release gate for Course 3: How to Use Claude.
 *
 * Run with the checked-in TypeScript loader:
 *   node --import tsx scripts/check-claude-course.mjs
 *   node --import tsx scripts/check-claude-course.mjs --release
 *   node --import tsx scripts/check-claude-course.mjs --json
 *
 * Development mode reports unresolved publication rights as warnings so the
 * course can be reviewed locally. Release mode fails closed until the Academy
 * image permission records are replaced with publication-cleared evidence.
 */

import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  readFileSync,
} from "node:fs";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { CLAUDE_FIGURES } from "../lib/claude/figures.ts";
import { CLAUDE_COURSE_MANIFEST } from "../lib/claude/manifest.ts";
import {
  CLAUDE_ACADEMY_CATALOG,
  CLAUDE_SOURCES,
} from "../lib/claude/sources.ts";
import { CLAUDE_LOCALES } from "../lib/claude/types.ts";
import {
  isClaudeFigureAuthenticityReleaseReady,
  validateClaudeCopy,
  validateClaudeFigureAuthenticityCurrentness,
  validateClaudeFigurePermissionCurrentness,
  validateClaudeManifests,
} from "../lib/claude/validate.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_ROOT = resolve(ROOT, "public");
const RELEASE = process.argv.includes("--release");
const JSON_OUTPUT = process.argv.includes("--json");
const SOURCE_FRESHNESS_TIME_ZONE = "Asia/Taipei";

const REQUIRED_FILES = [
  "app/[locale]/claude/page.tsx",
  "app/[locale]/claude/[lesson]/page.tsx",
  "components/claude/CapstonePortfolio.tsx",
  "components/claude/CompletionSummary.tsx",
  "components/claude/CourseDashboard.tsx",
  "components/claude/CourseFigure.tsx",
  "components/claude/CourseProgress.tsx",
  "components/claude/FinalQuiz.tsx",
  "components/claude/LessonCompletion.tsx",
  "components/claude/LessonView.tsx",
  "components/claude/progress-store.ts",
  "components/claude/useCourseProgress.ts",
  "components/claude/ClaudeCourse.module.css",
  "lib/claude/capstone.ts",
  "lib/claude/figures.ts",
  "lib/claude/index.ts",
  "lib/claude/load.ts",
  "lib/claude/manifest.ts",
  "lib/claude/practices.ts",
  "lib/claude/progress.ts",
  "lib/claude/quiz.ts",
  "lib/claude/seo.ts",
  "lib/claude/sources.ts",
  "lib/claude/types.ts",
  "lib/claude/validate.ts",
  "outputs/claude-course-research-brief.md",
  "outputs/claude-course-research-brief.provenance.md",
  "outputs/claude-figure-rights-clearance.md",
  "public/courses/claude/NOTICE.md",
  "public/courses/claude/claude-capstone-brief.md",
  "public/courses/claude/licenses/CLAUDEBLATTMAN-MIT.txt",
  "public/courses/claude/licenses/CLAUDE-COOKBOOKS-MIT.txt",
  "public/courses/claude/licenses/CLAUDE-PLUGINS-OFFICIAL-APACHE-2.0.txt",
  "tests/claude-course.spec.ts",
];

const REQUIRED_THIRD_PARTY_LICENSES = [
  {
    path: "public/courses/claude/licenses/CLAUDEBLATTMAN-MIT.txt",
    noticeLink: "licenses/CLAUDEBLATTMAN-MIT.txt",
    requiredSnippets: [
      "MIT License",
      "Copyright (c) 2026 Chris Blattman",
      "Permission is hereby granted, free of charge",
    ],
  },
  {
    path: "public/courses/claude/licenses/CLAUDE-COOKBOOKS-MIT.txt",
    noticeLink: "licenses/CLAUDE-COOKBOOKS-MIT.txt",
    requiredSnippets: [
      "MIT License",
      "Copyright (c) 2023 Anthropic",
      "Permission is hereby granted, free of charge",
    ],
  },
  {
    path: "public/courses/claude/licenses/CLAUDE-PLUGINS-OFFICIAL-APACHE-2.0.txt",
    noticeLink: "licenses/CLAUDE-PLUGINS-OFFICIAL-APACHE-2.0.txt",
    requiredSnippets: [
      "Apache License",
      "Version 2.0, January 2004",
      "Grant of Copyright License",
      "END OF TERMS AND CONDITIONS",
    ],
  },
];

const errors = [];
const warnings = [];
const notes = [];
const fail = (message) => errors.push(message);
const warn = (message) => warnings.push(message);
const note = (message) => notes.push(message);
const rel = (path) => relative(ROOT, path).split(sep).join("/");

function currentCalendarDate(timeZone) {
  const dateParts = Object.fromEntries(
    new Intl.DateTimeFormat("en", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date())
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );
  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
}

function readJson(path, label = rel(path)) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`${label}: invalid or missing JSON (${error.message})`);
    return null;
  }
}

function publicAssetPath(rootRelativePath, label) {
  if (typeof rootRelativePath !== "string"
    || !rootRelativePath.startsWith("/")
    || rootRelativePath.startsWith("//")) {
    fail(`${label}: asset path must be root-relative`);
    return null;
  }

  const absolute = resolve(PUBLIC_ROOT, `.${rootRelativePath}`);
  if (absolute !== PUBLIC_ROOT && !absolute.startsWith(`${PUBLIC_ROOT}${sep}`)) {
    fail(`${label}: asset path escapes public/`);
    return null;
  }
  return absolute;
}

function requireRegularFile(path, label = rel(path)) {
  if (!existsSync(path)) {
    fail(`${label}: required file is missing`);
    return false;
  }
  const stat = lstatSync(path);
  if (stat.isSymbolicLink()) {
    fail(`${label}: symbolic links are not accepted by the offline release gate`);
    return false;
  }
  if (!stat.isFile()) {
    fail(`${label}: expected a regular file`);
    return false;
  }
  return true;
}

function pngDimensions(buffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(signature)) return null;
  if (buffer.toString("ascii", 12, 16) !== "IHDR") return null;
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

const PNG_CRC_TABLE = Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = (crc & 1) ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

function pngCrc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = PNG_CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunkTypes(buffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (buffer.length < 20 || !buffer.subarray(0, 8).equals(signature)) return null;
  const chunks = [];
  let offset = 8;
  while (offset + 12 <= buffer.length) {
    const size = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const next = offset + 12 + size;
    if (!/^[A-Za-z]{4}$/.test(type) || next > buffer.length) return null;
    const recordedCrc = buffer.readUInt32BE(offset + 8 + size);
    const calculatedCrc = pngCrc32(buffer.subarray(offset + 4, offset + 8 + size));
    if (recordedCrc !== calculatedCrc) return null;
    chunks.push(type);
    offset = next;
    if (type === "IEND") {
      return size === 0 && offset === buffer.length ? chunks : null;
    }
  }
  return null;
}

function webpDimensions(buffer) {
  if (buffer.length < 20
    || buffer.toString("ascii", 0, 4) !== "RIFF"
    || buffer.toString("ascii", 8, 12) !== "WEBP"
    || buffer.readUInt32LE(4) + 8 !== buffer.length) {
    return null;
  }

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunk = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const data = offset + 8;
    if (data + size > buffer.length) return null;

    if (chunk === "VP8X" && size >= 10) {
      return {
        width: 1 + buffer.readUIntLE(data + 4, 3),
        height: 1 + buffer.readUIntLE(data + 7, 3),
      };
    }
    if (chunk === "VP8 " && size >= 10
      && buffer[data + 3] === 0x9d
      && buffer[data + 4] === 0x01
      && buffer[data + 5] === 0x2a) {
      return {
        width: buffer.readUInt16LE(data + 6) & 0x3fff,
        height: buffer.readUInt16LE(data + 8) & 0x3fff,
      };
    }
    if (chunk === "VP8L" && size >= 5 && buffer[data] === 0x2f) {
      const bits = buffer.readUInt32LE(data + 1);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >>> 14) & 0x3fff) + 1,
      };
    }

    offset = data + size + (size % 2);
  }
  return null;
}

function webpChunkTypes(buffer) {
  if (buffer.length < 12
    || buffer.toString("ascii", 0, 4) !== "RIFF"
    || buffer.toString("ascii", 8, 12) !== "WEBP"
    || buffer.readUInt32LE(4) + 8 !== buffer.length) {
    return null;
  }
  const chunks = [];
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const type = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const next = offset + 8 + size + (size % 2);
    if (next > buffer.length) return null;
    chunks.push(type);
    offset = next;
  }
  return offset === buffer.length ? chunks : null;
}

function checkPng(path, figure) {
  if (!requireRegularFile(path)) return;
  const bytes = readFileSync(path);
  const dimensions = pngDimensions(bytes);
  if (!dimensions) {
    fail(`${rel(path)}: master figure is not a valid PNG`);
    return;
  }
  const chunks = pngChunkTypes(bytes);
  if (!chunks) {
    fail(`${rel(path)}: PNG chunk structure is invalid`);
  } else {
    const unsupportedChunks = chunks.filter((type) => !["IHDR", "IDAT", "IEND"].includes(type));
    if (unsupportedChunks.length
      || chunks[0] !== "IHDR"
      || chunks.at(-1) !== "IEND"
      || !chunks.includes("IDAT")) {
      fail(`${rel(path)}: metadata-free PNG masters may contain only IHDR, IDAT, and IEND chunks (${unsupportedChunks.join(", ") || "invalid order"})`);
    }
  }
  if (dimensions.width !== figure.width || dimensions.height !== figure.height) {
    fail(
      `${rel(path)}: PNG dimensions ${dimensions.width}x${dimensions.height} `
      + `do not match manifest ${figure.width}x${figure.height}`,
    );
  }
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (sha256 !== figure.sha256) {
    fail(`${rel(path)}: SHA-256 ${sha256} does not match manifest ${figure.sha256}`);
  }
}

function checkWebp(path, expectedWidth, expectedSha256, masterWidth, masterHeight) {
  if (!requireRegularFile(path)) return;
  const bytes = readFileSync(path);
  const dimensions = webpDimensions(bytes);
  if (!dimensions) {
    fail(`${rel(path)}: responsive derivative is not a readable WebP image`);
    return;
  }
  const chunks = webpChunkTypes(bytes);
  if (!chunks) {
    fail(`${rel(path)}: WebP chunk structure is invalid`);
  } else {
    const sensitiveMetadata = chunks.filter((type) => type === "EXIF" || type === "XMP ");
    if (sensitiveMetadata.length) {
      fail(`${rel(path)}: remove embedded EXIF or XMP metadata chunks (${sensitiveMetadata.join(", ")})`);
    }
  }
  if (dimensions.width !== expectedWidth) {
    fail(`${rel(path)}: WebP width ${dimensions.width} does not match manifest ${expectedWidth}`);
  }
  const expectedHeight = Math.ceil((masterHeight * expectedWidth) / masterWidth);
  if (dimensions.height !== expectedHeight) {
    fail(`${rel(path)}: WebP height ${dimensions.height} does not preserve the manifest aspect ratio (${expectedHeight} expected)`);
  }
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (sha256 !== expectedSha256) {
    fail(`${rel(path)}: SHA-256 ${sha256} does not match manifest ${expectedSha256}`);
  }
}

function checkFigureAssets() {
  const allPaths = new Set();
  for (const figure of CLAUDE_FIGURES) {
    if (figure.status !== "available") {
      const message = `${figure.id}: real-interface figure is still capture-required`;
      if (RELEASE) fail(message);
      else warn(message);
      continue;
    }

    const master = publicAssetPath(figure.src, `${figure.id}.src`);
    const large = publicAssetPath(figure.srcSet.webpLarge, `${figure.id}.srcSet.webpLarge`);
    const small = publicAssetPath(figure.srcSet.webpSmall, `${figure.id}.srcSet.webpSmall`);
    const candidates = [master, large, small].filter(Boolean);
    if (figure.srcSet.mobile) {
      candidates.push(publicAssetPath(figure.srcSet.mobile, `${figure.id}.srcSet.mobile`));
    }
    for (const candidate of candidates.filter(Boolean)) {
      const key = rel(candidate);
      if (allPaths.has(key)) fail(`${figure.id}: duplicate figure asset path ${key}`);
      allPaths.add(key);
    }

    if (master) {
      if (extname(master).toLowerCase() !== ".png") {
        fail(`${rel(master)}: master figure must be PNG`);
      }
      checkPng(master, figure);
    }
    if (large) {
      if (extname(large).toLowerCase() !== ".webp") {
        fail(`${rel(large)}: large responsive derivative must be WebP`);
      }
      checkWebp(large, figure.srcSet.largeWidth, figure.srcSet.largeSha256, figure.width, figure.height);
    }
    if (small) {
      if (extname(small).toLowerCase() !== ".webp") {
        fail(`${rel(small)}: small responsive derivative must be WebP`);
      }
      checkWebp(small, figure.srcSet.smallWidth, figure.srcSet.smallSha256, figure.width, figure.height);
    }
    if (figure.srcSet.mobile) {
      const mobile = publicAssetPath(figure.srcSet.mobile, `${figure.id}.srcSet.mobile`);
      if (mobile) {
        if (extname(mobile).toLowerCase() !== ".webp") {
          fail(`${rel(mobile)}: mobile responsive derivative must be WebP`);
        }
        checkWebp(mobile, figure.srcSet.mobileWidth, figure.srcSet.mobileSha256, figure.width, figure.height);
      }
    }
  }

  const pendingPermission = CLAUDE_FIGURES.filter(
    (figure) => figure.status === "available" && figure.rightsStatus === "permission-required",
  );
  if (pendingPermission.length) {
    const ids = pendingPermission.map((figure) => figure.id).join(", ");
    const message = `${pendingPermission.length} Academy-hosted figures still require publication permission: ${ids}`;
    if (RELEASE) fail(message);
    else warn(message);
  }

  const authenticityBlocked = CLAUDE_FIGURES.filter(
    (figure) => figure.status === "available"
      && !isClaudeFigureAuthenticityReleaseReady(figure),
  );
  if (authenticityBlocked.length) {
    const ids = authenticityBlocked.map((figure) => figure.id).join(", ");
    const message = `CLAUDE-FIG-01-PROVENANCE-UNVERIFIED: ${authenticityBlocked.length} figure has unresolved source-to-local authenticity provenance: ${ids}`;
    if (RELEASE) fail(message);
    else warn(message);
  }

  const authenticityReviewed = CLAUDE_FIGURES.filter(
    (figure) => figure.status === "available"
      && figure.provenance !== "licensed-community"
      && isClaudeFigureAuthenticityReleaseReady(figure),
  );
  if (authenticityReviewed.length) {
    note(`${authenticityReviewed.length} first-party figures have source-asset hashes and reviewed transformation records; this authenticates provenance but does not grant republication rights`);
    const today = currentCalendarDate(SOURCE_FRESHNESS_TIME_ZONE);
    const currentnessIssues = authenticityReviewed.flatMap((figure) => (
      validateClaudeFigureAuthenticityCurrentness(figure, today)
        .map((message) => `${figure.id}: ${message}`)
    ));
    if (currentnessIssues.length) {
      const message = `Reviewed authenticity evidence is not current as of ${today} (${SOURCE_FRESHNESS_TIME_ZONE}): ${currentnessIssues.join("; ")}`;
      if (RELEASE) fail(message);
      else warn(message);
    }
  }

  const repositoryFigures = CLAUDE_FIGURES.filter(
    (figure) => figure.status === "available"
      && figure.rightsStatus === "repository-licence-reviewed",
  );
  if (repositoryFigures.length) {
    note(
      `${repositoryFigures.length} repository figures have recorded source licences; `
      + "their UI/trademark caveat remains disclosed in NOTICE.md",
    );
  }

  const writtenPermissionFigures = CLAUDE_FIGURES.filter(
    (figure) => figure.status === "available"
      && figure.rightsStatus === "written-permission-reviewed",
  );
  if (writtenPermissionFigures.length) {
    const today = currentCalendarDate(SOURCE_FRESHNESS_TIME_ZONE);
    const currentnessIssues = writtenPermissionFigures.flatMap((figure) => (
      validateClaudeFigurePermissionCurrentness(figure, today)
        .map((message) => `${figure.id}: ${message}`)
    ));
    if (currentnessIssues.length) {
      const message = `Reviewed written permission is not current as of ${today} (${SOURCE_FRESHNESS_TIME_ZONE}): ${currentnessIssues.join("; ")}`;
      if (RELEASE) fail(message);
      else warn(message);
    } else {
      note(`${writtenPermissionFigures.length} first-party figures have current reviewed written-permission records as of ${today} (${SOURCE_FRESHNESS_TIME_ZONE})`);
    }
  }
}

function checkCatalogueFreshness() {
  const staleAfter = Date.parse(CLAUDE_ACADEMY_CATALOG.staleAfter);
  const now = Date.now();
  if (!Number.isFinite(staleAfter)) {
    fail("Academy catalogue stale-after timestamp is invalid");
    return;
  }
  if (now >= staleAfter) {
    const message = `Academy catalogue snapshot expired at ${CLAUDE_ACADEMY_CATALOG.staleAfter}; refresh and re-audit exact resource URLs`;
    if (RELEASE) fail(message);
    else warn(message);
  } else {
    note(`Academy catalogue snapshot is fresh until ${CLAUDE_ACADEMY_CATALOG.staleAfter}`);
  }
}

function checkOfficialSourceFreshness() {
  if (!RELEASE) return;

  const today = currentCalendarDate(SOURCE_FRESHNESS_TIME_ZONE);
  const todayUtc = Date.parse(`${today}T00:00:00Z`);
  const assessments = CLAUDE_SOURCES
    .filter((source) => source.kind === "official-doc")
    .map((source) => {
      const verifiedDate = source.verifiedAt.slice(0, 10);
      const verifiedUtc = Date.parse(`${verifiedDate}T00:00:00Z`);
      return {
        id: source.id,
        verifiedDate,
        ageDays: Math.floor((todayUtc - verifiedUtc) / 86_400_000),
      };
    });
  const outsideWindow = assessments.filter(
    ({ ageDays }) => !Number.isFinite(ageDays) || ageDays < 0 || ageDays > 30,
  );

  if (outsideWindow.length) {
    fail(
      `Official product-source verification must be 0–30 days old as of ${today} (${SOURCE_FRESHNESS_TIME_ZONE}): `
      + outsideWindow.map(({ id, verifiedDate, ageDays }) => (
        `${id} verified ${verifiedDate} (${Number.isFinite(ageDays) ? `${ageDays} days` : "invalid age"})`
      )).join("; "),
    );
    return;
  }

  note(`${assessments.length} official-doc records are within the 30-day release window as of ${today} (${SOURCE_FRESHNESS_TIME_ZONE})`);
}

function checkLocalImageUse() {
  const files = [
    "app/[locale]/claude/page.tsx",
    "app/[locale]/claude/[lesson]/page.tsx",
    "components/claude/CourseFigure.tsx",
    "components/claude/LessonView.tsx",
  ];
  for (const relativePath of files) {
    const path = resolve(ROOT, relativePath);
    if (!existsSync(path)) continue;
    const source = readFileSync(path, "utf8");
    if (/\bsrc\s*=\s*["']https?:\/\//i.test(source)) {
      fail(`${relativePath}: remote image URLs are prohibited; course media must be local and auditable`);
    }
  }
}

function checkThirdPartyLicenses() {
  const noticePath = resolve(ROOT, "public/courses/claude/NOTICE.md");
  if (!requireRegularFile(noticePath)) return;
  const notice = readFileSync(noticePath, "utf8");

  for (const record of REQUIRED_THIRD_PARTY_LICENSES) {
    const path = resolve(ROOT, record.path);
    if (!requireRegularFile(path, record.path)) continue;
    const text = readFileSync(path, "utf8");
    if (record.requiredSnippets.some((snippet) => !text.includes(snippet))) {
      fail(`${record.path}: required pinned-source licence notice is incomplete`);
    }
    if (!notice.includes(record.noticeLink)) {
      fail(`public/courses/claude/NOTICE.md: missing link to ${record.noticeLink}`);
    }
  }

  const figureEleven = CLAUDE_FIGURES.find((figure) => figure.id === "fig-11");
  if (!figureEleven
    || figureEleven.status !== "available"
    || figureEleven.provenance !== "licensed-community"
    || figureEleven.rightsStatus !== "repository-licence-reviewed"
    || figureEleven.thirdPartyLicense !== "Apache-2.0"
    || figureEleven.sourceCommit !== "340e33aef211d95769d252324854497af871dafe"
    || figureEleven.sourceSha256 !== "a0b12357a8d8f9b1ba16692805344b8c4d03af2cc2eefcb70c68431b4350d1ad"
    || !figureEleven.sourceUrl.includes("anthropics/claude-plugins-official/blob/340e33aef")) {
    fail("fig-11: official Apache-2.0 Claude Code replacement must remain bound to its reviewed pinned source");
  }
}

function flattenStrings(value, path = "$", output = new Map()) {
  if (typeof value === "string") {
    output.set(path, value);
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => flattenStrings(item, `${path}[${index}]`, output));
  } else if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => flattenStrings(item, `${path}.${key}`, output));
  }
  return output;
}

async function checkCopy() {
  const copies = new Map();
  for (const locale of CLAUDE_LOCALES) {
    const path = resolve(ROOT, "messages", "claude", `${locale}.json`);
    const copy = readJson(path);
    if (copy) copies.set(locale, copy);
  }

  const english = copies.get("en");
  if (!english) return;
  const englishStrings = flattenStrings(english);
  for (const locale of CLAUDE_LOCALES) {
    const copy = copies.get(locale);
    if (!copy) continue;
    const issues = validateClaudeCopy(locale, copy, locale === "en" ? undefined : english);
    issues.forEach((issue) => fail(`[${issue.locale}] ${issue.path}: ${issue.message}`));
    if (locale === "en") continue;

    if (copy?.meta?.title === english?.meta?.title) {
      fail(`[${locale}] $.meta.title: localized course title is still identical to English`);
    }
    const localizedStrings = flattenStrings(copy);
    const unchangedLongStrings = [...englishStrings.entries()].filter(([path, value]) => (
      value.length >= 48 && localizedStrings.get(path) === value
    ));
    if (unchangedLongStrings.length) {
      fail(
        `[${locale}] ${unchangedLongStrings.length} long strings remain identical to English; `
        + `first paths: ${unchangedLongStrings.slice(0, 5).map(([path]) => path).join(", ")}`,
      );
    }
  }
}

async function main() {
  REQUIRED_FILES.forEach((relativePath) => {
    requireRegularFile(resolve(ROOT, relativePath), relativePath);
  });

  validateClaudeManifests().forEach((issue) => {
    fail(`[${issue.locale}] ${issue.path}: ${issue.message}`);
  });
  await checkCopy();
  checkFigureAssets();
  checkCatalogueFreshness();
  checkOfficialSourceFreshness();
  checkLocalImageUse();
  checkThirdPartyLicenses();

  const mode = RELEASE ? "release" : "development";
  const status = errors.length ? "FAIL" : warnings.length ? "WARN" : "PASS";
  const summary = {
    courseId: CLAUDE_COURSE_MANIFEST.id,
    mode,
    status,
    counts: {
      units: CLAUDE_COURSE_MANIFEST.units.length,
      lessons: CLAUDE_COURSE_MANIFEST.lessons.length,
      figures: CLAUDE_FIGURES.length,
      localesFound: CLAUDE_LOCALES.filter((locale) => existsSync(
        resolve(ROOT, "messages", "claude", `${locale}.json`),
      )).length,
    },
    errors,
    warnings,
    notes,
  };

  if (JSON_OUTPUT) {
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  } else {
    process.stdout.write(`Claude course check: ${status} (${mode})\n`);
    for (const message of errors) process.stdout.write(`ERROR ${message}\n`);
    for (const message of warnings) process.stdout.write(`WARN  ${message}\n`);
    for (const message of notes) process.stdout.write(`NOTE  ${message}\n`);
    process.stdout.write(
      `Checked ${summary.counts.lessons} lessons, ${summary.counts.figures} figures, `
      + `${summary.counts.localesFound}/${CLAUDE_LOCALES.length} locales.\n`,
    );
  }

  if (errors.length) process.exitCode = 1;
}

await main();
