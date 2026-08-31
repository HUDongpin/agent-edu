import {
  AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS,
} from "./artifact-contracts";
import { AGENTIC_VIDEO_EDITING_CLAIMS } from "./claims";
import {
  canonicalizeArtifactContent,
  getCourse20ModuleArtifactIds,
  validateCourse20ContractRegistry,
} from "./contracts";
import {
  COURSE20_APPROVED_EDITORIAL_FINGERPRINTS,
  COURSE20_ASSESSMENT_CONTRACT_VERSION,
  COURSE20_CHECKPOINT_BLUEPRINTS,
  COURSE20_FINAL_ASSESSMENT_BLUEPRINTS,
  fingerprintCourse20QuestionCopy,
} from "./assessment-contract";
import { AGENTIC_VIDEO_EDITING_EN_COPY } from "./copy/en";
import { AGENTIC_VIDEO_EDITING_ZH_HANS_COPY } from "./copy/zh-Hans";
import {
  AGENTIC_VIDEO_EDITING_COURSE_MANIFEST,
  AGENTIC_VIDEO_EDITING_OUTCOME_COVERAGE,
} from "./manifest";
import {
  AGENTIC_VIDEO_EDITING_SOURCES,
  AGENTIC_VIDEO_EDITING_SOURCE_USAGE,
} from "./sources";
import {
  AGENTIC_VIDEO_EDITING_ARTIFACT_IDS,
  AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_IDS,
  AGENTIC_VIDEO_EDITING_CRITICAL_CONTROL_IDS,
  AGENTIC_VIDEO_EDITING_MODULE_SLUGS,
  AGENTIC_VIDEO_EDITING_PHASE_IDS,
  type AgenticVideoEditingClaimCopy,
  type AgenticVideoEditingClaimRecord,
  type AgenticVideoEditingCourseCopy,
  type AgenticVideoEditingModuleSlug,
  type AgenticVideoEditingPracticeCopy,
  type AgenticVideoEditingSourceRecord,
} from "./types";

function duplicates(values: readonly string[]): string[] {
  return [...new Set(
    values.filter((value, index) => values.indexOf(value) !== index),
  )];
}

function same(left: readonly unknown[], right: readonly unknown[]): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function isIsoDate(value: string | undefined): boolean {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/u.test(value));
}

function allStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(allStrings);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(allStrings);
  }
  return [];
}

function claimList(
  copy: AgenticVideoEditingCourseCopy,
): AgenticVideoEditingClaimCopy[] {
  return Object.values(copy.modules).flatMap((moduleCopy) => (
    moduleCopy.sections.flatMap((section) => [
      ...section.paragraphs,
      ...(section.bullets ?? []),
    ])
  ));
}

