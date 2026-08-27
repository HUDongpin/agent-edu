import assert from "node:assert/strict";
import test from "node:test";
import diagramRightsLedger from "../lib/codex/diagram-rights.json";
import { CODEX_FIGURES } from "../lib/codex/figures";
import type { CodexFigureManifest } from "../lib/codex/types";
import {
  validateCodexDiagramRightsLedger,
  validateCodexFigureAuditLedger,
} from "../lib/codex/validate";

test("the released diagram rights and product capture audit contracts are both complete", () => {
  assert.deepEqual(validateCodexDiagramRightsLedger(), []);
  assert.deepEqual(validateCodexFigureAuditLedger(), []);
});

test("an original diagram carrying fabricated screenshot metadata fails closed", () => {
  const figures = CODEX_FIGURES.map((figure) => (
    figure.id === "fig-01"
      ? {
          ...figure,
          capturedOn: "2026-08-26",
          codexVersion: "fabricated-version",
          os: "fabricated-os",
          auditId: "codex-figure-audit.fig-01.fake",
        }
      : figure
  )) as unknown as readonly CodexFigureManifest[];

  const issues = validateCodexDiagramRightsLedger(figures);
  for (const field of ["capturedOn", "codexVersion", "os", "auditId"]) {
    assert.ok(
      issues.some((issue) => (
        issue.path === `figures.fig-01.${field}`
        && issue.message.includes("must not carry screenshot capture metadata")
      )),
      `expected fabricated ${field} to be rejected`,
    );
  }
});

test("removing one diagram rights record breaks both the set gate and its two-way binding", () => {
  const ledgerWithoutFirstRecord = {
    ...diagramRightsLedger,
    records: diagramRightsLedger.records.slice(1),
  };

  const issues = validateCodexDiagramRightsLedger(CODEX_FIGURES, ledgerWithoutFirstRecord);
  assert.ok(issues.some((issue) => (
    issue.path === "diagramRights.records"
    && issue.message === "Expected exactly 18 original-diagram rights records."
  )));
  assert.ok(issues.some((issue) => (
    issue.path === "figures.fig-01.rightsRecordId"
    && issue.message === "No matching publishable original-diagram rights record exists."
  )));
});
