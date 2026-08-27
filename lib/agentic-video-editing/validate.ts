import { AGENTIC_VIDEO_EDITING_EN_COPY } from "./copy/en";
import { AGENTIC_VIDEO_EDITING_ZH_HANS_COPY } from "./copy/zh-Hans";
import { AGENTIC_VIDEO_EDITING_COURSE_MANIFEST } from "./manifest";
import { AGENTIC_VIDEO_EDITING_SOURCES } from "./sources";
import {
  AGENTIC_VIDEO_EDITING_MODULE_SLUGS,
  AGENTIC_VIDEO_EDITING_PHASE_IDS,
  type AgenticVideoEditingCourseCopy,
  type AgenticVideoEditingSourceRecord,
} from "./types";

function duplicates(values: readonly string[]): string[] {
  return values.filter((value, index) => values.indexOf(value) !== index);
}

function allStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(allStrings);
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(allStrings);
  }
  return [];
}

function githubEvidenceRef(url: string, repository: string): string | null {
  try {
    const parsed = new URL(url);
    const [owner, name, operation, ref] = decodeURIComponent(parsed.pathname)
      .split("/")
      .filter(Boolean);
    if (parsed.hostname !== "github.com"
      || `${owner}/${name}`.toLowerCase() !== repository.toLowerCase()
      || !["blob", "tree"].includes(operation)
      || !ref) return null;
    return ref;
  } catch {
    return null;
  }
}

function validateCopy(
  locale: "en" | "zh-Hans",
  copy: AgenticVideoEditingCourseCopy,
  sourceIds: ReadonlySet<string>,
): string[] {
  const errors: string[] = [];
  const copySlugs = Object.keys(copy.modules);
  if (
    copySlugs.length !== AGENTIC_VIDEO_EDITING_MODULE_SLUGS.length
    || AGENTIC_VIDEO_EDITING_MODULE_SLUGS.some((slug) => !copySlugs.includes(slug))
  ) {
    errors.push(`${locale}: copy must match all ten module slugs exactly.`);
  }
  if (copy.principles.length !== 7) errors.push(`${locale}: seven production principles are required.`);
  if (copy.outcomes.length !== 8) errors.push(`${locale}: eight observable outcomes are required.`);
  if (copy.distinctions.length !== 5) errors.push(`${locale}: five system distinctions are required.`);
  if (copy.finalAssessment.passPercent !== 80) errors.push(`${locale}: assessment pass mark must be 80.`);
  if (copy.finalAssessment.questions.length !== 10) errors.push(`${locale}: ten final questions are required.`);
  if (copy.finalAssessment.questions.filter((question) => question.critical).length < 3) {
    errors.push(`${locale}: at least three critical final questions are required.`);
  }
  if (copy.capstone.artifacts.length !== 12) errors.push(`${locale}: capstone must require twelve artifacts.`);

  for (const phaseId of AGENTIC_VIDEO_EDITING_PHASE_IDS) {
    if (!copy.phases[phaseId]) errors.push(`${locale}: missing phase ${phaseId}.`);
  }
  for (const moduleManifest of AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules) {
    const moduleCopy = copy.modules[moduleManifest.slug];
    if (!moduleCopy) continue;
    if (moduleCopy.sections.length !== 3) {
      errors.push(`${locale}/${moduleManifest.slug}: exactly three sections are required.`);
    }
    const modes = new Set(moduleCopy.sections.map((section) => section.evidenceMode));
    for (const required of ["source-grounded", "engineering-synthesis", "version-watch"] as const) {
      if (!modes.has(required)) errors.push(`${locale}/${moduleManifest.slug}: missing ${required}.`);
    }
    if (moduleCopy.practice.steps.length < 5) {
      errors.push(`${locale}/${moduleManifest.slug}: practice needs at least five steps.`);
    }
    const minimumTemplateLength = locale === "zh-Hans" ? 100 : 160;
    if (moduleCopy.practice.template.trim().length < minimumTemplateLength) {
      errors.push(`${locale}/${moduleManifest.slug}: artifact template is too thin.`);
    }
    if (moduleCopy.checkpoint.options.length !== 4) {
      errors.push(`${locale}/${moduleManifest.slug}: checkpoint needs four options.`);
    }
    const declared = new Set<string>(moduleManifest.sourceIds);
    const cited = new Set<string>(moduleCopy.sections.flatMap((section) => section.sourceIds));
    for (const sourceId of declared) {
      if (!sourceIds.has(sourceId)) errors.push(`${locale}/${moduleManifest.slug}: unknown source ${sourceId}.`);
      if (!cited.has(sourceId)) errors.push(`${locale}/${moduleManifest.slug}: declared source ${sourceId} is never cited.`);
    }
    for (const section of moduleCopy.sections) {
      const minimumParagraphLength = locale === "zh-Hans" ? 55 : 90;
      if (section.paragraphs.some((paragraph) => paragraph.trim().length < minimumParagraphLength)) {
        errors.push(`${locale}/${moduleManifest.slug}: teaching paragraphs must be substantive.`);
      }
      for (const sourceId of section.sourceIds) {
        if (!declared.has(sourceId)) errors.push(`${locale}/${moduleManifest.slug}: undeclared citation ${sourceId}.`);
      }
    }
  }
  const visible = allStrings(copy).join("\n");
  if (/\b(?:todo|tbd|lorem ipsum|placeholder)\b/i.test(visible)) {
    errors.push(`${locale}: visible copy contains a placeholder token.`);
  }
  return errors;
}

