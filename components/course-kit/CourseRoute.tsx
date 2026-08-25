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
import { ModuleView } from "./ModuleView";

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
}: {
  readonly definition: CourseKitDefinition;
  readonly locale: string;
  readonly supplement?: ReactNode;
  readonly requireStructuredReceipts?: boolean;
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
}: {
  readonly definition: CourseKitDefinition;
  readonly locale: string;
  readonly moduleSlug: string;
  readonly supplement?: ReactNode;
  readonly requireStructuredReceipt?: boolean;
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
      />
    </>
  );
}
