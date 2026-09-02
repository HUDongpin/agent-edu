import { MATH_ANIMATION_EN_COPY } from "./copy/en";
import { MATH_ANIMATION_ZH_HANS_COPY } from "./copy/zh-Hans";
import { MATH_ANIMATION_COURSE_MANIFEST, MATH_ANIMATION_TOTAL_MINUTES } from "./manifest";
import { MATH_ANIMATION_REPOSITORIES, MATH_ANIMATION_SOURCES } from "./sources";
import {
  MATH_ANIMATION_MODULE_SLUGS,
  MATH_ANIMATION_PHASE_IDS,
  MATH_ANIMATION_SOURCE_IDS,
  type MathAnimationCourseCopy,
  type MathAnimationSourceRecord,
} from "./types";

const SCORE_LIMITS = {
  mathSemantics: 20,
  deterministicTimeline: 15,
  agentReadable: 15,
  iterationPreview: 10,
  renderOutput: 10,
  maintenance: 10,
  licenseClarity: 10,
  accessibility: 5,
  ecosystem: 5,
} as const;

function duplicates(values: readonly string[]): string[] {
  return values.filter((value, index) => values.indexOf(value) !== index);
}

function stringsIn(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(stringsIn);
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(stringsIn);
  }
  return [];
}

function validateAnswerPositions(label: string, positions: readonly number[]): string[] {
  const errors: string[] = [];
  if (new Set(positions).size < 4) {
    errors.push(`${label}: correct answers must use all four option positions.`);
  }
  const largestBucket = Math.max(...[0, 1, 2, 3].map(
    (position) => positions.filter((value) => value === position).length,
  ));
  if (largestBucket > Math.ceil(positions.length / 2)) {
    errors.push(`${label}: one answer position is overrepresented.`);
  }
  if (positions.some((position, index) => (
    index >= 2 && position === positions[index - 1] && position === positions[index - 2]
  ))) {
    errors.push(`${label}: three consecutive answers use the same position.`);
  }
  return errors;
}

function validateCopy(label: string, copy: MathAnimationCourseCopy): string[] {
  const errors: string[] = [];
  const sourceSet = new Set<string>(MATH_ANIMATION_SOURCE_IDS);
  const copySlugs = Object.keys(copy.modules);
  if (
    copySlugs.length !== MATH_ANIMATION_MODULE_SLUGS.length
    || MATH_ANIMATION_MODULE_SLUGS.some((slug) => !copySlugs.includes(slug))
  ) {
    errors.push(`${label}: copy must have exact module parity.`);
  }
  if (copy.principles.length !== 4) errors.push(`${label}: four principles are required.`);
  if (copy.outcomes.length !== 6) errors.push(`${label}: six outcomes are required.`);
  if (copy.assessment.length < 8) errors.push(`${label}: at least eight assessment questions are required.`);
  if (copy.capstone.artifacts.length !== 6) errors.push(`${label}: six capstone artifact groups are required.`);
  errors.push(...validateAnswerPositions(
    `${label}: module checkpoints`,
    MATH_ANIMATION_COURSE_MANIFEST.modules.map(
      (moduleManifest) => copy.modules[moduleManifest.slug]?.checkpoint.correctIndex ?? -1,
    ),
  ));
  errors.push(...validateAnswerPositions(
    `${label}: final assessment`,
    copy.assessment.map((question) => question.correctIndex),
  ));

  for (const phaseId of MATH_ANIMATION_PHASE_IDS) {
    if (!copy.phases[phaseId]) errors.push(`${label}: missing phase ${phaseId}.`);
  }

  for (const moduleManifest of MATH_ANIMATION_COURSE_MANIFEST.modules) {
    const moduleCopy = copy.modules[moduleManifest.slug];
    if (!moduleCopy) continue;
    if (moduleCopy.sections.length !== 3) {
      errors.push(`${label}/${moduleManifest.slug}: exactly three sections are required.`);
    }
    const modes = new Set(moduleCopy.sections.map((section) => section.evidenceMode));
    for (const mode of ["source-grounded", "engineering-synthesis", "version-watch"] as const) {
      if (!modes.has(mode)) errors.push(`${label}/${moduleManifest.slug}: missing ${mode}.`);
    }
    if (moduleCopy.verificationGate.length < 4) {
      errors.push(`${label}/${moduleManifest.slug}: at least four verification gates are required.`);
    }
    const promptMinimum = label === "zh-Hans" ? 70 : 120;
    if (moduleCopy.agentPrompt.trim().length < promptMinimum) {
      errors.push(`${label}/${moduleManifest.slug}: agent prompt is too thin.`);
    }
    const declared = new Set<string>(moduleManifest.sourceIds);
    const cited = new Set<string>(moduleCopy.sections.flatMap((section) => section.sourceIds));
    for (const sourceId of declared) {
      if (!cited.has(sourceId)) errors.push(`${label}/${moduleManifest.slug}: declared source ${sourceId} is not cited.`);
    }
    for (const section of moduleCopy.sections) {
      if (section.paragraphs.some((paragraph) => paragraph.trim().length < 80)) {
        errors.push(`${label}/${moduleManifest.slug}: teaching paragraphs must be substantive.`);
      }
      for (const sourceId of section.sourceIds) {
        if (!sourceSet.has(sourceId)) errors.push(`${label}/${moduleManifest.slug}: unknown source ${sourceId}.`);
        if (!declared.has(sourceId)) errors.push(`${label}/${moduleManifest.slug}: section cites undeclared source ${sourceId}.`);
      }
    }
  }

  const visible = stringsIn(copy).join("\n");
  if (/[—–]/u.test(visible)) errors.push(`${label}: visible copy contains a forbidden dash character.`);
  if (/\b(?:todo|tbd|lorem ipsum|placeholder)\b/i.test(visible)) {
    errors.push(`${label}: visible copy contains a placeholder token.`);
  }
  return errors;
}

