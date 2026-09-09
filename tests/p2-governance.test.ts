import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  findSensitiveEvidence,
  findSensitiveEvidenceText,
} from "../scripts/check-release-readiness.mjs";
import { assertLabVitalsReport } from "../scripts/measure-lab-vitals.mjs";
import { DEEPSEEK_PRICING } from "../lib/byok/pricing";

const ARCHIVED_EVIDENCE_SHA = "a586b44a6b58bf209864d2cd9529bb9adff12012";
const REPORT_ONLY_PREDECESSOR_SHA = "29e1f8b8405068875b1ba94a92b516930bc0d6b0";
const PRECHECK_SOURCE_DIGESTS = {
  ".github/workflows/ci.yml": "0d7ea3838f34797eae194a4ce74c159b3f3e19dd434d7b9348402c2d98296055",
  "e2e/smoke.spec.ts": "e8abfb76ef3c4a1c1720316a78bfda807dfbfe262f4160d29cc383f51bf9e9c5",
  "e2e/compat.spec.ts": "a1b8223df8f32ce2f4d899833f36359761d75a889368bb4cb710704344b10711",
  "config/csp-stage.json": "322a3cfaf40b23afd3272419ecd2a830a25770f3127094f1190ebf3858e757e8",
  "vercel.json": "1b1d15a4207d87c4abdd7205ae0ffc201a8f15d6c2f241e94692adaee382b7cb",
};

test("large Handbook rewrites require comparable profiling and rollback evidence", () => {
  const gate = readFileSync("docs/release/handbook-profiling-gate.md", "utf8");
  assert.match(gate, /Status: template implemented; no large Handbook rewrite is proposed or approved/);
  for (const marker of [
    "Before commit and clean-build identifier",
    "After commit and clean-build identifier",
    "CPU/network/cache profile",
    "Every raw run",
    "Keyboard/a11y task result",
    "Rollback commit or ordinary revert plan",
  ]) assert.match(gate, new RegExp(marker, "i"));
  assert.match(gate, /does not itself approve a rewrite/);
});

test("the strict CSP spike preserves static hosting and records its failed-closed local result", () => {
  const spike = readFileSync("docs/release/csp-hash-sri-spike.md", "utf8");
  const evidence = JSON.parse(readFileSync(
    "docs/release/evidence/csp-hash-sri-spike-a586b44.json",
    "utf8",
  ));
  const observation = JSON.parse(readFileSync(
    "docs/release/evidence/csp-report-only-observation-a586b44.json",
    "utf8",
  ));
  assert.match(spike, /Status: local feasibility experiment executed and failed closed/);
  assert.match(spike, /does not authorize a dynamic nonce service/);
  assert.match(spike, /Build twice from clean state/);
  assert.match(spike, /every emitted external script/);
  assert.match(spike, /inline script, inline style block and inline style\s+attribute/);
  assert.match(spike, /header byte length/);
  assert.match(spike, /report-only mode/);
  assert.match(spike, /different preview deployment for enforcement/);
  assert.match(spike, /ordinary rollback/);
  assert.match(spike, /local spike result is \*\*failed closed\*\*/);
  assert.match(spike, /Vercel report-only observation and later enforced\s+preview remain external pending/);

  assert.equal(evidence.schema, "agent-edu.csp-hash-sri-spike.v1");
  assert.equal(evidence.status, "failed-closed");
  assert.equal(evidence.sourceCommitSha, ARCHIVED_EVIDENCE_SHA);
  assert.equal(evidence.experimentalBuilds.length, 2);
  assert.equal(evidence.inventory.normalizedEquivalentAcrossBuilds, true);
  assert.equal(evidence.inventory.externalScriptsWithSha256Integrity, 6);
  assert.equal(evidence.inventory.externalScripts, 14);
  assert.equal(evidence.inventory.stylesheetsWithSha256Integrity, 0);
  assert.equal(evidence.inventory.stylesheets, 1);
  assert.equal(evidence.reportOnlyObservation.totalViolations, 435);
  assert.equal(evidence.reportOnlyObservation.violationDirective, "style-src-attr");
  assert.equal(evidence.decision.outcome, "not-feasible-on-current-static-candidate");
  assert.equal(evidence.decision.enforcementAttempted, false);
  assert.equal(evidence.rollback.experimentalConfigRemoved, true);
  assert.equal(evidence.rollback.compatibilityAfterRollback.webkit, "3/3 pass");
  assert.equal(evidence.privacy.containsFullGeneratedPolicy, false);

  assert.equal(observation.schema, "agent-edu.csp-report-only-observation.v1");
  assert.equal(observation.sourceCommitSha, ARCHIVED_EVIDENCE_SHA);
  assert.equal(evidence.reportOnlyObservation.generatedAtUtc, observation.generatedAt);
  assert.equal(observation.browsers.length, 3);
  for (const browser of observation.browsers) {
    assert.equal(browser.summary.routes, 15);
    assert.equal(browser.summary.statusMismatches, 0);
    assert.equal(browser.summary.pageErrors, 0);
    assert.equal(browser.summary.violations, 145);
  }
});

