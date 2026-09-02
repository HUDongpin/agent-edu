import styles from "./ClaudeIncomeCourse.module.css";

export default function ExternalLinkCue() {
  return (
    <>
      <span
        className={styles.externalLinkCue}
        data-external-link-cue
        aria-hidden="true"
      >
        ↗
      </span>
      <span className={styles.srOnly}> (opens in new tab)</span>
    </>
  );
}
