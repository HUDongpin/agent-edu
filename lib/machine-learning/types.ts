export type { MachineLearningModuleSlug, MachineLearningPhaseId } from "./modules";
export type { MachineLearningSourceId } from "./sources";
export type { MachineLearningQuestionId } from "./quiz";
export type { MachineLearningCapstoneArtifactId } from "./capstone";

export type MachineLearningCourseDefinition =
  typeof import("./definition").MACHINE_LEARNING_COURSE;
