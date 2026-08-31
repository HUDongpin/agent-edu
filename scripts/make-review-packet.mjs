#!/usr/bin/env node

/**
 * Generate a side-by-side working aid for native-language review.
 *
 * The packet is deliberately read-only with respect to approval ledgers. It
 * discovers the current published/reviewed message surface, binds every packet
 * to exact input bytes, and reports blocked or fallback namespaces separately.
 * It never turns generated output into review evidence or changes release state.
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { assertReleaseArtifactsCurrent } from "./sync-course-public-surface.mjs";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_OUTPUT_DIRECTORY = "review-packets";
const APPROVAL_LEDGER_PATHS = [
  "i18n-reviews.json",
  "lib/codex/localization-reviews.json",
];

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function posix(value) {
  return value.split(sep).join("/");
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function walk(directory, predicate = () => true) {
  if (!existsSync(directory)) return [];
  const files = [];
  const visit = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.isFile() && predicate(full)) files.push(full);
    }
  };
  visit(directory);
  return files.sort();
}

function git(root, args, fallback) {
  try {
    return execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return fallback;
  }
}

function domainName(messagesRoot, englishPath) {
  const directory = dirname(englishPath);
  return directory === messagesRoot ? "main" : posix(relative(messagesRoot, directory));
}

function discoverMessageDomains(root) {
  const messagesRoot = join(root, "messages");
  return walk(messagesRoot, (path) => path.endsWith(`${sep}en.json`))
    .map((englishPath) => ({
      name: domainName(messagesRoot, englishPath),
      directory: dirname(englishPath),
      englishPath,
    }));
}

export function flattenLeaves(value, prefix = "", leaves = new Map()) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => flattenLeaves(entry, `${prefix}[${index}]`, leaves));
    return leaves;
  }
  if (value && typeof value === "object") {
    for (const key of Object.keys(value).sort()) {
      flattenLeaves(value[key], prefix ? `${prefix}.${key}` : key, leaves);
    }
    return leaves;
  }
  leaves.set(prefix, value);
  return leaves;
}

function pluralPlan(domain, locale, englishLeaves) {
  if (domain !== "widgets") return null;
  const candidates = new Map();
  for (const key of englishLeaves.keys()) {
    const match = /^(.*)\.(zero|one|two|few|many|other)$/.exec(key);
    if (!match) continue;
    if (!candidates.has(match[1])) candidates.set(match[1], new Set());
    candidates.get(match[1]).add(match[2]);
  }
  const stems = new Set(
    [...candidates]
      .filter(([, categories]) => categories.has("one") && categories.has("other"))
      .map(([stem]) => stem),
  );
  const categories = new Set(["other"]);
  const rules = new Intl.PluralRules(locale);
  for (let value = 0; value <= 200; value += 1) categories.add(rules.select(value));
  return { stems, categories };
}

function expectedKeys(domain, locale, englishLeaves) {
  const plural = pluralPlan(domain, locale, englishLeaves);
  if (!plural) return new Set(englishLeaves.keys());
  const expected = new Set();
  for (const key of englishLeaves.keys()) {
    const match = /^(.*)\.(zero|one|two|few|many|other)$/.exec(key);
    if (!match || !plural.stems.has(match[1])) expected.add(key);
  }
  for (const stem of plural.stems) {
    for (const category of plural.categories) expected.add(`${stem}.${category}`);
  }
  return expected;
}

function englishReference(domain, key, englishLeaves) {
  if (englishLeaves.has(key)) return englishLeaves.get(key);
  if (domain === "widgets") {
    const match = /^(.*)\.(zero|one|two|few|many|other)$/.exec(key);
    if (match) return englishLeaves.get(`${match[1]}.other`);
  }
  return undefined;
}

function placeholders(value) {
  if (typeof value !== "string") return [];
  return [...value.matchAll(/(?<!\{)\{([A-Za-z_$][\w$]*)\}(?!\})/g)]
    .map((match) => match[1])
    .sort();
}

function markerSignature(value) {
  if (typeof value !== "string") return { bold: 0, italic: 0 };
  const bold = (value.match(/\*\*/g) ?? []).length;
  const withoutBold = value.replace(/\*\*/g, "");
  return { bold, italic: (withoutBold.match(/\*/g) ?? []).length };
}

