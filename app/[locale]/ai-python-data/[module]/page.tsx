import type { Metadata } from "next";
import {
  CourseKitModuleRoute,
  courseKitGenerateStaticParams,
  courseKitMetadata,
} from "@/components/course-kit/CourseRoute";
import { AI_PYTHON_DATA_COURSE } from "@/lib/ai-python-data";
import { AiPythonDataModuleLab } from "@/components/ai-python-data";
import type { AiPythonDataModuleSlug } from "@/lib/ai-python-data";

type Props = { params: Promise<{ locale: string; module: string }> };

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return courseKitGenerateStaticParams(AI_PYTHON_DATA_COURSE);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, module } = await params;
  return courseKitMetadata({
    definition: AI_PYTHON_DATA_COURSE,
    locale,
    moduleSlug: module,
  });
}

export default async function AiPythonDataModulePage({ params }: Props) {
  const { locale, module } = await params;
  return (
    <CourseKitModuleRoute
      definition={AI_PYTHON_DATA_COURSE}
      locale={locale}
      moduleSlug={module}
      supplement={(
        <AiPythonDataModuleLab
          locale={locale}
          moduleSlug={module as AiPythonDataModuleSlug}
        />
      )}
    />
  );
}
