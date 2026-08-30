"use client";

import {
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  isProgressPersistenceAvailable,
  mark,
  progressOnServer,
  progressSnapshot,
  readProgress,
  subscribeProgress,
} from "@/lib/progress";
import {
  AGENTIC_TEACHING_CAPSTONE_KEY,
  AGENTIC_TEACHING_MILESTONE_COUNT,
  AGENTIC_TEACHING_QUIZ_KEY,
  AGENTIC_TEACHING_QUIZ_REQUIRED_CORRECT,
  agenticTeachingArtifactText,
  agenticTeachingArtifactKey,
  agenticTeachingCapstonePrerequisiteFingerprint,
  agenticTeachingCompletedMilestoneCount,
  agenticTeachingCheckpointKey,
  agenticTeachingModuleKey,
  agenticTeachingProgressPercent,
  areAgenticTeachingCapstonePrerequisitesComplete,
  createAgenticTeachingArtifactRecord,
  createAgenticTeachingCapstoneReceipt,
  createAgenticTeachingCheckpointReceipt,
  createAgenticTeachingModuleReceipt,
  createAgenticTeachingQuizReceipt,
  inspectAgenticTeachingArtifact,
  isAgenticTeachingCapstoneComplete,
  isAgenticTeachingModuleComplete,
  isAgenticTeachingQuizPassed,
  readAgenticTeachingArtifactRecord,
  readAgenticTeachingCheckpointReceipt,
  readAgenticTeachingQuizReceipt,
} from "@/lib/ai-teaching/progress";
import {
  getAgenticTeachingCheckpointContract,
  getAgenticTeachingFinalQuizQuestionContract,
} from "@/lib/ai-teaching/contracts";
import type {
  AgenticTeachingArtifactRubric,
  AgenticTeachingCapstoneArtifact,
  AgenticTeachingCheckpointCopy,
  AgenticTeachingContentLocale,
  AgenticTeachingModuleSlug,
  AgenticTeachingPracticeCopy,
  AgenticTeachingQuizQuestion,
  AgenticTeachingUiCopy,
} from "@/lib/ai-teaching/types";
import styles from "./AgenticTeachingCourse.module.css";

function useProgressRecord() {
  const snapshot = useSyncExternalStore(
    subscribeProgress,
    progressSnapshot,
    progressOnServer,
  );
  return useMemo(() => readProgress(snapshot), [snapshot]);
}

function persistenceMessage(labels: AgenticTeachingUiCopy): string {
  return isProgressPersistenceAvailable()
    ? labels.savedLocally
    : labels.storageUnavailable;
}

function artifactRevisionMessage(
  locale: AgenticTeachingContentLocale,
): string {
  return locale === "zh-Hans"
    ? "该修订会使原模块完成记录失效；请复核后重新记录模块完成。"
    : "This revision invalidates the earlier module completion. Review it, then record the module again.";
}

