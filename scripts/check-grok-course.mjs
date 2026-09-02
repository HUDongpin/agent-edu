#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { publishedReleaseIntegrationErrors } from "./lib/published-release-contract.mjs";

const ROOT = process.cwd();
const release = process.argv.includes("--release");
const errors = [];
const warnings = [];
const notes = [];

const LOCALES = ["en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar"];
const EXPECTED_LESSONS = 14;
const EXPECTED_UNITS = 4;
const EXPECTED_FIGURES = 10;
const EXPECTED_MINUTES = 695;
const SHARED_COPY = {
  en: {
    "cat.course5": "Course 5",
    "c.grok.title": "How to Use Grok",
    "c.grok.blurb": "Master Grok through real interfaces, evidence-led workflows, practical studios and human-verifiable results.",
    "c.grok.level": "Beginner to advanced",
    "c.grok.meta": "14 lessons, 11 hours 35 minutes, 10 authentic UI figures",
  },
  es: {
    "cat.course5": "Curso 5",
    "c.grok.title": "Cómo usar Grok",
    "c.grok.blurb": "Domine Grok mediante interfaces reales, flujos de trabajo guiados por la evidencia, talleres prácticos y resultados que una persona pueda verificar.",
    "c.grok.level": "De principiante a avanzado",
    "c.grok.meta": "14 lecciones, 11 horas y 35 minutos, 10 figuras auténticas de interfaces de usuario",
  },
  fr: {
    "cat.course5": "Cours 5",
    "c.grok.title": "Comment utiliser Grok",
    "c.grok.blurb": "Maîtrisez Grok à l'aide d'interfaces réelles, de flux de travail guidés par les preuves, d'ateliers pratiques et de résultats vérifiables par une personne.",
    "c.grok.level": "Débutant à avancé",
    "c.grok.meta": "14 leçons, 11 h 35 et 10 figures authentiques d'interfaces utilisateur",
  },
  de: {
    "cat.course5": "Kurs 5",
    "c.grok.title": "So verwenden Sie Grok",
    "c.grok.blurb": "Grok anhand echter Benutzeroberflächen, evidenzbasierter Arbeitsabläufe, praktischer Übungen und von Menschen überprüfbarer Ergebnisse souverän nutzen.",
    "c.grok.level": "Anfänger bis Fortgeschritten",
    "c.grok.meta": "14 Lektionen, 11 Stunden 35 Minuten, 10 authentische UI-Abbildungen",
  },
  "zh-Hans": {
    "cat.course5": "课程五",
    "c.grok.title": "如何使用 Grok",
    "c.grok.blurb": "通过真实界面、证据驱动的工作流、实战练习与可由人核验的成果，掌握 Grok。",
    "c.grok.level": "入门到高级",
    "c.grok.meta": "14 节课，11 小时 35 分钟，10 张真实 UI 图",
  },
  "zh-Hant": {
    "cat.course5": "課程五",
    "c.grok.title": "如何使用 Grok",
    "c.grok.blurb": "透過真實介面、證據驅動的工作流程、實戰練習與可由人查核的成果，掌握 Grok。",
    "c.grok.level": "入門到進階",
    "c.grok.meta": "14 節課，11 小時 35 分鐘，10 張真實 UI 圖",
  },
  ja: {
    "cat.course5": "コース5",
    "c.grok.title": "Grok の使い方",
    "c.grok.blurb": "実際の画面、証拠に基づくワークフロー、実践演習、人が検証できる成果を通して Grok を使いこなします。",
    "c.grok.level": "初級から上級",
    "c.grok.meta": "14講、11時間35分、実際の UI 図10点",
  },
  ko: {
    "cat.course5": "코스 5",
    "c.grok.title": "Grok 사용법",
    "c.grok.blurb": "실제 화면, 증거 중심 워크플로, 실습 스튜디오 및 사람이 검증할 수 있는 결과를 통해 Grok을 능숙하게 사용합니다.",
    "c.grok.level": "초급부터 고급",
    "c.grok.meta": "14개 수업, 11시간 35분, 실제 UI 이미지 10개",
  },
  ar: {
    "cat.course5": "الدورة الخامسة",
    "c.grok.title": "كيفية استخدام Grok",
    "c.grok.blurb": "أتقن Grok عبر واجهات حقيقية، ومسارات عمل قائمة على الأدلة، وتطبيقات عملية، ونتائج يمكن للإنسان التحقق منها.",
    "c.grok.level": "من مبتدئ إلى متقدم",
    "c.grok.meta": "١٤ درسًا، ١١ ساعة و٣٥ دقيقة، و١٠ صور أصلية لواجهة المستخدم",
  },
};

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function readJson(relativePath) {
  const absolute = resolve(ROOT, relativePath);
  if (!existsSync(absolute)) {
    fail(`Missing ${relativePath}`);
    return null;
  }
  try {
    return JSON.parse(readFileSync(absolute, "utf8"));
  } catch (error) {
    fail(`Invalid JSON in ${relativePath}: ${error.message}`);
    return null;
  }
}

