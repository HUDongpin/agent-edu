import type { Metadata } from "next";
import {
  CourseKitDashboardRoute,
  courseKitMetadata,
} from "@/components/course-kit/CourseRoute";
import { PRODUCTION_AI_COURSE } from "@/lib/production-ai";
import { ProductionAiLabDashboard } from "@/components/production-ai";

type Props = { params: Promise<{ locale: string }> };

export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return courseKitMetadata({ definition: PRODUCTION_AI_COURSE, locale });
}

export default async function ProductionAiPage({ params }: Props) {
  const { locale } = await params;
  return (
    <CourseKitDashboardRoute
      definition={PRODUCTION_AI_COURSE}
      locale={locale}
      supplement={<ProductionAiLabDashboard locale={locale} />}
    />
  );
}
