import type { Metadata } from "next";
import {
  CourseKitModuleRoute,
  courseKitGenerateStaticParams,
  courseKitMetadata,
} from "@/components/course-kit/CourseRoute";
import { PRODUCTION_AI_COURSE } from "@/lib/production-ai";
import { ProductionAiModuleLab } from "@/components/production-ai";
import type { ProductionAiModuleSlug } from "@/lib/production-ai";

type Props = { params: Promise<{ locale: string; module: string }> };

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return courseKitGenerateStaticParams(PRODUCTION_AI_COURSE);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, module } = await params;
  return courseKitMetadata({
    definition: PRODUCTION_AI_COURSE,
    locale,
    moduleSlug: module,
  });
}

export default async function ProductionAiModulePage({ params }: Props) {
  const { locale, module } = await params;
  return (
    <CourseKitModuleRoute
      definition={PRODUCTION_AI_COURSE}
      locale={locale}
      moduleSlug={module}
      supplement={(
        <ProductionAiModuleLab
          locale={locale}
          moduleSlug={module as ProductionAiModuleSlug}
        />
      )}
    />
  );
}
