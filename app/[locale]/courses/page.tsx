import Catalog from "@/components/courses/Catalog";
import { LOCALE_CODES, getMessages, translator } from "@/lib/i18n";
import { SITE, seoFor, urlFor } from "@/lib/seo";
import { COURSE_MODULES, TOP_LEVEL_COURSES } from "@/lib/courses";
import { CODEX_LESSONS, isCodexLocale, loadCodexCopy } from "@/lib/codex";
import { CLAUDE_COURSE_MANIFEST, loadClaudeCourse } from "@/lib/claude";
import { loadCursorCourse } from "@/lib/cursor/load";
import { CURSOR_COURSE_MANIFEST } from "@/lib/cursor/manifest";
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
import { loadCreatorOpsCourse } from "@/lib/creator-ops";
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
  if (!isCodexLocale(locale)) throw new Error(`Unsupported locale: ${locale}`);
  const [
    codexCopy,
    claudeCourse,
    cursorCourse,
    grokCourse,
    githubCourse,
    promptCourse,
    ragCourse,
    aiTutorCourse,
    productManagementCourse,
    agentOrchestrationCourse,
    creatorOpsCourse,
  ] = await Promise.all([
    loadCodexCopy(locale),
    loadClaudeCourse(locale),
    loadCursorCourse(locale),
    loadGrokCourse(locale),
    loadGithubCourse(locale),
    loadPromptCourse(locale),
    loadRagCourse(locale),
    loadAiTutorCourse(locale),
    loadProductManagementCourse(locale),
    loadAgentOrchestrationCourse(locale),
    loadCreatorOpsCourse(locale),
  ]);
  const mcpCourse = await loadMcpCourse(locale);

  const courseOneParts = COURSE_MODULES.map((module) => ({
    "@type": "Course",
    name: t(`c.${module.id}.title`),
    description: t(`c.${module.id}.blurb`),
    url: module.external ? module.href : `${urlFor(locale)}${module.href.replace(/^\//, "")}`,
    inLanguage: locale,
  }));

  const courseTwoParts = CODEX_LESSONS.map((lesson) => ({
    "@type": "LearningResource",
    position: lesson.order,
    name: codexCopy.lessons[lesson.slug].title,
    url: `${urlFor(locale)}codex/${lesson.slug}/`,
    inLanguage: locale,
    timeRequired: `PT${lesson.minutes}M`,
  }));

  const courseThreeParts = CLAUDE_COURSE_MANIFEST.lessons.map((lesson) => ({
    "@type": "LearningResource",
    position: lesson.order,
    name: claudeCourse.copy.lessons[lesson.slug].title,
    url: `${urlFor(locale)}claude/${lesson.slug}/`,
    inLanguage: locale,
    timeRequired: `PT${lesson.minutes}M`,
  }));

  const courseFourParts = CURSOR_COURSE_MANIFEST.lessons.map((lesson) => ({
    "@type": "LearningResource",
    position: lesson.order,
    name: cursorCourse.copy.lessons[lesson.slug].title,
    url: `${urlFor(locale)}cursor/${lesson.slug}/`,
    inLanguage: locale,
    timeRequired: `PT${lesson.minutes}M`,
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
    url: `${urlFor(locale)}software-engineering/${lesson.slug}/`,
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
    url: `${urlFor(locale)}claude-income/${lesson.slug}/`,
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

  const courseSixteenParts = creatorOpsCourse.modules.map((module) => ({
    "@type": "LearningResource",
    position: module.order,
    name: module.copy.title,
    url: `${urlFor(creatorOpsCourse.contentLocale)}creator-ops/${module.slug}/`,
    inLanguage: creatorOpsCourse.contentLocale,
    timeRequired: `PT${module.minutes}M`,
  }));

  const partsByCourse = {
    agentic: courseOneParts,
    codex: courseTwoParts,
    claude: courseThreeParts,
    cursor: courseFourParts,
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
    "creator-ops": courseSixteenParts,
  } as const;

  const list = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: TOP_LEVEL_COURSES.map((course) => ({
      "@type": "ListItem",
      position: course.displayNumber,
      item: {
        "@type": "Course",
        name: course.id === "mcp" ? mcpCourse.title : t(`c.${course.id}.title`),
        description: course.id === "mcp" ? mcpCourse.summary : t(`c.${course.id}.blurb`),
        url: course.id === "agentic"
          ? `${urlFor(locale)}courses/#agentic-engineering`
          : course.id === "mcp"
            ? `${urlFor(mcpCourse.contentLocale)}${course.href.replace(/^\//, "")}`
          : course.id === "make-money-with-codex"
            ? `${urlFor("en")}${course.href.replace(/^\//, "")}`
          : course.id === "ai-tutor"
            ? `${urlFor(aiTutorCourse.contentLocale)}${course.href.replace(/^\//, "")}`
          : course.id === "product-management"
            ? `${urlFor(productManagementCourse.contentLocale)}${course.href.replace(/^\//, "")}`
          : course.id === "agent-orchestration"
            ? `${urlFor(agentOrchestrationCourse.contentLocale)}${course.href.replace(/^\//, "")}`
          : course.id === "creator-ops"
            ? `${urlFor(creatorOpsCourse.contentLocale)}${course.href.replace(/^\//, "")}`
          : course.id === "prompts"
            ? `${urlFor(promptCourse.contentLocale)}${course.href.replace(/^\//, "")}`
          : `${urlFor(locale)}${course.href.replace(/^\//, "")}`,
        provider: { "@id": `${SITE}/#org` },
        inLanguage: course.id === "rag"
          ? ragCourse.contentLocale
          : course.id === "mcp"
          ? mcpCourse.contentLocale
          : course.id === "prompts"
          || course.id === "software-engineering"
          || course.id === "make-money-with-codex"
          || course.id === "claude-income"
          ? "en"
          : course.id === "ai-tutor"
            ? aiTutorCourse.contentLocale
          : course.id === "product-management"
            ? productManagementCourse.contentLocale
          : course.id === "agent-orchestration"
            ? agentOrchestrationCourse.contentLocale
          : course.id === "creator-ops"
            ? creatorOpsCourse.contentLocale
          : locale,
        educationalLevel: t(`c.${course.id}.level`),
        isAccessibleForFree: true,
        ...(partsByCourse[course.id].length ? { hasPart: partsByCourse[course.id] } : {}),
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
