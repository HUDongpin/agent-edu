import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LessonView from "@/components/claude-income/LessonView";
import JsonLd from "@/components/JsonLd";
import {
  CLAUDE_INCOME_COURSE,
  CLAUDE_INCOME_LESSON_SLUGS,
  getClaudeIncomeLesson,
  isClaudeIncomeLessonSlug,
  isClaudeIncomeLocale,
} from "@/lib/claude-income";
import { claudeIncomeSeoFor, claudeIncomeUrlFor } from "@/lib/claude-income/seo";
import { getMessages, translator } from "@/lib/i18n";
import { courseChildParams } from "@/lib/release-surface";
import { SITE } from "@/lib/seo";

type Props = { params: Promise<{ locale: string; lesson: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return courseChildParams("claude-income", "lesson", CLAUDE_INCOME_LESSON_SLUGS);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, lesson } = await params;
  if (!isClaudeIncomeLocale(locale) || !isClaudeIncomeLessonSlug(lesson)) notFound();
  const current = getClaudeIncomeLesson(lesson);
  const t = translator(await getMessages(locale));
  return claudeIncomeSeoFor({
    locale,
    slug: lesson,
    title: `${current.title} · ${CLAUDE_INCOME_COURSE.title}`,
    description: current.summary,
    siteName: t("brand.name"),
  });
}

export default async function ClaudeIncomeLessonPage({ params }: Props) {
  const { locale, lesson } = await params;
  if (!isClaudeIncomeLocale(locale) || !isClaudeIncomeLessonSlug(lesson)) notFound();
  const current = getClaudeIncomeLesson(lesson);
  const t = translator(await getMessages(locale));
  const url = claudeIncomeUrlFor(locale, lesson);
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LearningResource",
        name: current.title,
        description: current.summary,
        url,
        inLanguage: "en",
        learningResourceType: "lesson",
        position: current.order,
        timeRequired: `PT${current.minutes}M`,
        isPartOf: {
          "@type": "Course",
          name: CLAUDE_INCOME_COURSE.title,
          url: claudeIncomeUrlFor(locale),
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
            item: `${SITE}/${locale}/courses/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: CLAUDE_INCOME_COURSE.title,
            item: claudeIncomeUrlFor(locale),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: current.title,
            item: url,
          },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={data} />
      <LessonView
        locale={locale}
        lesson={current}
        courseLabel={CLAUDE_INCOME_COURSE.title}
      />
    </>
  );
}
