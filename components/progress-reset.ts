"use client";

/**
 * The site-wide reset, in one place.
 *
 * Course 1 now owns the canonical `ae.learning.v2` record through
 * `lib/progress.ts`. The other released courses still expose independent
 * progress-store modules; most share `ae.progress`, while Cursor and Grok use
 * dedicated keys. Every store also keeps an in-memory fallback after browser
 * persistence fails. Removing storage keys alone would therefore let a later
 * write revive milestones the learner just cleared.
 *
 * Adding a store under `components/<course>/progress-store.ts` means adding its
 * reset here. `scripts/check-progress-contract.mjs` discovers those stores and
 * fails closed when this module is no longer exhaustive.
 */

import { resetLearningState } from "@/lib/progress";
import { resetAgentOrchestrationProgress } from "./agent-orchestration/progress-store";
import { resetAgenticVideoEditingProgress } from "./agentic-video-editing/progress-store";
import { resetAiTutorProgress } from "./ai-tutor/progress-store";
import { resetClaudeIncomeProgress } from "./claude-income/progress-store";
import { resetClaudeProgressAfterGlobalReset } from "./claude/progress-store";
import { resetAllCourseProgress } from "./codex/progress-store";
import { resetCursorProgressAfterGlobalReset } from "./cursor/progress-store";
import { resetAllCourseKitProgress } from "./course-kit/progress-store";
import { resetGithubProgress } from "./github/progress-store";
import { resetGrokProgress } from "./grok/progress-store";
import { resetIncomeProgress } from "./make-money-with-codex/progress-store";
import { resetMcpProgress } from "./mcp/progress-store";
import { resetProductManagementProgress } from "./product-management/progress-store";
import { resetPromptProgress } from "./prompts/progress-store";
import { resetRagProgress } from "./rag/progress-store";
import { resetSoftwareEngineeringProgress } from "./software-engineering/progress-store";

function canonicalLearningStateIsEmpty(): boolean {
  const state = resetLearningState("all");
  return state.handbook.visitedSections.length === 0
    && state.handbook.controlRoom.completedRuns === 0
    && state.lab.completedSteps.length === 0
    && state.lab.evalRunsCompleted === 0;
}

/**
 * Clear all locally held progress, including in-memory fallback snapshots.
 *
 * The boolean says whether Course 1 returned an empty canonical state and every
 * legacy course store reported a durable browser write. The v2 API does not yet
 * expose a separate persistence result, so callers must not turn `true` into a
 * stronger claim about v2 durability. A `false` result still means the stores'
 * in-memory sessions were cleared.
 */
export async function resetEveryCourseProgress(): Promise<boolean> {
  const canonicalCleared = canonicalLearningStateIsEmpty();

  // Codex owns the shared legacy record. Clear malformed or stale input before
  // each course store drops its module cache, then remove the shared record a
  // second time after those stores have emitted their reset events. Several
  // legacy writers seed version markers during reset; the final removal keeps
  // the site-wide contract literal: no shared progress survives.
  const sharedBeforeStoreResets = resetAllCourseProgress();
  const results = [
    canonicalCleared,
    sharedBeforeStoreResets.persisted,
    resetAgentOrchestrationProgress(),
    resetAgenticVideoEditingProgress(),
    resetAiTutorProgress(),
    resetClaudeIncomeProgress(),
    resetAllCourseKitProgress(),
    resetClaudeProgressAfterGlobalReset().persisted,
    resetGithubProgress().persisted,
    resetGrokProgress(),
    resetIncomeProgress(),
    resetMcpProgress(),
    resetProductManagementProgress(),
    resetPromptProgress(),
    resetRagProgress(),
    resetSoftwareEngineeringProgress(),
  ];

  // Cursor serializes its dedicated store through an asynchronous Web Lock.
  // Clear the shared record before yielding to that lock so the reset button's
  // synchronous effect is already complete when the browser click returns.
  // Keep the post-lock removal below as protection against any queued legacy
  // writer that runs while the lock request is pending.
  const sharedBeforeAsyncReset = resetAllCourseProgress();
  results.push(sharedBeforeAsyncReset.persisted);
  results.push((await resetCursorProgressAfterGlobalReset()).persisted);

  const sharedAfterStoreResets = resetAllCourseProgress();
  results.push(sharedAfterStoreResets.persisted);

  return results.every(Boolean);
}
