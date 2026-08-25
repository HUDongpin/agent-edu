"use client";

import { updateMcpProgress } from "./progress-store";
import { useMcpProgress } from "./useMcpProgress";
import type { McpUiCopy } from "@/lib/mcp/copy";
import { formatMcpCopy } from "@/lib/mcp/format";
import type { McpCapstoneCopy } from "@/lib/mcp/types";
import styles from "./McpCourse.module.css";

export default function CapstoneChecklist({
  locale,
  ui,
  capstone,
}: {
  locale: string;
  ui: McpUiCopy;
  capstone: McpCapstoneCopy;
}) {
  const deliverables = capstone.deliverables;
  const progress = useMcpProgress();
  const alreadyComplete = progress["mcp.capstone.v1"] === true;
  const checked = Object.fromEntries(deliverables.map((_, index) => [
    index,
    alreadyComplete || progress[`mcp.capstone.item.${index}`] === true,
  ])) as Record<number, boolean>;
  const count = Object.values(checked).filter(Boolean).length;
  const all = count === deliverables.length;

  return (
    <section id="capstone" className={styles.capstone} aria-labelledby="mcp-capstone-title">
      <div className={styles.capstoneIntro}>
        <p className={styles.eyebrow}>{ui.capstoneEyebrow}</p>
        <h2 id="mcp-capstone-title">{ui.capstoneTitle}</h2>
        <p>{ui.capstoneBody}</p>
        <p className={styles.credentialNotice}>{ui.capstoneCredentialNotice}</p>
        <div className={styles.capstoneDownloads}>
          <a className={styles.secondaryButton} href={`/courses/mcp/capstone/MCP_CAPSTONE_EVIDENCE_PACK-${locale}.md`} download>{ui.capstoneDownloadPack}</a>
          <a className={styles.secondaryButton} href="/courses/mcp/courseops-reference.zip" download>{ui.capstoneDownloadFixture}</a>
        </div>
        <div className={styles.capstoneTrack}>
          <article><strong>{ui.capstoneBuilderTitle}</strong><span>{ui.capstoneBuilderBody}</span></article>
          <article><strong>{ui.capstoneAuditorTitle}</strong><span>{ui.capstoneAuditorBody}</span></article>
        </div>
      </div>
      <div className={styles.capstoneChecklist}>
        <div className={styles.capstoneCount}><strong>{count}/{deliverables.length}</strong><span>{formatMcpCopy(ui.capstoneReadyTemplate, { count, total: deliverables.length })}</span></div>
        {deliverables.map((item, index) => (
          <label key={item}>
            <input
              type="checkbox"
              checked={checked[index] === true}
              onChange={(event) => {
                const value = event.target.checked;
                updateMcpProgress((next) => {
                  next[`mcp.capstone.item.${index}`] = value;
                  if (!value) next["mcp.capstone.v1"] = false;
                });
              }}
            />
            <span>{String(index + 1).padStart(2, "0")}</span>
            {item}
          </label>
        ))}
        <button
          type="button"
          className={all && !alreadyComplete ? styles.primaryButton : styles.secondaryButton}
          disabled={!all}
          onClick={() => updateMcpProgress((next) => {
            deliverables.forEach((_, index) => { next[`mcp.capstone.item.${index}`] = true; });
            next["mcp.capstone.v1"] = true;
          })}
        >
          {alreadyComplete ? ui.capstoneMarked : ui.capstoneMark}
        </button>
      </div>
    </section>
  );
}
