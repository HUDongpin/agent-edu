/**
 * Auditable, fail-closed release evidence checks.
 *
 * Daily CI deliberately does not run this command: external evidence can stay
 * pending while ordinary engineering checks remain useful. Release candidates
 * run `npm run release:check` explicitly and may pass only when both the
 * deterministic message checks and every signed external gate pass.
 */
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
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
const SAFE_EVIDENCE_REF = /^(?:docs\/release\/evidence\/[A-Za-z0-9._/-]+|(?:review-record|matrix-record|canary-record|billing-record|csp-record|github-run|github-ruleset|github-pr|vercel-deployment|candidate-commit|checkpoint|integration-branch|workflow-definition|rollback-record):[A-Za-z0-9._/-]+)$/;
const EVIDENCE_DIRECTORY = "docs/release/evidence";
const MAX_EVIDENCE_BYTES = 256 * 1024;
const GIT_SHA = /^[0-9a-f]{40}$/;
const INTEGRATION_BRANCH = /^(?:main|codex\/[a-z0-9][a-z0-9._/-]{0,127})$/;
const DEPLOYMENT_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{5,127}$/;
const GITHUB_RUN_ID = /^[1-9][0-9]{0,24}$/;
const GITHUB_CONCLUSIONS = new Set([
  "success", "failure", "cancelled", "timed_out", "action_required",
  "neutral", "skipped", "stale", "startup_failure",
]);
const RELEASE_TARGET_KEYS = [
  "candidateCommitSha",
  "checkpointSha",
  "integrationBranch",
  "vercelDeploymentId",
  "workflowDefinitionSha",
];

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
  "schemaVersion", "releaseId", "status", "updatedAt", "releaseTarget", "sensitiveEvidencePolicy", "localization", "gates",
  "candidateCommitSha", "checkpointSha", "integrationBranch", "vercelDeploymentId", "workflowDefinitionSha",
  "credentialsStored", "signedUrlsStored", "providerRawBodiesStored", "promptsStored", "repliesStored", "authorizationOrCookiesStored",
  "sourceLocale", "requiredLocales", "nativeReviewLocales", "sameAsEnglishAllowlist",
  "catalog", "key", "locales", "reason",
  "nativeReviews", "reviews", "arabicRtlMatrix", "keyboardChecks", "cases",
  "id", "width", "theme", "expectedOrientation", "result",
  "providerCanary", "credentialPolicy", "officialPricingUrl", "steps", "reconciliations",
  ...PROVIDER_STEPS,
  ...PROVIDER_RECONCILIATIONS,
  "vercelPreviewCsp", "requiredHeaders", "reportOnlyTarget", "reportOnly", "enforced", "stages",
  "githubReadiness", "requiredCheckNames", "requiredChecks", "stableRuns", "sequence",
  "protectedBranch", "rulesetId", "qualityRequired", "smokeChromiumRequired",
  "runId", "runAttempt", "commitSha", "branch", "workflowSha", "qualityConclusion", "smokeChromiumConclusion", "completedAt",
  "rollbackReadiness", "previousProductionCommitSha", "previousProductionDeploymentId", "releaseTag", "rollbackPullRequestRef", "validatedCandidateCommitSha",
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

function isCompleteReleaseTarget(target) {
  return isObject(target)
    && GIT_SHA.test(target.candidateCommitSha)
    && GIT_SHA.test(target.checkpointSha)
    && target.candidateCommitSha !== target.checkpointSha
    && INTEGRATION_BRANCH.test(target.integrationBranch)
    && DEPLOYMENT_ID.test(target.vercelDeploymentId)
    && GIT_SHA.test(target.workflowDefinitionSha);
}

function targetBindingRefs(target) {
  if (!isCompleteReleaseTarget(target)) return [];
  return [
    `candidate-commit:${target.candidateCommitSha}`,
    `checkpoint:${target.checkpointSha}`,
    `integration-branch:${target.integrationBranch}`,
    `vercel-deployment:${target.vercelDeploymentId}`,
    `workflow-definition:${target.workflowDefinitionSha}`,
  ];
}

