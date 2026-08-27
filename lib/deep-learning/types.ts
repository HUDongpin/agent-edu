export type { DeepLearningModuleSlug } from "./modules";
export type { DeepLearningSourceId } from "./sources";
export type { DeepLearningQuestionId } from "./quiz";
export type { DeepLearningCapstoneArtifactId } from "./capstone";

export type DeepLearningCourseDefinition =
  typeof import("./definition").DEEP_LEARNING_COURSE;
