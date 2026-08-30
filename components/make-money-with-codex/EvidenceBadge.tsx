import { EVIDENCE_LABELS, type EvidenceClass } from "@/lib/make-money-with-codex";
import styles from "./IncomeCourse.module.css";

export default function EvidenceBadge({
  value,
  long = false,
}: {
  value: EvidenceClass;
  long?: boolean;
}) {
  const label = EVIDENCE_LABELS[value];
  return (
    <span
      className={styles.evidenceBadge}
      data-evidence-class={value}
      title={label.meaning}
      aria-label={`${long ? label.title : label.short}: ${label.meaning}`}
    >
      {long ? label.title : label.short}
    </span>
  );
}