function scalarType(value) {
  if (value === null) return "null";
  return typeof value;
}

function printable(value) {
  if (value === undefined) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function markdownCell(value) {
  return printable(value)
    .replaceAll("|", "\\|")
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n")
    .replaceAll("\n", " <br> ");
}

function englishWordCount(values) {
  return values.reduce((total, value) => {
    if (typeof value !== "string") return total;
    return total + (value.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) ?? []).length;
  }, 0);
}

function groupDepth(domain) {
  if (domain === "main") return 1;
  if (domain === "handbook") return 3;
  if (domain === "widgets") return 2;
  return 2;
}

function groupRows(rows, domain) {
  const groups = new Map();
  const depth = groupDepth(domain);
  for (const row of rows) {
    const prefix = row.key.split(".").slice(0, depth).join(".");
    if (!groups.has(prefix)) groups.set(prefix, []);
    groups.get(prefix).push(row);
  }
  return groups;
}

function approvedException(exceptions, domain, key) {
  return exceptions.find((entry) => entry.domain === domain && entry.key === key);
}

function approvalStates(root, locale) {
  const siteLedger = readJson(join(root, "i18n-reviews.json"));
  const codexLedger = readJson(join(root, "lib", "codex", "localization-reviews.json"));
  return {
    site: siteLedger.locales?.[locale]?.status ?? "missing",
    codex: codexLedger.locales?.[locale]?.status ?? "missing",
  };
}

export function reviewPacketSnapshot(root = PROJECT_ROOT) {
  const inputs = [
    ...walk(join(root, "messages"), (path) => path.endsWith(".json")),
    ...[
      "config/course-release-manifest.json",
      "config/course-release-surface.json",
      "i18n-exceptions.json",
      ...APPROVAL_LEDGER_PATHS,
    ].map((path) => join(root, path)),
  ].filter((path) => existsSync(path));
  const records = inputs.sort().map((path) => ({
    path: posix(relative(root, path)),
    sha256: sha256(readFileSync(path)),
  }));
  const contentHash = sha256(JSON.stringify(records));
  const commit = git(root, ["rev-parse", "HEAD"], "NO_GIT");
  const dirty = git(root, ["status", "--porcelain", "--untracked-files=normal"], "") !== "";
  return {
    id: `${commit.slice(0, 12)}-${contentHash.slice(0, 16)}`,
    commit,
    contentHash,
    dirty,
    records,
  };
}

export function discoverReviewScope(locale, root = PROJECT_ROOT) {
  const { releaseSurface } = assertReleaseArtifactsCurrent({ projectRoot: root });
  const siteLocales = releaseSurface.siteLocales ?? [];
  if (locale === "en" || !siteLocales.includes(locale)) {
    throw new Error(`Review locale must be one of: ${siteLocales.filter((item) => item !== "en").join(", ")}`);
  }
  const courseById = new Map((releaseSurface.courses ?? []).map((course) => [course.id, course]));
  const included = [];
  const excluded = [];
  for (const domain of discoverMessageDomains(root)) {
    const course = courseById.get(domain.name);
    if (course && course.state !== "published") {
      excluded.push({
        domain: domain.name,
        reason: `release state ${course.state}`,
      });
      continue;
    }
    if (course && !course.reviewedContentLocales.includes(locale)) {
      excluded.push({
        domain: domain.name,
        reason: `reviewed content excludes ${locale}; explicit fallback is ${course.fallbackLocale ?? "none"}`,
      });
      continue;
    }
    included.push(domain);
  }
  return {
    locale,
    siteLocales,
    included,
    excluded,
    releaseSurface,
    approvals: approvalStates(root, locale),
  };
}

