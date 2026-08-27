import styles from "./VisualWorkbench.module.css";

export interface PipelineStage {
  readonly id: "contract" | "codex" | "claude" | "render";
  readonly number: string;
  readonly title: string;
  readonly role: string;
  readonly output: string;
  readonly checks: readonly string[];
}

export interface PipelineMapLabels {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly output: string;
  readonly checks: string;
  readonly handoff: string;
  readonly caption: string;
  readonly stages: readonly [PipelineStage, PipelineStage, PipelineStage, PipelineStage];
}

export interface PipelineMapProps {
  readonly className?: string;
  readonly labels?: Partial<Omit<PipelineMapLabels, "stages">> & {
    readonly stages?: PipelineMapLabels["stages"];
  };
}

const DEFAULT_LABELS: PipelineMapLabels = {
  eyebrow: "Verified animation pipeline",
  title: "Every handoff carries a checkable artifact",
  description:
    "The agents do different work, but the scene contract and mathematical invariants remain the shared source of truth.",
  output: "Handoff artifact",
  checks: "Exit checks",
  handoff: "verified handoff",
  caption:
    "The loop may repeat after review or rendering. A failed invariant routes back to implementation; it never gets polished into a final export.",
  stages: [
    {
      id: "contract",
      number: "01",
      title: "Scene contract",
      role: "Human intent · mathematical truth",
      output: "SCENE_CONTRACT.md",
      checks: ["Claim and audience are explicit", "Beats, objects, and invariants are named"],
    },
    {
      id: "codex",
      number: "02",
      title: "Codex implementation",
      role: "Repository work · executable scene",
      output: "Scene code + tests + preview",
      checks: ["Pinned engine APIs compile", "Low-quality render completes locally"],
    },
    {
      id: "claude",
      number: "03",
      title: "Claude review",
      role: "Narrative direction · legibility",
      output: "Time-coded review notes",
      checks: ["One idea is visible per beat", "Labels, pacing, and continuity survive"],
    },
    {
      id: "render",
      number: "04",
      title: "Render + invariants",
      role: "Export inspection · release evidence",
      output: "Video + keyframes + receipt",
      checks: ["Sampled values match the mathematics", "Codec, dimensions, rights, and captions pass"],
    },
  ],
};

export default function PipelineMap({ className, labels: labelOverrides }: PipelineMapProps) {
  const labels: PipelineMapLabels = {
    ...DEFAULT_LABELS,
    ...labelOverrides,
    stages: labelOverrides?.stages ?? DEFAULT_LABELS.stages,
  };

  return (
    <figure className={[styles.pipeline, className].filter(Boolean).join(" ")}>
      <header className={styles.pipelineHeader}>
        <p className={styles.eyebrow}>{labels.eyebrow}</p>
        <h3>{labels.title}</h3>
        <p>{labels.description}</p>
      </header>

      <ol className={styles.pipelineStages}>
        {labels.stages.map((stage, index) => (
          <li key={stage.id} className={styles.pipelineStage} data-stage={stage.id}>
            <div className={styles.stageTopline}>
              <span className={styles.stageNumber}>{stage.number}</span>
              <span className={styles.stageRole}>{stage.role}</span>
            </div>
            <h4>{stage.title}</h4>
            <div className={styles.stageOutput}>
              <span>{labels.output}</span>
              <code dir="ltr">{stage.output}</code>
            </div>
            <div className={styles.stageChecks}>
              <span>{labels.checks}</span>
              <ul>
                {stage.checks.map((check) => (
                  <li key={check}>{check}</li>
                ))}
              </ul>
            </div>
            {index < labels.stages.length - 1 ? (
              <span className={styles.handoffLabel} aria-hidden="true">
                {labels.handoff}
              </span>
            ) : null}
          </li>
        ))}
      </ol>

      <figcaption>{labels.caption}</figcaption>
    </figure>
  );
}
