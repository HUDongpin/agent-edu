import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  GITHUB_LOCALES,
  formatGithubDate,
  formatGithubNumber,
  formatGithubPercent,
  formatGithubVisibleNumbers,
  type GithubCourseCopy,
} from "../lib/github";

function copy(locale: string): GithubCourseCopy {
  return JSON.parse(
    readFileSync(new URL(`../messages/github/${locale}.json`, import.meta.url), "utf8"),
  ) as GithubCourseCopy;
}

test("Course 6 formats visible numbers with the explicit route locale", () => {
  assert.equal(formatGithubNumber("ar", 12), "١٢");
  assert.equal(formatGithubNumber("ar", 2, { minimumIntegerDigits: 2 }), "٠٢");
  assert.equal(formatGithubNumber("en", 2, { minimumIntegerDigits: 2 }), "02");
  assert.equal(
    formatGithubVisibleNumbers("ar", "12 lessons · 660 minutes"),
    "١٢ lessons · ٦٦٠ minutes",
  );
  assert.equal(formatGithubPercent("ar", 1 / 14), "٧٪");
  assert.equal(formatGithubPercent("en", 1 / 14), "7%");
  assert.equal(formatGithubNumber("zh-Hans", 12), "12");
});

test("Course 6 hydration-facing number formatting is byte-stable", () => {
  for (const path of [
    "components/github/CapstoneChecklist.tsx",
    "components/github/CompletionSummary.tsx",
    "components/github/CourseCurriculum.tsx",
    "components/github/CourseDashboard.tsx",
    "components/github/CourseProgress.tsx",
    "components/github/FinalQuiz.tsx",
    "components/github/LessonCourseMap.tsx",
    "lib/github/format.ts",
  ]) {
    assert.doesNotMatch(
      readFileSync(path, "utf8"),
      /new\s+Intl\.NumberFormat|toLocaleString/,
      path,
    );
  }
});

test("Course 6 formats ISO calendar dates deterministically in UTC", () => {
  assert.equal(formatGithubDate("en", "2026-08-24"), "Aug 24, 2026");
  assert.notEqual(formatGithubDate("ar", "2026-08-24"), "2026-08-24");
  assert.equal(formatGithubDate("en", "not-a-date"), "not-a-date");
});

test("Course 6 keeps source dates structured and removes the duplicated figure date", () => {
  for (const locale of GITHUB_LOCALES) {
    const catalog = copy(locale);
    assert.equal(
      catalog.meta.sourceNote.match(/\{sourceDate\}/g)?.length,
      1,
      `${locale}: sourceDate placeholder`,
    );
    assert.doesNotMatch(
      catalog.figures["fig-01"].caption,
      /2026/,
      `${locale}: figure caption duplicates its structured provenance date`,
    );
  }
});
