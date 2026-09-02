import { CREATOR_OPS_EN_COPY } from "./copy/en";
import { CREATOR_OPS_ZH_HANS_COPY } from "./copy/zh-Hans";
import { CREATOR_OPS_COURSE_MANIFEST } from "./manifest";
import { CREATOR_OPS_SOURCES } from "./sources";
import {
  CREATOR_OPS_MODULE_SLUGS,
  type CreatorOpsCourseCopy,
} from "./types";

export interface CreatorOpsValidationResult {
  readonly errors: string[];
  readonly warnings: string[];
}

function validateCopy(
  locale: "en" | "zh-Hans",
  copy: CreatorOpsCourseCopy,
  sourceIds: ReadonlySet<string>,
  errors: string[],
): void {
  const downloadFilenames = new Set<string>();
  if (!copy.meta.title.trim() || !copy.meta.summary.trim()) {
    errors.push(`${locale}: course title and summary are required`);
  }
  if (copy.principles.length !== 5) errors.push(`${locale}: exactly 5 principles are required`);
  if (copy.outcomes.length !== 8) errors.push(`${locale}: exactly 8 outcomes are required`);

  for (const moduleManifest of CREATOR_OPS_COURSE_MANIFEST.modules) {
    const moduleCopy = copy.modules[moduleManifest.slug];
    if (!moduleCopy) {
      errors.push(`${locale}/${moduleManifest.slug}: module copy is missing`);
      continue;
    }
    if (moduleCopy.sections.length !== 3) {
      errors.push(`${locale}/${moduleManifest.slug}: exactly 3 teaching sections are required`);
    }
    if (moduleCopy.practice.template.trim().length < 180) {
      errors.push(`${locale}/${moduleManifest.slug}: practice template is too short`);
    }
    if (moduleCopy.practice.steps.length < 3) {
      errors.push(`${locale}/${moduleManifest.slug}: practice needs at least 3 build steps`);
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/u.test(moduleCopy.practice.downloadFilename)) {
      errors.push(`${locale}/${moduleManifest.slug}: practice download filename must be a safe lowercase Markdown filename`);
    }
    if (moduleCopy.practice.artifact !== moduleCopy.practice.downloadFilename) {
      errors.push(`${locale}/${moduleManifest.slug}: workbench must describe the single Markdown package it actually exports`);
    }
    if (downloadFilenames.has(moduleCopy.practice.downloadFilename)) {
      errors.push(`${locale}/${moduleManifest.slug}: practice download filename must be unique`);
    }
    downloadFilenames.add(moduleCopy.practice.downloadFilename);
    if (moduleCopy.checkpoint.options.length !== 4) {
      errors.push(`${locale}/${moduleManifest.slug}: checkpoint must have 4 options`);
    }
    const cited = new Set(moduleCopy.sections.flatMap((section) => section.sourceIds));
    for (const citedId of cited) {
      if (!sourceIds.has(citedId)) {
        errors.push(`${locale}/${moduleManifest.slug}: unknown cited source ${citedId}`);
      }
      if (!new Set<string>(moduleManifest.sourceIds).has(citedId)) {
        errors.push(`${locale}/${moduleManifest.slug}: cited source ${citedId} is absent from manifest`);
      }
    }
    for (const declaredId of moduleManifest.sourceIds) {
      if (!cited.has(declaredId)) {
        errors.push(`${locale}/${moduleManifest.slug}: declared source ${declaredId} is never cited`);
      }
    }
  }

  if (copy.finalAssessment.questions.length !== 10) {
    errors.push(`${locale}: final assessment must have exactly 10 questions`);
  }
  if (copy.finalAssessment.passPercent !== 80) {
    errors.push(`${locale}: final assessment pass threshold must remain 80%`);
  }
  if (copy.capstone.artifacts.length !== 10) {
    errors.push(`${locale}: capstone must require exactly 10 artifacts`);
  }
}

export function validateCreatorOpsCourse(): CreatorOpsValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const sourceIds = new Set<string>(CREATOR_OPS_SOURCES.map((source) => source.id));
  const excluded = new Set<string>(
    CREATOR_OPS_SOURCES
      .filter((source) => source.decision === "excluded")
      .map((source) => source.id),
  );

  if (CREATOR_OPS_COURSE_MANIFEST.modules.length !== 10) {
    errors.push("manifest: exactly 10 modules are required");
  }
  if (CREATOR_OPS_COURSE_MANIFEST.phases.length !== 4) {
    errors.push("manifest: exactly 4 phases are required");
  }
  const minutes = CREATOR_OPS_COURSE_MANIFEST.modules.reduce(
    (sum, module) => sum + module.minutes,
    0,
  );
  if (minutes !== 710) errors.push(`manifest: expected 710 minutes, found ${minutes}`);
  if (
    JSON.stringify(CREATOR_OPS_COURSE_MANIFEST.modules.map((module) => module.slug))
    !== JSON.stringify(CREATOR_OPS_MODULE_SLUGS)
  ) {
    errors.push("manifest: module order differs from the public slug contract");
  }
  for (const courseModule of CREATOR_OPS_COURSE_MANIFEST.modules) {
    for (const sourceId of courseModule.sourceIds) {
      if (!sourceIds.has(sourceId)) errors.push(`${courseModule.slug}: unknown source ${sourceId}`);
      if (excluded.has(sourceId)) errors.push(`${courseModule.slug}: excluded source ${sourceId} cannot support a lab`);
    }
  }

  validateCopy("en", CREATOR_OPS_EN_COPY, sourceIds, errors);
  validateCopy("zh-Hans", CREATOR_OPS_ZH_HANS_COPY, sourceIds, errors);

  const enDownloadFilenames = CREATOR_OPS_COURSE_MANIFEST.modules.map(
    (module) => CREATOR_OPS_EN_COPY.modules[module.slug].practice.downloadFilename,
  );
  const zhDownloadFilenames = CREATOR_OPS_COURSE_MANIFEST.modules.map(
    (module) => CREATOR_OPS_ZH_HANS_COPY.modules[module.slug].practice.downloadFilename,
  );
  if (JSON.stringify(enDownloadFilenames) !== JSON.stringify(zhDownloadFilenames)) {
    errors.push("course copy: English and Chinese practice download filenames must match exactly");
  }

  const serialized = `${JSON.stringify(CREATOR_OPS_EN_COPY)}\n${JSON.stringify(CREATOR_OPS_ZH_HANS_COPY)}`;
  if (/\b(?:TODO|TBD|FIXME|PLACEHOLDER)\b/i.test(serialized)) {
    errors.push("course copy contains an unfinished marker");
  }
  return { errors, warnings };
}

export function assertValidCreatorOpsCourse(): void {
  const result = validateCreatorOpsCourse();
  if (result.errors.length > 0) {
    throw new Error(`Invalid creator-ops course:\n${result.errors.join("\n")}`);
  }
}
