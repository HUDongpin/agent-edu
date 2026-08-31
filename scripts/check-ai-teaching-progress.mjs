#!/usr/bin/env node

import assert from "node:assert/strict";

import { AGENTIC_TEACHING_COPY_EN } from "../lib/ai-teaching/copy/en.ts";
import { AGENTIC_TEACHING_COPY_ZH_HANS } from "../lib/ai-teaching/copy/zh-Hans.ts";

import {
  AGENTIC_TEACHING_CAPSTONE_KEY,
  AGENTIC_TEACHING_FINAL_QUIZ_CONTRACT,
  AGENTIC_TEACHING_MODULE_SLUGS,
  AGENTIC_TEACHING_QUIZ_BLUEPRINT,
  AGENTIC_TEACHING_QUIZ_KEY,
  agenticTeachingArtifactKey,
  agenticTeachingArtifactRubricFingerprint,
  agenticTeachingArtifactText,
  agenticTeachingCapstonePrerequisiteFingerprint,
  agenticTeachingCheckpointBlueprintId,
  agenticTeachingCheckpointKey,
  agenticTeachingCompletedMilestoneCount,
  agenticTeachingFinalQuizBlueprintId,
  agenticTeachingModuleKey,
  agenticTeachingNextStep,
  agenticTeachingProgressPercent,
  createAgenticTeachingArtifactRecord,
  createAgenticTeachingCapstoneReceipt,
  createAgenticTeachingCheckpointReceipt,
  createAgenticTeachingModuleReceipt,
  createAgenticTeachingQuizReceipt,
  fingerprintAgenticTeachingArtifactRubricContract,
  getAgenticTeachingArtifactRubric,
  getAgenticTeachingCheckpointContract,
  inspectAgenticTeachingArtifact,
  isAgenticTeachingCapstoneComplete,
  isAgenticTeachingModuleComplete,
  readAgenticTeachingArtifactRecord,
  readAgenticTeachingCheckpointReceipt,
  readAgenticTeachingQuizReceipt,
  validateAgenticTeachingCourse,
} from "../lib/ai-teaching/index.ts";
import {
  aiTeachingProgressSnapshot,
  markAiTeachingProgress,
} from "../components/ai-teaching/progress-store.ts";

function validArtifactText(slug, locale = "en", suffix = "") {
  const rubric = getAgenticTeachingArtifactRubric(slug, locale);
  const evidence = locale === "zh-Hans"
    ? "本字段记录经过去标识的样例、具名教师复核、明确停止条件与一次无 AI 新任务；结果仍需人工判断。"
    : "This field records a de-identified example, named educator review, an explicit stop condition and one novel no-AI task; a person still judges quality.";
  let text = rubric.requiredLabels
    .map((label, index) => `${label} ${evidence} Evidence item ${index + 1}.`)
    .join("\n");
  while (text.length < rubric.minimumCharacters + 40) text += `\n${evidence}`;
  text += suffix;
  assert.equal(
    inspectAgenticTeachingArtifact(text, rubric).ready,
    true,
    `${slug}/${locale}: deterministic fixture must satisfy the canonical rubric`,
  );
  return text;
}

function recordCheckpoint(progress, slug, locale = "en") {
  const contract = getAgenticTeachingCheckpointContract(slug, locale);
  const wrongOptionId = contract.optionIds.find(
    (optionId) => optionId !== contract.correctOptionId,
  );
  assert.ok(wrongOptionId);
  assert.equal(
    createAgenticTeachingCheckpointReceipt(slug, locale, wrongOptionId),
    null,
    `${slug}/${locale}: a wrong semantic option must not mint a checkpoint receipt`,
  );
  const receipt = createAgenticTeachingCheckpointReceipt(
    slug,
    locale,
    contract.correctOptionId,
  );
  assert.ok(receipt, `${slug}/${locale}: the canonical answer must mint a receipt`);
  progress[agenticTeachingCheckpointKey(slug)] = receipt;
}

function recordModule(
  progress,
  slug,
  locale = "en",
  revisionId = `revision-${slug}-${locale}-a`,
) {
  progress[agenticTeachingArtifactKey(slug)] =
    createAgenticTeachingArtifactRecord(
      progress[agenticTeachingArtifactKey(slug)],
      validArtifactText(slug, locale),
      locale,
      revisionId,
    );
  recordCheckpoint(progress, slug, locale);
  const receipt = createAgenticTeachingModuleReceipt(progress, slug);
  assert.ok(receipt, `${slug}: valid current evidence must create a module receipt`);
  progress[agenticTeachingModuleKey(slug)] = receipt;
}

