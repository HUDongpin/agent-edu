export type { ResponsibleAiModuleSlug, ResponsibleAiPhaseId } from "./modules";
export type { ResponsibleAiSourceId } from "./sources";
export type { ResponsibleAiQuestionId } from "./quiz";
export type { ResponsibleAiCapstoneArtifactId } from "./capstone";

export type ResponsibleAiCourseDefinition =
  typeof import("./definition").RESPONSIBLE_AI_COURSE;
