import {
  assertValidCourseKitDefinition,
  validateCourseKitDefinition,
  type CourseKitValidationIssue,
} from "../course-kit/validate";
import { PRODUCTION_AI_COURSE } from "./definition";

export function validateProductionAiCourse(): readonly CourseKitValidationIssue[] {
  return validateCourseKitDefinition(PRODUCTION_AI_COURSE);
}

export function validateProductionAiCourseMessages(): string[] {
  return validateProductionAiCourse().map(
    (issue) => `${issue.path}: ${issue.message}`,
  );
}

export function assertValidProductionAiCourse(): void {
  assertValidCourseKitDefinition(PRODUCTION_AI_COURSE);
}
