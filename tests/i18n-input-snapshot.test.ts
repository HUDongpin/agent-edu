import assert from "node:assert/strict";
import test from "node:test";

import { isI18nSnapshotInput } from "../scripts/i18n-input-snapshot.mjs";

test("the generated platform matrix cannot invalidate the snapshot it reports", () => {
  assert.equal(isI18nSnapshotInput("outputs/course-platform-matrix.2026-08-26.json"), false);
  assert.equal(isI18nSnapshotInput("outputs\\course-platform-matrix.2026-08-26.json"), false);
});

test("research, rights, provenance, docs, and source files remain snapshot inputs", () => {
  for (const path of [
    "outputs/course-16-21-research-brief.md",
    "outputs/claude-figure-rights-clearance.md",
    "public/courses/claude/figure-provenance.v1.json",
    "docs/course-roadmap.md",
    "README.md",
    "components/course-kit/SourceRegister.tsx",
  ]) assert.equal(isI18nSnapshotInput(path), true, path);
});

test("only the exact dated platform-matrix filename is treated as a generated report", () => {
  for (const path of [
    "outputs/course-platform-matrix.json",
    "outputs/course-platform-matrix.2026-8-26.json",
    "outputs/course-platform-matrix.2026-08-26.md",
    "outputs/current-15-course-matrix.json",
  ]) assert.equal(isI18nSnapshotInput(path), true, path);
});

test("tool and generated output directories stay outside the content snapshot", () => {
  for (const path of [
    "node_modules/pkg/index.js",
    ".next/server/app.js",
    "out/en/index.html",
    "output/i18n-audit/report.json",
    "test-results/result.json",
  ]) assert.equal(isI18nSnapshotInput(path), false, path);
});
