import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("pilot core-journey and transfer metrics have reproducible participant-level rules", () => {
  const protocol = readFileSync("docs/release/pilot-protocol.md", "utf8");

  assert.match(protocol, /Protocol version: `1\.3`/);
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
