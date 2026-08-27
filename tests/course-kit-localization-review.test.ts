import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { RESPONSIBLE_AI_COURSE } from "../lib/responsible-ai";
import {
  courseKitCopySha256,
  evaluateCourseKitLocalizationReview,
} from "../scripts/check-course-kit-release.mjs";

const ledgerPath = new URL("../lib/course-kit/localization-reviews.json", import.meta.url);

function ledgerFixture() {
  return JSON.parse(readFileSync(ledgerPath, "utf8"));
}

const COMPLETE_CHECKS = {
  completeBundleReviewed: true,
  terminologyReviewed: true,
  semanticFidelityReviewed: true,
  technicalAccuracyReviewed: true,
};

test("Course Kit localization review is bound to exact copy bytes and remains pending", () => {
  const ledger = ledgerFixture();
  const review = ledger.courses["responsible-ai"].locales;
  assert.equal(review.en.copySha256, courseKitCopySha256(RESPONSIBLE_AI_COURSE.copy.en));
  assert.equal(
    review["zh-Hans"].copySha256,
    courseKitCopySha256(RESPONSIBLE_AI_COURSE.copy["zh-Hans"]),
  );
  const findings = evaluateCourseKitLocalizationReview(
    "responsible-ai",
    RESPONSIBLE_AI_COURSE,
    ledger,
  );
  assert.equal(findings.filter((finding) => finding.includes("review is pending")).length, 2);
  assert.deepEqual(
    evaluateCourseKitLocalizationReview(
      "responsible-ai",
      RESPONSIBLE_AI_COURSE,
      ledger,
      { requireApproval: false },
    ),
    [],
  );
});

test("a complete human sign-off passes, while automation or stale copy fails closed", () => {
  const approved = ledgerFixture();
  for (const locale of ["en", "zh-Hans"]) {
    approved.courses["responsible-ai"].locales[locale] = {
      ...approved.courses["responsible-ai"].locales[locale],
      status: "approved",
      reviewer: "peter-reviewer",
      reviewedOn: "2026-08-26",
      checks: COMPLETE_CHECKS,
    };
  }
  assert.deepEqual(
    evaluateCourseKitLocalizationReview("responsible-ai", RESPONSIBLE_AI_COURSE, approved),
    [],
  );

  const automated = structuredClone(approved);
  automated.courses["responsible-ai"].locales.en.reviewer = "codex-agent";
  assert.ok(
    evaluateCourseKitLocalizationReview("responsible-ai", RESPONSIBLE_AI_COURSE, automated)
      .some((finding) => finding.includes("non-automated human reviewer")),
  );

  const stale = structuredClone(approved);
  stale.courses["responsible-ai"].locales.en.copySha256 = "0".repeat(64);
  assert.ok(
    evaluateCourseKitLocalizationReview("responsible-ai", RESPONSIBLE_AI_COURSE, stale)
      .some((finding) => finding.includes("does not match the exact current copy bundle")),
  );
});
