import type { Metadata } from "next";
import {
  CourseKitModuleRoute,
  courseKitGenerateStaticParams,
  courseKitMetadata,
} from "@/components/course-kit/CourseRoute";
import { AI_RESEARCH_COURSE } from "@/lib/ai-research";
import { AiResearchStudio } from "@/components/ai-research/AiResearchStudio";

type Props = { params: Promise<{ locale: string; module: string }> };

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return courseKitGenerateStaticParams(AI_RESEARCH_COURSE);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, module } = await params;
  return courseKitMetadata({
    definition: AI_RESEARCH_COURSE,
    locale,
    moduleSlug: module,
  });
}

export default async function AiResearchModulePage({ params }: Props) {
  const { locale, module } = await params;
  return (
    <CourseKitModuleRoute
      definition={AI_RESEARCH_COURSE}
      locale={locale}
      moduleSlug={module}
      supplement={<AiResearchStudio locale={locale} moduleSlug={module} />}
    />
  );
}
