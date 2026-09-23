import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("pilot core-journey and transfer metrics have reproducible participant-level rules", () => {
  const protocol = readFileSync("docs/release/pilot-protocol.md", "utf8");

  assert.match(protocol, /Protocol version: `1\.4`/);
  assert.match(protocol, /One facilitator and two observers/);
  assert.match(protocol, /second observer owns the independent calibration and re-scoring duties/);
  for (const task of ["C1", "C2", "C3", "C4", "C5", "C6"]) {
    assert.match(protocol, new RegExp(`\\*\\*${task}\\b`), `missing fixed task ID ${task}`);
  }
  assert.match(protocol, /\*\*X-A \/ X-B — unfamiliar transfer\.\*\*/);
  assert.match(protocol, /all six task IDs C1–C6/);
  assert.match(protocol, /C2 must have `C2 Pass = yes`/);
  assert.match(protocol, /no Help and no Blocker on any of those\s+rows/);
  assert.match(protocol, /clarification or recorded accessibility accommodation\s+does\s+not negate\s+independence/);
  assert.match(protocol, /helped, blocked, missing, abandoned or incomplete[\s\S]*composite `no`/);
  assert.match(protocol, /does not[\s\S]{0,80}shrink the planned denominator of six/);
  assert.match(protocol, /sum\(yes\) \/ 6/);
  assert.match(protocol, /both_transfer_scenarios_pass = yes/);
  assert.match(protocol, /X-A and X-B each satisfy the[\s\S]*without task-specific Help/);
  assert.match(protocol, /\| Learner \| C1–C6 all pass\/complete and independent, no Help\/Blocker\?/);
});

test("C2 has one fixed core scenario and cannot be substituted by transfer scoring", () => {
  const protocol = readFileSync("docs/release/pilot-protocol.md", "utf8");

  assert.match(protocol, /Fixed C2 core-scenario card — campus-facilities triage/);
  assert.match(protocol, /broken classroom equipment, water leaks and blocked\s+exits/);
  assert.match(protocol, /facilities service catalogue and emergency-escalation rule\s+are authoritative/);
  assert.match(protocol, /may classify a report, identify missing fields\s+and draft a work-order ticket/);
  assert.match(protocol, /may not decide that a site is safe, close an\s+incident, or authorize contractor dispatch or payment/);

  assert.match(protocol, /single prompt plus\s+rules, a staged workflow, a tool-using agent, or another method may pass/);
  assert.match(protocol, /no\s+particular method or framework name is required/);
  assert.match(protocol, /Record `C2 Pass = yes` only when[\s\S]*without task-specific Help or a Blocker/);
  assert.match(protocol, /connects it to at least one stated scenario\s+need: variable free text, missing information, or iterative clarification/);
  assert.match(protocol, /names at least one allowed model action/);
  assert.match(protocol, /retains at least one prohibited consequential action with code or a person\s+\*\*before\*\* it occurs/);
  assert.match(protocol, /explains why that boundary matters for safety, authorization or cost/);

  assert.match(protocol, /C2 remains one of the core tasks\s+C1–C6/);
  assert.match(protocol, /It is not X-A or X-B and is not scored with the transfer-card rubric/);
  assert.match(protocol, /a C2 pass cannot substitute for either transfer scenario/);
  assert.match(protocol, /both_transfer_scenarios_pass = yes/);
  assert.match(protocol, /X-A and X-B each satisfy the\s+scenario pass rule/);
});

test("the two-learner dry run cannot be mistaken for the pilot", () => {
  const dryRun = readFileSync("docs/release/pilot-dry-run.md", "utf8");

  // The pilot's release metric is sum(yes)/6 and the protocol forbids changing
  // the denominator, so a two-learner run produces no metric at all. The danger
  // is not that someone runs it — it is that its output is later filed as
  // evidence, which is the one thing the release record cannot survive.
  assert.match(dryRun, /not\*{0,2} the pilot/i);
  assert.match(dryRun, /nothing\s+produced\s+by\s+it\s+is\s+release\s+evidence/i);
  assert.match(dryRun, /cannot\s+satisfy\s+the\s+pilot\s+gate\s+in\s+`config\/release-readiness\.json`/);
  assert.match(dryRun, /does\s+not\s+change\s+release\s+status/i);

  // No threshold, no ratio, no pass mark: the vocabulary the full protocol owns.
  assert.doesNotMatch(dryRun, /## Exit metrics/);
  assert.doesNotMatch(dryRun, /at least \d\/6/);
  assert.doesNotMatch(dryRun, /Required threshold/);

  // The scenario cards live in one place. A second copy would drift, and a dry
  // run measuring a different card teaches nothing about the pilot.
  assert.doesNotMatch(dryRun, /campus\s+facilities\s+desk\s+receives/);
  assert.match(dryRun, /verbatim\s+and\s+by\s+reference/);

  // And the release instrument is still the six-learner protocol.
  const protocol = readFileSync("docs/release/pilot-protocol.md", "utf8");
  assert.match(protocol, /Protocol version: `1\.4`/);
  assert.match(dryRun, /version 1\.4/);
});

test("the dry run fixes its two run conditions where the facilitator will read them", () => {
  const dryRun = readFileSync("docs/release/pilot-dry-run.md", "utf8");

  /* Both conditions decide what a C3 or C6 row means, so both belong in the
     Frozen target, which is the part the facilitator fills in before
     recruiting. Left to the day, one learner can be given a credential or a
     prepared machine and the other not, and the two rows then describe
     different tasks. */
  const frozen = dryRun.slice(dryRun.indexOf("## Frozen target"), dryRun.indexOf("## Appendix A"));
  assert.match(frozen, /Lab key: none/);
  assert.match(frozen, /Learner machine: facilitator-supplied/);
  assert.match(frozen, /Install\s+time is not part of `?C6`?/);

  /* Keyless C3 is narrower than the protocol's C3, so it must say what
     completion is, and must not read as a change to the release instrument. */
  assert.match(dryRun, /No learner is given a Provider credential/);
  assert.match(dryRun, /for this run only/i);
  assert.match(dryRun, /deliberately not a\s+change to the protocol/);

  /* C5 cannot be observed on a build that does not carry the notice. */
  assert.match(dryRun, /git log -S lab\.draft\.damaged/);
});
