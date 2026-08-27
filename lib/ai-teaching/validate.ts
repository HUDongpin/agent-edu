import { AGENTIC_TEACHING_COPY_EN } from "./copy/en";
import {
  AGENTIC_TEACHING_FINAL_QUIZ_CONTRACT,
  agenticTeachingOptionLabelsFingerprint,
  getAgenticTeachingArtifactRubric,
  getAgenticTeachingCheckpointContract,
} from "./contracts";
import { AGENTIC_TEACHING_COURSE_MANIFEST, AGENTIC_TEACHING_TOTAL_MINUTES } from "./manifest";
import {
  AGENTIC_TEACHING_PROGRESS_SCHEMA,
  AGENTIC_TEACHING_QUIZ_QUESTION_COUNT,
  AGENTIC_TEACHING_QUIZ_REQUIRED_CORRECT,
} from "./progress";
import { AGENTIC_TEACHING_SOURCES } from "./sources";
import {
  AGENTIC_TEACHING_MODULE_SLUGS,
  type AgenticTeachingContentLocale,
  type AgenticTeachingCourseCopy,
  type AgenticTeachingCourseManifest,
  type AgenticTeachingSource,
} from "./types";

const DATE = /^\d{4}-\d{2}(?:-\d{2})?$/;

const sameStrings = (left: readonly string[], right: readonly string[]) =>
  JSON.stringify(left) === JSON.stringify(right);

