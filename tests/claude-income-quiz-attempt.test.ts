import assert from "node:assert/strict";
import test from "node:test";
import {
  CLAUDE_INCOME_COURSE,
  CLAUDE_INCOME_FINAL_QUIZ,
  CLAUDE_INCOME_QUIZ_BANK,
} from "../lib/claude-income";
import { CLAUDE_INCOME_QUIZ_ATTEMPT_CONFIG } from "../components/claude-income/quiz-attempt-config";
import {
  parseClaudeIncomeQuizAttempt,
  type ClaudeIncomeQuizAttemptDraft,
} from "../components/claude-income/quiz-attempt-store";

function balancedQuestionIds(): string[] {
  return CLAUDE_INCOME_COURSE.units.flatMap((unit) => {
    const questions = CLAUDE_INCOME_QUIZ_BANK.filter((question) => question.unitId === unit.id);
    const critical = questions.find(
      (question) => "critical" in question && question.critical === true,
    );
    assert.ok(critical, `${unit.id} needs a critical question`);
    return [
      critical,
      ...questions.filter(
        (question) => !("critical" in question && question.critical === true),
      ).slice(
        0,
        CLAUDE_INCOME_FINAL_QUIZ.questionsPerUnit - 1,
      ),
    ].map((question) => question.id);
  });
}

function validDraft(): ClaudeIncomeQuizAttemptDraft {
  const questionIds = balancedQuestionIds();
  const first = CLAUDE_INCOME_QUIZ_BANK.find((question) => question.id === questionIds[0]);
  assert.ok(first);
  return {
    schemaVersion: 1,
    bankVersion: CLAUDE_INCOME_FINAL_QUIZ.bankVersion,
    questionIds,
    index: 0,
    selectedIndex: first.correctIndex,
    answers: [first.correctIndex],
  };
}

function parse(value: unknown) {
  return parseClaudeIncomeQuizAttempt(
    JSON.stringify(value),
    CLAUDE_INCOME_QUIZ_ATTEMPT_CONFIG,
  );
}

test("Course 12 quiz attempt schema restores only balanced question IDs and option indexes", () => {
  const draft = validDraft();
  assert.deepEqual(parse(draft), draft);
  assert.deepEqual(Object.keys(draft).sort(), [
    "answers",
    "bankVersion",
    "index",
    "questionIds",
    "schemaVersion",
    "selectedIndex",
  ]);
  assert.ok(draft.answers.every(Number.isInteger));
  assert.doesNotMatch(JSON.stringify(draft), /prompt|option|correct|explanation/u);
});

test("Course 12 quiz attempt parser rejects every stale, forged, or impossible state", () => {
  const base = validDraft();
  const questionFor = (id: string) => {
    const question = CLAUDE_INCOME_QUIZ_BANK.find((candidate) => candidate.id === id);
    assert.ok(question);
    return question;
  };
  const firstUnitQuestions = CLAUDE_INCOME_QUIZ_BANK.filter(
    (question) => question.unitId === CLAUDE_INCOME_COURSE.units[0].id,
  );
  const secondUnitQuestions = CLAUDE_INCOME_QUIZ_BANK.filter(
    (question) => question.unitId === CLAUDE_INCOME_COURSE.units[1].id,
  );
  const unbalancedIds = [
    ...firstUnitQuestions.slice(0, 5).map((question) => question.id),
    ...secondUnitQuestions.slice(0, 3).map((question) => question.id),
    ...base.questionIds.filter((id) => {
      const unitId = questionFor(id).unitId;
      return unitId === CLAUDE_INCOME_COURSE.units[2].id
        || unitId === CLAUDE_INCOME_COURSE.units[3].id;
    }),
  ];

  const cases: ReadonlyArray<readonly [string, unknown]> = [
    ["stale bank", { ...base, bankVersion: "stale" }],
    ["unknown ID", { ...base, questionIds: ["unknown", ...base.questionIds.slice(1)] }],
    ["duplicate ID", { ...base, questionIds: [base.questionIds[0], ...base.questionIds.slice(0, -1)] }],
    ["unit imbalance", { ...base, questionIds: unbalancedIds }],
    ["past-end index", { ...base, index: CLAUDE_INCOME_FINAL_QUIZ.questionCount }],
    ["negative index", { ...base, index: -1 }],
    ["invalid current option", { ...base, selectedIndex: 99, answers: [] }],
    ["invalid earlier answer", { ...base, answers: [99] }],
    ["missing earlier answer", { ...base, index: 2, answers: [] }],
    ["future answer", { ...base, index: 0, answers: [0, 0] }],
    ["checked answer without selection", { ...base, selectedIndex: null }],
    ["checked answer mismatch", {
      ...base,
      selectedIndex: (base.answers[0]! + 1) % questionFor(base.questionIds[0]!).options.length,
    }],
    ["sensitive extra field", { ...base, prompt: "must not persist" }],
  ];

  for (const [label, value] of cases) {
    assert.equal(parse(value), null, label);
  }
});