function sha256(relativePath) {
  return createHash("sha256").update(readFileSync(resolve(ROOT, relativePath))).digest("hex");
}

function publicRelative(src) {
  return `public${src}`;
}

function pngDimensions(buffer) {
  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a" || buffer.subarray(12, 16).toString("ascii") !== "IHDR") {
    throw new Error("not a PNG with an IHDR header");
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function pngChunkTypes(buffer) {
  const types = [];
  let offset = 8;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    types.push(type);
    offset += 12 + length;
    if (type === "IEND") break;
  }
  return types;
}

function webpDimensions(buffer) {
  if (buffer.subarray(0, 4).toString("ascii") !== "RIFF"
    || buffer.subarray(8, 12).toString("ascii") !== "WEBP") {
    throw new Error("not a RIFF WebP file");
  }
  const kind = buffer.subarray(12, 16).toString("ascii");
  if (kind === "VP8X") {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
    };
  }
  if (kind === "VP8L") {
    if (buffer[20] !== 0x2f) throw new Error("invalid VP8L signature");
    const bits = buffer.readUInt32LE(21);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >>> 14) & 0x3fff) + 1,
    };
  }
  if (kind === "VP8 ") {
    if (buffer[23] !== 0x9d || buffer[24] !== 0x01 || buffer[25] !== 0x2a) {
      throw new Error("invalid VP8 frame signature");
    }
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }
  throw new Error(`unsupported WebP chunk ${kind}`);
}

function webpChunkTypes(buffer) {
  const types = [];
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const type = buffer.subarray(offset, offset + 4).toString("ascii");
    const length = buffer.readUInt32LE(offset + 4);
    types.push(type);
    offset += 8 + length + (length % 2);
  }
  return types;
}

function allLeaves(value, path = "", output = new Map()) {
  if (Array.isArray(value)) {
    output.set(`${path}.__length`, value.length);
    value.forEach((item, index) => allLeaves(item, `${path}[${index}]`, output));
    return output;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      allLeaves(item, path ? `${path}.${key}` : key, output);
    }
    return output;
  }
  output.set(path, typeof value);
  return output;
}

function assertSameShape(reference, candidate, locale) {
  const expected = allLeaves(reference);
  const actual = allLeaves(candidate);
  for (const [key, type] of expected) {
    if (!actual.has(key)) fail(`${locale}: missing copy path ${key}`);
    else if (actual.get(key) !== type) fail(`${locale}: ${key} has ${actual.get(key)}, expected ${type}`);
  }
  for (const key of actual.keys()) {
    if (!expected.has(key)) fail(`${locale}: unexpected copy path ${key}`);
  }
}

function collectStrings(value, output = []) {
  if (typeof value === "string") output.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, output));
  else if (value && typeof value === "object") Object.values(value).forEach((item) => collectStrings(item, output));
  return output;
}

function stringLeaves(value, path = "", output = new Map()) {
  if (typeof value === "string") {
    output.set(path, value);
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => stringLeaves(item, `${path}[${index}]`, output));
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      stringLeaves(item, path ? `${path}.${key}` : key, output);
    }
  }
  return output;
}

function nonStringLeaves(value, path = "", output = new Map()) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => nonStringLeaves(item, `${path}[${index}]`, output));
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      nonStringLeaves(item, path ? `${path}.${key}` : key, output);
    }
  } else if (typeof value !== "string") {
    output.set(path, value);
  }
  return output;
}

function matches(value, pattern) {
  return [...value.matchAll(pattern)].map((match) => match[0]);
}

const PROTECTED_TOKEN_PATTERN = /aicourse\.top|grok\.com|grok\.me|~\/\.grok\/|\/privacy|\/settings|xAI|GitHub|Grok 4\.6|Grok 4\.5|Grok 4|Grok Build|Grok Bot|Grok|SuperGrok|Imagine|OAuth|Excel|Word|PowerPoint|Outlook|Microsoft|Workspace|Sheets|Slides|Docs|Cursor|ACP|SGI-Bench|OpenMAIC|n8n|iOS|Android|always-approve|ZDR|SHA-256|DOCX|PDF|CSV|API/gu;
const PLACEHOLDER_PATTERN = /\[[^\]\n]+\]/gu;
const TEMPLATE_TOKEN_PATTERN = /\{[a-zA-Z][a-zA-Z0-9]*\}/gu;
const TARGET_SCRIPTS = {
  "zh-Hans": /\p{Script=Han}/gu,
  "zh-Hant": /\p{Script=Han}/gu,
  ja: /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu,
  ko: /\p{Script=Hangul}/gu,
  ar: /\p{Script=Arabic}/gu,
};

function asciiDigits(value) {
  return value.replace(/[\u0660-\u0669\u06F0-\u06F9\uFF10-\uFF19]/gu, (digit) => {
    const code = digit.codePointAt(0);
    if (code >= 0x0660 && code <= 0x0669) return String(code - 0x0660);
    if (code >= 0x06f0 && code <= 0x06f9) return String(code - 0x06f0);
    return String(code - 0xff10);
  });
}

