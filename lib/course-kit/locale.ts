import { createCourseKitProgressConfig } from "./progress";
import {
  COURSE_KIT_FALLBACK_LOCALE,
  COURSE_KIT_LOCALES,
  COURSE_KIT_REVIEWED_LOCALES,
  type CourseKitDefinition,
  type CourseKitDirection,
  type CourseKitLocale,
  type CourseKitLocaleResolution,
  type CourseKitMaterialisedCourse,
  type CourseKitMaterialisedModule,
  type CourseKitReviewedLocale,
} from "./types";

export function isCourseKitLocale(value: string): value is CourseKitLocale {
  return COURSE_KIT_LOCALES.some((locale) => locale === value);
}

export function courseKitDirection(locale: string): CourseKitDirection {
  return locale === "ar" ? "rtl" : "ltr";
}

export function resolveCourseKitLocale(
  requestedLocale: CourseKitLocale,
): CourseKitLocaleResolution {
  const reviewed = COURSE_KIT_REVIEWED_LOCALES.some(
    (locale) => locale === requestedLocale,
  );
  const contentLocale: CourseKitReviewedLocale = reviewed
    ? (requestedLocale as CourseKitReviewedLocale)
    : COURSE_KIT_FALLBACK_LOCALE;

  return {
    requestedLocale,
    shellDirection: courseKitDirection(requestedLocale),
    contentLocale,
    // Both reviewed course copies use an LTR content surface. The surrounding
    // Arabic shell may stay RTL without reversing English fallback content.
    contentDirection: "ltr",
    canonicalLocale: contentLocale,
    isFallback: requestedLocale !== contentLocale,
    reviewedLocales: COURSE_KIT_REVIEWED_LOCALES,
  };
}

export function courseKitCanonicalPath(
  requestedLocale: CourseKitLocale,
  localeIndependentPath: string,
): string {
  const { canonicalLocale } = resolveCourseKitLocale(requestedLocale);
  const suffix = localeIndependentPath.startsWith("/")
    ? localeIndependentPath
    : `/${localeIndependentPath}`;
  return `/${canonicalLocale}${suffix}`;
}

export function materialiseCourseKit(
  definition: CourseKitDefinition,
  requestedLocale: CourseKitLocale,
): CourseKitMaterialisedCourse {
  const locale = resolveCourseKitLocale(requestedLocale);
  const copy = definition.copy[locale.contentLocale];
  const phases = definition.manifest.phases.map((phase) => ({
    id: phase.id,
    order: phase.order,
    title: copy.phases[phase.id].title,
    summary: copy.phases[phase.id].summary,
    moduleSlugs: [...phase.moduleSlugs],
  }));
  const phaseTitles = new Map(phases.map((phase) => [phase.id, phase.title]));
  const modules: CourseKitMaterialisedModule[] =
    definition.manifest.modules.map((module, index, allModules) => ({
      slug: module.slug,
      order: module.order,
      phaseId: module.phaseId,
      phaseTitle: phaseTitles.get(module.phaseId) ?? module.phaseId,
      minutes: module.minutes,
      sourceIds: [...module.sourceIds],
      copy: copy.modules[module.slug],
      previousSlug: allModules[index - 1]?.slug,
      nextSlug: allModules[index + 1]?.slug,
    }));
  const sources = definition.sources.map((source) => ({
    ...source,
    supports: copy.sourceAnnotations[source.id].supports,
    boundary: copy.sourceAnnotations[source.id].boundary,
  }));
  const questions = definition.quiz.questions.map((question) => ({
    ...question,
    ...copy.quiz.questions[question.id],
    sourceIds: [...question.sourceIds],
    critical: question.critical === true,
  }));
  const artifacts = definition.capstone.artifacts.map((artifact) => ({
    id: artifact.id,
    ...copy.capstone.artifacts[artifact.id],
    sourceIds: [...artifact.sourceIds],
  }));

  return {
    id: definition.manifest.id,
    version: definition.manifest.version,
    displayNumber: definition.manifest.displayNumber,
    publishedOn: definition.manifest.publishedOn,
    locale,
    copy,
    phases,
    modules,
    sources,
    quiz: {
      version: definition.quiz.version,
      drawCount: definition.quiz.drawCount,
      passCount: definition.quiz.passCount,
      title: copy.quiz.title,
      intro: copy.quiz.intro,
      questions,
    },
    capstone: {
      version: definition.capstone.version,
      title: copy.capstone.title,
      intro: copy.capstone.intro,
      instructions: [...copy.capstone.instructions],
      attestation: copy.capstone.attestation,
      artifacts,
    },
    progress: createCourseKitProgressConfig(definition),
  } as CourseKitMaterialisedCourse;
}

export function materialiseCourseKitModule(
  course: CourseKitMaterialisedCourse,
  moduleSlug: string,
): CourseKitMaterialisedModule | undefined {
  return course.modules.find((module) => module.slug === moduleSlug);
}

// American-spelling aliases ease integration without making them the house style.
export const materializeCourseKit = materialiseCourseKit;
export const materializeCourseKitModule = materialiseCourseKitModule;