// Exact quiz receipts: never infer a score from a Boolean or pass status.
const tenOfTwelve = createAgenticTeachingQuizReceipt(10, true);
assert.ok(tenOfTwelve);
assert.equal(tenOfTwelve.score, 10);
assert.equal(tenOfTwelve.blueprintId, AGENTIC_TEACHING_QUIZ_BLUEPRINT);
assert.equal(readAgenticTeachingQuizReceipt(tenOfTwelve)?.score, 10);
assert.equal(createAgenticTeachingQuizReceipt(12, false), null);
assert.equal(createAgenticTeachingQuizReceipt(9, true), null);
assert.equal(readAgenticTeachingQuizReceipt(true), null);
assert.equal(
  readAgenticTeachingQuizReceipt({ ...tenOfTwelve, courseVersion: "legacy" }),
  null,
);
assert.equal(
  readAgenticTeachingQuizReceipt({ ...tenOfTwelve, questionCount: 11 }),
  null,
);
assert.equal(
  readAgenticTeachingQuizReceipt({ ...tenOfTwelve, score: 13 }),
  null,
);

// Any scoring-semantic drift deterministically changes the blueprint and
// invalidates a receipt, even if both translated copies were edited together.
const changedQuizContract = {
  ...AGENTIC_TEACHING_FINAL_QUIZ_CONTRACT,
  questions: AGENTIC_TEACHING_FINAL_QUIZ_CONTRACT.questions.map(
    (question, index) => index === 0
      ? { ...question, correctOptionId: question.optionIds[1] }
      : question,
  ),
};
const changedQuizBlueprint = agenticTeachingFinalQuizBlueprintId(
  changedQuizContract,
);
assert.notEqual(changedQuizBlueprint, AGENTIC_TEACHING_QUIZ_BLUEPRINT);
assert.equal(
  readAgenticTeachingQuizReceipt({
    ...tenOfTwelve,
    blueprintId: changedQuizBlueprint,
  }),
  null,
);
const firstQuizQuestion = AGENTIC_TEACHING_FINAL_QUIZ_CONTRACT.questions[0];
const secondQuizQuestion = AGENTIC_TEACHING_FINAL_QUIZ_CONTRACT.questions[1];
const quizContractDrifts = [
  {
    ...AGENTIC_TEACHING_FINAL_QUIZ_CONTRACT,
    requiredCorrect: AGENTIC_TEACHING_FINAL_QUIZ_CONTRACT.requiredCorrect + 1,
  },
  {
    ...AGENTIC_TEACHING_FINAL_QUIZ_CONTRACT,
    questions: [
      secondQuizQuestion,
      firstQuizQuestion,
      ...AGENTIC_TEACHING_FINAL_QUIZ_CONTRACT.questions.slice(2),
    ],
  },
  {
    ...AGENTIC_TEACHING_FINAL_QUIZ_CONTRACT,
    questions: AGENTIC_TEACHING_FINAL_QUIZ_CONTRACT.questions.map(
      (question, index) => index === 0
        ? { ...question, critical: !question.critical }
        : question,
    ),
  },
  {
    ...AGENTIC_TEACHING_FINAL_QUIZ_CONTRACT,
    questions: AGENTIC_TEACHING_FINAL_QUIZ_CONTRACT.questions.map(
      (question, index) => index === 0
        ? { ...question, sourceIds: [...question.sourceIds, "S16"] }
        : question,
    ),
  },
  {
    ...AGENTIC_TEACHING_FINAL_QUIZ_CONTRACT,
    questions: AGENTIC_TEACHING_FINAL_QUIZ_CONTRACT.questions.map(
      (question, index) => index === 0
        ? {
            ...question,
            optionIds: [
              question.optionIds[1],
              question.optionIds[0],
              ...question.optionIds.slice(2),
            ],
          }
        : question,
    ),
  },
  {
    ...AGENTIC_TEACHING_FINAL_QUIZ_CONTRACT,
    questions: AGENTIC_TEACHING_FINAL_QUIZ_CONTRACT.questions.map(
      (question, index) => index === 0
        ? {
            ...question,
            optionLabelFingerprints: {
              ...question.optionLabelFingerprints,
              en: "reviewed-label-contract-drift",
            },
          }
        : question,
    ),
  },
];
for (const driftedContract of quizContractDrifts) {
  assert.notEqual(
    agenticTeachingFinalQuizBlueprintId(driftedContract),
    AGENTIC_TEACHING_QUIZ_BLUEPRINT,
    "threshold, question order, critical, source map, option IDs and reviewed labels must each change the quiz blueprint",
  );
}

