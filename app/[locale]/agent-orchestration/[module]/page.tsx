import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import ModuleView from "@/components/agent-orchestration/ModuleView";
import {
  AGENT_ORCHESTRATION_MODULE_SLUGS,
  AGENT_ORCHESTRATION_TRANSLATED_LOCALES,
  assertValidAgentOrchestrationCourse,
  getAgentOrchestrationModule,
  isAgentOrchestrationLocale,
  isAgentOrchestrationModuleSlug,
  loadAgentOrchestrationCourse,
} from "@/lib/agent-orchestration";
import { getMessages, translator } from "@/lib/i18n";
import {
  agentOrchestrationModulePage,
  seoFor,
  SITE,
  urlFor,
} from "@/lib/seo";

type Props = { params: Promise<{ locale: string; module: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return AGENT_ORCHESTRATION_MODULE_SLUGS.map((module) => ({ module }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, module } = await params;
  if (!isAgentOrchestrationLocale(locale) || !isAgentOrchestrationModuleSlug(module)) notFound();
  const [course, current, messages] = await Promise.all([
    loadAgentOrchestrationCourse(locale),
    getAgentOrchestrationModule(locale, module),
    getMessages(locale),
  ]);
  const t = translator(messages);
  return seoFor({
    locale,
    availableLocales: AGENT_ORCHESTRATION_TRANSLATED_LOCALES,
    canonicalLocale: course.contentLocale,
    page: agentOrchestrationModulePage(module),
    title: `${current.copy.title} · ${course.copy.meta.title}`,
    description: current.copy.summary,
    siteName: t("brand.name"),
  });
}

export default async function AgentOrchestrationModulePage({ params }: Props) {
  const { locale, module } = await params;
  if (!isAgentOrchestrationLocale(locale) || !isAgentOrchestrationModuleSlug(module)) notFound();
  assertValidAgentOrchestrationCourse();

  const [course, current, messages] = await Promise.all([
    loadAgentOrchestrationCourse(locale),
    getAgentOrchestrationModule(locale, module),
    getMessages(locale),
  ]);
  const t = translator(messages);
  const moduleUrl = urlFor(course.contentLocale, agentOrchestrationModulePage(module));
  const courseUrl = urlFor(course.contentLocale, "agent-orchestration/");
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LearningResource",
        name: current.copy.title,
        description: current.copy.summary,
        url: moduleUrl,
        inLanguage: course.contentLocale,
        learningResourceType: "module",
        educationalUse: "instruction",
        position: current.order,
        timeRequired: `PT${current.minutes}M`,
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
          { "@type": "ListItem", position: 1, name: t("nav.courses"), item: urlFor(course.contentLocale, "courses/") },
          { "@type": "ListItem", position: 2, name: course.copy.meta.title, item: courseUrl },
          { "@type": "ListItem", position: 3, name: current.copy.title, item: moduleUrl },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={data} />
      <ModuleView course={course} module={current} />
    </>
  );
}
