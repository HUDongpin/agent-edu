import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LessonView from "@/components/codex/LessonView";
import JsonLd from "@/components/JsonLd";
import {
  CODEX_LESSON_SLUGS,
  getCodexLesson,
  isCodexLessonSlug,
  isCodexLocale,
  loadCodexCourse,
} from "@/lib/codex";
import { getMessages, translator } from "@/lib/i18n";
import { courseChildParams } from "@/lib/release-surface";
import { SITE, codexLessonPage, seoFor, urlFor } from "@/lib/seo";

type Props = { params: Promise<{ locale: string; lesson: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return courseChildParams("codex", "lesson", CODEX_LESSON_SLUGS);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, lesson } = await params;
  if (!isCodexLocale(locale) || !isCodexLessonSlug(lesson)) notFound();

  const [course, currentLesson, messages] = await Promise.all([
    loadCodexCourse(locale),
    getCodexLesson(locale, lesson),
    getMessages(locale),
  ]);
  const t = translator(messages);

  return seoFor({
    locale,
    page: codexLessonPage(lesson),
    title: `${currentLesson.copy.title} · ${course.copy.meta.title}`,
    description: currentLesson.copy.summary,
    siteName: t("brand.name"),
  });
}

export default async function CodexLessonPage({ params }: Props) {
  const { locale, lesson } = await params;
  if (!isCodexLocale(locale) || !isCodexLessonSlug(lesson)) notFound();

  const [course, messages] = await Promise.all([
    loadCodexCourse(locale),
    getMessages(locale),
  ]);
  const t = translator(messages);
  const currentLesson = course.units
    .flatMap((unit) => unit.lessons)
    .find((item) => item.slug === lesson);
  if (!currentLesson) notFound();

  const page = codexLessonPage(lesson);
  const lessonData = {
    "@type": "LearningResource",
    name: currentLesson.copy.title,
    description: currentLesson.copy.summary,
    url: urlFor(locale, page),
    inLanguage: locale,
    learningResourceType: "lesson",
    timeRequired: `PT${currentLesson.minutes}M`,
    isPartOf: {
      "@type": "Course",
      name: course.copy.meta.title,
      url: urlFor(locale, "codex/"),
      provider: { "@id": `${SITE}/#org` },
    },
  };
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      lessonData,
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
            item: urlFor(locale, "codex/"),
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