// Locale parity alone is insufficient: labels can be swapped under otherwise
// valid IDs in both translations, so reviewed-label fingerprints must reject it.
const enFirstQuestion = AGENTIC_TEACHING_COPY_EN.quiz.questions[0];
const zhFirstQuestion = AGENTIC_TEACHING_COPY_ZH_HANS.quiz.questions[0];
const enFirstLabels = enFirstQuestion.options.map((option) => option.label);
const zhFirstLabels = zhFirstQuestion.options.map((option) => option.label);
try {
  enFirstQuestion.options[0].label = enFirstLabels[1];
  enFirstQuestion.options[1].label = enFirstLabels[0];
  zhFirstQuestion.options[0].label = zhFirstLabels[1];
  zhFirstQuestion.options[1].label = zhFirstLabels[0];
  const driftErrors = await validateAgenticTeachingCourse();
  assert.ok(
    driftErrors.some((error) =>
      error.includes("reviewed option labels do not match the canonical fingerprint"),
    ),
    "matching label swaps in both locales must fail the canonical quiz validator",
  );
} finally {
  enFirstQuestion.options[0].label = enFirstLabels[0];
  enFirstQuestion.options[1].label = enFirstLabels[1];
  zhFirstQuestion.options[0].label = zhFirstLabels[0];
  zhFirstQuestion.options[1].label = zhFirstLabels[1];
}

// Swapping IDs while leaving labels in place is independently rejected.
const enFirstIds = enFirstQuestion.options.map((option) => option.id);
const zhFirstIds = zhFirstQuestion.options.map((option) => option.id);
try {
  enFirstQuestion.options[0].id = enFirstIds[1];
  enFirstQuestion.options[1].id = enFirstIds[0];
  zhFirstQuestion.options[0].id = zhFirstIds[1];
  zhFirstQuestion.options[1].id = zhFirstIds[0];
  const driftErrors = await validateAgenticTeachingCourse();
  assert.ok(
    driftErrors.some((error) =>
      error.includes("option IDs and order must match the canonical quiz contract"),
    ),
    "matching semantic ID swaps in both locales must fail the canonical quiz validator",
  );
} finally {
  enFirstQuestion.options[0].id = enFirstIds[0];
  enFirstQuestion.options[1].id = enFirstIds[1];
  zhFirstQuestion.options[0].id = zhFirstIds[0];
  zhFirstQuestion.options[1].id = zhFirstIds[1];
}

// The same label-under-ID attack must fail for a module checkpoint.
const checkpointSlug = AGENTIC_TEACHING_MODULE_SLUGS[0];
const enCheckpoint = AGENTIC_TEACHING_COPY_EN.modules[checkpointSlug].checkpoint;
const checkpointLabels = enCheckpoint.options.map((option) => option.label);
try {
  enCheckpoint.options[0].label = checkpointLabels[2];
  enCheckpoint.options[2].label = checkpointLabels[0];
  const driftErrors = await validateAgenticTeachingCourse();
  assert.ok(
    driftErrors.some((error) =>
      error.includes("checkpoint reviewed option labels do not match the canonical fingerprint"),
    ),
    "a checkpoint label swap under stable IDs must fail the canonical validator",
  );
} finally {
  enCheckpoint.options[0].label = checkpointLabels[0];
  enCheckpoint.options[2].label = checkpointLabels[2];
}

const checkpointOptionIds = enCheckpoint.options.map((option) => option.id);
try {
  enCheckpoint.options[0].id = checkpointOptionIds[2];
  enCheckpoint.options[2].id = checkpointOptionIds[0];
  const driftErrors = await validateAgenticTeachingCourse();
  assert.ok(
    driftErrors.some((error) =>
      error.includes("checkpoint option IDs and order must match the canonical contract"),
    ),
    "a checkpoint semantic ID swap must fail the canonical validator",
  );
} finally {
  enCheckpoint.options[0].id = checkpointOptionIds[0];
  enCheckpoint.options[2].id = checkpointOptionIds[2];
}

