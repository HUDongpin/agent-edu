import {
  AGENTIC_VIDEO_EDITING_COURSE_ID,
  AGENTIC_VIDEO_EDITING_DEFAULT_CONTENT_LOCALE,
  type AgenticVideoEditingCourseManifest,
  type AgenticVideoEditingModuleManifest,
  type AgenticVideoEditingPhaseManifest,
} from "./types";

function artifactContract(
  slug: import("./types").AgenticVideoEditingModuleSlug,
  prerequisiteModuleSlugs: readonly import("./types").AgenticVideoEditingModuleSlug[],
  producesArtifactIds: readonly [string, ...string[]],
  consumesArtifactIds: readonly string[],
) {
  const projectFlag = slug === "production-capstone" ? "--learner-final" : "--guided-project";
  return {
    prerequisiteModuleSlugs,
    producesArtifactIds,
    consumesArtifactIds,
    artifactSchemaId: `aicourse.agentic-video-editing.module.${slug}.artifact.v2`,
    validatorId: `aicourse.agentic-video-editing.module.${slug}.v2`,
    validatorCommand: `node --import tsx scripts/check-agentic-video-editing-course.mjs ${projectFlag} <project-root> --module ${slug} --artifact-id <artifact-id> --artifact <artifact-path> --validated-at <validated-at>`,
    completionMode: "validated-artifact" as const,
  };
}

export const AGENTIC_VIDEO_EDITING_PHASES = [
  {
    id: "define",
    order: 1,
    moduleSlugs: ["agentic-editing-contract", "media-ingest-provenance"],
  },
  {
    id: "understand",
    order: 2,
    moduleSlugs: ["transcripts-shots-index", "semantic-analysis-director"],
  },
  {
    id: "edit",
    order: 3,
    moduleSlugs: [
      "declarative-edit-plan",
      "agent-tools-mcp",
      "deterministic-rendering",
      "captions-audio-formats",
    ],
  },
  {
    id: "verify",
    order: 4,
    moduleSlugs: ["verification-human-review", "production-capstone"],
  },
] as const satisfies readonly AgenticVideoEditingPhaseManifest[];

