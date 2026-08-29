import { ProviderError, isProviderError } from "../byok/types";
import { LAB_CONCURRENCY } from "./plans";

export interface LabRunContext {
  signal: AbortSignal;
  /** Call immediately before every generator and judge request. */
  checkpoint(): void;
}

export interface LabRunTask<Result> {
  id: string;
  run(context: LabRunContext): Promise<Result>;
}

export type LabRunStatus = "completed" | "cancelled" | "failed" | "superseded";

export interface LabRunOutcome<Result> {
  runId: string;
  status: LabRunStatus;
  results?: Result[];
  error?: ProviderError;
  completedTasks: number;
  /** At most four dispatched requests can have billing that remains unknown. */
  inFlightAtStop: number;
}

export interface LabRunOptions<Task extends LabRunTask<Result>, Result> {
  concurrency?: number;
  onProgress?: (completed: number, total: number) => void;
  onContentFailure: (error: unknown, task: Task, index: number) => Result;
}

export interface LabRunHandle<Result> {
  runId: string;
  promise: Promise<LabRunOutcome<Result>>;
}

interface ActiveRun {
  runId: string;
  controller: AbortController;
  status: Exclude<LabRunStatus, "completed"> | null;
  fatalError?: ProviderError;
  activeTasks: number;
  inFlightAtStop: number;
  settled: boolean;
}

let runSequence = 0;
function defaultRunId(): string {
  runSequence++;
  return `lab-${Date.now().toString(36)}-${runSequence.toString(36)}`;
}

export function isContentFailure(error: unknown): boolean {
  return !isProviderError(error)
    || error.code === "invalid-response"
    || error.code === "empty-response";
}

export class LabRunner {
  private active: ActiveRun | null = null;
  private readonly idFactory: () => string;

  constructor(idFactory: () => string = defaultRunId) {
    this.idFactory = idFactory;
  }

  isCurrent(runId: string): boolean {
    return this.active?.runId === runId;
  }

  stop(runId = this.active?.runId): boolean {
    const state = this.active;
    if (!state || state.settled || !runId || state.runId !== runId) return false;
    state.status = "cancelled";
    state.inFlightAtStop = Math.min(state.activeTasks, LAB_CONCURRENCY);
    state.controller.abort(new DOMException("Stopped by the learner", "AbortError"));
    return true;
  }

  start<Result, Task extends LabRunTask<Result>>(
    tasks: readonly Task[],
    options: LabRunOptions<Task, Result>,
  ): LabRunHandle<Result> {
    const previous = this.active;
    if (previous && !previous.settled) {
      previous.status = "superseded";
      previous.inFlightAtStop = Math.min(previous.activeTasks, LAB_CONCURRENCY);
      previous.controller.abort(new DOMException("Superseded by a newer run", "AbortError"));
    }

    const state: ActiveRun = {
      runId: this.idFactory(),
      controller: new AbortController(),
      status: null,
      activeTasks: 0,
      inFlightAtStop: 0,
      settled: false,
    };
    this.active = state;
    return {
      runId: state.runId,
      promise: this.execute(state, tasks, options),
    };
  }

  private async execute<Result, Task extends LabRunTask<Result>>(
    state: ActiveRun,
    tasks: readonly Task[],
    options: LabRunOptions<Task, Result>,
  ): Promise<LabRunOutcome<Result>> {
    const requestedConcurrency = options.concurrency ?? LAB_CONCURRENCY;
    const concurrency = Math.max(1, Math.min(
      Number.isSafeInteger(requestedConcurrency) ? requestedConcurrency : LAB_CONCURRENCY,
      LAB_CONCURRENCY,
      tasks.length || 1,
    ));
    const results = new Array<Result>(tasks.length);
    let nextIndex = 0;
    let completedTasks = 0;

    const checkpoint = () => {
      if (state.controller.signal.aborted || state.status) {
        throw new ProviderError("aborted", "This Lab run has stopped.", {
          billing: "not-sent",
        });
      }
    };
    const context: LabRunContext = {
      signal: state.controller.signal,
      checkpoint,
    };

    const fail = (error: ProviderError) => {
      if (state.status) return;
      state.status = "failed";
      state.fatalError = error;
      state.inFlightAtStop = Math.min(state.activeTasks, LAB_CONCURRENCY);
      state.controller.abort(error);
    };

    const worker = async () => {
      while (!state.status && !state.controller.signal.aborted) {
        const index = nextIndex++;
        if (index >= tasks.length) return;
        const task = tasks[index];
        state.activeTasks++;
        let value: Result | undefined;
        let completed = false;
        try {
          checkpoint();
          value = await task.run(context);
          checkpoint();
          completed = true;
        } catch (error) {
          if (state.status || state.controller.signal.aborted) return;
          if (isContentFailure(error)) {
            try {
              value = options.onContentFailure(error, task, index);
              completed = true;
            } catch (handlerError) {
              fail(isProviderError(handlerError) ? handlerError : new ProviderError(
                "provider",
                "The Lab could not record a content failure.",
                { billing: "not-sent", cause: handlerError },
              ));
            }
          } else if (isProviderError(error)) {
            fail(error);
          }
        } finally {
          state.activeTasks--;
        }

        if (!completed || value === undefined || state.status || state.controller.signal.aborted) return;
        results[index] = value;
        completedTasks++;
        if (this.active === state) {
          options.onProgress?.(completedTasks, tasks.length);
        }
      }
    };

    await Promise.all(Array.from({ length: concurrency }, worker));
    state.settled = true;

    if (state.status) {
      return {
        runId: state.runId,
        status: state.status,
        error: state.fatalError,
        completedTasks,
        inFlightAtStop: state.inFlightAtStop,
      };
    }
    return {
      runId: state.runId,
      status: "completed",
      results,
      completedTasks,
      inFlightAtStop: 0,
    };
  }
}
