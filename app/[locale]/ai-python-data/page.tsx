import type { Metadata } from "next";
import {
  CourseKitDashboardRoute,
  courseKitMetadata,
} from "@/components/course-kit/CourseRoute";
import { AI_PYTHON_DATA_COURSE } from "@/lib/ai-python-data";
import { AiPythonDataLabDashboard } from "@/components/ai-python-data";

type Props = { params: Promise<{ locale: string }> };

export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return courseKitMetadata({ definition: AI_PYTHON_DATA_COURSE, locale });
}

export default async function AiPythonDataPage({ params }: Props) {
  const { locale } = await params;
  return (
    <CourseKitDashboardRoute
      definition={AI_PYTHON_DATA_COURSE}
      locale={locale}
      supplement={<AiPythonDataLabDashboard locale={locale} />}
    />
  );
}
