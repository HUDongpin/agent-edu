import {
  validateCourseKitDefinition,
  type CourseKitValidationIssue,
} from "../course-kit/validate";
import { RESPONSIBLE_AI_COURSE } from "./definition";

const RETIRED_SOURCE_IDS = new Set([
  "system-cards",
  "ai-incident-database",
  "eu-hleg-human-agency",
]);

export function validateResponsibleAiCourse(): readonly CourseKitValidationIssue[] {
  const issues = [...validateCourseKitDefinition(RESPONSIBLE_AI_COURSE)];
  const { manifest, copy, quiz, capstone, sources } = RESPONSIBLE_AI_COURSE;
  const totalMinutes = manifest.modules.reduce(
    (sum, moduleManifest) => sum + moduleManifest.minutes,
    0,
  );

  if (manifest.id !== "responsible-ai" || manifest.displayNumber !== 16) {
    issues.push({
      path: "manifest",
      message: "Course 16 must use the responsible-ai ID and display number 16.",
    });
  }
  if (manifest.milestoneCount !== 12 || manifest.modules.length !== 10) {
    issues.push({
      path: "manifest",
      message: "Course 16 requires 10 modules plus quiz and capstone: 12 milestones.",
    });
  }
  if (totalMinutes !== 650) {
    issues.push({
      path: "manifest.modules",
      message: "Course 16 modules must total exactly 650 minutes.",
    });
  }
  if (quiz.questions.length !== 30) {
    issues.push({
      path: "quiz.questions",
      message: "Course 16 requires exactly 30 bank questions.",
    });
  }
  const criticalCount = quiz.questions.filter(
    (question) => question.critical === true,
  ).length;
  if (criticalCount < 1 || criticalCount >= quiz.drawCount) {
    issues.push({
      path: "quiz.questions",
      message: "Course 16 requires a non-empty critical gate smaller than the 12-question draw.",
    });
  }
  if (capstone.artifacts.length !== 9) {
    issues.push({
      path: "capstone.artifacts",
      message: "Course 16 requires exactly nine governance-dossier artifacts.",
    });
  }

  const sourceIds: ReadonlySet<string> = new Set(
    sources.map((source) => source.id),
  );
  for (const requiredSourceId of [
    "nist-genai-profile",
    "eu-hleg-ethics-guidelines-2019-historical",
    "eu-ai-act-2024",
    "nist-incident-response-r3",
  ]) {
    if (!sourceIds.has(requiredSourceId)) {
      issues.push({
        path: "sources",
        message: `Course 16 is missing required researched source: ${requiredSourceId}.`,
      });
    }
  }
  for (const sourceId of sourceIds) {
    if (RETIRED_SOURCE_IDS.has(sourceId)) {
      issues.push({
        path: "sources",
        message: `Retired or unverifiable source ID must not ship: ${sourceId}.`,
      });
    }
  }

  for (const locale of ["en", "zh-Hans"] as const) {
    for (const moduleManifest of manifest.modules) {
      const moduleCopy = copy[locale].modules[moduleManifest.slug];
      if (moduleCopy.sections.length < 3) {
        issues.push({
          path: `copy.${locale}.modules.${moduleManifest.slug}.sections`,
          message: "Every Course 16 module needs at least three substantive teaching sections.",
        });
      }
      if (moduleCopy.practice.steps.length < 3) {
        issues.push({
          path: `copy.${locale}.modules.${moduleManifest.slug}.practice.steps`,
          message: "Every Course 16 practice needs at least three executable steps.",
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

export function validateResponsibleAiCourseMessages(): string[] {
  return validateResponsibleAiCourse().map((issue) => `${issue.path}: ${issue.message}`);
}

export function assertValidResponsibleAiCourse(): void {
  const issues = validateResponsibleAiCourse();
  if (!issues.length) return;
  throw new Error(
    `Invalid Responsible AI course:\n${issues
      .map((issue) => `- ${issue.path}: ${issue.message}`)
      .join("\n")}`,
  );
}