export function validateMathAnimationCourse(): string[] {
  const errors: string[] = [];
  const manifest = MATH_ANIMATION_COURSE_MANIFEST;
  const slugs = manifest.modules.map((module) => module.slug);
  const phases = manifest.phases.map((phase) => phase.id);
  const sourceIds = MATH_ANIMATION_SOURCES.map((source) => source.id);
  const sourceSet = new Set<string>(sourceIds);

  if (manifest.id !== "math-animation") errors.push("Course ID must be math-animation.");
  if (manifest.displayNumber !== 19) errors.push("Course display number must be 19.");
  if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) errors.push("Course version must be semantic.");
  if (manifest.modules.length !== 12) errors.push("Course 19 requires twelve modules.");
  if (manifest.phases.length !== 4) errors.push("Course 19 requires four phases.");
  if (MATH_ANIMATION_TOTAL_MINUTES !== 805) errors.push("Course 19 must total 805 minutes.");
  if (duplicates(slugs).length) errors.push("Module slugs must be unique.");
  if (duplicates(phases).length) errors.push("Phase IDs must be unique.");
  if (duplicates(sourceIds).length) errors.push("Source IDs must be unique.");
  if (JSON.stringify(slugs) !== JSON.stringify([...MATH_ANIMATION_MODULE_SLUGS])) {
    errors.push("Module order must match the canonical slug order.");
  }
  if (JSON.stringify(sourceIds) !== JSON.stringify([...MATH_ANIMATION_SOURCE_IDS])) {
    errors.push("Source order must match the canonical source ledger.");
  }

  const phaseCoverage = manifest.phases.flatMap((phase) => phase.moduleSlugs);
  if (phaseCoverage.length !== 12 || new Set(phaseCoverage).size !== 12) {
    errors.push("Every module must appear in exactly one phase.");
  }
  for (const [index, phase] of manifest.phases.entries()) {
    if (phase.order !== index + 1) errors.push(`${phase.id}: invalid phase order.`);
    for (const slug of phase.moduleSlugs) {
      const courseModule = manifest.modules.find((candidate) => candidate.slug === slug);
      if (!courseModule || courseModule.phaseId !== phase.id) errors.push(`${slug}: inconsistent phase reference.`);
    }
  }
  for (const [index, module] of manifest.modules.entries()) {
    if (module.order !== index + 1) errors.push(`${module.slug}: invalid module order.`);
    if (module.minutes < 50) errors.push(`${module.slug}: implausibly short study time.`);
    for (const sourceId of module.sourceIds) {
      if (!sourceSet.has(sourceId)) errors.push(`${module.slug}: missing source ${sourceId}.`);
    }
  }

  for (const source of MATH_ANIMATION_SOURCES as readonly MathAnimationSourceRecord[]) {
    if (!source.url.startsWith("https://")) errors.push(`${source.id}: URL must use HTTPS.`);
    if (!source.claimEvidenceUrls.includes(source.url)) errors.push(`${source.id}: primary URL must be claim evidence.`);
    if (new Set(source.claimEvidenceUrls).size !== source.claimEvidenceUrls.length) {
      errors.push(`${source.id}: duplicate claim evidence URLs.`);
    }
    if (source.versionOrRevision.trim().length < 6) errors.push(`${source.id}: weak version anchor.`);
    if (source.kind === "github-repository") {
      if (!source.versionAnchorUrl) errors.push(`${source.id}: repository needs a version anchor URL.`);
      if (!source.licenseUrl && !/no (?:repository-wide|standalone) license/i.test(source.licenseOrRights)) {
        errors.push(`${source.id}: repository needs a license URL or an explicit no-license boundary.`);
      }
    }
    if (source.kind === "x-post" && source.role !== "discovery-signal") {
      errors.push(`${source.id}: X sources must remain discovery signals.`);
    }
    if (source.supports.length < 70 || source.boundary.length < 70) {
      errors.push(`${source.id}: source support or boundary is too thin.`);
    }
    if (
      source.licenseOrRightsZhHans.trim().length < 12
      || source.licenseOrRightsZhHans === source.licenseOrRights
    ) {
      errors.push(`${source.id}: Simplified Chinese rights boundary is missing or untranslated.`);
    }
  }

  for (const repository of MATH_ANIMATION_REPOSITORIES) {
    const entries = Object.entries(repository.breakdown) as [keyof typeof SCORE_LIMITS, number][];
    const total = entries.reduce((sum, [key, value]) => {
      if (value < 0 || value > SCORE_LIMITS[key]) errors.push(`${repository.sourceId}: ${key} score out of range.`);
      return sum + value;
    }, 0);
    if (repository.score !== total) errors.push(`${repository.sourceId}: score does not equal breakdown.`);
    if (!/^[0-9a-f]{7,40}$/i.test(repository.testedRevision)) {
      errors.push(`${repository.sourceId}: tested revision must be a commit SHA.`);
    }
    if (repository.smokeEvidence.trim().length < 80) errors.push(`${repository.sourceId}: smoke evidence is too thin.`);
  }

  errors.push(...validateCopy("en", MATH_ANIMATION_EN_COPY));
  errors.push(...validateCopy("zh-Hans", MATH_ANIMATION_ZH_HANS_COPY));
  const englishAnswerPositions = MATH_ANIMATION_COURSE_MANIFEST.modules.map(
    (moduleManifest) => MATH_ANIMATION_EN_COPY.modules[moduleManifest.slug].checkpoint.correctIndex,
  );
  const chineseAnswerPositions = MATH_ANIMATION_COURSE_MANIFEST.modules.map(
    (moduleManifest) => MATH_ANIMATION_ZH_HANS_COPY.modules[moduleManifest.slug].checkpoint.correctIndex,
  );
  if (JSON.stringify(englishAnswerPositions) !== JSON.stringify(chineseAnswerPositions)) {
    errors.push("en/zh-Hans: checkpoint answer positions must stay aligned.");
  }
  if (
    JSON.stringify(MATH_ANIMATION_EN_COPY.assessment.map((question) => question.correctIndex))
    !== JSON.stringify(MATH_ANIMATION_ZH_HANS_COPY.assessment.map((question) => question.correctIndex))
  ) {
    errors.push("en/zh-Hans: assessment answer positions must stay aligned.");
  }
  return errors;
}

export function assertValidMathAnimationCourse(): void {
  const errors = validateMathAnimationCourse();
  if (errors.length) throw new Error(`Invalid Course 19 contract:\n${errors.join("\n")}`);
}