function rowsForDomain(domain, locale, exceptions) {
  const englishLeaves = flattenLeaves(readJson(domain.englishPath));
  const targetPath = join(domain.directory, `${locale}.json`);
  const targetLeaves = existsSync(targetPath) ? flattenLeaves(readJson(targetPath)) : new Map();
  const expected = expectedKeys(domain.name, locale, englishLeaves);
  const rows = [];

  for (const key of [...expected].sort()) {
    const source = englishReference(domain.name, key, englishLeaves);
    const target = targetLeaves.get(key);
    const exception = approvedException(exceptions, domain.name, key);
    let status = "provided";
    if (!targetLeaves.has(key)) status = "MISSING";
    else if (scalarType(source) !== scalarType(target)) status = "TYPE MISMATCH";
    else if (typeof source === "string" && typeof target === "string") {
      if (JSON.stringify(placeholders(source)) !== JSON.stringify(placeholders(target))) {
        status = "PLACEHOLDER MISMATCH";
      } else if (JSON.stringify(markerSignature(source)) !== JSON.stringify(markerSignature(target))) {
        status = "MARKER MISMATCH";
      } else if (target === source) {
        status = exception ? `same (approved: ${exception.id})` : "REVIEW — identical to English";
      }
    }
    rows.push({ key, source, target, status });
  }

  for (const key of [...targetLeaves.keys()].filter((key) => !expected.has(key)).sort()) {
    rows.push({ key, source: undefined, target: targetLeaves.get(key), status: "EXTRA" });
  }

  return {
    name: domain.name,
    englishPath: domain.englishPath,
    targetPath,
    englishLeaves,
    targetLeaves,
    expected,
    rows,
  };
}

function isFlagged(status) {
  return status !== "provided" && !status.startsWith("same (approved:");
}

export function buildReviewPacket(locale, { root = PROJECT_ROOT } = {}) {
  const scope = discoverReviewScope(locale, root);
  const exceptionDocument = readJson(join(root, "i18n-exceptions.json"));
  const exceptions = Array.isArray(exceptionDocument.exceptions) ? exceptionDocument.exceptions : [];
  const snapshot = reviewPacketSnapshot(root);
  const domains = scope.included.map((domain) => rowsForDomain(domain, locale, exceptions));
  const flagged = domains.flatMap((domain) => domain.rows
    .filter((row) => isFlagged(row.status))
    .map((row) => `${domain.name} · \`${row.key}\` · ${row.status}`));
  const sourceWords = englishWordCount(
    domains.flatMap((domain) => [...domain.englishLeaves.values()]),
  );
  const lines = [
    `# Native review working packet — \`${locale}\``,
    "",
    "> Generated working aid only. This file is not review evidence, does not approve a",
    "> translation, and does not change `i18n-reviews.json`,",
    "> `lib/codex/localization-reviews.json`, or any release registry state.",
    "",
    `- Packet input id: \`${snapshot.id}\``,
    `- Git commit at generation: \`${snapshot.commit}\``,
    `- Exact review-input hash: \`${snapshot.contentHash}\``,
    `- Source tree at generation: **${snapshot.dirty ? "dirty" : "clean"}**`,
    `- Site native-review ledger before generation: **${scope.approvals.site}**`,
    `- Codex exact-bundle review before generation: **${scope.approvals.codex}**`,
    "",
    "Regenerate after any message, exception, release-surface, or approval-ledger change.",
    "A reviewer conclusion must still bind to the official audit snapshot and required",
    "rendered/browser evidence; this packet cannot create that conclusion.",
    "",
    "## Scope summary",
    "",
    "| Namespace | Required rows | Present target rows | Flagged rows | English source words |",
    "|---|---:|---:|---:|---:|",
    ...domains.map((domain) => {
      const domainFlags = domain.rows.filter((row) => isFlagged(row.status)).length;
      return `| \`${domain.name}\` | ${domain.expected.size} | ${domain.targetLeaves.size} | ${domainFlags} | ${englishWordCount([...domain.englishLeaves.values()])} |`;
    }),
    `| **Total** | **${domains.reduce((sum, domain) => sum + domain.expected.size, 0)}** | **${domains.reduce((sum, domain) => sum + domain.targetLeaves.size, 0)}** | **${flagged.length}** | **${sourceWords}** |`,
    "",
    "## Namespaces not in this packet",
    "",
    "These exclusions are release/fallback boundaries, not silent approvals:",
    "",
    ...(scope.excluded.length
      ? scope.excluded.map((entry) => `- \`${entry.domain}\`: ${entry.reason}.`)
      : ["- None."]),
    "",
    "## Rows requiring attention",
    "",
    ...(flagged.length ? flagged.map((entry) => `- ${entry}`) : ["No automatically flagged rows."]),
  ];

  for (const domain of domains) {
    lines.push("", `## Namespace: \`${domain.name}\``, "");
    for (const [prefix, rows] of groupRows(domain.rows, domain.name)) {
      lines.push(`### \`${prefix}\``, "");
      lines.push(`| Key | English | ${locale} | Automatic note |`);
      lines.push("|---|---|---|---|");
      for (const row of rows) {
        lines.push(
          `| \`${row.key}\` | ${markdownCell(row.source)} | ${markdownCell(row.target)} | ${row.status} |`,
        );
      }
      lines.push("");
    }
  }

  return {
    locale,
    packet: `${lines.join("\n")}\n`,
    snapshot,
    domains: domains.map((domain) => domain.name),
    excluded: scope.excluded,
    flaggedCount: flagged.length,
    sourceWords,
  };
}

