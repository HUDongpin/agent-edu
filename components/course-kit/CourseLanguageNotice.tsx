import type { CourseKitMaterialisedCourse } from "@/lib/course-kit/types";
import styles from "./CourseKit.module.css";

export function CourseLanguageNotice({
  course,
}: {
  readonly course: CourseKitMaterialisedCourse;
}) {
  if (!course.locale.isFallback) return null;

  return (
    <aside
      className={styles.languageNotice}
      aria-labelledby={`${course.id}-language-notice-title`}
      lang={course.locale.contentLocale}
      dir={course.locale.contentDirection}
    >
      <strong id={`${course.id}-language-notice-title`}>
        {course.copy.ui.fallbackLanguageLabel}: {course.locale.contentLocale}
      </strong>
      <p>{course.copy.meta.fallbackNotice}</p>
    </aside>
  );
}