function validateNullableReleaseTarget(target, path, issues) {
  if (!isObject(target)) {
    addIssue(issues, "schema-target", path, "must describe a candidate, checkpoint, branch, deployment, and workflow");
    return;
  }
  validateExactKeys(target, RELEASE_TARGET_KEYS, path, issues);
  for (const key of ["candidateCommitSha", "checkpointSha", "workflowDefinitionSha"]) {
    if (target[key] !== null && !GIT_SHA.test(target[key])) {
      addIssue(issues, "schema-target", `${path}.${key}`, "must be null while unfrozen or one lowercase 40-character Git SHA");
    }
  }
  if (target.integrationBranch !== null && !INTEGRATION_BRANCH.test(target.integrationBranch)) {
    addIssue(issues, "schema-target", `${path}.integrationBranch`, "must be null while unfrozen, main, or one scoped codex branch");
  }
  if (target.vercelDeploymentId !== null && !DEPLOYMENT_ID.test(target.vercelDeploymentId)) {
    addIssue(issues, "schema-target", `${path}.vercelDeploymentId`, "must be null while unfrozen or one opaque Vercel deployment id");
  }
  if (
    GIT_SHA.test(target.candidateCommitSha)
    && GIT_SHA.test(target.checkpointSha)
    && target.candidateCommitSha === target.checkpointSha
  ) {
    addIssue(issues, "schema-target", `${path}.checkpointSha`, "must identify the distinct pre-implementation checkpoint");
  }
}