test("the archived synthetic lab report binds its source candidate and full sample matrix", () => {
  const report = JSON.parse(readFileSync(
    "docs/release/evidence/lab-vitals-a586b44.json",
    "utf8",
  ));
  assert.equal(assertLabVitalsReport(report, 3), report);
  assert.equal(report.source.commitSha, ARCHIVED_EVIDENCE_SHA);
  assert.equal(report.source.dirty, false);
  assert.equal(report.conditions.samplesPerMode, 3);
  assert.equal(report.artifact.export.fileCount, 448);
});

const EVIDENCE_DIR = "docs/release/evidence";
const CURRENT_CANDIDATE_SHA = "9e0aa0d329b5db72bf7e8e0cc06d560580a4b0e2";
const CURRENT_PRECHECK_SOURCE_DIGESTS = {
  ".github/workflows/ci.yml": "2bb87e093427f91753dbd2023389fb5c3c62b089abeea2193856ea4900e0bbb5",
  "e2e/smoke.spec.ts": "ad91aa4f3ca11a9d991b5d0c50541c8c20061a90bc7cec82d0cbef77596b984f",
  "e2e/compat.spec.ts": "b8d8c9922d53e3cc9557e05ec29d7f2269f08b04ea0bec49ad8864fd1df7bc4e",
  "config/csp-stage.json": "f869af83519bc91304b6caacbe5a88a2394c8ab6e3e1282a9d7824b6d5347a7c",
  "vercel.json": "10ac0161cd24d2330cca8fa95cbaba1cf7f14f66355cff6b1e8d88d4eb8b6857",
};

function stageAPrecheckFiles() {
  return readdirSync(EVIDENCE_DIR)
    .filter((name) => name.startsWith("stage-a-automated-precheck-") && name.endsWith(".json"))
    .sort();
}

/**
 * The properties every Stage A precheck must have, whichever run it describes.
 *
 * The per-record tests below pin one record each to its own run, and a record
 * added later would be governed by neither. These are the claims that make a
 * precheck a precheck rather than an authorization, so they are asserted over
 * whatever is in the directory: a new record is covered the moment it lands,
 * and one that quietly authorizes a release fails here.
 */
