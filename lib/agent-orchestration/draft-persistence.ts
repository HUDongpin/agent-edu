export const AGENT_ORCHESTRATION_DRAFT_DEBOUNCE_MS = 600;

export type AgentOrchestrationDraftStatus =
  | "editing"
  | "saving"
  | "draft-saved"
  | "evidence-accepted"
  | null;

type DraftWrite = () => boolean;
type ScheduleDraftWrite = (callback: () => void, delayMs: number) => unknown;
type CancelDraftWrite = (handle: unknown) => void;

export interface AgentOrchestrationDraftWriterOptions {
  readonly delayMs?: number;
  readonly initialStatus?: AgentOrchestrationDraftStatus;
  readonly schedule?: ScheduleDraftWrite;
  readonly cancel?: CancelDraftWrite;
  readonly onStatus?: (status: AgentOrchestrationDraftStatus) => void;
}

export interface AgentOrchestrationDraftWriter {
  readonly status: AgentOrchestrationDraftStatus;
  readonly pending: boolean;
  queue(write: DraftWrite): void;
  flush(): boolean | null;
  cancelPending(): void;
  markEvidenceAccepted(): void;
  setStatusListener(listener: ((status: AgentOrchestrationDraftStatus) => void) | null): void;
  dispose(flushPending: boolean): void;
}

/**
 * One replaceable pending write per editor. Repeated keystrokes reset a single
 * timer; blur/navigation can synchronously flush the latest closure. Explicit
 * evidence acceptance cancels that closure so stale pending state can never
 * invalidate an accepted receipt afterward.
 */
export function createAgentOrchestrationDraftWriter(
  options: AgentOrchestrationDraftWriterOptions = {},
): AgentOrchestrationDraftWriter {
  const delayMs = options.delayMs ?? AGENT_ORCHESTRATION_DRAFT_DEBOUNCE_MS;
  const schedule = options.schedule
    ?? ((callback: () => void, wait: number) => setTimeout(callback, wait));
  const cancel = options.cancel
    ?? ((handle: unknown) => clearTimeout(handle as ReturnType<typeof setTimeout>));
  let currentStatus = options.initialStatus ?? null;
  let pendingWrite: DraftWrite | null = null;
  let timer: unknown;
  let disposed = false;
  let statusListener = options.onStatus ?? null;

  const transition = (status: AgentOrchestrationDraftStatus) => {
    if (currentStatus === status) return;
    currentStatus = status;
    statusListener?.(status);
  };
  const clearTimer = () => {
    if (timer === undefined) return;
    cancel(timer);
    timer = undefined;
  };

  const writer: AgentOrchestrationDraftWriter = {
    get status() {
      return currentStatus;
    },
    get pending() {
      return pendingWrite !== null;
    },
    queue(write) {
      if (disposed) return;
      pendingWrite = write;
      clearTimer();
      transition("editing");
      timer = schedule(() => {
        timer = undefined;
        writer.flush();
      }, delayMs);
    },
    flush() {
      if (!pendingWrite) return null;
      clearTimer();
      const write = pendingWrite;
      pendingWrite = null;
      transition("saving");
      let persisted = false;
      try {
        persisted = write();
      } catch {
        persisted = false;
      }
      transition(persisted ? "draft-saved" : "editing");
      return persisted;
    },
    cancelPending() {
      clearTimer();
      pendingWrite = null;
    },
    markEvidenceAccepted() {
      writer.cancelPending();
      transition("evidence-accepted");
    },
    setStatusListener(listener) {
      statusListener = listener;
    },
    dispose(flushPending) {
      if (disposed) return;
      if (flushPending) writer.flush();
      else writer.cancelPending();
      disposed = true;
    },
  };
  return writer;
}
