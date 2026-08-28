import { AGENTIC_VIDEO_EDITING_EN_COPY } from "./copy/en";
import { AGENTIC_VIDEO_EDITING_ZH_HANS_COPY } from "./copy/zh-Hans";
import { AGENTIC_VIDEO_EDITING_CLAIMS } from "./claims";
import { AGENTIC_VIDEO_EDITING_COURSE_MANIFEST } from "./manifest";
import { AGENTIC_VIDEO_EDITING_SOURCES } from "./sources";
import {
  AGENTIC_VIDEO_EDITING_CAPSTONE_EVIDENCE_IDS,
} from "./progress";
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

const VERSION_PINNED_STANDARD_URLS = new Map<string, string>([
  ["mcp-2026-07-28", "https://blog.modelcontextprotocol.io/posts/2026-07-28/"],
  ["wcag22-captions-prerecorded", "https://www.w3.org/TR/WCAG22/#captions-prerecorded"],
  ["iptc-vmh-1-7", "https://www.iptc.org/std/videometadatahub/recommendation/IPTC-VideoMetadataHub-props-Rec_1.7.html"],
  ["c2pa-2-4", "https://spec.c2pa.org/specifications/specifications/2.4/specs/C2PA_Specification.html"],
]);

/**
 * Fail-closed provenance rules that can be mutation-tested independently of
 * the authored copy and module DAG.
 */
export function validateAgenticVideoEditingSourceProvenance(
  sources: readonly AgenticVideoEditingSourceRecord[] = AGENTIC_VIDEO_EDITING_SOURCES,
): string[] {
  const errors: string[] = [];
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const immutableStabilities = new Set([
    "release-pinned",
    "commit-pinned-at-cutoff",
    "version-pinned-standard",
  ]);
  const immutableKinds = new Set([
    "versioned-url",
    "release-tag",
    "commit-sha",
    "content-sha256",
  ]);

  for (const source of sources) {
    if (source.accessedAt !== "2026-08-28T00:00:00+08:00") {
      errors.push(`${source.id}: offset-aware accessedAt must bind the research snapshot.`);
    }

    const mustBeImmutable = immutableStabilities.has(source.stability);
    if (mustBeImmutable && !source.immutableRef) {
      errors.push(`${source.id}: pinned evidence requires a genuine immutableRef.`);
    }
    if (!mustBeImmutable && source.immutableRef) {
      errors.push(`${source.id}: mutable or observation-only evidence must not claim an immutableRef.`);
    }

    if (source.immutableRef) {
      const ref = source.immutableRef;
      if (!immutableKinds.has(ref.kind) || !ref.value.trim()) {
        errors.push(`${source.id}: immutableRef kind and value are invalid.`);
      }
      if (!ref.url.startsWith("https://") || !source.claimEvidenceUrls.includes(ref.url)) {
        errors.push(`${source.id}: immutableRef URL must be HTTPS and included in claim evidence.`);
      }
      if (ref.kind === "commit-sha" && !/^[a-f0-9]{40}$/u.test(ref.value)) {
        errors.push(`${source.id}: commit-sha immutableRef must be a full lowercase SHA.`);
      }
      if (ref.kind === "content-sha256" && !/^[a-f0-9]{64}$/u.test(ref.value)) {
        errors.push(`${source.id}: content-sha256 immutableRef must be 64 lowercase hex characters.`);
      }
    }

    if (source.stability === "version-pinned-standard") {
      const expectedUrl = VERSION_PINNED_STANDARD_URLS.get(source.id);
      if (!expectedUrl) {
        errors.push(`${source.id}: version-pinned standard needs a reviewed version-specific URL contract.`);
      } else if (source.url !== expectedUrl) {
        errors.push(`${source.id}: version-pinned standard must use its reviewed version-specific URL.`);
      }
      if (source.immutableRef?.kind !== "versioned-url"
        || source.immutableRef.url !== expectedUrl) {
        errors.push(`${source.id}: version-pinned standard must bind a versioned-url immutableRef.`);
      }
    }

    if (source.kind === "legal-policy") {
      if (source.stability !== "current-official-documentation" || source.immutableRef) {
        errors.push(`${source.id}: a rolling policy page is current evidence, not an immutable snapshot.`);
      }
      if (source.applicabilityStatus !== "requires-project-specific-review"
        || source.legalAdviceStatus !== "not-legal-advice-qualified-review-required") {
        errors.push(`${source.id}: policy applicability and legal-advice status must fail closed.`);
      }
      const policyFields = [
        source.jurisdiction,
        source.jurisdictionZhHans,
        source.applicability,
        source.applicabilityZhHans,
        source.recheckTrigger,
        source.recheckTriggerZhHans,
      ];
      if (policyFields.some((value) => value.trim().length < 30)) {
        errors.push(`${source.id}: jurisdiction, applicability, and recheck fields must be substantive and bilingual.`);
      }
      if (!/not legal advice/iu.test(source.boundary)
        || !/(?:非法律意见|不构成法律意见)/u.test(source.boundaryZhHans)) {
        errors.push(`${source.id}: policy boundary must visibly state the bilingual non-legal-advice limit.`);
      }
    }

    if (source.kind === "x-post") {
      for (const evidenceUrl of source.claimEvidenceUrls) {
        let hostname = "";
        try {
          hostname = new URL(evidenceUrl).hostname.toLowerCase();
        } catch {
          errors.push(`${source.id}: X claim evidence URL is invalid.`);
        }
        if (hostname && hostname !== "x.com" && hostname !== "publish.x.com") {
          errors.push(`${source.id}: X claim evidence must not mix repository, documentation, or legal-policy URLs.`);
        }
      }
      for (const policyId of source.policyBoundarySourceIds ?? []) {
        if (sourceById.get(policyId)?.kind !== "legal-policy") {
          errors.push(`${source.id}: policy boundary ${policyId} must resolve to a separate legal-policy record.`);
        }
      }
      if (source.id === "x-mosaic-slack"
        && JSON.stringify(source.policyBoundarySourceIds) !== JSON.stringify(["mosaic-legal-policy"])) {
        errors.push("x-mosaic-slack: Mosaic policy boundary must use the separate mosaic-legal-policy source ID.");
      }
    }
  }

  return errors;
}