test("every Stage A automated precheck is bound to a green run, privacy-safe, and authorizes nothing", () => {
  const files = stageAPrecheckFiles();
  assert.ok(files.length >= 2, `expected at least two precheck records, found ${files.length}`);

  for (const name of files) {
    const where = `${EVIDENCE_DIR}/${name}`;
    const evidenceText = readFileSync(join(EVIDENCE_DIR, name), "utf8");
    const evidence = JSON.parse(evidenceText);

    assert.equal(evidence.schema, "agent-edu.stage-a-automated-precheck.v1", where);
    assert.equal(evidence.status, "automated-precheck-pass-external-gates-pending", where);

    /* Bound to one run, and to the commit that run tested. */
    assert.match(evidence.target.candidateCommitSha, /^[0-9a-f]{40}$/, where);
    assert.equal(evidence.githubActions.headSha, evidence.target.candidateCommitSha, where);
    assert.equal(evidence.githubActions.runAttempt, 1, where);
    assert.equal(evidence.githubActions.conclusion, "success", where);
    assert.deepEqual(
      evidence.githubActions.jobs.map((job: { name: string; conclusion: string }) => [
        job.name,
        job.conclusion,
      ]),
      [
        ["quality", "success"],
        ["smoke-chromium", "success"],
        ["compatibility", "success"],
      ],
      where,
    );

    /* The same five files, each a sha256, so a record cannot describe a tree
       it never digested. */
    assert.deepEqual(
      Object.keys(evidence.sourceFiles).sort(),
      Object.keys(CURRENT_PRECHECK_SOURCE_DIGESTS).sort(),
      where,
    );
    for (const digest of Object.values(evidence.sourceFiles)) {
      assert.match(digest as string, /^[0-9a-f]{64}$/, where);
    }

    /* Authorizes nothing, crosses no external boundary, carries no secret. */
    assert.equal(evidence.gateEffect.releaseAuthorized, false, where);
    assert.equal(evidence.gateEffect.stageAResultChanged, false, where);
    assert.equal(evidence.gateEffect.stageAReportOnlyStatus, "pending", where);
    assert.equal(
      Object.values(evidence.externalBoundaries).every((value) => value === false),
      true,
      where,
    );
    assert.equal(Object.values(evidence.privacy).every((value) => value === false), true, where);
    assert.deepEqual(findSensitiveEvidenceText(evidenceText), [], where);
    assert.deepEqual(findSensitiveEvidence(evidence), [], where);
    assert.match(evidence.decision, /automated precheck only/i, where);
    assert.match(evidence.decision, /Stage A remains pending/, where);
  }
});

/**
 * The current candidate's record, pinned to its own run.
 *
 * It differs from the 29e1f8b predecessor in the one way that matters to a
 * reader of release evidence: there is no preview deployment behind it, so it
 * asserts nothing about one. These assertions are what stop that absence from
 * being quietly filled in later.
 */
test("the 9e0aa0d Stage A precheck is bound to its run and asserts no deployment", () => {
  const evidence = JSON.parse(
    readFileSync(join(EVIDENCE_DIR, "stage-a-automated-precheck-9e0aa0d.json"), "utf8"),
  );

  assert.equal(evidence.target.candidateCommitSha, CURRENT_CANDIDATE_SHA);
  assert.equal(evidence.githubActions.runId, 34311863958);
  assert.equal(evidence.githubActions.event, "pull_request");
  assert.deepEqual(evidence.sourceFiles, CURRENT_PRECHECK_SOURCE_DIGESTS);

  /* No deployment was inspected, so none is described. */
  assert.equal(evidence.vercelDeploymentMetadata, null);
  assert.equal(evidence.target.vercelDeploymentId, null);
  assert.equal(evidence.target.checkpointSha, null);
  assert.match(evidence.notCarriedForward.vercelDeploymentMetadata, /No preview deployment exists/);

  /* The enforced stage is now a thing this record has an opinion about, and
     its opinion is still "pending" — csp:set moved the committed header key,
     not the observation the gate is waiting for. */
  assert.equal(evidence.gateEffect.stageAEnforcedStatus, "pending");
  assert.equal(evidence.githubActions.jobs[0].observedSummary.cspCheck, "pass-enforced-baseline");

  /* Counts observed in the run, not carried over from the predecessor. */
  assert.equal(evidence.automatedBrowserCoverage.compatibility.testsPerBrowser, 4);
  assert.equal(evidence.automatedBrowserCoverage.compatibility.totalTestsPassed, 12);
  assert.equal(evidence.automatedBrowserCoverage.privateLabSuite.totalTestsPassed, 42);
  assert.equal(
    evidence.automatedBrowserCoverage.privateLabSuite.perProjectSplitObservedInCi,
    false,
  );
  assert.match(
    evidence.notCarriedForward.journeyAndMatrixFigures,
    new RegExp(PRECHECK_SOURCE_DIGESTS["e2e/smoke.spec.ts"]),
  );
});

