import type { Metadata } from "next";
import {
  CourseKitModuleRoute,
  courseKitGenerateStaticParams,
  courseKitMetadata,
} from "@/components/course-kit/CourseRoute";
import { RESPONSIBLE_AI_COURSE } from "@/lib/responsible-ai";
import { ResponsibleAiStudio } from "@/components/responsible-ai/ResponsibleAiStudio";

type Props = { params: Promise<{ locale: string; module: string }> };

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return courseKitGenerateStaticParams(RESPONSIBLE_AI_COURSE);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, module } = await params;
  return courseKitMetadata({
    definition: RESPONSIBLE_AI_COURSE,
    locale,
    moduleSlug: module,
  });
}

export default async function ResponsibleAiModulePage({ params }: Props) {
  const { locale, module } = await params;
  return (
    <CourseKitModuleRoute
      definition={RESPONSIBLE_AI_COURSE}
      locale={locale}
      moduleSlug={module}
      supplement={<ResponsibleAiStudio locale={locale} moduleSlug={module} />}
    />
  );
}
