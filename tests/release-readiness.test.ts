import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  LOCALES,
  NATIVE_REVIEW_LOCALES,
  checkReleaseReadiness,
  evaluateReleaseReadiness,
  findSensitiveEvidence,
  findSensitiveEvidenceText,
  formatReadinessReport,
  redactSensitiveText,
  validateMessageCatalogs,
  validateReleaseReadiness,
} from "../scripts/check-release-readiness.mjs";

type Evidence = {
  status: "pending" | "pass" | "fail";
  checkedAt: string | null;
  evidenceRefs: string[];
  note: string;
};

// Fixtures deliberately mutate untrusted, schema-shaped JSON before validation.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseConfig = Record<string, any>;
type CatalogFixture = Record<string, Record<string, Record<string, string>>>;

const PASS_AT = "2026-08-21T10:00:00.000Z";
const CANDIDATE_SHA = "561339033d62e7e86acab2dbbe9856e24ed5c0b9";
const CHECKPOINT_SHA = "0f4246ab19a0b4f987f45a50ec6a3b2e7eac14bd";
const WORKFLOW_SHA = "e5f4be91fb2f9e5950bd49b9c6ef03a2ed940ba4";
const INTEGRATION_BRANCH = "codex/agent-edu-release-candidate";
const DEPLOYMENT_ID = "dpl_releaseFixture20260821";
const productionConfig = JSON.parse(
  readFileSync("config/release-readiness.json", "utf8"),
) as LooseConfig;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function targetRefs(): string[] {
  return [
    `candidate-commit:${CANDIDATE_SHA}`,
    `checkpoint:${CHECKPOINT_SHA}`,
    `integration-branch:${INTEGRATION_BRANCH}`,
    `vercel-deployment:${DEPLOYMENT_ID}`,
    `workflow-definition:${WORKFLOW_SHA}`,
  ];
}

function passEvidence(record: Evidence, ref = "review-record:fixture", checkedAt = PASS_AT): void {
  record.status = "pass";
  record.checkedAt = checkedAt;
  record.evidenceRefs = [...targetRefs(), ref];
}

function passingConfig(): LooseConfig {
  const config = clone(productionConfig);
  config.status = "pass";
  config.releaseTarget = {
    candidateCommitSha: CANDIDATE_SHA,
    checkpointSha: CHECKPOINT_SHA,
    integrationBranch: INTEGRATION_BRANCH,
    vercelDeploymentId: DEPLOYMENT_ID,
    workflowDefinitionSha: WORKFLOW_SHA,
  };
  config.localization.sameAsEnglishAllowlist = [{
    catalog: "widgets",
    key: "tech.name",
    locales: [...NATIVE_REVIEW_LOCALES],
    reason: "DeepSeek is a Provider product name and remains unchanged.",
  }];

  for (const record of Object.values(config.gates.nativeReviews.reviews) as Evidence[]) {
    passEvidence(record);
  }
  config.gates.nativeReviews.status = "pass";

  for (const item of config.gates.arabicRtlMatrix.cases as Array<{ result: Evidence }>) {
    passEvidence(item.result, "matrix-record:fixture");
  }
  config.gates.arabicRtlMatrix.status = "pass";

  for (const record of Object.values(config.gates.providerCanary.steps) as Evidence[]) {
    passEvidence(record, "canary-record:fixture");
  }
  for (const record of Object.values(config.gates.providerCanary.reconciliations) as Evidence[]) {
    passEvidence(record, "billing-record:fixture");
  }
  config.gates.providerCanary.status = "pass";

  for (const record of Object.values(config.gates.vercelPreviewCsp.stages) as Evidence[]) {
    passEvidence(record, "csp-record:fixture");
  }
  config.gates.vercelPreviewCsp.status = "pass";

  const required = config.gates.githubReadiness.requiredChecks;
  required.protectedBranch = "main";
  required.rulesetId = "ruleset-fixture";
  required.qualityRequired = true;
  required.smokeChromiumRequired = true;
  passEvidence(required, "github-ruleset:ruleset-fixture");
  for (const [index, run] of (config.gates.githubReadiness.stableRuns as LooseConfig[]).entries()) {
    const runId = String(1001 + index);
    const completedAt = `2026-08-21T10:0${index + 1}:00.000Z`;
    run.runId = runId;
    run.runAttempt = 1;
    run.commitSha = CANDIDATE_SHA;
    run.branch = INTEGRATION_BRANCH;
    run.workflowSha = WORKFLOW_SHA;
    run.qualityConclusion = "success";
    run.smokeChromiumConclusion = "success";
    run.completedAt = completedAt;
    passEvidence(run.result, `github-run:${runId}`, completedAt);
  }
  config.gates.githubReadiness.status = "pass";

  const rollback = config.gates.rollbackReadiness;
  rollback.previousProductionCommitSha = "67e1beba98fee926925b254a152a1a1de1176376";
  rollback.previousProductionDeploymentId = "dpl_previousFixture20260819";
  rollback.releaseTag = "agent-edu-2026-08";
  rollback.rollbackPullRequestRef = "github-pr:123";
  rollback.validatedCandidateCommitSha = CANDIDATE_SHA;
  passEvidence(rollback.result, "rollback-record:fixture");
  rollback.status = "pass";
  return config;
}

