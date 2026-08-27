import {
  validateCourseKitDefinition,
  type CourseKitValidationIssue,
} from "../course-kit/validate";
import { AI_RESEARCH_COURSE } from "./definition";

const RETIRED_SOURCE_IDS = new Set([
  "grade-handbook",
  "tabula",
  "nannyml",
]);

export function validateAiResearchCourse(): readonly CourseKitValidationIssue[] {
  const issues = [...validateCourseKitDefinition(AI_RESEARCH_COURSE)];
  const { manifest, copy, quiz, capstone, sources } = AI_RESEARCH_COURSE;
  const totalMinutes = manifest.modules.reduce(
    (sum, moduleManifest) => sum + moduleManifest.minutes,
    0,
  );

  if (manifest.id !== "ai-research" || manifest.displayNumber !== 17) {
    issues.push({
      path: "manifest",
      message: "Course 17 must use the ai-research ID and display number 17.",
    });
  }
  if (manifest.milestoneCount !== 12 || manifest.modules.length !== 10) {
    issues.push({
      path: "manifest",
      message: "Course 17 requires 10 modules plus quiz and capstone: 12 milestones.",
    });
  }
  if (totalMinutes !== 650) {
    issues.push({
      path: "manifest.modules",
      message: "Course 17 modules must total exactly 650 minutes.",
    });
  }
  if (quiz.questions.length !== 30) {
    issues.push({
      path: "quiz.questions",
      message: "Course 17 requires exactly 30 bank questions.",
    });
  }
  const criticalCount = quiz.questions.filter(
    (question) => question.critical === true,
  ).length;
  if (criticalCount < 1 || criticalCount >= quiz.drawCount) {
    issues.push({
      path: "quiz.questions",
      message: "Course 17 requires a non-empty critical gate smaller than the 12-question draw.",
    });
  }
  if (capstone.artifacts.length !== 8) {
    issues.push({
      path: "capstone.artifacts",
      message: "Course 17 requires exactly eight auditable-review artifacts.",
    });
  }

  const sourceIds: ReadonlySet<string> = new Set(
    sources.map((source) => source.id),
  );
  for (const requiredSourceId of [
    "grade-book-current",
    "pdf-2-spec",
    "grobid-evaluation",
    "rag-original",
    "srqr",
    "fair-principles",
  ]) {
    if (!sourceIds.has(requiredSourceId)) {
      issues.push({
        path: "sources",
        message: `Course 17 is missing required researched source: ${requiredSourceId}.`,
      });
    }
  }
  for (const sourceId of sourceIds) {
    if (RETIRED_SOURCE_IDS.has(sourceId)) {
      issues.push({
        path: "sources",
        message: `Retired, weak, or out-of-scope source ID must not ship: ${sourceId}.`,
      });
    }
  }

  for (const locale of ["en", "zh-Hans"] as const) {
    for (const moduleManifest of manifest.modules) {
      const moduleCopy = copy[locale].modules[moduleManifest.slug];
      if (moduleCopy.sections.length < 3) {
        issues.push({
          path: `copy.${locale}.modules.${moduleManifest.slug}.sections`,
          message: "Every Course 17 module needs at least three substantive teaching sections.",
        });
      }
      if (moduleCopy.practice.steps.length < 3) {
        issues.push({
          path: `copy.${locale}.modules.${moduleManifest.slug}.practice.steps`,
          message: "Every Course 17 practice needs at least three executable steps.",
        });
      }
      moduleCopy.sections.forEach((section, index) => {
        const minimumCharacters = locale === "en" ? 120 : 40;
        if (section.paragraphs.join(" ").trim().length < minimumCharacters) {
          issues.push({
            path: `copy.${locale}.modules.${moduleManifest.slug}.sections[${index}]`,
            message: "Teaching-section prose is too thin for publication.",
          });
        }
      });
    }
  }

  return issues;
}

export function validateAiResearchCourseMessages(): string[] {
  return validateAiResearchCourse().map((issue) => `${issue.path}: ${issue.message}`);
}

export function assertValidAiResearchCourse(): void {
  const issues = validateAiResearchCourse();
  if (!issues.length) return;
  throw new Error(
    `Invalid AI Research course:\n${issues
      .map((issue) => `- ${issue.path}: ${issue.message}`)
      .join("\n")}`,
  );
}
