import {
  assertValidCourseKitDefinition,
  validateCourseKitDefinition,
  type CourseKitValidationIssue,
} from "../course-kit/validate";
import { DEEP_LEARNING_COURSE } from "./definition";

export function validateDeepLearningCourse(): readonly CourseKitValidationIssue[] {
  return validateCourseKitDefinition(DEEP_LEARNING_COURSE);
}

export function validateDeepLearningCourseMessages(): string[] {
  return validateDeepLearningCourse().map(
    (issue) => `${issue.path}: ${issue.message}`,
  );
}

export function assertValidDeepLearningCourse(): void {
  assertValidCourseKitDefinition(DEEP_LEARNING_COURSE);
}
