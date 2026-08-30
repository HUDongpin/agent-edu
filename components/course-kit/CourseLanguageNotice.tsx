import type { CourseKitMaterialisedCourse } from "@/lib/course-kit/types";
import { DismissibleLanguageNotice } from "./DismissibleLanguageNotice";

export function CourseLanguageNotice({
  course,
}: {
  readonly course: CourseKitMaterialisedCourse;
}) {
  if (!course.locale.isFallback) return null;

  return (
    <DismissibleLanguageNotice
      titleId={`${course.id}-language-notice-title`}
      contentLocale={course.locale.contentLocale}
      contentDirection={course.locale.contentDirection}
      label={course.copy.ui.fallbackLanguageLabel}
      notice={course.copy.meta.fallbackNotice}
      dismissLabel={course.copy.ui.dismissLanguageNotice}
    />
  );
}
