"use client";

import { useMemo } from "react";
import type { CodexLessonSlug } from "@/lib/codex";
import { lessonProgressKey } from "./progress-store";
import useCourseProgress from "./useCourseProgress";

export default function useCodexLessonStates(
  lessonSlugs: readonly CodexLessonSlug[],
) {
  const progress = useCourseProgress();

  return useMemo(() => {
    const completed = new Set(
      lessonSlugs.filter((slug) => progress[lessonProgressKey(slug)] === true),
    );
    const recommendedSlug = lessonSlugs.find((slug) => !completed.has(slug)) ?? null;
    return { completed, recommendedSlug };
  }, [lessonSlugs, progress]);
}
