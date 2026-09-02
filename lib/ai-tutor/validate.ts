import { AI_TUTOR_EN_COPY } from "./copy/en";
import { AI_TUTOR_COURSE_MANIFEST } from "./manifest";
import { AI_TUTOR_SOURCES } from "./sources";
import {
  AI_TUTOR_MODULE_SLUGS,
  AI_TUTOR_PHASE_IDS,
  AI_TUTOR_SOURCE_IDS,
  AI_TUTOR_UI_KEYS,
  type AiTutorModuleSlug,
} from "./types";

function stringsIn(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(stringsIn);
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(stringsIn);
  }
  return [];
}

function duplicates(values: readonly string[]): string[] {
  return values.filter((value, index) => values.indexOf(value) !== index);
}

export function validateAiTutorCourse(): string[] {
  const errors: string[] = [];
  const manifest = AI_TUTOR_COURSE_MANIFEST;
  const copy = AI_TUTOR_EN_COPY;
  const moduleSlugs = manifest.modules.map((item) => item.slug);
  const phaseIds = manifest.phases.map((phase) => phase.id);
  const sourceIds = AI_TUTOR_SOURCES.map((source) => source.id);
  const knownModules = new Set<string>(AI_TUTOR_MODULE_SLUGS);
  const knownSources = new Set<string>(AI_TUTOR_SOURCE_IDS);

  if (manifest.id !== "ai-tutor") errors.push("Course ID must be ai-tutor.");
  if (manifest.displayNumber !== 13) errors.push("Course display number must be 13.");
  if (manifest.contentLocale !== "en") errors.push("Course content locale must be en.");
  if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) errors.push("Course version must be semantic.");
  if (manifest.modules.length !== 8) errors.push(`Course 13 requires exactly 8 modules, found ${manifest.modules.length}.`);
  if (manifest.phases.length !== 4) errors.push(`Course 13 requires exactly 4 phases, found ${manifest.phases.length}.`);
  if (duplicates(moduleSlugs).length) errors.push("Module slugs must be unique.");
  if (duplicates(phaseIds).length) errors.push("Phase IDs must be unique.");
  if (duplicates(sourceIds).length) errors.push("Source IDs must be unique.");

  const expectedSlugs = [...AI_TUTOR_MODULE_SLUGS];
  if (JSON.stringify(moduleSlugs) !== JSON.stringify(expectedSlugs)) {
    errors.push("Manifest module order must match the canonical Course 13 slug order.");
  }
  if (JSON.stringify(phaseIds) !== JSON.stringify([...AI_TUTOR_PHASE_IDS])) {
    errors.push("Manifest phase order must match the canonical Course 13 phase order.");
  }

  const phaseCoverage = manifest.phases.flatMap((phase) => phase.moduleSlugs);
  if (phaseCoverage.length !== moduleSlugs.length || new Set(phaseCoverage).size !== moduleSlugs.length) {
    errors.push("Every module must appear exactly once across the four phases.");
  }

  for (const [index, phase] of manifest.phases.entries()) {
    if (phase.order !== index + 1) errors.push(`${phase.id}: phase order must be ${index + 1}.`);
    if (!copy.phases[phase.id]) errors.push(`${phase.id}: phase copy is missing.`);
    for (const slug of phase.moduleSlugs) {
      const moduleManifest = manifest.modules.find((item) => item.slug === slug);
      if (!moduleManifest) errors.push(`${phase.id}: references unknown module ${slug}.`);
      else if (moduleManifest.phaseId !== phase.id) errors.push(`${slug}: phase reference is inconsistent.`);
    }
  }

  for (const [index, moduleManifest] of manifest.modules.entries()) {
    const moduleCopy = copy.modules[moduleManifest.slug];
    if (moduleManifest.order !== index + 1) errors.push(`${moduleManifest.slug}: module order must be ${index + 1}.`);
    if (moduleManifest.minutes < 30) errors.push(`${moduleManifest.slug}: study time must be at least 30 minutes.`);
    if (!moduleCopy) {
      errors.push(`${moduleManifest.slug}: English copy is missing.`);
      continue;
    }
    if (!copy.conceptMap.nodes[moduleManifest.slug]) errors.push(`${moduleManifest.slug}: concept-map node copy is missing.`);
    if (moduleCopy.sections.length !== 3) errors.push(`${moduleManifest.slug}: exactly three teaching sections are required.`);
    if (moduleCopy.checkpoint.options.length !== 4) errors.push(`${moduleManifest.slug}: checkpoint requires four options.`);
    if (moduleCopy.checkpoint.correctIndex < 0 || moduleCopy.checkpoint.correctIndex > 3) {
      errors.push(`${moduleManifest.slug}: checkpoint answer index is invalid.`);
    }
    if (moduleCopy.workshop.steps.length < 4) errors.push(`${moduleManifest.slug}: workshop needs at least four steps.`);
    if (moduleCopy.workshop.deliverables.length < 3) errors.push(`${moduleManifest.slug}: workshop needs at least three deliverables.`);
    if (stringsIn(moduleCopy.systemContract).some((value) => value.trim().length < 12)) {
      errors.push(`${moduleManifest.slug}: every system-contract field needs substantive copy.`);
    }

    const declaredSources = new Set(moduleManifest.sourceIds);
    const citedSources = new Set(moduleCopy.sections.flatMap((section) => section.sourceIds));
    for (const sourceId of moduleManifest.sourceIds) {
      if (!knownSources.has(sourceId)) errors.push(`${moduleManifest.slug}: unknown source ${sourceId}.`);
      if (!citedSources.has(sourceId)) {
        errors.push(`${moduleManifest.slug}: declared source ${sourceId} is not cited by a teaching section.`);
      }
    }
    for (const section of moduleCopy.sections) {
      if (!section.heading.trim()) errors.push(`${moduleManifest.slug}: section heading is empty.`);
      if (!section.paragraphs.length || section.paragraphs.some((paragraph) => paragraph.length < 80)) {
        errors.push(`${moduleManifest.slug}: every section needs substantive paragraph copy.`);
      }
      for (const sourceId of section.sourceIds) {
        if (!declaredSources.has(sourceId)) {
          errors.push(`${moduleManifest.slug}: section source ${sourceId} is not declared in the module manifest.`);
        }
      }
    }
  }

  const copySlugs = Object.keys(copy.modules);
  if (copySlugs.length !== expectedSlugs.length || expectedSlugs.some((slug) => !copySlugs.includes(slug))) {
    errors.push("English module copy must have exact parity with the module manifest.");
  }

  const incidentCount = new Map<AiTutorModuleSlug, number>(
    AI_TUTOR_MODULE_SLUGS.map((slug) => [slug, 0]),
  );
  for (const edge of manifest.conceptEdges) {
    if (!knownModules.has(edge.from) || !knownModules.has(edge.to)) {
      errors.push(`Concept edge ${edge.from} -> ${edge.to} references an unknown module.`);
    }
    if (edge.from === edge.to) errors.push(`Concept edge ${edge.from} must not point to itself.`);
    if (!copy.conceptMap.relations[edge.relationId]?.trim()) {
      errors.push(`Concept edge ${edge.from} -> ${edge.to} needs relation copy.`);
    }
    incidentCount.set(edge.from, (incidentCount.get(edge.from) ?? 0) + 1);
    incidentCount.set(edge.to, (incidentCount.get(edge.to) ?? 0) + 1);
  }
  for (const [slug, count] of incidentCount) {
    if (count === 0) errors.push(`${slug}: concept-map node is disconnected.`);
  }

  if (copy.capstone.artifacts.length !== 8) errors.push("Capstone requires one artifact from each of the eight modules.");
  if (!copy.modules["safety-teacher-oversight"].checkpoint.critical) {
    errors.push("The teacher-oversight checkpoint must be critical.");
  }

  const uiCopy = copy.ui as Readonly<Record<string, string>>;
  const uiKeys = Object.keys(uiCopy);
  if (
    uiKeys.length !== AI_TUTOR_UI_KEYS.length
    || AI_TUTOR_UI_KEYS.some((key) => !uiKeys.includes(key))
  ) {
    errors.push("UI copy must have exact parity with the canonical Course 13 UI key set.");
  }
  for (const key of AI_TUTOR_UI_KEYS) {
    if (!uiCopy[key]?.trim()) errors.push(`Missing UI copy: ${key}.`);
  }

  const visibleCopy = stringsIn(copy).join("\n");
  const requiredTopics = [
    "learning objective",
    "diagnostic",
    "scaffold",
    "formative assessment",
    "item validation",
    "learner model",
    "learning-impact",
    "teacher oversight",
  ];
  for (const topic of requiredTopics) {
    if (!visibleCopy.toLocaleLowerCase("en").includes(topic)) errors.push(`Course copy does not cover required topic: ${topic}.`);
  }
  if (/[\u2013\u2014]/.test(visibleCopy)) errors.push("Visible Course 13 copy contains an en or em dash.");

  for (const source of AI_TUTOR_SOURCES) {
    if (!source.url.startsWith("https://")) errors.push(`${source.id}: source URL must use HTTPS.`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(source.accessedOn)) errors.push(`${source.id}: accessed date is invalid.`);
    const annotation = copy.sourceAnnotations[source.id];
    if (!annotation?.supports.trim() || !annotation.limitation.trim()) {
      errors.push(`${source.id}: localized support and limitation annotations are required.`);
    }
  }

  return errors;
}

export function assertValidAiTutorCourse(): void {
  const errors = validateAiTutorCourse();
  if (errors.length) throw new Error(`Invalid AI Tutor course:\n${errors.join("\n")}`);
}