function validateManifest(): string[] {
  const errors: string[] = [];
  const manifest = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST;
  if (manifest.id !== "agentic-video-editing") {
    errors.push("Course ID must remain agentic-video-editing.");
  }
  if (manifest.version !== "1.2.0") {
    errors.push("Course version must be 1.2.0.");
  }
  if (manifest.displayNumber !== 20) {
    errors.push("Independent branch display number must remain 20.");
  }
  if (manifest.publishedOn !== "2026-08-26"
    || manifest.revisedOn !== "2026-08-28"
    || manifest.researchCutoff !== "2026-08-26") {
    errors.push("Publication, revision, and research-cutoff dates drifted.");
  }
  if (manifest.coreGuidedMinutes !== 750
    || manifest.builderExtensionMinutes !== 180
    || manifest.finalAssessmentMinutes !== 30
    || manifest.estimatedCapstoneMinutes !== 240) {
    errors.push("Course workload must disclose 750 core + 180 optional builder + 30 assessment + approximately 240 capstone minutes.");
  }
  if (!same(
    manifest.modules.map((moduleRecord) => moduleRecord.slug),
    AGENTIC_VIDEO_EDITING_MODULE_SLUGS,
  )) {
    errors.push("Canonical module order differs from the ten stable URL slugs.");
  }
  if (!same(
    manifest.phases.map((phase) => phase.id),
    AGENTIC_VIDEO_EDITING_PHASE_IDS,
  )) {
    errors.push("Phase order must remain define → understand → edit → verify.");
  }
  if (manifest.modules.length !== 10 || manifest.phases.length !== 4) {
    errors.push("Course 20 requires ten modules in four phases.");
  }
  const coreMinutes = manifest.modules.reduce(
    (sum, moduleRecord) => sum + moduleRecord.minutes,
    0,
  );
  const extensionMinutes = manifest.modules.reduce(
    (sum, moduleRecord) => sum + moduleRecord.extensionMinutes,
    0,
  );
  if (coreMinutes !== 750 || extensionMinutes !== 180) {
    errors.push(`Workload totals are ${coreMinutes} core and ${extensionMinutes} builder minutes.`);
  }
  const moduleOrder = new Map(
    manifest.modules.map((moduleRecord) => [
      moduleRecord.slug,
      moduleRecord.order,
    ]),
  );
  for (const [index, moduleRecord] of manifest.modules.entries()) {
    if (moduleRecord.order !== index + 1) {
      errors.push(`${moduleRecord.slug}: order must be ${index + 1}.`);
    }
    if (moduleRecord.minutes
      !== moduleRecord.instructionMinutes
        + moduleRecord.practiceMinutes
        + moduleRecord.checkpointMinutes) {
      errors.push(`${moduleRecord.slug}: instruction + practice + checkpoint must equal guided minutes.`);
    }
    if (moduleRecord.coreMinutes !== moduleRecord.minutes
      || moduleRecord.practicumMinutes !== moduleRecord.extensionMinutes) {
      errors.push(`${moduleRecord.slug}: compatibility minute aliases drifted.`);
    }
    if (!same(moduleRecord.requires, moduleRecord.prerequisiteSlugs)) {
      errors.push(`${moduleRecord.slug}: requires and compatibility prerequisites differ.`);
    }
    for (const requiredSlug of moduleRecord.requires) {
      if (!moduleOrder.has(requiredSlug)
        || (moduleOrder.get(requiredSlug) ?? Number.POSITIVE_INFINITY)
          >= moduleRecord.order) {
        errors.push(`${moduleRecord.slug}: invalid prerequisite ${requiredSlug}.`);
      }
    }
    for (const dependencySlug of moduleRecord.requiredArtifactSlugs) {
      if (!moduleOrder.has(dependencySlug)
        || (moduleOrder.get(dependencySlug) ?? Number.POSITIVE_INFINITY)
          >= moduleRecord.order) {
        errors.push(`${moduleRecord.slug}: invalid artifact dependency ${dependencySlug}.`);
      }
    }
    const moduleContracts = AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS.filter(
      (contract) => contract.moduleSlug === moduleRecord.slug
        && contract.requiredForModuleCompletion,
    );
    const expectedOutputArtifactIds = moduleContracts.map(
      (contract) => contract.id,
    );
    const outputArtifactIdSet = new Set<string>(expectedOutputArtifactIds);
    const dependencyArtifactIdSet = new Set<string>(moduleContracts.flatMap(
      (contract) => contract.dependsOn,
    ));
    const expectedInputArtifactIds = AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS
      .map((contract) => contract.id)
      .filter((artifactId) => dependencyArtifactIdSet.has(artifactId)
        && !outputArtifactIdSet.has(artifactId));
    if (!same(moduleRecord.outputArtifactIds, expectedOutputArtifactIds)) {
      errors.push(`${moduleRecord.slug}: outputArtifactIds drifted from the artifact DAG.`);
    }
    if (!same(moduleRecord.inputArtifactIds, expectedInputArtifactIds)) {
      errors.push(`${moduleRecord.slug}: inputArtifactIds drifted from the artifact DAG.`);
    }
    if (!same(moduleRecord.invalidatesOn, expectedInputArtifactIds)) {
      errors.push(`${moduleRecord.slug}: invalidatesOn must equal its direct external artifact inputs.`);
    }
    if (!same(
      getCourse20ModuleArtifactIds(moduleRecord.slug),
      moduleRecord.artifactIds,
    )) {
      errors.push(`${moduleRecord.slug}: module artifacts drifted from the artifact registry.`);
    }
    if (moduleRecord.artifactContractId !== moduleRecord.artifactIds[0]) {
      errors.push(`${moduleRecord.slug}: primary artifact must be the first stable artifact ID.`);
    }
  }
  const flattenedPhaseSlugs = manifest.phases.flatMap(
    (phase) => phase.moduleSlugs,
  );
  if (!same(flattenedPhaseSlugs, AGENTIC_VIDEO_EDITING_MODULE_SLUGS)) {
    errors.push("Phase membership must preserve canonical module order exactly.");
  }
  const expectedEditOrder = [
    "declarative-edit-plan",
    "agent-tools-mcp",
    "captions-audio-formats",
    "deterministic-rendering",
  ];
  if (!same(
    manifest.phases.find((phase) => phase.id === "edit")?.moduleSlugs ?? [],
    expectedEditOrder,
  )) {
    errors.push("Mutation order must be plan → tool authority → delivery specification → rendering.");
  }
  const editPlan = manifest.modules.find(
    (moduleRecord) => moduleRecord.slug === "declarative-edit-plan",
  );
  if (!editPlan?.inputArtifactIds.includes("candidate-segments-system-card")) {
    errors.push("M5 must consume M4 candidate-segments evidence.");
  }
  const render = manifest.modules.find(
    (moduleRecord) => moduleRecord.slug === "deterministic-rendering",
  );
  if (!render?.inputArtifactIds.includes("delivery-matrix-accessibility")
    || !render.inputArtifactIds.includes("tool-policy-adversarial-recovery")) {
    errors.push("Rendering must depend on both delivery specification and tool policy.");
  }
  errors.push(...validateCourse20ContractRegistry());
  const moduleArtifactIds = manifest.modules.flatMap(
    (moduleRecord) => moduleRecord.artifactIds,
  );
  const moduleRequiredArtifactIds = AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS
    .filter((contract) => contract.requiredForModuleCompletion)
    .map((contract) => contract.id);
  if (!same(moduleArtifactIds, moduleRequiredArtifactIds)) {
    errors.push("Module receipts must close exactly the artifacts marked required for module completion.");
  }
  const capstoneArtifactIds = manifest.modules.flatMap(
    (moduleRecord) => moduleRecord.capstoneCriterionIds,
  );
  if (!same(
    capstoneArtifactIds,
    AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_IDS,
  )) {
    errors.push("The post-quiz capstone must close all twelve stable artifact IDs in canonical order.");
  }
  return errors;
}

