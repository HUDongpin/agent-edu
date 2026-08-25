import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CourseDashboard from "@/components/make-money-with-codex/CourseDashboard";
import JsonLd from "@/components/JsonLd";
import {
  MAKE_MONEY_WITH_CODEX_COURSE,
  MAKE_MONEY_WITH_CODEX_TOTAL_MINUTES,
  isCodexIncomeLocale,
} from "@/lib/make-money-with-codex";
import { loadCodexIncomeCopy } from "@/lib/make-money-with-codex/load";
import { getMessages, translator } from "@/lib/i18n";
import { courseLocaleParams } from "@/lib/release-surface";
import { seoFor, SITE, urlFor } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return courseLocaleParams("make-money-with-codex");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isCodexIncomeLocale(locale)) notFound();
  const messages = await getMessages(locale);
  const t = translator(messages);
  return seoFor({
    locale,
    availableLocales: ["en"],
    canonicalLocale: "en",
    page: "make-money-with-codex/",
    title: `${MAKE_MONEY_WITH_CODEX_COURSE.title} · aicourse.top`,
    description: MAKE_MONEY_WITH_CODEX_COURSE.summary,
    siteName: t("brand.name"),
  });
}

export default async function MakeMoneyWithCodexPage({ params }: Props) {
  const { locale } = await params;
  if (!isCodexIncomeLocale(locale)) notFound();
  const course = MAKE_MONEY_WITH_CODEX_COURSE;
  const copy = await loadCodexIncomeCopy(locale);
  const contentLocale = "en";
  const courseUrl = urlFor(contentLocale, "make-money-with-codex/");

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Course",
        name: course.title,
        description: course.summary,
        courseCode: "11",
        url: courseUrl,
        provider: { "@id": `${SITE}/#org` },
        inLanguage: "en",
        isAccessibleForFree: true,
        educationalLevel: course.level.replaceAll("-", " "),
        audience: { "@type": "Audience", audienceType: course.audience },
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          courseWorkload: `PT${MAKE_MONEY_WITH_CODEX_TOTAL_MINUTES}M`,
        },
        hasPart: course.lessons.map((lesson) => ({
          "@type": "LearningResource",
          position: lesson.order,
          name: lesson.title,
          url: urlFor(contentLocale, `make-money-with-codex/${lesson.slug}/`),
          timeRequired: `PT${lesson.minutes}M`,
          inLanguage: "en",
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Courses", item: urlFor(contentLocale, "courses/") },
          { "@type": "ListItem", position: 2, name: course.title, item: courseUrl },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={data} />
      <CourseDashboard locale={locale} copy={copy} />
    </>
  );
}
