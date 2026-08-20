/**
 * Auditable, fail-closed release evidence checks.
 *
 * Daily CI deliberately does not run this command: external evidence can stay
 * pending while ordinary engineering checks remain useful. Release candidates
 * run `npm run release:check` explicitly and may pass only when both the
 * deterministic message checks and every signed external gate pass.
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const LOCALES = ["en", "zh-Hans", "zh-Hant", "ar", "de", "es", "fr", "ja", "ko"];
export const NATIVE_REVIEW_LOCALES = ["zh-Hans", "zh-Hant", "ar", "de", "es", "fr", "ja", "ko"];

export const MESSAGE_CATALOGS = [
  { id: "site", directory: "messages" },
  { id: "handbook", directory: "messages/handbook" },
  { id: "widgets", directory: "messages/widgets" },
];

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STATUS = new Set(["pending", "pass", "fail"]);
const PLURAL_CATEGORIES = ["zero", "one", "two", "few", "many", "other"];
const PLURAL_SUFFIX = new RegExp(`\\.(${PLURAL_CATEGORIES.join("|")})$`);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const SAFE_EVIDENCE_REF = /^(?:docs\/release\/evidence\/[A-Za-z0-9._/-]+|(?:review-record|matrix-record|canary-record|billing-record|csp-record|github-run|vercel-deployment):[A-Za-z0-9._/-]+)$/;

const MATRIX_WIDTHS = [390, 979, 980, 1440];
const MATRIX_THEMES = ["light", "dark"];
const MATRIX_CHECKS = [
  "aria-orientation-matches-layout",
  "arrow-left-next-visual-item",
  "arrow-right-previous-visual-item",
  "home-end-first-last",
  "active-tab-scrolls-into-view",
  "no-page-horizontal-overflow",
  "code-url-model-identifiers-remain-ltr",
];
const PROVIDER_STEPS = ["models", "stage1", "preview3", "flashEval28"];
const PROVIDER_RECONCILIATIONS = ["pricing", "modelId", "usage", "billing", "cors", "credentialLifecycle"];
const REQUIRED_CHECK_NAMES = ["quality", "smoke-chromium"];
const SAFE_SCHEMA_SEGMENTS = new Set([
  ...LOCALES,
  "schemaVersion", "releaseId", "status", "updatedAt", "sensitiveEvidencePolicy", "localization", "gates",
  "credentialsStored", "signedUrlsStored", "providerRawBodiesStored",
  "sourceLocale", "requiredLocales", "nativeReviewLocales", "sameAsEnglishAllowlist",
  "catalog", "key", "locales", "reason",
  "nativeReviews", "reviews", "arabicRtlMatrix", "keyboardChecks", "cases",
  "id", "width", "theme", "expectedOrientation", "result",
  "providerCanary", "credentialPolicy", "officialPricingUrl", "steps", "reconciliations",
  ...PROVIDER_STEPS,
  ...PROVIDER_RECONCILIATIONS,
  "vercelPreviewCsp", "requiredHeaders", "reportOnly", "enforced", "stages",
  "githubReadiness", "requiredCheckNames", "requiredChecks", "stableRuns", "sequence",
  "checkedAt", "evidenceRefs", "note",
]);

const SECRET_PATTERNS = [
  ["private-key", new RegExp(["-----BEGIN ", "(?:RSA |EC |OPENSSH )?", "PRIVATE KEY-----"].join(""), "g")],
  ["provider-key", new RegExp(["(?:^|[^A-Za-z0-9])", "sk", "-", "[A-Za-z0-9_-]{20,}"].join(""), "g")],
  ["github-token", new RegExp(["(?:^|[^A-Za-z0-9])", "gh", "[pousr]_", "[A-Za-z0-9]{30,}"].join(""), "g")],
  ["bearer-token", new RegExp(["Bearer\\s+", "[A-Za-z0-9._~+/-]{16,}"].join(""), "gi")],
];

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeSegment(value) {
  return SAFE_SCHEMA_SEGMENTS.has(value) ? value : "[field]";
}

function safeMessageKey(value) {
  return /^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)+$/.test(value) && value.length <= 180
    ? value
    : "[message-key]";
}

function childPath(path, key) {
  return `${path}.${safeSegment(String(key))}`;
}

function addIssue(issues, code, path, message) {
  issues.push({ code, path, message });
}

function validateExactKeys(value, expected, path, issues) {
  if (isObject(value) && !sameMembers(Object.keys(value), expected)) {
    addIssue(issues, "schema-keys", path, `must contain exactly: ${expected.join(", ")}`);
  }
}

function sameMembers(actual, expected) {
  return Array.isArray(actual)
    && actual.length === expected.length
    && [...actual].sort().join("\u0000") === [...expected].sort().join("\u0000");
}

function isIsoDate(value) {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function isIsoInstant(value) {
  if (typeof value !== "string" || !ISO_INSTANT.test(value)) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
}

function expectedOrientation(width) {
  return width >= 980 ? "vertical" : "horizontal";
}

function statusOf(records) {
  const statuses = records.map((record) => record?.status);
  if (statuses.includes("fail")) return "fail";
  return statuses.length > 0 && statuses.every((status) => status === "pass") ? "pass" : "pending";
}

function validateStatus(value, path, issues) {
  if (!STATUS.has(value)) addIssue(issues, "schema-status", path, "must be pending, pass, or fail");
}

function validateEvidenceRefs(value, path, issues) {
  if (!Array.isArray(value)) {
    addIssue(issues, "schema-evidence", path, "must be an array of non-sensitive evidence references");
    return;
  }
  if (new Set(value).size !== value.length) {
    addIssue(issues, "schema-evidence", path, "must not contain duplicate evidence references");
  }
  for (let index = 0; index < value.length; index += 1) {
    const ref = value[index];
    if (
      typeof ref !== "string"
      || ref.length > 180
      || ref.includes("..")
      || !SAFE_EVIDENCE_REF.test(ref)
    ) {
      addIssue(
        issues,
        "schema-evidence",
        `${path}[${index}]`,
        "must be a relative evidence path or an approved opaque record id; URLs are not accepted",
      );
    }
  }
}

function validateEvidenceRecord(value, path, issues) {
  if (!isObject(value)) {
    addIssue(issues, "schema-evidence", path, "must be an evidence record");
    return;
  }
  validateExactKeys(value, ["status", "checkedAt", "evidenceRefs", "note"], path, issues);
  validateStatus(value.status, `${path}.status`, issues);
  validateEvidenceRefs(value.evidenceRefs, `${path}.evidenceRefs`, issues);
  if (typeof value.note !== "string" || value.note.trim().length < 3 || value.note.length > 300) {
    addIssue(issues, "schema-note", `${path}.note`, "must be a concise non-sensitive explanation");
  }

  if (value.status === "pending") {
    if (value.checkedAt !== null) {
      addIssue(issues, "schema-date", `${path}.checkedAt`, "must be null while evidence is pending");
    }
    if (Array.isArray(value.evidenceRefs) && value.evidenceRefs.length > 0) {
      addIssue(issues, "schema-evidence", `${path}.evidenceRefs`, "must be empty while evidence is pending");
    }
    return;
  }

  if (!isIsoInstant(value.checkedAt)) {
    addIssue(issues, "schema-date", `${path}.checkedAt`, "must be a canonical UTC ISO instant for pass or fail");
  }
  if (Array.isArray(value.evidenceRefs) && value.evidenceRefs.length === 0) {
    addIssue(issues, "schema-evidence", `${path}.evidenceRefs`, "must contain evidence for pass or fail");
  }
}

function validateRecordMap(value, keys, path, issues) {
  if (!isObject(value)) {
    addIssue(issues, "schema-object", path, "must be an object");
    return [];
  }
  if (!sameMembers(Object.keys(value), keys)) {
    addIssue(issues, "schema-keys", path, `must contain exactly: ${keys.join(", ")}`);
  }
  const records = [];
  for (const key of keys) {
    validateEvidenceRecord(value[key], childPath(path, key), issues);
    if (isObject(value[key])) records.push(value[key]);
  }
  return records;
}

function validateGroupStatus(group, records, path, issues) {
  if (!isObject(group)) return;
  validateStatus(group.status, `${path}.status`, issues);
  const expected = statusOf(records);
  if (STATUS.has(group.status) && group.status !== expected) {
    addIssue(issues, "schema-aggregate", `${path}.status`, `must equal the child evidence status: ${expected}`);
  }
}

function validateAllowlist(value, issues) {
  const path = "$.localization.sameAsEnglishAllowlist";
  if (!Array.isArray(value)) {
    addIssue(issues, "schema-allowlist", path, "must be an array");
    return;
  }
  const seen = new Set();
  for (let index = 0; index < value.length; index += 1) {
    const item = value[index];
    const at = `${path}[${index}]`;
    if (!isObject(item)) {
      addIssue(issues, "schema-allowlist", at, "must be an allowlist entry");
      continue;
    }
    validateExactKeys(item, ["catalog", "key", "locales", "reason"], at, issues);
    if (!MESSAGE_CATALOGS.some((catalog) => catalog.id === item.catalog)) {
      addIssue(issues, "schema-allowlist", `${at}.catalog`, "must name a configured message catalog");
    }
    if (typeof item.key !== "string" || !/^[A-Za-z0-9_.-]+$/.test(item.key)) {
      addIssue(issues, "schema-allowlist", `${at}.key`, "must be one exact translation key");
    }
    if (
      !Array.isArray(item.locales)
      || item.locales.length === 0
      || !item.locales.every((locale) => NATIVE_REVIEW_LOCALES.includes(locale))
      || new Set(item.locales).size !== item.locales.length
    ) {
      addIssue(issues, "schema-allowlist", `${at}.locales`, "must be unique non-English locale codes");
    }
    if (typeof item.reason !== "string" || item.reason.trim().length < 8 || item.reason.length > 180) {
      addIssue(issues, "schema-allowlist", `${at}.reason`, "must explain why identical text is correct");
    }
    if (typeof item.catalog === "string" && typeof item.key === "string" && Array.isArray(item.locales)) {
      for (const locale of item.locales) {
        const identity = `${item.catalog}\u0000${locale}\u0000${item.key}`;
        if (seen.has(identity)) {
          addIssue(issues, "schema-allowlist", at, "duplicates an earlier catalog, locale, and key entry");
        }
        seen.add(identity);
      }
    }
  }
}

/**
 * Return only finding categories and safe object paths. Matched values are
 * never returned, so a failing release report cannot become a secret leak.
 */