export function findSensitiveEvidenceText(value) {
  const text = String(value);
  const findings = [];
  for (const [id, pattern] of SECRET_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) findings.push(id);
  }
  if (/https?:\/\/[^\s?#]+\?[^\s#]*/i.test(text)) findings.push("url-with-query");
  if (/\b(?:authorization|cookie)[ \t]*[:=][ \t]*\S+/i.test(text)) findings.push("sensitive-header");
  if (/\b(?:api[-_ ]?key|credential|prompt|reply|provider(?:raw)?(?:body|response)|raw(?:body|response))[ \t]*[:=][ \t]*\S+/i.test(text)) {
    findings.push("sensitive-labeled-value");
  }
  return [...new Set(findings)];
}

function inspectRelativeEvidence(ref, path, issues, projectRoot) {
  if (!projectRoot) {
    addIssue(issues, "schema-evidence-file", path, "relative evidence needs a project root for existence and privacy checks");
    return;
  }
  const root = resolve(projectRoot);
  const evidenceRoot = resolve(root, EVIDENCE_DIRECTORY);
  const file = resolve(root, ref);
  if (file === evidenceRoot || !file.startsWith(evidenceRoot + sep)) {
    addIssue(issues, "schema-evidence-path", path, "must remain below docs/release/evidence");
    return;
  }

  let stat;
  try {
    stat = lstatSync(file);
  } catch {
    addIssue(issues, "schema-evidence-file", path, "referenced evidence file does not exist");
    return;
  }
  if (!stat.isFile()) {
    addIssue(issues, "schema-evidence-file", path, "referenced evidence must be a regular file, not a directory or symlink");
    return;
  }
  try {
    const canonicalProject = realpathSync(root);
    const canonicalRoot = realpathSync(evidenceRoot);
    const canonicalFile = realpathSync(file);
    if (
      canonicalRoot !== resolve(canonicalProject, EVIDENCE_DIRECTORY)
      || !canonicalFile.startsWith(canonicalRoot + sep)
    ) {
      addIssue(issues, "schema-evidence-path", path, "canonical evidence path escapes docs/release/evidence");
      return;
    }
  } catch {
    addIssue(issues, "schema-evidence-file", path, "evidence path could not be resolved safely");
    return;
  }
  if (stat.size > MAX_EVIDENCE_BYTES) {
    addIssue(issues, "schema-evidence-file", path, "evidence files must be 256 KiB or smaller sanitized summaries");
    return;
  }

  let bytes;
  try {
    bytes = readFileSync(file);
  } catch {
    addIssue(issues, "schema-evidence-file", path, "evidence file could not be read");
    return;
  }
  if (bytes.includes(0)) {
    addIssue(issues, "schema-evidence-privacy", path, "binary evidence is forbidden; store a sanitized text summary");
    return;
  }
  const text = bytes.toString("utf8");
  const privacyFindings = findSensitiveEvidenceText(text);
  try {
    const parsed = JSON.parse(text);
    privacyFindings.push(...findSensitiveEvidence(parsed).map((finding) => finding.code));
  } catch {
    // Plain Markdown/text evidence is allowed and was scanned above.
  }
  if (privacyFindings.length) {
    addIssue(
      issues,
      "schema-evidence-privacy",
      path,
      `evidence contains forbidden sensitive category or value (${[...new Set(privacyFindings)].sort().join(", ")}); matched text is not displayed`,
    );
  }
}

function validateEvidenceRefs(value, path, issues, options = {}) {
  if (!Array.isArray(value)) {
    addIssue(issues, "schema-evidence", path, "must be an array of non-sensitive evidence references");
    return;
  }
  if (new Set(value).size !== value.length) {
    addIssue(issues, "schema-evidence", path, "must not contain duplicate evidence references");
  }
  for (let index = 0; index < value.length; index += 1) {
    const ref = value[index];
    const valid = !(
      typeof ref !== "string"
      || ref.length > 180
      || ref.includes("..")
      || !SAFE_EVIDENCE_REF.test(ref)
    );
    if (!valid) {
      addIssue(
        issues,
        "schema-evidence",
        `${path}[${index}]`,
        "must be a relative evidence path or an approved opaque record id; URLs are not accepted",
      );
      continue;
    }
    if (ref.startsWith(`${EVIDENCE_DIRECTORY}/`)) {
      inspectRelativeEvidence(ref, `${path}[${index}]`, issues, options.projectRoot);
    }
  }
}

function validateEvidenceRecord(value, path, issues, options = {}) {
  if (!isObject(value)) {
    addIssue(issues, "schema-evidence", path, "must be an evidence record");
    return;
  }
  validateExactKeys(value, ["status", "checkedAt", "evidenceRefs", "note"], path, issues);
  validateStatus(value.status, `${path}.status`, issues);
  validateEvidenceRefs(value.evidenceRefs, `${path}.evidenceRefs`, issues, options);
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
  const bindingRefs = targetBindingRefs(options.releaseTarget);
  if (!bindingRefs.length) {
    addIssue(issues, "schema-target-binding", path, "pass or fail evidence requires a completely frozen release target");
  } else if (Array.isArray(value.evidenceRefs)) {
    for (const ref of bindingRefs) {
      if (!value.evidenceRefs.includes(ref)) {
        const bindingKind = ref.slice(0, ref.indexOf(":"));
        addIssue(
          issues,
          "schema-target-binding",
          `${path}.evidenceRefs`,
          `must include the exact frozen ${bindingKind} target binding`,
        );
      }
    }
    if (!value.evidenceRefs.some((ref) => !bindingRefs.includes(ref))) {
      addIssue(issues, "schema-evidence", `${path}.evidenceRefs`, "must include a substantive evidence record in addition to target bindings");
    }
  }
}

function validateExtendedEvidenceRecord(value, extraKeys, path, issues, options = {}) {
  if (!isObject(value)) {
    addIssue(issues, "schema-evidence", path, "must be an evidence record");
    return;
  }
  validateExactKeys(value, ["status", "checkedAt", "evidenceRefs", "note", ...extraKeys], path, issues);
  validateEvidenceRecord(
    {
      status: value.status,
      checkedAt: value.checkedAt,
      evidenceRefs: value.evidenceRefs,
      note: value.note,
    },
    path,
    issues,
    options,
  );
}

function validateRecordMap(value, keys, path, issues, options = {}) {
  if (!isObject(value)) {
    addIssue(issues, "schema-object", path, "must be an object");
    return [];
  }
  if (!sameMembers(Object.keys(value), keys)) {
    addIssue(issues, "schema-keys", path, `must contain exactly: ${keys.join(", ")}`);
  }
  const records = [];
  for (const key of keys) {
    validateEvidenceRecord(value[key], childPath(path, key), issues, options);
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
export function validateReleaseReadiness(config, options = {}) {
  const issues = [];
  if (!isObject(config)) {
    addIssue(issues, "schema-root", "$", "must be a JSON object");
    return issues;
  }
  validateExactKeys(
    config,
    ["schemaVersion", "releaseId", "status", "updatedAt", "releaseTarget", "sensitiveEvidencePolicy", "localization", "gates"],
    "$",
    issues,
  );

  if (config.schemaVersion !== 2) addIssue(issues, "schema-version", "$.schemaVersion", "must equal 2");
  if (typeof config.releaseId !== "string" || !/^[a-z0-9][a-z0-9-]{2,63}$/.test(config.releaseId)) {
    addIssue(issues, "schema-release", "$.releaseId", "must be a stable lowercase release id");
  }
  validateStatus(config.status, "$.status", issues);
  if (!isIsoDate(config.updatedAt)) addIssue(issues, "schema-date", "$.updatedAt", "must be YYYY-MM-DD");

  const target = config.releaseTarget;
  if (!isObject(target)) {
    addIssue(issues, "schema-target", "$.releaseTarget", "must describe the frozen candidate, checkpoint, branch, deployment, and workflow");
  } else {
    validateNullableReleaseTarget(target, "$.releaseTarget", issues);
    if (config.status === "pass" && !isCompleteReleaseTarget(target)) {
      addIssue(issues, "schema-target-binding", "$.releaseTarget", "a passing release must bind all five frozen target fields");
    }
  }

  const policy = config.sensitiveEvidencePolicy;
  if (
    !isObject(policy)
    || policy.credentialsStored !== false
    || policy.signedUrlsStored !== false
    || policy.providerRawBodiesStored !== false
    || policy.promptsStored !== false
    || policy.repliesStored !== false
    || policy.authorizationOrCookiesStored !== false
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
      ["credentialsStored", "signedUrlsStored", "providerRawBodiesStored", "promptsStored", "repliesStored", "authorizationOrCookiesStored"],
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
    ["nativeReviews", "arabicRtlMatrix", "providerCanary", "vercelPreviewCsp", "githubReadiness", "rollbackReadiness"],
    "$.gates",
    issues,
  );

  const groupStatuses = [];
  const evidenceOptions = { ...options, releaseTarget: target };

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
      evidenceOptions,
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
      validateEvidenceRecord(item.result, `${path}.result`, issues, evidenceOptions);
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
      ...validateRecordMap(provider.steps, PROVIDER_STEPS, "$.gates.providerCanary.steps", issues, evidenceOptions),
      ...validateRecordMap(
        provider.reconciliations,
        PROVIDER_RECONCILIATIONS,
        "$.gates.providerCanary.reconciliations",
        issues,
        evidenceOptions,
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
      ["status", "requiredHeaders", "reportOnlyTarget", "stages"],
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
    const reportOnlyTarget = csp.reportOnlyTarget;
    validateNullableReleaseTarget(
      reportOnlyTarget,
      "$.gates.vercelPreviewCsp.reportOnlyTarget",
      issues,
    );

    const stages = csp.stages;
    const records = [];
    if (!isObject(stages)) {
      addIssue(issues, "schema-object", "$.gates.vercelPreviewCsp.stages", "must be an object");
    } else {
      validateExactKeys(
        stages,
        ["reportOnly", "enforced"],
        "$.gates.vercelPreviewCsp.stages",
        issues,
      );
      const reportOnly = stages.reportOnly;
      const enforced = stages.enforced;
      validateEvidenceRecord(
        reportOnly,
        "$.gates.vercelPreviewCsp.stages.reportOnly",
        issues,
        { ...options, releaseTarget: reportOnlyTarget },
      );
      validateEvidenceRecord(
        enforced,
        "$.gates.vercelPreviewCsp.stages.enforced",
        issues,
        evidenceOptions,
      );
      if (isObject(reportOnly)) records.push(reportOnly);
      if (isObject(enforced)) records.push(enforced);

      if (isObject(enforced) && enforced.status !== "pending") {
        if (reportOnly?.status !== "pass") {
          addIssue(
            issues,
            "schema-csp-order",
            "$.gates.vercelPreviewCsp.stages.enforced.status",
            "cannot be concluded until the report-only stage has passed",
          );
        }
        if (isCompleteReleaseTarget(reportOnlyTarget) && isCompleteReleaseTarget(target)) {
          if (reportOnlyTarget.candidateCommitSha === target.candidateCommitSha) {
            addIssue(
              issues,
              "schema-csp-target",
              "$.gates.vercelPreviewCsp.reportOnlyTarget.candidateCommitSha",
              "must identify the distinct predecessor report-only commit",
            );
          }
          if (reportOnlyTarget.vercelDeploymentId === target.vercelDeploymentId) {
            addIssue(
              issues,
              "schema-csp-target",
              "$.gates.vercelPreviewCsp.reportOnlyTarget.vercelDeploymentId",
              "must identify a distinct predecessor report-only deployment",
            );
          }
          for (const key of ["checkpointSha", "integrationBranch", "workflowDefinitionSha"]) {
            if (reportOnlyTarget[key] !== target[key]) {
              addIssue(
                issues,
                "schema-csp-target",
                `$.gates.vercelPreviewCsp.reportOnlyTarget.${key}`,
                "must match the final release target across both CSP stages",
              );
            }
          }
        }
        if (
          isIsoInstant(reportOnly?.checkedAt)
          && isIsoInstant(enforced.checkedAt)
          && new Date(reportOnly.checkedAt).valueOf() >= new Date(enforced.checkedAt).valueOf()
        ) {
          addIssue(
            issues,
            "schema-csp-order",
            "$.gates.vercelPreviewCsp.stages.enforced.checkedAt",
            "must be later than the report-only observation",
          );
        }
      }
    }
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
    const required = github.requiredChecks;
    validateExtendedEvidenceRecord(
      required,
      ["protectedBranch", "rulesetId", "qualityRequired", "smokeChromiumRequired"],
      "$.gates.githubReadiness.requiredChecks",
      issues,
      evidenceOptions,
    );
    if (isObject(required)) {
      records.push(required);
      if (required.status === "pending") {
        for (const key of ["protectedBranch", "rulesetId", "qualityRequired", "smokeChromiumRequired"]) {
          if (required[key] !== null) {
            addIssue(issues, "schema-github", `$.gates.githubReadiness.requiredChecks.${key}`, "must remain null while branch-protection evidence is pending");
          }
        }
      } else {
        if (required.protectedBranch !== "main") {
          addIssue(issues, "schema-github", "$.gates.githubReadiness.requiredChecks.protectedBranch", "must prove required checks on main");
        }
        if (typeof required.rulesetId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._/-]{2,127}$/.test(required.rulesetId)) {
          addIssue(issues, "schema-github", "$.gates.githubReadiness.requiredChecks.rulesetId", "must be one stable non-sensitive ruleset or branch-protection id");
        }
        if (required.status === "pass" && (required.qualityRequired !== true || required.smokeChromiumRequired !== true)) {
          addIssue(issues, "schema-github", "$.gates.githubReadiness.requiredChecks", "a passing record must require both quality and smoke-chromium");
        }
        if (
          required.status === "fail"
          && (typeof required.qualityRequired !== "boolean"
            || typeof required.smokeChromiumRequired !== "boolean")
        ) {
          addIssue(issues, "schema-github", "$.gates.githubReadiness.requiredChecks", "a failed record must retain the observed required-check booleans");
        }
        if (
          typeof required.rulesetId === "string"
          && Array.isArray(required.evidenceRefs)
          && !required.evidenceRefs.includes(`github-ruleset:${required.rulesetId}`)
        ) {
          addIssue(issues, "schema-github", "$.gates.githubReadiness.requiredChecks.evidenceRefs", "must reference the independent branch-protection record id");
        }
      }
    }
    const runs = Array.isArray(github.stableRuns) ? github.stableRuns : [];
    if (!Array.isArray(github.stableRuns) || runs.length !== 3) {
      addIssue(issues, "schema-github", "$.gates.githubReadiness.stableRuns", "must contain exactly three ordered green-run records");
    }
    const runIds = new Set();
    let previousCompletedAt = null;
    for (let index = 0; index < runs.length; index += 1) {
      const run = runs[index];
      const path = `$.gates.githubReadiness.stableRuns[${index}]`;
      if (isObject(run)) {
        validateExactKeys(
          run,
          ["sequence", "runId", "runAttempt", "commitSha", "branch", "workflowSha", "qualityConclusion", "smokeChromiumConclusion", "completedAt", "result"],
          path,
          issues,
        );
      }
      if (run?.sequence !== index + 1) {
        addIssue(issues, "schema-github-order", `${path}.sequence`, `must equal ${index + 1} at this array position`);
      }
      validateEvidenceRecord(run?.result, `${path}.result`, issues, evidenceOptions);
      if (isObject(run?.result)) records.push(run.result);

      const metadataKeys = ["runId", "runAttempt", "commitSha", "branch", "workflowSha", "qualityConclusion", "smokeChromiumConclusion", "completedAt"];
      if (run?.result?.status === "pending") {
        for (const key of metadataKeys) {
          if (run?.[key] !== null) addIssue(issues, "schema-github", `${path}.${key}`, "must remain null while the run is pending");
        }
        continue;
      }
      if (!GITHUB_RUN_ID.test(run?.runId)) {
        addIssue(issues, "schema-github", `${path}.runId`, "must be one decimal GitHub Actions run id");
      } else if (runIds.has(run.runId)) {
        addIssue(issues, "schema-github-duplicate-run", `${path}.runId`, "must be unique across the three stable runs");
      } else {
        runIds.add(run.runId);
      }
      if (run?.runAttempt !== 1) addIssue(issues, "schema-github", `${path}.runAttempt`, "must equal 1; reruns restart the stability sequence");
      if (run?.commitSha !== target?.candidateCommitSha) {
        addIssue(issues, "schema-github-target", `${path}.commitSha`, "must equal the frozen candidate commit");
      }
      if (run?.branch !== target?.integrationBranch) {
        addIssue(issues, "schema-github-target", `${path}.branch`, "must equal the frozen integration branch");
      }
      if (run?.workflowSha !== target?.workflowDefinitionSha) {
        addIssue(issues, "schema-github-target", `${path}.workflowSha`, "must equal the frozen workflow definition SHA");
      }
      if (!isIsoInstant(run?.completedAt)) {
        addIssue(issues, "schema-date", `${path}.completedAt`, "must be a canonical UTC ISO instant");
      } else {
        if (previousCompletedAt !== null && run.completedAt <= previousCompletedAt) {
          addIssue(issues, "schema-github-order", `${path}.completedAt`, "must be later than the preceding stable run");
        }
        previousCompletedAt = run.completedAt;
      }
      if (run?.result?.checkedAt !== run?.completedAt) {
        addIssue(issues, "schema-github", `${path}.result.checkedAt`, "must equal the Actions completion time");
      }
      for (const key of ["qualityConclusion", "smokeChromiumConclusion"]) {
        if (!GITHUB_CONCLUSIONS.has(run?.[key])) {
          addIssue(issues, "schema-github", `${path}.${key}`, "must be one GitHub Actions job conclusion");
        }
      }
      if (
        run?.result?.status === "pass"
        && (run.qualityConclusion !== "success" || run.smokeChromiumConclusion !== "success")
      ) {
        addIssue(issues, "schema-github", path, "a stable run passes only when both required jobs conclude success");
      }
      if (
        typeof run?.runId === "string"
        && Array.isArray(run?.result?.evidenceRefs)
        && !run.result.evidenceRefs.includes(`github-run:${run.runId}`)
      ) {
        addIssue(issues, "schema-github", `${path}.result.evidenceRefs`, "must reference this exact GitHub Actions run id");
      }
    }
    validateGroupStatus(github, records, "$.gates.githubReadiness", issues);
    groupStatuses.push(github);
  }

  const rollback = gates.rollbackReadiness;
  if (!isObject(rollback)) {
    addIssue(issues, "schema-rollback", "$.gates.rollbackReadiness", "must be an object");
  } else {
    validateExactKeys(
      rollback,
      ["status", "previousProductionCommitSha", "previousProductionDeploymentId", "releaseTag", "rollbackPullRequestRef", "validatedCandidateCommitSha", "result"],
      "$.gates.rollbackReadiness",
      issues,
    );
    validateStatus(rollback.status, "$.gates.rollbackReadiness.status", issues);
    validateEvidenceRecord(rollback.result, "$.gates.rollbackReadiness.result", issues, evidenceOptions);
    validateGroupStatus(rollback, isObject(rollback.result) ? [rollback.result] : [], "$.gates.rollbackReadiness", issues);
    groupStatuses.push(rollback);

    const rollbackFields = ["previousProductionCommitSha", "previousProductionDeploymentId", "releaseTag", "rollbackPullRequestRef", "validatedCandidateCommitSha"];
    if (rollback.result?.status === "pending") {
      for (const key of rollbackFields) {
        if (rollback[key] !== null) addIssue(issues, "schema-rollback", `$.gates.rollbackReadiness.${key}`, "must remain null while rollback evidence is pending");
      }
    } else {
      if (!GIT_SHA.test(rollback.previousProductionCommitSha) || rollback.previousProductionCommitSha === target?.candidateCommitSha) {
        addIssue(issues, "schema-rollback", "$.gates.rollbackReadiness.previousProductionCommitSha", "must identify a distinct previous production commit");
      }
      if (!DEPLOYMENT_ID.test(rollback.previousProductionDeploymentId) || rollback.previousProductionDeploymentId === target?.vercelDeploymentId) {
        addIssue(issues, "schema-rollback", "$.gates.rollbackReadiness.previousProductionDeploymentId", "must identify a distinct previous production deployment");
      }
      if (typeof rollback.releaseTag !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{2,127}$/.test(rollback.releaseTag)) {
        addIssue(issues, "schema-rollback", "$.gates.rollbackReadiness.releaseTag", "must be a stable release tag without spaces or URL syntax");
      }
      if (typeof rollback.rollbackPullRequestRef !== "string" || !/^github-pr:[1-9][0-9]{0,9}$/.test(rollback.rollbackPullRequestRef)) {
        addIssue(issues, "schema-rollback", "$.gates.rollbackReadiness.rollbackPullRequestRef", "must be an approved ordinary revert PR reference");
      }
      if (rollback.validatedCandidateCommitSha !== target?.candidateCommitSha) {
        addIssue(issues, "schema-rollback", "$.gates.rollbackReadiness.validatedCandidateCommitSha", "must equal the frozen candidate commit");
      }
      if (
        Array.isArray(rollback.result?.evidenceRefs)
        && !rollback.result.evidenceRefs.some((ref) => typeof ref === "string" && ref.startsWith("rollback-record:"))
      ) {
        addIssue(issues, "schema-rollback", "$.gates.rollbackReadiness.result.evidenceRefs", "must include a sanitized rollback validation record");
      }
    }
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
  const rollback = gates.rollbackReadiness;
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
    {
      label: "Rollback target, ordinary revert PR, and recovery validation",
      records: isObject(rollback) ? [rollback.result] : [],
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
export function evaluateReleaseReadiness({ config, catalogs, projectRoot }) {
  const configIssues = validateReleaseReadiness(config, { projectRoot });
  const messages = validateMessageCatalogs(
    catalogs,
    isObject(config?.localization) ? config.localization.sameAsEnglishAllowlist : [],
  );
  const evidence = evidenceSummary(config);
  const externalReady = evidence.length === 6 && evidence.every((group) => group.status === "pass");
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
  const result = evaluateReleaseReadiness({ config, catalogs: loaded.catalogs, projectRoot });
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
      "- [x] rollback target and ordinary revert validation",
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
    const summarizedCodes = new Set([
      "catalog-missing",
      "catalog-extra",
      "catalog-placeholder",
      "catalog-unexplained-english",
    ]);
    const uncovered = result.messageIssues.filter((issue) => !summarizedCodes.has(issue.code));
    for (const issue of uncovered.slice(0, 20)) {
      lines.push(`- [ ] ${issue.path} (${issue.code}): ${issue.message}`);
    }
    if (uncovered.length > 20) {
      lines.push(`- [ ] ${uncovered.length - 20} additional localization blocker(s); inspect with imported validators`);
    }
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