function integerPluralCategories(locale: string): Set<string> {
  const rules = new Intl.PluralRules(locale);
  const categories = new Set(["other"]);
  for (let value = 0; value <= 200; value += 1) categories.add(rules.select(value));
  return categories;
}

function passingCatalogs(): CatalogFixture {
  const catalogs: CatalogFixture = {
    site: { en: { welcome: "Welcome {name}" } },
    handbook: { en: { guide: "Read the guide" } },
    widgets: {
      en: {
        "count.one": "{n} item",
        "count.other": "{n} items",
        "tech.name": "DeepSeek",
      },
    },
  };

  for (const locale of NATIVE_REVIEW_LOCALES) {
    catalogs.site[locale] = { welcome: `${locale} welcome {name}` };
    catalogs.handbook[locale] = { guide: `${locale} guide` };
    catalogs.widgets[locale] = { "tech.name": "DeepSeek" };
    for (const category of integerPluralCategories(locale)) {
      catalogs.widgets[locale][`count.${category}`] = `${locale} ${category} {n}`;
    }
  }
  return catalogs;
}

test("the committed release config is schema-valid and honestly pending", () => {
  assert.equal(productionConfig.status, "pending");
  assert.equal(productionConfig.releaseTarget.candidateCommitSha, CANDIDATE_SHA);
  assert.equal(productionConfig.releaseTarget.checkpointSha, CHECKPOINT_SHA);
  assert.equal(productionConfig.releaseTarget.workflowDefinitionSha, WORKFLOW_SHA);
  assert.equal(productionConfig.releaseTarget.vercelDeploymentId, null);
  assert.deepEqual(validateReleaseReadiness(productionConfig), []);

  const result = checkReleaseReadiness();
  assert.equal(result.ready, false);
  assert.equal(result.configIssues.length, 0);
  assert.equal(result.evidence.every((group) => group.status === "pending"), true);
});

test("fully signed fixture evidence and complete locale fixtures pass", () => {
  const result = evaluateReleaseReadiness({
    config: passingConfig(),
    catalogs: passingCatalogs(),
    projectRoot: process.cwd(),
  });

  assert.equal(result.ready, true);
  assert.deepEqual(result.configIssues, []);
  assert.deepEqual(result.messageIssues, []);
  assert.match(formatReadinessReport(result), /release readiness: PASS/);
});

test("valid pending evidence blocks release without becoming a schema error", () => {
  const config = clone(productionConfig);
  config.localization.sameAsEnglishAllowlist = passingConfig().localization.sameAsEnglishAllowlist;
  const result = evaluateReleaseReadiness({
    config,
    catalogs: passingCatalogs(),
    projectRoot: process.cwd(),
  });

  assert.equal(result.ready, false);
  assert.deepEqual(result.configIssues, []);
  assert.match(formatReadinessReport(result), /8 pending, 0 failed, 8 required/);
});

test("dates, evidence references, and aggregate statuses fail closed", () => {
  const config = passingConfig();
  const review = config.gates.nativeReviews.reviews.ar as Evidence;
  review.checkedAt = "21 August 2026";
  review.evidenceRefs = ["https://preview.example.test/path?signature=hidden"];
  (review as Evidence & { apiKey: string }).apiKey = "short-sensitive-value";
  config.gates.nativeReviews.status = "pending";

  const issues = validateReleaseReadiness(config);
  assert.ok(issues.some((issue) => issue.code === "schema-date"));
  assert.ok(issues.some((issue) => issue.code === "schema-evidence"));
  assert.ok(issues.some((issue) => issue.code === "schema-aggregate"));
  assert.ok(issues.some((issue) => issue.code === "schema-keys"));
  assert.ok(issues.some((issue) => issue.code === "sensitive-url-with-query"));
  assert.ok(issues.some((issue) => issue.code === "sensitive-sensitive-field"));
  assert.equal(JSON.stringify(issues).includes("signature=hidden"), false);
  assert.equal(JSON.stringify(issues).includes("short-sensitive-value"), false);
});

