import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
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
  assert.equal(sources.length, 25);
  assert.equal(github.length, 13);
  assert.ok(github.every((source) => /\b[0-9a-f]{40}\b/i.test(source.revision || "") && source.licence));
  assert.ok(github.every((source) => {
    const sha = source.revision?.match(/\b[0-9a-f]{40}\b/i)?.[0];
    return Boolean(sha && hasImmutableGithubEvidence(source, sha));
  }));
  assert.equal(xPosts.length, 6);
  assert.equal(riskAndResearch.length, 6);
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
});

test("module 10 is a deterministic local synthetic replay with no remote execution contract", () => {
  const courseModuleRecord = AGENTIC_QUANT_TRADING_MODULES.find((candidate) => candidate.slug === "paper-execution-reconciliation");
  assert.ok(courseModuleRecord);
  const copy = JSON.stringify(courseModuleRecord.copy);
  assert.match(copy, /local deterministic synthetic replay|本地确定性合成回放/i);
  assert.doesNotMatch(copy, /paper endpoint|brokerage account|券商账户/i);
});

test("the bundled local replay lab fails closed and passes its deterministic self-test", () => {
  const fixtureDirectory = fileURLToPath(
    new URL("../public/courses/agentic-quant-trading/", import.meta.url),
  );
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

  const selfTest = spawnSync(
    "python3",
    [`${fixtureDirectory}local-replay-lab.py`, "--self-test"],
    { encoding: "utf8" },
  );
  assert.equal(selfTest.status, 0, selfTest.stderr || selfTest.stdout);
  const receipt = JSON.parse(selfTest.stdout);
  assert.equal(receipt.status, "pass");
  assert.equal(receipt.illustrative_only, true);
  assert.equal(receipt.authorises_market_action, false);
  assert.equal(receipt.network_calls, 0);
  assert.deepEqual(receipt.failure_reasons, []);
  assert.ok(receipt.assertions.every((item: { passed: boolean }) => item.passed));
});

test("content and local release integration gates pass", async () => {
  const content = await checkAgenticQuantTradingCourse();
  assert.equal(content.status, "pass", JSON.stringify(content.issues, null, 2));

  const release = await checkAgenticQuantTradingCourse({ release: true });
  assert.equal(release.status, "pass", JSON.stringify(release.issues, null, 2));
});
