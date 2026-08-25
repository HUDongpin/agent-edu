import styles from "./CodexCourse.module.css";

const TECHNICAL_TOKEN = /(?:\$\{\{\s*\.\.\.\s*\}\}|openai\/codex-action@v\d+|actions\/checkout|npm install -g @openai\/codex|codex (?:exec resume --last|resume --last|login status|login|exec)|npm (?:ci|test|run [a-z][\w:-]*)|git (?:status|diff|log|worktree)(?:\s+--?[a-z][\w-]*)*|\/(?:cloud-environment|ide-context|permissions|subagents|worktree|status|model|init|review|agent|plan|goal|cloud|local|resume|diff)\b|--[a-z][\w-]*|(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+\.(?:tsx?|jsx?|mjs|json|md|toml|ya?ml|zip|sha256)\b|chatgpt\.reviewDelivery|OPENAI_API_KEY|persist-credentials:\s*false|contents:\s*read|permission-profile|safety-strategy|codex-version|codex-home|workspace-write|danger-full-access|drop-sudo|unprivileged-user|:workspace|@v\d+|aicourse\.[A-Za-z0-9_.-]+)/gi;

/**
 * Keeps commands, flags, filenames, and schema identifiers readable when they
 * appear inside translated RTL prose. The visible text and accessible name do
 * not change; only Unicode direction and code semantics are made explicit.
 */
export default function TechnicalText({ text }: { text: string }) {
  const parts = [];
  let cursor = 0;

  for (const match of text.matchAll(TECHNICAL_TOKEN)) {
    const index = match.index;
    if (index > cursor) parts.push(text.slice(cursor, index));
    parts.push(
      <code className={styles.inlineTechnical} dir="ltr" translate="no" key={`${index}-${match[0]}`}>
        {match[0]}
      </code>,
    );
    cursor = index + match[0].length;
  }

  if (cursor < text.length) parts.push(text.slice(cursor));
  return <span className={styles.technicalText}>{parts}</span>;
}
