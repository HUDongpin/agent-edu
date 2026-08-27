import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LessonView from "@/components/software-engineering/LessonView";
import JsonLd from "@/components/JsonLd";
import {
  SOFTWARE_ENGINEERING_COVERAGE,
  SOFTWARE_ENGINEERING_LESSON_SLUGS,
  SOFTWARE_ENGINEERING_LOCALES,
  SOFTWARE_ENGINEERING_OVERVIEW,
  getSoftwareEngineeringLesson,
  isSoftwareEngineeringLessonSlug,
  isSoftwareEngineeringLocale,
  loadSoftwareEngineeringCourse,
  type SoftwareEngineeringLessonSlug,
} from "@/lib/software-engineering";
import { getMessages, translator } from "@/lib/i18n";
import {
  SITE,
  seoFor,
  softwareEngineeringLessonPage,
  urlFor,
} from "@/lib/seo";

type Props = { params: Promise<{ locale: string; lesson: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return SOFTWARE_ENGINEERING_LESSON_SLUGS.map((lesson) => ({ lesson }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, lesson } = await params;
  if (!isSoftwareEngineeringLocale(locale) || !isSoftwareEngineeringLessonSlug(lesson)) notFound();

  const [course, currentLesson, messages] = await Promise.all([
    loadSoftwareEngineeringCourse(locale),
    getSoftwareEngineeringLesson(locale, lesson),
    getMessages(locale),
  ]);
  const t = translator(messages);

  return seoFor({
    locale,
    availableLocales: SOFTWARE_ENGINEERING_LOCALES,
    canonicalLocale: locale,
    page: softwareEngineeringLessonPage(lesson),
    title: `${currentLesson.title} · ${course.copy.meta.title}`,
    description: currentLesson.summary,
    siteName: t("brand.name"),
  });
}

export default async function SoftwareEngineeringLessonPage({ params }: Props) {
  const { locale, lesson } = await params;
  if (!isSoftwareEngineeringLocale(locale) || !isSoftwareEngineeringLessonSlug(lesson)) notFound();

  const [course, messages] = await Promise.all([
    loadSoftwareEngineeringCourse(locale),
    getMessages(locale),
  ]);
  const t = translator(messages);
  const currentLesson = course.units
    .flatMap((unit) => unit.lessons)
    .find((entry) => entry.slug === lesson);
  if (!currentLesson) notFound();

  const page = softwareEngineeringLessonPage(lesson);
  const alignments = SOFTWARE_ENGINEERING_COVERAGE
    .filter((entry) => (
      (entry.lessonSlugs as readonly SoftwareEngineeringLessonSlug[])
        .includes(currentLesson.slug)
    ))
    .map((entry) => ({
      "@type": "AlignmentObject",
      alignmentType: "teaches",
      targetName: entry.area,
      targetUrl: "https://www.computer.org/education/bodies-of-knowledge/software-engineering",
    }));
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LearningResource",
        name: currentLesson.title,
        description: currentLesson.summary,
        url: urlFor(locale, page),
        inLanguage: "en",
        learningResourceType: "lesson",
        timeRequired: `PT${currentLesson.minutes}M`,
        educationalAlignment: alignments,
        isPartOf: {
          "@type": "Course",
          courseCode: "8",
          name: course.copy.meta.title,
          description: SOFTWARE_ENGINEERING_OVERVIEW.summary,
          url: urlFor(locale, "software-engineering/"),
          provider: { "@id": `${SITE}/#org` },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: t("nav.courses"),
            item: urlFor(locale, "courses/"),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: course.copy.meta.title,
            item: urlFor(locale, "software-engineering/"),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: currentLesson.title,
            item: urlFor(locale, page),
          },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={data} />
      <LessonView course={course} lesson={currentLesson} />
    </>
  );
}
