import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import LessonView from "@/components/make-money-with-codex/LessonView";
import {
  MAKE_MONEY_WITH_CODEX_COURSE,
  MAKE_MONEY_WITH_CODEX_LESSON_BY_SLUG,
  MAKE_MONEY_WITH_CODEX_LESSON_SLUGS,
  isCodexIncomeLessonSlug,
  isCodexIncomeLocale,
} from "@/lib/make-money-with-codex";
import { loadCodexIncomeCopy } from "@/lib/make-money-with-codex/load";
import { getMessages, translator } from "@/lib/i18n";
import { courseChildParams } from "@/lib/release-surface";
import { makeMoneyWithCodexLessonPage, seoFor, SITE, urlFor } from "@/lib/seo";

type Props = { params: Promise<{ locale: string; lesson: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return courseChildParams(
    "make-money-with-codex",
    "lesson",
    MAKE_MONEY_WITH_CODEX_LESSON_SLUGS,
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, lesson } = await params;
  if (!isCodexIncomeLocale(locale) || !isCodexIncomeLessonSlug(lesson)) notFound();
  const current = MAKE_MONEY_WITH_CODEX_LESSON_BY_SLUG[lesson];
  const messages = await getMessages(locale);
  const t = translator(messages);
  return seoFor({
    locale,
    availableLocales: ["en"],
    canonicalLocale: "en",
    page: makeMoneyWithCodexLessonPage(lesson),
    title: `${current.title} · ${MAKE_MONEY_WITH_CODEX_COURSE.title}`,
    description: current.summary,
    siteName: t("brand.name"),
  });
}

export default async function MakeMoneyWithCodexLessonPage({ params }: Props) {
  const { locale, lesson } = await params;
  if (!isCodexIncomeLocale(locale) || !isCodexIncomeLessonSlug(lesson)) notFound();
  const current = MAKE_MONEY_WITH_CODEX_LESSON_BY_SLUG[lesson];
  const [messages, copy] = await Promise.all([
    getMessages(locale),
    loadCodexIncomeCopy(locale),
  ]);
  const t = translator(messages);
  const course = MAKE_MONEY_WITH_CODEX_COURSE;
  const contentLocale = "en";
  const lessonUrl = urlFor(contentLocale, makeMoneyWithCodexLessonPage(lesson));
  const courseUrl = urlFor(contentLocale, "make-money-with-codex/");

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LearningResource",
        name: current.title,
        description: current.summary,
        url: lessonUrl,
        inLanguage: "en",
        learningResourceType: "lesson",
        position: current.order,
        timeRequired: `PT${current.minutes}M`,
        isPartOf: {
          "@type": "Course",
          name: course.title,
          url: courseUrl,
          provider: { "@id": `${SITE}/#org` },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t("nav.courses"), item: urlFor(contentLocale, "courses/") },
          { "@type": "ListItem", position: 2, name: course.title, item: courseUrl },
          { "@type": "ListItem", position: 3, name: current.title, item: lessonUrl },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={data} />
      <LessonView lesson={current} locale={locale} copy={copy} />
    </>
  );
}
