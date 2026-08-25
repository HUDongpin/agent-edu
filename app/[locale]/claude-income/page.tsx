import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CourseDashboard from "@/components/claude-income/CourseDashboard";
import JsonLd from "@/components/JsonLd";
import {
  CLAUDE_INCOME_COURSE,
  assertValidClaudeIncomeCourse,
  isClaudeIncomeLocale,
} from "@/lib/claude-income";
import { claudeIncomeSeoFor, claudeIncomeUrlFor } from "@/lib/claude-income/seo";
import { getMessages, translator } from "@/lib/i18n";
import { courseLocaleParams } from "@/lib/release-surface";
import { SITE } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return courseLocaleParams("claude-income");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isClaudeIncomeLocale(locale)) notFound();
  const t = translator(await getMessages(locale));
  return claudeIncomeSeoFor({
    locale,
    title: `${CLAUDE_INCOME_COURSE.title} · aicourse.top`,
    description: CLAUDE_INCOME_COURSE.summary,
    siteName: t("brand.name"),
  });
}

export default async function ClaudeIncomeCoursePage({ params }: Props) {
  const { locale } = await params;
  if (!isClaudeIncomeLocale(locale)) notFound();
  assertValidClaudeIncomeCourse();

  const t = translator(await getMessages(locale));
  const minutes = CLAUDE_INCOME_COURSE.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0);
  const courseUrl = claudeIncomeUrlFor(locale);
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Course",
        name: CLAUDE_INCOME_COURSE.title,
        description: CLAUDE_INCOME_COURSE.summary,
        url: courseUrl,
        provider: { "@id": `${SITE}/#org` },
        inLanguage: "en",
        educationalLevel: "Beginner to advanced",
        isAccessibleForFree: true,
        audience: {
          "@type": "Audience",
          audienceType: CLAUDE_INCOME_COURSE.audience,
        },
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          courseWorkload: `PT${minutes}M`,
        },
        hasPart: CLAUDE_INCOME_COURSE.lessons.map((lesson) => ({
          "@type": "LearningResource",
          position: lesson.order,
          name: lesson.title,
          description: lesson.summary,
          url: claudeIncomeUrlFor(locale, lesson.slug),
          inLanguage: "en",
          timeRequired: `PT${lesson.minutes}M`,
        })),
        offers: {
          "@type": "Offer",
          price: 0,
          priceCurrency: "USD",
          category: "Free",
          availability: "https://schema.org/InStock",
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
            item: courseUrl,
          },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={data} />
      <CourseDashboard locale={locale} catalogLabel={t("nav.courses")} />
    </>
  );
}
