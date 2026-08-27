import styles from "./CourseKit.module.css";

export interface CourseLabAsset {
  readonly href: string;
  readonly label: string;
  readonly format: string;
  readonly description: string;
}

export function CourseLabPack({
  courseId,
  eyebrow,
  title,
  intro,
  assets,
  commands,
  boundary,
}: {
  readonly courseId: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly intro: string;
  readonly assets: readonly CourseLabAsset[];
  readonly commands: readonly string[];
  readonly boundary: string;
}) {
  return (
    <section
      className={styles.labPack}
      data-course-lab={courseId}
      aria-labelledby={`${courseId}-lab-pack-title`}
    >
      <header>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2 id={`${courseId}-lab-pack-title`}>{title}</h2>
        <p>{intro}</p>
      </header>
      <ul className={styles.labAssetList}>
        {assets.map((asset) => (
          <li key={asset.href}>
            <a href={asset.href} download>
              <strong>{asset.label}</strong>
              <span>{asset.format}</span>
            </a>
            <p>{asset.description}</p>
          </li>
        ))}
      </ul>
      <div className={styles.labCommands}>
        {commands.map((command) => (
          <code key={command} tabIndex={0} lang="en" dir="ltr">{command}</code>
        ))}
      </div>
      <p className={styles.labBoundary}>{boundary}</p>
    </section>
  );
}