function digitTokens(value) {
  return asciiDigits(value).match(/\d+/gu) ?? [];
}

function missingRequiredNumbers(reference, candidate) {
  const available = new Map();
  for (const token of digitTokens(candidate)) {
    available.set(token, (available.get(token) ?? 0) + 1);
  }
  const missing = [];
  for (const token of digitTokens(reference)) {
    const count = available.get(token) ?? 0;
    if (count < 1) missing.push(token);
    else available.set(token, count - 1);
  }
  return missing;
}

function isIsoCalendarDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

const manifest = readJson("lib/grok/course.manifest.json");
const sources = readJson("lib/grok/sources.json");
const figures = readJson("lib/grok/figures.json");
const english = readJson("messages/grok/en.json");

if (!manifest || !sources || !figures || !english) {
  console.error("Grok course check could not start because required data is missing.");
  process.exit(1);
}

if (manifest.id !== "how-to-use-grok") fail(`Unexpected course id: ${manifest.id}`);
if (manifest.units.length !== EXPECTED_UNITS) fail(`Expected ${EXPECTED_UNITS} units, found ${manifest.units.length}`);
if (manifest.lessons.length !== EXPECTED_LESSONS) fail(`Expected ${EXPECTED_LESSONS} lessons, found ${manifest.lessons.length}`);
if (manifest.minutes !== EXPECTED_MINUTES) fail(`Manifest minutes must be ${EXPECTED_MINUTES}, found ${manifest.minutes}`);
if (manifest.passingScore !== 12) fail(`Passing score must be 12, found ${manifest.passingScore}`);
if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) fail("Course version must use semver");
if (!/^\d{4}-\d{2}-\d{2}$/.test(manifest.verifiedOn)) fail("verifiedOn must be an ISO date");

if (release) {
  const approvals = readJson("lib/grok/release.approvals.json");
  if (approvals) {
    if (approvals.schemaVersion !== 1) fail("Release approvals must use schemaVersion 1");
    if (approvals.courseId !== "grok") fail("Release approvals must be scoped to course grok");
    if (approvals.sourceLocale !== "en") fail("Release approvals must declare English as the source locale");
    const reviewedOn = isIsoCalendarDate(approvals.reviewedOn)
      ? approvals.reviewedOn
      : null;
    const today = new Date().toISOString().slice(0, 10);
    if (!reviewedOn) {
      fail("Release approvals date must be a valid ISO calendar date");
    } else if (reviewedOn < manifest.verifiedOn) {
      fail("Release approvals date cannot predate the verified course snapshot");
    } else if (reviewedOn > today) {
      fail("Release approvals date cannot be in the future");
    }
    if (!approvals.reviewBoundary?.includes("not a native-speaker certification")) {
      fail("Release approvals must state the AI semantic-review boundary");
    }
    if (!approvals.reviewScope?.includes("23 changed Course 5 UI keys")
      || !approvals.reviewScope?.includes("all 9 locales")) {
      fail("Release approvals must bind the refreshed 23-key, 9-locale review scope");
    }
    const currentEnglishHash = sha256("messages/grok/en.json");
    if (approvals.englishSourceSha256 !== currentEnglishHash) {
      fail("Release approvals do not match the current English source bundle");
    }
    const approvedLocaleIds = Object.keys(approvals.locales ?? {}).sort();
    const expectedLocaleIds = [...LOCALES].sort();
    if (JSON.stringify(approvedLocaleIds) !== JSON.stringify(expectedLocaleIds)) {
      fail("Release approvals must contain exactly all nine course locales");
    }
    for (const locale of LOCALES) {
      const approval = approvals.locales?.[locale];
      if (!approval) continue;
      if (approval.status !== "approved") fail(`${locale}: release approval is not approved`);
      if (typeof approval.review !== "string" || approval.review.length < 30) {
        fail(`${locale}: release approval does not describe its review`);
      }
      const currentLocaleHash = sha256(`messages/grok/${locale}.json`);
      if (approval.sha256 !== currentLocaleHash) {
        fail(`${locale}: locale bundle changed after semantic approval`);
      }
    }
  }
}

const lessonIds = new Set();
const sourceIds = new Set(sources.map((source) => source.id));
const figureIds = new Set(figures.map((figure) => figure.id));
let computedMinutes = 0;

