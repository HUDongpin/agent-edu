import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import {
  FinalAssessment,
} from "@/components/agent-orchestration/AssessmentInteractions";
import CourseStaticPageShell from "@/components/agent-orchestration/CourseStaticPageShell";
import {
  AGENT_ORCHESTRATION_TRANSLATED_LOCALES,
  assertValidAgentOrchestrationCourse,
  isAgentOrchestrationLocale,
  loadAgentOrchestrationCourse,
} from "@/lib/agent-orchestration";
import { getMessages, translator } from "@/lib/i18n";
import { courseLocaleParams } from "@/lib/release-surface";
import {
  agentOrchestrationFixedPage,
  seoFor,
  SITE,
  urlFor,
} from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return courseLocaleParams("agent-orchestration");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isAgentOrchestrationLocale(locale)) notFound();
  const [course, messages] = await Promise.all([
    loadAgentOrchestrationCourse(locale),
    getMessages(locale),
  ]);
  const t = translator(messages);
  return seoFor({
    locale,
    availableLocales: AGENT_ORCHESTRATION_TRANSLATED_LOCALES,
    canonicalLocale: course.contentLocale,
    page: agentOrchestrationFixedPage("assessment"),
    title: `${course.copy.finalAssessment.title} · ${course.copy.meta.title}`,
    description: course.copy.finalAssessment.summary,
    siteName: t("brand.name"),
  });
}

export default async function AgentOrchestrationAssessmentPage({ params }: Props) {
  const { locale } = await params;
  if (!isAgentOrchestrationLocale(locale)) notFound();
  assertValidAgentOrchestrationCourse();

  const [course, messages] = await Promise.all([
    loadAgentOrchestrationCourse(locale),
    getMessages(locale),
  ]);
  const t = translator(messages);
  const assessmentPage = agentOrchestrationFixedPage("assessment");
  const assessmentUrl = urlFor(course.contentLocale, assessmentPage);
  const courseUrl = urlFor(course.contentLocale, "agent-orchestration/");
  const questions = course.modules.map(({ copy, slug }) => ({
    moduleSlug: slug,
    moduleTitle: copy.title,
    checkpoint: copy.checkpoint,
  }));
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LearningResource",
        name: course.copy.finalAssessment.title,
        description: course.copy.finalAssessment.summary,
        url: assessmentUrl,
        inLanguage: course.contentLocale,
        learningResourceType: "assessment",
        educationalUse: "assessment",
        isAccessibleForFree: true,
        isPartOf: {
          "@type": "Course",
          name: course.copy.meta.title,
          courseCode: "15",
          url: courseUrl,
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
            item: urlFor(course.contentLocale, "courses/"),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: course.copy.meta.title,
            item: courseUrl,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: course.copy.finalAssessment.title,
            item: assessmentUrl,
          },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={data} />
      <CourseStaticPageShell
        catalogLabel={t("nav.courses")}
        course={course}
        current="assessment"
        eyebrow={course.copy.ui.course ?? "Course 15"}
        summary={course.copy.finalAssessment.summary}
        testId="agent-orchestration-assessment-page"
        title={course.copy.ui.finalAssessment ?? "Final assessment"}
      >
        <FinalAssessment
          locale={course.locale}
          questions={questions}
          passPercent={course.copy.finalAssessment.passPercent}
          title={course.copy.finalAssessment.title}
          summary={course.copy.finalAssessment.summary}
          labels={course.copy.ui}
          showIntro={false}
        />
      </CourseStaticPageShell>
    </>
  );
}
