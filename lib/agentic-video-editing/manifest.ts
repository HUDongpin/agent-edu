import {
  AGENTIC_VIDEO_EDITING_COURSE_ID,
  AGENTIC_VIDEO_EDITING_DEFAULT_CONTENT_LOCALE,
  type AgenticVideoEditingCourseManifest,
  type AgenticVideoEditingModuleManifest,
  type AgenticVideoEditingPhaseManifest,
} from "./types";

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
      "deterministic-rendering",
      "agent-tools-mcp",
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
    systemRoles: ["agent-system", "agent-ready-tool", "deterministic-automation", "media-engine", "human-control"],
  },
  {
    slug: "media-ingest-provenance",
    order: 2,
    phaseId: "define",
    minutes: 65,
    sourceIds: ["ffmpeg", "timeline-studio", "qcut", "davinci-resolve-mcp"],
    systemRoles: ["media-engine", "agent-ready-tool", "human-control"],
  },
  {
    slug: "transcripts-shots-index",
    order: 3,
    phaseId: "understand",
    minutes: 75,
    sourceIds: ["video-use", "whisper", "whisperx", "pyscenedetect", "ffmpeg"],
    systemRoles: ["agent-ready-tool", "media-engine", "human-control"],
  },
  {
    slug: "semantic-analysis-director",
    order: 4,
    phaseId: "understand",
    minutes: 75,
    sourceIds: ["video-use", "videodb-director", "qwen3-vl", "x-video-use-release"],
    systemRoles: ["agent-system", "agent-ready-tool", "deterministic-automation", "human-control"],
  },
  {
    slug: "declarative-edit-plan",
    order: 5,
    phaseId: "edit",
    minutes: 80,
    sourceIds: ["opentimelineio", "veac", "video-edit-cli", "timeline-studio"],
    systemRoles: ["agent-ready-tool", "deterministic-automation", "human-control"],
  },
  {
    slug: "deterministic-rendering",
    order: 6,
    phaseId: "edit",
    minutes: 85,
    sourceIds: ["ffmpeg", "remotion", "remotion-skills", "x-remotion-skills"],
    systemRoles: ["media-engine", "agent-ready-tool", "deterministic-automation", "human-control"],
  },
  {
    slug: "agent-tools-mcp",
    order: 7,
    phaseId: "edit",
    minutes: 75,
    sourceIds: ["montaj", "qcut", "velorn", "davinci-resolve-mcp", "x-davinci-mcp"],
    systemRoles: ["agent-ready-tool", "agent-system", "human-control"],
  },
  {
    slug: "captions-audio-formats",
    order: 8,
    phaseId: "edit",
    minutes: 70,
    sourceIds: ["whisperx", "remotion", "ffmpeg", "auto-editor"],
    systemRoles: ["agent-ready-tool", "deterministic-automation", "media-engine", "human-control"],
  },
  {
    slug: "verification-human-review",
    order: 9,
    phaseId: "verify",
    minutes: 75,
    sourceIds: ["vmaf", "ffmpeg", "timeline-studio", "davinci-resolve-mcp", "x-creator-workflow-guide"],
    systemRoles: ["agent-ready-tool", "human-control"],
  },
  {
    slug: "production-capstone",
    order: 10,
    phaseId: "verify",
    minutes: 90,
    sourceIds: ["videodb-director", "opentimelineio", "ffmpeg", "mosaic-skills", "x-mosaic-slack"],
    systemRoles: ["agent-system", "agent-ready-tool", "media-engine", "human-control"],
  },
] as const satisfies readonly AgenticVideoEditingModuleManifest[];

export const AGENTIC_VIDEO_EDITING_COURSE_MANIFEST = {
  id: AGENTIC_VIDEO_EDITING_COURSE_ID,
  version: "1.1.0",
  displayNumber: 20,
  publishedOn: "2026-08-26",
  researchCutoff: "2026-08-26",
  defaultContentLocale: AGENTIC_VIDEO_EDITING_DEFAULT_CONTENT_LOCALE,
  phases: AGENTIC_VIDEO_EDITING_PHASES,
  modules: AGENTIC_VIDEO_EDITING_MODULES,
} as const satisfies AgenticVideoEditingCourseManifest;
