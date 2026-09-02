import JsonLd from "@/components/JsonLd";
import {
  isCourseKitLocale,
  materialiseCourseKit,
  materialiseCourseKitModule,
} from "@/lib/course-kit/locale";
import {
  COURSE_KIT_REVIEWED_LOCALES,
  type CourseKitDefinition,
} from "@/lib/course-kit/types";
import { SITE, seoFor, urlFor } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { CourseDashboard } from "./CourseDashboard";
import { CourseCapstone } from "./CourseCapstone";
import { CourseMilestoneView, type CourseMilestoneSection } from "./CourseMilestoneView";
import { CourseQuiz } from "./CourseQuiz";
import { ModuleView } from "./ModuleView";
import { SourceRegister } from "./SourceRegister";

function coursePage(courseId: string, moduleSlug?: string): string {
  return moduleSlug
    ? `${courseId}/${moduleSlug}/`
    : `${courseId}/`;
}

function requireLocale(locale: string) {
  if (!isCourseKitLocale(locale)) notFound();
  return locale;
}

export function courseKitGenerateStaticParams(definition: CourseKitDefinition) {
  return definition.manifest.modules.map((module) => ({ module: module.slug }));
}

export function courseKitMetadata({
  definition,
  locale,
  moduleSlug,
}: {
  readonly definition: CourseKitDefinition;
  readonly locale: string;
  readonly moduleSlug?: string;
}): Metadata {
  const requestedLocale = requireLocale(locale);
  const course = materialiseCourseKit(definition, requestedLocale);
  const courseModule = moduleSlug
    ? materialiseCourseKitModule(course, moduleSlug)
    : undefined;
  if (moduleSlug && !courseModule) notFound();
  const title = courseModule
    ? `${courseModule.copy.title} · ${course.copy.meta.title}`
    : `${course.copy.meta.title} · aicourse.top`;
  const description = courseModule?.copy.summary ?? course.copy.meta.summary;

  return seoFor({
    locale: requestedLocale,
    page: coursePage(course.id, moduleSlug),
    title,
    description,
    siteName: "aicourse.top",
    availableLocales: COURSE_KIT_REVIEWED_LOCALES,
    canonicalLocale: course.locale.canonicalLocale,
  });
}

export function courseKitMilestoneMetadata({
  definition,
  locale,
  section,
}: {
  readonly definition: CourseKitDefinition;
  readonly locale: string;
  readonly section: CourseMilestoneSection;
}): Metadata {
  const requestedLocale = requireLocale(locale);
  const course = materialiseCourseKit(definition, requestedLocale);
  const content = section === "assessment"
    ? { title: course.quiz.title, description: course.quiz.intro }
    : section === "capstone"
      ? { title: course.capstone.title, description: course.capstone.intro }
      : {
          title: course.copy.ui.evidenceRegister,
          description: course.copy.meta.evidenceNote,
        };
  return seoFor({
    locale: requestedLocale,
    page: `${course.id}/${section}/`,
    title: `${content.title} · ${course.copy.meta.title}`,
    description: content.description,
    siteName: "aicourse.top",
    availableLocales: COURSE_KIT_REVIEWED_LOCALES,
    canonicalLocale: course.locale.canonicalLocale,
  });
}

function courseJsonLd(course: ReturnType<typeof materialiseCourseKit>) {
  const page = coursePage(course.id);
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": `${urlFor(course.locale.canonicalLocale, page)}#course`,
    name: course.copy.meta.title,
    description: course.copy.meta.summary,
    url: urlFor(course.locale.canonicalLocale, page),
    inLanguage: course.locale.contentLocale,
    isAccessibleForFree: true,
    provider: { "@id": `${SITE}/#org` },
    educationalLevel: course.copy.meta.level,
    timeRequired: `PT${course.modules.reduce((sum, module) => sum + module.minutes, 0)}M`,
    hasPart: course.modules.map((module) => ({
      "@type": "LearningResource",
      position: module.order,
      name: module.copy.title,
      description: module.copy.summary,
      inLanguage: course.locale.contentLocale,
      timeRequired: `PT${module.minutes}M`,
      url: urlFor(
        course.locale.canonicalLocale,
        coursePage(course.id, module.slug),
      ),
    })),
    offers: {
      "@type": "Offer",
      price: 0,
      priceCurrency: "USD",
      category: "Free",
      availability: "https://schema.org/InStock",
    },
  };
}

export function CourseKitDashboardRoute({
  definition,
  locale,
  supplement,
  requireStructuredReceipts = false,
  sectionHrefs,
}: {
  readonly definition: CourseKitDefinition;
  readonly locale: string;
  readonly supplement?: ReactNode;
  readonly requireStructuredReceipts?: boolean;
  readonly sectionHrefs?: {
    readonly assessment: string;
    readonly capstone: string;
    readonly sources: string;
  };
}) {
  const requestedLocale = requireLocale(locale);
  const course = materialiseCourseKit(definition, requestedLocale);
  return (
    <>
      <JsonLd data={courseJsonLd(course)} />
      <CourseDashboard
        course={course}
        supplement={supplement}
        requireStructuredReceipts={requireStructuredReceipts}
        sectionHrefs={sectionHrefs}
      />
    </>
  );
}

