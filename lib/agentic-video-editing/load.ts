import { AGENTIC_VIDEO_EDITING_EN_COPY } from "./copy/en";
import { AGENTIC_VIDEO_EDITING_ZH_HANS_COPY } from "./copy/zh-Hans";
import { AGENTIC_VIDEO_EDITING_COURSE_MANIFEST } from "./manifest";
import { getAgenticVideoEditingSource } from "./sources";
import {
  AGENTIC_VIDEO_EDITING_LOCALES,
  AGENTIC_VIDEO_EDITING_MODULE_SLUGS,
  type AgenticVideoEditingCourseCopy,
  type AgenticVideoEditingLocale,
  type AgenticVideoEditingModuleSlug,
  type MaterializedAgenticVideoEditingCourse,
  type MaterializedAgenticVideoEditingModule,
} from "./types";

interface CopyBundle {
  readonly contentLocale: "en" | "zh-Hans";
  readonly direction: "ltr";
  readonly copy: AgenticVideoEditingCourseCopy;
}

/** Authored candidate bundles; named-human bundle review remains pending/HOLD. */
export const AGENTIC_VIDEO_EDITING_COPY_BUNDLES: Partial<
  Record<AgenticVideoEditingLocale, CopyBundle>
> = {
  en: {
    contentLocale: "en",
    direction: "ltr",
    copy: AGENTIC_VIDEO_EDITING_EN_COPY,
  },
  "zh-Hans": {
    contentLocale: "zh-Hans",
    direction: "ltr",
    copy: AGENTIC_VIDEO_EDITING_ZH_HANS_COPY,
  },
};

export const AGENTIC_VIDEO_EDITING_TRANSLATED_LOCALES = Object.freeze(
  Object.keys(AGENTIC_VIDEO_EDITING_COPY_BUNDLES) as AgenticVideoEditingLocale[],
);

function copyBundleFor(locale: AgenticVideoEditingLocale): CopyBundle {
  return AGENTIC_VIDEO_EDITING_COPY_BUNDLES[locale]
    ?? AGENTIC_VIDEO_EDITING_COPY_BUNDLES.en!;
}

export function isAgenticVideoEditingLocale(
  value: string,
): value is AgenticVideoEditingLocale {
  return (AGENTIC_VIDEO_EDITING_LOCALES as readonly string[]).includes(value);
}

export function isAgenticVideoEditingModuleSlug(
  value: string,
): value is AgenticVideoEditingModuleSlug {
  return (AGENTIC_VIDEO_EDITING_MODULE_SLUGS as readonly string[]).includes(value);
}

function materializeModule(
  slug: AgenticVideoEditingModuleSlug,
  copy: AgenticVideoEditingCourseCopy,
): MaterializedAgenticVideoEditingModule {
  const moduleManifest = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.find(
    (candidate) => candidate.slug === slug,
  );
  if (!moduleManifest) {
    throw new Error(`Unknown agentic-video-editing module: ${slug}`);
  }
  return {
    ...moduleManifest,
    copy: copy.modules[slug],
    sources: moduleManifest.sourceIds.map(getAgenticVideoEditingSource),
  };
}

export async function loadAgenticVideoEditingCourse(
  locale: AgenticVideoEditingLocale,
): Promise<MaterializedAgenticVideoEditingCourse> {
  const bundle = copyBundleFor(locale);
  const modules = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.map((module) =>
    materializeModule(module.slug, bundle.copy),
  );
  return {
    locale,
    contentLocale: bundle.contentLocale,
    contentDirection: bundle.direction,
    manifest: AGENTIC_VIDEO_EDITING_COURSE_MANIFEST,
    copy: bundle.copy,
    modules,
    phases: AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.phases.map((phase) => ({
      ...phase,
      copy: bundle.copy.phases[phase.id],
      modules: phase.moduleSlugs.map(
        (slug) => modules.find((module) => module.slug === slug)!,
      ),
    })),
  };
}

export async function getAgenticVideoEditingModule(
  locale: AgenticVideoEditingLocale,
  slug: AgenticVideoEditingModuleSlug,
): Promise<MaterializedAgenticVideoEditingModule> {
  return materializeModule(slug, copyBundleFor(locale).copy);
}
