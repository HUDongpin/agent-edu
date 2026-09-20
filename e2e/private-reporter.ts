import type {
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";

export const PRIVATE_CONTRACT_ANNOTATION = "private-evidence-contract-reached";
export const PRIVATE_TIMEOUT_CONTRACT_ANNOTATION =
  "private-evidence-contract-full-timeout-reached";

const PRIVATE_CONTRACT_MARKER =
  "private evidence contract: reached intentional assertion";
const PRIVATE_TIMEOUT_CONTRACT_MARKER =
  "private evidence contract: reached full-test input timeout";
const RESULT_STATUSES = new Set([
  "passed",
  "failed",
  "timedOut",
  "skipped",
  "interrupted",
]);
const RUN_STATUSES = new Set(["passed", "failed", "timedout", "interrupted"]);

/**
 * Private Lab/Provider suites may exercise credentials, prompts and replies.
 * This reporter intentionally ignores test titles, errors, steps, stdout and
 * stderr. Its complete output vocabulary is fixed here and contains only
 * counts, runner-controlled statuses and two non-sensitive contract markers.
 */
/**
 * The project name is runner-controlled configuration, not test data, and it is
 * stripped to [a-z0-9-] here so that even a project renamed after something
 * sensitive cannot widen this reporter's vocabulary.
 */
function safeProject(test: TestCase): string {
  const name = test.parent?.project?.()?.name ?? "";
  const token = name.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 32);
  return token || "unknown";
}

export default class PrivateReporter implements Reporter {
  private completed = 0;
  private total = 0;

  printsToStdio(): boolean {
    return true;
  }

  onBegin(_config: unknown, suite: Suite): void {
    this.total = suite.allTests().length;
    process.stdout.write(`private-suite: ${this.total} test(s)\n`);
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    // An attempt that will be retried is not a result: counting it would push
    // the index past the total and void the whole run at the validator.
    if (
      (result.status === "failed" || result.status === "timedOut")
      && result.retry < test.retries
    ) {
      process.stdout.write(
        `private-suite: retry ${result.status} ${safeProject(test)}\n`,
      );
      return;
    }
    this.completed += 1;
    const status = RESULT_STATUSES.has(result.status) ? result.status : "unknown";
    if (
      result.annotations.some(
        (annotation) => annotation.type === PRIVATE_CONTRACT_ANNOTATION,
      )
    ) {
      process.stdout.write(`${PRIVATE_CONTRACT_MARKER}\n`);
    }
    if (
      result.annotations.some(
        (annotation) => annotation.type === PRIVATE_TIMEOUT_CONTRACT_ANNOTATION,
      )
    ) {
      process.stdout.write(`${PRIVATE_TIMEOUT_CONTRACT_MARKER}\n`);
    }
    process.stdout.write(
      `private-suite: test ${this.completed}/${this.total} ${status} ${safeProject(test)}\n`,
    );
  }

  onEnd(result: FullResult): void {
    const status = RUN_STATUSES.has(result.status) ? result.status : "unknown";
    process.stdout.write(`private-suite: run ${status}\n`);
  }
}
