import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  findSensitiveEvidence,
  findSensitiveEvidenceText,
} from "../scripts/check-release-readiness.mjs";

type Readiness = {
  gates: {
    nativeReviews: { status: string; reviews: Record<string, unknown> };
    arabicRtlMatrix: { status: string; cases: unknown[] };
    providerCanary: {
      status: string;
      steps: Record<string, unknown>;
      reconciliations: Record<string, unknown>;
    };
    vercelPreviewCsp: {
      status: string;
      reportOnlyTarget: Record<string, unknown>;
      stages: Record<string, unknown>;
    };
    githubReadiness: { status: string; stableRuns: unknown[] };
    rollbackReadiness: { status: string; result: unknown };
  };
};

const readJson = (path: string) => JSON.parse(readFileSync(path, "utf8"));

test("the authoritative-roadmap audit separates repository work, external P0 gates, and later field evidence", () => {
  const evidencePath = "docs/release/evidence/roadmap-completion-audit-20260821.json";
  const evidenceText = readFileSync(evidencePath, "utf8");
  const evidence = JSON.parse(evidenceText);
  const readiness = readJson("config/release-readiness.json") as Readiness;

  assert.equal(evidence.schema, "agent-edu.roadmap-completion-audit.v1");
  assert.equal(
    evidence.status,
    "repository-implementation-audited-external-and-post-release-evidence-pending",
  );
  assert.deepEqual(evidence.authoritativePlan, {
    basename: "20260821_Codex Priority Implementation Plan on Agent Edu.docx",
    version: "v1.0",
    sha256: "4116ea2ece55ab72796e35b3021015f5622de921773d63ed9c8b2b708b5cc107",
    trackedInRepository: false,
    role: "requirements-source-not-runtime-instructions",
    authorityBoundary: "The DOCX original-delivery boundary described the turn that created the plan. Later direct user authorization controls the present implementation, isolated-branch push, Draft PR, and evidence work.",
  });

  assert.equal(evidence.targets.checkpointCommitSha, readiness.gates.vercelPreviewCsp.reportOnlyTarget.checkpointSha);
  assert.equal(evidence.targets.reportOnlyPredecessorCommitSha, readiness.gates.vercelPreviewCsp.reportOnlyTarget.candidateCommitSha);
  assert.equal(evidence.targets.integrationBranch, readiness.gates.vercelPreviewCsp.reportOnlyTarget.integrationBranch);
  assert.equal(evidence.targets.workflowDefinitionSha, readiness.gates.vercelPreviewCsp.reportOnlyTarget.workflowDefinitionSha);

  assert.equal(evidence.topologyObservation.checkpointBranch.localPresent, true);
  assert.equal(evidence.topologyObservation.checkpointBranch.remotePresent, false);
  assert.equal(evidence.topologyObservation.pullRequest.number, 3);
  assert.equal(evidence.topologyObservation.pullRequest.draft, true);
  assert.equal(evidence.topologyObservation.pullRequest.state, "open");
  assert.equal(evidence.topologyObservation.pullRequest.baseBranch, "main");
  assert.equal(evidence.topologyObservation.pullRequest.headBranch, evidence.targets.integrationBranch);
  assert.equal(evidence.topologyObservation.planTopologyRequirement, "one-pull-request-per-risk-topic");
  assert.equal(evidence.topologyObservation.conformance, "deviation-recorded-not-claimed-complete");

  const phaseCounts = Object.fromEntries(
    Object.entries(evidence.repositoryRequirements).map(([phase, requirements]) => [
      phase,
      (requirements as unknown[]).length,
    ]),
  );
  assert.deepEqual(phaseCounts, { wave0: 2, p0: 12, p1: 5, p2: 7 });

  const ids = (Object.values(evidence.repositoryRequirements) as Array<Array<{ id: string }>>)
    .flatMap((requirements) => requirements)
    .map((requirement) => requirement.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.every((id) => /^(W0|P0|P1|P2)-[A-Z0-9-]+$/.test(id)), true);

  const expectedCounts = {
    "native-reviews": Object.keys(readiness.gates.nativeReviews.reviews).length,
    "arabic-rtl-matrix": readiness.gates.arabicRtlMatrix.cases.length,
    "provider-canary-and-reconciliation":
      Object.keys(readiness.gates.providerCanary.steps).length
      + Object.keys(readiness.gates.providerCanary.reconciliations).length,
    "vercel-csp-stages": Object.keys(readiness.gates.vercelPreviewCsp.stages).length,
    "github-required-checks-and-stable-runs": 1 + readiness.gates.githubReadiness.stableRuns.length,
    "rollback-readiness": readiness.gates.rollbackReadiness.result ? 1 : 0,
  };
  assert.deepEqual(
    Object.fromEntries(evidence.p0ExternalBlockers.items.map(
      (item: { id: string; count: number }) => [item.id, item.count],
    )),
    expectedCounts,
  );
  assert.equal(
    evidence.p0ExternalBlockers.items.reduce(
      (sum: number, item: { count: number }) => sum + item.count,
      0,
    ),
    evidence.p0ExternalBlockers.expectedTotal,
  );
  assert.equal(evidence.p0ExternalBlockers.expectedTotal, 33);
  assert.equal(evidence.p0ExternalBlockers.items.every(
    (item: { status: string }) => item.status === "pending",
  ), true);
  assert.equal(evidence.p0ExternalBlockers.releaseDecision, "blocked");
  assert.equal(evidence.postReleaseEvidencePending.length, 8);
  assert.equal(evidence.explicitNonGoalsPreserved.length, 12);
  assert.equal(Object.values(evidence.actionsNotAuthorizedOrNotPerformed).every(Boolean), true);
  assert.deepEqual(evidence.operationalHistory, {
    transientVercelBypassCredentialCreatedThenRevoked: true,
    transientVercelBypassCredentialRetained: false,
    transientVercelBypassCredentialReused: false,
    browserObservationUsedExistingVercelSession: true,
  });
  assert.equal(Object.values(evidence.privacy).every((value) => value === false), true);
  assert.deepEqual(findSensitiveEvidenceText(evidenceText), []);
  assert.deepEqual(findSensitiveEvidence(evidence), []);
  assert.match(evidence.decision, /all 33 external P0 records remain pending/i);
  assert.match(evidence.decision, /deviation/i);
});