function validateBilingualStructuralParity(): string[] {
  const errors: string[] = [];
  for (const slug of AGENTIC_VIDEO_EDITING_MODULE_SLUGS) {
    const en = AGENTIC_VIDEO_EDITING_EN_COPY.modules[slug];
    const zh = AGENTIC_VIDEO_EDITING_ZH_HANS_COPY.modules[slug];
    for (const [index, section] of en.sections.entries()) {
      const translated = zh.sections[index];
      if (section.evidenceMode !== translated.evidenceMode) {
        errors.push(`${slug}/section-${index + 1}: bilingual evidence modes differ.`);
      }
      if (JSON.stringify(section.sourceIds) !== JSON.stringify(translated.sourceIds)) {
        errors.push(`${slug}/section-${index + 1}: bilingual source citations differ.`);
      }
    }
    if (en.checkpoint.correctIndex !== zh.checkpoint.correctIndex) {
      errors.push(`${slug}: bilingual checkpoint answers differ.`);
    }
  }
  for (const [index, question] of AGENTIC_VIDEO_EDITING_EN_COPY.finalAssessment.questions.entries()) {
    const translated = AGENTIC_VIDEO_EDITING_ZH_HANS_COPY.finalAssessment.questions[index];
    if (question.id !== translated.id
      || question.correctIndex !== translated.correctIndex
      || question.critical !== translated.critical) {
      errors.push(`assessment-${index + 1}: bilingual assessment contract differs.`);
    }
  }
  return errors;
}

