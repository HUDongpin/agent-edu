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
    "actual-header-and-nine-locale-desktop-journey-pass-matrix-and-classification-pending",
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
  assert.equal(evidence.consoleObservation.unclassifiedViolationCount, 1);
  assert.equal(evidence.consoleObservation.cleanExtensionFreeWindowObserved, false);
  assert.equal(evidence.stageAChecklistEffect.actualResponseHeaderObserved, true);
  assert.equal(evidence.stageAChecklistEffect.partialJourneyLocalesObserved, 9);
  assert.equal(evidence.stageAChecklistEffect.nineLocaleCriticalJourneyObserved, true);
  assert.equal(evidence.stageAChecklistEffect.allViolationsClassified, false);
  assert.equal(evidence.stageAChecklistEffect.stageAStatusChanged, false);
  assert.equal(evidence.stageAChecklistEffect.releaseAuthorized, false);
  assert.equal(readiness.gates.vercelPreviewCsp.status, "pending");
  assert.equal(Object.values(evidence.privacy).every((value) => value === false), true);
  assert.deepEqual(findSensitiveEvidenceText(evidenceText), []);
  assert.deepEqual(findSensitiveEvidence(evidence), []);
  assert.match(evidence.decision, /all nine locales loaded/i);
  assert.match(evidence.decision, /Stage A remains pending/i);
});