export function CourseKitModuleRoute({
  definition,
  locale,
  moduleSlug,
  supplement,
  requireStructuredReceipt = false,
  afterModulesHref,
  afterModulesTitle,
  capstoneHref,
}: {
  readonly definition: CourseKitDefinition;
  readonly locale: string;
  readonly moduleSlug: string;
  readonly supplement?: ReactNode;
  readonly requireStructuredReceipt?: boolean;
  readonly afterModulesHref?: string;
  readonly afterModulesTitle?: string;
  readonly capstoneHref?: string;
}) {
  const requestedLocale = requireLocale(locale);
  const course = materialiseCourseKit(definition, requestedLocale);
  const courseModule = materialiseCourseKitModule(course, moduleSlug);
  if (!courseModule) notFound();
  const page = coursePage(course.id, courseModule.slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: courseModule.copy.title,
    description: courseModule.copy.summary,
    url: urlFor(course.locale.canonicalLocale, page),
    inLanguage: course.locale.contentLocale,
    timeRequired: `PT${courseModule.minutes}M`,
    position: courseModule.order,
    isPartOf: {
      "@id": `${urlFor(course.locale.canonicalLocale, coursePage(course.id))}#course`,
      "@type": "Course",
      name: course.copy.meta.title,
    },
    educationalUse: ["instruction", "practice", "assessment"],
  };
  return (
    <>
      <JsonLd data={jsonLd} />
      <ModuleView
        course={course}
        module={courseModule}
        supplement={supplement}
        requireStructuredReceipt={requireStructuredReceipt}
        afterModulesHref={afterModulesHref}
        afterModulesTitle={afterModulesTitle}
        capstoneHref={capstoneHref}
      />
    </>
  );
}

export function CourseKitAssessmentRoute({
  definition,
  locale,
}: {
  readonly definition: CourseKitDefinition;
  readonly locale: string;
}) {
  const requestedLocale = requireLocale(locale);
  const course = materialiseCourseKit(definition, requestedLocale);
  const courseHref = `/${requestedLocale}/${course.id}/`;
  const lastModule = course.modules.at(-1);
  const sourceTitles = Object.fromEntries(
    course.sources.map((source) => [source.id, source.title]),
  );
  return (
    <CourseMilestoneView
      course={course}
      current="assessment"
      title={course.copy.ui.finalAssessment}
      summary={course.quiz.intro}
      previousHref={lastModule ? `${courseHref}${lastModule.slug}/` : courseHref}
      previousTitle={lastModule?.copy.title ?? course.copy.meta.title}
      nextHref={`${courseHref}capstone/`}
      nextTitle={course.copy.ui.capstone}
    >
      <CourseQuiz
        quiz={course.quiz}
        config={course.progress}
        labels={course.copy.ui}
        sourcesHref={`${courseHref}sources/`}
        sourceTitles={sourceTitles}
        requirePrerequisites
        showIntro={false}
      />
    </CourseMilestoneView>
  );
}

export function CourseKitCapstoneRoute({
  definition,
  locale,
  requireStructuredReceipts = false,
  requirePrerequisites = false,
}: {
  readonly definition: CourseKitDefinition;
  readonly locale: string;
  readonly requireStructuredReceipts?: boolean;
  readonly requirePrerequisites?: boolean;
}) {
  const requestedLocale = requireLocale(locale);
  const course = materialiseCourseKit(definition, requestedLocale);
  const courseHref = `/${requestedLocale}/${course.id}/`;
  const sourceTitles = Object.fromEntries(
    course.sources.map((source) => [source.id, source.title]),
  );
  return (
    <CourseMilestoneView
      course={course}
      current="capstone"
      title={course.copy.ui.capstone}
      summary={course.capstone.intro}
      previousHref={`${courseHref}assessment/`}
      previousTitle={course.copy.ui.finalAssessment}
      nextHref={`${courseHref}sources/`}
      nextTitle={course.copy.ui.evidenceRegister}
    >
      <CourseCapstone
        capstone={course.capstone}
        config={course.progress}
        labels={course.copy.ui}
        requireStructuredReceipts={requireStructuredReceipts}
        requirePrerequisites={requirePrerequisites}
        sourcesHref={`${courseHref}sources/`}
        sourceTitles={sourceTitles}
        showIntro={false}
      />
    </CourseMilestoneView>
  );
}

export function CourseKitSourcesRoute({
  definition,
  locale,
}: {
  readonly definition: CourseKitDefinition;
  readonly locale: string;
}) {
  const requestedLocale = requireLocale(locale);
  const course = materialiseCourseKit(definition, requestedLocale);
  const courseHref = `/${requestedLocale}/${course.id}/`;
  return (
    <CourseMilestoneView
      course={course}
      current="sources"
      title={course.copy.ui.evidenceRegister}
      summary={course.copy.meta.evidenceNote}
      previousHref={`${courseHref}capstone/`}
      previousTitle={course.copy.ui.capstone}
    >
      <SourceRegister
        sources={course.sources}
        labels={course.copy.ui}
        titleId={`${course.id}-sources-title`}
        compact
        locale={course.locale.contentLocale}
        showIntro={false}
        heading={course.copy.ui.sources}
        showEyebrow={false}
      />
    </CourseMilestoneView>
  );
}