manifest.lessons.forEach((lesson, index) => {
  if (lessonIds.has(lesson.slug)) fail(`Duplicate lesson slug ${lesson.slug}`);
  lessonIds.add(lesson.slug);
  if (lesson.order !== index + 1) fail(`${lesson.slug}: expected order ${index + 1}, found ${lesson.order}`);
  if (!Number.isInteger(lesson.minutes) || lesson.minutes < 20) fail(`${lesson.slug}: invalid minutes ${lesson.minutes}`);
  computedMinutes += lesson.minutes;
  if (!english.lessons[lesson.slug]) fail(`${lesson.slug}: missing English lesson copy`);
  if (!english.quiz[lesson.quizId]) fail(`${lesson.slug}: missing quiz copy ${lesson.quizId}`);
  for (const prerequisite of lesson.prerequisites) {
    const prior = manifest.lessons.find((candidate) => candidate.slug === prerequisite);
    if (!prior) fail(`${lesson.slug}: unknown prerequisite ${prerequisite}`);
    else if (prior.order >= lesson.order) fail(`${lesson.slug}: prerequisite ${prerequisite} is not earlier`);
  }
  for (const sourceId of lesson.sourceIds) {
    if (!sourceIds.has(sourceId)) fail(`${lesson.slug}: unknown source ${sourceId}`);
  }
  for (const figureId of lesson.figureIds) {
    if (!figureIds.has(figureId)) fail(`${lesson.slug}: unknown figure ${figureId}`);
  }

  const copy = english.lessons[lesson.slug];
  if (copy) {
    if (copy.sections.length !== 3) fail(`${lesson.slug}: expected 3 teaching sections`);
    if (copy.practice.steps.length !== 3) fail(`${lesson.slug}: expected 3 guided steps`);
    if (copy.practice.proof.length < 2) fail(`${lesson.slug}: expected at least 2 proof items`);
    if (!copy.practice.prompt.trim()) fail(`${lesson.slug}: practice prompt is empty`);
    if (!copy.limit.trim()) fail(`${lesson.slug}: evidence limit is empty`);
  }
  const quiz = english.quiz[lesson.quizId];
  if (quiz) {
    if (quiz.options.length !== 4) fail(`${lesson.quizId}: expected 4 options`);
    if (!Number.isInteger(quiz.correctIndex) || quiz.correctIndex < 0 || quiz.correctIndex > 3) {
      fail(`${lesson.quizId}: correctIndex must be 0-3`);
    }
  }
});

if (computedMinutes !== manifest.minutes) fail(`Lesson minutes total ${computedMinutes}, manifest says ${manifest.minutes}`);

manifest.units.forEach((unit, index) => {
  if (unit.order !== index + 1) fail(`${unit.id}: invalid unit order`);
  if (!english.units[unit.id]) fail(`${unit.id}: missing English unit copy`);
  for (const slug of unit.lessonSlugs) {
    const lesson = manifest.lessons.find((candidate) => candidate.slug === slug);
    if (!lesson) fail(`${unit.id}: unknown lesson ${slug}`);
    else if (lesson.unitId !== unit.id) fail(`${slug}: unit mismatch between unit and lesson record`);
  }
});

const unitLessonList = manifest.units.flatMap((unit) => unit.lessonSlugs);
if (unitLessonList.length !== manifest.lessons.length
  || new Set(unitLessonList).size !== manifest.lessons.length) {
  fail("Every lesson must appear exactly once in the unit map");
}

