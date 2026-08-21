import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { assertLabVitalsReport } from "../scripts/measure-lab-vitals.mjs";

const CANDIDATE_SHA = "a586b44a6b58bf209864d2cd9529bb9adff12012";

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
  assert.equal(evidence.sourceCommitSha, CANDIDATE_SHA);
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
  assert.equal(observation.sourceCommitSha, CANDIDATE_SHA);
  assert.equal(evidence.reportOnlyObservation.generatedAtUtc, observation.generatedAt);
  assert.equal(observation.browsers.length, 3);
  for (const browser of observation.browsers) {
    assert.equal(browser.summary.routes, 15);
    assert.equal(browser.summary.statusMismatches, 0);
    assert.equal(browser.summary.pageErrors, 0);
    assert.equal(browser.summary.violations, 145);
  }
});

test("the committed synthetic lab report binds the frozen candidate and full sample matrix", () => {
  const report = JSON.parse(readFileSync(
    "docs/release/evidence/lab-vitals-a586b44.json",
    "utf8",
  ));
  assert.equal(assertLabVitalsReport(report, 3), report);
  assert.equal(report.source.commitSha, CANDIDATE_SHA);
  assert.equal(report.source.dirty, false);
  assert.equal(report.conditions.samplesPerMode, 3);
  assert.equal(report.artifact.export.fileCount, 448);
});
