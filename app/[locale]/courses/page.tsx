import Catalog from "@/components/courses/Catalog";
import { LOCALE_CODES, getMessages, isLocale, translator } from "@/lib/i18n";
import { SITE, seoFor, urlFor } from "@/lib/seo";
import { COURSE_MODULES, PUBLISHED_CATALOG_COURSES } from "@/lib/public-courses";
import {
  COURSE_RELEASE_SURFACES,
  contentLocaleForCourse,
  courseHrefFor,
  type ContentLocale,
} from "@/lib/release-surface";
import { GROK_COURSE_MANIFEST, loadGrokCourse } from "@/lib/grok";
import { GITHUB_LESSONS, loadGithubCourse } from "@/lib/github";
import { PROMPT_LESSONS, loadPromptCourse } from "@/lib/prompts";
import { RAG_LESSONS, loadRagCourse } from "@/lib/rag";
import { loadMcpCourse } from "@/lib/mcp/load";
import { MAKE_MONEY_WITH_CODEX_LESSONS } from "@/lib/make-money-with-codex/data";
import { CLAUDE_INCOME_COURSE } from "@/lib/claude-income";
import { loadAiTutorCourse } from "@/lib/ai-tutor";
import { loadProductManagementCourse } from "@/lib/product-management";
import { loadAgentOrchestrationCourse } from "@/lib/agent-orchestration";
import { SOFTWARE_ENGINEERING_LESSONS } from "@/lib/software-engineering";
import JsonLd from "@/components/JsonLd";
import type { Metadata } from "next";

