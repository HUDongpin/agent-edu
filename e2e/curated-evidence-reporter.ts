import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";
import {
  curatedProject,
  hasPublishedCuratedEvidence,
  PUBLIC_EVIDENCE_CONTRACT_ANNOTATION,
  writeCuratedEvidenceBundle,
} from "./curated-evidence";
import { createUniformRedactionPng } from "./png-sanitizer";

const PUBLIC_CONTRACT_MARKER =
  "safe evidence contract: reached intentional assertion";

function publicStatus(
  status: TestResult["status"] | FullResult["status"],
) {
  switch (status) {
    case "passed":
    case "failed":
    case "timedout":
    case "interrupted":
    case "skipped":
    case "timedOut":
      return status.toLowerCase();
    default:
      return "failed";
  }
}

function printPublicLine(line: string) {
  process.stdout.write(`${line}\n`);
}

/**
 * Reporter-level fallback for failures that happen before the public fixture
 * can finish. It intentionally never reads test titles, errors, stdout,
 * stderr, attachments, URLs, page state, or console text.
 */
export default class CuratedEvidenceReporter implements Reporter {
  private writerFailed = false;
  private completed = 0;
  private total = 0;

  printsToStdio(): boolean {
    return true;
  }

  onBegin(_config: FullConfig, suite: Suite): void {
    this.total = suite.allTests().length;
    printPublicLine(`public-browser: ${this.total} test(s)`);
  }

  onTestEnd(testCase: TestCase, result: TestResult): void {
    this.completed += 1;
    if (
      result.annotations.some(
        (annotation) => annotation.type === PUBLIC_EVIDENCE_CONTRACT_ANNOTATION,
      )
    ) {
      printPublicLine(PUBLIC_CONTRACT_MARKER);
    }
    printPublicLine(
      `public-browser: test ${this.completed}/${this.total} ${publicStatus(result.status)}`,
    );

    if (result.status !== "skipped" && result.status !== testCase.expectedStatus) {
      try {
        if (hasPublishedCuratedEvidence(testCase.id)) return;

        const projectName = testCase.parent.project()?.name ?? "";
        const project = curatedProject(projectName);
        writeCuratedEvidenceBundle({
          testId: testCase.id,
          ...project,
          screenshot: createUniformRedactionPng(),
          trace: [],
          consoleCounts: {},
          pageErrorCount: 0,
        });
      } catch {
        this.writerFailed = true;
        printPublicLine("public-browser: evidence unavailable");
      }
    }
  }

  async onEnd(result: FullResult): Promise<{ status: FullResult["status"] } | undefined> {
    printPublicLine(
      `public-browser: run ${this.writerFailed ? "failed" : publicStatus(result.status)}`,
    );
    return this.writerFailed ? { status: "failed" } : undefined;
  }
}
