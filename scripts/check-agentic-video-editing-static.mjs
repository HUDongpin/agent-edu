#!/usr/bin/env node

/**
 * Post-build byte-for-byte audit for Course 22's public fixtures and lab.
 * Run only after `next build`; Next static export copies `public/` into `out/`.
 */

import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const COURSE_DIRECTORY = "courses/agentic-video-editing";
const SOURCE = join(ROOT, "public", COURSE_DIRECTORY);
const EMITTED = join(ROOT, "out", COURSE_DIRECTORY);
const HASHED_FILES = [
  "creative-brief.fixture.json",
  "media-manifest.fixture.json",
  "edit-plan.schema.json",
  "qc-checklist.md",
  "NOTICE.md",
];
const EXPECTED_FILES = [...HASHED_FILES, "fixtures.provenance.json", "lab"];
const SITE = "https://aicourse.top";
const SHELL_LOCALES = [
  "en",
  "es",
  "fr",
  "de",
  "zh-Hans",
  "zh-Hant",
  "ja",
  "ko",
  "ar",
];
const AUTHORED_LOCALES = ["en", "zh-Hans"];
const MODULE_PAGES = [
  "agentic-editing-contract",
  "media-ingest-provenance",
  "transcripts-shots-index",
  "semantic-analysis-director",
  "declarative-edit-plan",
  "agent-tools-mcp",
  "deterministic-rendering",
  "captions-audio-formats",
  "verification-human-review",
  "production-capstone",
];
const COURSE_PAGES = ["", ...MODULE_PAGES];
const SIMPLIFIED_CHINESE_COURSE_TITLE =
  "如何使用智能体进行视频剪辑：从创作意图到经过验证的成片";
const failures = [];
const fail = (message) => failures.push(message);
const rel = (path) => relative(ROOT, path).split(sep).join("/");

function regularDirectory(path) {
  if (!existsSync(path)) {
    fail(`${rel(path)}: directory is missing; run \`next build\` first.`);
    return false;
  }
  const stat = lstatSync(path);
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    fail(`${rel(path)}: expected a real directory, not a file or symbolic link.`);
    return false;
  }
  return true;
}

function regularFile(path) {
  if (!existsSync(path)) {
    fail(`${rel(path)}: required file is missing.`);
    return false;
  }
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    fail(`${rel(path)}: expected a regular, non-symbolic file.`);
    return false;
  }
  return true;
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function parseJson(path) {
  if (!regularFile(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`${rel(path)}: invalid JSON (${error instanceof Error ? error.message : String(error)}).`);
    return null;
  }
}

