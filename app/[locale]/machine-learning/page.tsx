import type { Metadata } from "next";
import {
  CourseKitDashboardRoute,
  courseKitMetadata,
} from "@/components/course-kit/CourseRoute";
import { MACHINE_LEARNING_COURSE } from "@/lib/machine-learning";
import { MachineLearningLabDashboard } from "@/components/machine-learning";

type Props = { params: Promise<{ locale: string }> };

export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return courseKitMetadata({ definition: MACHINE_LEARNING_COURSE, locale });
}

export default async function MachineLearningPage({ params }: Props) {
  const { locale } = await params;
  return (
    <CourseKitDashboardRoute
      definition={MACHINE_LEARNING_COURSE}
      locale={locale}
      supplement={<MachineLearningLabDashboard locale={locale} />}
    />
  );
}
