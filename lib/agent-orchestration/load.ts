import { AGENT_ORCHESTRATION_EN_COPY } from "./copy/en";
import { AGENT_ORCHESTRATION_ZH_HANS_COPY } from "./copy/zh-Hans";
import { AGENT_ORCHESTRATION_COURSE_MANIFEST } from "./manifest";
import { getAgentOrchestrationSource } from "./sources";
import {
  AGENT_ORCHESTRATION_LOCALES,
  AGENT_ORCHESTRATION_MODULE_SLUGS,
  type AgentOrchestrationCourseCopy,
  type AgentOrchestrationLocale,
  type AgentOrchestrationModuleSlug,
  type MaterializedAgentOrchestrationCourse,
  type MaterializedAgentOrchestrationModule,
} from "./types";

interface CopyBundle {
  readonly contentLocale: AgentOrchestrationLocale;
  readonly direction: "ltr" | "rtl";
  readonly copy: AgentOrchestrationCourseCopy;
}

/** Only complete, editorially reviewed translations belong in this registry. */
export const AGENT_ORCHESTRATION_COPY_BUNDLES: Partial<
  Record<AgentOrchestrationLocale, CopyBundle>
> = {
  en: { contentLocale: "en", direction: "ltr", copy: AGENT_ORCHESTRATION_EN_COPY },
  "zh-Hans": {
    contentLocale: "zh-Hans",
    direction: "ltr",
    copy: AGENT_ORCHESTRATION_ZH_HANS_COPY,
  },
};

export const AGENT_ORCHESTRATION_TRANSLATED_LOCALES = Object.freeze(
  Object.keys(AGENT_ORCHESTRATION_COPY_BUNDLES) as AgentOrchestrationLocale[],
);

function copyBundleFor(locale: AgentOrchestrationLocale): CopyBundle {
  return AGENT_ORCHESTRATION_COPY_BUNDLES[locale]
    ?? AGENT_ORCHESTRATION_COPY_BUNDLES.en!;
}

export function isAgentOrchestrationLocale(
  value: string,
): value is AgentOrchestrationLocale {
  return (AGENT_ORCHESTRATION_LOCALES as readonly string[]).includes(value);
}

export function isAgentOrchestrationModuleSlug(
  value: string,
): value is AgentOrchestrationModuleSlug {
  return (AGENT_ORCHESTRATION_MODULE_SLUGS as readonly string[]).includes(value);
}

function materializeModule(
  slug: AgentOrchestrationModuleSlug,
  copy: AgentOrchestrationCourseCopy,
): MaterializedAgentOrchestrationModule {
  const moduleManifest = AGENT_ORCHESTRATION_COURSE_MANIFEST.modules.find(
    (candidate) => candidate.slug === slug,
  );
  if (!moduleManifest) throw new Error(`Unknown agent-orchestration module: ${slug}`);
  return {
    ...moduleManifest,
    copy: copy.modules[slug],
    sources: moduleManifest.sourceIds.map(getAgentOrchestrationSource),
  };
}

export async function loadAgentOrchestrationCourse(
  locale: AgentOrchestrationLocale,
): Promise<MaterializedAgentOrchestrationCourse> {
  const bundle = copyBundleFor(locale);
  const modules = AGENT_ORCHESTRATION_COURSE_MANIFEST.modules.map((module) =>
    materializeModule(module.slug, bundle.copy),
  );
  return {
    locale,
    contentLocale: bundle.contentLocale,
    contentDirection: bundle.direction,
    manifest: AGENT_ORCHESTRATION_COURSE_MANIFEST,
    copy: bundle.copy,
    modules,
    phases: AGENT_ORCHESTRATION_COURSE_MANIFEST.phases.map((phase) => ({
      ...phase,
      copy: bundle.copy.phases[phase.id],
      modules: phase.moduleSlugs.map(
        (slug) => modules.find((module) => module.slug === slug)!,
      ),
    })),
  };
}

export async function getAgentOrchestrationModule(
  locale: AgentOrchestrationLocale,
  slug: AgentOrchestrationModuleSlug,
): Promise<MaterializedAgentOrchestrationModule> {
  return materializeModule(slug, copyBundleFor(locale).copy);
}