const REQUIRED_OFFICIAL_SOURCE_IDS = [
  "ffprobe-docs",
  "opentimelineio-docs",
  "model-context-protocol-spec",
  "wcag-2-2-captions",
  "w3c-media-planning",
  "w3c-visual-description",
  "itu-bs-1770",
  "ebu-r128",
  "aces-docs",
  "owasp-prompt-injection",
  "owasp-excessive-agency",
  "c2pa-spec",
  "bbc-editorial-accuracy",
  "adobe-j-l-cuts",
  "eu-ai-act-article-50",
  "usco-ai-study",
] as const;

function validateSources(
  sources: readonly AgenticVideoEditingSourceRecord[],
): string[] {
  const errors: string[] = [];
  const ids = sources.map((source) => source.id);
  if (duplicates(ids).length) errors.push("Source IDs must be unique.");
  const github = sources.filter(
    (source) => source.kind === "github-repository",
  );
  const xPosts = sources.filter((source) => source.kind === "x-post");
  if (!github.length || !xPosts.length) {
    errors.push("The source ledger needs both inspectable implementation evidence and explicitly bounded field-signal context.");
  }
  if (!same(
    Object.keys(AGENTIC_VIDEO_EDITING_SOURCE_USAGE).sort(),
    [...ids].sort(),
  )) {
    errors.push("Every source record must have exactly one explicit usage classification.");
  }
  const observedUsages = new Set(
    Object.values(AGENTIC_VIDEO_EDITING_SOURCE_USAGE),
  );
  for (const usage of [
    "claim-evidence",
    "version-watch",
    "field-signal-context",
    "atlas-only",
  ]) {
    if (!observedUsages.has(usage as never)) {
      errors.push(`Source usage coverage is missing ${usage}.`);
    }
  }
  for (const requiredId of REQUIRED_OFFICIAL_SOURCE_IDS) {
    if (!ids.includes(requiredId)) {
      errors.push(`Required official source is missing: ${requiredId}.`);
    }
  }
  for (const source of sources) {
    if (!source.url.startsWith("https://")
      || !source.claimEvidenceUrls.includes(source.url)) {
      errors.push(`${source.id}: primary HTTPS URL must appear in exact evidence URLs.`);
    }
    if (!isIsoDate(source.accessedOn)) {
      errors.push(`${source.id}: accessedOn must be an ISO date.`);
    }
    if (!source.supports.trim() || !source.boundary.trim()
      || !source.supportsZhHans.trim() || !source.boundaryZhHans.trim()) {
      errors.push(`${source.id}: bilingual support and boundary text is required.`);
    }
    if (source.kind === "github-repository") {
      if (!source.url.toLowerCase().includes(
        `github.com/${source.repository}`.toLowerCase(),
      )) {
        errors.push(`${source.id}: repository identity and URL disagree.`);
      }
      if (source.claimEvidenceUrls.some(
        (url) => /\/blob\/(?:main|master)\//u.test(url),
      )) {
        errors.push(`${source.id}: implementation evidence must not use a moving main/master blob URL.`);
      }
      if (source.stability === "release-pinned"
        && !/^[0-9a-f]{40}$/u.test(source.resolvedCommit ?? "")) {
        errors.push(`${source.id}: release-pinned source needs a resolved commit.`);
      }
    } else if (source.kind === "x-post") {
      if (source.role !== "field-signal"
        || source.stability !== "dated-field-signal"
        || source.verificationMethod !== "x-official-oembed"
        || !source.claimEvidenceUrls.some(
          (url) => url.startsWith("https://publish.x.com/oembed?"),
        )) {
        errors.push(`${source.id}: X must remain a dated, official-oEmbed-verified field signal.`);
      }
      if (!source.corroboratingSourceIds.length) {
        errors.push(`${source.id}: X field signal needs repository corroboration.`);
      }
      if (AGENTIC_VIDEO_EDITING_SOURCE_USAGE[source.id]
        !== "field-signal-context") {
        errors.push(`${source.id}: X must remain field-signal-context, never claim evidence.`);
      }
    }
  }
  const sourceIds = new Set(ids);
  for (const moduleRecord of AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules) {
    for (const sourceId of moduleRecord.sourceIds) {
      if (!sourceIds.has(sourceId)) {
        errors.push(`${moduleRecord.slug}: unknown source ${sourceId}.`);
      }
      if (AGENTIC_VIDEO_EDITING_SOURCE_USAGE[sourceId]
        !== "claim-evidence") {
        errors.push(`${moduleRecord.slug}: teaching source ${sourceId} must be classified claim-evidence.`);
      }
    }
  }
  return errors;
}