test("stable runs bind to one frozen target, stay ordered, and use unique first attempts", () => {
  const duplicate = passingConfig();
  duplicate.gates.githubReadiness.stableRuns[1].runId = "1001";
  duplicate.gates.githubReadiness.stableRuns[1].result.evidenceRefs = [
    ...targetRefs(),
    "github-run:1001",
  ];
  let issues = validateReleaseReadiness(duplicate);
  assert.ok(issues.some((issue) => issue.code === "schema-github-duplicate-run"));

  const wrongCommit = passingConfig();
  wrongCommit.gates.githubReadiness.stableRuns[0].commitSha = CHECKPOINT_SHA;
  issues = validateReleaseReadiness(wrongCommit);
  assert.ok(issues.some((issue) => issue.code === "schema-github-target" && issue.path.endsWith("commitSha")));

  const rerun = passingConfig();
  rerun.gates.githubReadiness.stableRuns[2].runAttempt = 2;
  issues = validateReleaseReadiness(rerun);
  assert.ok(issues.some((issue) => issue.code === "schema-github" && issue.path.endsWith("runAttempt")));

  const wrongWorkflow = passingConfig();
  wrongWorkflow.gates.githubReadiness.stableRuns[0].workflowSha = CHECKPOINT_SHA;
  issues = validateReleaseReadiness(wrongWorkflow);
  assert.ok(issues.some((issue) => issue.code === "schema-github-target" && issue.path.endsWith("workflowSha")));

  const outOfOrder = passingConfig();
  [outOfOrder.gates.githubReadiness.stableRuns[0], outOfOrder.gates.githubReadiness.stableRuns[1]] =
    [outOfOrder.gates.githubReadiness.stableRuns[1], outOfOrder.gates.githubReadiness.stableRuns[0]];
  issues = validateReleaseReadiness(outOfOrder);
  assert.ok(issues.some((issue) => issue.code === "schema-github-order"));
});

test("required checks remain independent from ordinary workflow-run evidence", () => {
  const config = passingConfig();
  config.gates.githubReadiness.requiredChecks.evidenceRefs = [
    ...targetRefs(),
    "github-run:1001",
  ];
  const issues = validateReleaseReadiness(config);
  assert.ok(issues.some((issue) =>
    issue.code === "schema-github"
    && issue.path.endsWith("requiredChecks.evidenceRefs")));
});

test("passing evidence must bind the exact frozen deployment and all target fields", () => {
  const config = passingConfig();
  const review = config.gates.nativeReviews.reviews.ar as Evidence;
  review.evidenceRefs = review.evidenceRefs.map((ref) =>
    ref === `vercel-deployment:${DEPLOYMENT_ID}`
      ? "vercel-deployment:dpl_wrongFixture20260821"
      : ref);

  const issues = validateReleaseReadiness(config);
  assert.ok(issues.some((issue) => issue.code === "schema-target-binding"));

  const unfrozen = passingConfig();
  unfrozen.releaseTarget.vercelDeploymentId = null;
  const targetIssues = validateReleaseReadiness(unfrozen);
  assert.ok(targetIssues.some((issue) => issue.code === "schema-target-binding"));
});

test("relative evidence must exist as a regular in-tree file", () => {
  const root = mkdtempSync(join(tmpdir(), "agent-edu-release-evidence-"));
  mkdirSync(join(root, "docs/release/evidence"), { recursive: true });
  const config = passingConfig();
  const review = config.gates.nativeReviews.reviews.ar as Evidence;
  review.evidenceRefs = [
    ...targetRefs(),
    "docs/release/evidence/missing.md",
  ];

  let issues = validateReleaseReadiness(config, { projectRoot: root });
  assert.ok(issues.some((issue) => issue.code === "schema-evidence-file" && /does not exist/.test(issue.message)));

  mkdirSync(join(root, "docs/release/evidence/not-a-file.md"));
  review.evidenceRefs = [
    ...targetRefs(),
    "docs/release/evidence/not-a-file.md",
  ];
  issues = validateReleaseReadiness(config, { projectRoot: root });
  assert.ok(issues.some((issue) => issue.code === "schema-evidence-file" && /regular file/.test(issue.message)));

  review.evidenceRefs = [
    ...targetRefs(),
    "docs/release/evidence/../escaped.md",
  ];
  issues = validateReleaseReadiness(config, { projectRoot: root });
  assert.ok(issues.some((issue) => issue.code === "schema-evidence"));
});

