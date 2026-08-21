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

  onTestEnd(_test: TestCase, result: TestResult): void {
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
      `private-suite: test ${this.completed}/${this.total} ${status}\n`,
    );
  }

  onEnd(result: FullResult): void {
    const status = RUN_STATUSES.has(result.status) ? result.status : "unknown";
    process.stdout.write(`private-suite: run ${status}\n`);
  }
}