function validateCopy(
  label: AgenticTeachingContentLocale,
  copy: AgenticTeachingCourseCopy,
  errors: string[],
): void {
  const sourceIds = new Set(AGENTIC_TEACHING_SOURCES.map((source) => source.id));
  const manifests = new Map(
    AGENTIC_TEACHING_COURSE_MANIFEST.modules.map((module) => [module.slug, module]),
  );

  for (const slug of AGENTIC_TEACHING_MODULE_SLUGS) {
    const courseModule = copy.modules[slug];
    const manifest = manifests.get(slug);
    if (!courseModule || !manifest) {
      errors.push(`${label}: missing module ${slug}`);
      continue;
    }
    if (courseModule.sections.length !== 3) {
      errors.push(`${label}/${slug}: exactly three evidence sections required`);
    }
    if (
      !courseModule.audienceScenarios.k12.trim() ||
      !courseModule.audienceScenarios["higher-ed"].trim() ||
      courseModule.humanApprovalPoints.length === 0 ||
      courseModule.noGoActions.length === 0
    ) {
      errors.push(`${label}/${slug}: localised audience, approval and no-go copy required`);
    }
    const citedModuleSources = new Set<string>();
    for (const [index, section] of courseModule.sections.entries()) {
      if (section.paragraphs.length === 0 || section.sourceIds.length === 0) {
        errors.push(`${label}/${slug}/section-${index + 1}: prose and sources required`);
      }
      for (const id of section.sourceIds) {
        citedModuleSources.add(id);
        if (!sourceIds.has(id as (typeof AGENTIC_TEACHING_SOURCES)[number]["id"])) {
          errors.push(`${label}/${slug}: unknown section source ${id}`);
        }
        if (!(manifest.sourceIds as readonly string[]).includes(id)) {
          errors.push(`${label}/${slug}: section source ${id} absent from module manifest`);
        }
      }
    }
    for (const id of manifest.sourceIds) {
      if (!citedModuleSources.has(id)) {
        errors.push(`${label}/${slug}: manifest source ${id} is not cited by any section`);
      }
    }
    const rubric = courseModule.practice.rubric;
    const canonicalRubric = getAgenticTeachingArtifactRubric(slug, label);
    if (JSON.stringify(rubric) !== JSON.stringify(canonicalRubric)) {
      errors.push(`${label}/${slug}: visible rubric must match canonical progress contract`);
    }
    if (rubric.minimumCharacters < 200 || rubric.requiredLabels.length < 2) {
      errors.push(`${label}/${slug}: artifact rubric is too weak`);
    }
    for (const requiredLabel of rubric.requiredLabels) {
      if (!courseModule.practice.starter.includes(requiredLabel)) {
        errors.push(`${label}/${slug}: starter omits required label ${requiredLabel}`);
      }
    }
    if (courseModule.checkpoint.options.length !== 4) {
      errors.push(`${label}/${slug}: checkpoint must have four options`);
    }
    if (!courseModule.checkpoint.explanation.trim()) {
      errors.push(`${label}/${slug}: checkpoint explanation must be valid`);
    }
    const checkpointContract = getAgenticTeachingCheckpointContract(slug, label);
    const checkpointOptionIds = courseModule.checkpoint.options.map(
      (option) => option.id,
    );
    const checkpointOptionLabels = courseModule.checkpoint.options.map(
      (option) => option.label,
    );
    if (
      checkpointOptionIds.some((id) => !id.trim()) ||
      checkpointOptionLabels.some((optionLabel) => !optionLabel.trim()) ||
      new Set(checkpointOptionIds).size !== checkpointOptionIds.length
    ) {
      errors.push(`${label}/${slug}: checkpoint option IDs and labels must be non-empty and unique`);
    }
    if (!sameStrings(checkpointOptionIds, checkpointContract.optionIds)) {
      errors.push(`${label}/${slug}: checkpoint option IDs and order must match the canonical contract`);
    }
    if (!checkpointOptionIds.includes(checkpointContract.correctOptionId)) {
      errors.push(`${label}/${slug}: checkpoint correct semantic option must exist`);
    }
    if (
      agenticTeachingOptionLabelsFingerprint(checkpointOptionLabels) !==
      checkpointContract.optionLabelFingerprint
    ) {
      errors.push(`${label}/${slug}: checkpoint reviewed option labels do not match the canonical fingerprint`);
    }
  }

  if (copy.quiz.questions.length !== AGENTIC_TEACHING_QUIZ_QUESTION_COUNT) {
    errors.push(`${label}: quiz must contain ${AGENTIC_TEACHING_QUIZ_QUESTION_COUNT} questions`);
  }
  if (
    AGENTIC_TEACHING_QUIZ_REQUIRED_CORRECT > copy.quiz.questions.length ||
    AGENTIC_TEACHING_QUIZ_REQUIRED_CORRECT < Math.ceil(copy.quiz.questions.length * 0.8)
  ) {
    errors.push(`${label}: quiz threshold must be arithmetically valid and at least 80%`);
  }
  const questionIds = new Set<string>();
  let criticalCount = 0;
  for (const [index, question] of copy.quiz.questions.entries()) {
    if (questionIds.has(question.id)) errors.push(`${label}: duplicate quiz id ${question.id}`);
    questionIds.add(question.id);
    if (question.critical) criticalCount += 1;
    const optionIds = question.options.map((option) => option.id);
    const optionLabels = question.options.map((option) => option.label);
    if (
      question.options.length !== 4 ||
      optionIds.some((id) => !id.trim()) ||
      optionLabels.some((optionLabel) => !optionLabel.trim()) ||
      new Set(optionIds).size !== optionIds.length ||
      !question.prompt.trim() ||
      !question.explanation.trim()
    ) {
      errors.push(`${label}/${question.id}: four options, a prompt and an explanation are required`);
    }

    const canonicalQuestion = AGENTIC_TEACHING_FINAL_QUIZ_CONTRACT.questions[index];
    if (!canonicalQuestion) {
      errors.push(`${label}/${question.id}: no canonical quiz question exists at position ${index + 1}`);
    } else {
      const canonicalOptionIds: readonly string[] = canonicalQuestion.optionIds;
      if (
        new Set(canonicalOptionIds).size !== canonicalOptionIds.length ||
        !canonicalOptionIds.includes(canonicalQuestion.correctOptionId)
      ) {
        errors.push(`canonical quiz/${canonicalQuestion.id}: semantic option IDs and correct answer must be valid`);
      }
      if (question.id !== canonicalQuestion.id) {
        errors.push(`${label}/${question.id}: ID and order must match canonical quiz question ${canonicalQuestion.id}`);
      }
      if (!sameStrings(optionIds, canonicalOptionIds)) {
        errors.push(`${label}/${question.id}: option IDs and order must match the canonical quiz contract`);
      }
      if (
        agenticTeachingOptionLabelsFingerprint(optionLabels) !==
        canonicalQuestion.optionLabelFingerprints[label]
      ) {
        errors.push(`${label}/${question.id}: reviewed option labels do not match the canonical fingerprint`);
      }
      if (Boolean(question.critical) !== canonicalQuestion.critical) {
        errors.push(`${label}/${question.id}: critical gate must match the canonical quiz contract`);
      }
      if (!sameStrings(question.sourceIds, canonicalQuestion.sourceIds)) {
        errors.push(`${label}/${question.id}: source mapping must match the canonical quiz contract`);
      }
    }
    for (const id of question.sourceIds) {
      if (!sourceIds.has(id as (typeof AGENTIC_TEACHING_SOURCES)[number]["id"])) {
        errors.push(`${label}/${question.id}: unknown source ${id}`);
      }
    }
  }
  if (criticalCount < 4) errors.push(`${label}: at least four critical questions required`);

  if (
    copy.capstone.requiresFinalAssessment !== true ||
    copy.capstone.requiresCompletedModules !== true
  ) {
    errors.push(`${label}: capstone must require the current final assessment and all current modules`);
  }

  if (copy.capstone.artifacts.length !== AGENTIC_TEACHING_COURSE_MANIFEST.modules.length) {
    errors.push(`${label}: capstone requires exactly one artifact for every module`);
  }
  const artifactIds = new Set<string>();
  const artifactModules = new Set<string>();
  for (const artifact of copy.capstone.artifacts) {
    if (artifactIds.has(artifact.id)) errors.push(`${label}/capstone: duplicate artifact id ${artifact.id}`);
    artifactIds.add(artifact.id);
    if (artifactModules.has(artifact.moduleSlug)) {
      errors.push(`${label}/capstone: duplicate module artifact ${artifact.moduleSlug}`);
    }
    artifactModules.add(artifact.moduleSlug);
    const courseModule = copy.modules[artifact.moduleSlug];
    const moduleManifest = manifests.get(artifact.moduleSlug);
    if (!courseModule) {
      errors.push(`${label}/capstone: unknown module ${artifact.moduleSlug}`);
      continue;
    }
    if (JSON.stringify(artifact.rubric) !== JSON.stringify(courseModule.practice.rubric)) {
      errors.push(`${label}/capstone/${artifact.id}: rubric must match linked module`);
    }
    for (const id of artifact.sourceIds) {
      if (!sourceIds.has(id as (typeof AGENTIC_TEACHING_SOURCES)[number]["id"])) {
        errors.push(`${label}/capstone/${artifact.id}: unknown source ${id}`);
      }
    }
    if (moduleManifest && !sameStrings(artifact.sourceIds, moduleManifest.sourceIds)) {
      errors.push(`${label}/capstone/${artifact.id}: sources must match linked module manifest`);
    }
  }
  for (const slug of AGENTIC_TEACHING_MODULE_SLUGS) {
    if (!artifactModules.has(slug)) errors.push(`${label}/capstone: missing module artifact ${slug}`);
  }
}

