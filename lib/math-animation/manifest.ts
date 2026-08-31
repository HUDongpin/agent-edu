import {
  MATH_ANIMATION_COURSE_ID,
  MATH_ANIMATION_VERSION,
  type MathAnimationCourseManifest,
  type MathAnimationModuleManifest,
  type MathAnimationPhaseManifest,
} from "./types";

export const MATH_ANIMATION_PHASES = [
  {
    id: "frame",
    order: 1,
    moduleSlugs: [
      "outcome-before-engine",
      "repository-evidence-lab",
      "scene-contract-storyboard",
    ],
  },
  {
    id: "animate",
    order: 2,
    moduleSlugs: [
      "manim-environment-first-scene",
      "transformations-camera-continuity",
      "equations-graphs-geometry",
    ],
  },
  {
    id: "direct",
    order: 3,
    moduleSlugs: [
      "codex-implementation-loop",
      "claude-direction-review",
      "motion-canvas-web-track",
    ],
  },
  {
    id: "prove",
    order: 4,
    moduleSlugs: [
      "voice-slides-remotion",
      "mathematical-visual-accessibility-qa",
      "capstone-release-pack",
    ],
  },
] as const satisfies readonly MathAnimationPhaseManifest[];

export const MATH_ANIMATION_MODULES = [
  {
    slug: "outcome-before-engine",
    order: 1,
    phaseId: "frame",
    minutes: 60,
    sourceIds: [
      "github-manim-ce",
      "github-motion-canvas",
      "github-remotion",
      "x-minchoi-claude-manim",
    ],
  },
  {
    slug: "repository-evidence-lab",
    order: 2,
    phaseId: "frame",
    minutes: 55,
    sourceIds: [
      "github-manim-ce",
      "github-manimgl",
      "github-manim-slides",
      "github-manim-voiceover",
      "github-motion-canvas",
      "github-remotion",
      "github-mafs",
      "github-jsxgraph",
    ],
  },
  {
    slug: "scene-contract-storyboard",
    order: 3,
    phaseId: "frame",
    minutes: 60,
    sourceIds: [
      "github-3b1b-videos-claude",
      "openai-codex-use-cases",
      "anthropic-claude-memory",
    ],
    codeExampleId: "scene-contract",
  },
  {
    slug: "manim-environment-first-scene",
    order: 4,
    phaseId: "animate",
    minutes: 75,
    sourceIds: [
      "github-manim-ce",
      "docs-manim-quickstart",
      "ffmpeg-general",
    ],
    codeExampleId: "manim-first-scene",
  },
  {
    slug: "transformations-camera-continuity",
    order: 5,
    phaseId: "animate",
    minutes: 65,
    sourceIds: ["github-manim-ce", "github-manimgl"],
    codeExampleId: "manim-transform",
  },
  {
    slug: "equations-graphs-geometry",
    order: 6,
    phaseId: "animate",
    minutes: 70,
    sourceIds: ["github-manim-ce", "docs-manim-quickstart"],
    codeExampleId: "manim-graph",
  },
  {
    slug: "codex-implementation-loop",
    order: 7,
    phaseId: "direct",
    minutes: 60,
    sourceIds: [
      "openai-codex-use-cases",
      "openai-model-guidance",
      "github-manim-ce",
    ],
    codeExampleId: "agent-instructions",
  },
  {
    slug: "claude-direction-review",
    order: 8,
    phaseId: "direct",
    minutes: 60,
    sourceIds: [
      "anthropic-claude-code-overview",
      "anthropic-claude-memory",
      "github-3b1b-videos-claude",
      "x-minchoi-claude-manim",
      "x-cintas-claude-pythagoras",
      "x-dhruv-math-animation-thread",
    ],
  },
  {
    slug: "motion-canvas-web-track",
    order: 9,
    phaseId: "direct",
    minutes: 75,
    sourceIds: [
      "github-motion-canvas",
      "docs-motion-canvas-quickstart",
      "github-mafs",
      "github-jsxgraph",
    ],
    codeExampleId: "motion-canvas-scene",
  },
  {
    slug: "voice-slides-remotion",
    order: 10,
    phaseId: "prove",
    minutes: 70,
    sourceIds: [
      "github-manim-voiceover",
      "github-manim-slides",
      "github-remotion",
      "github-remotion-skills",
      "x-remotion-agent-skills",
      "x-tobi-manim-skill",
      "ffmpeg-general",
    ],
    codeExampleId: "ffmpeg-export",
  },
  {
    slug: "mathematical-visual-accessibility-qa",
    order: 11,
    phaseId: "prove",
    minutes: 65,
    sourceIds: [
      "w3c-animation-interactions",
      "ffmpeg-general",
      "github-manim-ce",
      "github-motion-canvas",
    ],
    codeExampleId: "qa-script",
  },
  {
    slug: "capstone-release-pack",
    order: 12,
    phaseId: "prove",
    minutes: 90,
    sourceIds: [
      "github-manim-ce",
      "github-motion-canvas",
      "openai-codex-use-cases",
      "anthropic-claude-code-overview",
      "w3c-animation-interactions",
    ],
  },
] as const satisfies readonly MathAnimationModuleManifest[];

export const MATH_ANIMATION_COURSE_MANIFEST = {
  id: MATH_ANIMATION_COURSE_ID,
  version: MATH_ANIMATION_VERSION,
  displayNumber: 19,
  publishedOn: "2026-08-26",
  modules: MATH_ANIMATION_MODULES,
  phases: MATH_ANIMATION_PHASES,
} as const satisfies MathAnimationCourseManifest;

export const MATH_ANIMATION_TOTAL_MINUTES = MATH_ANIMATION_MODULES.reduce(
  (total, module) => total + module.minutes,
  0,
);
