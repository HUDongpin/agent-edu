export type { AiResearchModuleSlug, AiResearchPhaseId } from "./modules";
export type { AiResearchSourceId } from "./sources";
export type { AiResearchQuestionId } from "./quiz";
export type { AiResearchCapstoneArtifactId } from "./capstone";

export type AiResearchCourseDefinition =
  typeof import("./definition").AI_RESEARCH_COURSE;