test("the 29e1f8b Stage A automated precheck is target-bound, privacy-safe, and cannot pass an external gate", () => {
  const evidenceText = readFileSync(
    "docs/release/evidence/stage-a-automated-precheck-29e1f8b.json",
    "utf8",
  );
  const evidence = JSON.parse(evidenceText);
  const readiness = JSON.parse(readFileSync("config/release-readiness.json", "utf8"));
  const reportOnlyGate = readiness.gates.vercelPreviewCsp;

  assert.equal(evidence.schema, "agent-edu.stage-a-automated-precheck.v1");
  assert.equal(evidence.status, "automated-precheck-pass-external-gates-pending");
  assert.equal(evidence.target.candidateCommitSha, REPORT_ONLY_PREDECESSOR_SHA);
  assert.deepEqual(evidence.target, reportOnlyGate.reportOnlyTarget);
  assert.equal(evidence.githubActions.runId, 32448414858);
  assert.equal(evidence.githubActions.runAttempt, 1);
  assert.equal(evidence.githubActions.event, "pull_request");
  assert.equal(evidence.githubActions.headSha, REPORT_ONLY_PREDECESSOR_SHA);
  assert.equal(evidence.githubActions.conclusion, "success");
  assert.deepEqual(
    evidence.githubActions.jobs.map((job: { name: string; conclusion: string }) => [
      job.name,
      job.conclusion,
    ]),
    [
      ["quality", "success"],
      ["smoke-chromium", "success"],
      ["compatibility", "success"],
    ],
  );

  assert.deepEqual(evidence.sourceFiles, PRECHECK_SOURCE_DIGESTS);
  assert.equal(evidence.automatedBrowserCoverage.journey.locales.length, 9);
  assert.deepEqual(evidence.automatedBrowserCoverage.journey.path, [
    "Home",
    "Handbook",
    "Control Room #play",
    "Lab",
    "Part 3 Build",
  ]);
  assert.equal(evidence.automatedBrowserCoverage.coreRouteLayout.matrixCasesPassed, 36);
  assert.equal(evidence.automatedBrowserCoverage.coreRouteLayout.routeAssertionsPassed, 144);
  assert.deepEqual(evidence.automatedBrowserCoverage.arabicRtlKeyboard.widths, [390, 979, 980, 1440]);
  assert.equal(evidence.automatedBrowserCoverage.arabicRtlKeyboard.matrixCasesPassed, 8);
  assert.deepEqual(evidence.automatedBrowserCoverage.compatibility.browsers, [
    "chromium",
    "firefox",
    "webkit",
  ]);
  assert.equal(evidence.automatedBrowserCoverage.compatibility.totalTestsPassed, 9);

  assert.equal(evidence.vercelDeploymentMetadata.deploymentId, evidence.target.vercelDeploymentId);
  assert.equal(evidence.vercelDeploymentMetadata.readyState, "READY");
  assert.equal(evidence.vercelDeploymentMetadata.configuredHeaderName, "content-security-policy-report-only");
  assert.equal(
    evidence.vercelDeploymentMetadata.configuredPolicySha256,
    "0c5cede8982b73e427417fff2e2f3e90968998cab2ab6f85fb26fc3bf8da394a",
  );
  assert.equal(evidence.vercelDeploymentMetadata.configuredPolicyBytes, 303);
  assert.equal(evidence.vercelDeploymentMetadata.actualResponseHeaderObserved, false);

  assert.deepEqual(evidence.gateEffect, {
    stageAReportOnlyStatus: "pending",
    stageAResultChanged: false,
    finalCandidateStableRunCountChanged: false,
    releaseAuthorized: false,
  });
  assert.equal(Object.values(evidence.externalBoundaries).every((value) => value === false), true);
  assert.equal(Object.values(evidence.privacy).every((value) => value === false), true);
  assert.deepEqual(findSensitiveEvidenceText(evidenceText), []);
  assert.deepEqual(findSensitiveEvidence(evidence), []);
  assert.match(evidence.decision, /automated precheck only/i);
  assert.match(evidence.decision, /Stage A remains pending/);
});