// A reviewed-label contract update changes the checkpoint blueprint, so an
// otherwise valid receipt minted against the older copy is rejected.
const checkpointContract = getAgenticTeachingCheckpointContract(
  checkpointSlug,
  "en",
);
const checkpointReceipt = createAgenticTeachingCheckpointReceipt(
  checkpointSlug,
  "en",
  checkpointContract.correctOptionId,
);
assert.ok(checkpointReceipt);
const originalCheckpointLabelFingerprint =
  checkpointContract.optionLabelFingerprint;
const originalCheckpointBlueprint = agenticTeachingCheckpointBlueprintId(
  checkpointSlug,
  "en",
);
try {
  checkpointContract.optionLabelFingerprint = "reviewed-label-contract-drift";
  assert.notEqual(
    agenticTeachingCheckpointBlueprintId(checkpointSlug, "en"),
    originalCheckpointBlueprint,
  );
  assert.equal(
    readAgenticTeachingCheckpointReceipt(checkpointReceipt, checkpointSlug),
    null,
  );
} finally {
  checkpointContract.optionLabelFingerprint =
    originalCheckpointLabelFingerprint;
}
assert.deepEqual(await validateAgenticTeachingCourse(), []);

// An invalid artifact cannot mint a module receipt, even with a valid checkpoint.
const invalidSlug = AGENTIC_TEACHING_MODULE_SLUGS[0];
const invalidProgress = {};
invalidProgress[agenticTeachingArtifactKey(invalidSlug)] =
  createAgenticTeachingArtifactRecord(
    undefined,
    "Too short and missing every canonical label.",
    "en",
    "invalid-artifact-a",
  );
recordCheckpoint(invalidProgress, invalidSlug, "en");
assert.equal(createAgenticTeachingModuleReceipt(invalidProgress, invalidSlug), null);
assert.equal(isAgenticTeachingModuleComplete(invalidProgress, invalidSlug), false);
assert.equal(agenticTeachingCompletedMilestoneCount(invalidProgress), 0);

// Ten current modules + exact quiz + snapshot-bound attestation make twelve milestones.
assert.deepEqual(agenticTeachingNextStep({}), {
  kind: "module",
  slug: AGENTIC_TEACHING_MODULE_SLUGS[0],
  resume: false,
});
const partialProgress = {};
recordModule(partialProgress, AGENTIC_TEACHING_MODULE_SLUGS[0]);
assert.deepEqual(agenticTeachingNextStep(partialProgress), {
  kind: "module",
  slug: AGENTIC_TEACHING_MODULE_SLUGS[1],
  resume: true,
});
const progress = {};
for (const slug of AGENTIC_TEACHING_MODULE_SLUGS) recordModule(progress, slug);
assert.deepEqual(agenticTeachingNextStep(progress), {
  kind: "final-assessment",
});
progress[AGENTIC_TEACHING_QUIZ_KEY] = tenOfTwelve;
assert.deepEqual(agenticTeachingNextStep(progress), { kind: "capstone" });
const firstAttestationFingerprint =
  agenticTeachingCapstonePrerequisiteFingerprint(progress);
assert.ok(firstAttestationFingerprint);
assert.equal(createAgenticTeachingCapstoneReceipt(progress, null), null);
assert.equal(
  createAgenticTeachingCapstoneReceipt(progress, "stale-attestation"),
  null,
);
const capstone = createAgenticTeachingCapstoneReceipt(
  progress,
  firstAttestationFingerprint,
);
assert.ok(capstone);
progress[AGENTIC_TEACHING_CAPSTONE_KEY] = capstone;
assert.deepEqual(agenticTeachingNextStep(progress), { kind: "course-map" });
assert.equal(agenticTeachingCompletedMilestoneCount(progress), 12);
assert.equal(agenticTeachingProgressPercent(progress), 100);
assert.equal(isAgenticTeachingCapstoneComplete(progress), true);