export const AGENTIC_VIDEO_EDITING_MODULES = [
  {
    slug: "agentic-editing-contract",
    order: 1,
    phaseId: "define",
    minutes: 60,
    sourceIds: ["video-use", "videodb-director", "montaj", "x-video-use-release"],
    systemRoles: ["agent-system", "agent-ready-tool", "code-directed-workflow", "media-engine", "human-control"],
    ...artifactContract("agentic-editing-contract", [], ["creative-brief"], []),
  },
  {
    slug: "media-ingest-provenance",
    order: 2,
    phaseId: "define",
    minutes: 65,
    sourceIds: ["ffmpeg", "ffprobe-docs", "timeline-studio", "qcut", "davinci-resolve-mcp", "iptc-vmh-1-7", "c2pa-2-4"],
    systemRoles: ["media-engine", "agent-ready-tool", "human-control"],
    ...artifactContract(
      "media-ingest-provenance",
      ["agentic-editing-contract"],
      ["media-manifest", "clock-receipt"],
      ["creative-brief"],
    ),
  },
  {
    slug: "transcripts-shots-index",
    order: 3,
    phaseId: "understand",
    minutes: 75,
    sourceIds: ["video-use", "whisper", "whisperx", "pyscenedetect", "ffmpeg", "ffprobe-docs"],
    systemRoles: ["agent-ready-tool", "media-engine", "human-control"],
    ...artifactContract(
      "transcripts-shots-index",
      ["media-ingest-provenance"],
      ["transcript-shot-index"],
      ["media-manifest", "clock-receipt"],
    ),
  },
  {
    slug: "semantic-analysis-director",
    order: 4,
    phaseId: "understand",
    minutes: 75,
    sourceIds: ["video-use", "videodb-director", "qwen3-vl", "qwen3-vl-issue-1761", "x-video-use-release"],
    systemRoles: ["agent-system", "agent-ready-tool", "code-directed-workflow", "human-control"],
    ...artifactContract(
      "semantic-analysis-director",
      ["transcripts-shots-index"],
      ["candidate-segments"],
      ["transcript-shot-index"],
    ),
  },
  {
    slug: "declarative-edit-plan",
    order: 5,
    phaseId: "edit",
    minutes: 80,
    sourceIds: ["opentimelineio", "veac", "video-edit-cli", "timeline-studio"],
    systemRoles: ["agent-ready-tool", "code-directed-workflow", "human-control"],
    ...artifactContract(
      "declarative-edit-plan",
      ["semantic-analysis-director"],
      ["edit-plan"],
      ["candidate-segments"],
    ),
  },
  {
    slug: "agent-tools-mcp",
    order: 6,
    phaseId: "edit",
    minutes: 75,
    sourceIds: ["montaj", "qcut", "velorn", "davinci-resolve-mcp", "x-davinci-mcp", "mcp-2026-07-28"],
    systemRoles: ["agent-ready-tool", "agent-system", "human-control"],
    ...artifactContract(
      "agent-tools-mcp",
      ["declarative-edit-plan"],
      ["tool-permission-envelope"],
      ["edit-plan"],
    ),
  },
  {
    slug: "deterministic-rendering",
    order: 7,
    phaseId: "edit",
    minutes: 85,
    sourceIds: ["ffmpeg", "ffmpeg-docs", "remotion", "remotion-skills", "x-remotion-skills"],
    systemRoles: ["media-engine", "agent-ready-tool", "code-directed-workflow", "human-control"],
    ...artifactContract(
      "deterministic-rendering",
      ["agent-tools-mcp"],
      ["render-receipt"],
      ["tool-permission-envelope"],
    ),
  },
  {
    slug: "captions-audio-formats",
    order: 8,
    phaseId: "edit",
    minutes: 70,
    sourceIds: ["whisperx", "remotion", "ffmpeg", "ffmpeg-docs", "auto-editor", "w3c-captions-guidance", "wcag22-captions-prerecorded"],
    systemRoles: ["agent-ready-tool", "code-directed-workflow", "media-engine", "human-control"],
    ...artifactContract(
      "captions-audio-formats",
      ["deterministic-rendering"],
      ["delivery-matrix", "variant-receipts"],
      ["render-receipt"],
    ),
  },
  {
    slug: "verification-human-review",
    order: 9,
    phaseId: "verify",
    minutes: 75,
    sourceIds: ["vmaf", "ffprobe-docs", "ffmpeg-docs", "timeline-studio", "davinci-resolve-mcp", "x-creator-workflow-guide"],
    systemRoles: ["agent-ready-tool", "human-control"],
    ...artifactContract(
      "verification-human-review",
      ["captions-audio-formats"],
      ["verification-report"],
      ["delivery-matrix", "variant-receipts"],
    ),
  },
  {
    slug: "production-capstone",
    order: 10,
    phaseId: "verify",
    minutes: 90,
    sourceIds: ["videodb-director", "opentimelineio", "ffmpeg", "mosaic-skills", "mosaic-api-docs", "mosaic-legal-policy", "iptc-vmh-1-7", "c2pa-2-4", "x-mosaic-slack"],
    systemRoles: ["agent-system", "agent-ready-tool", "media-engine", "human-control"],
    ...artifactContract(
      "production-capstone",
      ["verification-human-review"],
      ["production-dossier", "release-decision"],
      [
        "capstone-creative-brief",
        "capstone-media-manifest",
        "capstone-clock-receipt",
        "capstone-transcript-shot-index",
        "capstone-candidate-segments",
        "capstone-edit-plan",
        "capstone-tool-permission-envelope",
        "capstone-render-receipt",
        "capstone-delivery-matrix",
        "capstone-variant-receipts",
        "capstone-verification-report",
      ],
    ),
  },
] as const satisfies readonly AgenticVideoEditingModuleManifest[];

export const AGENTIC_VIDEO_EDITING_COURSE_MANIFEST = {
  id: AGENTIC_VIDEO_EDITING_COURSE_ID,
  version: "2.0.0",
  displayNumber: 22,
  publishedOn: "2026-08-28",
  researchCutoff: "2026-08-28",
  defaultContentLocale: AGENTIC_VIDEO_EDITING_DEFAULT_CONTENT_LOCALE,
  phases: AGENTIC_VIDEO_EDITING_PHASES,
  modules: AGENTIC_VIDEO_EDITING_MODULES,
} as const satisfies AgenticVideoEditingCourseManifest;
