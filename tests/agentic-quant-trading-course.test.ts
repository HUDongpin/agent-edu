import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  AGENTIC_QUANT_TRADING_COURSE,
  AGENTIC_QUANT_TRADING_MODULES,
  validateAgenticQuantTradingCourse,
} from "../lib/agentic-quant-trading";
import {
  checkAgenticQuantTradingCourse,
  hasImmutableGithubEvidence,
} from "../scripts/check-agentic-quant-trading-course.mjs";
import { drawCourseKitQuizQuestions } from "../lib/course-kit/quiz";

test("Course 17 satisfies the bilingual Course Kit contract", () => {
  assert.deepEqual(validateAgenticQuantTradingCourse(), []);
  const course = AGENTIC_QUANT_TRADING_COURSE;
  assert.equal(course.manifest.id, "agentic-quant-trading");
  assert.equal(course.manifest.displayNumber, 17);
  assert.equal(course.manifest.phases.length, 4);
  assert.equal(course.manifest.modules.length, 12);
  assert.equal(course.manifest.milestoneCount, 14);
  assert.equal(course.manifest.modules.reduce((sum, module) => sum + module.minutes, 0), 780);
  assert.equal(course.quiz.questions.length, 36);
  assert.equal(course.capstone.artifacts.length, 8);
});

test("GitHub is technical evidence and X records are cross-evidenced announcements", () => {
  const sources = AGENTIC_QUANT_TRADING_COURSE.sources;
  const github = sources.filter((source) => source.kind === "github-repository");
  const xPosts = sources.filter((source) => source.kind === "social-post");
  const riskAndResearch = sources.filter((source) => [
    "law-or-regulation",
    "official-guidance",
    "research",
  ].includes(source.kind));
  assert.equal(sources.length, 27);
  assert.equal(github.length, 13);
  assert.ok(github.every((source) => /\b[0-9a-f]{40}\b/i.test(source.revision || "") && source.licence));
  assert.ok(github.every((source) => {
    const sha = source.revision?.match(/\b[0-9a-f]{40}\b/i)?.[0];
    return Boolean(sha && hasImmutableGithubEvidence(source, sha));
  }));
  assert.equal(xPosts.length, 6);
  assert.equal(riskAndResearch.length, 8);
  assert.ok(xPosts.every((source) => /^https:\/\/x\.com\/[^/]+\/status\/\d+$/.test(source.url)));
  assert.ok(xPosts.every((source) => source.evidenceUrls.length >= 2));
});

test("GitHub evidence rejects a mutable tag-only record", () => {
  const sha = "a".repeat(40);
  assert.equal(hasImmutableGithubEvidence({
    evidenceUrls: ["https://github.com/example/project/releases/tag/v1.0.0"],
  }, sha), false);
  assert.equal(hasImmutableGithubEvidence({
    evidenceUrls: [`https://github.com/example/project/commit/${sha}`],
  }, sha), true);
  assert.equal(hasImmutableGithubEvidence({
    evidenceUrls: [`https://github.com/example/project/blob/${sha}/README.md`],
  }, sha), true);
});

test("teaching sections bind precise evidence and isolate X to bounded version watches", () => {
  const sourceKind = new Map(AGENTIC_QUANT_TRADING_COURSE.sources.map((source) => [source.id, source.kind]));
  const used = new Set<string>();

  for (const courseModuleRecord of AGENTIC_QUANT_TRADING_MODULES) {
    for (const locale of ["en", "zhHans"] as const) {
      for (const section of courseModuleRecord.copy[locale].sections) {
        assert.ok(section.sourceIds?.length, `${courseModuleRecord.slug}/${locale}/${section.heading} needs explicit sourceIds`);
        for (const sourceId of section.sourceIds) used.add(sourceId);
        if (section.sourceIds.some((sourceId) => sourceKind.get(sourceId) === "social-post")) {
          assert.equal(
            "evidenceMode" in section ? section.evidenceMode : undefined,
            "version-watch",
            `${courseModuleRecord.slug}/${locale}/${section.heading}`,
          );
        }
      }
    }
  }

  assert.deepEqual(
    [...AGENTIC_QUANT_TRADING_COURSE.sources.map((source) => source.id)].filter((sourceId) => !used.has(sourceId)),
    [],
  );

  const socialIds = new Set(xPostsFromCourse());
  assert.ok(AGENTIC_QUANT_TRADING_COURSE.manifest.modules.every(
    (moduleRecord) => moduleRecord.sourceIds.every((sourceId) => !socialIds.has(sourceId)),
  ));
  assert.ok(AGENTIC_QUANT_TRADING_COURSE.quiz.questions.every(
    (question) => question.sourceIds.every((sourceId) => !socialIds.has(sourceId)),
  ));
  assert.ok(AGENTIC_QUANT_TRADING_COURSE.capstone.artifacts.every(
    (artifact) => artifact.sourceIds.every((sourceId) => !socialIds.has(sourceId)),
  ));
});

