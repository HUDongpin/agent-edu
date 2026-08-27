import type {
  CursorFigureId,
  CursorFigureManifest,
  CursorLessonSlug,
  CursorOriginalDiagramFigure,
  CursorSourceId,
} from "./types";

const privacyChecklist = [
  "Visible SVG artwork composed only of course-authored geometry and language-neutral numerals",
  "No third-party pixels, screenshots, logos, trademarks, avatars, or product trade dress",
  "No real person, repository, path, account, request, document, credential, or learner-supplied content",
  "No external image, font, script, foreignObject, or remote runtime dependency",
] as const;

type OriginalFigureInput = {
  readonly id: CursorFigureId;
  readonly lessonSlug: CursorLessonSlug;
  readonly surface: CursorFigureManifest["surface"];
  readonly teachingIntent: string;
  readonly sha256: string;
  readonly evidenceSourceIds: readonly [CursorSourceId, ...CursorSourceId[]];
};

function originalFigure(
  input: OriginalFigureInput,
): CursorOriginalDiagramFigure {
  return {
    ...input,
    kind: "course-original-diagram",
    status: "available",
    rightsStatus: "original-authorship-reviewed",
    src: `/courses/cursor/${input.id}-concept.svg`,
    width: 1600,
    height: 900,
    createdOn: "2026-08-26",
    diagramVersion: "1.1",
    author: "aicourse.top course team",
    license: "MIT",
    noticePath: "/courses/cursor/THIRD_PARTY_NOTICES.md",
    rightsPath: "/courses/cursor/figure-rights.json",
    provenancePath: "/courses/cursor/figure-provenance.json",
    privacyChecklist,
    altKey: `figures.${input.id}.alt`,
    captionKey: `figures.${input.id}.caption`,
  };
}

/**
 * Course-original conceptual diagrams. Official Cursor sources support the
 * surrounding teaching claims, but no source image, screenshot, or trade dress
 * is reproduced in these assets.
 */