function validateClaimRegistry(): string[] {
  const errors: string[] = [];
  const sourceById = new Map<string, AgenticVideoEditingSourceRecord>(
    AGENTIC_VIDEO_EDITING_SOURCES.map((source) => [source.id, source]),
  );
  const claimIds = AGENTIC_VIDEO_EDITING_CLAIMS.map((claim) => claim.id);
  if (duplicates(claimIds).length) errors.push("Claim registry IDs must be unique.");
  for (const claim of AGENTIC_VIDEO_EDITING_CLAIMS as readonly AgenticVideoEditingClaimRecord[]) {
    if (!claim.text.trim() || !claim.textZhHans.trim()
      || !claim.boundary.trim() || !claim.boundaryZhHans.trim()
      || !isIsoDate(claim.reviewedOn)) {
      errors.push(`${claim.id}: bilingual claim, boundary, and review date are required.`);
    }
    for (const sourceId of claim.sourceIds) {
      if (!sourceById.has(sourceId)) {
        errors.push(`${claim.id}: unknown source ${sourceId}.`);
      }
    }
    if (claim.support === "direct" && claim.sourceIds.length === 0) {
      errors.push(`${claim.id}: direct support requires a source.`);
    }
    if (claim.kind === "course-fail-closed-policy"
      && claim.support !== "course-policy") {
      errors.push(`${claim.id}: course policy must be labelled course-policy.`);
    }
    if (claim.kind === "jurisdiction-dependent-guidance") {
      const legalSource = claim.sourceIds.some((sourceId) => {
        const kind = sourceById.get(sourceId)?.kind;
        return kind === "law-regulation" || kind === "regulatory-guidance";
      });
      if (!legalSource
        || !/(?:jurisdiction|not legal advice|法域|法律意见)/iu.test(
          claim.boundary,
        )) {
        errors.push(`${claim.id}: jurisdiction guidance needs a primary legal/regulatory source and explicit boundary.`);
      }
    }
    const xSources = claim.sourceIds.filter(
      (sourceId) => sourceById.get(sourceId)?.kind === "x-post",
    );
    if (xSources.length && claim.support === "direct") {
      errors.push(`${claim.id}: an X field signal cannot directly prove a course claim.`);
    }
  }
  const captionClaim = AGENTIC_VIDEO_EDITING_CLAIMS.find(
    (claim) => claim.id === "m7-caption-requirement",
  );
  if (!captionClaim?.sourceIds.includes("wcag-2-2-captions")) {
    errors.push("Caption standard claim must cite WCAG, not FFmpeg alone.");
  }
  const c2paClaim = AGENTIC_VIDEO_EDITING_CLAIMS.find(
    (claim) => claim.id === "m2-c2pa-provenance-not-truth",
  );
  if (!c2paClaim?.boundary.toLowerCase().includes("truth")) {
    errors.push("C2PA claim must deny truth/rights/consent inference.");
  }
  return errors;
}

function normalizeQuestion(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim();
}

function wordSimilarity(left: string, right: string): number {
  const leftWords = new Set(normalizeQuestion(left).split(/\s+/u).filter(Boolean));
  const rightWords = new Set(normalizeQuestion(right).split(/\s+/u).filter(Boolean));
  const union = new Set([...leftWords, ...rightWords]);
  if (!union.size) return 1;
  let intersection = 0;
  for (const word of leftWords) if (rightWords.has(word)) intersection += 1;
  return intersection / union.size;
}

