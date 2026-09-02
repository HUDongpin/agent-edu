import {
  COURSE_KIT_CAPSTONE_SCHEMA_VERSION,
  COURSE_KIT_COPY_SCHEMA_VERSION,
  COURSE_KIT_COURSE_NUMBERS,
  COURSE_KIT_MANIFEST_SCHEMA_VERSION,
  COURSE_KIT_QUIZ_SCHEMA_VERSION,
  COURSE_KIT_REVIEWED_LOCALES,
  COURSE_KIT_SCHEMA_VERSION,
  COURSE_KIT_SOURCE_SCHEMA_VERSION,
  type CourseKitDefinition,
} from "./types";

export interface CourseKitValidationIssue {
  readonly path: string;
  readonly message: string;
}

const SAFE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const VERSION_TOKEN = /^(?=.*\d)[0-9A-Za-z][0-9A-Za-z._-]*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const PLACEHOLDER = /\b(?:todo|tbd|placeholder|lorem ipsum|coming soon)\b|\[insert[^\]]*\]/i;

function unique(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

function validDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
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
    issues.push({ path: "manifest.displayNumber", message: "This independent course kit is reserved for Courses 16–17." });
  }
  if (
    manifest.reviewedLocales.length !== COURSE_KIT_REVIEWED_LOCALES.length ||
    !manifest.reviewedLocales.every(
      (locale, index) => locale === COURSE_KIT_REVIEWED_LOCALES[index],
    )
  ) {
    issues.push({
      path: "manifest.reviewedLocales",
      message: "Reviewed locales must be exactly en and zh-Hans, in that order.",
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
    if (!validDate(source.accessedOn)) {
      issues.push({ path: `${path}.accessedOn`, message: "Use a real ISO access date." });
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
  const expectedDrawCount = 12;
  const expectedPassCount = 10;
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
    if (!["source-grounded", "instructional-synthesis", "version-watch"].includes(question.evidenceMode)) {
      issues.push({
        path: `quiz.questions[${index}].evidenceMode`,
        message: "Use a declared evidence relationship for every quiz question.",
      });
    }
  });

  if (!VERSION_TOKEN.test(capstone.version)) {
    issues.push({ path: "capstone.version", message: "Use a stable capstone version token containing a digit." });
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
    if (!["source-grounded", "instructional-synthesis", "version-watch"].includes(artifact.evidenceMode)) {
      issues.push({
        path: `capstone.artifacts[${index}].evidenceMode`,
        message: "Use a declared evidence relationship for every capstone artifact.",
      });
    }
  });

  for (const locale of COURSE_KIT_REVIEWED_LOCALES) {
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
          message: "Reviewed checkpoint editions must identify the same option position.",
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
    issues.push({ path: "copy", message: "Reviewed locale UI keys must stay in parity." });
  }
  if (!sameKeys(copy.en.modules, copy["zh-Hans"].modules)) {
    issues.push({ path: "copy", message: "Reviewed locale module keys must stay in parity." });
  }
  if (!sameKeys(copy.en.quiz.questions, copy["zh-Hans"].quiz.questions)) {
    issues.push({ path: "copy", message: "Reviewed locale quiz keys must stay in parity." });
  }
  if (!sameKeys(copy.en.capstone.artifacts, copy["zh-Hans"].capstone.artifacts)) {
    issues.push({ path: "copy", message: "Reviewed locale capstone keys must stay in parity." });
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
