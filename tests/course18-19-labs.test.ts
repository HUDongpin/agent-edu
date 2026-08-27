import assert from "node:assert/strict";
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const ROOT = resolve(import.meta.dirname, "..");

type LabContract = {
  readonly courseId: "ai-python-data" | "machine-learning";
  readonly validatorId: string;
  readonly artifactIds: readonly string[];
  readonly runner: string;
  readonly negativeMutation: (submission: Record<string, unknown>) => void;
};

const CONTRACTS: readonly LabContract[] = [
  {
    courseId: "ai-python-data",
    validatorId: "aicourse.ai-python-data.validator.v1",
    runner: "run_audit.py",
    artifactIds: [
      "environment-receipt",
      "executable-notebook",
      "data-dictionary",
      "cleaning-ledger",
      "validation-report",
      "statistical-note",
      "visual-report",
      "provenance-manifest",
    ],
    negativeMutation(submission) {
      submission.courseVersion = "tampered-course-version";
    },
  },
  {
    courseId: "machine-learning",
    validatorId: "aicourse.machine-learning.validator.v1",
    runner: "run_pipeline.py",
    artifactIds: [
      "problem-split-contract",
      "baseline-experiment",
      "reproducible-pipeline",
      "model-comparison",
      "metrics-calibration",
      "subgroup-error-audit",
      "model-card",
      "no-deploy-review",
    ],
    negativeMutation(submission) {
      const artifacts = submission.artifacts as Array<{
        artifactId: string;
        content: Record<string, unknown>;
      }>;
      const review = artifacts.find(
        (artifact) => artifact.artifactId === "no-deploy-review",
      );
      assert.ok(review);
      review.content.decision = "deploy";
    },
  },
];

function runPython(args: readonly string[], cwd: string) {
  return spawnSync("python3", args, {
    cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      PYTHONDONTWRITEBYTECODE: "1",
      PYTHONHASHSEED: "0",
      TZ: "UTC",
    },
  });
}

for (const contract of CONTRACTS) {
  test(`${contract.courseId} lab clean-runs, validates, and fails a bound mutation`, () => {
    const sandbox = mkdtempSync(join(tmpdir(), `${contract.courseId}-lab-test-`));
    try {
      const sourceCourse = join(ROOT, "public/courses", contract.courseId);
      const copiedCourse = join(sandbox, contract.courseId);
      cpSync(sourceCourse, copiedCourse, { recursive: true });
      const lab = join(copiedCourse, "lab");
      const output = join(sandbox, "work");

      const cleanRun = contract.courseId === "ai-python-data"
        ? runPython(
          [join(lab, "run_notebook.py"), "--output-dir", output],
          lab,
        )
        : runPython(
          [join(lab, contract.runner), "--course-dir", copiedCourse, "--output-dir", output],
          lab,
        );
      assert.equal(
        cleanRun.status,
        0,
        `clean run failed\nstdout:\n${cleanRun.stdout}\nstderr:\n${cleanRun.stderr}`,
      );

      const submissionPath = join(output, "submission.generated.json");
      const validation = runPython(
        [join(lab, "validate.py"), "--package", submissionPath],
        lab,
      );
      assert.equal(
        validation.status,
        0,
        `validator failed\nstdout:\n${validation.stdout}\nstderr:\n${validation.stderr}`,
      );
      assert.match(validation.stdout, new RegExp(`${contract.validatorId}: PASS`));

      const submission = JSON.parse(
        readFileSync(submissionPath, "utf8"),
      ) as Record<string, unknown>;
      assert.equal(submission.courseId, contract.courseId);
      assert.equal(submission.validatorId, contract.validatorId);
      assert.deepEqual(
        (submission.artifacts as Array<{ artifactId: string }>).map(
          (artifact) => artifact.artifactId,
        ),
        contract.artifactIds,
      );

      contract.negativeMutation(submission);
      const mutatedPath = join(output, "submission.mutated.json");
      writeFileSync(mutatedPath, `${JSON.stringify(submission, null, 2)}\n`);
      const rejected = runPython(
        [join(lab, "validate.py"), "--package", mutatedPath],
        lab,
      );
      assert.notEqual(rejected.status, 0, "bound mutation unexpectedly passed");
      assert.match(rejected.stdout, new RegExp(`${contract.validatorId}: FAIL`));
    } finally {
      rmSync(sandbox, { recursive: true, force: true });
    }
  });

  test(`${contract.courseId} schema, offline boundary, Server Component supplement, and route wiring are locked`, () => {
    const lab = join(ROOT, "public/courses", contract.courseId, "lab");
    const schema = JSON.parse(
      readFileSync(join(lab, "capstone.schema.json"), "utf8"),
    ) as Record<string, unknown>;
    assert.equal(schema["x-validatorId"], contract.validatorId);
    assert.equal(
      schema["x-schemaId"],
      `aicourse.${contract.courseId}.capstone.v1`,
    );
    assert.deepEqual(schema["x-artifactIds"], contract.artifactIds);

    const environment = JSON.parse(
      readFileSync(join(lab, "environment.lock.json"), "utf8"),
    ) as { runtime: { dependencies: string; networkRequired: boolean } };
    assert.equal(environment.runtime.dependencies, "stdlib-only");
    assert.equal(environment.runtime.networkRequired, false);
    const runner = readFileSync(join(lab, contract.runner), "utf8");
    assert.doesNotMatch(
      runner,
      /\b(?:requests|urllib|httpx|socket|subprocess)\b/,
      "canonical runner gained a network/process dependency",
    );

    if (contract.courseId === "ai-python-data") {
      const notebook = JSON.parse(
        readFileSync(join(lab, "audit.ipynb"), "utf8"),
      ) as { nbformat: number; cells: Array<{ cell_type: string }> };
      assert.equal(notebook.nbformat, 4);
      assert.equal(
        notebook.cells.filter((cell) => cell.cell_type === "code").length,
        2,
      );
      const notebookRunner = readFileSync(join(lab, "run_notebook.py"), "utf8");
      assert.doesNotMatch(notebookRunner, /\b(?:requests|urllib|httpx|socket|subprocess)\b/);
    }

    const componentDirectory = join(ROOT, "components", contract.courseId);
    const componentName = contract.courseId === "ai-python-data"
      ? "AiPythonDataLab.tsx"
      : "MachineLearningLab.tsx";
    const component = readFileSync(join(componentDirectory, componentName), "utf8");
    assert.doesNotMatch(component, /^\s*["']use client["']/m);
    assert.match(component, new RegExp(contract.validatorId));

    const dashboardRoute = readFileSync(
      join(ROOT, "app/[locale]", contract.courseId, "page.tsx"),
      "utf8",
    );
    const moduleRoute = readFileSync(
      join(ROOT, "app/[locale]", contract.courseId, "[module]/page.tsx"),
      "utf8",
    );
    assert.match(dashboardRoute, /supplement=\{/);
    assert.match(moduleRoute, /supplement=\{/);
  });
}