function validatePractice(
  locale: "en" | "zh-Hans",
  slug: AgenticVideoEditingModuleSlug,
  practice: AgenticVideoEditingPracticeCopy,
  expectedMinutes: number,
  expectedTrack: "core" | "builder-extension",
): string[] {
  const errors: string[] = [];
  const moduleRecord = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.find(
    (candidate) => candidate.slug === slug,
  )!;
  if (practice.artifactContractId !== moduleRecord.artifactContractId) {
    errors.push(`${locale}/${slug}/${expectedTrack}: practice contract differs from the manifest.`);
  }
  if (practice.estimatedMinutes !== expectedMinutes) {
    errors.push(`${locale}/${slug}/${expectedTrack}: expected ${expectedMinutes} practice minutes.`);
  }
  if (!same(
    practice.requiredDependencySlugs,
    moduleRecord.requiredArtifactSlugs,
  )) {
    errors.push(`${locale}/${slug}/${expectedTrack}: practice dependencies differ from the module artifact DAG.`);
  }
  if (practice.steps.length < 3 || practice.acceptanceChecks.length < 3) {
    errors.push(`${locale}/${slug}/${expectedTrack}: practice needs executable steps and at least three acceptance checks.`);
  }
  const contract = AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS.find(
    (candidate) => candidate.id === practice.artifactContractId,
  );
  if (!contract) {
    errors.push(`${locale}/${slug}/${expectedTrack}: missing artifact registry contract.`);
  } else {
    if (practice.artifactFilename !== contract.filename) {
      errors.push(`${locale}/${slug}/${expectedTrack}: canonical filename must be ${contract.filename}.`);
    }
    const parsed = canonicalizeArtifactContent(
      practice.starter,
      contract.id,
    );
    if (!parsed.parsedContent || !parsed.canonicalText) {
      errors.push(`${locale}/${slug}/${expectedTrack}: starter does not parse as ${contract.format}.`);
    } else if (
      (parsed.parsedContent as { schemaVersion?: unknown }).schemaVersion
        !== contract.schemaId
    ) {
      errors.push(`${locale}/${slug}/${expectedTrack}: starter schemaVersion differs from ${contract.schemaId}.`);
    }
  }
  if (!practice.workedExample.trim()
    || /(?:lorem ipsum|three lines|TODO(?:\W|$))/iu.test(practice.workedExample)) {
    errors.push(`${locale}/${slug}/${expectedTrack}: worked example is empty or placeholder text.`);
  }
  return errors;
}