function validateReviewedLocaleParity(
  en: AgenticTeachingCourseCopy,
  zhHans: AgenticTeachingCourseCopy,
  errors: string[],
): void {
  const enQuizIds = en.quiz.questions.map((question) => question.id);
  const zhQuizIds = zhHans.quiz.questions.map((question) => question.id);
  if (!sameStrings(enQuizIds, zhQuizIds)) {
    errors.push("reviewed locales: quiz IDs and order must match because progress is shared");
    return;
  }
  for (const [index, enQuestion] of en.quiz.questions.entries()) {
    const zhQuestion = zhHans.quiz.questions[index];
    if (
      !sameStrings(
        enQuestion.options.map((option) => option.id),
        zhQuestion.options.map((option) => option.id),
      )
    ) {
      errors.push(`reviewed locales/${enQuestion.id}: semantic option IDs must match the shared quiz blueprint`);
    }
    if (Boolean(enQuestion.critical) !== Boolean(zhQuestion.critical)) {
      errors.push(`reviewed locales/${enQuestion.id}: critical gate must match`);
    }
    if (!sameStrings(enQuestion.sourceIds, zhQuestion.sourceIds)) {
      errors.push(`reviewed locales/${enQuestion.id}: source mapping must match`);
    }
  }

  const enArtifacts = en.capstone.artifacts.map((artifact) =>
    `${artifact.id}:${artifact.moduleSlug}`,
  );
  const zhArtifacts = zhHans.capstone.artifacts.map((artifact) =>
    `${artifact.id}:${artifact.moduleSlug}`,
  );
  if (!sameStrings(enArtifacts, zhArtifacts)) {
    errors.push("reviewed locales: capstone artifact IDs, modules and order must match because progress is shared");
  }
  if (
    en.capstone.requiresFinalAssessment !== zhHans.capstone.requiresFinalAssessment ||
    en.capstone.requiresCompletedModules !== zhHans.capstone.requiresCompletedModules
  ) {
    errors.push("reviewed locales: capstone prerequisite contract must match");
  }
  for (const [index, enTrack] of en.tracks.entries()) {
    if (enTrack.id !== zhHans.tracks[index]?.id || enTrack.startingModule !== zhHans.tracks[index]?.startingModule) {
      errors.push(`reviewed locales: track ${enTrack.id} must share the same starting module`);
    }
  }
}

