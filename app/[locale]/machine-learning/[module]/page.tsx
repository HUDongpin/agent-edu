import type { Metadata } from "next";
import {
  CourseKitModuleRoute,
  courseKitGenerateStaticParams,
  courseKitMetadata,
} from "@/components/course-kit/CourseRoute";
import { MACHINE_LEARNING_COURSE } from "@/lib/machine-learning";
import { MachineLearningModuleLab } from "@/components/machine-learning";
import type { MachineLearningModuleSlug } from "@/lib/machine-learning";

type Props = { params: Promise<{ locale: string; module: string }> };

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return courseKitGenerateStaticParams(MACHINE_LEARNING_COURSE);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, module } = await params;
  return courseKitMetadata({
    definition: MACHINE_LEARNING_COURSE,
    locale,
    moduleSlug: module,
  });
}

export default async function MachineLearningModulePage({ params }: Props) {
  const { locale, module } = await params;
  return (
    <CourseKitModuleRoute
      definition={MACHINE_LEARNING_COURSE}
      locale={locale}
      moduleSlug={module}
      supplement={(
        <MachineLearningModuleLab
          locale={locale}
          moduleSlug={module as MachineLearningModuleSlug}
        />
      )}
    />
  );
}
