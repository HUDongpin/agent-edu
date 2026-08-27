import {
  CREATOR_OPS_COURSE_ID,
  CREATOR_OPS_DEFAULT_CONTENT_LOCALE,
  type CreatorOpsCourseManifest,
  type CreatorOpsModuleManifest,
  type CreatorOpsPhaseManifest,
} from "./types";

export const CREATOR_OPS_PHASES = [
  {
    id: "radar",
    order: 1,
    moduleSlugs: [
      "outcomes-operating-system",
      "audience-signal-radar",
      "evidence-research-packet",
    ],
  },
  {
    id: "studio",
    order: 2,
    moduleSlugs: [
      "editorial-agent-architecture",
      "writing-brand-fact-gates",
      "multimodal-asset-pipeline",
    ],
  },
  {
    id: "publish",
    order: 3,
    moduleSlugs: [
      "repurpose-content-assets",
      "human-approved-distribution",
    ],
  },
  {
    id: "learn",
    order: 4,
    moduleSlugs: [
      "community-analytics-loop",
      "evaluation-governance-capstone",
    ],
  },
] as const satisfies readonly CreatorOpsPhaseManifest[];

export const CREATOR_OPS_MODULES = [
  {
    slug: "outcomes-operating-system",
    order: 1,
    phaseId: "radar",
    minutes: 55,
    sourceIds: ["openai-agents", "langgraph", "activepieces", "umami", "langfuse", "scancode"],
  },
  {
    slug: "audience-signal-radar",
    order: 2,
    phaseId: "radar",
    minutes: 65,
    sourceIds: ["rsshub", "trendradar", "crawl4ai", "open-deep-research"],
  },
  {
    slug: "evidence-research-packet",
    order: 3,
    phaseId: "radar",
    minutes: 70,
    sourceIds: ["open-deep-research", "crawl4ai", "markitdown", "scancode"],
  },
  {
    slug: "editorial-agent-architecture",
    order: 4,
    phaseId: "studio",
    minutes: 75,
    sourceIds: ["openai-agents", "langgraph", "activepieces", "prefect", "langfuse"],
  },
  {
    slug: "writing-brand-fact-gates",
    order: 5,
    phaseId: "studio",
    minutes: 70,
    sourceIds: ["promptfoo", "nemoguardrails", "langfuse", "markitdown"],
  },
  {
    slug: "multimodal-asset-pipeline",
    order: 6,
    phaseId: "studio",
    minutes: 85,
    sourceIds: ["comfyui", "diffusers", "whisper", "cosyvoice", "ffmpeg", "c2pa-rs", "scancode"],
  },
  {
    slug: "repurpose-content-assets",
    order: 7,
    phaseId: "publish",
    minutes: 60,
    sourceIds: ["ffmpeg", "markitdown", "whisper", "mixpost", "c2pa-rs"],
  },
  {
    slug: "human-approved-distribution",
    order: 8,
    phaseId: "publish",
    minutes: 70,
    sourceIds: ["mixpost", "activepieces", "playwright", "browser-use", "prefect"],
  },
  {
    slug: "community-analytics-loop",
    order: 9,
    phaseId: "learn",
    minutes: 65,
    sourceIds: ["umami", "langfuse", "rsshub", "mixpost", "promptfoo"],
  },
  {
    slug: "evaluation-governance-capstone",
    order: 10,
    phaseId: "learn",
    minutes: 95,
    sourceIds: ["promptfoo", "langfuse", "c2pa-rs", "scancode", "umami", "openai-agents"],
  },
] as const satisfies readonly CreatorOpsModuleManifest[];

export const CREATOR_OPS_COURSE_MANIFEST = {
  id: CREATOR_OPS_COURSE_ID,
  version: "1.0.2",
  displayNumber: 16,
  releaseState: "staged",
  authoredOn: "2026-08-26",
  defaultContentLocale: CREATOR_OPS_DEFAULT_CONTENT_LOCALE,
  phases: CREATOR_OPS_PHASES,
  modules: CREATOR_OPS_MODULES,
} as const satisfies CreatorOpsCourseManifest;
