import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import {
  CapstoneChecklist,
} from "@/components/agent-orchestration/AssessmentInteractions";
import CourseStaticPageShell from "@/components/agent-orchestration/CourseStaticPageShell";
import styles from "@/components/agent-orchestration/AgentOrchestrationCourse.module.css";
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
    page: agentOrchestrationFixedPage("capstone"),
    title: `${course.copy.capstone.title} · ${course.copy.meta.title}`,
    description: course.copy.capstone.summary,
    siteName: t("brand.name"),
  });
}

export default async function AgentOrchestrationCapstonePage({ params }: Props) {
  const { locale } = await params;
  if (!isAgentOrchestrationLocale(locale)) notFound();
  assertValidAgentOrchestrationCourse();

  const [course, messages] = await Promise.all([
    loadAgentOrchestrationCourse(locale),
    getMessages(locale),
  ]);
  const t = translator(messages);
  const chinese = course.contentLocale === "zh-Hans";
  const capstonePage = agentOrchestrationFixedPage("capstone");
  const capstoneUrl = urlFor(course.contentLocale, capstonePage);
  const courseUrl = urlFor(course.contentLocale, "agent-orchestration/");
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LearningResource",
        name: course.copy.capstone.title,
        description: course.copy.capstone.summary,
        url: capstoneUrl,
        inLanguage: course.contentLocale,
        learningResourceType: "project",
        educationalUse: "capstone",
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
            name: course.copy.capstone.title,
            item: capstoneUrl,
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
        current="capstone"
        eyebrow={course.copy.ui.capstone ?? (chinese ? "综合项目" : "Capstone")}
        summary={course.copy.capstone.summary}
        testId="agent-orchestration-capstone-page"
        title={course.copy.capstone.title}
      >
        <section className={styles.capstoneIntro} aria-labelledby="capstone-operating-brief-title">
          <div>
            <p className={styles.kicker}>
              {chinese ? "运行场景" : "Operating scenario"}
            </p>
            <h2 id="capstone-operating-brief-title">
              {chinese ? "在评审前证明这套系统" : "Prove the system before review"}
            </h2>
          </div>
          <blockquote>{course.copy.capstone.scenario}</blockquote>
        </section>

        <CapstoneChecklist
          artifacts={course.copy.capstone.artifacts}
          statement={course.copy.capstone.completionStatement}
          labels={course.copy.ui}
        />

        <section className={styles.reviewQuestions} aria-labelledby="capstone-review-title">
          <p className={styles.kicker}>
            {course.copy.ui.accountableReview ?? (chinese ? "责任评审" : "Accountable review")}
          </p>
          <h3 id="capstone-review-title">
            {course.copy.ui.accountableReviewTitle
              ?? (chinese ? "发布评审组必须回答的问题" : "Questions your release panel must answer")}
          </h3>
          <ol>
            {course.copy.capstone.reviewQuestions.map((question, index) => (
              <li key={question}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{question}</p>
              </li>
            ))}
          </ol>
        </section>
      </CourseStaticPageShell>
    </>
  );
}