function validateCopy(
  locale: "en" | "zh-Hans",
  copy: AgenticVideoEditingCourseCopy,
): string[] {
  const errors: string[] = [];
  const sourceIds = new Set<string>(
    AGENTIC_VIDEO_EDITING_SOURCES.map((source) => source.id),
  );
  const claimIds = new Set<string>(
    AGENTIC_VIDEO_EDITING_CLAIMS.map((claim) => claim.id),
  );
  const moduleSlugs = Object.keys(copy.modules);
  if (!same(moduleSlugs, AGENTIC_VIDEO_EDITING_MODULE_SLUGS)) {
    errors.push(`${locale}: copy must cover every canonical route slug exactly once in canonical learning order.`);
  }
  if (!/(?:beginner|初学者)/iu.test(copy.meta.level)
    || !/(?:intermediate|中级)/iu.test(copy.meta.level)) {
    errors.push(`${locale}: meta level must identify an intermediate production-systems course with a beginner readiness primer.`);
  }
  if (!/(?:750)/u.test(copy.meta.duration)
    || !/(?:180)/u.test(copy.meta.duration)
    || !/(?:240)/u.test(copy.meta.duration)) {
    errors.push(`${locale}: visible duration must disclose core, builder, and capstone workloads.`);
  }
  if (!/(?:no coding|无需编码)/iu.test(copy.meta.prerequisite)
    || !/(?:CLI)/u.test(copy.meta.prerequisite)
    || !/(?:React|TypeScript)/u.test(copy.meta.prerequisite)) {
    errors.push(`${locale}: prerequisites must distinguish no-code core, CLI/JSON/FFmpeg builder, and React/TypeScript Remotion extension.`);
  }
  const referencedClaims = new Set<string>();
  for (const moduleRecord of AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules) {
    const moduleCopy = copy.modules[moduleRecord.slug];
    if (!moduleCopy) continue;
    const conceptIds = moduleCopy.concepts.map((concept) => concept.id);
    if (duplicates(conceptIds).length) {
      errors.push(`${locale}/${moduleRecord.slug}: concept IDs must be unique.`);
    }
    for (const concept of moduleCopy.concepts) {
      if (!concept.id.trim() || !concept.term.trim()
        || !concept.definition.trim()
        || !["core", "builder-extension"].includes(concept.track)) {
        errors.push(`${locale}/${moduleRecord.slug}: every concept needs ID, term, definition, and track.`);
      }
    }
    for (const [sectionIndex, section] of moduleCopy.sections.entries()) {
      const sectionSourceIds = new Set(
        [
          ...section.paragraphs,
          ...(section.bullets ?? []),
        ].flatMap((paragraph) => paragraph.sourceIds),
      );
      if (!section.claimIds?.length) {
        errors.push(`${locale}/${moduleRecord.slug}/section-${sectionIndex + 1}: claimIds are required.`);
      }
      for (const claimId of section.claimIds ?? []) {
        referencedClaims.add(claimId);
        if (!claimIds.has(claimId)) {
          errors.push(`${locale}/${moduleRecord.slug}: unknown claim ${claimId}.`);
          continue;
        }
        const registryClaim = AGENTIC_VIDEO_EDITING_CLAIMS.find(
          (claim) => claim.id === claimId,
        );
        if (registryClaim?.support === "direct"
          && registryClaim.sourceIds.length
          && !registryClaim.sourceIds.some(
            (registrySourceId) => sectionSourceIds.has(registrySourceId),
          )) {
          errors.push(`${locale}/${moduleRecord.slug}/section-${sectionIndex + 1}: direct claim ${claimId} has no source overlap with this section's paragraph evidence surface.`);
        }
      }
      for (const claim of [
        ...section.paragraphs,
        ...(section.bullets ?? []),
      ]) {
        if (!claim.text.trim()) {
          errors.push(`${locale}/${moduleRecord.slug}: empty teaching claim.`);
        }
        for (const sourceId of claim.sourceIds) {
          if (!sourceIds.has(sourceId)) {
            errors.push(`${locale}/${moduleRecord.slug}: unknown paragraph source ${sourceId}.`);
          }
          if (!(moduleRecord.sourceIds as readonly string[]).includes(sourceId)) {
            errors.push(`${locale}/${moduleRecord.slug}: paragraph source ${sourceId} is outside the module source contract.`);
          }
        }
        if ((claim.evidenceMode === "source-grounded"
          || claim.evidenceMode === "official-standard")
          && claim.sourceIds.length === 0) {
          errors.push(`${locale}/${moduleRecord.slug}: source-grounded paragraph has no source.`);
        }
      }
    }
    errors.push(...validatePractice(
      locale,
      moduleRecord.slug,
      moduleCopy.corePractice,
      moduleRecord.practiceMinutes,
      "core",
    ));
    if (!moduleCopy.productionPractice) {
      errors.push(`${locale}/${moduleRecord.slug}: builder extension practice is missing.`);
    } else {
      errors.push(...validatePractice(
        locale,
        moduleRecord.slug,
        moduleCopy.productionPractice,
        moduleRecord.extensionMinutes,
        "builder-extension",
      ));
    }
    const checkpoint = moduleCopy.checkpoint;
    const checkpointBlueprint = COURSE20_CHECKPOINT_BLUEPRINTS[
      moduleRecord.slug
    ];
    if (checkpoint.options.length !== 4
      || checkpoint.correctOptionId.length === 0
      || !checkpoint.options.some(
        (option) => option.id === checkpoint.correctOptionId,
      )
      || duplicates(checkpoint.options.map((option) => option.id)).length
      || duplicates(checkpoint.options.map((option) => option.label)).length
      || checkpoint.options.some((option) => !option.feedback.trim())) {
      errors.push(`${locale}/${moduleRecord.slug}: checkpoint needs four unique option IDs/labels, feedback, and one stable correct ID.`);
    }
    if (!same(
      checkpoint.options.map((option) => option.id),
      checkpointBlueprint.optionIds,
    ) || checkpoint.correctOptionId !== checkpointBlueprint.correctOptionId) {
      errors.push(`${locale}/${moduleRecord.slug}: checkpoint semantic IDs differ from ${COURSE20_ASSESSMENT_CONTRACT_VERSION}.`);
    }
    const approvedCheckpointFingerprint =
      COURSE20_APPROVED_EDITORIAL_FINGERPRINTS.checkpoints[locale][
        moduleRecord.slug
      ];
    if (fingerprintCourse20QuestionCopy(checkpoint)
      !== approvedCheckpointFingerprint) {
      errors.push(`${locale}/${moduleRecord.slug}: checkpoint question, explanation, ordered labels, or feedback drifted from the reviewed editorial fingerprint.`);
    }
  }
  for (const claimId of claimIds) {
    if (!referencedClaims.has(claimId)) {
      errors.push(`${locale}: claim registry entry is not referenced by any section: ${claimId}.`);
    }
  }
  const questions = copy.finalAssessment.questions;
  if (questions.length !== 10 || copy.finalAssessment.passPercent !== 80) {
    errors.push(`${locale}: final assessment needs ten questions and an 80% threshold.`);
  }
  const allQuestionTexts = questions.map((question) => normalizeQuestion(question.question));
  if (duplicates(allQuestionTexts).length) {
    errors.push(`${locale}: final question text must be unique.`);
  }
  const allOptionLabels = questions.flatMap(
    (question) => question.options.map((option) => normalizeQuestion(option.label)),
  );
  if (duplicates(allOptionLabels).length) {
    errors.push(`${locale}: final option labels must be unique across the assessment.`);
  }
  for (const [index, question] of questions.entries()) {
    const moduleRecord = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules[index];
    const checkpoint = copy.modules[question.moduleSlug]?.checkpoint;
    const questionBlueprint = COURSE20_FINAL_ASSESSMENT_BLUEPRINTS[
      question.id as keyof typeof COURSE20_FINAL_ASSESSMENT_BLUEPRINTS
    ];
    if (!moduleRecord
      || question.id !== moduleRecord.finalQuestionId
      || question.moduleSlug !== moduleRecord.slug) {
      errors.push(`${locale}/q${index + 1}: final question must map one-to-one to the canonical module slug.`);
    }
    if (!questionBlueprint
      || question.moduleSlug !== questionBlueprint.moduleSlug
      || question.objectiveId !== questionBlueprint.objectiveId
      || question.correctOptionId !== questionBlueprint.correctOptionId
      || question.critical !== questionBlueprint.critical
      || question.criticalControlId !== (
        "criticalControlId" in questionBlueprint
          ? questionBlueprint.criticalControlId
          : undefined
      )
      || !same(question.sourceIds, questionBlueprint.sourceIds)
      || !same(
        question.options.map((option) => option.id),
        questionBlueprint.optionIds,
      )) {
      errors.push(`${locale}/${question.id}: final assessment semantics differ from ${COURSE20_ASSESSMENT_CONTRACT_VERSION}.`);
    }
    const approvedFinalFingerprint = (
      COURSE20_APPROVED_EDITORIAL_FINGERPRINTS.final[locale] as
        Readonly<Record<string, string>>
    )[question.id];
    if (!approvedFinalFingerprint
      || fingerprintCourse20QuestionCopy(question)
        !== approvedFinalFingerprint) {
      errors.push(`${locale}/${question.id}: question, explanation, ordered labels, or feedback drifted from the reviewed editorial fingerprint.`);
    }
    if (question.options.length !== 4
      || !question.options.some(
        (option) => option.id === question.correctOptionId,
      )
      || duplicates(question.options.map((option) => option.id)).length
      || question.options.some((option) => !option.feedback.trim())) {
      errors.push(`${locale}/${question.id}: four unique options, feedback, and a stable answer ID are required.`);
    }
    if (checkpoint
      && (normalizeQuestion(question.question)
          === normalizeQuestion(checkpoint.question)
        || wordSimilarity(question.question, checkpoint.question) > 0.82)) {
      errors.push(`${locale}/${question.id}: final scenario repeats its module checkpoint.`);
    }
  }
  const criticalIds = questions.flatMap((question) => (
    question.criticalControlId ? [question.criticalControlId] : []
  ));
  if (!same(criticalIds, AGENTIC_VIDEO_EDITING_CRITICAL_CONTROL_IDS)
    || questions.some(
      (question) => question.critical !== Boolean(question.criticalControlId),
    )) {
    errors.push(`${locale}: critical controls must use the four stable control IDs.`);
  }
  const capstoneIds = copy.capstone.production.criteria.map(
    (criterion) => criterion.id,
  );
  if (!same(capstoneIds, AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_IDS)
    || !same(
      copy.capstone.audit.criteria.map((criterion) => criterion.id),
      AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_IDS,
    )) {
    errors.push(`${locale}: materialized capstone must expose the twelve stable artifacts as one contract.`);
  }
  if (!/(?:do-not-publish|不发布)/iu.test(
    copy.capstone.production.completionStatement,
  )) {
    errors.push(`${locale}: capstone must state that do-not-publish is a valid result.`);
  }
  return errors;
}

