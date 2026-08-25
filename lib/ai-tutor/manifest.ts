import {
  AI_TUTOR_CONTENT_LOCALE,
  AI_TUTOR_COURSE_ID,
  type AiTutorCourseManifest,
  type AiTutorModuleManifest,
  type AiTutorPhaseManifest,
} from "./types";

export const AI_TUTOR_PHASES = [
  {
    id: "frame",
    order: 1,
    moduleSlugs: ["objectives-concept-map", "diagnostic-engine"],
  },
  {
    id: "adapt",
    order: 2,
    moduleSlugs: ["adaptive-scaffolding", "formative-assessment-loop"],
  },
  {
    id: "validate",
    order: 3,
    moduleSlugs: ["item-validation", "learner-modeling"],
  },
  {
    id: "govern",
    order: 4,
    moduleSlugs: ["learning-impact-experiment", "safety-teacher-oversight"],
  },
] as const satisfies readonly AiTutorPhaseManifest[];

export const AI_TUTOR_MODULES = [
  {
    slug: "objectives-concept-map",
    order: 1,
    phaseId: "frame",
    minutes: 50,
    sourceIds: [
      "constructive-alignment",
      "concept-mapping",
      "evidence-centered-design",
      "testing-standards",
    ],
  },
  {
    slug: "diagnostic-engine",
    order: 2,
    phaseId: "frame",
    minutes: 55,
    sourceIds: ["evidence-centered-design", "apa-formative-assessment", "testing-standards"],
  },
  {
    slug: "adaptive-scaffolding",
    order: 3,
    phaseId: "adapt",
    minutes: 50,
    sourceIds: ["scaffolding-review", "unesco-genai-guidance"],
  },
  {
    slug: "formative-assessment-loop",
    order: 4,
    phaseId: "adapt",
    minutes: 50,
    sourceIds: [
      "apa-formative-assessment",
      "evidence-centered-design",
      "constructive-alignment",
      "testing-standards",
    ],
  },
  {
    slug: "item-validation",
    order: 5,
    phaseId: "validate",
    minutes: 60,
    sourceIds: ["testing-standards", "apa-formative-assessment", "evidence-centered-design"],
  },
  {
    slug: "learner-modeling",
    order: 6,
    phaseId: "validate",
    minutes: 60,
    sourceIds: [
      "knowledge-tracing",
      "negotiated-learner-modeling",
      "testing-standards",
      "nist-ai-rmf",
    ],
  },
  {
    slug: "learning-impact-experiment",
    order: 7,
    phaseId: "govern",
    minutes: 65,
    sourceIds: [
      "wwc-standards",
      "constructive-alignment",
      "unesco-genai-guidance",
      "nist-ai-rmf",
    ],
  },
  {
    slug: "safety-teacher-oversight",
    order: 8,
    phaseId: "govern",
    minutes: 60,
    sourceIds: ["unesco-genai-guidance", "nist-ai-rmf", "testing-standards"],
  },
] as const satisfies readonly AiTutorModuleManifest[];

export const AI_TUTOR_CONCEPT_EDGES = [
  { from: "objectives-concept-map", to: "diagnostic-engine", relationId: "defines-evidence" },
  { from: "diagnostic-engine", to: "adaptive-scaffolding", relationId: "selects-support" },
  { from: "adaptive-scaffolding", to: "formative-assessment-loop", relationId: "creates-response" },
  { from: "item-validation", to: "formative-assessment-loop", relationId: "audits-signal" },
  { from: "item-validation", to: "learner-modeling", relationId: "strengthens-inference" },
  { from: "learner-modeling", to: "adaptive-scaffolding", relationId: "updates-action" },
  {
    from: "learner-modeling",
    to: "learning-impact-experiment",
    relationId: "provides-adaptation-state",
  },
  { from: "learning-impact-experiment", to: "safety-teacher-oversight", relationId: "supports-release" },
  { from: "safety-teacher-oversight", to: "objectives-concept-map", relationId: "revises-contract" },
] as const;

export const AI_TUTOR_COURSE_MANIFEST = {
  id: AI_TUTOR_COURSE_ID,
  version: "1.0.0",
  displayNumber: 13,
  publishedOn: "2026-08-23",
  contentLocale: AI_TUTOR_CONTENT_LOCALE,
  phases: AI_TUTOR_PHASES,
  modules: AI_TUTOR_MODULES,
  conceptEdges: AI_TUTOR_CONCEPT_EDGES,
} as const satisfies AiTutorCourseManifest;