export function CourseProgress({
  labels,
  compact = false,
}: {
  readonly labels: AgenticTeachingUiCopy;
  readonly compact?: boolean;
}) {
  const record = useProgressRecord();
  const percent = agenticTeachingProgressPercent(record);
  const completed = agenticTeachingCompletedMilestoneCount(record);

  return (
    <section
      className={`${styles.progressCard} ${compact ? styles.progressCompact : ""}`}
      aria-label={labels.progress}
    >
      <div className={styles.progressHeading}>
        <div>
          <span>{labels.progress}</span>
          <strong>{percent}%</strong>
        </div>
        <p>
          {completed}/{AGENTIC_TEACHING_MILESTONE_COUNT}
        </p>
      </div>
      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-label={labels.progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <span style={{ width: `${percent}%` }} />
      </div>
    </section>
  );
}

export function ArtifactNotebook({
  slug,
  practice,
  labels,
  contentLocale,
}: {
  readonly slug: AgenticTeachingModuleSlug;
  readonly practice: AgenticTeachingPracticeCopy;
  readonly labels: AgenticTeachingUiCopy;
  readonly contentLocale: AgenticTeachingContentLocale;
}) {
  const record = useProgressRecord();
  const key = agenticTeachingArtifactKey(slug);
  const stored = agenticTeachingArtifactText(record[key]);
  const storedRecord = readAgenticTeachingArtifactRecord(record[key]);
  const recordedInAnotherLocale = Boolean(
    storedRecord && storedRecord.contentLocale !== contentLocale,
  );
  const [draftOverride, setDraftOverride] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const draft = draftOverride ?? stored;
  const evidence = inspectAgenticTeachingArtifact(draft, practice.rubric);

  const save = (explicit: boolean) => {
    if (draftOverride === null && !explicit) return;
    const nextRecord = createAgenticTeachingArtifactRecord(
      record[key],
      draft.slice(0, 6000),
      contentLocale,
    );
    const invalidatesCompletion =
      isAgenticTeachingModuleComplete(record, slug) &&
      nextRecord.revisionId !== storedRecord?.revisionId;
    mark(key, nextRecord);
    setDraftOverride(null);
    setStatus(
      invalidatesCompletion
        ? `${persistenceMessage(labels)} ${artifactRevisionMessage(contentLocale)}`
        : persistenceMessage(labels),
    );
  };

  return (
    <section className={styles.notebook} aria-labelledby={`${slug}-notebook-title`}>
      <div className={styles.notebookHeading}>
        <div>
          <p>{labels.notebook}</p>
          <h3 id={`${slug}-notebook-title`}>{practice.artifact}</h3>
        </div>
        <span>{draft.length}/6000</span>
      </div>
      <p className={styles.notebookHelp}>{labels.notebookHelp}</p>
      <details>
        <summary>{labels.artifactRubric}</summary>
        <ul>
          {practice.rubric.evidenceRequirements.map((requirement) => (
            <li key={requirement}>{requirement}</li>
          ))}
        </ul>
      </details>
      <textarea
        value={draft}
        maxLength={6000}
        rows={10}
        aria-label={practice.artifact}
        placeholder={practice.starter}
        onChange={(event) => {
          setDraftOverride(event.target.value);
          setStatus("");
        }}
        onBlur={() => save(false)}
      />
      <div className={styles.notebookActions}>
        <button type="button" onClick={() => save(true)}>
          {labels.saveArtifact}
        </button>
        <span role="status" aria-live="polite">{status}</span>
      </div>
      <p className={styles.notebookHelp} role="status" aria-live="polite">
        {recordedInAnotherLocale
          ? `${labels.artifactLocaleNotice} ${storedRecord?.contentLocale}`
          : evidence.ready
            ? labels.artifactReady
            : `${labels.artifactNeedsEvidence} ${evidence.characterCount}/${evidence.minimumCharacters}; ${evidence.missingLabels.join(", ")}`}
      </p>
    </section>
  );
}

export function ModuleCheckpoint({
  slug,
  checkpoint,
  labels,
  contentLocale,
}: {
  readonly slug: AgenticTeachingModuleSlug;
  readonly checkpoint: AgenticTeachingCheckpointCopy;
  readonly labels: AgenticTeachingUiCopy;
  readonly contentLocale: AgenticTeachingContentLocale;
}) {
  const record = useProgressRecord();
  const key = agenticTeachingCheckpointKey(slug);
  const persistedReceipt = readAgenticTeachingCheckpointReceipt(record[key], slug);
  const alreadyCorrect = Boolean(persistedReceipt);
  const contract = getAgenticTeachingCheckpointContract(slug, contentLocale);
  const [choice, setChoice] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(alreadyCorrect);
  const isCorrect =
    alreadyCorrect || (submitted && choice === contract.correctOptionId);

  return (
    <section className={styles.checkpoint} aria-labelledby={`${slug}-checkpoint-title`}>
      <p className={styles.eyebrow}>{labels.checkpoint}</p>
      <h2 id={`${slug}-checkpoint-title`}>{checkpoint.question}</h2>
      <fieldset>
        <legend className={styles.srOnly}>{checkpoint.question}</legend>
        {checkpoint.options.map((option) => (
          <label key={option.id}>
            <input
              type="radio"
              name={`${slug}-checkpoint`}
              value={option.id}
              checked={
                alreadyCorrect
                  ? persistedReceipt?.selectedOptionId === option.id
                  : choice === option.id
              }
              disabled={alreadyCorrect}
              onChange={() => {
                setChoice(option.id);
                setSubmitted(false);
              }}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>
      <button
        type="button"
        disabled={choice === null || alreadyCorrect}
        onClick={() => {
          setSubmitted(true);
          if (choice === null) return;
          const receipt = createAgenticTeachingCheckpointReceipt(
            slug,
            contentLocale,
            choice,
          );
          if (receipt) mark(key, receipt);
        }}
      >
        {labels.checkAnswer}
      </button>
      {(submitted || alreadyCorrect) ? (
        <div
          className={isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect}
          role="status"
          aria-live="polite"
        >
          <strong>{isCorrect ? labels.correct : labels.incorrect}</strong>
          <p>{checkpoint.explanation}</p>
        </div>
      ) : null}
    </section>
  );
}

export function ModuleCompletion({
  slug,
  rubric,
  labels,
}: {
  readonly slug: AgenticTeachingModuleSlug;
  readonly rubric: AgenticTeachingArtifactRubric;
  readonly labels: AgenticTeachingUiCopy;
}) {
  const record = useProgressRecord();
  const checkpointDone = Boolean(
    readAgenticTeachingCheckpointReceipt(
      record[agenticTeachingCheckpointKey(slug)],
      slug,
    ),
  );
  const artifactReady = inspectAgenticTeachingArtifact(
    agenticTeachingArtifactText(record[agenticTeachingArtifactKey(slug)]),
    rubric,
  ).ready;
  const moduleDone = isAgenticTeachingModuleComplete(record, slug);
  const [status, setStatus] = useState("");

  return (
    <section className={styles.completion} aria-label={labels.completeModule}>
      <div>
        <strong>{moduleDone ? labels.moduleCompleted : labels.completeModule}</strong>
        <p>
          {moduleDone
            ? labels.moduleCompleted
            : !checkpointDone
              ? labels.checkpointFirst
              : !artifactReady
                ? labels.artifactFirst
                : labels.artifactReady}
        </p>
      </div>
      <button
        type="button"
        disabled={!checkpointDone || !artifactReady || moduleDone}
        onClick={() => {
          const receipt = createAgenticTeachingModuleReceipt(record, slug);
          if (!receipt) return;
          mark(agenticTeachingModuleKey(slug), receipt);
          setStatus(persistenceMessage(labels));
        }}
      >
        {moduleDone ? labels.moduleCompleted : labels.completeModule}
      </button>
      <span role="status" aria-live="polite">{status}</span>
    </section>
  );
}

export function PilotCanvas({
  locale,
}: {
  readonly locale: "en" | "zh-Hans";
}) {
  const zh = locale === "zh-Hans";
  const [context, setContext] = useState<"k12" | "higher-ed">("k12");
  const [task, setTask] = useState<"prepare" | "coach" | "grade">("prepare");
  const [authority, setAuthority] = useState<"draft" | "review" | "auto">("draft");
  const [data, setData] = useState<"synthetic" | "deidentified" | "identifiable">("synthetic");

  const result = useMemo(() => {
    if (task === "grade") {
      return {
        level: "stop",
        title: zh ? "停止：不能把高影响判断交给智能体" : "Stop: do not delegate a high-impact judgement",
        body: zh
          ? "智能体不得先行评分或起草分数。合格教师必须先检查原始作业、量规与例外并作出学术判断；之后，智能体最多生成可编辑的证据摘要或反馈草稿。"
          : "The agent must not grade first or draft a score. A qualified educator must inspect the original work, rubric and exceptions and make the academic judgement first; only then may the agent prepare an editable evidence summary or feedback draft.",
      };
    }
    if (data === "identifiable") {
      return {
        level: "stop",
        title: zh ? "停止：先完成数据与授权审查" : "Stop: complete data and authority review first",
        body: zh
          ? "不要把可识别学生资料粘贴进未获批准的模型。先最小化字段、确认法域与机构政策、保留期限、供应商条款和退出路径。"
          : "Do not paste identifiable learner data into an unapproved model. First minimise fields and verify jurisdiction, institutional policy, retention, provider terms and an exit path.",
      };
    }
    if (authority === "auto") {
      return {
        level: "revise",
        title: zh ? "修改：自动化权力仍然过大" : "Revise: the automation still has too much authority",
        body: zh
          ? "把自动发布改成可审查草稿，定义谁批准、智能体何时停止，以及如何记录分歧。"
          : "Turn automatic publication into a reviewable draft. Name the approver, stopping condition and how disagreements are recorded.",
      };
    }
    return {
      level: "pilot",
      title: zh ? "可以进入小规模试点" : "Ready for a bounded pilot",
      body: zh
        ? `${context === "k12" ? "K–12" : "大学"}场景先用合成数据或机构明确批准的去标识资料，保存输入、输出、教师修改与学习证据；不要把节省时间当作学习成效。`
        : `Start the ${context === "k12" ? "K–12" : "higher-education"} pilot with synthetic data or institution-approved de-identified data. Save inputs, outputs, educator edits and learning evidence; do not treat time saved as learning impact.`,
    };
  }, [authority, context, data, task, zh]);

  return (
    <section className={styles.pilotCanvas} aria-labelledby="pilot-canvas-title">
      <header>
        <p className={styles.eyebrow}>{zh ? "互动决策台" : "INTERACTIVE DECISION DESK"}</p>
        <h2 id="pilot-canvas-title">{zh ? "先决定智能体可以做什么" : "Decide what the agent may do before choosing a tool"}</h2>
        <p>{zh ? "四个选择会生成一条可解释的试点边界；结果是设计提醒，不是法律或机构批准。" : "Four choices produce an explainable pilot boundary. The result is a design prompt, not legal or institutional approval."}</p>
      </header>
      <div className={styles.pilotControls}>
        <label>
          <span>{zh ? "教学环境" : "Learning context"}</span>
          <select value={context} onChange={(event) => setContext(event.target.value as typeof context)}>
            <option value="k12">K–12</option>
            <option value="higher-ed">{zh ? "大学" : "Higher education"}</option>
          </select>
        </label>
        <label>
          <span>{zh ? "任务" : "Task"}</span>
          <select value={task} onChange={(event) => setTask(event.target.value as typeof task)}>
            <option value="prepare">{zh ? "备课与材料草稿" : "Preparation and material drafts"}</option>
            <option value="coach">{zh ? "学习过程辅导" : "In-process coaching"}</option>
            <option value="grade">{zh ? "评分或高影响判断" : "Grading or high-impact judgement"}</option>
          </select>
        </label>
        <label>
          <span>{zh ? "智能体权限" : "Agent authority"}</span>
          <select value={authority} onChange={(event) => setAuthority(event.target.value as typeof authority)}>
            <option value="draft">{zh ? "只生成草稿" : "Draft only"}</option>
            <option value="review">{zh ? "教师批准后执行" : "Act after educator approval"}</option>
            <option value="auto">{zh ? "自动发布或决定" : "Publish or decide automatically"}</option>
          </select>
        </label>
        <label>
          <span>{zh ? "数据" : "Data"}</span>
          <select value={data} onChange={(event) => setData(event.target.value as typeof data)}>
            <option value="synthetic">{zh ? "合成数据" : "Synthetic"}</option>
            <option value="deidentified">{zh ? "去标识数据" : "De-identified"}</option>
            <option value="identifiable">{zh ? "可识别学生资料" : "Identifiable learner data"}</option>
          </select>
        </label>
      </div>
      <div className={styles[`pilotResult_${result.level}`]} role="status" aria-live="polite">
        <strong>{result.title}</strong>
        <p>{result.body}</p>
      </div>
    </section>
  );
}

export function FinalAssessment({
  questions,
  title,
  intro,
  passNote,
  labels,
  contentLocale,
}: {
  readonly questions: readonly AgenticTeachingQuizQuestion[];
  readonly title: string;
  readonly intro: string;
  readonly passNote: string;
  readonly labels: AgenticTeachingUiCopy;
  readonly contentLocale: AgenticTeachingContentLocale;
}) {
  const record = useProgressRecord();
  const persistedResult = readAgenticTeachingQuizReceipt(
    record[AGENTIC_TEACHING_QUIZ_KEY],
  );
  const alreadyPassed = Boolean(persistedResult);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [attemptResult, setAttemptResult] = useState<{
    score: number;
    passed: boolean;
  } | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const questionRefs = useRef<
    Partial<Record<string, HTMLFieldSetElement | null>>
  >({});
  const showPersistedAnswerKey =
    alreadyPassed && attemptResult?.passed !== true;
  const result = persistedResult
    ? { score: persistedResult.score, passed: true }
    : attemptResult;

  return (
    <section
      className={styles.finalAssessment}
      id="final-assessment"
      aria-labelledby="agentic-teaching-final-title"
    >
      <header>
        <p className={styles.eyebrow}>{labels.finalAssessment}</p>
        <h2 id="agentic-teaching-final-title">{title}</h2>
        <p>{intro}</p>
        <p className={styles.passNote}>{passNote}</p>
      </header>
      {showPersistedAnswerKey ? (
        <p className={styles.passNote}>
          {contentLocale === "zh-Hans"
            ? "已通过。下方显示正确答案与解释，供复习使用。"
            : "Passed. The correct answers and explanations are shown below for review."}
        </p>
      ) : null}
      <ol className={styles.quizList}>
        {questions.map((question, questionIndex) => {
          const contract = getAgenticTeachingFinalQuizQuestionContract(
            question.id,
          );
          const showAnswerKey = showPersistedAnswerKey;
          const selectedOptionId = showAnswerKey
            ? contract.correctOptionId
            : answers[question.id];
          const showQuestionFeedback = hasSubmitted || showAnswerKey;
          const answerCorrect = selectedOptionId === contract.correctOptionId;
          const feedbackId = `final-quiz-feedback-${question.id}`;
          return (
          <li key={question.id}>
            <fieldset
              ref={(element) => {
                questionRefs.current[question.id] = element;
              }}
              data-testid={`final-quiz-question-${question.id}`}
              tabIndex={-1}
              aria-invalid={
                result?.score === -1 && !answers[question.id]
                  ? true
                  : undefined
              }
              aria-describedby={showQuestionFeedback ? feedbackId : undefined}
            >
              <legend>
                <span>{String(questionIndex + 1).padStart(2, "0")}</span>
                {question.prompt}
                {question.critical ? (
                  <strong title={contentLocale === "zh-Hans" ? "关键题" : "Critical question"}>
                    <span aria-hidden="true">◆</span>
                    <span className={styles.srOnly}>
                      {contentLocale === "zh-Hans" ? "关键题" : "Critical question"}
                    </span>
                  </strong>
                ) : null}
              </legend>
              {question.options.map((option) => (
                <label key={option.id}>
                  <input
                    type="radio"
                    name={`final-${question.id}`}
                    value={option.id}
                    checked={selectedOptionId === option.id}
                    disabled={alreadyPassed}
                    onChange={() => {
                      setAnswers((current) => ({
                        ...current,
                        [question.id]: option.id,
                      }));
                      setAttemptResult(null);
                      setHasSubmitted(false);
                    }}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </fieldset>
            {showQuestionFeedback ? (
              <div
                id={feedbackId}
                className={answerCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect}
                data-testid={`final-quiz-explanation-${question.id}`}
              >
                <strong>
                  {answerCorrect
                    ? labels.correct
                    : labels.incorrect}
                </strong>
                <p>{question.explanation}</p>
              </div>
            ) : null}
          </li>
          );
        })}
      </ol>
      <button
        type="button"
        data-testid="final-quiz-submit"
        disabled={alreadyPassed}
        onClick={() => {
          const firstUnanswered = questions.find(
            (question) => !answers[question.id],
          );
          if (firstUnanswered) {
            setHasSubmitted(false);
            setAttemptResult({ score: -1, passed: false });
            requestAnimationFrame(() => {
              questionRefs.current[firstUnanswered.id]?.focus();
            });
            return;
          }
          const score = questions.filter(
            (question) =>
              answers[question.id] ===
              getAgenticTeachingFinalQuizQuestionContract(question.id)
                .correctOptionId,
          ).length;
          const criticalPassed = questions
            .filter((question) => question.critical)
            .every(
              (question) =>
                answers[question.id] ===
                getAgenticTeachingFinalQuizQuestionContract(question.id)
                  .correctOptionId,
            );
          const passed = isAgenticTeachingQuizPassed(score, criticalPassed);
          const receipt = createAgenticTeachingQuizReceipt(score, criticalPassed);
          if (receipt) mark(AGENTIC_TEACHING_QUIZ_KEY, receipt);
          setHasSubmitted(true);
          setAttemptResult({ score, passed });
          if (!passed) {
            const firstIncorrect = questions.find(
              (question) =>
                answers[question.id] !==
                getAgenticTeachingFinalQuizQuestionContract(question.id)
                  .correctOptionId,
            );
            if (firstIncorrect) {
              requestAnimationFrame(() => {
                questionRefs.current[firstIncorrect.id]?.focus();
              });
            }
          }
        }}
      >
        {labels.submitAssessment}
      </button>
      {result ? (
        <div
          className={result.passed ? styles.feedbackCorrect : styles.feedbackIncorrect}
          role="status"
          aria-live="polite"
        >
          <strong>
            {result.score < 0
              ? labels.answerEveryQuestion
              : result.passed
                ? labels.assessmentPassed
                : labels.assessmentNotPassed}
          </strong>
          {result.score >= 0 ? (
            <p>{result.score}/{questions.length} · {AGENTIC_TEACHING_QUIZ_REQUIRED_CORRECT}/{questions.length}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function CapstoneChecklist({
  title,
  intro,
  instructions,
  artifacts,
  attestation,
  labels,
}: {
  readonly title: string;
  readonly intro: string;
  readonly instructions: readonly string[];
  readonly artifacts: readonly AgenticTeachingCapstoneArtifact[];
  readonly attestation: string;
  readonly labels: AgenticTeachingUiCopy;
}) {
  const record = useProgressRecord();
  const alreadyComplete = isAgenticTeachingCapstoneComplete(record);
  const prerequisiteFingerprint =
    agenticTeachingCapstonePrerequisiteFingerprint(record);
  const [attestedFingerprint, setAttestedFingerprint] = useState<string | null>(
    null,
  );
  const attested = Boolean(
    prerequisiteFingerprint &&
      attestedFingerprint === prerequisiteFingerprint,
  );
  const artifactEvidence = artifacts.map((artifact) => {
    const evidence = inspectAgenticTeachingArtifact(
      agenticTeachingArtifactText(
        record[agenticTeachingArtifactKey(artifact.moduleSlug)],
      ),
      artifact.rubric,
    );
    return {
      artifact,
      evidence: isAgenticTeachingModuleComplete(record, artifact.moduleSlug)
        ? { ...evidence, ready: true }
        : evidence,
    };
  });
  const allArtifacts = artifactEvidence.every(({ evidence }) => evidence.ready);
  const prerequisitesComplete =
    areAgenticTeachingCapstonePrerequisitesComplete(record);
  const [status, setStatus] = useState("");

  return (
    <section
      className={styles.capstone}
      id="capstone"
      aria-labelledby="agentic-teaching-capstone-title"
    >
      <header>
        <p className={styles.eyebrow}>{labels.capstone}</p>
        <h2 id="agentic-teaching-capstone-title">{title}</h2>
        <p>{intro}</p>
      </header>
      <ol className={styles.capstoneInstructions}>
        {instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}
      </ol>
      <fieldset>
        <legend>{labels.capstoneArtifacts}</legend>
        {artifactEvidence.map(({ artifact, evidence }) => {
          return (
            <label key={artifact.id}>
              <input
                type="checkbox"
                checked={evidence.ready}
                disabled
                readOnly
              />
              <span>
                <strong>{artifact.title}</strong>
                {artifact.description}
                <small>
                  {evidence.ready
                    ? labels.capstoneEvidenceReady
                    : `${labels.capstoneEvidenceMissing} ${evidence.characterCount}/${evidence.minimumCharacters}`}
                </small>
              </span>
            </label>
          );
        })}
      </fieldset>
      {!prerequisitesComplete ? (
        <p className={styles.passNote}>{labels.capstonePrerequisites}</p>
      ) : null}
      <p className={styles.passNote}>{labels.selfTrackingOnly}</p>
      <label className={styles.attestation}>
        <input
          type="checkbox"
          checked={alreadyComplete || attested}
          disabled={alreadyComplete || !prerequisiteFingerprint}
          onChange={(event) =>
            setAttestedFingerprint(
              event.target.checked ? prerequisiteFingerprint : null,
            )
          }
        />
        <span><strong>{labels.attestation}</strong>{attestation}</span>
      </label>
      <button
        type="button"
        disabled={
          !allArtifacts ||
          !prerequisitesComplete ||
          !attested ||
          alreadyComplete
        }
        onClick={() => {
          const receipt = createAgenticTeachingCapstoneReceipt(
            record,
            attestedFingerprint,
          );
          if (!receipt) return;
          mark(AGENTIC_TEACHING_CAPSTONE_KEY, receipt);
          setStatus(persistenceMessage(labels));
        }}
      >
        {alreadyComplete ? labels.capstoneCompleted : labels.completeCapstone}
      </button>
      <span role="status" aria-live="polite">{status}</span>
    </section>
  );
}