test("the Computer Use header observation proves the deployed report-only header without passing Stage A", () => {
  const evidencePath = "docs/release/evidence/stage-a-browser-header-observation-20260821.json";
  const evidenceText = readFileSync(evidencePath, "utf8");
  const evidence = JSON.parse(evidenceText);
  const readiness = readJson("config/release-readiness.json") as Readiness;
  const csp = readJson("config/csp-stage.json");
  const policyDigest = createHash("sha256").update(csp.policy).digest("hex");

  assert.equal(evidence.schema, "agent-edu.stage-a-browser-header-observation.v1");
  assert.equal(
    evidence.status,
    "actual-header-nine-locale-arabic-and-analytics-observed-provider-pending",
  );
  assert.deepEqual(evidence.target, readiness.gates.vercelPreviewCsp.reportOnlyTarget);
  assert.equal(evidence.observation.tool, "Chrome DevTools through Computer Use");
  assert.equal(evidence.observation.cacheDisabled, true);
  assert.equal(evidence.observation.statusCode, 200);
  assert.equal(evidence.observation.bypassCredentialCreated, false);
  assert.equal(evidence.responseHeaders.contentSecurityPolicyReportOnly.present, true);
  assert.equal(evidence.responseHeaders.contentSecurityPolicyReportOnly.policySha256, policyDigest);
  assert.equal(
    evidence.responseHeaders.contentSecurityPolicyReportOnly.policyBytes,
    Buffer.byteLength(csp.policy, "utf8"),
  );
  assert.equal(evidence.responseHeaders.contentSecurityPolicyReportOnly.matchesReviewedBaseline, true);
  assert.equal(evidence.responseHeaders.contentSecurityPolicyEnforcedPresent, false);
  assert.deepEqual(evidence.deployedJourney.localesObserved, [
    "en",
    "zh-Hans",
    "zh-Hant",
    "ar",
    "de",
    "es",
    "fr",
    "ja",
    "ko",
  ]);
  assert.deepEqual(evidence.deployedJourney.path, [
    "Home",
    "Handbook",
    "Control Room #play",
    "Lab",
    "Part 3 Build",
  ]);
  assert.equal(evidence.deployedJourney.english.allPathStopsLoaded, true);
  assert.equal(evidence.deployedJourney.english.saveAndTestDisabledWithoutKey, true);
  assert.equal(evidence.deployedJourney.english.paidRunTriggered, false);
  assert.equal(evidence.deployedJourney.arabic.allPathStopsLoaded, true);
  assert.equal(evidence.deployedJourney.arabic.homeKeySelectedFirstTab, true);
  assert.equal(evidence.deployedJourney.arabic.endKeySelectedLastTab, true);
  assert.equal(evidence.deployedJourney.arabic.darkThemeToggleObservedAndRestored, true);
  assert.equal(evidence.deployedJourney.arabic.paidRunTriggered, false);
  assert.equal(Object.keys(evidence.deployedJourney.otherLocales).length, 7);
  assert.equal(
    Object.values(evidence.deployedJourney.otherLocales).every(
      (locale: unknown) => Object.values(locale as Record<string, boolean>).every(Boolean),
    ),
    true,
  );
  assert.equal(evidence.deployedJourney.routeMatrixCases, 45);
  assert.equal(evidence.deployedJourney.routeMatrixPassed, 45);
  assert.equal(evidence.deployedJourney.otherSevenLocalesObserved, true);
  assert.equal(evidence.deployedJourney.viewportWidthAsserted, false);
  assert.equal(evidence.consoleObservation.unclassifiedViolationCount, 0);
  assert.equal(evidence.consoleObservation.cleanExtensionFreeWindowObserved, true);
  assert.deepEqual(evidence.consoleObservation.cleanSession, {
    observedAt: "2026-08-21T16:50:52Z",
    temporarilyDisabledExtensionCount: 10,
    extensionStatesRestored: true,
    freshNavigationConsoleMessages: 0,
    explicitReloadConsoleMessages: 0,
    fontViolationReproduced: false,
    authenticatedByExistingVercelSession: true,
    bypassCredentialCreated: false,
  });
  assert.equal(evidence.stageAChecklistEffect.actualResponseHeaderObserved, true);
  assert.equal(evidence.stageAChecklistEffect.partialJourneyLocalesObserved, 9);
  assert.equal(evidence.stageAChecklistEffect.nineLocaleCriticalJourneyObserved, true);
  assert.equal(evidence.stageAChecklistEffect.widthThemeArabicMatrixObserved, true);
  assert.equal(evidence.stageAChecklistEffect.arabicMechanicalCasesPassed, 8);
  assert.equal(evidence.stageAChecklistEffect.arabicHumanReviewSigned, false);
  assert.equal(evidence.stageAChecklistEffect.providerPathObserved, false);
  assert.equal(evidence.stageAChecklistEffect.analyticsBoundaryObserved, true);
  assert.equal(
    evidence.stageAChecklistEffect.analyticsEvidenceRef,
    "docs/release/evidence/stage-a-analytics-computer-use-observation-20260821.json",
  );
  assert.equal(evidence.stageAChecklistEffect.allViolationsClassified, true);
  assert.equal(evidence.stageAChecklistEffect.stageAStatusChanged, false);
  assert.equal(evidence.stageAChecklistEffect.releaseAuthorized, false);
  assert.equal(readiness.gates.vercelPreviewCsp.status, "pending");
  assert.equal(Object.values(evidence.privacy).every((value) => value === false), true);
  assert.deepEqual(findSensitiveEvidenceText(evidenceText), []);
  assert.deepEqual(findSensitiveEvidence(evidence), []);
  assert.match(evidence.decision, /all nine locales loaded/i);
  assert.match(evidence.decision, /Stage A remains pending/i);
});

