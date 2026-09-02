import { PRODUCT_MANAGEMENT_EN_COPY } from "./copy/en";
import { PRODUCT_MANAGEMENT_COURSE_MANIFEST } from "./manifest";
import { PRODUCT_MANAGEMENT_SOURCES } from "./sources";
import {
  PRODUCT_MANAGEMENT_CONCEPT_DOMAIN_IDS,
  PRODUCT_MANAGEMENT_MODULE_SLUGS,
  PRODUCT_MANAGEMENT_PHASE_IDS,
} from "./types";

function stringsIn(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(stringsIn);
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(stringsIn);
  }
  return [];
}

function duplicateValues(values: readonly string[]): string[] {
  return values.filter((value, index) => values.indexOf(value) !== index);
}

export function validateProductManagementCourse(): string[] {
  const errors: string[] = [];
  const manifest = PRODUCT_MANAGEMENT_COURSE_MANIFEST;
  const copy = PRODUCT_MANAGEMENT_EN_COPY;
  const sourceIds = PRODUCT_MANAGEMENT_SOURCES.map((source) => source.id);
  const sourceSet = new Set(sourceIds);
  const slugs = manifest.modules.map((module) => module.slug);
  const phaseIds = manifest.phases.map((phase) => phase.id);
  const allDeclaredSources = new Set(manifest.modules.flatMap((module) => module.sourceIds));

  if (manifest.id !== "product-management") errors.push("Course ID must be product-management.");
  if (manifest.displayNumber !== 14) errors.push("Course display number must be 14.");
  if (manifest.contentLocale !== "en") errors.push("Course content locale must be en.");
  if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) errors.push("Course version must be semantic.");
  if (manifest.modules.length !== 14) errors.push(`Course 14 requires 14 modules, found ${manifest.modules.length}.`);
  if (manifest.phases.length !== 4) errors.push(`Course 14 requires four phases, found ${manifest.phases.length}.`);
  if (manifest.modules.reduce((sum, module) => sum + module.minutes, 0) !== 910) {
    errors.push("Course 14 must total 910 minutes.");
  }
  if (duplicateValues(slugs).length) errors.push("Module slugs must be unique.");
  if (duplicateValues(phaseIds).length) errors.push("Phase IDs must be unique.");
  if (duplicateValues(sourceIds).length) errors.push("Source IDs must be unique.");
  if (JSON.stringify(slugs) !== JSON.stringify([...PRODUCT_MANAGEMENT_MODULE_SLUGS])) {
    errors.push("Module order must match the canonical Course 14 slug order.");
  }
  if (JSON.stringify(phaseIds) !== JSON.stringify([...PRODUCT_MANAGEMENT_PHASE_IDS])) {
    errors.push("Phase order must match the canonical Course 14 phase order.");
  }

  const phaseCoverage = manifest.phases.flatMap((phase) => phase.moduleSlugs);
  if (
    phaseCoverage.length !== manifest.modules.length
    || new Set(phaseCoverage).size !== manifest.modules.length
  ) {
    errors.push("Each module must appear exactly once across the four phases.");
  }

  for (const [index, phase] of manifest.phases.entries()) {
    if (phase.order !== index + 1) errors.push(`${phase.id}: phase order is invalid.`);
    if (!copy.phases[phase.id]) errors.push(`${phase.id}: phase copy is missing.`);
    for (const slug of phase.moduleSlugs) {
      const moduleManifest = manifest.modules.find((candidate) => candidate.slug === slug);
      if (!moduleManifest) errors.push(`${phase.id}: unknown module ${slug}.`);
      else if (moduleManifest.phaseId !== phase.id) errors.push(`${slug}: phase reference is inconsistent.`);
    }
  }

  const domainCoverage = new Map(
    PRODUCT_MANAGEMENT_CONCEPT_DOMAIN_IDS.map((domain) => [domain, 0]),
  );

  for (const [index, moduleManifest] of manifest.modules.entries()) {
    const moduleCopy = copy.modules[moduleManifest.slug];
    if (moduleManifest.order !== index + 1) errors.push(`${moduleManifest.slug}: module order is invalid.`);
    if (moduleManifest.minutes < 45) errors.push(`${moduleManifest.slug}: study time is implausibly short.`);
    if (!moduleCopy) {
      errors.push(`${moduleManifest.slug}: English copy is missing.`);
      continue;
    }
    if (moduleCopy.sections.length !== 3) errors.push(`${moduleManifest.slug}: exactly three teaching sections are required.`);
    if (moduleCopy.decision.options.length !== 3) errors.push(`${moduleManifest.slug}: decision frame requires three options.`);
    if (moduleCopy.checkpoint.options.length !== 4) errors.push(`${moduleManifest.slug}: checkpoint requires four options.`);
    if (moduleCopy.practice.steps.length < 4) errors.push(`${moduleManifest.slug}: practice requires at least four steps.`);
    if (moduleCopy.practice.template.trim().length < 180) errors.push(`${moduleManifest.slug}: artifact template is too thin.`);

    const declared = new Set(moduleManifest.sourceIds);
    const cited = new Set(moduleCopy.sections.flatMap((section) => section.sourceIds));
    for (const sourceId of moduleManifest.sourceIds) {
      if (!sourceSet.has(sourceId)) errors.push(`${moduleManifest.slug}: unknown source ${sourceId}.`);
      if (!cited.has(sourceId)) errors.push(`${moduleManifest.slug}: declared source ${sourceId} is never cited.`);
    }
    for (const section of moduleCopy.sections) {
      if (!section.heading.trim()) errors.push(`${moduleManifest.slug}: empty section heading.`);
      if (section.paragraphs.some((paragraph) => paragraph.trim().length < 90)) {
        errors.push(`${moduleManifest.slug}: every teaching paragraph must be substantive.`);
      }
      for (const sourceId of section.sourceIds) {
        if (!declared.has(sourceId)) {
          errors.push(`${moduleManifest.slug}: section cites undeclared source ${sourceId}.`);
        }
      }
    }
    for (const domain of moduleManifest.conceptDomainIds) {
      domainCoverage.set(domain, (domainCoverage.get(domain) ?? 0) + 1);
    }
  }

  const copySlugs = Object.keys(copy.modules);
  if (
    copySlugs.length !== PRODUCT_MANAGEMENT_MODULE_SLUGS.length
    || PRODUCT_MANAGEMENT_MODULE_SLUGS.some((slug) => !copySlugs.includes(slug))
  ) {
    errors.push("English copy must have exact module parity with the manifest.");
  }
  for (const [domain, count] of domainCoverage) {
    if (!count) errors.push(`${domain}: concept domain has no module coverage.`);
    if (!copy.conceptDomains[domain]) errors.push(`${domain}: concept-domain copy is missing.`);
  }

  if (copy.principles.length !== 4) errors.push("The product operating system requires four principles.");
  if (copy.outcomes.length !== 8) errors.push("Course 14 requires eight observable outcomes.");
  if (copy.finalAssessment.passPercent !== 80) errors.push("Final assessment pass mark must be 80 percent.");
  if (copy.finalAssessment.questions.length !== 14) {
    errors.push(`Final assessment requires 14 questions, found ${copy.finalAssessment.questions.length}.`);
  }
  const finalQuestionIds = copy.finalAssessment.questions.map((question) => question.id);
  if (duplicateValues(finalQuestionIds).length) {
    errors.push("Final assessment question IDs must be unique.");
  }
  const finalQuestionTexts = copy.finalAssessment.questions.map(
    (question) => question.question.trim(),
  );
  if (duplicateValues(finalQuestionTexts).length) {
    errors.push("Final assessment question text must be unique.");
  }
  const checkpointQuestions = new Set(
    Object.values(copy.modules).map((module) => module.checkpoint.question.trim()),
  );
  const moduleTitles = new Set(Object.values(copy.modules).map((module) => module.title));
  const assessedModuleTitles = new Set(
    copy.finalAssessment.questions.map((question) => question.moduleTitle),
  );
  if (
    assessedModuleTitles.size !== moduleTitles.size
    || [...moduleTitles].some((title) => !assessedModuleTitles.has(title))
  ) {
    errors.push("Final assessment must map exactly one integrative question to every module title.");
  }
  for (const question of copy.finalAssessment.questions) {
    if (!question.id.trim()) errors.push("Final assessment question ID must not be empty.");
    if (!question.moduleTitle.trim()) {
      errors.push(`${question.id || "Final assessment question"}: module title must not be empty.`);
    }
    if (question.options.length !== 4) {
      errors.push(`${question.id}: final assessment question requires four options.`);
    }
    if (question.correctIndex < 0 || question.correctIndex >= question.options.length) {
      errors.push(`${question.id}: final assessment correctIndex is out of range.`);
    }
    if (new Set(question.options.map((option) => option.trim())).size !== question.options.length) {
      errors.push(`${question.id}: final assessment options must be unique.`);
    }
    if (checkpointQuestions.has(question.question.trim())) {
      errors.push(`${question.id}: final assessment must not repeat a module checkpoint.`);
    }
  }
  if (copy.capstone.artifacts.length < 10) errors.push("Capstone requires at least ten auditable artifacts.");

  const visibleText = stringsIn(copy).join("\n");
  const normalizedVisibleText = visibleText.toLocaleLowerCase("en");
  const requiredTopicGroups: Readonly<Record<string, readonly string[]>> = {
    "role boundaries": ["product manager", "project management", "product owner"],
    "cross-functional leadership": ["product triad", "stakeholder", "decision rights"],
    "strategy and market": ["product strategy", "icp", "tam", "sam", "som", "positioning"],
    "business model and economics": [
      "pricing and packaging",
      "unit economics",
      "gross margin",
      "customer acquisition cost",
      "lifetime value",
      "payback period",
      "product-market fit",
    ],
    "discovery and research": [
      "user research",
      "interview",
      "observation",
      "triangulation",
      "jtbd",
      "survey",
      "evidence ledger",
    ],
    "definition and scope": ["problem statement", "non-goals", "assumption", "mvp"],
    "outcomes and analytics": [
      "okr",
      "heart",
      "north star",
      "funnel",
      "cohort",
      "retention",
    ],
    "prioritization and planning": [
      "rice",
      "ice",
      "kano",
      "wsjf",
      "moscow",
      "cost of delay",
      "roadmap",
      "backlog",
      "portfolio",
    ],
    "product and experience design": [
      "information architecture",
      "journey",
      "usability",
      "accessibility",
      "wcag",
      "design system",
    ],
    "requirements and technical contract": [
      "prd",
      "user stor",
      "acceptance criteria",
      "non-functional",
      "api contract",
      "data model",
    ],
    "ai architecture and evaluation": [
      "prompt",
      "rag",
      "retrieval",
      "rerank",
      "fine-tuning",
      "workflow",
      "agent",
      "human review",
      "golden set",
      "regression",
      "task success",
      "trace",
      "p95",
      "cost per successful task",
      "continuous evaluation",
      "drift",
      "last-known-good",
    ],
    "engineering and release": [
      "scrum",
      "kanban",
      "ci/cd",
      "qa",
      "technical debt",
      "feature flag",
      "canary",
      "rollback",
    ],
    "safety and governance": [
      "privacy",
      "security",
      "prompt injection",
      "least privilege",
      "copyright",
      "fairness",
      "audit trail",
      "incident response",
    ],
    "go-to-market and lifecycle": [
      "go-to-market",
      "sales enablement",
      "customer success",
      "aarrr",
      "product-led growth",
      "growth loops",
      "deprecation",
      "lifecycle",
    ],
    "experimentation": [
      "a/b test",
      "randomization",
      "primary metric",
      "guardrail",
      "minimum detectable effect",
      "stopping rule",
      "causality",
    ],
    "product operations": [
      "product ops",
      "product operations",
      "decision repository",
      "portfolio review",
    ],
  };
  for (const [group, topics] of Object.entries(requiredTopicGroups)) {
    for (const topic of topics) {
      if (!normalizedVisibleText.includes(topic)) {
        errors.push(`Course copy does not visibly cover ${group}: ${topic}.`);
      }
    }
  }
  if (/\b(?:todo|tbd|lorem ipsum|placeholder)\b/i.test(visibleText)) {
    errors.push("Visible Course 14 copy contains a placeholder token.");
  }

  for (const source of PRODUCT_MANAGEMENT_SOURCES) {
    if (!source.url.startsWith("https://")) errors.push(`${source.id}: source URL must use HTTPS.`);
    if (
      source.publisher === "PMaker"
      && !source.url.startsWith("https://pmaker.space/en/")
    ) {
      errors.push(`${source.id}: PMaker source must use its English /en/ route.`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(source.accessedOn)) errors.push(`${source.id}: accessed date is invalid.`);
    if (!source.supports.trim() || !source.boundary.trim()) errors.push(`${source.id}: evidence support and boundary are required.`);
  }
  for (const sourceId of allDeclaredSources) {
    if (!sourceSet.has(sourceId)) errors.push(`Manifest references missing source ${sourceId}.`);
  }
  const primaryCount = PRODUCT_MANAGEMENT_SOURCES.filter((source) => source.kind === "primary-course").length;
  const openSourceCount = PRODUCT_MANAGEMENT_SOURCES.filter((source) => source.kind === "open-source").length;
  if (primaryCount < 20) errors.push("PMaker source coverage is too narrow.");
  if (openSourceCount < 4) errors.push("Open-source product-management coverage is too narrow.");

  const requiredEvidenceMappings = [
    ["vision-strategy-business-model", 1, "gitlab-tiering-guidance"],
    ["prioritization-roadmaps-portfolio", 2, "gitlab-product-development-budgeting"],
    ["launch-go-to-market-growth", 0, "gitlab-tiering-guidance"],
    ["launch-go-to-market-growth", 2, "gitlab-deprecations-removals"],
    ["experimentation-operations-leadership", 2, "gitlab-product-development-budgeting"],
    ["experimentation-operations-leadership", 2, "gitlab-tiering-guidance"],
    ["experimentation-operations-leadership", 2, "gitlab-deprecations-removals"],
  ] as const;
  for (const [slug, sectionIndex, sourceId] of requiredEvidenceMappings) {
    const citedSourceIds = copy.modules[slug].sections[sectionIndex]?.sourceIds as
      | readonly string[]
      | undefined;
    const cited = citedSourceIds?.includes(sourceId);
    if (!cited) {
      errors.push(`${slug}: section ${sectionIndex + 1} must cite ${sourceId} for its material claim.`);
    }
  }

  const sourceSupportContracts = [
    ["gitlab-product-development-budgeting", /portfolio|investment|budget/i],
    ["gitlab-tiering-guidance", /pricing|packaging|tier/i],
    ["gitlab-deprecations-removals", /deprecat|removal|migration|sunset/i],
  ] as const;
  for (const [sourceId, supportPattern] of sourceSupportContracts) {
    const source = PRODUCT_MANAGEMENT_SOURCES.find((candidate) => candidate.id === sourceId);
    if (!source || !supportPattern.test(source.supports)) {
      errors.push(`${sourceId}: source support contract is missing or too vague.`);
    }
  }

  return errors;
}

export function assertValidProductManagementCourse(): void {
  const errors = validateProductManagementCourse();
  if (errors.length) {
    throw new Error(`Invalid Product Management course:\n${errors.join("\n")}`);
  }
}