const usedSources = new Set(manifest.lessons.flatMap((lesson) => lesson.sourceIds));
if (sourceIds.size !== sources.length) fail("Source ids must be unique");
for (const source of sources) {
  if (!/^https:\/\//.test(source.url)) fail(`${source.id}: source URL must use HTTPS`);
  if (source.verifiedOn !== manifest.verifiedOn) fail(`${source.id}: source verification date is stale or mismatched`);
  if (!source.boundary || source.boundary.length < 35) fail(`${source.id}: evidence boundary is too thin`);
  if (!Array.isArray(source.supports) || !source.supports.length) fail(`${source.id}: supports list is empty`);
  if (!usedSources.has(source.id)) warn(`${source.id}: source is registered but unused`);
  if (source.kind.includes("github")) {
    if (!/^[0-9a-f]{40}$/.test(source.commit ?? "")) fail(`${source.id}: GitHub source needs a 40-character commit`);
    if (!source.url.includes(source.commit ?? "missing")) fail(`${source.id}: URL is not pinned to its declared commit`);
    if (!source.license) fail(`${source.id}: GitHub source needs a licence field`);
  }
}

if (figures.length !== EXPECTED_FIGURES) fail(`Expected ${EXPECTED_FIGURES} figures, found ${figures.length}`);
if (new Set(figures.map((figure) => figure.sha256)).size !== figures.length) {
  fail("Every authentic figure must have a unique raw SHA-256 hash");
}
const expectedUses = new Map(figures.map((figure) => [figure.id, []]));
for (const lesson of manifest.lessons) {
  for (const figureId of lesson.figureIds) expectedUses.get(figureId)?.push(lesson.slug);
}

for (const figure of figures) {
  if (figure.status !== "available") fail(`${figure.id}: release requires status available`);
  if (!/^\/courses\/grok\/figures\//.test(figure.src)) fail(`${figure.id}: raw asset is outside Grok namespace`);
  if (!/^https:\/\//.test(figure.sourceUrl)) fail(`${figure.id}: source URL must use HTTPS`);
  if (figure.capturedOn !== manifest.verifiedOn || figure.verifiedOn !== manifest.verifiedOn) {
    fail(`${figure.id}: capture and verification dates must match the release snapshot`);
  }
  if (figure.privacyReview?.status !== "passed" || figure.privacyReview?.syntheticOrPublicDataOnly !== true) {
    fail(`${figure.id}: privacy review did not pass`);
  }
  if (figure.id === "fig-09"
    && (!figure.privacyReview.note.includes("public template portrait")
      || /no person\b/i.test(figure.privacyReview.note))) {
    fail("fig-09: privacy note must acknowledge the visible public template portrait");
  }
  if (!figure.rightsBasis || figure.rightsBasis.length < 50) fail(`${figure.id}: rights basis is missing or too thin`);
  if (!Array.isArray(figure.callouts) || figure.callouts.length < 2) fail(`${figure.id}: needs at least 2 teaching callouts`);

  const declaredUses = [...figure.usedBy].sort();
  const actualUses = [...(expectedUses.get(figure.id) ?? [])].sort();
  if (JSON.stringify(declaredUses) !== JSON.stringify(actualUses)) {
    fail(`${figure.id}: usedBy ${declaredUses.join(",")} does not match lessons ${actualUses.join(",")}`);
  }

  const rawPath = publicRelative(figure.src);
  if (!existsSync(resolve(ROOT, rawPath))) {
    fail(`${figure.id}: missing raw capture ${rawPath}`);
  } else {
    const buffer = readFileSync(resolve(ROOT, rawPath));
    try {
      const size = pngDimensions(buffer);
      if (size.width !== figure.width || size.height !== figure.height) {
        fail(`${figure.id}: raw dimensions ${size.width}x${size.height} do not match ${figure.width}x${figure.height}`);
      }
      const embeddedMetadata = pngChunkTypes(buffer).filter((type) =>
        ["eXIf", "iTXt", "tEXt", "zTXt"].includes(type),
      );
      if (embeddedMetadata.length) {
        fail(`${figure.id}: raw capture contains embedded ${embeddedMetadata.join(", ")} metadata`);
      }
    } catch (error) {
      fail(`${figure.id}: ${error.message}`);
    }
    const actualHash = sha256(rawPath);
    if (actualHash !== figure.sha256) fail(`${figure.id}: SHA-256 mismatch`);
  }

  for (const [variant, src] of Object.entries(figure.srcSet)) {
    const path = publicRelative(src);
    const derivative = figure.derivatives?.[variant];
    if (!derivative
      || !Number.isInteger(derivative.width)
      || !Number.isInteger(derivative.height)
      || !/^[0-9a-f]{64}$/.test(derivative.sha256 ?? "")) {
      fail(`${figure.id}: ${variant} derivative evidence is incomplete`);
      continue;
    }
    if (!existsSync(resolve(ROOT, path))) {
      fail(`${figure.id}: missing ${variant} derivative ${path}`);
      continue;
    }
    if (statSync(resolve(ROOT, path)).size < 1024) fail(`${figure.id}: ${variant} derivative is suspiciously small`);
    try {
      const buffer = readFileSync(resolve(ROOT, path));
      const size = webpDimensions(buffer);
      if (size.width !== derivative.width || size.height !== derivative.height) {
        fail(`${figure.id}: ${variant} dimensions ${size.width}x${size.height} do not match ${derivative.width}x${derivative.height}`);
      }
      const derivativeHash = createHash("sha256").update(buffer).digest("hex");
      if (derivativeHash !== derivative.sha256) {
        fail(`${figure.id}: ${variant} SHA-256 mismatch`);
      }
      if (size.width < 320 || size.height < 200) fail(`${figure.id}: ${variant} derivative is only ${size.width}x${size.height}`);
      if (variant === "webp1120" && size.width > 1120) fail(`${figure.id}: 1120 derivative is ${size.width}px wide`);
      if (variant === "webp2240" && size.width > 2240) fail(`${figure.id}: 2240 derivative is ${size.width}px wide`);
      if (variant === "mobile" && size.width > 800) fail(`${figure.id}: mobile derivative is ${size.width}px wide`);
      const embeddedMetadata = webpChunkTypes(buffer).filter((type) =>
        ["EXIF", "ICCP", "XMP "].includes(type),
      );
      if (embeddedMetadata.length) {
        fail(`${figure.id}: ${variant} derivative contains embedded ${embeddedMetadata.join(", ")} metadata`);
      }
    } catch (error) {
      fail(`${figure.id}: invalid ${variant} derivative: ${error.message}`);
    }
  }

  const copy = english.figures[figure.id];
  if (!copy?.alt || copy.alt.length < 35) fail(`${figure.id}: English alt text is missing or too short`);
  if (!copy?.caption || copy.caption.length < 35) fail(`${figure.id}: English caption is missing or too short`);
  for (const callout of figure.callouts) {
    if (!copy?.callouts?.[callout.id]) fail(`${figure.id}: missing callout copy ${callout.id}`);
    if (callout.xPercent < 0 || callout.xPercent > 100 || callout.yPercent < 0 || callout.yPercent > 100) {
      fail(`${figure.id}: callout ${callout.id} is outside the image`);
    }
  }
}

for (const locale of LOCALES) {
  const relative = `messages/grok/${locale}.json`;
  if (!existsSync(resolve(ROOT, relative))) {
    const message = `${locale}: missing locale bundle`;
    if (release) fail(message); else warn(message);
    continue;
  }
  const copy = locale === "en" ? english : readJson(relative);
  if (!copy) continue;
  assertSameShape(english, copy, locale);
  if (locale !== "en") {
    const referenceValues = nonStringLeaves(english);
    const candidateValues = nonStringLeaves(copy);
    for (const [path, reference] of referenceValues) {
      if (!Object.is(candidateValues.get(path), reference)) {
        fail(`${locale}: ${path} changed a non-text course value`);
      }
    }
  }
  const strings = collectStrings(copy);
  if (strings.some((value) => /[—–]/.test(value))) fail(`${locale}: visible copy contains a forbidden em-dash or en-dash`);
  if (strings.some((value) => /<script\b|javascript:/i.test(value))) fail(`${locale}: copy contains executable markup`);
  if (locale !== "en") {
    const translated = JSON.stringify(copy);
    if (translated === JSON.stringify(english)) fail(`${locale}: locale is an unchanged English fallback`);
    const referenceLeaves = stringLeaves(english);
    const candidateLeaves = stringLeaves(copy);
    let changed = 0;
    let comparable = 0;
    const unchangedLongPaths = [];
    for (const [path, reference] of referenceLeaves) {
      const candidate = candidateLeaves.get(path);
      if (typeof candidate !== "string") continue;
      if (reference.length >= 4) {
        comparable += 1;
        if (candidate !== reference) changed += 1;
      }
      if (reference.length >= 48 && candidate === reference) unchangedLongPaths.push(path);
      if ((reference.match(/\n/g) ?? []).length !== (candidate.match(/\n/g) ?? []).length) {
        fail(`${locale}: ${path} changed the prompt newline contract`);
      }
      if ((reference.match(/\|/g) ?? []).length !== (candidate.match(/\|/g) ?? []).length) {
        fail(`${locale}: ${path} changed the pipe-delimited UI contract`);
      }
      const expectedTokens = matches(reference, PROTECTED_TOKEN_PATTERN).sort();
      const actualTokens = matches(candidate, PROTECTED_TOKEN_PATTERN).sort();
      if (JSON.stringify(expectedTokens) !== JSON.stringify(actualTokens)) {
        fail(`${locale}: ${path} changed a protected product or file-format token`);
      }
      const expectedPlaceholders = matches(reference, PLACEHOLDER_PATTERN).sort();
      const actualPlaceholders = matches(candidate, PLACEHOLDER_PATTERN).sort();
      const expectedBracketCount = matches(reference, /[\[\]]/gu).length;
      const actualBracketCount = matches(candidate, /[\[\]]/gu).length;
      if (expectedPlaceholders.length !== actualPlaceholders.length
        || expectedBracketCount !== actualBracketCount) {
        fail(`${locale}: ${path} changed the bracketed practice-placeholder contract`);
      } else {
        for (const placeholder of expectedPlaceholders) {
          if (actualPlaceholders.includes(placeholder)) {
            fail(`${locale}: ${path} retains untranslated bracketed placeholder ${placeholder}`);
          }
        }
      }
      const expectedTemplateTokens = matches(reference, TEMPLATE_TOKEN_PATTERN).sort();
      const actualTemplateTokens = matches(candidate, TEMPLATE_TOKEN_PATTERN).sort();
      if (JSON.stringify(expectedTemplateTokens) !== JSON.stringify(actualTemplateTokens)) {
        fail(`${locale}: ${path} changed a named interpolation token`);
      }
      const missingNumbers = missingRequiredNumbers(reference, candidate);
      if (missingNumbers.length) {
        fail(`${locale}: ${path} dropped numeric token(s) ${missingNumbers.join(", ")}`);
      }
    }
    if (comparable && changed / comparable < 0.65) {
      fail(`${locale}: only ${changed}/${comparable} substantive strings differ from English`);
    }
    if (unchangedLongPaths.length) {
      fail(`${locale}: untranslated long-form copy remains at ${unchangedLongPaths.slice(0, 6).join(", ")}`);
    }
    const scriptPattern = TARGET_SCRIPTS[locale];
    if (scriptPattern) {
      const joined = strings.join(" ");
      const letters = matches(joined, /\p{L}/gu).length;
      const targetLetters = matches(joined, scriptPattern).length;
      if (!letters || targetLetters / letters < 0.35) {
        fail(`${locale}: target-script coverage is only ${targetLetters}/${letters} letters`);
      }
    }
  }
}

const routeFiles = [
  "app/[locale]/grok/page.tsx",
  "app/[locale]/grok/[lesson]/page.tsx",
  "components/grok/GrokCourse.module.css",
  "lib/grok/load.ts",
];
for (const file of routeFiles) if (!existsSync(resolve(ROOT, file))) fail(`Missing implementation file ${file}`);

const loader = readFileSync(resolve(ROOT, "lib/grok/load.ts"), "utf8");
const loaderLines = new Set(loader.split(/\r?\n/).map((line) => line.trim()));
for (const locale of LOCALES) {
  const expectedImport = `@/messages/grok/${locale}.json`;
  const key = locale.includes("-") ? `"${locale}"` : locale;
  const expectedLoaderLine = `${key}: () => import("${expectedImport}") as Promise<CopyModule>,`;
  if (release && !loaderLines.has(expectedLoaderLine)) {
    fail(`Release loader does not map ${locale} exactly to ${expectedImport}`);
  }
}

const englishText = JSON.stringify(english);
if (/Grok 4\.6 powers (?:grok\.com|consumer Grok)/i.test(englishText)) {
  fail("Copy incorrectly promotes Grok 4.6 to ordinary consumer Grok");
}
if (/Grok Build is a coding and app-building surface/i.test(englishText)
  || /Build was expanded to every plan/i.test(englishText)) {
  fail("Copy conflates consumer Build mode with the separately installed Grok Build terminal");
}
if (!english.lessons["map-grok"].sections[1].body.includes("separately installed Grok Build terminal")
  || !english.lessons["map-grok"].sections[2].body.includes("does not establish terminal access for every plan")) {
  fail("Product map must preserve the web/mobile Build mode versus Grok Build terminal boundary");
}
if (!english.lessons["connect-automate"].sections[0].body.includes("service-specific statement")) {
  fail("Connector privacy language must stay scoped to the cited Google Drive connector");
}
const privacyBoundary = english.lessons["privacy-boundaries"].sections[0].body;
if (!["Private Chat is not currently available in web and mobile Build mode", "Chats and build sessions in web and mobile Build mode are retained for product functionality", "Improve the Model is enabled", "including data from created apps"].every((token) => privacyBoundary.includes(token))) {
  fail("Privacy lesson must preserve the consumer Build mode data-handling boundary");
}
const productMapBoundary = english.lessons["map-grok"].sections[2].body;
if (!["latest explicit cross-platform consumer rollout announcement", "current pricing page lists Grok 4.6 as a SuperGrok benefit", "Neither page by itself establishes which ordinary chat modes route to 4.6", "dated 23 August capture", "For paid Grok plans", "free-tier limits remain separate"].every((token) => productMapBoundary.includes(token))) {
  fail("Product map must preserve dated model-routing and paid-plan usage qualifiers");
}
const workspaceBoundary = english.lessons["map-grok"].sections[0].body;
if (!["Microsoft 365 add-ins", "Google Workspace add-on", "host applications and editable files"].every((token) => workspaceBoundary.includes(token))) {
  fail("Product map must preserve Microsoft add-in and Google Workspace add-on terminology");
}
const fileLimitBoundary = english.lessons["files-data"].sections[0].body;
if (!["Most documents, images, code and audio are limited to 150 MB per file", "video and other limits may differ", "platform or subscription"].every((token) => fileLimitBoundary.includes(token))) {
  fail("Files lesson must preserve format-specific consumer upload-limit qualifiers");
}
const officeAudit = english.lessons["office-workflow"].sections[0].body;
if (!["under 2%", "8.0%", "5.5%", "5.3%", "different denominator", "Microsoft 365 add-ins", "Google Workspace add-on"].every((token) => officeAudit.includes(token))) {
  fail("Office lesson must preserve the visible Excel-demo denominator audit");
}
const installerBoundary = english.lessons["software-engineering"].sections[0].body;
if (!["executable network code", "not required for this course", "not a wholly local workflow", "sent to xAI for inference", "~/.grok/", "/privacy", "/settings", "team-level ZDR", "retains no trace or code data", "Never assume ZDR or an opt-out is active", "always-approve state", "not a recommended default"].every((token) => installerBoundary.includes(token))) {
  fail("Engineering lesson must preserve installer, data-lifecycle and permission boundaries");
}
const n8nBoundary = english.lessons["office-workflow"].sections[2].body;
if (!["credential and integration path", "does not establish end-to-end reliability", "make every failure a Grok model failure"].every((token) => n8nBoundary.includes(token))) {
  fail("Office lesson must keep n8n evidence limited to a credential and integration path");
}
const buildPublishBoundary = english.lessons.capstone.sections[0].body;
if (!["keep the app in preview", "just you", "anyone with the link", "whole internet", "selected access setting", "external-sharing boundary"].every((token) => buildPublishBoundary.includes(token))) {
  fail("Capstone must preserve the consumer Build publishing audience boundary");
}
const requiredLessonSources = {
  "map-grok": ["grok-pricing", "grok-faq", "grok-workspace"],
  "software-engineering": ["grok-security-data", "grok-build-enterprise"],
  "office-workflow": ["grok-workspace"],
  capstone: ["grok-build-everyone"],
};
for (const [slug, requiredSources] of Object.entries(requiredLessonSources)) {
  const lesson = manifest.lessons.find((candidate) => candidate.slug === slug);
  for (const sourceId of requiredSources) {
    if (!lesson?.sourceIds.includes(sourceId)) {
      fail(`${slug}: factual claim is missing required source ${sourceId}`);
    }
  }
}
if (/Grok (?:is|was) the best|guarantees? accuracy|improves? grades|saves? \d+%/i.test(englishText)) {
  fail("Copy contains an unsupported superiority, outcome or guarantee claim");
}
if (!english.meta.independent.includes("not affiliated") || !english.meta.independent.includes("not") || !english.meta.independent.includes("endorsed")) {
  fail("Independent-course notice is incomplete");
}
if (!english.ui.storageNote.includes("progress stays only in this browser")
  || !english.ui.storageNote.includes("anonymous page views")) {
  fail("Progress privacy copy must distinguish local progress state from anonymous page-view analytics");
}

if (release) {
  for (const locale of LOCALES) {
    const globalMessages = readJson(`messages/${locale}.json`);
    if (!globalMessages) continue;
    for (const [key, expected] of Object.entries(SHARED_COPY[locale])) {
      if (globalMessages[key] !== expected) {
        fail(`${locale}: shared catalogue value ${key} does not match its approved Course 5 copy`);
      }
    }
  }

  const sharedCourses = readFileSync(resolve(ROOT, "lib/courses.ts"), "utf8");
  for (const token of [
    'id: "grok"',
    "displayNumber: 5",
    'href: "/grok/"',
    'progressStrategy: "sixteen-equal-milestones"',
    "progressStorageKey: GROK_PROGRESS_STORAGE_KEY",
    'progressEvent: "aicourse:grok-progress"',
    "progress: (p) => grokProgressPercent(p)",
  ]) {
    if (!sharedCourses.includes(token)) fail(`Shared catalogue is missing Grok contract token: ${token}`);
  }

  const sharedCoursePage = readFileSync(resolve(ROOT, "app/[locale]/courses/page.tsx"), "utf8");
  for (const token of [
    "loadGrokCourse(contentLocale)",
    "const courseFiveParts",
    "grok: courseFiveParts",
    "PUBLISHED_CATALOG_COURSES.map",
  ]) {
    if (!sharedCoursePage.includes(token)) fail(`Course catalogue JSON-LD is missing Grok token: ${token}`);
  }

  const sharedProgressReset = readFileSync(resolve(ROOT, "components/progress-reset.ts"), "utf8");
  const sharedProgressAdapters = readFileSync(resolve(ROOT, "components/progress-adapters.ts"), "utf8");
  if (!sharedProgressReset.includes('createAllProgressAdapters("en")')
    || !sharedProgressAdapters.includes("resetGrokProgressAfterGlobalReset")
    || !sharedProgressAdapters.includes('courseId: "grok"')) {
    fail("Global progress reset does not clear the isolated Grok progress store");
  }

  const sharedShell = readFileSync(resolve(ROOT, "components/Shell.tsx"), "utf8");
  if (!sharedShell.includes("PUBLISHED_CATALOG_COURSES")
    || !sharedShell.includes("courseHrefFor")
    || !sharedShell.includes("footerCourses.map")) {
    fail("Shared footer navigation is missing the localized Grok course link");
  }

  const packageJson = readJson("package.json");
  if (packageJson) {
    if (packageJson.scripts?.["grok:check"] !== "node scripts/check-grok-course.mjs") {
      fail("package.json grok:check script is missing or changed");
    }
    if (
      packageJson.scripts?.["grok:check:release"] !==
      "npm run release-manifest:assert && node scripts/check-grok-course.mjs --release"
    ) {
      fail("package.json grok:check:release script is missing or changed");
    }
    if (packageJson.scripts?.["test:grok"] !== "playwright test --config tests/published-playwright.config.ts tests/grok-course.spec.ts") {
      fail("package.json test:grok script is missing or changed");
    }
  }
  for (const error of publishedReleaseIntegrationErrors(
    ROOT,
    "grok",
    "npm run grok:check:release",
    ["grok/", ...manifest.lessons.map((lesson) => `grok/${lesson.slug}/`)],
  )) fail(error);
}

notes.push(`${manifest.units.length} units, ${manifest.lessons.length} lessons, ${computedMinutes} minutes`);
notes.push(`${sources.length} evidence records, ${figures.length} available authentic figures`);
notes.push(`${LOCALES.filter((locale) => existsSync(resolve(ROOT, `messages/grok/${locale}.json`))).length}/${LOCALES.length} locale bundles present`);

console.log(`Grok course ${release ? "release " : ""}check`);
for (const note of notes) console.log(`  OK  ${note}`);
for (const warning of warnings) console.warn(`  WARN  ${warning}`);
for (const error of errors) console.error(`  FAIL  ${error}`);

if (errors.length) {
  console.error(`\n${errors.length} failure${errors.length === 1 ? "" : "s"}; release blocked.`);
  process.exit(1);
}

console.log(`\nPassed${warnings.length ? ` with ${warnings.length} warning${warnings.length === 1 ? "" : "s"}` : ""}.`);