test("the external readiness precheck records blockers without mutating GitHub, Vercel, or production", () => {
  const evidenceText = readFileSync(
    "docs/release/evidence/external-readiness-precheck-20260821.json",
    "utf8",
  );
  const evidence = JSON.parse(evidenceText);
  const readiness = JSON.parse(readFileSync("config/release-readiness.json", "utf8"));

  assert.equal(evidence.schema, "agent-edu.external-readiness-precheck.v1");
  assert.equal(evidence.status, "blockers-observed-no-mutations-performed");
  assert.equal(evidence.repository.defaultBranch, "main");
  assert.equal(evidence.repository.mainCommitSha, "67e1beba98fee926925b254a152a1a1de1176376");

  const github = evidence.githubRequiredChecksPrecheck;
  assert.equal(github.protectedBranch, "main");
  assert.equal(github.branchProtected, false);
  assert.equal(github.applicableRulesCount, 0);
  assert.deepEqual(github.branchProtectionLookup, {
    result: "not-protected",
    httpStatus: 404,
  });
  assert.deepEqual(github.requiredCheckNames, ["quality", "smoke-chromium"]);
  assert.equal(github.qualityRequired, false);
  assert.equal(github.smokeChromiumRequired, false);
  assert.equal(github.rulesetOrProtectionId, null);
  assert.equal(github.gateStatusChanged, false);
  assert.equal(github.mutationPerformed, false);

  const production = evidence.productionRollbackAnchorPrecheck;
  assert.equal(production.commitSha, evidence.repository.mainCommitSha);
  assert.equal(production.deploymentId, "dpl_ESbehP8bB8n45aWks7EDBRUPXqVu");
  assert.equal(production.target, "production");
  assert.equal(production.readyState, "READY");
  assert.equal(production.commitMatchesObservedMain, true);
  assert.notEqual(production.commitSha, readiness.releaseTarget.candidateCommitSha);
  assert.notEqual(
    production.commitSha,
    readiness.gates.vercelPreviewCsp.reportOnlyTarget.candidateCommitSha,
  );
  assert.equal(production.rollbackValidated, false);
  assert.equal(production.rollbackPullRequestPrepared, false);
  assert.equal(production.releaseTagCreated, false);
  assert.equal(production.productionMutationPerformed, false);

  assert.equal(evidence.vercelProtectionPrecheck.ssoDeploymentType, "all_except_custom_domains");
  assert.equal(evidence.vercelProtectionPrecheck.protectionBypassKeyCount, 0);
  assert.equal(evidence.vercelProtectionPrecheck.exactPreviewPublicResponseHeaderObserved, false);
  assert.equal(evidence.vercelProtectionPrecheck.protectionChanged, false);
  assert.equal(evidence.vercelProtectionPrecheck.bypassCreated, false);
  assert.equal(Object.values(evidence.actionsNotPerformed).every((value) => value === true), true);
  assert.deepEqual(evidence.gateEffect, {
    githubRequiredChecksStatus: "pending",
    rollbackReadinessStatus: "pending",
    vercelReportOnlyStageAStatus: "pending",
    releaseAuthorized: false,
  });
  assert.equal(Object.values(evidence.privacy).every((value) => value === false), true);
  assert.deepEqual(findSensitiveEvidenceText(evidenceText), []);
  assert.deepEqual(findSensitiveEvidence(evidence), []);
});