export async function validateAgenticTeachingCourse(): Promise<readonly string[]> {
  const errors: string[] = [];
  const manifest: AgenticTeachingCourseManifest =
    AGENTIC_TEACHING_COURSE_MANIFEST;
  const sources: readonly AgenticTeachingSource[] = AGENTIC_TEACHING_SOURCES;
  const sourceIds = new Set<string>();
  const moduleSlugs = new Set<string>();

  if (manifest.id !== "ai-teaching") errors.push("Course ID must be ai-teaching");
  if (AGENTIC_TEACHING_PROGRESS_SCHEMA !== 2) errors.push("Course progress schema must remain v2");
  if (
    AGENTIC_TEACHING_FINAL_QUIZ_CONTRACT.questions.length !==
    AGENTIC_TEACHING_FINAL_QUIZ_CONTRACT.questionCount
  ) {
    errors.push("Canonical final quiz question count must match its ordered question contract");
  }
  if (manifest.displayNumber !== 18) errors.push("Course display number must be 18");
  if (manifest.modules.length !== AGENTIC_TEACHING_MODULE_SLUGS.length) {
    errors.push("Manifest must contain exactly ten modules");
  }
  if (AGENTIC_TEACHING_TOTAL_MINUTES !== 720) {
    errors.push(`Course duration must be 720 minutes, received ${AGENTIC_TEACHING_TOTAL_MINUTES}`);
  }

  for (const [index, courseModule] of manifest.modules.entries()) {
    if (courseModule.order !== index + 1) errors.push(`${courseModule.slug}: invalid module order`);
    if (moduleSlugs.has(courseModule.slug)) errors.push(`Duplicate module slug ${courseModule.slug}`);
    moduleSlugs.add(courseModule.slug);
    if (!courseModule.audiences.includes("k12") || !courseModule.audiences.includes("higher-ed")) {
      errors.push(`${courseModule.slug}: both K-12 and higher-ed scenarios are required`);
    }
    if (!courseModule.scenarios.k12.trim() || !courseModule.scenarios["higher-ed"].trim()) {
      errors.push(`${courseModule.slug}: both audience scenarios require content`);
    }
    if (courseModule.humanApprovalPoints.length === 0 || courseModule.noGoActions.length === 0) {
      errors.push(`${courseModule.slug}: approval and no-go contracts are required`);
    }
  }
  for (const phase of manifest.phases) {
    for (const slug of phase.moduleSlugs) {
      const courseModule = manifest.modules.find((candidate) => candidate.slug === slug);
      if (!courseModule || courseModule.phaseId !== phase.id) {
        errors.push(`${phase.id}: phase/module mapping is inconsistent for ${slug}`);
      }
    }
  }
  const phaseSlugs = manifest.phases.flatMap((phase) => phase.moduleSlugs);
  if (
    phaseSlugs.length !== manifest.modules.length ||
    new Set(phaseSlugs).size !== manifest.modules.length ||
    !AGENTIC_TEACHING_MODULE_SLUGS.every((slug) => phaseSlugs.includes(slug))
  ) {
    errors.push("Every module must appear in exactly one phase");
  }

  let githubCount = 0;
  let xCount = 0;
  for (const source of sources) {
    if (sourceIds.has(source.id)) errors.push(`Duplicate source id ${source.id}`);
    sourceIds.add(source.id);
    if (!source.url.startsWith("https://")) errors.push(`${source.id}: HTTPS source required`);
    if (!DATE.test(source.accessedOn)) errors.push(`${source.id}: invalid access date`);
    if (source.claimEvidenceUrls.length === 0 || source.claimEvidenceUrls.some((url) => !url.startsWith("https://"))) {
      errors.push(`${source.id}: first-party HTTPS claim evidence required`);
    }
    if (!source.rightsDecision.en.trim() || !source.rightsDecision["zh-Hans"].trim()) {
      errors.push(`${source.id}: bilingual rights decision required`);
    }
    if (source.kind === "github-repository") {
      githubCount += 1;
      if (!source.revision || !source.license) errors.push(`${source.id}: pinned revision and licence required`);
    }
    if (source.kind === "x-post") {
      xCount += 1;
      const expected = source.url.match(/status\/(\d+)/)?.[1];
      const hasCorroboration = Boolean(
        source.corroboratingSourceIds?.length || source.corroboratingUrls?.length,
      );
      if (
        !source.statusId ||
        source.statusId !== expected ||
        !source.authorIdentity ||
        !source.authorRole ||
        !source.threadContext ||
        !source.mediaContext ||
        !source.publishedOn ||
        !hasCorroboration ||
        !source.claimEvidenceUrls.includes(source.url) ||
        !source.claimEvidenceUrls.some((url) => url.startsWith("https://publish.twitter.com/oembed?"))
      ) {
        errors.push(`${source.id}: X identity, context, date, status and corroboration must fail closed`);
      }
      if (source.corroboratingUrls?.some((url) => !url.startsWith("https://"))) {
        errors.push(`${source.id}: corroborating URLs must use HTTPS`);
      }
    }
  }
  if (githubCount < 7) errors.push("At least seven GitHub implementation sources required");
  if (xCount < 3) errors.push("At least three verified X field signals required");

  for (const source of sources) {
    for (const id of source.corroboratingSourceIds ?? []) {
      if (id === source.id || !sourceIds.has(id)) {
        errors.push(`${source.id}: invalid corroborating source ${id}`);
      }
    }
  }

  for (const courseModule of manifest.modules) {
    for (const id of courseModule.sourceIds) {
      if (!sourceIds.has(id)) errors.push(`${courseModule.slug}: unknown source ${id}`);
    }
  }

  validateCopy("en", AGENTIC_TEACHING_COPY_EN, errors);
  try {
    const { AGENTIC_TEACHING_COPY_ZH_HANS } = await import("./copy/zh-Hans");
    validateCopy("zh-Hans", AGENTIC_TEACHING_COPY_ZH_HANS, errors);
    validateReviewedLocaleParity(
      AGENTIC_TEACHING_COPY_EN,
      AGENTIC_TEACHING_COPY_ZH_HANS,
      errors,
    );
  } catch (error) {
    errors.push(`zh-Hans: failed to load reviewed copy (${String(error)})`);
  }

  return errors;
}

export async function assertValidAgenticTeachingCourse(): Promise<void> {
  const errors = await validateAgenticTeachingCourse();
  if (errors.length > 0) {
    throw new Error(`Invalid ai-teaching course:\n- ${errors.join("\n- ")}`);
  }
}
