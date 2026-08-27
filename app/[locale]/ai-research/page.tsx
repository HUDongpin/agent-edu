import type { Metadata } from "next";
import {
  CourseKitDashboardRoute,
  courseKitMetadata,
} from "@/components/course-kit/CourseRoute";
import { AI_RESEARCH_COURSE } from "@/lib/ai-research";
import { AiResearchStudio } from "@/components/ai-research/AiResearchStudio";

type Props = { params: Promise<{ locale: string }> };

export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return courseKitMetadata({ definition: AI_RESEARCH_COURSE, locale });
}

export default async function AiResearchPage({ params }: Props) {
  const { locale } = await params;
  return (
    <CourseKitDashboardRoute
      definition={AI_RESEARCH_COURSE}
      locale={locale}
      supplement={<AiResearchStudio locale={locale} />}
    />
  );
}
