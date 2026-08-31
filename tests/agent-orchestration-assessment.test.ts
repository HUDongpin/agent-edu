import assert from "node:assert/strict";
import test from "node:test";
import { AGENT_ORCHESTRATION_EN_COPY } from "../lib/agent-orchestration/copy/en";
import { AGENT_ORCHESTRATION_ZH_HANS_COPY } from "../lib/agent-orchestration/copy/zh-Hans";
import {
  AGENT_ORCHESTRATION_QUIZ_BEST_KEY,
  AGENT_ORCHESTRATION_QUIZ_PASSED_KEY,
  gradeAgentOrchestrationAssessment,
  isAgentOrchestrationQuizPassed,
  recordAgentOrchestrationQuizAttempt,
} from "../lib/agent-orchestration/assessment-progress";
import {
  AGENT_ORCHESTRATION_CAPSTONE_CHECKS_KEY,
  AGENT_ORCHESTRATION_CAPSTONE_KEY,
  AGENT_ORCHESTRATION_MAX_EVIDENCE_REFERENCE_LENGTH,
  readAgentOrchestrationCapstoneWorkspace,
  saveAgentOrchestrationCapstoneEvidence,
  validateAgentOrchestrationCapstoneEvidenceWithReasons,
} from "../lib/agent-orchestration/capstone-progress";
import type {
  AgentOrchestrationAssessmentQuestionCopy,
} from "../lib/agent-orchestration/types";
import {
  AGENT_ORCHESTRATION_CAPSTONE_RECOVERY_KEY,
} from "../lib/progress-topology";

function assessmentQuestions(): readonly AgentOrchestrationAssessmentQuestionCopy[] {
  const moduleSlugs = [
    "workflow-agent-boundary",
    "task-graphs-contracts",
  ] as const;
  return moduleSlugs.map((moduleSlug) => ({
    moduleSlug,
    moduleTitle: AGENT_ORCHESTRATION_EN_COPY.modules[moduleSlug].title,
    checkpoint: AGENT_ORCHESTRATION_EN_COPY.modules[moduleSlug].checkpoint,
  }));
}

test("assessment grading follows semantic IDs and reports missed modules", () => {
  const questions = assessmentQuestions();
  const answers = {
    [questions[0].checkpoint.checkpointId]:
      questions[0].checkpoint.correctOptionId,
    [questions[1].checkpoint.checkpointId]:
      questions[1].checkpoint.options.find(
        (option) => option.id !== questions[1].checkpoint.correctOptionId,
      )!.id,
  };
  const result = gradeAgentOrchestrationAssessment(questions, answers, 80);

  assert.equal(result.answeredCount, 2);
  assert.equal(result.correctCount, 1);
  assert.equal(result.score, 50);
  assert.equal(result.passed, false);
  assert.deepEqual(result.missedCheckpointIds, [
    questions[1].checkpoint.checkpointId,
  ]);

  const first = questions[0];
  const correctOption = first.checkpoint.options.find(
    (option) => option.id === first.checkpoint.correctOptionId,
  )!;
  const wrongOptions = first.checkpoint.options.filter(
    (option) => option.id !== first.checkpoint.correctOptionId,
  );
  const reorderedQuestions = [{
    ...first,
    checkpoint: {
      ...first.checkpoint,
      options: [
        correctOption,
        wrongOptions[0]!,
        wrongOptions[1]!,
        wrongOptions[2]!,
      ],
    },
  }] satisfies readonly AgentOrchestrationAssessmentQuestionCopy[];
  assert.equal(
    gradeAgentOrchestrationAssessment(
      reorderedQuestions,
      { [first.checkpoint.checkpointId]: correctOption.id },
      80,
    ).score,
    100,
  );
});

test("native-locale assessment identities never inherit answers", () => {
  const moduleSlug = "workflow-agent-boundary";
  const english = AGENT_ORCHESTRATION_EN_COPY.modules[moduleSlug].checkpoint;
  const chinese = AGENT_ORCHESTRATION_ZH_HANS_COPY.modules[moduleSlug].checkpoint;
  const chineseQuestions: readonly AgentOrchestrationAssessmentQuestionCopy[] = [{
    moduleSlug,
    moduleTitle: AGENT_ORCHESTRATION_ZH_HANS_COPY.modules[moduleSlug].title,
    checkpoint: chinese,
  }];
  const result = gradeAgentOrchestrationAssessment(
    chineseQuestions,
    { [english.checkpointId]: english.correctOptionId },
    80,
  );
  assert.equal(result.answeredCount, 0);
  assert.equal(result.score, 0);
  assert.deepEqual(result.missedCheckpointIds, [chinese.checkpointId]);
});

test("assessment best score and pass state remain monotonic", () => {
  const progress: Record<string, unknown> = {};
  recordAgentOrchestrationQuizAttempt(progress, 93, 80);
  recordAgentOrchestrationQuizAttempt(progress, 40, 80);
  assert.equal(progress[AGENT_ORCHESTRATION_QUIZ_BEST_KEY], 93);
  assert.equal(progress[AGENT_ORCHESTRATION_QUIZ_PASSED_KEY], true);
  assert.equal(isAgentOrchestrationQuizPassed(progress), true);
});

test("capstone validation returns actionable per-field reason codes", () => {
  const tooLong = "a".repeat(
    AGENT_ORCHESTRATION_MAX_EVIDENCE_REFERENCE_LENGTH + 1,
  );
  const evidence = [
    "",
    tooLong,
    "ftp://evidence.company.org/run/verified-0001",
    "abc",
    "todo-placeholder-01",
    "alpha beta gamma delta",
    "https://evidence.company.org/run/verified-0001",
    "https://evidence.company.org/run/verified-0001#copy",
    "trace://run-verified-0002",
  ];
  const validation = validateAgentOrchestrationCapstoneEvidenceWithReasons(
    evidence,
    evidence.length,
  );
  assert.deepEqual(validation.reasons, [
    "required",
    "too-long",
    "unsupported-scheme",
    "too-short",
    "placeholder",
    "missing-identifier",
    "duplicate",
    "duplicate",
    null,
  ]);
  assert.equal(validation.firstInvalidIndex, 0);
  assert.equal(validation.complete, false);
});

test("capstone workspace recovery remains non-authoritative until resaved", () => {
  const recovered = [
    "trace://run-verified-0001",
    "review://record-verified-0002",
  ];
  const progress: Record<string, unknown> = {
    [AGENT_ORCHESTRATION_CAPSTONE_RECOVERY_KEY]: recovered,
  };
  const workspace = readAgentOrchestrationCapstoneWorkspace(
    progress,
    recovered.length,
  );
  assert.deepEqual(workspace.evidence, recovered);
  assert.equal(workspace.recoveryPending, true);
  assert.equal(progress[AGENT_ORCHESTRATION_CAPSTONE_KEY], undefined);

  const validation = saveAgentOrchestrationCapstoneEvidence(
    progress,
    recovered,
    recovered.length,
  );
  assert.equal(validation.complete, true);
  assert.deepEqual(progress[AGENT_ORCHESTRATION_CAPSTONE_CHECKS_KEY], recovered);
  assert.equal(progress[AGENT_ORCHESTRATION_CAPSTONE_KEY], true);
  assert.equal(AGENT_ORCHESTRATION_CAPSTONE_RECOVERY_KEY in progress, false);
});
