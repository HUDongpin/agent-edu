import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CourseDashboard from "@/components/github/CourseDashboard";
import JsonLd from "@/components/JsonLd";
import { isGithubLocale, loadGithubCourse } from "@/lib/github";
import { getMessages, translator } from "@/lib/i18n";
import { courseLocaleParams } from "@/lib/release-surface";
import { SITE, githubLessonPage, seoFor, urlFor } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return courseLocaleParams("github");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isGithubLocale(locale)) notFound();

  const [course, messages] = await Promise.all([
    loadGithubCourse(locale),
    getMessages(locale),
  ]);
  const t = translator(messages);

  return seoFor({
    locale,
    page: "github/",
    title: `${course.copy.meta.title} · aicourse.top`,
    description: course.copy.meta.summary,
    siteName: t("brand.name"),
  });
}

export default async function GithubCoursePage({ params }: Props) {
  const { locale } = await params;
  if (!isGithubLocale(locale)) notFound();

  const [course, messages] = await Promise.all([
    loadGithubCourse(locale),
    getMessages(locale),
  ]);
  const t = translator(messages);
  const minutes = course.manifest.lessons.reduce(
    (total, lesson) => total + lesson.minutes,
    0,
  );
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Course",
        courseCode: "6",
        name: course.copy.meta.title,
        description: course.copy.meta.summary,
        url: urlFor(locale, "github/"),
        provider: { "@id": `${SITE}/#org` },
        inLanguage: locale,
        audience: {
          "@type": "Audience",
          audienceType: course.copy.meta.audience,
        },
        isAccessibleForFree: true,
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          courseWorkload: `PT${minutes}M`,
        },
        hasPart: course.units
          .flatMap((unit) => unit.lessons)
          .map((lesson) => ({
            "@type": "LearningResource",
            name: lesson.copy.title,
            url: urlFor(locale, githubLessonPage(lesson.slug)),
            position: lesson.order,
            timeRequired: `PT${lesson.minutes}M`,
            learningResourceType: "lesson",
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
            item: urlFor(locale, "github/"),
          },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={data} />
      <CourseDashboard course={course} catalogLabel={t("nav.courses")} />
    </>
  );
}
