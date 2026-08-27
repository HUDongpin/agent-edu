import {
  validateCourseKitDefinition,
  type CourseKitValidationIssue,
} from "../course-kit/validate";
import { MACHINE_LEARNING_COURSE } from "./definition";

export function validateMachineLearningCourse(): readonly CourseKitValidationIssue[] {
  const issues = [...validateCourseKitDefinition(MACHINE_LEARNING_COURSE)];
  const { manifest, copy, quiz, capstone, sources } = MACHINE_LEARNING_COURSE;
  const totalMinutes = manifest.modules.reduce(
    (sum, moduleManifest) => sum + moduleManifest.minutes,
    0,
  );

  if (manifest.id !== "machine-learning") {
    issues.push({ path: "manifest.id", message: "Course 19 ID must be machine-learning." });
  }
  if (manifest.milestoneCount !== 14 || manifest.modules.length !== 12) {
    issues.push({
      path: "manifest",
      message: "Course 19 requires 12 modules plus quiz and capstone: 14 milestones.",
    });
  }
  if (totalMinutes !== 840) {
    issues.push({ path: "manifest.modules", message: "Course 19 modules must total 840 minutes." });
  }
  if (quiz.questions.length !== 36) {
    issues.push({ path: "quiz.questions", message: "Course 19 requires exactly 36 bank questions." });
  }
  const criticalCount = quiz.questions.filter((question) => question.critical).length;
  if (criticalCount < 1 || criticalCount >= quiz.drawCount) {
    issues.push({ path: "quiz.questions", message: "Course 19 requires a non-empty critical gate smaller than the 16-question draw." });
  }
  if (capstone.artifacts.length !== 8) {
    issues.push({ path: "capstone.artifacts", message: "Course 19 requires exactly eight capstone artifacts." });
  }
  if (sources.some((source) => source.kind === "case-study")) {
    issues.push({ path: "sources", message: "Course 19 core evidence must be official documentation, official guidance, or primary research rather than a case study." });
  }

  for (const locale of ["en", "zh-Hans"] as const) {
    for (const moduleManifest of manifest.modules) {
      const moduleCopy = copy[locale].modules[moduleManifest.slug];
      if (moduleCopy.sections.length < 2) {
        issues.push({
          path: `copy.${locale}.modules.${moduleManifest.slug}.sections`,
          message: "Every Course 19 module needs at least two substantive teaching sections.",
        });
      }
      moduleCopy.sections.forEach((section, index) => {
        if (section.paragraphs.join(" ").trim().length < 80) {
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

export function validateMachineLearningCourseMessages(): string[] {
  return validateMachineLearningCourse().map(
    (issue) => `${issue.path}: ${issue.message}`,
  );
}

export function assertValidMachineLearningCourse(): void {
  const issues = validateMachineLearningCourse();
  if (!issues.length) return;
  throw new Error(
    `Invalid Machine Learning course:\n${issues
      .map((issue) => `- ${issue.path}: ${issue.message}`)
      .join("\n")}`,
  );
}