export function findSensitiveEvidence(value) {
  const findings = [];
  const visit = (current, path) => {
    if (typeof current === "string") {
      for (const [id, pattern] of SECRET_PATTERNS) {
        pattern.lastIndex = 0;
        if (pattern.test(current)) findings.push({ code: id, path });
      }
      if (/https?:\/\/[^\s?#]+\?[^\s#]*/i.test(current)) {
        findings.push({ code: "url-with-query", path });
      }
      return;
    }
    if (Array.isArray(current)) {
      current.forEach((item, index) => visit(item, `${path}[${index}]`));
      return;
    }
    if (!isObject(current)) return;
    for (const [key, item] of Object.entries(current)) {
      const nextPath = childPath(path, key);
      const sensitiveField = /^(?:authorization|cookie|prompt|reply|rawbody|rawresponse|providerbody|providerresponse|providerrawbody|providerrawresponse|signedurl|apikey|secret|token|credential|credentialvalue)$/i.test(key);
      if (sensitiveField && item !== false && item !== null && item !== "") {
        findings.push({ code: "sensitive-field", path: nextPath });
      }
      visit(item, nextPath);
    }
  };
  visit(value, "$");
  return findings;
}

/** Redact common credential shapes and every URL query before display. */
export function redactSensitiveText(value) {
  let output = String(value);
  for (const [, pattern] of SECRET_PATTERNS) {
    pattern.lastIndex = 0;
    output = output.replace(pattern, "[REDACTED]");
  }
  output = output.replace(/https?:\/\/[^\s?#]+\?[^\s#]*/gi, (url) => `${url.slice(0, url.indexOf("?"))}?[REDACTED]`);
  return output;
}

/** Validate the release-evidence schema without reading the filesystem. */
export function validateReleaseReadiness(config) {
  const issues = [];
  if (!isObject(config)) {
    addIssue(issues, "schema-root", "$", "must be a JSON object");
    return issues;
  }
  validateExactKeys(
    config,
    ["schemaVersion", "releaseId", "status", "updatedAt", "sensitiveEvidencePolicy", "localization", "gates"],
    "$",
    issues,
  );

  if (config.schemaVersion !== 1) addIssue(issues, "schema-version", "$.schemaVersion", "must equal 1");
  if (typeof config.releaseId !== "string" || !/^[a-z0-9][a-z0-9-]{2,63}$/.test(config.releaseId)) {
    addIssue(issues, "schema-release", "$.releaseId", "must be a stable lowercase release id");
  }
  validateStatus(config.status, "$.status", issues);
  if (!isIsoDate(config.updatedAt)) addIssue(issues, "schema-date", "$.updatedAt", "must be YYYY-MM-DD");

  const policy = config.sensitiveEvidencePolicy;
  if (
    !isObject(policy)
    || policy.credentialsStored !== false
    || policy.signedUrlsStored !== false
    || policy.providerRawBodiesStored !== false
  ) {
    addIssue(
      issues,
      "schema-sensitive-policy",
      "$.sensitiveEvidencePolicy",
      "must explicitly prohibit stored credentials, signed URLs, and Provider raw bodies",
    );
  } else {
    validateExactKeys(
      policy,
      ["credentialsStored", "signedUrlsStored", "providerRawBodiesStored"],
      "$.sensitiveEvidencePolicy",
      issues,
    );
  }

  const localization = config.localization;
  if (!isObject(localization)) {
    addIssue(issues, "schema-localization", "$.localization", "must be an object");
  } else {
    validateExactKeys(
      localization,
      ["sourceLocale", "requiredLocales", "nativeReviewLocales", "sameAsEnglishAllowlist"],
      "$.localization",
      issues,
    );
    if (localization.sourceLocale !== "en") {
      addIssue(issues, "schema-localization", "$.localization.sourceLocale", "must be en");
    }
    if (!sameMembers(localization.requiredLocales, LOCALES)) {
      addIssue(issues, "schema-localization", "$.localization.requiredLocales", "must list the exact nine locales");
    }
    if (!sameMembers(localization.nativeReviewLocales, NATIVE_REVIEW_LOCALES)) {
      addIssue(
        issues,
        "schema-localization",
        "$.localization.nativeReviewLocales",
        "must list the exact eight non-English locales",
      );
    }
    validateAllowlist(localization.sameAsEnglishAllowlist, issues);
  }

  const gates = config.gates;
  if (!isObject(gates)) {
    addIssue(issues, "schema-gates", "$.gates", "must be an object");
    return [...issues, ...findSensitiveEvidence(config).map((finding) => ({
      ...finding,
      message: "sensitive evidence is forbidden and has been redacted",
    }))];
  }
  validateExactKeys(
    gates,
    ["nativeReviews", "arabicRtlMatrix", "providerCanary", "vercelPreviewCsp", "githubReadiness"],
    "$.gates",
    issues,
  );

  const groupStatuses = [];

  const native = gates.nativeReviews;
  if (!isObject(native)) {
    addIssue(issues, "schema-native-review", "$.gates.nativeReviews", "must be an object");
  } else {
    validateExactKeys(native, ["status", "reviews"], "$.gates.nativeReviews", issues);
    const records = validateRecordMap(
      native.reviews,
      NATIVE_REVIEW_LOCALES,
      "$.gates.nativeReviews.reviews",
      issues,
    );
    validateGroupStatus(native, records, "$.gates.nativeReviews", issues);
    groupStatuses.push(native);
  }

  const arabic = gates.arabicRtlMatrix;
  if (!isObject(arabic)) {
    addIssue(issues, "schema-arabic", "$.gates.arabicRtlMatrix", "must be an object");
  } else {
    validateExactKeys(
      arabic,
      ["status", "keyboardChecks", "cases"],
      "$.gates.arabicRtlMatrix",
      issues,
    );
    if (!sameMembers(arabic.keyboardChecks, MATRIX_CHECKS)) {
      addIssue(
        issues,
        "schema-arabic",
        "$.gates.arabicRtlMatrix.keyboardChecks",
        "must contain the full RTL keyboard and visibility checklist",
      );
    }
    const expectedIds = MATRIX_WIDTHS.flatMap((width) =>
      MATRIX_THEMES.map((theme) => `${width}-${theme}`));
    const cases = Array.isArray(arabic.cases) ? arabic.cases : [];
    if (!Array.isArray(arabic.cases) || !sameMembers(cases.map((item) => item?.id), expectedIds)) {
      addIssue(
        issues,
        "schema-arabic",
        "$.gates.arabicRtlMatrix.cases",
        "must contain 390, 979, 980, and 1440 widths in light and dark themes",
      );
    }
    const records = [];
    for (let index = 0; index < cases.length; index += 1) {
      const item = cases[index];
      const path = `$.gates.arabicRtlMatrix.cases[${index}]`;
      if (!isObject(item)) {
        addIssue(issues, "schema-arabic", path, "must be a matrix case");
        continue;
      }
      validateExactKeys(
        item,
        ["id", "width", "theme", "expectedOrientation", "result"],
        path,
        issues,
      );
      if (!MATRIX_WIDTHS.includes(item.width)) addIssue(issues, "schema-arabic", `${path}.width`, "is not a required width");
      if (!MATRIX_THEMES.includes(item.theme)) addIssue(issues, "schema-arabic", `${path}.theme`, "must be light or dark");
      if (item.expectedOrientation !== expectedOrientation(item.width)) {
        addIssue(issues, "schema-arabic", `${path}.expectedOrientation`, "does not match the 980px breakpoint");
      }
      validateEvidenceRecord(item.result, `${path}.result`, issues);
      if (isObject(item.result)) records.push(item.result);
    }
    validateGroupStatus(arabic, records, "$.gates.arabicRtlMatrix", issues);
    groupStatuses.push(arabic);
  }

  const provider = gates.providerCanary;
  if (!isObject(provider)) {
    addIssue(issues, "schema-provider", "$.gates.providerCanary", "must be an object");
  } else {
    validateExactKeys(
      provider,
      ["status", "credentialPolicy", "officialPricingUrl", "steps", "reconciliations"],
      "$.gates.providerCanary",
      issues,
    );
    if (provider.credentialPolicy !== "independent-low-limit-revocable-never-recorded") {
      addIssue(
        issues,
        "schema-provider",
        "$.gates.providerCanary.credentialPolicy",
        "must require an independent, low-limit, revocable credential that is never recorded",
      );
    }
    if (provider.officialPricingUrl !== "https://api-docs.deepseek.com/quick_start/pricing/") {
      addIssue(issues, "schema-provider", "$.gates.providerCanary.officialPricingUrl", "must be the canonical public pricing page without a query");
    }
    const records = [
      ...validateRecordMap(provider.steps, PROVIDER_STEPS, "$.gates.providerCanary.steps", issues),
      ...validateRecordMap(
        provider.reconciliations,
        PROVIDER_RECONCILIATIONS,
        "$.gates.providerCanary.reconciliations",
        issues,
      ),
    ];
    validateGroupStatus(provider, records, "$.gates.providerCanary", issues);
    groupStatuses.push(provider);
  }

  const csp = gates.vercelPreviewCsp;
  if (!isObject(csp)) {
    addIssue(issues, "schema-csp", "$.gates.vercelPreviewCsp", "must be an object");
  } else {
    validateExactKeys(
      csp,
      ["status", "requiredHeaders", "stages"],
      "$.gates.vercelPreviewCsp",
      issues,
    );
    if (
      !isObject(csp.requiredHeaders)
      || csp.requiredHeaders.reportOnly !== "content-security-policy-report-only"
      || csp.requiredHeaders.enforced !== "content-security-policy"
    ) {
      addIssue(issues, "schema-csp", "$.gates.vercelPreviewCsp.requiredHeaders", "must name both report-only and enforced response headers");
    } else {
      validateExactKeys(
        csp.requiredHeaders,
        ["reportOnly", "enforced"],
        "$.gates.vercelPreviewCsp.requiredHeaders",
        issues,
      );
    }
    const records = validateRecordMap(
      csp.stages,
      ["reportOnly", "enforced"],
      "$.gates.vercelPreviewCsp.stages",
      issues,
    );
    validateGroupStatus(csp, records, "$.gates.vercelPreviewCsp", issues);
    groupStatuses.push(csp);
  }

  const github = gates.githubReadiness;
  if (!isObject(github)) {
    addIssue(issues, "schema-github", "$.gates.githubReadiness", "must be an object");
  } else {
    validateExactKeys(
      github,
      ["status", "requiredCheckNames", "requiredChecks", "stableRuns"],
      "$.gates.githubReadiness",
      issues,
    );
    if (!sameMembers(github.requiredCheckNames, REQUIRED_CHECK_NAMES)) {
      addIssue(issues, "schema-github", "$.gates.githubReadiness.requiredCheckNames", "must name the two CI jobs");
    }
    const records = [];
    validateEvidenceRecord(github.requiredChecks, "$.gates.githubReadiness.requiredChecks", issues);
    if (isObject(github.requiredChecks)) records.push(github.requiredChecks);
    const runs = Array.isArray(github.stableRuns) ? github.stableRuns : [];
    if (!Array.isArray(github.stableRuns) || !sameMembers(runs.map((run) => run?.sequence), [1, 2, 3])) {
      addIssue(issues, "schema-github", "$.gates.githubReadiness.stableRuns", "must contain exactly three ordered green-run records");
    }
    for (let index = 0; index < runs.length; index += 1) {
      if (isObject(runs[index])) {
        validateExactKeys(
          runs[index],
          ["sequence", "result"],
          `$.gates.githubReadiness.stableRuns[${index}]`,
          issues,
        );
      }
      validateEvidenceRecord(runs[index]?.result, `$.gates.githubReadiness.stableRuns[${index}].result`, issues);
      if (isObject(runs[index]?.result)) records.push(runs[index].result);
    }
    validateGroupStatus(github, records, "$.gates.githubReadiness", issues);
    groupStatuses.push(github);
  }

  if (STATUS.has(config.status)) {
    const expected = statusOf(groupStatuses);
    if (config.status !== expected) {
      addIssue(issues, "schema-aggregate", "$.status", `must equal the external-gate status: ${expected}`);
    }
  }

  for (const finding of findSensitiveEvidence(config)) {
    addIssue(
      issues,
      `sensitive-${finding.code}`,
      finding.path,
      "sensitive evidence is forbidden and has been redacted",
    );
  }
  return issues;
}

function placeholders(value) {
  return [...String(value).matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)]
    .map((match) => match[1])
    .sort();
}

function pluralStems(source) {
  const stems = new Set();
  for (const key of Object.keys(source)) {
    const match = PLURAL_SUFFIX.exec(key);
    if (!match) continue;
    const stem = key.slice(0, match.index);
    if (`${stem}.one` in source && `${stem}.other` in source) stems.add(stem);
  }
  return stems;
}

function pluralCategories(locale) {
  const rules = new Intl.PluralRules(locale);
  const categories = new Set(["other"]);
  // Match the interactive course's integer counters. Some CLDR locales expose
  // categories only for compact/scientific magnitudes that these widgets can
  // never produce; requiring those would invent unreachable UI strings.
  for (let value = 0; value <= 200; value += 1) categories.add(rules.select(value));
  return categories;
}

function allowlistLookup(entries) {
  const lookup = new Set();
  if (!Array.isArray(entries)) return lookup;
  for (const entry of entries) {
    if (!isObject(entry) || !Array.isArray(entry.locales)) continue;
    for (const locale of entry.locales) {
      lookup.add(`${entry.catalog}\u0000${locale}\u0000${entry.key}`);
    }
  }
  return lookup;
}

function counterpart(source, key, stems) {
  if (key in source) return source[key];
  const match = PLURAL_SUFFIX.exec(key);
  if (!match) return undefined;
  const stem = key.slice(0, match.index);
  return stems.has(stem) ? source[`${stem}.other`] : undefined;
}

/**
 * Validate already-parsed message fixture objects. This is intentionally pure
 * so tests never depend on the production config being ready.
 */
export function validateMessageCatalogs(catalogs, sameAsEnglishAllowlist = []) {
  const issues = [];
  const summaries = [];
  const allowlist = allowlistLookup(sameAsEnglishAllowlist);

  for (const descriptor of MESSAGE_CATALOGS) {
    const catalog = catalogs?.[descriptor.id];
    const source = catalog?.en;
    if (!isObject(source)) {
      addIssue(issues, "catalog-source", `messages.${descriptor.id}.en`, "English source catalog is missing or invalid");
      continue;
    }
    const stems = pluralStems(source);
    const pluralSourceKeys = new Set(
      [...stems].flatMap((stem) => PLURAL_CATEGORIES.map((category) => `${stem}.${category}`)),
    );
    const fixedKeys = Object.keys(source).filter((key) => !pluralSourceKeys.has(key));

    for (const [key, value] of Object.entries(source)) {
      if (typeof value !== "string") {
        addIssue(issues, "catalog-value", `messages.${descriptor.id}.en.${safeMessageKey(key)}`, "message values must be strings");
      }
    }

    for (const locale of NATIVE_REVIEW_LOCALES) {
      const own = catalog?.[locale];
      const summary = {
        catalog: descriptor.id,
        locale,
        required: 0,
        missing: 0,
        extra: 0,
        placeholderMismatches: 0,
        unexplainedEnglish: 0,
        sampleMissing: [],
        sampleExtra: [],
        samplePlaceholder: [],
        sampleEnglish: [],
      };
      summaries.push(summary);
      if (!isObject(own)) {
        summary.missing = fixedKeys.length;
        addIssue(issues, "catalog-locale", `messages.${descriptor.id}.${locale}`, "locale catalog is missing or invalid");
        continue;
      }

      const categories = pluralCategories(locale);
      const requiredKeys = [
        ...fixedKeys,
        ...[...stems].flatMap((stem) => [...categories].map((category) => `${stem}.${category}`)),
      ];
      const required = new Set(requiredKeys);
      summary.required = requiredKeys.length;

      for (const key of requiredKeys) {
        const path = `messages.${descriptor.id}.${locale}.${safeMessageKey(key)}`;
        if (!(key in own)) {
          summary.missing += 1;
          if (summary.sampleMissing.length < 3) summary.sampleMissing.push(safeMessageKey(key));
          addIssue(issues, "catalog-missing", path, "required translation key is missing");
          continue;
        }
        const value = own[key];
        if (typeof value !== "string") {
          addIssue(issues, "catalog-value", path, "message values must be strings");
          continue;
        }
        const sourceValue = counterpart(source, key, stems);
        if (typeof sourceValue !== "string") {
          addIssue(issues, "catalog-source", path, "has no English source counterpart");
          continue;
        }
        if (placeholders(value).join("\u0000") !== placeholders(sourceValue).join("\u0000")) {
          summary.placeholderMismatches += 1;
          if (summary.samplePlaceholder.length < 3) summary.samplePlaceholder.push(safeMessageKey(key));
          addIssue(issues, "catalog-placeholder", path, "placeholder names must exactly match English");
        }
        if (
          value === sourceValue
          && !allowlist.has(`${descriptor.id}\u0000${locale}\u0000${key}`)
        ) {
          summary.unexplainedEnglish += 1;
          if (summary.sampleEnglish.length < 3) summary.sampleEnglish.push(safeMessageKey(key));
          addIssue(issues, "catalog-unexplained-english", path, "identical English text needs translation or a narrow reasoned allowlist entry");
        }
      }

      for (const key of Object.keys(own)) {
        if (!required.has(key)) {
          summary.extra += 1;
          if (summary.sampleExtra.length < 3) summary.sampleExtra.push(safeMessageKey(key));
          addIssue(
            issues,
            "catalog-extra",
            `messages.${descriptor.id}.${locale}.${safeMessageKey(key)}`,
            "translation key is not required by the English source or locale plural rules",
          );
        }
      }
    }

    for (const entry of sameAsEnglishAllowlist) {
      if (!isObject(entry) || entry.catalog !== descriptor.id || !Array.isArray(entry.locales)) continue;
      for (const locale of entry.locales) {
        const own = catalog?.[locale];
        const sourceValue = counterpart(source, entry.key, stems);
        if (typeof sourceValue !== "string" || !isObject(own) || own[entry.key] !== sourceValue) {
          addIssue(
            issues,
            "catalog-allowlist-stale",
            `messages.${descriptor.id}.${locale}.${safeMessageKey(entry.key)}`,
            "allowlist entry must point to currently identical source and locale text",
          );
        }
      }
    }
  }

  return { issues, summaries };
}

export function loadMessageCatalogs(projectRoot = ROOT) {
  const catalogs = {};
  const issues = [];
  for (const descriptor of MESSAGE_CATALOGS) {
    catalogs[descriptor.id] = {};
    for (const locale of LOCALES) {
      const file = join(projectRoot, descriptor.directory, `${locale}.json`);
      try {
        const value = JSON.parse(readFileSync(file, "utf8"));
        catalogs[descriptor.id][locale] = value;
      } catch {
        addIssue(
          issues,
          "catalog-read",
          `${descriptor.directory}/${locale}.json`,
          "file is missing or invalid JSON",
        );
      }
    }
  }
  return { catalogs, issues };
}

function evidenceSummary(config) {
  const gates = config?.gates;
  if (!isObject(gates)) return [];
  const native = gates.nativeReviews?.reviews;
  const arabic = gates.arabicRtlMatrix?.cases;
  const provider = gates.providerCanary;
  const csp = gates.vercelPreviewCsp?.stages;
  const github = gates.githubReadiness;
  return [
    {
      label: "Native reviews (8 non-English locales)",
      records: isObject(native) ? Object.values(native) : [],
    },
    {
      label: "Arabic RTL matrix (390/979/980/1440 × light/dark × keyboard)",
      records: Array.isArray(arabic) ? arabic.map((item) => item?.result) : [],
    },
    {
      label: "Provider canary, reconciliation, and credential lifecycle",
      records: isObject(provider)
        ? [
            ...(isObject(provider.steps) ? Object.values(provider.steps) : []),
            ...(isObject(provider.reconciliations) ? Object.values(provider.reconciliations) : []),
          ]
        : [],
    },
    {
      label: "Vercel preview CSP report-only then enforced response headers",
      records: isObject(csp) ? Object.values(csp) : [],
    },
    {
      label: "GitHub required checks and three consecutive green runs",
      records: isObject(github)
        ? [github.requiredChecks, ...(Array.isArray(github.stableRuns) ? github.stableRuns.map((run) => run?.result) : [])]
        : [],
    },
  ].map((group) => ({
    label: group.label,
    status: statusOf(group.records),
    pending: group.records.filter((record) => record?.status === "pending").length,
    failed: group.records.filter((record) => record?.status === "fail").length,
    total: group.records.length,
  }));
}

/** Evaluate already-parsed fixtures without treating the production file as a test fixture. */
export function evaluateReleaseReadiness({ config, catalogs }) {
  const configIssues = validateReleaseReadiness(config);
  const messages = validateMessageCatalogs(
    catalogs,
    isObject(config?.localization) ? config.localization.sameAsEnglishAllowlist : [],
  );
  const evidence = evidenceSummary(config);
  const externalReady = evidence.length === 5 && evidence.every((group) => group.status === "pass");
  return {
    ready: configIssues.length === 0
      && messages.issues.length === 0
      && config?.status === "pass"
      && externalReady,
    configIssues,
    messageIssues: messages.issues,
    messageSummaries: messages.summaries,
    evidence,
  };
}

export function checkReleaseReadiness(projectRoot = ROOT) {
  let config;
  try {
    config = JSON.parse(readFileSync(join(projectRoot, "config/release-readiness.json"), "utf8"));
  } catch {
    return {
      ready: false,
      configIssues: [{
        code: "config-read",
        path: "config/release-readiness.json",
        message: "file is missing or invalid JSON",
      }],
      messageIssues: [],
      messageSummaries: [],
      evidence: [],
    };
  }
  const loaded = loadMessageCatalogs(projectRoot);
  const result = evaluateReleaseReadiness({ config, catalogs: loaded.catalogs });
  result.messageIssues.unshift(...loaded.issues);
  if (loaded.issues.length) result.ready = false;
  return result;
}

function sampleSuffix(summary, field) {
  return summary[field].length ? `; e.g. ${summary[field].join(", ")}` : "";
}

export function formatReadinessReport(result) {
  if (result.ready) {
    return [
      "release readiness: PASS",
      "- [x] message key, placeholder, plural, and explained-English checks",
      "- [x] eight native-language reviews",
      "- [x] Arabic RTL matrix",
      "- [x] Provider canary and reconciliation",
      "- [x] Vercel CSP response headers",
      "- [x] GitHub required checks and three stable green runs",
    ].join("\n");
  }

  const lines = [
    "release readiness: BLOCKED",
    "No credential, signed URL, Prompt/reply, or Provider raw body is printed below.",
  ];
  if (result.configIssues.length) {
    lines.push("", "Configuration/schema blockers:");
    for (const issue of result.configIssues.slice(0, 20)) {
      lines.push(`- [ ] ${issue.path} (${issue.code}): ${issue.message}`);
    }
    if (result.configIssues.length > 20) {
      lines.push(`- [ ] ${result.configIssues.length - 20} additional schema blocker(s); inspect with imported validators`);
    }
  }

  const blockedCatalogs = result.messageSummaries.filter((summary) =>
    summary.missing || summary.extra || summary.placeholderMismatches || summary.unexplainedEnglish);
  lines.push("", "Automatic localization blockers:");
  if (!blockedCatalogs.length && !result.messageIssues.length) {
    lines.push("- [x] all locale catalogs have complete keys, placeholders, plurals, and explained identical terms");
  } else {
    for (const summary of blockedCatalogs) {
      const parts = [];
      if (summary.missing) parts.push(`${summary.missing} missing${sampleSuffix(summary, "sampleMissing")}`);
      if (summary.extra) parts.push(`${summary.extra} unexpected${sampleSuffix(summary, "sampleExtra")}`);
      if (summary.placeholderMismatches) {
        parts.push(`${summary.placeholderMismatches} placeholder mismatch(es)${sampleSuffix(summary, "samplePlaceholder")}`);
      }
      if (summary.unexplainedEnglish) {
        parts.push(`${summary.unexplainedEnglish} unexplained English-identical value(s)${sampleSuffix(summary, "sampleEnglish")}`);
      }
      lines.push(`- [ ] ${summary.catalog}/${summary.locale}: ${parts.join("; ")}`);
    }
    const uncovered = result.messageIssues.filter((issue) => issue.code === "catalog-read" || issue.code === "catalog-source");
    for (const issue of uncovered.slice(0, 10)) lines.push(`- [ ] ${issue.path}: ${issue.message}`);
  }

  lines.push("", "External/manual evidence blockers:");
  for (const group of result.evidence) {
    const box = group.status === "pass" ? "x" : " ";
    const detail = group.status === "pass"
      ? `${group.total}/${group.total} signed`
      : `${group.pending} pending, ${group.failed} failed, ${group.total} required`;
    lines.push(`- [${box}] ${group.label}: ${detail}`);
  }
  lines.push("", "Automatic checks never substitute for native-speaker or real-environment sign-off.");
  return lines.join("\n");
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  const result = checkReleaseReadiness(ROOT);
  const report = formatReadinessReport(result);
  if (result.ready) console.log(report);
  else {
    console.error(report);
    process.exitCode = 1;
  }
}