test("the Computer Use Analytics observation proves a same-origin pageview-only boundary without passing Stage A", () => {
  const evidencePath = "docs/release/evidence/stage-a-analytics-computer-use-observation-20260821.json";
  const evidenceText = readFileSync(evidencePath, "utf8");
  const evidence = JSON.parse(evidenceText);
  const readiness = readJson("config/release-readiness.json") as Readiness;

  assert.equal(evidence.schema, "agent-edu.stage-a-analytics-computer-use-observation.v1");
  assert.equal(evidence.status, "same-origin-pageview-only-observed-provider-path-pending");
  assert.deepEqual(evidence.target, readiness.gates.vercelPreviewCsp.reportOnlyTarget);
  assert.equal(evidence.observation.tool, "Chrome DevTools through Computer Use");
  assert.equal(evidence.observation.cacheDisabledDuringFreshObservation, true);
  assert.equal(evidence.observation.cacheSettingRestored, true);
  assert.equal(evidence.observation.temporarilyDisabledExtensionCount, 10);
  assert.equal(evidence.observation.extensionStatesRestored, true);
  assert.equal(evidence.observation.adblockPerSiteStateRestored, true);
  assert.equal(evidence.observation.devtoolsClosedAfterObservation, true);
  assert.equal(evidence.observation.browserReturnedToEnglishPreview, true);
  assert.equal(evidence.home.resourceCount, 2);
  assert.equal(evidence.lab.resourceCount, 2);
  assert.deepEqual(evidence.home.resources.map((item: { path: string }) => item.path), [
    "/7b56ad18206234de/script.js",
    "/7b56ad18206234de/view",
  ]);
  assert.deepEqual(evidence.lab.resources.map((item: { path: string }) => item.path), [
    "/7b56ad18206234de/script.js",
    "/7b56ad18206234de/view",
  ]);
  assert.equal(
    [...evidence.home.resources, ...evidence.lab.resources].every(
      (item: { originRelation: string }) => item.originRelation === "same-origin",
    ),
    true,
  );
  assert.deepEqual(evidence.home.queuedEventTypes, ["pageview"]);
  assert.deepEqual(evidence.lab.queuedEventTypes, ["pageview"]);
  assert.equal(evidence.lab.emptyKeyStateObserved, true);
  assert.equal(evidence.lab.saveAndTestDisabled, true);
  assert.equal(evidence.lab.customAnalyticsRequestCount, 0);
  assert.equal(evidence.lab.providerRequestCount, 0);
  assert.equal(evidence.lab.paidProviderRequestTriggered, false);
  assert.deepEqual(evidence.boundary, {
    analyticsScriptAndViewSameOrigin: true,
    pageviewOnly: true,
    labCustomEventObserved: false,
    requestPayloadInspected: false,
    providerPathObserved: false,
    stageAStatusChanged: false,
    stageBAuthorized: false,
    releaseAuthorized: false,
  });
  assert.equal(readiness.gates.vercelPreviewCsp.status, "pending");
  assert.equal(Object.values(evidence.privacy).every((value) => value === false), true);
  assert.deepEqual(findSensitiveEvidenceText(evidenceText), []);
  assert.deepEqual(findSensitiveEvidence(evidence), []);
  assert.match(evidence.decision, /closes the deployed Analytics-path observation only/i);
  assert.match(evidence.decision, /Stage A remains pending/i);
});