function ledgerDigests(root) {
  return Object.fromEntries(APPROVAL_LEDGER_PATHS.map((path) => [
    path,
    sha256(readFileSync(join(root, path))),
  ]));
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log("Usage: npm run review:packet -- [locale ...] [--out=review-packets]");
    return;
  }
  const unknownFlags = args.filter((arg) => arg.startsWith("-") && !arg.startsWith("--out="));
  if (unknownFlags.length) throw new Error(`Unknown option(s): ${unknownFlags.join(", ")}`);
  const outputArg = args.find((arg) => arg.startsWith("--out="));
  const outputDirectory = outputArg?.slice("--out=".length) || DEFAULT_OUTPUT_DIRECTORY;
  const { releaseSurface } = assertReleaseArtifactsCurrent({ projectRoot: PROJECT_ROOT });
  const available = releaseSurface.siteLocales.filter((locale) => locale !== "en");
  const requested = args.filter((arg) => !arg.startsWith("-"));
  const locales = requested.length ? requested : available;
  const unknownLocales = locales.filter((locale) => !available.includes(locale));
  if (unknownLocales.length) {
    throw new Error(`Unknown review locale(s): ${unknownLocales.join(", ")}; expected ${available.join(", ")}`);
  }

  const approvalsBefore = ledgerDigests(PROJECT_ROOT);
  const absoluteOutput = resolve(PROJECT_ROOT, outputDirectory);
  if (
    absoluteOutput === PROJECT_ROOT
    || !absoluteOutput.startsWith(`${PROJECT_ROOT}${sep}`)
  ) {
    throw new Error("Review packet output must be a child of the project directory");
  }
  mkdirSync(absoluteOutput, { recursive: true });
  for (const locale of locales) {
    const result = buildReviewPacket(locale, { root: PROJECT_ROOT });
    const path = join(absoluteOutput, `${locale}.md`);
    writeFileSync(path, result.packet, "utf8");
    console.log(
      `review packet: ${locale} — ${result.domains.length} namespaces, `
      + `${result.sourceWords} English source words, ${result.flaggedCount} flagged rows, `
      + `input ${result.snapshot.id}`,
    );
  }
  const approvalsAfter = ledgerDigests(PROJECT_ROOT);
  if (JSON.stringify(approvalsBefore) !== JSON.stringify(approvalsAfter)) {
    throw new Error("Review packet generation changed an approval ledger");
  }
  console.log(`review packet: wrote ${locales.length} generated aid(s) below ${outputDirectory}/`);
}

const invoked = process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (invoked) {
  try {
    main();
  } catch (error) {
    console.error(`review packet: FAIL — ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
