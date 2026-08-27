import type { Metadata } from "next";
import {
  CourseKitDashboardRoute,
  courseKitMetadata,
} from "@/components/course-kit/CourseRoute";
import { DEEP_LEARNING_COURSE } from "@/lib/deep-learning";
import { DeepLearningLabDashboard } from "@/components/deep-learning";

type Props = { params: Promise<{ locale: string }> };

export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return courseKitMetadata({ definition: DEEP_LEARNING_COURSE, locale });
}

export default async function DeepLearningPage({ params }: Props) {
  const { locale } = await params;
  return (
    <CourseKitDashboardRoute
      definition={DEEP_LEARNING_COURSE}
      locale={locale}
      supplement={<DeepLearningLabDashboard locale={locale} />}
    />
  );
}
