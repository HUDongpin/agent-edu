import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  findSensitiveEvidence,
  findSensitiveEvidenceText,
} from "../scripts/check-release-readiness.mjs";
import { assertLabVitalsReport } from "../scripts/measure-lab-vitals.mjs";

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

test("the Stage A automated precheck is target-bound, privacy-safe, and cannot pass an external gate", () => {
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
