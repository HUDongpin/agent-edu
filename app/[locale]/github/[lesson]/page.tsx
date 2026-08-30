import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LessonView from "@/components/github/LessonView";
import JsonLd from "@/components/JsonLd";
import {
  GITHUB_LESSON_SLUGS,
  getGithubLesson,
  isGithubLessonSlug,
  isGithubLocale,
  loadGithubCourse,
} from "@/lib/github";
import { getMessages, translator } from "@/lib/i18n";
import { courseChildParams } from "@/lib/release-surface";
import { SITE, githubLessonPage, seoFor, urlFor } from "@/lib/seo";

type Props = { params: Promise<{ locale: string; lesson: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return courseChildParams("github", "lesson", GITHUB_LESSON_SLUGS);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, lesson } = await params;
  if (!isGithubLocale(locale) || !isGithubLessonSlug(lesson)) notFound();

  const [course, currentLesson, messages] = await Promise.all([
    loadGithubCourse(locale),
    getGithubLesson(locale, lesson),
    getMessages(locale),
  ]);
  const t = translator(messages);

  return seoFor({
    locale,
    page: githubLessonPage(lesson),
    title: `${currentLesson.copy.title} · ${course.copy.meta.title}`,
    description: currentLesson.copy.summary,
    siteName: t("brand.name"),
  });
}

export default async function GithubLessonPage({ params }: Props) {
  const { locale, lesson } = await params;
  if (!isGithubLocale(locale) || !isGithubLessonSlug(lesson)) notFound();

  const [course, messages] = await Promise.all([
    loadGithubCourse(locale),
    getMessages(locale),
  ]);
  const t = translator(messages);
  const currentLesson = course.units
    .flatMap((unit) => unit.lessons)
    .find((item) => item.slug === lesson);
  if (!currentLesson) notFound();

  const page = githubLessonPage(lesson);
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LearningResource",
        name: currentLesson.copy.title,
        description: currentLesson.copy.summary,
        url: urlFor(locale, page),
        inLanguage: locale,
        learningResourceType: "lesson",
        timeRequired: `PT${currentLesson.minutes}M`,
        isPartOf: {
          "@type": "Course",
          courseCode: "6",
          name: course.copy.meta.title,
          url: urlFor(locale, "github/"),
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
            item: urlFor(locale, "github/"),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: currentLesson.copy.title,
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