// The complete visible rubric, including evidenceRequirements, is receipt
// material. A receipt minted against an older requirement must fail closed and
// must invalidate the snapshot-bound Capstone.
const rubricDriftSlug = AGENTIC_TEACHING_MODULE_SLUGS[0];
const canonicalRubric = getAgenticTeachingArtifactRubric(rubricDriftSlug, "en");
const changedRubric = {
  ...canonicalRubric,
  evidenceRequirements: [
    "NEW-CONTRACT-REQUIREMENT: include a second no-AI transfer observation.",
    ...canonicalRubric.evidenceRequirements.slice(1),
  ],
};
const changedRubricFingerprint =
  fingerprintAgenticTeachingArtifactRubricContract(
    rubricDriftSlug,
    "en",
    changedRubric,
  );
assert.notEqual(
  changedRubricFingerprint,
  agenticTeachingArtifactRubricFingerprint(rubricDriftSlug, "en"),
);
const rubricDriftProgress = {
  ...progress,
  [agenticTeachingModuleKey(rubricDriftSlug)]: {
    ...progress[agenticTeachingModuleKey(rubricDriftSlug)],
    artifactRubricFingerprint: changedRubricFingerprint,
  },
};
assert.equal(
  isAgenticTeachingModuleComplete(rubricDriftProgress, rubricDriftSlug),
  false,
);
assert.equal(
  agenticTeachingCapstonePrerequisiteFingerprint(rubricDriftProgress),
  null,
);
assert.equal(isAgenticTeachingCapstoneComplete(rubricDriftProgress), false);
assert.equal(agenticTeachingCompletedMilestoneCount(rubricDriftProgress), 10);

const quizDriftProgress = {
  ...progress,
  [AGENTIC_TEACHING_QUIZ_KEY]: {
    ...tenOfTwelve,
    blueprintId: changedQuizBlueprint,
  },
};
assert.equal(readAgenticTeachingQuizReceipt(
  quizDriftProgress[AGENTIC_TEACHING_QUIZ_KEY],
), null);
assert.equal(isAgenticTeachingCapstoneComplete(quizDriftProgress), false);
assert.equal(agenticTeachingCompletedMilestoneCount(quizDriftProgress), 10);

// Saving invalid text fails the rubric, invalidating the module and Capstone.
const changedSlug = AGENTIC_TEACHING_MODULE_SLUGS[0];
const currentArtifact = progress[agenticTeachingArtifactKey(changedSlug)];
progress[agenticTeachingArtifactKey(changedSlug)] =
  createAgenticTeachingArtifactRecord(
    currentArtifact,
    "Changed evidence without the canonical structure.",
    "en",
    "revision-boundaries-invalid-b",
  );
assert.equal(createAgenticTeachingModuleReceipt(progress, changedSlug), null);
assert.equal(isAgenticTeachingModuleComplete(progress, changedSlug), false);
assert.equal(isAgenticTeachingCapstoneComplete(progress), false);
assert.equal(agenticTeachingCompletedMilestoneCount(progress), 10);
assert.equal(agenticTeachingProgressPercent(progress), 83);

// A new valid revision still needs a new module receipt and a new attestation snapshot.
progress[agenticTeachingArtifactKey(changedSlug)] =
  createAgenticTeachingArtifactRecord(
    progress[agenticTeachingArtifactKey(changedSlug)],
    validArtifactText(changedSlug, "en", "\nRevised after the failed structure check."),
    "en",
    "revision-boundaries-valid-c",
  );
assert.equal(isAgenticTeachingModuleComplete(progress, changedSlug), false);
assert.equal(agenticTeachingProgressPercent(progress), 83);
const renewedModule = createAgenticTeachingModuleReceipt(progress, changedSlug);
assert.ok(renewedModule);
progress[agenticTeachingModuleKey(changedSlug)] = renewedModule;
assert.equal(agenticTeachingCompletedMilestoneCount(progress), 11);
assert.equal(agenticTeachingProgressPercent(progress), 92);
assert.equal(isAgenticTeachingCapstoneComplete(progress), false);
assert.equal(
  createAgenticTeachingCapstoneReceipt(progress, firstAttestationFingerprint),
  null,
  "an attestation for an earlier evidence snapshot must not be reusable",
);
const renewedAttestationFingerprint =
  agenticTeachingCapstonePrerequisiteFingerprint(progress);
