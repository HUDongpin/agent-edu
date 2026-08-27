import { MATH_ANIMATION_CODE_EXAMPLES } from "./examples";
import { MATH_ANIMATION_COURSE_MANIFEST } from "./manifest";
import {
  MATH_ANIMATION_REPOSITORIES,
  getMathAnimationSource,
} from "./sources";
import { MATH_ANIMATION_EN_COPY } from "./copy/en";
import { MATH_ANIMATION_ZH_HANS_COPY } from "./copy/zh-Hans";
import {
  MATH_ANIMATION_LOCALES,
  MATH_ANIMATION_MODULE_SLUGS,
  type MaterializedMathAnimationCourse,
  type MaterializedMathAnimationModule,
  type MathAnimationCourseCopy,
  type MathAnimationLocale,
  type MathAnimationModuleManifest,
  type MathAnimationModuleSlug,
} from "./types";

export const MATH_ANIMATION_TRANSLATED_LOCALES = ["en", "zh-Hans"] as const;

export function isMathAnimationLocale(value: string): value is MathAnimationLocale {
  return (MATH_ANIMATION_LOCALES as readonly string[]).includes(value);
}

export function isMathAnimationModuleSlug(value: string): value is MathAnimationModuleSlug {
  return (MATH_ANIMATION_MODULE_SLUGS as readonly string[]).includes(value);
}

function copyBundleFor(locale: MathAnimationLocale): {
  copy: MathAnimationCourseCopy;
  contentLocale: "en" | "zh-Hans";
} {
  if (locale === "zh-Hans") {
    return { copy: MATH_ANIMATION_ZH_HANS_COPY, contentLocale: "zh-Hans" };
  }
  return { copy: MATH_ANIMATION_EN_COPY, contentLocale: "en" };
}

function materializeModule(
  slug: MathAnimationModuleSlug,
  copy: MathAnimationCourseCopy,
): MaterializedMathAnimationModule {
  const moduleManifest = (MATH_ANIMATION_COURSE_MANIFEST.modules as readonly MathAnimationModuleManifest[]).find(
    (candidate) => candidate.slug === slug,
  );
  if (!moduleManifest) throw new Error(`Unknown math-animation module: ${slug}`);
  return {
    ...moduleManifest,
    copy: copy.modules[slug],
    sources: moduleManifest.sourceIds.map(getMathAnimationSource),
    codeExample: moduleManifest.codeExampleId
      ? MATH_ANIMATION_CODE_EXAMPLES[moduleManifest.codeExampleId]
      : undefined,
  };
}

export async function loadMathAnimationCourse(
  locale: MathAnimationLocale,
): Promise<MaterializedMathAnimationCourse> {
  const bundle = copyBundleFor(locale);
  const modules = MATH_ANIMATION_COURSE_MANIFEST.modules.map((module) =>
    materializeModule(module.slug, bundle.copy),
  );
  return {
    locale,
    contentLocale: bundle.contentLocale,
    contentDirection: "ltr",
    manifest: MATH_ANIMATION_COURSE_MANIFEST,
    copy: bundle.copy,
    modules,
    phases: MATH_ANIMATION_COURSE_MANIFEST.phases.map((phase) => {
      const [firstSlug, secondSlug, thirdSlug] = phase.moduleSlugs;
      const findModule = (slug: MathAnimationModuleSlug) => {
        const courseModule = modules.find((candidate) => candidate.slug === slug);
        if (!courseModule) throw new Error(`Missing materialized math-animation module: ${slug}`);
        return courseModule;
      };
      return {
        ...phase,
        copy: bundle.copy.phases[phase.id],
        modules: [
          findModule(firstSlug),
          findModule(secondSlug),
          findModule(thirdSlug),
        ],
      };
    }),
    repositories: MATH_ANIMATION_REPOSITORIES,
  };
}

export async function getMathAnimationModule(
  locale: MathAnimationLocale,
  slug: MathAnimationModuleSlug,
): Promise<MaterializedMathAnimationModule> {
  return materializeModule(slug, copyBundleFor(locale).copy);
}