test("relative evidence privacy checks fail without echoing sensitive content", () => {
  const root = mkdtempSync(join(tmpdir(), "agent-edu-release-private-evidence-"));
  const evidenceDirectory = join(root, "docs/release/evidence");
  mkdirSync(evidenceDirectory, { recursive: true });
  const credential = ["sk", "-", "Q".repeat(28)].join("");
  const sensitive = `Authorization: Bearer ${credential}\nPrompt: private learner words\n`;
  writeFileSync(join(evidenceDirectory, "unsafe.md"), sensitive);

  const config = passingConfig();
  const review = config.gates.nativeReviews.reviews.ar as Evidence;
  review.evidenceRefs = [
    ...targetRefs(),
    "docs/release/evidence/unsafe.md",
  ];
  const issues = validateReleaseReadiness(config, { projectRoot: root });
  assert.ok(issues.some((issue) => issue.code === "schema-evidence-privacy"));
  assert.equal(JSON.stringify(issues).includes(credential), false);
  assert.equal(JSON.stringify(issues).includes("private learner words"), false);
  assert.ok(findSensitiveEvidenceText(sensitive).length >= 2);
});

test("message validation catches missing keys, placeholders, and plural forms", () => {
  const catalogs = passingCatalogs();
  delete catalogs.site.ar.welcome;
  catalogs.handbook.fr.guide = "fr guide {unexpected}";
  delete catalogs.widgets.ar["count.few"];

  const result = validateMessageCatalogs(
    catalogs,
    passingConfig().localization.sameAsEnglishAllowlist,
  );
  assert.ok(result.issues.some((issue) => issue.code === "catalog-missing" && issue.path.includes("site.ar")));
  assert.ok(result.issues.some((issue) => issue.code === "catalog-placeholder" && issue.path.includes("handbook.fr")));
  assert.ok(result.issues.some((issue) => issue.code === "catalog-missing" && issue.path.includes("count.few")));
});

test("English-identical technical terms require a narrow explicit allowlist", () => {
  const catalogs = passingCatalogs();
  const without = validateMessageCatalogs(catalogs, []);
  assert.equal(
    without.issues.filter((issue) => issue.code === "catalog-unexplained-english").length,
    NATIVE_REVIEW_LOCALES.length,
  );

  const withAllowlist = validateMessageCatalogs(
    catalogs,
    passingConfig().localization.sameAsEnglishAllowlist,
  );
  assert.deepEqual(withAllowlist.issues, []);
});

test("stale or overbroad identical-text exceptions are rejected", () => {
  const catalogs = passingCatalogs();
  catalogs.widgets.de["tech.name"] = "Anbietername";
  const result = validateMessageCatalogs(
    catalogs,
    passingConfig().localization.sameAsEnglishAllowlist,
  );
  assert.ok(result.issues.some((issue) => issue.code === "catalog-allowlist-stale"));
});

test("sensitive evidence detection and reports never echo matched values", () => {
  const credential = ["sk", "-", "Z".repeat(28)].join("");
  const signedUrl = ["https://preview.example.test/path", "?sig=", "private-value"].join("");
  const value = {
    note: credential,
    preview: signedUrl,
    providerResponse: { hidden: true },
  };

  const findings = findSensitiveEvidence(value);
  assert.ok(findings.some((finding) => finding.code === "provider-key"));
  assert.ok(findings.some((finding) => finding.code === "url-with-query"));
  assert.ok(findings.some((finding) => finding.code === "sensitive-field"));
  assert.equal(JSON.stringify(findings).includes(credential), false);
  assert.equal(JSON.stringify(findings).includes("private-value"), false);

  const redacted = redactSensitiveText(`${credential} ${signedUrl}`);
  assert.equal(redacted.includes(credential), false);
  assert.equal(redacted.includes("private-value"), false);
  assert.match(redacted, /\[REDACTED\]/);
});

test("the locale fixture covers the exact nine-language contract", () => {
  assert.deepEqual(LOCALES, ["en", "zh-Hans", "zh-Hant", "ar", "de", "es", "fr", "ja", "ko"]);
  assert.equal(Object.keys(passingCatalogs().site).length, LOCALES.length);
});
