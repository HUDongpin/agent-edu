import type { Metadata } from "next";
import {
  CourseKitModuleRoute,
  courseKitGenerateStaticParams,
  courseKitMetadata,
} from "@/components/course-kit/CourseRoute";
import { DEEP_LEARNING_COURSE } from "@/lib/deep-learning";
import { DeepLearningModuleLab } from "@/components/deep-learning";
import type { DeepLearningModuleSlug } from "@/lib/deep-learning";

type Props = { params: Promise<{ locale: string; module: string }> };

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return courseKitGenerateStaticParams(DEEP_LEARNING_COURSE);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, module } = await params;
  return courseKitMetadata({
    definition: DEEP_LEARNING_COURSE,
    locale,
    moduleSlug: module,
  });
}

export default async function DeepLearningModulePage({ params }: Props) {
  const { locale, module } = await params;
  return (
    <CourseKitModuleRoute
      definition={DEEP_LEARNING_COURSE}
      locale={locale}
      moduleSlug={module}
      supplement={(
        <DeepLearningModuleLab
          locale={locale}
          moduleSlug={module as DeepLearningModuleSlug}
        />
      )}
    />
  );
}
