"use client";

/**
 * The site-wide reset, in one place.
 *
 * Fourteen course stores share `ae.progress`, and each keeps a module-level
 * copy of the record so a course stays usable after localStorage fails. So
 * removing the key is not enough: every store that is loaded in this tab has
 * to drop its copy and say so, or a later write revives milestones the reader
 * has just cleared, and a widget mounted beside the button keeps painting
 * them until the tab is refocused.
 *
 * Adding a course means adding it here. `npm run progress:check` fails the
 * build when a store under `components/*\/progress-store.ts` is missing.
 */

import { SECTIONS, resetAgenticProgress } from "@/lib/progress";
import { resetAgentOrchestrationProgress } from "./agent-orchestration/progress-store";
import { resetAgenticVideoEditingProgress } from "./agentic-video-editing/progress-store";
import { resetAiTutorProgress } from "./ai-tutor/progress-store";
import { resetClaudeIncomeProgress } from "./claude-income/progress-store";
import { resetClaudeProgressAfterGlobalReset } from "./claude/progress-store";
import { resetAllCourseProgress } from "./codex/progress-store";
import { resetCursorProgressAfterGlobalReset } from "./cursor/progress-store";
import { resetGithubProgress } from "./github/progress-store";
import { resetGrokProgress } from "./grok/progress-store";
import { resetIncomeProgress } from "./make-money-with-codex/progress-store";
import { resetMcpProgress } from "./mcp/progress-store";
import { resetProductManagementProgress } from "./product-management/progress-store";
import { resetPromptProgress } from "./prompts/progress-store";
import { resetRagProgress } from "./rag/progress-store";
import { resetSoftwareEngineeringProgress } from "./software-engineering/progress-store";

/**
 * Clear every course's milestones and the handbook's section count.
 *
 * `resetAllCourseProgress` removes the shared record outright; the rest then
 * clear their own caches over an already-empty record and fire their events,
 * which is what repaints the page. Cursor and Grok keep separate stores and
 * are cleared on their own terms.
 *
 * Returns whether the browser accepted the change, so the caller can tell a
 * reader in private browsing that the reset held for this session only.
 */
export async function resetEveryCourseProgress(): Promise<boolean> {
  const shared = resetAllCourseProgress();

  let sectionsCleared = true;
  try {
    localStorage.removeItem(SECTIONS);
  } catch {
    sectionsCleared = false; // Private browsing: nothing was stored to clear.
  }

  const results = [
    shared.persisted,
    sectionsCleared,
    resetAgenticProgress(),
    resetAgentOrchestrationProgress(),
    resetAgenticVideoEditingProgress(),
    resetAiTutorProgress(),
    resetClaudeIncomeProgress(),
    resetClaudeProgressAfterGlobalReset().persisted,
    resetGithubProgress().persisted,
    resetGrokProgress(),
    resetIncomeProgress(),
    resetMcpProgress(),
    resetProductManagementProgress(),
    resetPromptProgress(),
    resetRagProgress(),
    resetSoftwareEngineeringProgress(),
    (await resetCursorProgressAfterGlobalReset()).persisted,
  ];

  return results.every(Boolean);
}
