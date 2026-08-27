import {
  validateCourseKitDefinition,
  type CourseKitValidationIssue,
} from "../course-kit/validate";
import { AI_PYTHON_DATA_COURSE } from "./definition";

export function validateAiPythonDataCourse(): readonly CourseKitValidationIssue[] {
  const issues = [...validateCourseKitDefinition(AI_PYTHON_DATA_COURSE)];
  const { manifest, copy, quiz, capstone, sources } = AI_PYTHON_DATA_COURSE;
  const totalMinutes = manifest.modules.reduce(
    (sum, moduleManifest) => sum + moduleManifest.minutes,
    0,
  );

  if (manifest.id !== "ai-python-data") {
    issues.push({ path: "manifest.id", message: "Course 18 ID must be ai-python-data." });
  }
  if (manifest.milestoneCount !== 12 || manifest.modules.length !== 10) {
    issues.push({
      path: "manifest",
      message: "Course 18 requires 10 modules plus quiz and capstone: 12 milestones.",
    });
  }
  if (totalMinutes !== 600) {
    issues.push({ path: "manifest.modules", message: "Course 18 modules must total 600 minutes." });
  }
  if (quiz.questions.length !== 30) {
    issues.push({ path: "quiz.questions", message: "Course 18 requires exactly 30 bank questions." });
  }
  const criticalCount = quiz.questions.filter((question) => question.critical).length;
  if (criticalCount < 1 || criticalCount >= quiz.drawCount) {
    issues.push({ path: "quiz.questions", message: "Course 18 requires a non-empty critical gate smaller than the 12-question draw." });
  }
  if (capstone.artifacts.length !== 8) {
    issues.push({ path: "capstone.artifacts", message: "Course 18 requires exactly eight capstone artifacts." });
  }
  if (sources.some((source) => source.kind === "case-study")) {
    issues.push({ path: "sources", message: "Course 18 core evidence must be official, normative, or primary research rather than a case study." });
  }

  for (const locale of ["en", "zh-Hans"] as const) {
    for (const moduleManifest of manifest.modules) {
      const moduleCopy = copy[locale].modules[moduleManifest.slug];
      if (moduleCopy.sections.length < 2) {
        issues.push({
          path: `copy.${locale}.modules.${moduleManifest.slug}.sections`,
          message: "Every Course 18 module needs at least two substantive teaching sections.",
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

export function validateAiPythonDataCourseMessages(): string[] {
  return validateAiPythonDataCourse().map(
    (issue) => `${issue.path}: ${issue.message}`,
  );
}

export function assertValidAiPythonDataCourse(): void {
  const issues = validateAiPythonDataCourse();
  if (!issues.length) return;
  throw new Error(
    `Invalid AI Python & Data course:\n${issues
      .map((issue) => `- ${issue.path}: ${issue.message}`)
      .join("\n")}`,
  );
}