function attribute(tag, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const match = tag.match(
    new RegExp(`\\s${escapedName}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "iu"),
  );
  return match?.[1] ?? match?.[2] ?? null;
}

function openingTags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "giu"))]
    .map((match) => match[0]);
}

function jsonLdDocuments(html, pathLabel) {
  const documents = [];
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/giu)) {
    if (attribute(match[1], "type") !== "application/ld+json") continue;
    try {
      documents.push(JSON.parse(match[2]));
    } catch (error) {
      fail(`${pathLabel}: JSON-LD is not valid JSON (${error instanceof Error ? error.message : String(error)}).`);
    }
  }
  if (!documents.length) fail(`${pathLabel}: no JSON-LD document was emitted.`);
  return documents;
}

function courseRelativePage(moduleSlug) {
  return `agentic-video-editing/${moduleSlug ? `${moduleSlug}/` : ""}`;
}

function absoluteCourseUrl(locale, moduleSlug) {
  return `${SITE}/${locale}/${courseRelativePage(moduleSlug)}`;
}

function htmlPath(locale, moduleSlug) {
  return join(
    ROOT,
    "out",
    locale,
    "agentic-video-editing",
    ...(moduleSlug ? [moduleSlug] : []),
    "index.html",
  );
}

function recursiveRegularFiles(directory) {
  if (!existsSync(directory)) return [];
  const files = [];
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    const stat = lstatSync(path);
    if (stat.isDirectory() && !stat.isSymbolicLink()) {
      files.push(...recursiveRegularFiles(path));
    } else if (stat.isFile() && !stat.isSymbolicLink()) {
      files.push(path);
    }
  }
  return files;
}

function duplicateIds(html) {
  const counts = new Map();
  for (const tag of html.matchAll(/<[a-z][^>]*\sid=(?:"([^"]+)"|'([^']+)')[^>]*>/giu)) {
    const id = tag[1] ?? tag[2];
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return [...counts.entries()].filter(([, count]) => count > 1);
}

function parseSitemapEntries(xml) {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/giu)].map((match) => {
    const block = match[1];
    const loc = block.match(/<loc>([^<]+)<\/loc>/iu)?.[1] ?? "";
    const alternates = openingTags(block, "xhtml:link").map((tag) => ({
      rel: attribute(tag, "rel"),
      hreflang: attribute(tag, "hreflang"),
      href: attribute(tag, "href"),
    }));
    return { loc, alternates };
  });
}

const sourceDirectoryReady = regularDirectory(SOURCE);
const emittedDirectoryReady = regularDirectory(EMITTED);
if (!sourceDirectoryReady || !emittedDirectoryReady) {
  console.error(`FAIL Course 22 static fixture audit (${failures.length} finding${failures.length === 1 ? "" : "s"})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

for (const directory of [SOURCE, EMITTED]) {
  const actual = readdirSync(directory).sort((left, right) => left.localeCompare(right, "en"));
  const expected = [...EXPECTED_FILES].sort((left, right) => left.localeCompare(right, "en"));
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(`${rel(directory)}: expected exactly ${expected.join(", ")}; found ${actual.join(", ") || "nothing"}.`);
  }
  for (const name of actual) {
    if (name === "lab") regularDirectory(join(directory, name));
    else regularFile(join(directory, name));
  }
}

const sourceProvenance = parseJson(join(SOURCE, "fixtures.provenance.json"));
const emittedProvenance = parseJson(join(EMITTED, "fixtures.provenance.json"));
if (sourceProvenance && emittedProvenance) {
  if (sourceProvenance.courseId !== "agentic-video-editing"
    || sourceProvenance.schemaVersion !== "aicourse.public-fixtures.provenance.v1"
    || sourceProvenance.fixtureSetVersion !== "2.0.0") {
    fail("Source fixture provenance identity or schema drifted.");
  }
  if (JSON.stringify(sourceProvenance) !== JSON.stringify(emittedProvenance)) {
    fail("Emitted fixtures.provenance.json is not byte-equivalent JSON to the source record.");
  }
}

for (const name of EXPECTED_FILES.filter((entry) => entry !== "lab")) {
  const sourcePath = join(SOURCE, name);
  const emittedPath = join(EMITTED, name);
  if (!regularFile(sourcePath) || !regularFile(emittedPath)) continue;
  const sourceBytes = readFileSync(sourcePath);
  const emittedBytes = readFileSync(emittedPath);
  if (!sourceBytes.equals(emittedBytes)) {
    fail(`${COURSE_DIRECTORY}/${name}: emitted bytes differ from public source bytes.`);
  }
}

function recursiveFiles(directory, prefix = "") {
  const files = [];
  for (const name of readdirSync(directory).sort((left, right) => left.localeCompare(right, "en"))) {
    const absolutePath = join(directory, name);
    const relativePath = prefix ? `${prefix}/${name}` : name;
    const stat = lstatSync(absolutePath);
    if (stat.isSymbolicLink()) {
      fail(`${rel(absolutePath)}: symbolic links are forbidden in Course 22 public assets.`);
    } else if (stat.isDirectory()) {
      files.push(...recursiveFiles(absolutePath, relativePath));
    } else if (stat.isFile()) {
      files.push(relativePath);
    } else {
      fail(`${rel(absolutePath)}: unsupported filesystem entry.`);
    }
  }
  return files;
}

const sourceTree = recursiveFiles(SOURCE);
const emittedTree = recursiveFiles(EMITTED);
if (JSON.stringify(sourceTree) !== JSON.stringify(emittedTree)) {
  fail("Course 22 emitted public asset inventory differs from public source inventory.");
}
for (const name of sourceTree) {
  const sourcePath = join(SOURCE, name);
  const emittedPath = join(EMITTED, name);
  if (regularFile(emittedPath) && !readFileSync(sourcePath).equals(readFileSync(emittedPath))) {
    fail(`${COURSE_DIRECTORY}/${name}: emitted bytes differ from public source bytes.`);
  }
}

if (sourceProvenance) {
  const records = Array.isArray(sourceProvenance.files) ? sourceProvenance.files : [];
  for (const name of HASHED_FILES) {
    const sourcePath = join(SOURCE, name);
    const emittedPath = join(EMITTED, name);
    const record = records.find((candidate) => candidate.path === name);
    if (!record || !/^[a-f0-9]{64}$/u.test(record.sha256 ?? "")) {
      fail(`${name}: provenance SHA-256 record is missing or malformed.`);
      continue;
    }
    if (regularFile(sourcePath) && sha256(sourcePath) !== record.sha256) {
      fail(`${name}: public source bytes do not match provenance SHA-256.`);
    }
    if (regularFile(emittedPath) && sha256(emittedPath) !== record.sha256) {
      fail(`${name}: emitted bytes do not match provenance SHA-256.`);
    }
  }
}

const staticSourceInputs = [
  ...recursiveRegularFiles(join(ROOT, "app", "[locale]", "agentic-video-editing")),
  ...recursiveRegularFiles(join(ROOT, "components", "agentic-video-editing")),
  ...recursiveRegularFiles(join(ROOT, "lib", "agentic-video-editing")),
  join(ROOT, "app", "[locale]", "courses", "page.tsx"),
  join(ROOT, "app", "sitemap.ts"),
  join(ROOT, "components", "JsonLd.tsx"),
  join(ROOT, "lib", "courses.ts"),
  join(ROOT, "lib", "seo.ts"),
].filter((path) => existsSync(path));
const newestStaticSource = staticSourceInputs.reduce(
  (latest, path) => Math.max(latest, statSync(path).mtimeMs),
  0,
);
const emittedContractFiles = [
  ...SHELL_LOCALES.flatMap((locale) => COURSE_PAGES.map((moduleSlug) =>
    htmlPath(locale, moduleSlug))),
  ...SHELL_LOCALES.map((locale) => join(ROOT, "out", locale, "courses", "index.html")),
  join(ROOT, "out", "sitemap.xml"),
];
for (const path of emittedContractFiles) {
  if (!regularFile(path)) continue;
  if (statSync(path).mtimeMs < newestStaticSource) {
    fail(`${rel(path)}: static output predates a Course 22 source; run \`next build\` again.`);
  }
}

for (const locale of SHELL_LOCALES) {
  const contentLocale = locale === "zh-Hans" ? "zh-Hans" : "en";
  for (const [pageIndex, moduleSlug] of COURSE_PAGES.entries()) {
    const path = htmlPath(locale, moduleSlug);
    if (!regularFile(path)) continue;
    const pathLabel = rel(path);
    const html = readFileSync(path, "utf8");

    const htmlTag = openingTags(html, "html")[0];
    if (!htmlTag || attribute(htmlTag, "lang") !== locale) {
      fail(`${pathLabel}: shell html lang must be ${locale}.`);
    }

    const expectedTestId = moduleSlug
      ? `agentic-video-editing-module-${moduleSlug}`
      : "agentic-video-editing-course-dashboard";
    const contentRoot = openingTags(html, "div").find(
      (tag) => attribute(tag, "data-testid") === expectedTestId,
    );
    if (!contentRoot) {
      fail(`${pathLabel}: missing ${expectedTestId} content root.`);
    } else if (attribute(contentRoot, "lang") !== contentLocale) {
      fail(`${pathLabel}: content root must declare ${contentLocale}, not the shell locale by implication.`);
    }

    const holdMatch = html.match(
      /<p\b[^>]*data-testid="agentic-video-editing-release-hold"[^>]*>([\s\S]*?)<\/p>/iu,
    );
    const holdText = holdMatch?.[1].replace(/<[^>]+>/gu, "") ?? "";
    if (!holdText.includes("HOLD") || !holdText.includes("candidate")) {
      fail(`${pathLabel}: pending candidate/HOLD disclosure is missing.`);
    }

    if (!AUTHORED_LOCALES.includes(locale)) {
      if (!holdText.includes("authored English candidate bundle")) {
        fail(`${pathLabel}: fallback shell does not explicitly disclose the authored English bundle.`);
      }
      if (html.includes(SIMPLIFIED_CHINESE_COURSE_TITLE)) {
        fail(`${pathLabel}: Simplified Chinese authored-course copy leaked into an English fallback bundle.`);
      }
    }

    const h1Count = openingTags(html, "h1").length;
    if (h1Count !== 1) fail(`${pathLabel}: expected one h1; found ${h1Count}.`);
    const duplicates = duplicateIds(html);
    if (duplicates.length) {
      fail(`${pathLabel}: duplicate element IDs: ${duplicates.map(([id, count]) => `${id} (${count})`).join(", ")}.`);
    }

    const linkTags = openingTags(html, "link");
    const canonicalTags = linkTags.filter(
      (tag) => attribute(tag, "rel")?.toLowerCase() === "canonical",
    );
    const expectedCanonical = absoluteCourseUrl(contentLocale, moduleSlug);
    if (canonicalTags.length !== 1
      || attribute(canonicalTags[0], "href") !== expectedCanonical) {
      fail(`${pathLabel}: canonical must be exactly ${expectedCanonical}.`);
    }

    const alternateTags = linkTags.filter(
      (tag) => attribute(tag, "rel")?.toLowerCase() === "alternate"
        && attribute(tag, "hreflang") !== null,
    );
    const alternates = new Map(alternateTags.map((tag) => [
      attribute(tag, "hreflang"),
      attribute(tag, "href"),
    ]));
    const expectedAlternates = new Map([
      ["en", absoluteCourseUrl("en", moduleSlug)],
      ["zh-Hans", absoluteCourseUrl("zh-Hans", moduleSlug)],
      ["x-default", absoluteCourseUrl("en", moduleSlug)],
    ]);
    if (alternateTags.length !== 3 || alternates.size !== 3
      || [...expectedAlternates].some(([language, href]) => alternates.get(language) !== href)) {
      fail(`${pathLabel}: hreflang must contain the reciprocal en, zh-Hans, and x-default set only.`);
    }

    const jsonLd = jsonLdDocuments(html, pathLabel);
    if (jsonLd.some((document) => !Array.isArray(document?.["@graph"]))) {
      fail(`${pathLabel}: every Course 22 JSON-LD document must use an @graph wrapper.`);
    }
    const graph = jsonLd.flatMap((document) =>
      Array.isArray(document?.["@graph"]) ? document["@graph"] : []);
    if (!moduleSlug) {
      const course = graph.find((node) => node?.["@type"] === "Course");
      if (!course) {
        fail(`${pathLabel}: dashboard Course node is missing from JSON-LD.`);
      } else {
        if (course.courseCode !== "22"
          || course.url !== expectedCanonical
          || course.inLanguage !== contentLocale) {
          fail(`${pathLabel}: Course JSON-LD identity, canonical URL, or inLanguage drifted.`);
        }
        if (!Array.isArray(course.hasPart) || course.hasPart.length !== 10) {
          fail(`${pathLabel}: Course JSON-LD must expose exactly ten module parts.`);
        }
        if (course.hasCourseInstance?.courseWorkload !== "PT750M") {
          fail(`${pathLabel}: Course JSON-LD workload must remain PT750M.`);
        }
      }
    } else {
      const resource = graph.find((node) => node?.["@type"] === "LearningResource");
      if (!resource) {
        fail(`${pathLabel}: module LearningResource node is missing from JSON-LD.`);
      } else {
        if (resource.url !== expectedCanonical
          || resource.inLanguage !== contentLocale
          || resource.position !== pageIndex) {
          fail(`${pathLabel}: module JSON-LD URL, language, or position drifted.`);
        }
        if (resource.isPartOf?.courseCode !== "22"
          || resource.isPartOf?.url !== absoluteCourseUrl(contentLocale, "")) {
          fail(`${pathLabel}: module JSON-LD parent Course binding drifted.`);
        }
      }
    }
  }

  const catalogPath = join(ROOT, "out", locale, "courses", "index.html");
  if (!regularFile(catalogPath)) continue;
  const catalogLabel = rel(catalogPath);
  const catalogDocuments = jsonLdDocuments(readFileSync(catalogPath, "utf8"), catalogLabel);
  const itemList = catalogDocuments.find((document) => document?.["@type"] === "ItemList");
  const entry = itemList?.itemListElement?.find((candidate) =>
    candidate?.position === 22 && candidate?.item?.["@type"] === "Course");
  const catalogCourse = entry?.item;
  if (!catalogCourse) {
    fail(`${catalogLabel}: Course 22 is missing from catalog JSON-LD position 22.`);
  } else {
    if (catalogCourse.courseCode !== "22"
      || catalogCourse.url !== absoluteCourseUrl(contentLocale, "")
      || catalogCourse.inLanguage !== contentLocale) {
      fail(`${catalogLabel}: Course 22 catalog code, canonical URL, or inLanguage drifted.`);
    }
    if (!Array.isArray(catalogCourse.hasPart) || catalogCourse.hasPart.length !== 10) {
      fail(`${catalogLabel}: Course 22 catalog JSON-LD must expose exactly ten module parts.`);
    }
    if (catalogCourse.hasCourseInstance?.courseWorkload !== "PT750M") {
      fail(`${catalogLabel}: Course 22 catalog workload must remain PT750M.`);
    }
  }
}

const sitemapPath = join(ROOT, "out", "sitemap.xml");
if (regularFile(sitemapPath)) {
  const sitemapEntries = parseSitemapEntries(readFileSync(sitemapPath, "utf8"));
  for (const moduleSlug of COURSE_PAGES) {
    const expectedAlternates = new Map([
      ["en", absoluteCourseUrl("en", moduleSlug)],
      ["zh-Hans", absoluteCourseUrl("zh-Hans", moduleSlug)],
      ["x-default", absoluteCourseUrl("en", moduleSlug)],
    ]);
    for (const locale of AUTHORED_LOCALES) {
      const url = absoluteCourseUrl(locale, moduleSlug);
      const matching = sitemapEntries.filter((entry) => entry.loc === url);
      if (matching.length !== 1) {
        fail(`out/sitemap.xml: expected exactly one Course 22 entry for ${url}.`);
        continue;
      }
      const alternates = new Map(matching[0].alternates.map((alternate) => [
        alternate.hreflang,
        alternate.href,
      ]));
      if (matching[0].alternates.length !== 3 || alternates.size !== 3
        || matching[0].alternates.some((alternate) => alternate.rel !== "alternate")
        || [...expectedAlternates].some(([language, href]) => alternates.get(language) !== href)) {
        fail(`out/sitemap.xml: ${url} lacks reciprocal en, zh-Hans, and x-default alternates.`);
      }
    }
    for (const locale of SHELL_LOCALES.filter((candidate) =>
      !AUTHORED_LOCALES.includes(candidate))) {
      const fallbackUrl = absoluteCourseUrl(locale, moduleSlug);
      if (sitemapEntries.some((entry) => entry.loc === fallbackUrl)) {
        fail(`out/sitemap.xml: fallback shell ${fallbackUrl} must not be advertised as authored copy.`);
      }
    }
  }
}

if (failures.length) {
  console.error(`FAIL Course 22 static fixture audit (${failures.length} finding${failures.length === 1 ? "" : "s"})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS Course 22 static fixture audit");
console.log("- five original learning files, integrity ledger, and complete offline lab copied byte-for-byte into out/courses/agentic-video-editing");
console.log("- five learning assets match their SHA-256 provenance records");
console.log("- no missing, extra, or symbolic-linked file entered the emitted fixture set");
console.log("- 99 static course shells pass h1/ID, native-vs-fallback language, HOLD, canonical, reciprocal hreflang, and graph JSON-LD checks");
console.log("- Course 22 catalog and sitemap contracts preserve code/position 22, PT750M, ten modules, and authored-locale alternates");
console.log("- repository integrity verified; real-media rights, edit quality, and publication approval remain human decisions");
