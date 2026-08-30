import {
  GITHUB_QUIZ_IDS,
  GITHUB_QUIZ_STORAGE_KEYS,
  type GithubQuizId,
  type GithubQuizManifest,
} from "./types";

export const GITHUB_QUIZ = [
  {
    id: "q01",
    lessonSlug: "start-secure",
    unitId: "unit-1",
    correctIndex: 1,
    sourceIds: ["github-about-repositories"],
  },
  {
    id: "q02",
    lessonSlug: "start-secure",
    unitId: "unit-1",
    correctIndex: 2,
    sourceIds: ["github-sensitive-data"],
  },
  {
    id: "q03",
    lessonSlug: "repository-readme",
    unitId: "unit-1",
    correctIndex: 0,
    sourceIds: ["github-create-repository"],
  },
  {
    id: "q04",
    lessonSlug: "repository-readme",
    unitId: "unit-1",
    correctIndex: 3,
    sourceIds: ["github-markdown"],
  },
  {
    id: "q05",
    lessonSlug: "branches-commits",
    unitId: "unit-1",
    correctIndex: 1,
    sourceIds: ["github-flow", "github-branches"],
  },
  {
    id: "q06",
    lessonSlug: "branches-commits",
    unitId: "unit-1",
    correctIndex: 2,
    sourceIds: ["github-commits"],
  },
  {
    id: "q07",
    lessonSlug: "pull-requests-reviews",
    unitId: "unit-1",
    correctIndex: 0,
    sourceIds: ["github-pull-requests"],
  },
  {
    id: "q08",
    lessonSlug: "pull-requests-reviews",
    unitId: "unit-1",
    correctIndex: 3,
    sourceIds: ["github-review-pull-request", "github-repository-roles"],
  },
  {
    id: "q09",
    lessonSlug: "issues-discussions",
    unitId: "unit-2",
    correctIndex: 2,
    sourceIds: ["github-issues", "github-discussions"],
  },
  {
    id: "q10",
    lessonSlug: "issues-discussions",
    unitId: "unit-2",
    correctIndex: 1,
    sourceIds: ["github-team-planning", "github-issues"],
  },
  {
    id: "q11",
    lessonSlug: "projects-office-work",
    unitId: "unit-2",
    correctIndex: 0,
    sourceIds: ["github-projects"],
  },
  {
    id: "q12",
    lessonSlug: "projects-office-work",
    unitId: "unit-2",
    correctIndex: 3,
    sourceIds: ["github-sensitive-data"],
  },
  {
    id: "q13",
    lessonSlug: "forks-conflicts",
    unitId: "unit-2",
    correctIndex: 1,
    sourceIds: ["github-forks"],
  },
  {
    id: "q14",
    lessonSlug: "forks-conflicts",
    unitId: "unit-2",
    correctIndex: 2,
    sourceIds: ["github-merge-conflicts"],
  },
  {
    id: "q15",
    lessonSlug: "notifications-governance",
    unitId: "unit-2",
    correctIndex: 0,
    sourceIds: ["github-notifications"],
  },
  {
    id: "q16",
    lessonSlug: "notifications-governance",
    unitId: "unit-2",
    correctIndex: 3,
    sourceIds: ["github-sensitive-data"],
  },
  {
    id: "q17",
    lessonSlug: "software-automation",
    unitId: "unit-3",
    correctIndex: 2,
    sourceIds: ["github-connecting"],
  },
  {
    id: "q18",
    lessonSlug: "software-automation",
    unitId: "unit-3",
    correctIndex: 1,
    sourceIds: ["github-actions-quickstart", "github-actions-security"],
  },
  {
    id: "q19",
    lessonSlug: "research-reproducibility",
    unitId: "unit-3",
    correctIndex: 0,
    sourceIds: ["github-citation-files"],
  },
  {
    id: "q20",
    lessonSlug: "research-reproducibility",
    unitId: "unit-3",
    correctIndex: 3,
    sourceIds: [
      "github-releases",
      "github-immutable-releases",
      "zenodo-github",
    ],
  },
  {
    id: "q21",
    lessonSlug: "writing-publishing",
    unitId: "unit-3",
    correctIndex: 1,
    sourceIds: ["deep-review-usage", "github-review-pull-request"],
  },
  {
    id: "q22",
    lessonSlug: "writing-publishing",
    unitId: "unit-3",
    correctIndex: 2,
    sourceIds: ["github-releases"],
  },
  {
    id: "q23",
    lessonSlug: "teaching-capstone",
    unitId: "unit-3",
    correctIndex: 0,
    sourceIds: ["github-classroom-retirement", "github-classroom-transition"],
  },
  {
    id: "q24",
    lessonSlug: "teaching-capstone",
    unitId: "unit-3",
    correctIndex: 3,
    sourceIds: ["github-actions-security", "classroom50-quickstart"],
  },
] as const satisfies readonly GithubQuizManifest[];

export const GITHUB_QUIZ_BY_ID = Object.fromEntries(
  GITHUB_QUIZ.map((question) => [question.id, question]),
) as unknown as Record<GithubQuizId, GithubQuizManifest>;

export const GITHUB_FINAL_QUIZ = {
  bankVersion: "github-quiz-2026-08-23-v2",
  questionCount: 12,
  questionsPerUnit: 4,
  passingCorrectAnswers: 10,
  bestScoreStorageKey: GITHUB_QUIZ_STORAGE_KEYS.best,
  passedStorageKey: GITHUB_QUIZ_STORAGE_KEYS.passed,
  versionStorageKey: GITHUB_QUIZ_STORAGE_KEYS.version,
} as const;

export function getGithubQuizBest(record: Record<string, unknown>): number {
  if (
    record[GITHUB_FINAL_QUIZ.versionStorageKey] !==
    GITHUB_FINAL_QUIZ.bankVersion
  )
    return 0;
  const value = record[GITHUB_FINAL_QUIZ.bestScoreStorageKey];
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 12
    ? value
    : 0;
}

export function isGithubQuizPassed(record: Record<string, unknown>): boolean {
  return (
    record[GITHUB_FINAL_QUIZ.versionStorageKey] ===
      GITHUB_FINAL_QUIZ.bankVersion &&
    record[GITHUB_FINAL_QUIZ.passedStorageKey] === true
  );
}

if (GITHUB_QUIZ.length !== GITHUB_QUIZ_IDS.length) {
  throw new Error(
    `GitHub quiz registry mismatch: expected ${GITHUB_QUIZ_IDS.length}, found ${GITHUB_QUIZ.length}`,
  );
}