test("three report-only CI runs are repeatability evidence, not formal final-candidate stability", () => {
  const evidencePath = "docs/release/evidence/report-only-ci-repeatability-precheck-20260821.json";
  const evidenceText = readFileSync(evidencePath, "utf8");
  const evidence = JSON.parse(evidenceText);
  const readiness = readJson("config/release-readiness.json") as Readiness;

  assert.equal(evidence.schema, "agent-edu.report-only-ci-repeatability-precheck.v1");
  assert.equal(
    evidence.status,
    "three-unique-first-attempt-green-runs-on-report-only-head-final-candidate-stability-pending",
  );
  assert.deepEqual(evidence.target, {
    reportOnlyIntegrationHeadSha: "0b143664784cf8c48dabdabacf86ed722c21b84c",
    integrationBranch: "codex/release-202608-agent-edu",
    workflowDefinitionSha: "141c3f366ba118ed69fbaf4777a2bcd33376f12f",
    vercelDeploymentId: "dpl_FTxZpDRgZQJZX5t89CcJdE7CAUf9",
    vercelReadyState: "READY",
    vercelTarget: "preview",
    cspStage: "report-only",
  });
  assert.deepEqual(evidence.runs.map((run: { runId: string }) => run.runId), [
    "32505449571",
    "32506361214",
    "32506674465",
  ]);
  assert.deepEqual(evidence.runs.map((run: { sequence: number }) => run.sequence), [1, 2, 3]);
  assert.equal(new Set(evidence.runs.map((run: { runId: string }) => run.runId)).size, 3);
  assert.equal(evidence.runs.every(
    (run: { runAttempt: number; headSha: string; headBranch: string; conclusion: string; jobs: Record<string, string> }) =>
      run.runAttempt === 1
      && run.headSha === evidence.target.reportOnlyIntegrationHeadSha
      && run.headBranch === evidence.target.integrationBranch
      && run.conclusion === "success"
      && Object.values(run.jobs).every((conclusion) => conclusion === "success"),
  ), true);
  assert.equal(evidence.runs.every(
    (run: { createdAtUtc: string; completedAtUtc: string }) =>
      Date.parse(run.createdAtUtc) < Date.parse(run.completedAtUtc),
  ), true);
  assert.equal(evidence.runs.slice(1).every(
    (run: { completedAtUtc: string }, index: number) =>
      Date.parse(evidence.runs[index].completedAtUtc) < Date.parse(run.completedAtUtc),
  ), true);
  assert.equal(Object.values(evidence.summary).every(
    (value) => value === true || value === false,
  ), true);
  assert.equal(evidence.summary.failureRerunUsed, false);
  assert.equal(evidence.summary.releaseReadinessMutated, false);
  assert.deepEqual(evidence.formalGateBoundary, {
    mainRequiredChecksConfigured: false,
    enforcedCspFinalCandidateExists: false,
    countsAsFinalCandidateStableRuns: false,
    countsAsRequiredCheckProtection: false,
    stageBStarted: false,
    releaseAuthorized: false,
  });
  assert.equal(readiness.gates.githubReadiness.status, "pending");
  assert.equal(readiness.gates.githubReadiness.stableRuns.every(
    (run) => (run as { runId: null; result: { status: string } }).runId === null
      && (run as { result: { status: string } }).result.status === "pending",
  ), true);
  assert.equal(Object.values(evidence.privacy).every((value) => value === false), true);
  assert.deepEqual(findSensitiveEvidenceText(evidenceText), []);
  assert.deepEqual(findSensitiveEvidence(evidence), []);
  assert.match(evidence.decision, /do not populate the formal stableRuns gate/i);
  assert.match(evidence.decision, /enforced-CSP final candidate does not yet exist/i);
});