assert.ok(renewedAttestationFingerprint);
assert.notEqual(renewedAttestationFingerprint, firstAttestationFingerprint);
const renewedCapstone = createAgenticTeachingCapstoneReceipt(
  progress,
  renewedAttestationFingerprint,
);
assert.ok(renewedCapstone);
progress[AGENTIC_TEACHING_CAPSTONE_KEY] = renewedCapstone;
assert.equal(agenticTeachingProgressPercent(progress), 100);

// Merely viewing another locale does not mutate evidence; a real valid save does.
const localeSlug = AGENTIC_TEACHING_MODULE_SLUGS[1];
assert.equal(isAgenticTeachingModuleComplete(progress, localeSlug), true);
const localeArtifact = progress[agenticTeachingArtifactKey(localeSlug)];
assert.equal(readAgenticTeachingArtifactRecord(localeArtifact)?.contentLocale, "en");
assert.equal(isAgenticTeachingModuleComplete(progress, localeSlug), true);
progress[agenticTeachingArtifactKey(localeSlug)] =
  createAgenticTeachingArtifactRecord(
    localeArtifact,
    validArtifactText(localeSlug, "zh-Hans"),
    "zh-Hans",
    "revision-contract-zh",
  );
recordCheckpoint(progress, localeSlug, "zh-Hans");
assert.equal(isAgenticTeachingModuleComplete(progress, localeSlug), false);
assert.equal(isAgenticTeachingCapstoneComplete(progress), false);
const zhModule = createAgenticTeachingModuleReceipt(progress, localeSlug);
assert.ok(zhModule, "a valid Simplified Chinese artifact and checkpoint must pass");
progress[agenticTeachingModuleKey(localeSlug)] = zhModule;

// Concurrent saves from the same parent artifact receive distinct identities.
const parent = progress[agenticTeachingArtifactKey(AGENTIC_TEACHING_MODULE_SLUGS[2])];
const branchA = createAgenticTeachingArtifactRecord(parent, "branch A", "en");
const branchB = createAgenticTeachingArtifactRecord(parent, "branch B", "en");
assert.notEqual(branchA.revisionId, branchB.revisionId);

// Missing quiz or a missing current module fails the Capstone gate closed.
const currentFingerprint = agenticTeachingCapstonePrerequisiteFingerprint(progress);
assert.ok(currentFingerprint);
const missingQuiz = { ...progress };
delete missingQuiz[AGENTIC_TEACHING_QUIZ_KEY];
assert.equal(createAgenticTeachingCapstoneReceipt(missingQuiz, currentFingerprint), null);
const missingModule = { ...progress };
delete missingModule[agenticTeachingModuleKey(AGENTIC_TEACHING_MODULE_SLUGS[3])];
assert.equal(createAgenticTeachingCapstoneReceipt(missingModule, currentFingerprint), null);

// The shared store round-trips a structured receipt; legacy Booleans remain ignored.
markAiTeachingProgress("agenticTeaching.progress-contract-test", tenOfTwelve);
assert.deepEqual(
  JSON.parse(aiTeachingProgressSnapshot())["agenticTeaching.progress-contract-test"],
  tenOfTwelve,
);
const legacy = Object.fromEntries([
  ...AGENTIC_TEACHING_MODULE_SLUGS.map((slug) => [agenticTeachingModuleKey(slug), true]),
  ["agenticTeaching.quiz.passed", true],
  ["agenticTeaching.capstone.v1", true],
]);
assert.equal(agenticTeachingCompletedMilestoneCount(legacy), 0);
assert.equal(agenticTeachingProgressPercent(legacy), 0);
assert.deepEqual(agenticTeachingNextStep(legacy), {
  kind: "module",
  slug: AGENTIC_TEACHING_MODULE_SLUGS[0],
  resume: false,
});
assert.deepEqual(
  agenticTeachingNextStep({
    [agenticTeachingArtifactKey(AGENTIC_TEACHING_MODULE_SLUGS[0])]:
      "legacy draft retained",
  }),
  {
    kind: "module",
    slug: AGENTIC_TEACHING_MODULE_SLUGS[0],
    resume: true,
  },
);
assert.equal(agenticTeachingArtifactText("legacy draft retained"), "legacy draft retained");

process.stdout.write(
  "Course 18 progress contract passed: semantic option IDs, reviewed-label drift rejection, full-rubric binding, exact receipts, snapshot-bound attestation, locale-safe revisions and legacy rejection.\n",
);
