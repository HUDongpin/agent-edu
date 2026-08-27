import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

export const SVG_TEXT_ASSET_CONTRACT_PATH = "config/i18n-svg-text-assets.v1.json";

export const SVG_TEXT_ASSET_CLASSIFICATIONS = Object.freeze([
  "brand-mark",
  "course-original-diagram",
  "third-party-or-derived-diagram",
]);

const REVIEW_STATES = new Set(["mechanically-verified", "review-required"]);
const CLASSIFICATIONS = new Set(SVG_TEXT_ASSET_CLASSIFICATIONS);
const DIRECTIONS = new Set(["ltr", "rtl"]);
const SHA256 = /^[a-f0-9]{64}$/;
const REPO_EVIDENCE_GLOB = /[*?{}]/;
const CLAUDE_ORIGINAL_TRANSFORMATION = "Deterministic hand-authored SVG assembled from geometric primitives and course-authored English labels; no third-party pixels were traced or embedded.";
const RAG_ARCHITECTURE_UPSTREAM = "https://raw.githubusercontent.com/anthropics/claude-quickstarts/5264b729deda905dba3e5402d717bebed000325c/managed-agents/knowledge-wiki/assets/architecture.svg";

const posix = (value) => value.split(sep).join("/");
const hash = (value) => createHash("sha256").update(value).digest("hex");
const naturalLanguage = (value) => /\p{L}/u.test(value) && value.trim().length >= 2;

