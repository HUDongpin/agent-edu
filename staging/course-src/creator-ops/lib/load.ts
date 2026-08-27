import { CREATOR_OPS_EN_COPY } from "./copy/en";
import { CREATOR_OPS_ZH_HANS_COPY } from "./copy/zh-Hans";
import { CREATOR_OPS_COURSE_MANIFEST } from "./manifest";
import { getCreatorOpsSource } from "./sources";
import {
  CREATOR_OPS_LOCALES,
  CREATOR_OPS_MODULE_SLUGS,
  type CreatorOpsCourseCopy,
  type CreatorOpsLocale,
  type CreatorOpsModuleSlug,
  type MaterializedCreatorOpsCourse,
  type MaterializedCreatorOpsModule,
} from "./types";

interface CreatorOpsCopyBundle {
  readonly contentLocale: "en" | "zh-Hans";
  readonly direction: "ltr";
  readonly copy: CreatorOpsCourseCopy;
}

/** Only complete, editorially reviewed editions belong in this registry. */
export const CREATOR_OPS_COPY_BUNDLES: Partial<
  Record<CreatorOpsLocale, CreatorOpsCopyBundle>
> = {
  en: {
    contentLocale: "en",
    direction: "ltr",
    copy: CREATOR_OPS_EN_COPY,
  },
  "zh-Hans": {
    contentLocale: "zh-Hans",
    direction: "ltr",
    copy: CREATOR_OPS_ZH_HANS_COPY,
  },
};

export const CREATOR_OPS_TRANSLATED_LOCALES = Object.freeze(
  Object.keys(CREATOR_OPS_COPY_BUNDLES) as Array<"en" | "zh-Hans">,
);

function copyBundleFor(locale: CreatorOpsLocale): CreatorOpsCopyBundle {
  return CREATOR_OPS_COPY_BUNDLES[locale] ?? CREATOR_OPS_COPY_BUNDLES.en!;
}

export function isCreatorOpsLocale(value: string): value is CreatorOpsLocale {
  return (CREATOR_OPS_LOCALES as readonly string[]).includes(value);
}

export function isCreatorOpsModuleSlug(
  value: string,
): value is CreatorOpsModuleSlug {
  return (CREATOR_OPS_MODULE_SLUGS as readonly string[]).includes(value);
}

function materializeModule(
  slug: CreatorOpsModuleSlug,
  copy: CreatorOpsCourseCopy,
): MaterializedCreatorOpsModule {
  const moduleManifest = CREATOR_OPS_COURSE_MANIFEST.modules.find(
    (candidate) => candidate.slug === slug,
  );
  if (!moduleManifest) throw new Error(`Unknown creator-ops module: ${slug}`);
  return {
    ...moduleManifest,
    copy: copy.modules[slug],
    sources: moduleManifest.sourceIds.map(getCreatorOpsSource),
  };
}

export async function loadCreatorOpsCourse(
  locale: CreatorOpsLocale,
): Promise<MaterializedCreatorOpsCourse> {
  const bundle = copyBundleFor(locale);
  const modules = CREATOR_OPS_COURSE_MANIFEST.modules.map((module) =>
    materializeModule(module.slug, bundle.copy),
  );
  return {
    locale,
    contentLocale: bundle.contentLocale,
    contentDirection: bundle.direction,
    manifest: CREATOR_OPS_COURSE_MANIFEST,
    copy: bundle.copy,
    modules,
    phases: CREATOR_OPS_COURSE_MANIFEST.phases.map((phase) => ({
      ...phase,
      copy: bundle.copy.phases[phase.id],
      modules: phase.moduleSlugs.map(
        (slug) => modules.find((module) => module.slug === slug)!,
      ),
    })),
  };
}

export async function getCreatorOpsModule(
  locale: CreatorOpsLocale,
  slug: CreatorOpsModuleSlug,
): Promise<MaterializedCreatorOpsModule> {
  return materializeModule(slug, copyBundleFor(locale).copy);
}