export const CURSOR_FIGURES = [
  originalFigure({
    id: "fig-01",
    lessonSlug: "orient-privacy",
    surface: "app",
    teachingIntent:
      "Show nested workspace, execution, and privacy boundaries before a learner grants an agent access.",
    sha256: "815aee14722838f9242f3204e6adf272920aba2cc7c6d777e91d6d81de2c69a7",
    evidenceSourceIds: ["cursor-agents-window", "cursor-data-use"],
  }),
  originalFigure({
    id: "fig-02",
    lessonSlug: "tab-inline-edit",
    surface: "app",
    teachingIntent:
      "Represent a proposed multi-line edit as reviewable ghost content with explicit accept and reject paths.",
    sha256: "66b38379a6590b82a19a6fce715712e68b9e894b4b4dfb76480518710094ea49",
    evidenceSourceIds: ["cursor-tab", "cursor-inline-edit"],
  }),
  originalFigure({
    id: "fig-03",
    lessonSlug: "agent-interface",
    surface: "app",
    teachingIntent:
      "Connect an agent claim to inspectable repository evidence rather than depicting a real product conversation.",
    sha256: "9d496de5c3b0f032fa064609550f5ac19a301b476305341c0d36c67976994ced",
    evidenceSourceIds: ["cursor-agent-overview", "cursor-prompting"],
  }),
  originalFigure({
    id: "fig-04",
    lessonSlug: "task-contracts",
    surface: "app",
    teachingIntent:
      "Break an ambitious goal into scope, inputs, boundaries, and acceptance checks before tool execution.",
    sha256: "dbe87b1e3f37fb52dc1eb9a97461605818eafeea16ac0fa790330be019f5538d",
    evidenceSourceIds: ["cursor-prompting", "cursor-planning"],
  }),
  originalFigure({
    id: "fig-05",
    lessonSlug: "plan-execute-steer",
    surface: "app",
    teachingIntent:
      "Show plan, human review, execution, verification, and steering as a reversible evidence loop.",
    sha256: "ce4939de4886747ab4f847626f2a15d98d29866e23568d9cb1c5ab9efdff6082",
    evidenceSourceIds: ["cursor-planning", "cursor-agent-review"],
  }),
  originalFigure({
    id: "fig-06",
    lessonSlug: "test-review-recover",
    surface: "app",
    teachingIntent:
      "Converge parallel changes through diff review and tests while retaining a visible recovery path.",
    sha256: "4dbab6190bcf72f15c204a4369b6c6bc2434112739fc597e301e01f8331090d0",
    evidenceSourceIds: ["cursor-agent-review", "cursor-debugging"],
  }),
  originalFigure({
    id: "fig-07",
    lessonSlug: "rules-skills-mcp",
    surface: "web",
    teachingIntent:
      "Separate durable rules, procedural skills, and external tool boundaries around one governed task.",
    sha256: "91f4684a38c747f0775780d9bfadf0ccb2fa11fcd14c75e80cca5b02b6045095",
    evidenceSourceIds: ["cursor-rules", "cursor-skills", "cursor-mcp"],
  }),
  originalFigure({
    id: "fig-08",
    lessonSlug: "cloud-parallel",
    surface: "cloud",
    teachingIntent:
      "Make the local-to-cloud execution handoff, environment change, and approval point visible without copying product UI.",
    sha256: "103f44b8b47e75c2b6602a9b18d430a02f3fc612f902356b9c96a3cdc4a006c5",
    evidenceSourceIds: ["cursor-cloud-agents", "cursor-run-modes"],
  }),
  originalFigure({
    id: "fig-09",
    lessonSlug: "software-studio",
    surface: "web",
    teachingIntent:
      "Show an allowlisted local browser boundary with an explicit permitted and blocked destination.",
    sha256: "e9a4e477ab734e7632a7ae76c3a90afac0c70d26cc13833856fb032241f8e894",
    evidenceSourceIds: ["cursor-browser", "cursor-agent-security"],
  }),
  originalFigure({
    id: "fig-10",
    lessonSlug: "research-studio",
    surface: "app",
    teachingIntent:
      "Trace search results through source inspection into a bounded claim instead of presenting search as proof.",
    sha256: "9b7a4af8185db4160cf9cb3a3d8ef702f3f8a2034fd23e86e5e6682e65a8213a",
    evidenceSourceIds: ["cursor-prompting", "cursor-browser"],
  }),
  originalFigure({
    id: "fig-11",
    lessonSlug: "writing-studio",
    surface: "app",
    teachingIntent:
      "Represent evidence review, outline, draft, style review, and integrity checks as distinct writing stages.",
    sha256: "53ddad73203ef5a542479e74d9bccb6c5dfc1e8a24db686720bf9c11b3d6e799",
    evidenceSourceIds: ["cursor-prompting", "cursor-rules"],
  }),
  originalFigure({
    id: "fig-12",
    lessonSlug: "office-studio",
    surface: "app",
    teachingIntent:
      "Place a human approval gate between approved office files and connected tools or integrations.",
    sha256: "f26bda549dee229abc340bec085bb89af187a7d6a547d97432ee8953f890f309",
    evidenceSourceIds: ["cursor-skills", "cursor-google-workspace", "cursor-mcp"],
  }),
  originalFigure({
    id: "fig-13",
    lessonSlug: "teaching-studio",
    surface: "app",
    teachingIntent:
      "Keep a synthetic teaching workspace inside an explicit boundary and separate it from external sources.",
    sha256: "f8e547aeacdd70a76ef7c338e02e6b7e17c91a4db13f4e50cbd032e31c961ea0",
    evidenceSourceIds: ["cursor-students", "cursor-data-use"],
  }),
  originalFigure({
    id: "fig-14",
    lessonSlug: "workflow-capstone",
    surface: "cloud",
    teachingIntent:
      "Link scope, implementation, verification, and handoff evidence to one bounded capstone receipt.",
    sha256: "70566efad58d7aa7ed8b6398e3e42393af1d12410b7165dc40b465ebb04f9f38",
    evidenceSourceIds: [
      "cursor-cloud-builds",
      "cursor-agent-review",
      "course-capstone-fixture",
    ],
  }),
] as const satisfies readonly CursorOriginalDiagramFigure[];

export const CURSOR_FIGURE_BY_ID = Object.fromEntries(
  CURSOR_FIGURES.map((item) => [item.id, item]),
) as unknown as Readonly<Record<CursorFigureId, CursorFigureManifest>>;