export function generateStaticParams() {
  return LOCALE_CODES.map((locale) => ({ locale }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await params;
  const t = translator(await getMessages(locale));
  return seoFor({
    locale, page: "courses/",
    title: `${t("cat.title")} · aicourse.top`,
    description: t("cat.lede"),
    siteName: t("brand.name"),
  });
}

export default async function CoursesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = translator(await getMessages(locale));
  if (!isLocale(locale)) throw new Error(`Unsupported locale: ${locale}`);
  const contentLocale = locale as ContentLocale;
  const [
    grokCourse,
    githubCourse,
    promptCourse,
    ragCourse,
    aiTutorCourse,
    productManagementCourse,
    agentOrchestrationCourse,
  ] = await Promise.all([
    loadGrokCourse(contentLocale),
    loadGithubCourse(contentLocale),
    loadPromptCourse(contentLocale),
    loadRagCourse(contentLocale),
    loadAiTutorCourse(contentLocale),
    loadProductManagementCourse(contentLocale),
    loadAgentOrchestrationCourse(contentLocale),
  ]);
  const mcpCourse = await loadMcpCourse(contentLocale);

  const courseOneParts = COURSE_MODULES.map((module) => ({
    "@type": "Course",
    name: t(`c.${module.id}.title`),
    description: t(`c.${module.id}.blurb`),
    url: module.external ? module.href : `${urlFor(locale)}${module.href.replace(/^\//, "")}`,
    inLanguage: locale,
  }));

  const courseFiveParts = GROK_COURSE_MANIFEST.lessons.map((lesson) => ({
    "@type": "LearningResource",
    position: lesson.order,
    name: grokCourse.copy.lessons[lesson.slug].title,
    url: `${urlFor(locale)}grok/${lesson.slug}/`,
    inLanguage: locale,
    timeRequired: `PT${lesson.minutes}M`,
  }));

  const courseSixParts = GITHUB_LESSONS.map((lesson) => ({
    "@type": "LearningResource",
    position: lesson.order,
    name: githubCourse.copy.lessons[lesson.slug].title,
    url: `${urlFor(locale)}github/${lesson.slug}/`,
    inLanguage: locale,
    timeRequired: `PT${lesson.minutes}M`,
  }));

  const courseSevenParts = PROMPT_LESSONS.map((lesson) => ({
    "@type": "LearningResource",
    position: lesson.order,
    name: promptCourse.copy.lessons[lesson.slug].title,
    url: `${urlFor(promptCourse.contentLocale)}prompts/${lesson.slug}/`,
    inLanguage: "en",
    timeRequired: `PT${lesson.minutes}M`,
  }));

  const courseEightParts = SOFTWARE_ENGINEERING_LESSONS.map((lesson) => ({
    "@type": "LearningResource",
    position: lesson.order,
    name: lesson.title,
    url: `${urlFor("en")}software-engineering/${lesson.slug}/`,
    inLanguage: "en",
    timeRequired: `PT${lesson.minutes}M`,
  }));

  const courseNineParts = RAG_LESSONS.map((lesson) => ({
    "@type": "LearningResource",
    position: lesson.order,
    name: ragCourse.copy.lessons[lesson.slug].title,
    url: `${urlFor(ragCourse.contentLocale)}rag/${lesson.slug}/`,
    inLanguage: ragCourse.contentLocale,
    timeRequired: `PT${lesson.minutes}M`,
  }));

  const courseTenParts = mcpCourse.lessons.map((lesson) => ({
    "@type": "LearningResource",
    position: lesson.order,
    name: lesson.title,
    url: `${urlFor(mcpCourse.contentLocale)}mcp/${lesson.slug}/`,
    inLanguage: mcpCourse.contentLocale,
    timeRequired: `PT${lesson.minutes}M`,
  }));

  const courseElevenParts = MAKE_MONEY_WITH_CODEX_LESSONS.map((lesson) => ({
    "@type": "LearningResource",
    position: lesson.order,
    name: lesson.title,
    url: `${urlFor("en")}make-money-with-codex/${lesson.slug}/`,
    inLanguage: "en",
    timeRequired: `PT${lesson.minutes}M`,
  }));

  const courseTwelveParts = CLAUDE_INCOME_COURSE.lessons.map((lesson) => ({
    "@type": "LearningResource",
    position: lesson.order,
    name: lesson.title,
    url: `${urlFor("en")}claude-income/${lesson.slug}/`,
    inLanguage: "en",
    timeRequired: `PT${lesson.minutes}M`,
  }));

  const courseThirteenParts = aiTutorCourse.modules.map((module) => ({
    "@type": "LearningResource",
    position: module.order,
    name: module.copy.title,
    url: `${urlFor(aiTutorCourse.contentLocale)}ai-tutor/${module.slug}/`,
    inLanguage: aiTutorCourse.contentLocale,
    timeRequired: `PT${module.minutes}M`,
  }));

  const courseFourteenParts = productManagementCourse.modules.map((module) => ({
    "@type": "LearningResource",
    position: module.order,
    name: module.copy.title,
    url: `${urlFor(productManagementCourse.contentLocale)}product-management/${module.slug}/`,
    inLanguage: productManagementCourse.contentLocale,
    timeRequired: `PT${module.minutes}M`,
  }));

  const courseFifteenParts = agentOrchestrationCourse.modules.map((module) => ({
    "@type": "LearningResource",
    position: module.order,
    name: module.copy.title,
    url: `${urlFor(agentOrchestrationCourse.contentLocale)}agent-orchestration/${module.slug}/`,
    inLanguage: agentOrchestrationCourse.contentLocale,
    timeRequired: `PT${module.minutes}M`,
  }));

  const registryPartsByCourse = Object.fromEntries(
    COURSE_RELEASE_SURFACES.map((course) => {
      const routeLocale = contentLocaleForCourse(course.id, locale);
      const parts = routeLocale
        ? course.routes.map((route, index) => {
          const slug = route.replace(/\/$/, "").split("/").at(-1) ?? course.id;
          return {
            "@type": "LearningResource",
            position: index + 1,
            name: slug.split("-").map((word) => (
              word ? `${word[0].toUpperCase()}${word.slice(1)}` : word
            )).join(" "),
            url: `${urlFor(routeLocale)}${route}`,
            inLanguage: routeLocale,
          };
        })
        : [];
      return [course.id, parts] as const;
    }),
  ) as Readonly<Record<string, readonly Record<string, unknown>[]>>;

  // Rich authored labels replace the registry-derived fallback for released
  // curricula. Every registry course still has a complete default, so a
  // reviewed blocked -> published state flip cannot break catalogue JSON-LD.
  const partsByCourse: Readonly<Record<string, readonly Record<string, unknown>[]>> = {
    ...registryPartsByCourse,
    agentic: courseOneParts,
    grok: courseFiveParts,
    mcp: courseTenParts,
    github: courseSixParts,
    prompts: courseSevenParts,
    "software-engineering": courseEightParts,
    rag: courseNineParts,
    "make-money-with-codex": courseElevenParts,
    "claude-income": courseTwelveParts,
    "ai-tutor": courseThirteenParts,
    "product-management": courseFourteenParts,
    "agent-orchestration": courseFifteenParts,
  } as const;

  const list = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: PUBLISHED_CATALOG_COURSES.map(({ course }, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Course",
        name: course.id === "mcp" ? mcpCourse.title : t(course.titleKey),
        description: course.id === "mcp" ? mcpCourse.summary : t(course.blurbKey),
        url: `${SITE}${courseHrefFor(course.id, locale)}`,
        provider: { "@id": `${SITE}/#org` },
        inLanguage: contentLocaleForCourse(course.id, locale),
        educationalLevel: t(course.levelKey),
        isAccessibleForFree: true,
        ...(partsByCourse[course.id]?.length ? { hasPart: partsByCourse[course.id] } : {}),
        offers: {
          "@type": "Offer", price: 0, priceCurrency: "USD",
          category: "Free", availability: "https://schema.org/InStock",
        },
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          courseWorkload: `PT${course.minutes}M`,
        },
      },
    })),
  };

  return (
    <>
      <JsonLd data={list} />
      <Catalog locale={locale} />
    </>
  );
}