function validateBilingualParity(): string[] {
  const errors: string[] = [];
  for (const slug of AGENTIC_VIDEO_EDITING_MODULE_SLUGS) {
    const en = AGENTIC_VIDEO_EDITING_EN_COPY.modules[slug];
    const zh = AGENTIC_VIDEO_EDITING_ZH_HANS_COPY.modules[slug];
    if (!same(
      en.concepts.map((concept) => [concept.id, concept.track]),
      zh.concepts.map((concept) => [concept.id, concept.track]),
    )) {
      errors.push(`${slug}: bilingual concept IDs/tracks differ.`);
    }
    if (!same(
      en.sections.map((section) => section.claimIds),
      zh.sections.map((section) => section.claimIds),
    )) {
      errors.push(`${slug}: bilingual section claim IDs differ.`);
    }
    if (en.corePractice.artifactContractId
        !== zh.corePractice.artifactContractId
      || !same(
        en.corePractice.requiredDependencySlugs,
        zh.corePractice.requiredDependencySlugs,
      )) {
      errors.push(`${slug}: bilingual practice artifact/dependency contract differs.`);
    }
    if (en.checkpoint.correctOptionId !== zh.checkpoint.correctOptionId
      || !same(
        en.checkpoint.options.map((option) => option.id),
        zh.checkpoint.options.map((option) => option.id),
      )) {
      errors.push(`${slug}: bilingual checkpoint answer contract differs.`);
    }
  }
  for (const [index, en] of AGENTIC_VIDEO_EDITING_EN_COPY.finalAssessment.questions.entries()) {
    const zh = AGENTIC_VIDEO_EDITING_ZH_HANS_COPY.finalAssessment.questions[index];
    if (!zh
      || en.id !== zh.id
      || en.moduleSlug !== zh.moduleSlug
      || en.correctOptionId !== zh.correctOptionId
      || en.criticalControlId !== zh.criticalControlId
      || !same(
        en.options.map((option) => option.id),
        zh.options.map((option) => option.id),
      )) {
      errors.push(`assessment-${index + 1}: bilingual final-assessment semantics differ.`);
    }
  }
  if (!same(
    AGENTIC_VIDEO_EDITING_EN_COPY.capstone.production.criteria.map(
      (criterion) => criterion.id,
    ),
    AGENTIC_VIDEO_EDITING_ZH_HANS_COPY.capstone.production.criteria.map(
      (criterion) => criterion.id,
    ),
  )) {
    errors.push("Bilingual capstone artifact IDs differ.");
  }
  if (!same(
    Object.keys(AGENTIC_VIDEO_EDITING_EN_COPY.ui).sort(),
    Object.keys(AGENTIC_VIDEO_EDITING_ZH_HANS_COPY.ui).sort(),
  )) {
    errors.push("English and Simplified Chinese UI keys must match.");
  }
  return errors;
}

