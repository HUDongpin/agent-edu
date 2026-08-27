export type { ProductionAiModuleSlug } from "./modules";
export type { ProductionAiSourceId } from "./sources";
export type { ProductionAiQuestionId } from "./quiz";
export type { ProductionAiCapstoneArtifactId } from "./capstone";

export type ProductionAiCourseDefinition =
  typeof import("./definition").PRODUCTION_AI_COURSE;