test("the official Provider pricing precheck matches the dated snapshot without claiming a real canary", () => {
  const evidenceText = readFileSync(
    "docs/release/evidence/provider-pricing-precheck-20260821.json",
    "utf8",
  );
  const evidence = JSON.parse(evidenceText);

  assert.equal(evidence.schema, "agent-edu.provider-pricing-precheck.v1");
  assert.equal(
    evidence.status,
    "official-public-pricing-match-live-reconciliation-pending",
  );
  assert.equal(evidence.source.url, DEEPSEEK_PRICING.sourceUrl);
  assert.equal(evidence.source.currency, DEEPSEEK_PRICING.currency);
  assert.equal(evidence.source.unitTokens, DEEPSEEK_PRICING.unitTokens);
  assert.deepEqual(evidence.source.peakUtc, DEEPSEEK_PRICING.peakUtc);
  assert.deepEqual(evidence.models["deepseek-v4-flash"].offPeak, DEEPSEEK_PRICING.models["deepseek-v4-flash"].offPeak);
  assert.deepEqual(evidence.models["deepseek-v4-flash"].peak, DEEPSEEK_PRICING.models["deepseek-v4-flash"].peak);
  assert.deepEqual(evidence.models["deepseek-v4-pro"].offPeak, DEEPSEEK_PRICING.models["deepseek-v4-pro"].offPeak);
  assert.deepEqual(evidence.models["deepseek-v4-pro"].peak, DEEPSEEK_PRICING.models["deepseek-v4-pro"].peak);
  assert.equal(evidence.repositoryComparison.snapshotCheckedAt, DEEPSEEK_PRICING.checkedAt);
  assert.equal(Object.values(evidence.repositoryComparison).filter((value) => typeof value === "boolean").every((value) => value === true), true);
  assert.deepEqual(evidence.gateEffect, {
    providerPricingReconciliationStatus: "pending",
    statusChanged: false,
    releaseAuthorized: false,
  });
  assert.equal(Object.values(evidence.externalBoundaries).every((value) => value === false), true);
  assert.equal(Object.values(evidence.privacy).every((value) => value === false), true);
  assert.deepEqual(findSensitiveEvidenceText(evidenceText), []);
  assert.deepEqual(findSensitiveEvidence(evidence), []);
  assert.match(evidence.decision, /does not pass the release reconciliation/i);
});

test("the native-review catalog manifest freezes all review inputs without substituting for signatures", () => {
  const evidenceText = readFileSync(
    "docs/release/evidence/native-review-catalog-precheck-2cdf1d6.json",
    "utf8",
  );
  const evidence = JSON.parse(evidenceText);
  const expectedLocales = ["zh-Hans", "zh-Hant", "ar", "de", "es", "fr", "ja", "ko"];

  assert.equal(evidence.schema, "agent-edu.native-review-catalog-precheck.v1");
  assert.equal(
    evidence.status,
    "catalogs-frozen-automatic-checks-pass-human-review-pending",
  );
  assert.equal(
    evidence.source.productCandidateCommitSha,
    "2cdf1d6894b2f8293631742229fdd52cfa744d4d",
  );
  assert.equal(evidence.source.catalogsChangedSinceProductCandidate, false);
  assert.deepEqual(evidence.source.catalogTypes, ["site", "handbook", "widgets"]);
  assert.deepEqual(Object.keys(evidence.locales), expectedLocales);
  for (const locale of expectedLocales) {
    const entries = Object.entries(evidence.locales[locale].files) as [
      string,
      { keyCount: number; sha256: string },
    ][];
    assert.equal(entries.length, 3);
    assert.deepEqual(entries.map(([path]) => path), [
      `messages/${locale}.json`,
      `messages/handbook/${locale}.json`,
      `messages/widgets/${locale}.json`,
    ]);
    for (const [, file] of entries) {
      assert.equal(Number.isSafeInteger(file.keyCount) && file.keyCount > 0, true);
      assert.match(file.sha256, /^[a-f0-9]{64}$/);
    }
  }
  assert.deepEqual(evidence.automaticValidation, {
    keyCompleteness: "pass",
    placeholderParity: "pass",
    pluralCoverage: "pass",
    reasonedIdenticalTextAllowlist: "pass",
    nativeLanguageJudgment: "not-performed",
  });
  assert.deepEqual(evidence.gateEffect, {
    nativeReviewStatusesChanged: false,
    humanSignaturesPresent: false,
    finalCandidateBound: false,
    releaseAuthorized: false,
  });
  assert.equal(Object.values(evidence.privacy).every((value) => value === false), true);
  assert.deepEqual(findSensitiveEvidenceText(evidenceText), []);
  assert.deepEqual(findSensitiveEvidence(evidence), []);
  assert.match(evidence.reviewReuseRule, /all 24 file digests still match the final candidate/);
});