test("the Arabic Computer Use matrix is an eight-case mechanical precheck, never a human signature", () => {
  const evidencePath = "docs/release/evidence/arabic-rtl-computer-use-precheck-20260821.json";
  const evidenceText = readFileSync(evidencePath, "utf8");
  const evidence = JSON.parse(evidenceText);
  const readiness = readJson("config/release-readiness.json") as Readiness;

  assert.equal(evidence.schema, "agent-edu.arabic-rtl-computer-use-precheck.v1");
  assert.equal(
    evidence.status,
    "mechanical-browser-precheck-passed-human-arabic-review-pending",
  );
  assert.deepEqual(evidence.target, readiness.gates.vercelPreviewCsp.reportOnlyTarget);
  assert.deepEqual(
    evidence.cases.map((item: { id: string }) => item.id),
    (readiness.gates.arabicRtlMatrix.cases as Array<{ id: string }>).map((item) => item.id),
  );
  assert.equal(evidence.cases.length, 8);
  assert.equal(evidence.cases.every(
    (item: { width: number; orientation: string; result: string }) =>
      item.orientation === (item.width >= 980 ? "vertical" : "horizontal")
      && item.result === "pass-mechanical-precheck",
  ), true);
  assert.equal(evidence.summary.requiredCases, 8);
  assert.equal(evidence.summary.mechanicalPasses, 8);
  assert.equal(evidence.summary.humanPasses, 0);
  assert.equal(evidence.summary.releaseReadinessMutated, false);
  assert.equal(Object.values(evidence.sharedAssertions).every(
    (value) => value === true || value === 1 || value === "rtl" || value === "tab-start" || value === "tab-play",
  ), true);
  assert.equal(Object.values(evidence.humanBoundary).filter(
    (value) => typeof value === "boolean",
  ).every((value) => value === false), true);
  assert.equal(readiness.gates.arabicRtlMatrix.status, "pending");
  assert.equal(Object.values(evidence.privacy).every((value) => value === false), true);
  assert.deepEqual(findSensitiveEvidenceText(evidenceText), []);
  assert.deepEqual(findSensitiveEvidence(evidence), []);
  assert.match(evidence.decision, /signed human review/i);
});
