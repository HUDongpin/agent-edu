import type { Metadata } from "next";
import {
  CourseKitDashboardRoute,
  courseKitMetadata,
} from "@/components/course-kit/CourseRoute";
import { RESPONSIBLE_AI_COURSE } from "@/lib/responsible-ai";
import { ResponsibleAiStudio } from "@/components/responsible-ai/ResponsibleAiStudio";

type Props = { params: Promise<{ locale: string }> };

export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return courseKitMetadata({ definition: RESPONSIBLE_AI_COURSE, locale });
}

export default async function ResponsibleAiPage({ params }: Props) {
  const { locale } = await params;
  return (
    <CourseKitDashboardRoute
      definition={RESPONSIBLE_AI_COURSE}
      locale={locale}
      supplement={<ResponsibleAiStudio locale={locale} />}
    />
  );
}