function xPostsFromCourse(): string[] {
  return AGENTIC_QUANT_TRADING_COURSE.sources
    .filter((source) => source.kind === "social-post")
    .map((source) => source.id);
}

test("module 10 is a deterministic local synthetic replay with no remote execution contract", () => {
  const courseModuleRecord = AGENTIC_QUANT_TRADING_MODULES.find((candidate) => candidate.slug === "paper-execution-reconciliation");
  assert.ok(courseModuleRecord);
  const copy = JSON.stringify(courseModuleRecord.copy);
  assert.match(copy, /local synthetic intent|本地合成意图/i);
  assert.match(copy, /approval_id|批准 ID/i);
  assert.match(copy, /intent_sha256|精确意图.*哈希/i);
  assert.match(copy, /single-use|一次性/i);
  assert.doesNotMatch(copy, /paper endpoint|brokerage account|券商账户/i);
});

test("the bounded fixture-contract self-test fails closed and never fabricates performance", () => {
  const fixtureDirectory = fileURLToPath(
    new URL("../public/courses/agentic-quant-trading/", import.meta.url),
  );
  const downloadPackNames = [
    "market-regime-synthetic-v1.csv",
    "news-signals-synthetic-v1.json",
    "risk-policy.template.json",
    "fixture-contract-self-test.py",
    "LICENSE.txt",
    "provenance.v1.json",
  ] as const;
  const copyDownloadPack = (destination: string) => {
    for (const name of downloadPackNames) {
      copyFileSync(join(fixtureDirectory, name), join(destination, name));
    }
  };
  const runMutatedDownloadPack = (mutate: (directory: string) => void) => {
    const directory = mkdtempSync(join(tmpdir(), "aicourse-course17-mutated-pack-"));
    try {
      copyDownloadPack(directory);
      mutate(directory);
      return spawnSync(
        "python3",
        [join(directory, "fixture-contract-self-test.py"), "--self-test"],
        { encoding: "utf8" },
      );
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  };
  const pinAssetHash = (directory: string, name: string) => {
    const assetPath = join(directory, name);
    const assetSha256 = createHash("sha256")
      .update(readFileSync(assetPath))
      .digest("hex");
    const provenancePath = join(directory, "provenance.v1.json");
    const provenance = JSON.parse(readFileSync(provenancePath, "utf8"));
    const record = provenance.files.find(
      (candidate: { path?: string }) => candidate.path === name,
    );
    assert.ok(record);
    record.sha256 = assetSha256;
    writeFileSync(provenancePath, `${JSON.stringify(provenance, null, 2)}\n`);
  };
  const mutatePolicyAndPinHash = (
    directory: string,
    mutation: "null-boundary" | "boolean-limits" | "missing-approval-reason",
  ) => {
    const policyPath = join(directory, "risk-policy.template.json");
    const policy = JSON.parse(readFileSync(policyPath, "utf8"));
    if (mutation === "null-boundary") {
      policy.executionBoundary = null;
    } else if (mutation === "boolean-limits") {
      policy.limits.maxGrossExposure.value = true;
      policy.limits.maxPositionWeight.value = true;
      policy.limits.maxIntentRate.value = true;
      policy.limits.maxIntentRate.windowSeconds = true;
    } else {
      policy.intentApproval.failClosedOn = policy.intentApproval.failClosedOn.filter(
        (reason: string) => reason !== "policy-version-mismatch",
      );
    }
    writeFileSync(policyPath, `${JSON.stringify(policy, null, 2)}\n`);
    pinAssetHash(directory, "risk-policy.template.json");
  };
  const assertStructuredFailure = (
    process: { status: number | null; stdout: string; stderr: string },
    failedAssertionId: string,
  ) => {
    assert.equal(process.status, 1, process.stderr || process.stdout);
    const result = JSON.parse(process.stdout);
    assert.equal(result.status, "fail");
    assert.equal(result.assertions.length, 7);
    assert.equal(
      result.assertions.find(
        (assertion: { id: string }) => assertion.id === failedAssertionId,
      )?.passed,
      false,
    );
    return result;
  };
  const policy = JSON.parse(
    readFileSync(`${fixtureDirectory}risk-policy.template.json`, "utf8"),
  );
  assert.equal(policy.mode, "local-synthetic-replay");
  assert.equal(policy.executionBoundary.networkAccess, false);
  assert.equal(policy.executionBoundary.externalAccounts, false);
  assert.equal(policy.executionBoundary.brokerConnections, false);
  assert.equal(policy.executionBoundary.credentialsAccepted, false);
  assert.deepEqual(policy.executionBoundary.remoteEndpoints, []);
  assert.equal(policy.executionBoundary.liveOrderCapability, false);
  assert.equal(policy.failClosed.enabled, true);
  assert.equal(policy.failClosed.defaultDecision, "deny");
  assert.equal(policy.failClosed.overrideAllowed, false);
  assert.equal(policy.limits.maxIntentRate.idempotentRetriesCountAsNew, false);
  assert.equal(policy.intentApproval.namedHumanRequired, true);
  assert.equal(policy.intentApproval.agentMayApprove, false);
  assert.equal(policy.intentApproval.singleUse, true);
  assert.equal(policy.intentApproval.mustBindExactIntentSha256, true);
  assert.equal(policy.intentApproval.issuanceBoundary.humanControlledChannelRequired, true);
  assert.equal(policy.intentApproval.issuanceBoundary.agentWriteAccess, false);
  assert.equal(policy.intentApproval.issuanceBoundary.verificationRequiredBeforeConsumption, true);
  assert.equal(policy.intentApproval.issuanceBoundary.revocationCheckRequiredBeforeConsumption, true);
  assert.equal(policy.intentApproval.issuanceBoundary.consumptionLedgerRequired, true);
  assert.deepEqual(policy.intentApproval.requiredFields, [
    "approvalId",
    "approvalEventId",
    "approverId",
    "approvedAt",
    "expiresAt",
    "intentSha256",
    "policyVersion",
    "proofType",
    "proofLocator",
  ]);

  const selfTest = spawnSync(
    "python3",
    [`${fixtureDirectory}fixture-contract-self-test.py`, "--self-test"],
    { encoding: "utf8" },
  );
  assert.equal(selfTest.status, 0, selfTest.stderr || selfTest.stdout);
  const receipt = JSON.parse(selfTest.stdout);
  assert.equal(receipt.status, "pass");
  assert.equal(receipt.illustrative_only, true);
  assert.equal(receipt.authorises_replay, false);
  assert.equal(receipt.authorises_market_action, false);
  assert.equal(receipt.network_client_code_present, false);
  assert.equal(receipt.network_isolation_verified, false);
  assert.equal(receipt.performance_metrics.status, "not-computable");
  assert.ok(receipt.performance_metrics.missing_inputs.length >= 6);
  assert.deepEqual(receipt.failure_reasons, []);
  assert.deepEqual(receipt.assertions.map((item: { id: string }) => item.id), [
    "fixture-integrity",
    "synthetic-identity",
    "bar-date-ordering",
    "timestamp-contract",
    "decision-input-availability",
    "declared-boundary-policy-shape",
    "performance-metrics-not-computable",
  ]);
  assert.ok(receipt.assertions.every((item: { passed: boolean }) => item.passed));

  const missingFixture = spawnSync(
    "python3",
    [
      `${fixtureDirectory}fixture-contract-self-test.py`,
      "--fixture-dir",
      `${fixtureDirectory}does-not-exist`,
      "--self-test",
    ],
    { encoding: "utf8" },
  );
  assert.equal(missingFixture.status, 1);
  const failedReceipt = JSON.parse(missingFixture.stdout);
  assert.equal(failedReceipt.status, "fail");
  assert.equal(failedReceipt.assertions.length, 7);
  assert.ok(failedReceipt.failure_reasons.length > 0);

  const isolatedDownloadDirectory = mkdtempSync(
    join(tmpdir(), "aicourse-course17-download-pack-"),
  );
  try {
    copyDownloadPack(isolatedDownloadDirectory);
    const isolatedSelfTest = spawnSync(
      "python3",
      [join(isolatedDownloadDirectory, "fixture-contract-self-test.py"), "--self-test"],
      { encoding: "utf8" },
    );
    assert.equal(
      isolatedSelfTest.status,
      0,
      isolatedSelfTest.stderr || isolatedSelfTest.stdout,
    );
    assert.equal(JSON.parse(isolatedSelfTest.stdout).status, "pass");
  } finally {
    rmSync(isolatedDownloadDirectory, { recursive: true, force: true });
  }

  const malformedProvenance = runMutatedDownloadPack((directory) => {
    const provenancePath = join(directory, "provenance.v1.json");
    const provenance = JSON.parse(readFileSync(provenancePath, "utf8"));
    provenance.files = null;
    writeFileSync(provenancePath, `${JSON.stringify(provenance, null, 2)}\n`);
  });
  assertStructuredFailure(malformedProvenance, "fixture-integrity");

  for (const mutation of [
    "null-boundary",
    "boolean-limits",
    "missing-approval-reason",
  ] as const) {
    const malformedPolicy = runMutatedDownloadPack((directory) => {
      mutatePolicyAndPinHash(directory, mutation);
    });
    assertStructuredFailure(malformedPolicy, "declared-boundary-policy-shape");
  }

  const missingEventCollection = runMutatedDownloadPack((directory) => {
    const eventPath = join(directory, "news-signals-synthetic-v1.json");
    const events = JSON.parse(readFileSync(eventPath, "utf8"));
    events.items = null;
    writeFileSync(eventPath, `${JSON.stringify(events, null, 2)}\n`);
    pinAssetHash(directory, "news-signals-synthetic-v1.json");
  });
  assertStructuredFailure(missingEventCollection, "synthetic-identity");

  const injectedReturnSeries = runMutatedDownloadPack((directory) => {
    const marketPath = join(directory, "market-regime-synthetic-v1.csv");
    const rows = readFileSync(marketPath, "utf8").trimEnd().split("\n");
    writeFileSync(
      marketPath,
      `${rows.map((row, index) => `${row},${index === 0 ? "strategy_return" : "0.001"}`).join("\n")}\n`,
    );
    pinAssetHash(directory, "market-regime-synthetic-v1.csv");
  });
  const returnSeriesReceipt = assertStructuredFailure(
    injectedReturnSeries,
    "performance-metrics-not-computable",
  );
  assert.equal(
    returnSeriesReceipt.performance_metrics.status,
    "capability-present-review-required",
  );
  assert.ok(returnSeriesReceipt.performance_metrics.computable_metrics.includes(
    "return-risk-or-pnl-metrics",
  ));
});

test("the fixed assessment draws exactly one unambiguous synthesis question per module", () => {
  const course = AGENTIC_QUANT_TRADING_COURSE;
  const draw = drawCourseKitQuizQuestions(
    course.quiz.questions.map((question) => ({
      ...question,
      critical: question.critical === true,
    })),
    course.quiz.drawCount,
    `${course.manifest.id}:${course.quiz.version}`,
  );
  assert.equal(draw.length, 12);
  for (const moduleRecord of course.manifest.modules) {
    assert.equal(
      draw.filter((question) => question.id.startsWith(`q-${moduleRecord.slug}-`)).length,
      1,
      moduleRecord.slug,
    );
  }
  assert.ok(course.quiz.questions.every(
    (question) => question.evidenceMode === "instructional-synthesis",
  ));

  const artifacts = new Set(Object.values(course.copy.en.modules).map((copy) => copy.artifact));
  const takeaways = new Set(Object.values(course.copy.en.modules).map((copy) => copy.takeaway));
  const reviewedDistractorSignatures = new Set<string>();
  for (const question of course.quiz.questions) {
    const questionCopy = course.copy.en.quiz.questions[question.id];
    const competingTruths = question.id.endsWith("-evidence")
      ? artifacts
      : question.id.endsWith("-boundary")
        ? takeaways
        : null;
    if (!competingTruths) continue;
    reviewedDistractorSignatures.add(JSON.stringify(
      questionCopy.options.filter((_, index) => index !== question.correctIndex).sort(),
    ));
    questionCopy.options.forEach((option, index) => {
      if (index !== question.correctIndex) {
        assert.equal(competingTruths.has(option), false, `${question.id}: ${option}`);
      }
    });
  }
  assert.equal(reviewedDistractorSignatures.size, 24);
});

test("method claims preserve five clocks, PBO and DSR boundaries, and avoid causal overclaim", () => {
  const copy = JSON.stringify(AGENTIC_QUANT_TRADING_MODULES);
  for (const field of ["event_at", "available_at", "ingested_at", "known_at", "decision_at"]) {
    assert.match(copy, new RegExp(field));
  }
  assert.match(copy, /complete synchronized T-by-N|完整同步 T×N/);
  assert.match(copy, /Deflated Sharpe Ratio|DSR/);
  assert.match(copy, /not a p-value or false-discovery correction|不是 p 值或错误发现校正/i);
  assert.doesNotMatch(copy, /causal backtest|causal simulator|因果回测|因果模拟器/i);
});

test("content passes while the intake freeze keeps release fail-closed", async () => {
  const content = await checkAgenticQuantTradingCourse();
  assert.equal(content.status, "pass", JSON.stringify(content.issues, null, 2));

  const release = await checkAgenticQuantTradingCourse({ release: true });
  assert.equal(release.status, "fail");
  assert.ok(release.issues.some((issue) => issue.gate === "release"));
});