export function validateAgenticVideoEditingCourse(): string[] {
  const errors: string[] = [];
  const manifest = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST;
  const sources: readonly AgenticVideoEditingSourceRecord[] = AGENTIC_VIDEO_EDITING_SOURCES;
  const slugs = manifest.modules.map((module) => module.slug);
  const phaseIds = manifest.phases.map((phase) => phase.id);
  const sourceIdList = sources.map((source) => source.id);
  const sourceIds = new Set<string>(sourceIdList);

  if (manifest.id !== "agentic-video-editing") errors.push("Course ID must be agentic-video-editing.");
  if (manifest.version !== "1.1.0") errors.push("Course version must be 1.1.0.");
  if (manifest.displayNumber !== 20) errors.push("Course display number must be 20.");
  if (manifest.modules.length !== 10) errors.push("Course 20 must have exactly ten modules.");
  if (manifest.phases.length !== 4) errors.push("Course 20 must have exactly four phases.");
  if (manifest.modules.reduce((sum, module) => sum + module.minutes, 0) !== 750) {
    errors.push("Course 20 must total 750 minutes.");
  }
  if (duplicates(slugs).length) errors.push("Module slugs must be unique.");
  if (duplicates(phaseIds).length) errors.push("Phase IDs must be unique.");
  if (duplicates(sourceIdList).length) errors.push("Source IDs must be unique.");
  if (JSON.stringify(slugs) !== JSON.stringify([...AGENTIC_VIDEO_EDITING_MODULE_SLUGS])) {
    errors.push("Module order must match the canonical Course 20 order.");
  }
  if (JSON.stringify(phaseIds) !== JSON.stringify([...AGENTIC_VIDEO_EDITING_PHASE_IDS])) {
    errors.push("Phase order must match the canonical Course 20 order.");
  }
  const phaseCoverage = manifest.phases.flatMap((phase) => phase.moduleSlugs);
  if (
    phaseCoverage.length !== manifest.modules.length
    || new Set(phaseCoverage).size !== manifest.modules.length
  ) errors.push("Each module must appear exactly once across phases.");
  for (const [index, phase] of manifest.phases.entries()) {
    if (phase.order !== index + 1) errors.push(`${phase.id}: invalid phase order.`);
    for (const slug of phase.moduleSlugs) {
      const moduleManifest = manifest.modules.find((candidate) => candidate.slug === slug);
      if (!moduleManifest || moduleManifest.phaseId !== phase.id) errors.push(`${phase.id}/${slug}: inconsistent phase coverage.`);
    }
  }
  for (const [index, module] of manifest.modules.entries()) {
    if (module.order !== index + 1) errors.push(`${module.slug}: invalid module order.`);
    for (const sourceId of module.sourceIds) {
      if (!sourceIds.has(sourceId)) errors.push(`${module.slug}: unknown manifest source ${sourceId}.`);
    }
  }

  const usedSources = new Set<string>(manifest.modules.flatMap((module) => module.sourceIds));
  for (const sourceId of sourceIds) {
    if (!usedSources.has(sourceId)) errors.push(`${sourceId}: source is not used by any module.`);
  }
  if (sources.filter((source) => source.kind === "github-repository").length !== 20) {
    errors.push("Course 20 must use exactly twenty GitHub implementation sources.");
  }
  if (sources.filter((source) => source.kind === "x-post").length !== 5) {
    errors.push("Course 20 must use exactly five verified X field signals.");
  }
  for (const source of sources) {
    if (!source.url.startsWith("https://")) errors.push(`${source.id}: primary URL must use HTTPS.`);
    if (!source.claimEvidenceUrls.includes(source.url)) errors.push(`${source.id}: evidence URLs must include primary URL.`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(source.accessedOn)) errors.push(`${source.id}: invalid access date.`);
    if (source.supports.trim().length < 80 || source.boundary.trim().length < 80) {
      errors.push(`${source.id}: support and boundary must be substantive.`);
    }
    if (source.supportsZhHans.trim().length < 25 || source.boundaryZhHans.trim().length < 25) {
      errors.push(`${source.id}: Chinese support and boundary must be substantive.`);
    }
    if (source.reuseStatus === "license-noted-no-code-copy" && !source.license) {
      errors.push(`${source.id}: license-noted reuse needs a license.`);
    }
    if (source.stability === "release-pinned" && (!source.revision || !source.versionAnchorUrl)) {
      errors.push(`${source.id}: release-pinned source needs revision and version URL.`);
    }
    if (source.stability === "release-pinned"
      && source.claimEvidenceUrls.some((url) => /github\.com\/[^/]+\/[^/]+\/(?:blob|tree)\/(?:main|master)(?:\/|$)/.test(url))) {
      errors.push(`${source.id}: release-pinned evidence cannot use a moving branch.`);
    }
    if (source.kind === "github-repository") {
      if (!source.url.includes(`github.com/${source.repository}`)) {
        errors.push(`${source.id}: repository and primary URL disagree.`);
      }
      const primaryRef = githubEvidenceRef(source.url, source.repository);
      if (!primaryRef || !/^[0-9a-f]{40}$/i.test(primaryRef)) {
        errors.push(`${source.id}: primary claim evidence must use a full commit SHA.`);
      }
      if (source.license && !source.claimEvidenceUrls.some((url) => /\/LICENSE(?:\.(?:md|txt))?(?:$|[?#])/.test(url))) {
        errors.push(`${source.id}: a license claim needs immutable LICENSE evidence.`);
      }
      if (source.stability === "release-pinned") {
        if (!source.resolvedCommit || !/^[0-9a-f]{40}$/i.test(source.resolvedCommit)) {
          errors.push(`${source.id}: release-pinned source needs a resolved commit SHA.`);
        }
        if (primaryRef?.toLowerCase() !== source.resolvedCommit?.toLowerCase()) {
          errors.push(`${source.id}: release-pinned primary evidence must use the resolved commit.`);
        }
        for (const url of source.claimEvidenceUrls) {
          const ref = githubEvidenceRef(url, source.repository);
          if (ref && ref.toLowerCase() !== source.resolvedCommit?.toLowerCase()) {
            errors.push(`${source.id}: release claim evidence mixes tag or commit refs.`);
          }
        }
      } else if (source.stability === "commit-pinned-at-cutoff") {
        const revisions = source.revision?.match(/[0-9a-f]{40}/g) ?? [];
        if (!revisions.length || !revisions.some((revision) => source.claimEvidenceUrls.some((url) => url.includes(revision)))) {
          errors.push(`${source.id}: cutoff repository evidence needs a full SHA in a claim URL.`);
        }
        for (const url of source.claimEvidenceUrls) {
          const ref = githubEvidenceRef(url, source.repository);
          if (ref && ref.toLowerCase() !== primaryRef?.toLowerCase()) {
            errors.push(`${source.id}: cutoff claim evidence mixes commit refs.`);
          }
        }
      }
    } else {
      const urlStatus = source.url.match(/\/status\/(\d+)/)?.[1];
      if (urlStatus !== source.statusId) errors.push(`${source.id}: X status ID and URL disagree.`);
      if (!source.publishedOn || !/^\d{4}-\d{2}-\d{2}$/.test(source.publishedOn)) {
        errors.push(`${source.id}: X post needs a publication date.`);
      }
      if (!source.authorIdentity.trim() || !source.authorRole.trim() || !source.threadContext.trim() || !source.mediaContext.trim()) {
        errors.push(`${source.id}: X identity, role, thread, and media context are required.`);
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(source.verifiedOn)) {
        errors.push(`${source.id}: X source needs a valid verification date.`);
      }
      if (!source.corroborationScope.trim() || !source.corroborationScopeZhHans.trim()) {
        errors.push(`${source.id}: X source needs bilingual scoped corroboration statements.`);
      }
      if (source.textCompleteness === "oembed-complete"
        && source.verificationStatus !== "identity-date-url-and-visible-text-verified") {
        errors.push(`${source.id}: complete oEmbed text needs complete verification status.`);
      }
      if (source.textCompleteness !== "oembed-complete"
        && source.verificationStatus !== "identity-date-url-verified-visible-text-truncated") {
        errors.push(`${source.id}: truncated oEmbed text must remain explicitly truncated.`);
      }
      if (source.verificationMethod !== "x-official-oembed") {
        errors.push(`${source.id}: only official X oEmbed verification is allowed.`);
      }
      if (!source.claimEvidenceUrls.some((url) => url.startsWith("https://publish.x.com/oembed?"))) {
        errors.push(`${source.id}: X post needs an official oEmbed evidence URL.`);
      }
      for (const corroboratingId of source.corroboratingSourceIds) {
        const corroborating = sources.find((candidate) => candidate.id === corroboratingId);
        if (!corroborating || corroborating.kind !== "github-repository") {
          errors.push(`${source.id}: invalid GitHub corroboration ${corroboratingId}.`);
        }
      }
    }
  }

  errors.push(...validateCopy("en", AGENTIC_VIDEO_EDITING_EN_COPY, sourceIds));
  errors.push(...validateCopy("zh-Hans", AGENTIC_VIDEO_EDITING_ZH_HANS_COPY, sourceIds));
  const enUi = Object.keys(AGENTIC_VIDEO_EDITING_EN_COPY.ui).sort();
  const zhUi = Object.keys(AGENTIC_VIDEO_EDITING_ZH_HANS_COPY.ui).sort();
  if (JSON.stringify(enUi) !== JSON.stringify(zhUi)) errors.push("English and Chinese UI keys must match.");
  errors.push(...validateBilingualStructuralParity());
  return errors;
}