function validateOutcomeCoverage(): string[] {
  const errors: string[] = [];
  if (AGENTIC_VIDEO_EDITING_OUTCOME_COVERAGE.length !== 8) {
    errors.push("All eight learning outcomes need explicit coverage.");
  }
  for (const [index, coverage] of AGENTIC_VIDEO_EDITING_OUTCOME_COVERAGE.entries()) {
    if (coverage.outcomeIndex !== index
      || !coverage.moduleSlugs.length
      || !coverage.artifactContractIds.length
      || !coverage.finalQuestionIds.length
      || !coverage.capstoneCriterionIds.length) {
      errors.push(`Outcome ${index + 1}: incomplete module/artifact/assessment/capstone mapping.`);
    }
  }
  const coveredArtifacts = new Set(
    AGENTIC_VIDEO_EDITING_OUTCOME_COVERAGE.flatMap(
      (coverage) => coverage.artifactContractIds,
    ),
  );
  for (const artifactId of AGENTIC_VIDEO_EDITING_ARTIFACT_IDS) {
    if (!coveredArtifacts.has(artifactId)) {
      errors.push(`Outcome coverage omits ${artifactId}.`);
    }
  }
  return errors;
}

export function validateAgenticVideoEditingCourse(): string[] {
  const errors = [
    ...validateManifest(),
    ...validateSources(AGENTIC_VIDEO_EDITING_SOURCES),
    ...validateClaimRegistry(),
    ...validateCopy("en", AGENTIC_VIDEO_EDITING_EN_COPY),
    ...validateCopy("zh-Hans", AGENTIC_VIDEO_EDITING_ZH_HANS_COPY),
    ...validateBilingualParity(),
    ...validateOutcomeCoverage(),
  ];
  const forbiddenGlobalClaims = [
    /C2PA (?:proves|guarantees) (?:truth|rights|consent)/iu,
    /all social platforms? (?:use|require)/iu,
    /EU AI Act.*(?:global|worldwide requirement)/iu,
  ];
  for (const text of allStrings([
    AGENTIC_VIDEO_EDITING_EN_COPY,
    AGENTIC_VIDEO_EDITING_ZH_HANS_COPY,
  ])) {
    for (const pattern of forbiddenGlobalClaims) {
      if (pattern.test(text)) {
        errors.push(`Unsupported global claim matched ${pattern.source}.`);
      }
    }
  }
  return [...new Set(errors)];
}

export const AGENTIC_VIDEO_EDITING_CLAIM_COUNT = {
  en: claimList(AGENTIC_VIDEO_EDITING_EN_COPY).length,
  "zh-Hans": claimList(AGENTIC_VIDEO_EDITING_ZH_HANS_COPY).length,
  registry: AGENTIC_VIDEO_EDITING_CLAIMS.length,
} as const;