function validateCopy(
  locale: "en" | "zh-Hans",
  copy: AgenticVideoEditingCourseCopy,
  sourceIds: ReadonlySet<string>,
  sourceById: ReadonlyMap<string, AgenticVideoEditingSourceRecord>,
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
  const expectedAssessedModules = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules
    .filter((module) => module.slug !== "production-capstone")
    .map((module) => module.slug)
    .sort();
  const assessedModules = [...new Set(copy.finalAssessment.questions.map((question) => question.moduleSlug))].sort();
  if (JSON.stringify(assessedModules) !== JSON.stringify(expectedAssessedModules)) {
    errors.push(`${locale}: readiness assessment must cover every M1-M9 module exactly as a declared coverage set.`);
  }
  if (!copy.finalAssessment.questions.some((question) => (
    question.moduleSlug === "captions-audio-formats"
    && (locale === "en"
      ? /caption|audio|accessib/iu.test(`${question.question} ${question.explanation}`)
      : /字幕|音频|无障碍/u.test(`${question.question} ${question.explanation}`))
  ))) {
    errors.push(`${locale}: readiness assessment needs a direct caption/audio/accessibility integrity question.`);
  }
  if (copy.capstone.artifacts.length !== 12
    || JSON.stringify(copy.capstone.artifacts.map((artifact) => artifact.artifactId))
      !== JSON.stringify(AGENTIC_VIDEO_EDITING_CAPSTONE_EVIDENCE_IDS)) {
    errors.push(`${locale}: capstone must map the exact twelve evidence artifact IDs.`);
  }

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
    for (const required of ["source-grounded", "instructional-synthesis"] as const) {
      if (!modes.has(required)) errors.push(`${locale}/${moduleManifest.slug}: missing ${required}.`);
    }
    const allowedModes = new Set(["source-grounded", "instructional-synthesis", "course-policy", "version-watch"]);
    for (const mode of modes) {
      if (!allowedModes.has(mode)) errors.push(`${locale}/${moduleManifest.slug}: unsupported evidence mode ${mode}.`);
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
      if (section.evidenceMode === "source-grounded"
        && section.sourceIds.every((sourceId) => {
          const kind = sourceById.get(sourceId)?.kind;
          return kind === "x-post" || kind === "community-issue";
        })) {
        errors.push(`${locale}/${moduleManifest.slug}: X or community evidence cannot be the sole core support.`);
      }
      if (section.evidenceMode !== "version-watch"
        && section.evidenceMode !== "source-grounded"
        && section.sourceIds.some((sourceId) => {
          const kind = sourceById.get(sourceId)?.kind;
          return kind === "x-post" || kind === "community-issue";
        })) {
        errors.push(`${locale}/${moduleManifest.slug}: X and community evidence is restricted to version-watch use.`);
      }
    }
  }
  const visible = allStrings(copy).join("\n");
  if (/\b(?:todo|tbd|lorem ipsum|placeholder)\b/i.test(visible)) {
    errors.push(`${locale}: visible copy contains a placeholder token.`);
  }
  if (/\b(?:deterministic automation|deterministic rendering)\b/i.test(visible)
    || /确定性自动化/u.test(visible)) {
    errors.push(`${locale}: use code-directed workflow and controlled rendering terminology.`);
  }
  if (/\bimmutable evidence\b/iu.test(visible) || /不可变证据/u.test(visible)) {
    errors.push(`${locale}: use fixity evidence without overstating immutability.`);
  }
  if (/(?:api[_-]?key|access[_-]?token|secret[_-]?key)\s*[:=]\s*["'][^"'<>\s]{4,}["']/iu.test(visible)) {
    errors.push(`${locale}: visible copy contains a credential-like assignment.`);
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
      || question.moduleSlug !== translated.moduleSlug
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
  const sourceById = new Map(sources.map((source) => [source.id, source]));

  errors.push(...validateAgenticVideoEditingSourceProvenance(sources));

  const claimIds = AGENTIC_VIDEO_EDITING_CLAIMS.map((claim) => claim.id);
  if (duplicates(claimIds).length) errors.push("Atomic claim IDs must be unique.");
  for (const claim of AGENTIC_VIDEO_EDITING_CLAIMS) {
    const moduleCopy = AGENTIC_VIDEO_EDITING_EN_COPY.modules[claim.moduleSlug];
    const section = moduleCopy?.sections[claim.sectionIndex];
    if (!section || !section.paragraphs[claim.paragraphIndex]) {
      errors.push(`${claim.id}: claim points to a missing module/section/paragraph.`);
      continue;
    }
    if (claim.claim.trim().length < 40 || claim.claimZhHans.trim().length < 15
      || claim.locator.trim().length < 12
      || claim.boundary.trim().length < 40
      || claim.boundaryZhHans.trim().length < 15) {
      errors.push(`${claim.id}: atomic claim text, locator, or boundary is too thin.`);
    }
    if (claim.sourceId || claim.evidenceUrl) {
      const source = claim.sourceId ? sourceById.get(claim.sourceId) : undefined;
      if (!source || !claim.evidenceUrl
        || !source.claimEvidenceUrls.includes(claim.evidenceUrl)
        || !(section.sourceIds as readonly string[]).includes(claim.sourceId!)) {
        errors.push(`${claim.id}: source-grounded claim must bind one declared source and its exact evidence URL.`);
      } else if (claim.evidenceMode === "source-grounded"
        && source.evidenceUse === "version-watch-only") {
        errors.push(`${claim.id}: weak version-watch evidence cannot ground a core claim.`);
      } else if (claim.evidenceMode === "version-watch"
        && source.evidenceUse !== "version-watch-only") {
        errors.push(`${claim.id}: version-watch claim must bind a version-watch-only source.`);
      }
    } else if (claim.evidenceMode === "source-grounded"
      || claim.evidenceMode === "version-watch") {
      errors.push(`${claim.id}: ${claim.evidenceMode} requires an exact source and URL.`);
    }
  }
  for (const [moduleSlug, moduleCopy] of Object.entries(AGENTIC_VIDEO_EDITING_EN_COPY.modules)) {
    moduleCopy.sections.forEach((section, sectionIndex) => {
      if (section.evidenceMode !== "source-grounded") return;
      const sectionClaims = AGENTIC_VIDEO_EDITING_CLAIMS.filter((claim) => (
        claim.moduleSlug === moduleSlug && claim.sectionIndex === sectionIndex
      ));
      section.paragraphs.forEach((_, paragraphIndex) => {
        const claims = sectionClaims.filter((claim) => (
          claim.paragraphIndex === paragraphIndex
        ));
        if (!claims.length) {
          errors.push(`${moduleSlug}/section-${sectionIndex + 1}/paragraph-${paragraphIndex + 1}: source-grounded paragraph has no atomic claim record.`);
        }
      });
      for (const sourceId of section.sourceIds) {
        const evidenceUse = sourceById.get(sourceId)?.evidenceUse;
        if (evidenceUse === "version-watch-only"
          && !sectionClaims.some((claim) => (
            claim.sourceId === sourceId && claim.evidenceMode === "version-watch"
          ))) {
          errors.push(`${moduleSlug}/section-${sectionIndex + 1}: weak source ${sourceId} lacks an explicit version-watch atomic claim.`);
        }
      }
    });
  }

  if (manifest.id !== "agentic-video-editing") errors.push("Course ID must be agentic-video-editing.");
  if (manifest.version !== "2.0.0") errors.push("Course version must be 2.0.0.");
  if (manifest.displayNumber !== 22) errors.push("Course display number must be 22.");
  if (manifest.publishedOn !== "2026-08-28" || manifest.researchCutoff !== "2026-08-28") {
    errors.push("Course 22 publication and research cutoff must be 2026-08-28.");
  }
  if (manifest.modules.length !== 10) errors.push("Course 22 must have exactly ten modules.");
  if (manifest.phases.length !== 4) errors.push("Course 22 must have exactly four phases.");
  if (manifest.modules.reduce((sum, module) => sum + module.minutes, 0) !== 750) {
    errors.push("Course 22 must total 750 minutes.");
  }
  if (duplicates(slugs).length) errors.push("Module slugs must be unique.");
  if (duplicates(phaseIds).length) errors.push("Phase IDs must be unique.");
  if (duplicates(sourceIdList).length) errors.push("Source IDs must be unique.");
  if (JSON.stringify(slugs) !== JSON.stringify([...AGENTIC_VIDEO_EDITING_MODULE_SLUGS])) {
    errors.push("Module order must match the canonical Course 22 order.");
  }
  if (JSON.stringify(phaseIds) !== JSON.stringify([...AGENTIC_VIDEO_EDITING_PHASE_IDS])) {
    errors.push("Phase order must match the canonical Course 22 order.");
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
  const producedBefore = new Set<string>();
  for (const [index, module] of manifest.modules.entries()) {
    if (module.order !== index + 1) errors.push(`${module.slug}: invalid module order.`);
    for (const sourceId of module.sourceIds) {
      if (!sourceIds.has(sourceId)) errors.push(`${module.slug}: unknown manifest source ${sourceId}.`);
    }
    const expectedPrerequisites = index === 0 ? [] : [manifest.modules[index - 1]!.slug];
    if (JSON.stringify(module.prerequisiteModuleSlugs) !== JSON.stringify(expectedPrerequisites)) {
      errors.push(`${module.slug}: prerequisiteModuleSlugs must form the canonical M1-M10 lineage.`);
    }
    if (!module.producesArtifactIds.length || duplicates(module.producesArtifactIds).length) {
      errors.push(`${module.slug}: producesArtifactIds must be non-empty and unique.`);
    }
    for (const artifactId of module.consumesArtifactIds) {
      if (!producedBefore.has(artifactId)
        && !(module.slug === "production-capstone" && artifactId.startsWith("capstone-"))) {
        errors.push(`${module.slug}: consumes unavailable artifact ${artifactId}.`);
      }
    }
    const expectedValidatorId = `aicourse.agentic-video-editing.module.${module.slug}.v2`;
    if (module.validatorId !== expectedValidatorId
      || module.artifactSchemaId !== `aicourse.agentic-video-editing.module.${module.slug}.artifact.v2`
      || !module.validatorCommand.includes(`--module ${module.slug}`)
      || module.completionMode !== "validated-artifact") {
      errors.push(`${module.slug}: module-specific artifact validation contract drifted.`);
    }
    module.producesArtifactIds.forEach((artifactId) => producedBefore.add(artifactId));
  }
  const capstone = manifest.modules.at(-1)!;
  const expectedCapstoneInputs = AGENTIC_VIDEO_EDITING_CAPSTONE_EVIDENCE_IDS
    .filter((artifactId) => artifactId !== "release-decision");
  if (JSON.stringify([...capstone.consumesArtifactIds].sort())
    !== JSON.stringify([...expectedCapstoneInputs].sort())) {
    errors.push("production-capstone must consume the separate learner-owned capstone packet.");
  }

  const usedSources = new Set<string>(manifest.modules.flatMap((module) => module.sourceIds));
  for (const sourceId of sourceIds) {
    if (!usedSources.has(sourceId)) errors.push(`${sourceId}: source is not used by any module.`);
  }
  for (const requiredKind of [
    "github-repository",
    "x-post",
    "open-standard",
    "legal-policy",
    "community-issue",
  ] as const) {
    if (!sources.some((source) => source.kind === requiredKind)) {
      errors.push(`Course 22 requires at least one cited ${requiredKind} source.`);
    }
  }
  for (const source of sources) {
    if (!source.url.startsWith("https://")) errors.push(`${source.id}: primary URL must use HTTPS.`);
    if (!source.claimEvidenceUrls.includes(source.url)) errors.push(`${source.id}: evidence URLs must include primary URL.`);
    if (source.accessedOn !== "2026-08-28") errors.push(`${source.id}: access date must equal the 2026-08-28 cutoff.`);
    const expectedEvidenceUse = source.kind === "x-post" || source.kind === "community-issue"
      ? "version-watch-only"
      : source.kind === "legal-policy"
        ? "policy-boundary-only"
        : source.kind === "open-standard"
          ? "standard-boundary-support"
          : "core-primary-support";
    if (source.evidenceUse !== expectedEvidenceUse) {
      errors.push(`${source.id}: evidenceUse must match its source class.`);
    }
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
        if (source.tagObjectCommit
          && (!/^[0-9a-f]{40}$/i.test(source.tagObjectCommit)
            || source.tagObjectCommit.toLowerCase() === source.resolvedCommit?.toLowerCase())) {
          errors.push(`${source.id}: annotated tag object must be a distinct full SHA from the peeled commit.`);
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
    } else if (source.kind === "x-post") {
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
    } else {
      if (source.kind === "community-issue" && source.id !== "qwen3-vl-issue-1761") {
        errors.push(`${source.id}: unknown community-issue record.`);
      }
      if (source.kind === "open-standard" && !source.revision?.trim()) {
        errors.push(`${source.id}: versioned standard requires a revision.`);
      }
    }
  }

  errors.push(...validateCopy("en", AGENTIC_VIDEO_EDITING_EN_COPY, sourceIds, sourceById));
  errors.push(...validateCopy("zh-Hans", AGENTIC_VIDEO_EDITING_ZH_HANS_COPY, sourceIds, sourceById));
  const enUi = Object.keys(AGENTIC_VIDEO_EDITING_EN_COPY.ui).sort();
  const zhUi = Object.keys(AGENTIC_VIDEO_EDITING_ZH_HANS_COPY.ui).sort();
  if (JSON.stringify(enUi) !== JSON.stringify(zhUi)) errors.push("English and Chinese UI keys must match.");
  errors.push(...validateBilingualStructuralParity());
  return errors;
}
