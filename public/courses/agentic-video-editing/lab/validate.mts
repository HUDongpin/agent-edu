#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  validateAgenticVideoEditingGuidedProject,
  validateAgenticVideoEditingLearnerFinal,
  type AgenticVideoEditingArtifactReceiptV2,
} from "../../../../lib/agentic-video-editing/artifact-validation";
import type { AgenticVideoEditingModuleSlug } from "../../../../lib/agentic-video-editing/types";

function valueAfter(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const guidedRoot = path.join(scriptDirectory, "fixtures", "guided-v2");
const learnerRoot = valueAfter("--learner-final");
const guidedWorkingRoot = valueAfter("--guided-project");
const moduleSlug = valueAfter("--module");
const artifactId = valueAfter("--artifact-id");
const artifactPath = valueAfter("--artifact");
const validatedAt = valueAfter("--validated-at");

if (learnerRoot && guidedWorkingRoot) {
  throw new Error("--learner-final and --guided-project are mutually exclusive");
}
const result = learnerRoot
  ? validateAgenticVideoEditingLearnerFinal(path.resolve(learnerRoot), {
      receiptPathRoot: process.cwd(),
      validatedAt,
    })
  : validateAgenticVideoEditingGuidedProject(
      guidedWorkingRoot ? path.resolve(guidedWorkingRoot) : guidedRoot,
      {
        receiptPathRoot: process.cwd(),
        validatedAt,
        verifyFixtureLedger: !guidedWorkingRoot,
        throughModuleSlug: moduleSlug as AgenticVideoEditingModuleSlug | undefined,
      },
    );

let dispatchIssue: string | null = null;
let selectedReceipt: AgenticVideoEditingArtifactReceiptV2 | null = null;
if (moduleSlug || artifactId || artifactPath) {
  if (!moduleSlug || !artifactId || !artifactPath) {
    dispatchIssue = "--module, --artifact-id, and --artifact must be supplied together";
  } else {
    const receipts = (result.receiptArrays[
      moduleSlug as keyof typeof result.receiptArrays
    ] ?? []) as readonly AgenticVideoEditingArtifactReceiptV2[];
    selectedReceipt = receipts.find((receipt) => receipt.artifactId === artifactId) ?? null;
    if (!selectedReceipt) {
      dispatchIssue = `no validated receipt for ${moduleSlug}/${artifactId}`;
    } else if (path.posix.normalize(selectedReceipt.artifactPath) !== path.posix.normalize(artifactPath)) {
      dispatchIssue = `validated artifact path is ${selectedReceipt.artifactPath}, not ${artifactPath}`;
    }
  }
}

const ok = result.ok && !dispatchIssue;
const output = {
  validator: "aicourse.agentic-video-editing.offline-artifacts.v2",
  mode: learnerRoot ? "learner-final" : guidedWorkingRoot ? "guided-working-project" : "guided-reference-project",
  ok,
  projectId: result.projectId ?? null,
  fixtureLedgerSha256: result.fixtureLedgerSha256 ?? null,
  issues: [...result.issues, ...(dispatchIssue ? [dispatchIssue] : [])],
  selectedReceipt,
  receiptArrays: result.receiptArrays,
  limitations: [
    "The validator checks local bytes, lineage, declared authority, and structured semantics; it does not authenticate a reviewer or establish legal rights.",
    "A validated result does not itself authorize rendering, network access, paid use, upload, publication, or deployment.",
  ],
};

console.log(JSON.stringify(output, null, 2));
process.exitCode = ok ? 0 : 1;
