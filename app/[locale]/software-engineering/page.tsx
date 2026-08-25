import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CourseDashboard from "@/components/software-engineering/CourseDashboard";
import JsonLd from "@/components/JsonLd";
import {
  SOFTWARE_ENGINEERING_COVERAGE,
  SOFTWARE_ENGINEERING_LOCALES,
  SOFTWARE_ENGINEERING_OVERVIEW,
  isSoftwareEngineeringLocale,
  loadSoftwareEngineeringCourse,
} from "@/lib/software-engineering";
import { getMessages, translator } from "@/lib/i18n";
import {
  SITE,
  seoFor,
  softwareEngineeringLessonPage,
  urlFor,
} from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return SOFTWARE_ENGINEERING_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isSoftwareEngineeringLocale(locale)) notFound();

  const [course, messages] = await Promise.all([
    loadSoftwareEngineeringCourse(locale),
    getMessages(locale),
  ]);
  const t = translator(messages);

  return seoFor({
    locale,
    page: "software-engineering/",
    title: `${course.copy.meta.title} · aicourse.top`,
    description: SOFTWARE_ENGINEERING_OVERVIEW.summary,
    siteName: t("brand.name"),
  });
}

export default async function SoftwareEngineeringCoursePage({ params }: Props) {
  const { locale } = await params;
  if (!isSoftwareEngineeringLocale(locale)) notFound();

  const [course, messages] = await Promise.all([
    loadSoftwareEngineeringCourse(locale),
    getMessages(locale),
  ]);
  const t = translator(messages);
  const lessons = course.units.flatMap((unit) => unit.lessons);
  const minutes = lessons.reduce((total, lesson) => total + lesson.minutes, 0);
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Course",
        courseCode: "8",
        name: course.copy.meta.title,
        description: SOFTWARE_ENGINEERING_OVERVIEW.summary,
        url: urlFor(locale, "software-engineering/"),
        provider: { "@id": `${SITE}/#org` },
        inLanguage: "en",
        educationalLevel: "Intermediate to advanced",
        audience: {
          "@type": "Audience",
          audienceType: SOFTWARE_ENGINEERING_OVERVIEW.audience,
        },
        teaches: SOFTWARE_ENGINEERING_COVERAGE.map((entry) => entry.area),
        isAccessibleForFree: true,
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          courseWorkload: `PT${minutes}M`,
        },
        hasPart: lessons.map((lesson) => ({
          "@type": "LearningResource",
          name: lesson.title,
          url: urlFor(locale, softwareEngineeringLessonPage(lesson.slug)),
          position: lesson.order,
          timeRequired: `PT${lesson.minutes}M`,
          learningResourceType: "lesson",
          inLanguage: "en",
        })),
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
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={data} />
      <CourseDashboard course={course} />
    </>
  );
}
