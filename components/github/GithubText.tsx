import base from "@/components/codex/CodexCourse.module.css";
import styles from "./GithubCourse.module.css";

const INLINE_CODE = /(`[^`\n]+`)/g;

/**
 * Renders the deliberately small Markdown subset used by Course 6 copy.
 * Technical literals stay left-to-right and non-translatable inside RTL prose.
 */
export default function GithubText({ text }: { text: string }) {
  return (
    <>
      {text.split(INLINE_CODE).map((part, index) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code
            className={`${base.inlineTechnical} ${styles.inlineTechnical}`}
            dir="ltr"
            translate="no"
            key={`${index}-${part}`}
          >
            <bdi dir="ltr">{part.slice(1, -1)}</bdi>
          </code>
        ) : (
          part
        ),
      )}
    </>
  );
}
