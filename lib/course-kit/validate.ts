import {
  COURSE_KIT_CAPSTONE_SCHEMA_VERSION,
  COURSE_KIT_COPY_SCHEMA_VERSION,
  COURSE_KIT_COURSE_NUMBERS,
  COURSE_KIT_MANIFEST_SCHEMA_VERSION,
  COURSE_KIT_QUIZ_SCHEMA_VERSION,
  COURSE_KIT_CONTENT_LOCALES,
  COURSE_KIT_SCHEMA_VERSION,
  COURSE_KIT_SOURCE_SCHEMA_VERSION,
  type CourseKitDefinition,
} from "./types";
import {
  RESPONSIBLE_AI_CRITERION_IDS,
  RESPONSIBLE_AI_CROSS_COURSE_RUBRIC_EN,
  RESPONSIBLE_AI_CROSS_COURSE_RUBRIC_ZH_HANS,
  RESPONSIBLE_AI_RUBRIC_VERSION,
} from "./responsible-ai-rubric";
import { validateCourseKitQuizForms } from "./quiz";

export interface CourseKitValidationIssue {
  readonly path: string;
  readonly message: string;
}

const SAFE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const VERSION_TOKEN = /^(?=.*\d)[0-9A-Za-z][0-9A-Za-z._-]*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const PLACEHOLDER = /\b(?:todo|tbd|placeholder|lorem ipsum|coming soon)\b|\[insert[^\]]*\]/i;
const EARLY_CRITICAL_CATEGORIES = ["safety", "provenance"] as const;
const ADVANCED_CRITICAL_CATEGORIES = [
  "leakage",
  "human-authority",
  "rollback",
  "reproducibility",
] as const;
const V2_SOURCE_KINDS = [
  "research",
  "official-documentation",
  "open-standard",
  "legal-policy",
  "repository",
  "community-issue",
] as const;
const V2_SOURCE_STABILITIES = [
  "immutable",
  "version-pinned",
  "current-documentation",
  "historical-snapshot",
] as const;

function unique(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

function validDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function validTimestamp(value: string): boolean {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf())
    && /T/.test(value)
    && /(?:Z|[+-]\d{2}:\d{2})$/.test(value);
}

function isDeepLearningV2(definition: CourseKitDefinition): boolean {
  return definition.manifest.id === "deep-learning"
    && /(?:^|[-.])v2$/.test(definition.manifest.version);
}

function validHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function sameKeys(left: object, right: object): boolean {
  const a = Object.keys(left).sort();
  const b = Object.keys(right).sort();
  return a.length === b.length && a.every((key, index) => key === b[index]);
}

function findPlaceholders(
  value: unknown,
  path: string,
  issues: CourseKitValidationIssue[],
): void {
  if (typeof value === "string") {
    if (!value.trim()) issues.push({ path, message: "Text must not be empty." });
    if (PLACEHOLDER.test(value)) {
      issues.push({ path, message: "Placeholder text is not publishable." });
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      findPlaceholders(item, `${path}[${index}]`, issues),
    );
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      findPlaceholders(item, `${path}.${key}`, issues);
    }
  }
}

function requireReferences(
  ids: readonly string[],
  availableIds: ReadonlySet<string>,
  path: string,
  issues: CourseKitValidationIssue[],
): void {
  if (!ids.length) issues.push({ path, message: "At least one source is required." });
  if (!unique(ids)) issues.push({ path, message: "Source IDs must be unique." });
  for (const id of ids) {
    if (!availableIds.has(id)) {
      issues.push({ path, message: `Unknown source ID: ${id}.` });
    }
  }
}

