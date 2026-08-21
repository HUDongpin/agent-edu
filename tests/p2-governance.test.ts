import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

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

test("the strict CSP spike preserves static hosting and remains honestly pending", () => {
  const spike = readFileSync("docs/release/csp-hash-sri-spike.md", "utf8");
  assert.match(spike, /Status: planned experiment; not executed and not a release pass/);
  assert.match(spike, /does not authorize a dynamic nonce service/);
  assert.match(spike, /Build twice from clean state/);
  assert.match(spike, /every emitted external script/);
  assert.match(spike, /inline script, inline style block and inline style\s+attribute/);
  assert.match(spike, /header byte length/);
  assert.match(spike, /report-only mode/);
  assert.match(spike, /different preview deployment for enforcement/);
  assert.match(spike, /ordinary rollback/);
  assert.match(spike, /truthful result is \*\*pending\*\*/);
});