export function extractSvgVisibleTextInventory(source) {
  return [...source.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/gi)]
    .map((match) => match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function issue(issues, path, message) {
  issues.push({ path, message });
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function exactArray(actual, expected) {
  return Array.isArray(actual) && JSON.stringify(actual) === JSON.stringify(expected);
}

function exactSet(actual, expected) {
  if (!Array.isArray(actual)) return false;
  const left = [...new Set(actual)].sort();
  const right = [...new Set(expected)].sort();
  return JSON.stringify(left) === JSON.stringify(right) && left.length === actual.length;
}

function evidenceFile(root, entry) {
  const path = entry.split("#", 1)[0];
  if (!path || path.startsWith("/") || path.includes("..") || REPO_EVIDENCE_GLOB.test(path)) return null;
  const absolute = resolve(root, path);
  const rootPrefix = resolve(root) + sep;
  return absolute.startsWith(rootPrefix) ? absolute : null;
}

function valueAtPath(value, dottedPath) {
  let cursor = value;
  for (const part of dottedPath.split(".")) {
    if (!isObject(cursor) || !(part in cursor)) return undefined;
    cursor = cursor[part];
  }
  return cursor;
}

function validateLocalizedAlternative(root, record, siteLocales, issues, path) {
  const alternative = record.localizedAlternative;
  if (!isObject(alternative)) {
    issue(issues, `${path}.localizedAlternative`, "Expected an exact localized-alternative record.");
    return;
  }
  if (!isNonEmptyString(alternative.status) || !isNonEmptyString(alternative.copyLocator)) {
    issue(issues, `${path}.localizedAlternative`, "status and copyLocator must be non-empty strings.");
  }
  if (!exactSet(alternative.locales, siteLocales)) {
    issue(issues, `${path}.localizedAlternative.locales`, "Localized alternatives must enumerate every site locale exactly once.");
  }

  if (record.classification === "brand-mark") {
    if (alternative.status !== "locale-shell-text-equivalent"
      || alternative.copyLocator !== "components/Shell.tsx#brand-wordmark") {
      issue(issues, `${path}.localizedAlternative`, "The brand mark is accepted only through the exact text wordmark rendered by the localized shell.");
      return;
    }
    const shell = readFileSync(join(root, "components", "Shell.tsx"), "utf8");
    if (!shell.includes('<span className="wm">aicourse.top</span>')) {
      issue(issues, `${path}.localizedAlternative.copyLocator`, "The localized shell wordmark no longer matches the reviewed brand alternative.");
    }
    return;
  }

  const course = record.classification === "course-original-diagram" ? "claude" : "rag";
  const expectedStatus = course === "claude"
    ? "localized-alt-and-caption"
    : "localized-alt-caption-and-transcript";
  if (alternative.status !== expectedStatus) {
    issue(issues, `${path}.localizedAlternative.status`, `Expected ${expectedStatus} for this asset class and copy contract.`);
  }

  const localizedValues = new Map();
  for (const locale of siteLocales) {
    const messagePath = join(root, "messages", course, `${locale}.json`);
    if (!existsSync(messagePath)) {
      issue(issues, `${path}.localizedAlternative`, `Missing ${course} copy bundle for ${locale}.`);
      continue;
    }
    let copy;
    try {
      copy = valueAtPath(JSON.parse(readFileSync(messagePath, "utf8")), alternative.copyLocator);
    } catch (error) {
      issue(issues, `${path}.localizedAlternative`, `Cannot parse ${posix(relative(root, messagePath))}: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }
    if (!isObject(copy) || !naturalLanguage(copy.alt ?? "") || !naturalLanguage(copy.caption ?? "")) {
      issue(issues, `${path}.localizedAlternative`, `${locale} must provide non-empty localized alt and caption text at ${alternative.copyLocator}.`);
      continue;
    }
    if (course === "rag" && (!Array.isArray(copy.transcript) || copy.transcript.length < 2 || copy.transcript.some((entry) => !isNonEmptyString(entry)))) {
      issue(issues, `${path}.localizedAlternative`, `${locale} must provide the complete localized transcript at ${alternative.copyLocator}.`);
      continue;
    }
    localizedValues.set(locale, JSON.stringify(copy));
  }
  const english = localizedValues.get("en");
  if (english) {
    for (const locale of siteLocales.filter((candidate) => candidate !== "en")) {
      if (localizedValues.get(locale) === english) {
        issue(issues, `${path}.localizedAlternative`, `${locale} duplicates the English media alternative instead of providing reviewed localized copy.`);
      }
    }
  }
}

function validateClassEvidence(root, record, source, issues, path) {
  if (record.classification !== "brand-mark") {
    const hasIntrinsicEnglishLanguage = /<svg\b[^>]*(?:xml:lang|lang)=["']en["']/i.test(source);
    if (record.localeBehavior?.explicitLanguageAnnotation !== hasIntrinsicEnglishLanguage) {
      issue(issues, `${path}.localeBehavior.explicitLanguageAnnotation`, "The recorded intrinsic English-language annotation does not match the SVG root.");
    }
  }
  if (record.classification === "brand-mark") {
    if (record.path !== "public/logo-lockup.svg"
      || record.rights?.status !== "repository-owned"
      || record.rights?.holder !== "HU Dongpin"
      || record.rights?.licence !== "MIT"
      || record.rights?.evidenceSet !== "brand-rights-and-provenance"
      || record.provenance?.status !== "repository-native"
      || record.provenance?.source !== "aicourse.top repository brand lockup"
      || record.provenance?.evidenceSet !== "brand-rights-and-provenance"
      || record.transformation?.status !== "none"
      || record.localeBehavior?.mode !== "documentation-only-locale-invariant-brand"
      || record.localeBehavior?.direction !== "ltr"
      || record.localeBehavior?.evidenceSet !== "brand-locale-alternative") {
      issue(issues, path, "The mechanically accepted brand contract is limited to the exact repository-native logo lockup and MIT repository record.");
    }
    const readme = readFileSync(join(root, "README.md"), "utf8");
    const licence = readFileSync(join(root, "LICENSE"), "utf8");
    if (!readme.includes('<img src="public/logo-lockup.svg" alt="aicourse.top"') || !licence.includes("Copyright (c) 2026 HU Dongpin")) {
      issue(issues, path, "The logo's repository provenance or accessible README alternative no longer matches the evidence contract.");
    }
    return;
  }

  if (record.classification === "course-original-diagram") {
    if (record.rights?.status !== "course-original-cc0"
      || record.rights?.holder !== "aicourse.top course authors"
      || record.rights?.licence !== "CC0-1.0"
      || record.rights?.evidenceSet !== "claude-original-rights-and-provenance"
      || record.provenance?.status !== "course-original"
      || record.provenance?.source !== "public/courses/claude/figure-provenance.v1.json"
      || record.provenance?.evidenceSet !== "claude-original-rights-and-provenance"
      || record.transformation?.status !== "course-authored-original"
      || record.transformation?.description !== CLAUDE_ORIGINAL_TRANSFORMATION
      || record.localeBehavior?.mode !== "english-ltr-media-in-localized-course"
      || record.localeBehavior?.direction !== "ltr"
      || record.localeBehavior?.evidenceSet !== "claude-original-locale-alternative") {
      issue(issues, path, "A course-original diagram must retain the exact CC0, provenance and transformation states recorded by the Claude figure ledger.");
      return;
    }
    const id = record.path.match(/\/fig-(\d{2})-[^/]+-original\.svg$/)?.[1];
    const ledgerPath = join(root, "public", "courses", "claude", "figure-provenance.v1.json");
    const ledger = JSON.parse(readFileSync(ledgerPath, "utf8"));
    const expectedPath = record.path.replace("public/courses/claude/", "");
    const ledgerRecord = ledger.originalFigures?.find((entry) => entry.id === `fig-${id}`);
    if (!id || ledgerRecord?.path !== expectedPath || ledgerRecord?.sha256 !== record.sha256
      || ledger.originalFigurePolicy?.licence !== "CC0-1.0"
      || ledger.originalFigurePolicy?.remoteAssets !== false
      || ledger.originalFigurePolicy?.thirdPartyPixels !== false) {
      issue(issues, path, "The Claude course-original ledger does not bind this exact path and SHA-256 to its no-third-party-pixels policy.");
    }
    if (record.localizedAlternative?.copyLocator !== `figures.fig-${id}`
      || record.localizedAlternative?.evidenceSet !== "claude-original-locale-alternative") {
      issue(issues, `${path}.localizedAlternative`, "The Claude localized alternative must point to this figure's exact per-locale alt/caption record.");
    }
    if (!record.visibleTextInventory.includes("ORIGINAL COURSE DIAGRAM · NOT PRODUCT UI")) {
      issue(issues, `${path}.visibleTextInventory`, "Claude original diagrams must retain their visible non-product-UI origin label.");
    }
    const hashLedger = readFileSync(join(root, "public", "courses", "claude", "figure-hashes.sha256"), "utf8");
    if (!hashLedger.includes(`${record.sha256}  ${expectedPath}`)) {
      issue(issues, path, "The Claude figure hash ledger does not contain this exact path and digest.");
    }
    const renderer = readFileSync(join(root, "components", "claude", "CourseFigure.tsx"), "utf8");
    if (!renderer.includes("alt={copy.alt}") || !renderer.includes('dir="ltr"')) {
      issue(issues, `${path}.localeBehavior`, "The Claude renderer must retain localized alt text and an explicit LTR media wrapper.");
    }
    return;
  }

  if (record.classification === "third-party-or-derived-diagram") {
    if (record.path !== "public/courses/rag/figures/anthropic-knowledge-wiki-architecture.svg"
      || record.rights?.status !== "licensed-third-party"
      || record.rights?.holder !== "Anthropic"
      || record.rights?.licence !== "MIT"
      || record.rights?.evidenceSet !== "rag-anthropic-rights-and-provenance"
      || record.provenance?.status !== "pinned-upstream"
      || record.provenance?.source !== RAG_ARCHITECTURE_UPSTREAM
      || record.provenance?.evidenceSet !== "rag-anthropic-rights-and-provenance"
      || record.transformation?.status !== "none-byte-for-byte"
      || record.transformation?.description !== "Local SVG is preserved byte for byte from the pinned upstream commit."
      || record.localeBehavior?.mode !== "english-ltr-third-party-media-in-localized-course"
      || record.localeBehavior?.direction !== "ltr"
      || record.localeBehavior?.evidenceSet !== "rag-anthropic-locale-alternative"
      || record.localizedAlternative?.copyLocator !== "lessons.advanced-patterns.figure"
      || record.localizedAlternative?.evidenceSet !== "rag-anthropic-locale-alternative") {
      issue(issues, path, "The third-party contract is limited to the exact pinned Anthropic diagram and its byte-for-byte MIT record.");
      return;
    }
    const ragFigures = readFileSync(join(root, "lib", "rag", "figures.ts"), "utf8");
    const notice = readFileSync(join(root, "public", "courses", "rag", "NOTICE.md"), "utf8");
    if (!ragFigures.includes(`svgSha256: "${record.sha256}"`)
      || !ragFigures.includes("5264b729deda905dba3e5402d717bebed000325c")
      || !notice.includes(`SHA-256: \`${record.sha256}\``)
      || !notice.includes("Local transformation: none. The SVG is preserved byte for byte.")) {
      issue(issues, path, "The RAG manifest or NOTICE no longer proves the exact pinned hash, commit and no-transformation record.");
    }
    const renderer = readFileSync(join(root, "components", "rag", "RagFigure.tsx"), "utf8");
    if (!renderer.includes("alt={copy.alt}") || !renderer.includes("copy.transcript.map")) {
      issue(issues, `${path}.localizedAlternative`, "The RAG renderer must retain its localized alt and visible learning-transcript alternatives.");
    }
  }

}

function mechanicalApprovalIssues(record) {
  const issues = [];
  if (record.classification === "brand-mark") {
    if (record.path !== "public/logo-lockup.svg"
      || record.localeBehavior?.mode !== "documentation-only-locale-invariant-brand"
      || record.localizedAlternative?.status !== "locale-shell-text-equivalent") {
      issues.push("Only the exact documentation brand lockup with the localized shell text equivalent is mechanically approvable.");
    }
    return issues;
  }
  if (record.classification === "third-party-or-derived-diagram") {
    issues.push("Third-party visible-language media requires a recorded human publication/language review; licence evidence alone cannot mechanically approve it.");
    return issues;
  }
  if (record.localeBehavior?.explicitLanguageAnnotation !== true) {
    issues.push("Instructional SVGs require an intrinsic lang=en annotation before mechanical approval.");
  }
  if (record.localizedAlternative?.status !== "localized-transcript") {
    issues.push("Instructional SVGs require a complete per-locale visible-label transcript before mechanical approval.");
  }
  return issues;
}

function validateEvidenceSets(root, manifest, issues) {
  if (!isObject(manifest.evidenceSets)) {
    issue(issues, "evidenceSets", "Expected named exact-file evidence sets.");
    return { known: new Set(), invalid: new Set() };
  }
  const known = new Set();
  const invalid = new Set();
  for (const [id, entries] of Object.entries(manifest.evidenceSets)) {
    known.add(id);
    if (!Array.isArray(entries) || !entries.length) {
      issue(issues, `evidenceSets.${id}`, "Evidence sets must contain at least one exact repository path.");
      invalid.add(id);
      continue;
    }
    if (new Set(entries).size !== entries.length) {
      issue(issues, `evidenceSets.${id}`, "Evidence paths must be unique.");
      invalid.add(id);
    }
    for (const entry of entries) {
      if (!isNonEmptyString(entry)) {
        issue(issues, `evidenceSets.${id}`, "Evidence paths must be non-empty strings.");
        invalid.add(id);
        continue;
      }
      const absolute = evidenceFile(root, entry);
      if (!absolute) {
        issue(issues, `evidenceSets.${id}`, `Evidence must be an exact repository-relative path without wildcards: ${entry}`);
        invalid.add(id);
      } else if (!existsSync(absolute)) {
        issue(issues, `evidenceSets.${id}`, `Evidence path is missing: ${entry}`);
        invalid.add(id);
      }
    }
  }
  return { known, invalid };
}

export function inspectSvgTextAssetContracts(root, siteLocales, manifestOverride) {
  const manifestPath = join(root, SVG_TEXT_ASSET_CONTRACT_PATH);
  const issues = [];
  let manifest = manifestOverride;
  if (!manifest) {
    try {
      manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    } catch (error) {
      return {
        manifestPath,
        issues: [{ path: SVG_TEXT_ASSET_CONTRACT_PATH, message: error instanceof Error ? error.message : String(error) }],
        decisions: new Map(),
      };
    }
  }
  if (!isObject(manifest) || manifest.schemaVersion !== "1.0.0") {
    issue(issues, "schemaVersion", "Expected SVG text asset contract schema 1.0.0.");
  }
  if (!exactArray(manifest.siteLocales, siteLocales)) {
    issue(issues, "siteLocales", "The SVG contract locale registry must exactly match the site locale order.");
  }
  const evidenceSets = validateEvidenceSets(root, manifest, issues);
  const referencedEvidenceSets = new Set();
  const decisions = new Map();
  const seen = new Set();
  if (!Array.isArray(manifest.assets)) {
    issue(issues, "assets", "Expected an array of exact SVG asset records.");
    return { manifestPath, issues, decisions };
  }

  for (const [index, record] of manifest.assets.entries()) {
    const path = `assets[${index}]`;
    const recordIssuesAtStart = issues.length;
    if (!isObject(record)) {
      issue(issues, path, "Expected an asset object.");
      continue;
    }
    if (!isNonEmptyString(record.path)
      || !/^public\/.+\.svg$/.test(record.path)
      || record.path.startsWith("/")
      || record.path.includes("..")
      || REPO_EVIDENCE_GLOB.test(record.path)) {
      issue(issues, `${path}.path`, "Asset identity must be one exact repository-relative public SVG path without wildcards.");
      continue;
    }
    if (seen.has(record.path)) issue(issues, `${path}.path`, `Duplicate asset path: ${record.path}`);
    seen.add(record.path);
    if (!SHA256.test(record.sha256 ?? "")) issue(issues, `${path}.sha256`, "Expected a lowercase SHA-256 digest.");
    if (!CLASSIFICATIONS.has(record.classification)) issue(issues, `${path}.classification`, "Unknown SVG asset classification.");
    if (record.contentLanguage !== "en") issue(issues, `${path}.contentLanguage`, "Every currently registered SVG contains English visible text and must record contentLanguage=en.");
    if (!Array.isArray(record.visibleTextInventory)
      || !record.visibleTextInventory.length
      || record.visibleTextInventory.some((entry) => !isNonEmptyString(entry))) {
      issue(issues, `${path}.visibleTextInventory`, "Visible text inventory must enumerate every non-empty SVG <text> node.");
    }

    for (const field of ["rights", "provenance", "transformation", "localeBehavior", "localizedAlternative", "reviewStatus"]) {
      if (!isObject(record[field])) issue(issues, `${path}.${field}`, `Expected a ${field} object.`);
    }
    for (const field of ["rights", "provenance", "localeBehavior", "localizedAlternative"]) {
      const evidenceSet = record[field]?.evidenceSet;
      if (!isNonEmptyString(evidenceSet) || !evidenceSets.known.has(evidenceSet)) {
        issue(issues, `${path}.${field}.evidenceSet`, "Expected a reference to one named, exact-file evidence set.");
      } else {
        referencedEvidenceSets.add(evidenceSet);
        if (evidenceSets.invalid.has(evidenceSet)) {
          issue(issues, `${path}.${field}.evidenceSet`, `Referenced evidence set is invalid: ${evidenceSet}`);
        }
      }
    }
    if (!isNonEmptyString(record.rights?.status)
      || !isNonEmptyString(record.rights?.holder)
      || !isNonEmptyString(record.rights?.licence)) {
      issue(issues, `${path}.rights`, "Rights status, holder and licence are required.");
    }
    if (!isNonEmptyString(record.provenance?.status) || !isNonEmptyString(record.provenance?.source)) {
      issue(issues, `${path}.provenance`, "Provenance status and source are required.");
    }
    if (!isNonEmptyString(record.transformation?.status) || !isNonEmptyString(record.transformation?.description)) {
      issue(issues, `${path}.transformation`, "Transformation status and description are required.");
    }
    if (!isNonEmptyString(record.localeBehavior?.mode)
      || !DIRECTIONS.has(record.localeBehavior?.direction)
      || typeof record.localeBehavior?.explicitLanguageAnnotation !== "boolean"
      || !exactSet(record.localeBehavior?.locales, siteLocales)) {
      issue(issues, `${path}.localeBehavior`, "Locale mode, LTR/RTL direction, intrinsic-language flag and the exact site locale set are required.");
    }
    if (!REVIEW_STATES.has(record.reviewStatus?.state)
      || !isNonEmptyString(record.reviewStatus?.basis)
      || record.reviewStatus?.reviewer !== null
      || record.reviewStatus?.reviewedOn !== null) {
      issue(issues, `${path}.reviewStatus`, "This mechanical contract records either mechanically-verified or review-required, with no invented reviewer or review date.");
    }

    const absolute = resolve(root, record.path);
    const rootPrefix = resolve(root) + sep;
    let source = "";
    if (!absolute.startsWith(rootPrefix) || !existsSync(absolute)) {
      issue(issues, `${path}.path`, `Registered SVG is missing: ${record.path}`);
    } else {
      const bytes = readFileSync(absolute);
      source = bytes.toString("utf8");
      const observedHash = hash(bytes);
      if (observedHash !== record.sha256) {
        issue(issues, `${path}.sha256`, `Digest mismatch for ${record.path}: observed ${observedHash}.`);
      }
      const observedInventory = extractSvgVisibleTextInventory(source);
      if (!exactArray(record.visibleTextInventory, observedInventory)) {
        issue(issues, `${path}.visibleTextInventory`, `Visible text inventory drift for ${record.path}.`);
      }
    }

    if (source) validateClassEvidence(root, record, source, issues, path);
    validateLocalizedAlternative(root, record, siteLocales, issues, path);
    if (record.reviewStatus?.state === "mechanically-verified") {
      for (const message of mechanicalApprovalIssues(record)) issue(issues, `${path}.reviewStatus`, message);
    }

    if (issues.length === recordIssuesAtStart) {
      const naturalLanguageTextCount = record.visibleTextInventory.filter(naturalLanguage).length;
      const accepted = record.reviewStatus.state === "mechanically-verified";
      decisions.set(record.path, {
        path: record.path,
        classification: record.classification,
        sha256: record.sha256,
        visibleTextCount: record.visibleTextInventory.length,
        naturalLanguageTextCount,
        state: accepted ? "PASS" : "FAIL",
        category: accepted ? "svg-text-exact-asset-contract" : "hardcoded-svg-text",
        disposition: accepted ? "accepted_exact_asset_contract" : "blocking",
        evidence: accepted
          ? `Exact path, SHA-256, ${naturalLanguageTextCount} natural-language labels, rights/provenance, transformation, locale behavior and localized alternative match the mechanically approvable ${record.classification} contract.`
          : `Exact path, SHA-256 and ${naturalLanguageTextCount} natural-language labels are inventoried, but review remains blocking: ${record.reviewStatus.basis}`,
      });
    }
  }

  for (const evidenceSet of evidenceSets.known) {
    if (!referencedEvidenceSets.has(evidenceSet)) issue(issues, `evidenceSets.${evidenceSet}`, "Evidence set is stale and not referenced by an asset.");
  }
  return { manifestPath, issues, decisions };
}
