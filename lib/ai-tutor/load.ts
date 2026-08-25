import { AI_TUTOR_EN_COPY } from "./copy/en";
import { AI_TUTOR_COURSE_MANIFEST } from "./manifest";
import { getAiTutorSource } from "./sources";
import {
  AI_TUTOR_LOCALES,
  AI_TUTOR_MODULE_SLUGS,
  type AiTutorCourseCopy,
  type AiTutorLocale,
  type AiTutorModuleSlug,
  type MaterializedAiTutorCourse,
  type MaterializedAiTutorModule,
} from "./types";

interface AiTutorCopyBundle {
  readonly contentLocale: AiTutorLocale;
  readonly direction: "ltr" | "rtl";
  readonly copy: AiTutorCourseCopy;
}

/** Add reviewed translations here without changing course structure or UI components. */
export const AI_TUTOR_COPY_BUNDLES: Partial<Record<AiTutorLocale, AiTutorCopyBundle>> = {
  en: {
    contentLocale: "en",
    direction: "ltr",
    copy: AI_TUTOR_EN_COPY,
  },
};

export const AI_TUTOR_TRANSLATED_LOCALES = Object.freeze(
  Object.keys(AI_TUTOR_COPY_BUNDLES) as AiTutorLocale[],
);

function copyBundleFor(locale: AiTutorLocale): AiTutorCopyBundle {
  return AI_TUTOR_COPY_BUNDLES[locale] ?? AI_TUTOR_COPY_BUNDLES.en!;
}

export function isAiTutorLocale(value: string): value is AiTutorLocale {
  return (AI_TUTOR_LOCALES as readonly string[]).includes(value);
}

export function isAiTutorModuleSlug(value: string): value is AiTutorModuleSlug {
  return (AI_TUTOR_MODULE_SLUGS as readonly string[]).includes(value);
}

function materializeModule(
  slug: AiTutorModuleSlug,
  copy: AiTutorCourseCopy,
): MaterializedAiTutorModule {
  const moduleManifest = AI_TUTOR_COURSE_MANIFEST.modules.find((item) => item.slug === slug);
  if (!moduleManifest) throw new Error(`Unknown AI Tutor module: ${slug}`);
  return {
    ...moduleManifest,
    copy: copy.modules[slug],
    sources: moduleManifest.sourceIds.map(getAiTutorSource),
  };
}

export async function loadAiTutorCourse(locale: AiTutorLocale): Promise<MaterializedAiTutorCourse> {
  const bundle = copyBundleFor(locale);
  const modules = AI_TUTOR_COURSE_MANIFEST.modules.map(
    (item) => materializeModule(item.slug, bundle.copy),
  );
  return {
    locale,
    contentLocale: bundle.contentLocale,
    contentDirection: bundle.direction,
    manifest: AI_TUTOR_COURSE_MANIFEST,
    copy: bundle.copy,
    modules,
    phases: AI_TUTOR_COURSE_MANIFEST.phases.map((phase) => ({
      ...phase,
      copy: bundle.copy.phases[phase.id],
      modules: phase.moduleSlugs.map(
        (slug) => modules.find((item) => item.slug === slug)!,
      ) as [MaterializedAiTutorModule, MaterializedAiTutorModule],
    })),
  };
}

export async function getAiTutorModule(
  locale: AiTutorLocale,
  slug: AiTutorModuleSlug,
): Promise<MaterializedAiTutorModule> {
  return materializeModule(slug, copyBundleFor(locale).copy);
}