export function validateCourseKitDefinition(
  definition: CourseKitDefinition,
): readonly CourseKitValidationIssue[] {
  const issues: CourseKitValidationIssue[] = [];
  const { manifest, sources, copy, quiz, capstone } = definition;

  if (definition.schemaVersion !== COURSE_KIT_SCHEMA_VERSION) {
    issues.push({ path: "schemaVersion", message: "Unsupported course-kit schema." });
  }
  if (manifest.schemaVersion !== COURSE_KIT_MANIFEST_SCHEMA_VERSION) {
    issues.push({ path: "manifest.schemaVersion", message: "Unsupported manifest schema." });
  }
  if (quiz.schemaVersion !== COURSE_KIT_QUIZ_SCHEMA_VERSION) {
    issues.push({ path: "quiz.schemaVersion", message: "Unsupported quiz schema." });
  }
  if (capstone.schemaVersion !== COURSE_KIT_CAPSTONE_SCHEMA_VERSION) {
    issues.push({ path: "capstone.schemaVersion", message: "Unsupported capstone schema." });
  }
  if (!SAFE_ID.test(manifest.id)) {
    issues.push({ path: "manifest.id", message: "Use a lowercase kebab-case course ID." });
  }
  if (!VERSION_TOKEN.test(manifest.version)) {
    issues.push({ path: "manifest.version", message: "Use a stable version token containing a digit." });
  }
  if (!validDate(manifest.publishedOn)) {
    issues.push({ path: "manifest.publishedOn", message: "Use a real ISO date (YYYY-MM-DD)." });
  }
  if (!COURSE_KIT_COURSE_NUMBERS.includes(manifest.displayNumber)) {
    issues.push({ path: "manifest.displayNumber", message: "Course kit is reserved for Courses 16–21." });
  }
  if (
    manifest.contentLocales.length !== COURSE_KIT_CONTENT_LOCALES.length ||
    !manifest.contentLocales.every(
      (locale, index) => locale === COURSE_KIT_CONTENT_LOCALES[index],
    )
  ) {
    issues.push({
      path: "manifest.contentLocales",
      message: "Complete content locales must be exactly en and zh-Hans, in that order.",
    });
  }
  if (manifest.fallbackLocale !== "en") {
    issues.push({ path: "manifest.fallbackLocale", message: "The fallback locale must be en." });
  }

  const expectedModules = manifest.milestoneCount - 2;
  if (manifest.modules.length !== expectedModules) {
    issues.push({
      path: "manifest.modules",
      message: `${manifest.milestoneCount} milestones require exactly ${expectedModules} modules, one quiz, and one capstone.`,
    });
  }
  if (!manifest.modules.length) {
    issues.push({ path: "manifest.modules", message: "A course requires modules." });
  }
  if (!manifest.phases.length) {
    issues.push({ path: "manifest.phases", message: "A course requires phases." });
  }

  const moduleSlugs = manifest.modules.map((module) => module.slug);
  const phaseIds = manifest.phases.map((phase) => phase.id);
  const deepLearningV2 = isDeepLearningV2(definition);
  if (!unique(moduleSlugs)) {
    issues.push({ path: "manifest.modules", message: "Module slugs must be unique." });
  }
  if (!unique(phaseIds)) {
    issues.push({ path: "manifest.phases", message: "Phase IDs must be unique." });
  }

  manifest.modules.forEach((module, index) => {
    const path = `manifest.modules[${index}]`;
    if (!SAFE_ID.test(module.slug)) {
      issues.push({ path: `${path}.slug`, message: "Use a lowercase kebab-case module slug." });
    }
    if (module.order !== index + 1) {
      issues.push({ path: `${path}.order`, message: "Module order must be sequential from 1." });
    }
    if (!phaseIds.includes(module.phaseId)) {
      issues.push({ path: `${path}.phaseId`, message: `Unknown phase ID: ${module.phaseId}.` });
    }
    if (!Number.isInteger(module.minutes) || module.minutes < 1) {
      issues.push({ path: `${path}.minutes`, message: "Minutes must be a positive integer." });
    }
    const contractValues = [
      module.prerequisiteModuleSlugs,
      module.producesArtifactIds,
      module.consumesArtifactIds,
      module.artifactSchemaId,
      module.validatorId,
      module.validatorCommand,
      module.completionMode,
    ];
    const hasAnyContractField = contractValues.some((value) => value !== undefined);
    const hasCompleteContract = contractValues.every((value) => value !== undefined);
    if (hasAnyContractField && !hasCompleteContract) {
      issues.push({
        path,
        message: "A module evidence contract must declare all seven DAG, artifact, validator, and completion fields.",
      });
    }
    if (deepLearningV2 && !hasCompleteContract) {
      issues.push({
        path,
        message: "Deep Learning v2 requires an explicit module evidence contract.",
      });
    }
    if (!hasCompleteContract) return;
    if (!unique(module.prerequisiteModuleSlugs!)) {
      issues.push({ path: `${path}.prerequisiteModuleSlugs`, message: "Prerequisite module slugs must be unique." });
    }
    for (const prerequisite of module.prerequisiteModuleSlugs!) {
      const prerequisiteIndex = moduleSlugs.indexOf(prerequisite);
      if (prerequisiteIndex < 0) {
        issues.push({ path: `${path}.prerequisiteModuleSlugs`, message: `Unknown prerequisite module: ${prerequisite}.` });
      } else if (prerequisiteIndex >= index) {
        issues.push({ path: `${path}.prerequisiteModuleSlugs`, message: `${prerequisite} must precede ${module.slug} in the manifest DAG.` });
      }
    }
    if (!module.producesArtifactIds!.length || !unique(module.producesArtifactIds!)) {
      issues.push({ path: `${path}.producesArtifactIds`, message: "Produced artifact IDs must be a non-empty unique list." });
    }
    if (!unique(module.consumesArtifactIds!)) {
      issues.push({ path: `${path}.consumesArtifactIds`, message: "Consumed artifact IDs must be unique." });
    }
    for (const artifactId of [
      ...module.producesArtifactIds!,
      ...module.consumesArtifactIds!,
    ]) {
      if (!SAFE_ID.test(artifactId)) {
        issues.push({ path, message: `Artifact ID must be lowercase kebab-case: ${artifactId}.` });
      }
    }
    if (!/^aicourse(?:\.[a-z0-9-]+)+\.v\d+$/.test(module.artifactSchemaId!)) {
      issues.push({ path: `${path}.artifactSchemaId`, message: "Use a versioned aicourse artifact schema ID." });
    }
    if (!/^aicourse(?:\.[a-z0-9-]+)+\.v\d+$/.test(module.validatorId!)) {
      issues.push({ path: `${path}.validatorId`, message: "Use a versioned aicourse validator ID." });
    }
    if (!module.validatorCommand!.trim() || /[\r\n]/.test(module.validatorCommand!)) {
      issues.push({ path: `${path}.validatorCommand`, message: "Validator command must be a non-empty single line." });
    }
    if (!["validated-artifact", "self-attested"].includes(module.completionMode!)) {
      issues.push({ path: `${path}.completionMode`, message: "completionMode must be validated-artifact or self-attested." });
    }
    if (deepLearningV2 && module.completionMode !== "validated-artifact") {
      issues.push({ path: `${path}.completionMode`, message: "Deep Learning v2 modules must use validated-artifact completion." });
    }
  });

  const artifactProducer = new Map<string, { readonly slug: string; readonly index: number }>();
  const prerequisitesByModule = new Map(
    manifest.modules.map((module) => [
      module.slug,
      module.prerequisiteModuleSlugs ?? [],
    ] as const),
  );
  const dependsOn = (moduleSlug: string, prerequisiteSlug: string): boolean => {
    const visited = new Set<string>();
    const pending = [...(prerequisitesByModule.get(moduleSlug) ?? [])];
    while (pending.length) {
      const candidate = pending.pop()!;
      if (candidate === prerequisiteSlug) return true;
      if (visited.has(candidate)) continue;
      visited.add(candidate);
      pending.push(...(prerequisitesByModule.get(candidate) ?? []));
    }
    return false;
  };
  manifest.modules.forEach((module, moduleIndex) => {
    for (const artifactId of module.producesArtifactIds ?? []) {
      const existing = artifactProducer.get(artifactId);
      if (existing) {
        issues.push({
          path: `manifest.modules[${moduleIndex}].producesArtifactIds`,
          message: `${artifactId} is already produced by ${existing.slug}.`,
        });
      } else artifactProducer.set(artifactId, { slug: module.slug, index: moduleIndex });
    }
  });
  manifest.modules.forEach((module, moduleIndex) => {
    for (const artifactId of module.consumesArtifactIds ?? []) {
      const producer = artifactProducer.get(artifactId);
      if (!producer) {
        issues.push({
          path: `manifest.modules[${moduleIndex}].consumesArtifactIds`,
          message: `${artifactId} has no manifest producer.`,
        });
      } else if (producer.index >= moduleIndex) {
        issues.push({
          path: `manifest.modules[${moduleIndex}].consumesArtifactIds`,
          message: `${artifactId} is produced by a later module ${producer.slug}.`,
        });
      } else if (!dependsOn(module.slug, producer.slug)) {
        issues.push({
          path: `manifest.modules[${moduleIndex}].consumesArtifactIds`,
          message: `${artifactId} comes from ${producer.slug}, which is not in ${module.slug}'s prerequisite DAG.`,
        });
      }
    }
  });

  const phaseMembership = new Map<string, number>();
  manifest.phases.forEach((phase, index) => {
    const path = `manifest.phases[${index}]`;
    if (!SAFE_ID.test(phase.id)) {
      issues.push({ path: `${path}.id`, message: "Use a lowercase kebab-case phase ID." });
    }
    if (phase.order !== index + 1) {
      issues.push({ path: `${path}.order`, message: "Phase order must be sequential from 1." });
    }
    if (!unique(phase.moduleSlugs)) {
      issues.push({ path: `${path}.moduleSlugs`, message: "A phase cannot repeat a module." });
    }
    for (const moduleSlug of phase.moduleSlugs) {
      phaseMembership.set(moduleSlug, (phaseMembership.get(moduleSlug) ?? 0) + 1);
      const declaredModule = manifest.modules.find(
        (candidate) => candidate.slug === moduleSlug,
      );
      if (!declaredModule) {
        issues.push({ path: `${path}.moduleSlugs`, message: `Unknown module: ${moduleSlug}.` });
      } else if (declaredModule.phaseId !== phase.id) {
        issues.push({
          path: `${path}.moduleSlugs`,
          message: `${moduleSlug} declares phase ${declaredModule.phaseId}, not ${phase.id}.`,
        });
      }
    }
  });
  for (const moduleSlug of moduleSlugs) {
    if (phaseMembership.get(moduleSlug) !== 1) {
      issues.push({
        path: "manifest.phases",
        message: `${moduleSlug} must appear in exactly one phase.`,
      });
    }
  }

  const sourceIds = sources.map((source) => source.id);
  const sourceIdSet = new Set(sourceIds);
  if (!unique(sourceIds)) {
    issues.push({ path: "sources", message: "Source IDs must be unique." });
  }
  if (
    !unique(manifest.sourceIds) ||
    manifest.sourceIds.length !== sourceIds.length ||
    manifest.sourceIds.some((id) => !sourceIdSet.has(id))
  ) {
    issues.push({
      path: "manifest.sourceIds",
      message: "Manifest sourceIds must list every source exactly once.",
    });
  }
  sources.forEach((source, index) => {
    const path = `sources[${index}]`;
    if (source.schemaVersion !== COURSE_KIT_SOURCE_SCHEMA_VERSION) {
      issues.push({ path: `${path}.schemaVersion`, message: "Unsupported source schema." });
    }
    if (!SAFE_ID.test(source.id)) {
      issues.push({ path: `${path}.id`, message: "Use a lowercase kebab-case source ID." });
    }
    if (!validHttpsUrl(source.url)) {
      issues.push({ path: `${path}.url`, message: "A source needs a direct HTTPS URL." });
    }
    if (!source.evidenceUrls.includes(source.url)) {
      issues.push({ path: `${path}.evidenceUrls`, message: "evidenceUrls must include the primary URL." });
    }
    source.evidenceUrls.forEach((url, urlIndex) => {
      if (!validHttpsUrl(url)) {
        issues.push({ path: `${path}.evidenceUrls[${urlIndex}]`, message: "Evidence URLs must use HTTPS." });
      }
    });
    if (!source.accessedAt && !source.accessedOn) {
      issues.push({ path: `${path}.accessedAt`, message: "Record an ISO access timestamp or legacy access date." });
    }
    if (source.accessedAt && !validTimestamp(source.accessedAt)) {
      issues.push({ path: `${path}.accessedAt`, message: "Use a real ISO 8601 timestamp with timezone." });
    }
    if (source.accessedOn && !validDate(source.accessedOn)) {
      issues.push({ path: `${path}.accessedOn`, message: "Use a real ISO access date." });
    }
    if (deepLearningV2 && !source.accessedAt) {
      issues.push({ path: `${path}.accessedAt`, message: "Deep Learning v2 sources require accessedAt." });
    }
    if (deepLearningV2 && !V2_SOURCE_KINDS.includes(source.kind as (typeof V2_SOURCE_KINDS)[number])) {
      issues.push({ path: `${path}.kind`, message: "Deep Learning v2 must use the six canonical source kinds." });
    }
    if (deepLearningV2 && !V2_SOURCE_STABILITIES.includes(source.stability as (typeof V2_SOURCE_STABILITIES)[number])) {
      issues.push({ path: `${path}.stability`, message: "Deep Learning v2 must use the four canonical stability classes." });
    }
    if (source.immutableRef) {
      if (!["versioned-url", "release-tag", "commit-sha", "content-sha256"].includes(source.immutableRef.kind)
        || !source.immutableRef.value.trim()) {
        issues.push({ path: `${path}.immutableRef`, message: "immutableRef needs a supported kind and non-empty value." });
      }
      if (source.immutableRef.url && !validHttpsUrl(source.immutableRef.url)) {
        issues.push({ path: `${path}.immutableRef.url`, message: "immutableRef URL must use HTTPS." });
      }
      if (source.immutableRef.kind === "commit-sha"
        && !/^[a-f0-9]{40}$/.test(source.immutableRef.value)) {
        issues.push({ path: `${path}.immutableRef.value`, message: "A commit-sha immutableRef must be a full 40-character SHA." });
      }
      if (source.immutableRef.kind === "content-sha256"
        && !/^[a-f0-9]{64}$/.test(source.immutableRef.value)) {
        issues.push({ path: `${path}.immutableRef.value`, message: "A content-sha256 immutableRef must be 64 lowercase hex characters." });
      }
    }
    if (deepLearningV2
      && ["immutable", "version-pinned"].includes(source.stability)
      && !source.immutableRef) {
      issues.push({ path: `${path}.immutableRef`, message: "Immutable and version-pinned Deep Learning v2 sources require immutableRef." });
    }
    if (source.publishedOn && !validDate(source.publishedOn)) {
      issues.push({ path: `${path}.publishedOn`, message: "Use a real ISO publication date." });
    }
    if (source.stability === "jurisdiction-and-date-bound" && !source.jurisdiction) {
      issues.push({
        path: `${path}.jurisdiction`,
        message: "Jurisdiction-and-date-bound evidence must name its jurisdiction.",
      });
    }
    if (
      ["version-pinned", "current-documentation"].includes(source.stability)
      && !source.revision
      && !source.publishedOn
    ) {
      issues.push({
        path: `${path}.revision`,
        message: "Unstable technical evidence requires a revision label or publication date.",
      });
    }
    if (!source.conceptDomain.trim()) {
      issues.push({ path: `${path}.conceptDomain`, message: "A concept domain is required." });
    }
    if (!source.transformation.trim()) {
      issues.push({ path: `${path}.transformation`, message: "A transformation record is required." });
    }
    if (!source.rightsBoundary.trim()) {
      issues.push({ path: `${path}.rightsBoundary`, message: "A rights boundary is required." });
    }
    if (source.reuseStatus === "licence-noted-no-copy" && !source.licence?.trim()) {
      issues.push({
        path: `${path}.licence`,
        message: "licence-noted-no-copy evidence must name the reviewed licence.",
      });
    }
  });

  manifest.modules.forEach((module, index) =>
    requireReferences(module.sourceIds, sourceIdSet, `manifest.modules[${index}].sourceIds`, issues),
  );
  quiz.questions.forEach((question, index) =>
    requireReferences(question.sourceIds, sourceIdSet, `quiz.questions[${index}].sourceIds`, issues),
  );
  capstone.artifacts.forEach((artifact, index) =>
    requireReferences(artifact.sourceIds, sourceIdSet, `capstone.artifacts[${index}].sourceIds`, issues),
  );

  if (!VERSION_TOKEN.test(quiz.version)) {
    issues.push({ path: "quiz.version", message: "Use a stable quiz version token containing a digit." });
  }
  const earlyCourse = manifest.displayNumber <= 18;
  const expectedDrawCount = earlyCourse ? 12 : 16;
  const expectedPassCount = earlyCourse ? 10 : 13;
  if (quiz.drawCount !== expectedDrawCount) {
    issues.push({
      path: "quiz.drawCount",
      message: `Course ${manifest.displayNumber} must draw exactly ${expectedDrawCount} questions.`,
    });
  }
  if (quiz.passCount !== expectedPassCount) {
    issues.push({
      path: "quiz.passCount",
      message: `Course ${manifest.displayNumber} must require exactly ${expectedPassCount} correct answers.`,
    });
  }
  if (quiz.questions.length < quiz.drawCount) {
    issues.push({
      path: "quiz.questions",
      message: `The question bank needs at least ${quiz.drawCount} questions.`,
    });
  }
  const expectedBankSize = manifest.modules.length * 3;
  if (quiz.questions.length !== expectedBankSize) {
    issues.push({
      path: "quiz.questions",
      message: `The final bank must contain exactly three questions per module (${expectedBankSize} total).`,
    });
  }
  const criticalQuestionCount = quiz.questions.filter(
    (question) => question.critical === true,
  ).length;
  if (criticalQuestionCount === 0) {
    issues.push({
      path: "quiz.questions",
      message: "Declare at least one critical safety, provenance, authority, rollback, or reproducibility question.",
    });
  }
  if (criticalQuestionCount >= quiz.drawCount) {
    issues.push({
      path: "quiz.questions",
      message: "Critical questions must be fewer than the fixed draw count.",
    });
  }
  const requiredCriticalCategories = earlyCourse
    ? EARLY_CRITICAL_CATEGORIES
    : ADVANCED_CRITICAL_CATEGORIES;
  for (const category of requiredCriticalCategories) {
    if (!quiz.questions.some((question) => question.criticalCategory === category)) {
      issues.push({
        path: "quiz.questions",
        message: `The final bank requires a critical ${category} question.`,
      });
    }
  }
  const questionIds = quiz.questions.map((question) => question.id);
  if (!unique(questionIds)) {
    issues.push({ path: "quiz.questions", message: "Quiz question IDs must be unique." });
  }
  quiz.questions.forEach((question, index) => {
    if (!SAFE_ID.test(question.id)) {
      issues.push({ path: `quiz.questions[${index}].id`, message: "Use a lowercase kebab-case question ID." });
    }
    if (![0, 1, 2, 3].includes(question.correctIndex)) {
      issues.push({ path: `quiz.questions[${index}].correctIndex`, message: "correctIndex must be 0, 1, 2, or 3." });
    }
    if (question.critical === true && !question.criticalCategory) {
      issues.push({
        path: `quiz.questions[${index}].criticalCategory`,
        message: "Every critical question requires a machine-readable category.",
      });
    }
    if (question.criticalCategory && question.critical !== true) {
      issues.push({
        path: `quiz.questions[${index}].critical`,
        message: "A categorized critical question must set critical to true.",
      });
    }
  });
  if (deepLearningV2 && !quiz.forms) {
    issues.push({
      path: "quiz.forms",
      message: "Deep Learning v2 requires three explicit stratified 16-question forms.",
    });
  }
  if (quiz.forms) {
    for (const finding of validateCourseKitQuizForms(
      quiz.questions.map((question) => ({
        id: question.id,
        critical: question.critical === true,
        moduleSlug: question.moduleSlug,
      })),
      quiz.forms,
      quiz.drawCount,
      moduleSlugs,
    )) {
      issues.push({ path: "quiz.forms", message: finding });
    }
  }

  if (!VERSION_TOKEN.test(capstone.version)) {
    issues.push({ path: "capstone.version", message: "Use a stable capstone version token containing a digit." });
  }
  const legacyEvidenceContract = {
    schemaId: `aicourse.${manifest.id}.capstone.v1`,
    schemaPath: `/courses/${manifest.id}/lab/capstone.schema.json`,
    validatorId: `aicourse.${manifest.id}.validator.v1`,
    validatorPath: `/courses/${manifest.id}/lab/validate.py`,
    validatorCommand: `python public/courses/${manifest.id}/lab/validate.py --package <artifact-package.json>`,
  };
  const deepLearningV2EvidenceContract = {
    schemaId: "aicourse.deep-learning.capstone.v2",
    schemaPath: "/courses/deep-learning/lab/capstone.schema.json",
    validatorId: "aicourse.deep-learning.validator.v2",
    validatorPath: "/courses/deep-learning/lab/validate_capstone.py",
    validatorCommand: "python3 public/courses/deep-learning/lab/validate_capstone.py --package <learner-package.json> --receipt-dir <receipt-directory>",
  };
  const expectedEvidenceContract = deepLearningV2
    ? deepLearningV2EvidenceContract
    : legacyEvidenceContract;
  for (const [field, expected] of Object.entries(expectedEvidenceContract)) {
    if (capstone.evidenceContract[field as keyof typeof capstone.evidenceContract] !== expected) {
      issues.push({ path: `capstone.evidenceContract.${field}`, message: `Expected ${expected}.` });
    }
  }
  if (deepLearningV2) {
    const expectedReferenceContract = {
      schemaId: "aicourse.deep-learning.reference-package.v2",
      schemaPath: "/courses/deep-learning/lab/reference.schema.json",
      validatorId: "aicourse.deep-learning.reference-validator.v1",
      validatorPath: "/courses/deep-learning/lab/validate_reference.py",
      validatorCommand: "python3 public/courses/deep-learning/lab/validate_reference.py --package <reference-package.json>",
    };
    if (!capstone.referenceEvidenceContract) {
      issues.push({ path: "capstone.referenceEvidenceContract", message: "Deep Learning v2 requires a separate non-credential reference validator." });
    } else {
      for (const [field, expected] of Object.entries(expectedReferenceContract)) {
        if (capstone.referenceEvidenceContract[field as keyof typeof capstone.referenceEvidenceContract] !== expected) {
          issues.push({ path: `capstone.referenceEvidenceContract.${field}`, message: `Expected ${expected}.` });
        }
      }
    }
  }
  const artifactIds = capstone.artifacts.map((artifact) => artifact.id);
  if (!unique(artifactIds)) {
    issues.push({ path: "capstone.artifacts", message: "Capstone artifact IDs must be unique." });
  }
  capstone.artifacts.forEach((artifact, index) => {
    if (!SAFE_ID.test(artifact.id)) {
      issues.push({ path: `capstone.artifacts[${index}].id`, message: "Use a lowercase kebab-case artifact ID." });
    }
    if (artifact.required !== true) {
      issues.push({ path: `capstone.artifacts[${index}].required`, message: "Every capstone artifact is required." });
    }
  });

  const needsResponsibleAiGate = manifest.displayNumber >= 17;
  if (needsResponsibleAiGate && !capstone.responsibleAiGate) {
    issues.push({
      path: "capstone.responsibleAiGate",
      message: "Courses 17–21 require the versioned Course 16 acceptance mapping.",
    });
  }
  if (!needsResponsibleAiGate && capstone.responsibleAiGate) {
    issues.push({
      path: "capstone.responsibleAiGate",
      message: "Course 16 defines the horizontal rubric and must not self-assert a downstream mapping.",
    });
  }
  if (capstone.responsibleAiGate) {
    const gate = capstone.responsibleAiGate;
    if (gate.version !== RESPONSIBLE_AI_RUBRIC_VERSION) {
      issues.push({
        path: "capstone.responsibleAiGate.version",
        message: `Responsible AI gate must use ${RESPONSIBLE_AI_RUBRIC_VERSION}.`,
      });
    }
    if (
      gate.criteria.length !== RESPONSIBLE_AI_CRITERION_IDS.length ||
      gate.criteria.some(
        (criterion, index) => criterion.id !== RESPONSIBLE_AI_CRITERION_IDS[index],
      )
    ) {
      issues.push({
        path: "capstone.responsibleAiGate.criteria",
        message: "Responsible AI criteria must contain the six canonical IDs in canonical order.",
      });
    }
    gate.criteria.forEach((criterion, index) => {
      if (!criterion.questionIds.length) {
        issues.push({
          path: `capstone.responsibleAiGate.criteria[${index}].questionIds`,
          message: "Each criterion requires at least one final-assessment question.",
        });
      }
      if (!criterion.artifactIds.length) {
        issues.push({
          path: `capstone.responsibleAiGate.criteria[${index}].artifactIds`,
          message: "Each criterion requires at least one capstone artifact.",
        });
      }
      for (const questionId of criterion.questionIds) {
        const question = quiz.questions.find((candidate) => candidate.id === questionId);
        if (!question) {
          issues.push({
            path: `capstone.responsibleAiGate.criteria[${index}].questionIds`,
            message: `Unknown Responsible AI question ID: ${questionId}.`,
          });
        } else if (question.critical !== true) {
          issues.push({
            path: `capstone.responsibleAiGate.criteria[${index}].questionIds`,
            message: `Responsible AI question ${questionId} must be critical.`,
          });
        }
      }
      for (const artifactId of criterion.artifactIds) {
        if (!artifactIds.includes(artifactId)) {
          issues.push({
            path: `capstone.responsibleAiGate.criteria[${index}].artifactIds`,
            message: `Unknown Responsible AI artifact ID: ${artifactId}.`,
          });
        }
      }
    });
  }

  for (const locale of COURSE_KIT_CONTENT_LOCALES) {
    const localeCopy = copy[locale];
    const path = `copy.${locale}`;
    if (localeCopy.schemaVersion !== COURSE_KIT_COPY_SCHEMA_VERSION) {
      issues.push({ path: `${path}.schemaVersion`, message: "Unsupported copy schema." });
    }
    if (localeCopy.locale !== locale) {
      issues.push({ path: `${path}.locale`, message: `Copy locale must be ${locale}.` });
    }
    if (localeCopy.version !== manifest.version) {
      issues.push({ path: `${path}.version`, message: "Copy version must match the course version." });
    }
    if (!sameKeys(localeCopy.modules, Object.fromEntries(moduleSlugs.map((id) => [id, true])))) {
      issues.push({ path: `${path}.modules`, message: "Copy must define exactly the manifest modules." });
    }
    if (!sameKeys(localeCopy.phases, Object.fromEntries(phaseIds.map((id) => [id, true])))) {
      issues.push({ path: `${path}.phases`, message: "Copy must define exactly the manifest phases." });
    }
    if (!sameKeys(localeCopy.sourceAnnotations, Object.fromEntries(sourceIds.map((id) => [id, true])))) {
      issues.push({ path: `${path}.sourceAnnotations`, message: "Copy must annotate every source." });
    }
    if (!sameKeys(localeCopy.quiz.questions, Object.fromEntries(questionIds.map((id) => [id, true])))) {
      issues.push({ path: `${path}.quiz.questions`, message: "Copy must define every quiz question." });
    }
    if (!sameKeys(localeCopy.capstone.artifacts, Object.fromEntries(artifactIds.map((id) => [id, true])))) {
      issues.push({ path: `${path}.capstone.artifacts`, message: "Copy must define every capstone artifact." });
    }
    const expectedRubric = locale === "en"
      ? RESPONSIBLE_AI_CROSS_COURSE_RUBRIC_EN
      : RESPONSIBLE_AI_CROSS_COURSE_RUBRIC_ZH_HANS;
    if (needsResponsibleAiGate) {
      if (
        localeCopy.capstone.responsibleAiRubric.length !== expectedRubric.length ||
        localeCopy.capstone.responsibleAiRubric.some(
          (criterion, index) => criterion !== expectedRubric[index],
        )
      ) {
        issues.push({
          path: `${path}.capstone.responsibleAiRubric`,
          message: "The complete content copy must use the canonical bilingual Responsible AI rubric.",
        });
      }
    } else if (localeCopy.capstone.responsibleAiRubric.length !== 0) {
      issues.push({
        path: `${path}.capstone.responsibleAiRubric`,
        message: "Course 16 defines the rubric in its curriculum; downstream rubric copy starts with Course 17.",
      });
    }
    manifest.modules.forEach((module, moduleIndex) => {
      const moduleCopy = localeCopy.modules[module.slug];
      if (!moduleCopy) return;
      moduleCopy.sections.forEach((section, sectionIndex) =>
        requireReferences(
          section.sourceIds,
          sourceIdSet,
          `${path}.modules.${module.slug}.sections[${sectionIndex}].sourceIds`,
          issues,
        ),
      );
      if (moduleCopy.checkpoint.options.length !== 4) {
        issues.push({
          path: `${path}.modules.${module.slug}.checkpoint.options`,
          message: "A checkpoint must have exactly four options.",
        });
      }
      if (!unique(moduleCopy.checkpoint.options)) {
        issues.push({
          path: `${path}.modules.${module.slug}.checkpoint.options`,
          message: "Checkpoint options must be distinct.",
        });
      }
      if (
        locale === "zh-Hans" &&
        moduleCopy.checkpoint.correctIndex !==
          copy.en.modules[module.slug]?.checkpoint.correctIndex
      ) {
        issues.push({
          path: `${path}.modules.${module.slug}.checkpoint.correctIndex`,
          message: "Content-locale checkpoint editions must identify the same option position.",
        });
      }
      if (moduleIndex + 1 !== module.order) {
        // Already reported at manifest; retained here only to keep the loop useful for copy checks.
      }
    });
    quiz.questions.forEach((question) => {
      if (localeCopy.quiz.questions[question.id]?.options.length !== 4) {
        issues.push({
          path: `${path}.quiz.questions.${question.id}.options`,
          message: "A quiz question must have exactly four options.",
        });
      }
      const options = localeCopy.quiz.questions[question.id]?.options;
      if (options && !unique(options)) {
        issues.push({
          path: `${path}.quiz.questions.${question.id}.options`,
          message: "Quiz options must be distinct.",
        });
      }
    });
  }

  if (!sameKeys(copy.en.ui, copy["zh-Hans"].ui)) {
    issues.push({ path: "copy", message: "Content-locale UI keys must stay in parity." });
  }
  if (!sameKeys(copy.en.modules, copy["zh-Hans"].modules)) {
    issues.push({ path: "copy", message: "Content-locale module keys must stay in parity." });
  }
  if (!sameKeys(copy.en.quiz.questions, copy["zh-Hans"].quiz.questions)) {
    issues.push({ path: "copy", message: "Content-locale quiz keys must stay in parity." });
  }
  if (!sameKeys(copy.en.capstone.artifacts, copy["zh-Hans"].capstone.artifacts)) {
    issues.push({ path: "copy", message: "Content-locale capstone keys must stay in parity." });
  }

  findPlaceholders(definition, "course", issues);
  return issues;
}

export function assertValidCourseKitDefinition(
  definition: CourseKitDefinition,
): void {
  const issues = validateCourseKitDefinition(definition);
  if (!issues.length) return;
  const detail = issues.map((issue) => `- ${issue.path}: ${issue.message}`).join("\n");
  throw new Error(`Invalid Course Kit definition:\n${detail}`);
}

/** Preserve literal IDs and fail at module evaluation if the definition is incomplete. */
export function defineCourseKit<
  const Definition extends CourseKitDefinition,
>(definition: Definition): Definition {
  assertValidCourseKitDefinition(definition);
  return definition;
}
