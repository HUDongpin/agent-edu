export type { AiPythonDataModuleSlug, AiPythonDataPhaseId } from "./modules";
export type { AiPythonDataSourceId } from "./sources";
export type { AiPythonDataQuestionId } from "./quiz";
export type { AiPythonDataCapstoneArtifactId } from "./capstone";

export type AiPythonDataCourseDefinition =
  typeof import("./definition").AI_PYTHON_DATA_COURSE;
