import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  appendFileSync,
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test, { type TestContext } from "node:test";

import {
  AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_ALIASES,
  AGENTIC_VIDEO_EDITING_GUIDED_ARTIFACT_PATHS,
  AGENTIC_VIDEO_EDITING_GUIDED_PROJECT_ID,
  AGENTIC_VIDEO_EDITING_LEARNER_DOSSIER_SCHEMA,
  sha256AgenticVideoEditingFile,
  validateAgenticVideoEditingGuidedProject,
  validateAgenticVideoEditingLearnerFinal,
} from "../lib/agentic-video-editing/artifact-validation";
import { AGENTIC_VIDEO_EDITING_COURSE_MANIFEST } from "../lib/agentic-video-editing/manifest";

type MutableRecord = Record<string, unknown>;

const GUIDED_ROOT = path.resolve(
  "public/courses/agentic-video-editing/lab/fixtures/guided-v2",
);
const GUIDED_ARCHIVE = path.resolve(
  "public/courses/agentic-video-editing/lab/course22-guided-v2.zip",
);
const FIXED_VALIDATED_AT = "2026-08-28T10:00:00+08:00";

function runCourseChecker(args: readonly string[]) {
  return spawnSync(process.execPath, [
    "--import", "tsx", "scripts/check-agentic-video-editing-course.mjs", ...args,
  ], {
    cwd: path.resolve("."),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function record(value: unknown, label = "value"): MutableRecord {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), `${label} must be a record`);
  return value as MutableRecord;
}

function records(value: unknown, label = "value"): MutableRecord[] {
  assert.ok(Array.isArray(value), `${label} must be an array`);
  return value.map((item, index) => record(item, `${label}[${index}]`));
}

function readJson(filePath: string): MutableRecord {
  return record(JSON.parse(readFileSync(filePath, "utf8")), filePath);
}

function writeJson(filePath: string, value: unknown): void {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function copyGuidedProject(t: TestContext): string {
  const root = mkdtempSync(path.join(tmpdir(), "aicourse-course22-"));
  cpSync(GUIDED_ROOT, root, { recursive: true });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function mutateArtifact(
  root: string,
  artifactId: keyof typeof AGENTIC_VIDEO_EDITING_GUIDED_ARTIFACT_PATHS,
  mutate: (artifact: MutableRecord) => void,
): void {
  const filePath = path.join(root, AGENTIC_VIDEO_EDITING_GUIDED_ARTIFACT_PATHS[artifactId]);
  const artifact = readJson(filePath);
  mutate(artifact);
  writeJson(filePath, artifact);
}

function moduleForBaseArtifact(baseArtifactId: string) {
  const moduleManifest = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.find((candidate) => (
    candidate.slug !== "production-capstone"
      && candidate.producesArtifactIds.includes(baseArtifactId)
  ));
  assert.ok(moduleManifest, `module missing for ${baseArtifactId}`);
  return moduleManifest;
}

interface LearnerArtifactInfo {
  readonly artifactId: string;
  readonly locator: string;
  readonly sha256: string;
  readonly artifactSchemaId: string;
  readonly validatorId: string;
}

function buildLearnerFinal(
  t: TestContext,
  options: { readonly rightsBlocked?: boolean } = {},
): string {
  const root = copyGuidedProject(t);
  const projectId = "learner-morgan-video-project-v2";
  const hashes: Record<string, string> = {};
  const artifactInfo: Record<string, LearnerArtifactInfo> = {};

  for (const relativePath of [
    "assets/camera-a.mp4",
    "assets/room-audio.wav",
    "outputs/candidate-render.mp4",
    "outputs/review-1080p.mp4",
    "outputs/review-captioned.mp4",
    "outputs/review-captioned.vtt",
  ]) {
    appendFileSync(
      path.join(root, relativePath),
      `\nAICOURSE-LEARNER-FIXTURE:${projectId}:${relativePath}\n`,
      "utf8",
    );
  }
  for (const [assetId, assetPath, probePath] of [
    ["camera-a", "assets/camera-a.mp4", "assets/camera-a.probe.json"],
    ["room-audio", "assets/room-audio.wav", "assets/room-audio.probe.json"],
  ] as const) {
    const probe = readJson(path.join(root, probePath));
    probe.assetId = assetId;
    probe.assetPath = assetPath;
    probe.assetSha256 = sha256AgenticVideoEditingFile(path.join(root, assetPath));
    writeJson(path.join(root, probePath), probe);
  }

  for (const [baseArtifactId, locator] of Object.entries(AGENTIC_VIDEO_EDITING_GUIDED_ARTIFACT_PATHS)) {
    const filePath = path.join(root, locator);
    const artifact = readJson(filePath);
    const moduleManifest = moduleForBaseArtifact(baseArtifactId);
    const learnerArtifactId = AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_ALIASES[
      baseArtifactId as keyof typeof AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_ALIASES
    ];
    artifact.projectId = projectId;
    artifact.artifactId = learnerArtifactId;
    artifact.parents = Object.fromEntries(moduleManifest.consumesArtifactIds.map((inputId) => {
      const learnerInputId = AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_ALIASES[
        inputId as keyof typeof AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_ALIASES
      ];
      assert.ok(hashes[learnerInputId], `parent hash missing for ${learnerInputId}`);
      return [learnerInputId, hashes[learnerInputId]];
    }));

    const payload = record(artifact.payload, `${baseArtifactId}.payload`);
    if (baseArtifactId === "creative-brief") {
      record(payload.rightsContract).decisionOwner = "Morgan Lee learner project rights owner";
    }
    if (baseArtifactId === "media-manifest") {
      payload.fixtureBoundary = "learner-authorized-media";
      for (const asset of records(payload.assets, "media assets")) {
        asset.owner = "Morgan Lee learner project rights owner";
        asset.consentStatus = "cleared";
        const assetPath = path.join(root, String(asset.relativePath));
        asset.sha256 = sha256AgenticVideoEditingFile(assetPath);
        asset.byteLength = readFileSync(assetPath).byteLength;
      }
      const rights = record(payload.rightsDecision);
      rights.owner = "Morgan Lee learner project rights owner";
      rights.decidedAt = "2026-08-28T11:00:00+08:00";
    }
    if (baseArtifactId === "clock-receipt") {
      for (const clock of records(payload.assetClocks, "asset clocks")) {
        const probePath = path.join(root, String(clock.probeReceiptPath));
        clock.probeReceiptSha256 = sha256AgenticVideoEditingFile(probePath);
      }
    }
    if (baseArtifactId === "edit-plan") {
      const inputAssetHashes = record(payload.inputAssetHashes);
      inputAssetHashes["camera-a"] = sha256AgenticVideoEditingFile(path.join(root, "assets/camera-a.mp4"));
      inputAssetHashes["room-audio"] = sha256AgenticVideoEditingFile(path.join(root, "assets/room-audio.wav"));
    }
    if (baseArtifactId === "render-receipt") {
      payload.editPlanArtifactSha256 = hashes[AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_ALIASES["edit-plan"]];
      payload.toolPolicyArtifactSha256 = hashes[AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_ALIASES["tool-permission-envelope"]];
      const output = record(payload.output);
      const outputPath = path.join(root, String(output.relativePath));
      output.sha256 = sha256AgenticVideoEditingFile(outputPath);
      output.byteLength = readFileSync(outputPath).byteLength;
      record(output.probe).sourceSha256 = output.sha256;
    }
    if (baseArtifactId === "delivery-matrix") {
      payload.renderSourceSha256 = sha256AgenticVideoEditingFile(path.join(root, "outputs/candidate-render.mp4"));
      for (const variant of records(payload.variants, "delivery variants")) {
        const captions = record(variant.captions);
        if (typeof captions.sidecarPath === "string") {
          captions.sidecarSha256 = sha256AgenticVideoEditingFile(path.join(root, captions.sidecarPath));
        }
      }
    }
    if (baseArtifactId === "variant-receipts") {
      payload.deliveryMatrixArtifactSha256 = hashes[AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_ALIASES["delivery-matrix"]];
      for (const receipt of records(payload.receipts, "variant receipts")) {
        const outputPath = path.join(root, String(receipt.outputPath));
        receipt.sha256 = sha256AgenticVideoEditingFile(outputPath);
        receipt.byteLength = readFileSync(outputPath).byteLength;
        record(receipt.probe).sourceSha256 = receipt.sha256;
        receipt.captionReview = "human-reviewed-learner-final";
      }
    }
    if (baseArtifactId === "verification-report") {
      const artifactHashes = record(payload.artifactHashes);
      artifactHashes.deliveryMatrix = hashes[AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_ALIASES["delivery-matrix"]];
      artifactHashes.variantReceipts = hashes[AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_ALIASES["variant-receipts"]];
      for (const reviewKey of ["semanticReview", "accessibilityReview", "rightsReview"] as const) {
        const review = record(payload[reviewKey]);
        review.reviewerName = "Morgan Lee independent reviewer";
        review.reviewerRole = `${reviewKey} reviewer for learner final`;
        review.reviewedAt = "2026-08-28T11:20:00+08:00";
      }
      if (options.rightsBlocked) {
        const rightsReview = record(payload.rightsReview);
        rightsReview.status = "blocked";
        rightsReview.notes = "Named review found unresolved territorial rights, so the exact candidate must not be published.";
        const repairLoop = record(payload.repairLoop);
        repairLoop.status = "blocked";
      }
      const candidateReview = record(payload.candidateReview);
      candidateReview.reviewerName = "Morgan Lee independent reviewer";
      candidateReview.reviewerRole = "Candidate verification reviewer";
      candidateReview.reviewedAt = "2026-08-28T11:25:00+08:00";
      candidateReview.disposition = options.rightsBlocked
        ? "blocked-before-release-decision"
        : "ready-for-release-decision";
      candidateReview.reason = options.rightsBlocked
        ? "The exact final candidate is bound to the evidence package but blocked by the unresolved named rights review."
        : "The exact final candidate is ready for a separate named-human release decision.";
      candidateReview.candidateSha256 = sha256AgenticVideoEditingFile(
        path.join(root, "outputs/review-captioned.mp4"),
      );
    }

    writeJson(filePath, artifact);
    const sha256 = sha256AgenticVideoEditingFile(filePath);
    hashes[learnerArtifactId] = sha256;
    artifactInfo[learnerArtifactId] = {
      artifactId: learnerArtifactId,
      locator,
      sha256,
      artifactSchemaId: moduleManifest.artifactSchemaId,
      validatorId: moduleManifest.validatorId,
    };
  }

  const capstoneModule = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.find(
    (candidate) => candidate.slug === "production-capstone",
  );
  assert.ok(capstoneModule);
  const capstoneParents = Object.fromEntries(
    Object.values(AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_ALIASES).map((artifactId) => (
      [artifactId, hashes[artifactId]]
    )),
  );
  const verificationArtifact = readJson(path.join(
    root,
    AGENTIC_VIDEO_EDITING_GUIDED_ARTIFACT_PATHS["verification-report"],
  ));
  const candidateSha256 = String(record(record(verificationArtifact.payload).candidateReview).candidateSha256);
  const releaseDecision = {
    schemaVersion: capstoneModule.artifactSchemaId,
    courseId: "agentic-video-editing",
    courseVersion: "2.0.0",
    moduleSlug: "production-capstone",
    artifactId: "release-decision",
    projectId,
    parents: capstoneParents,
    payload: {
      reviewerName: "Morgan Lee independent reviewer",
      reviewerRole: "Final release decision reviewer",
      signedAt: "2026-08-28T11:30:00+08:00",
      decision: "do-not-publish",
      reason: "The evidence package is complete for assessment, while the named reviewer intentionally withholds publication.",
      candidateSha256,
      rightsState: options.rightsBlocked ? "blocked" : "cleared-for-declared-use",
      semanticReview: "pass",
      accessibilityReview: "pass",
      notAgentGenerated: true,
    },
    limitations: [
      "The local validator checks declared fields and hashes but does not authenticate the named reviewer identity.",
      "A do-not-publish assessment outcome grants no later upload, release, or distribution authority."
    ],
  };
  const decisionPath = path.join(root, "release-decision.json");
  writeJson(decisionPath, releaseDecision);
  const decisionSha256 = sha256AgenticVideoEditingFile(decisionPath);
  artifactInfo["release-decision"] = {
    artifactId: "release-decision",
    locator: "release-decision.json",
    sha256: decisionSha256,
    artifactSchemaId: capstoneModule.artifactSchemaId,
    validatorId: capstoneModule.validatorId,
  };

  const evidence = [
    ...Object.values(AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_ALIASES).map((artifactId) => ({
      ...artifactInfo[artifactId],
      reviewState: options.rightsBlocked
        && artifactId === AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_ALIASES["verification-report"]
        ? "reviewed-blocked"
        : "reviewed-pass",
    })),
    {
      ...artifactInfo["release-decision"],
      reviewState: "reviewed-blocked",
    },
  ];
  const dossier = {
    schemaVersion: capstoneModule.artifactSchemaId,
    courseId: "agentic-video-editing",
    courseVersion: "2.0.0",
    moduleSlug: "production-capstone",
    artifactId: "production-dossier",
    projectId,
    parents: capstoneParents,
    payload: {
      learnerFinalSchemaId: AGENTIC_VIDEO_EDITING_LEARNER_DOSSIER_SCHEMA,
      learnerProjectId: projectId,
      guidedProjectIdReused: false,
      readiness: {
        quizVersion: "2.0.0:quiz-v2",
        currentAttemptPassed: true,
        criticalQuestionsCorrect: true,
        passedAt: "2026-08-28T11:10:00+08:00"
      },
      evidence,
      attestation: {
        learnerName: "Morgan Lee learner author",
        signedAt: "2026-08-28T11:28:00+08:00",
        authorizedMedia: true,
        noSecretsRetained: true,
        humanDecisionNotAgentGenerated: true,
      },
      decisionArtifact: {
        artifactId: "release-decision",
        locator: "release-decision.json",
        sha256: decisionSha256,
      },
    },
    limitations: [
      "The dossier validator confirms file binding and declared review states but cannot certify reviewer identity or review quality.",
      "Validator success records assessable evidence and never grants publishing, platform, legal, or deployment authority."
    ],
  };
  writeJson(path.join(root, "production-dossier.json"), dossier);
  return root;
}

test("the offline guided project validates eleven M1-M9 artifacts and exact v2 receipts", () => {
  const result = validateAgenticVideoEditingGuidedProject(GUIDED_ROOT, {
    validatedAt: FIXED_VALIDATED_AT,
  });
  assert.deepEqual(result.issues, []);
  assert.equal(result.ok, true);
  assert.equal(result.projectId, AGENTIC_VIDEO_EDITING_GUIDED_PROJECT_ID);
  assert.match(result.fixtureLedgerSha256 ?? "", /^[a-f0-9]{64}$/u);
  assert.equal(Object.keys(result.artifacts).length, 11);
  assert.equal(
    Object.values(result.receiptArrays).reduce((count, receipts) => count + (receipts?.length ?? 0), 0),
    11,
  );
  for (const receipts of Object.values(result.receiptArrays)) {
    for (const receipt of receipts ?? []) {
      assert.equal(receipt.status, "validated");
      assert.equal(receipt.validatedAt, FIXED_VALIDATED_AT);
      assert.equal(receipt.artifactSha256, result.artifacts[receipt.artifactId]?.sha256);
      assert.ok(receipt.limitations.length >= 2);
      assert.match(receipt.executedCommand, /^node --import tsx scripts\/check-agentic-video-editing-course\.mjs --guided-project /u);
    }
  }
});

test("the recorded M7 argv reproduces the exact candidate bytes from the bound local inputs", (t) => {
  const root = copyGuidedProject(t);
  const artifact = readJson(path.join(
    root,
    AGENTIC_VIDEO_EDITING_GUIDED_ARTIFACT_PATHS["render-receipt"],
  ));
  const payload = record(artifact.payload);
  const command = payload.command;
  assert.ok(Array.isArray(command));
  assert.equal(command[0], "ffmpeg");
  const environment = record(payload.environment);
  const version = spawnSync(String(command[0]), ["-version"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert.equal(version.status, 0, version.stderr);
  const actualVersion = version.stdout
    .split("\n")[0]
    ?.replace(/^ffmpeg version\s+/u, "")
    .split(/\s+/u)[0];
  if (actualVersion !== environment.version) {
    t.skip(`exact-byte replay requires fixture FFmpeg ${String(environment.version)}; found ${actualVersion}`);
    return;
  }
  const output = record(payload.output);
  const outputPath = path.join(root, String(output.relativePath));
  rmSync(outputPath);
  const rerun = spawnSync(String(command[0]), command.slice(1).map(String), {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert.equal(rerun.status, 0, rerun.stderr);
  assert.equal(sha256AgenticVideoEditingFile(outputPath), output.sha256);
});

test("the downloadable guided ZIP contains every and only the sorted ledger inventory", () => {
  const ledger = readJson(path.join(GUIDED_ROOT, "guided-project.ledger.json"));
  const files = record(ledger.files);
  const expected = [
    ...Object.keys(files),
    "guided-project.ledger.json",
  ].sort().map((relativePath) => `fixtures/guided-v2/${relativePath}`);
  const listed = spawnSync("unzip", ["-Z1", GUIDED_ARCHIVE], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert.equal(listed.status, 0, listed.stderr);
  assert.deepEqual(listed.stdout.trim().split("\n").sort(), expected);
});

test("a guided working copy validates only through the requested module and records the real invocation time", (t) => {
  const root = copyGuidedProject(t);
  mutateArtifact(root, "creative-brief", (artifact) => {
    record(artifact.payload).objective = "Create a newly reviewed, bounded synthetic edit for the learner working copy.";
  });
  const artifactPath = "artifacts/01-creative-brief.json";
  const before = Date.now();
  const valid = runCourseChecker([
    "--guided-project", root,
    "--module", "agentic-editing-contract",
    "--artifact-id", "creative-brief",
    "--artifact", artifactPath,
  ]);
  const after = Date.now();
  assert.equal(valid.status, 0, valid.stderr);
  const receipt = JSON.parse(valid.stdout) as { validatedAt: string; artifactSha256: string };
  const validatedAt = Date.parse(receipt.validatedAt);
  assert.ok(validatedAt >= before && validatedAt <= after);
  assert.notEqual(receipt.validatedAt, "2026-08-28T00:00:00+08:00");
  assert.equal(receipt.artifactSha256, sha256AgenticVideoEditingFile(path.join(root, artifactPath)));

  mutateArtifact(root, "creative-brief", (artifact) => {
    record(artifact.payload).objective = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
  });
  const invalid = runCourseChecker([
    "--guided-project", root,
    "--module", "agentic-editing-contract",
    "--artifact-id", "creative-brief",
    "--artifact", artifactPath,
  ]);
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stderr, /meaningful|No validated receipt/iu);
});

test("guided artifact validators reject destructive semantic, lineage, authority, path, and secret mutations", async (t) => {
  const cases: Array<{
    readonly name: string;
    readonly mutate: (root: string) => void;
    readonly expected: RegExp;
  }> = [
    {
      name: "duplicate/random creative text",
      mutate(root) {
        mutateArtifact(root, "creative-brief", (artifact) => {
          const payload = record(artifact.payload);
          payload.objective = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
          assert.ok(Array.isArray(payload.successCriteria));
          const criterion = payload.successCriteria[0];
          payload.successCriteria = [criterion, criterion, criterion, criterion];
        });
      },
      expected: /meaningful|unique/iu,
    },
    {
      name: "zero placeholder parent hash",
      mutate(root) {
        mutateArtifact(root, "edit-plan", (artifact) => {
          record(artifact.parents)["candidate-segments"] = "0".repeat(64);
        });
      },
      expected: /parent candidate-segments.*placeholder|hash-mismatched/iu,
    },
    {
      name: "cross-project artifact",
      mutate(root) {
        mutateArtifact(root, "candidate-segments", (artifact) => {
          artifact.projectId = "different-guided-project-v2";
        });
      },
      expected: /project binding/iu,
    },
    {
      name: "render without a prior tool policy",
      mutate(root) {
        rmSync(path.join(root, AGENTIC_VIDEO_EDITING_GUIDED_ARTIFACT_PATHS["tool-permission-envelope"]));
      },
      expected: /tool-permission-envelope.*does not exist|missing/iu,
    },
    {
      name: "live network and cost without authority",
      mutate(root) {
        mutateArtifact(root, "candidate-segments", (artifact) => {
          const lanes = records(record(artifact.payload).lanes);
          const live = lanes[2];
          live.enabled = true;
          live.execution = "live-model";
          live.provider = "Example provider";
          live.modelVersion = "example-model-2026-08";
          live.costUsd = 2;
          live.dataPath = "uploaded transcript and shot index";
        });
      },
      expected: /enabled live lane requires explicit/iu,
    },
    {
      name: "credential in an artifact field",
      mutate(root) {
        mutateArtifact(root, "tool-permission-envelope", (artifact) => {
          const credentialLike = ["sk", "examplecredential1234567890"].join("-");
          record(artifact.payload).recoveryPlan = `Use ${credentialLike} to resume the bounded renderer.`;
        });
      },
      expected: /credential-like/iu,
    },
    {
      name: "path traversal outside the project",
      mutate(root) {
        mutateArtifact(root, "media-manifest", (artifact) => {
          records(record(artifact.payload).assets)[0].relativePath = "../../etc/passwd";
        });
      },
      expected: /safe relative path/iu,
    },
    {
      name: "unsupported add-caption operation",
      mutate(root) {
        mutateArtifact(root, "edit-plan", (artifact) => {
          records(record(artifact.payload).operations)[0].kind = "add-caption";
        });
      },
      expected: /select operation/iu,
    },
    {
      name: "render output byte drift",
      mutate(root) {
        writeFileSync(path.join(root, "outputs/candidate-render.mp4"), "changed output bytes\n", "utf8");
      },
      expected: /render output hash|ledger hash mismatch/iu,
    },
    {
      name: "remote render input despite network false",
      mutate(root) {
        mutateArtifact(root, "render-receipt", (artifact) => {
          const command = record(artifact.payload).command as unknown[];
          command[command.indexOf("-i") + 1] = "https://example.invalid/source.mp4";
        });
      },
      expected: /shell-free relative-path|media-manifest path/iu,
    },
    {
      name: "absolute render input outside M6 roots",
      mutate(root) {
        mutateArtifact(root, "render-receipt", (artifact) => {
          const command = record(artifact.payload).command as unknown[];
          command[command.indexOf("-i") + 1] = "/tmp/outside-source.mp4";
        });
      },
      expected: /shell-free relative-path|allowedReadRoots/iu,
    },
    {
      name: "undeclared render input inside assets",
      mutate(root) {
        mutateArtifact(root, "render-receipt", (artifact) => {
          const command = record(artifact.payload).command as unknown[];
          command[command.indexOf("-i") + 1] = "assets/not-in-media-manifest.mp4";
        });
      },
      expected: /media-manifest path inside the M6 allowedReadRoots/iu,
    },
    {
      name: "filter script outside M6 read roots",
      mutate(root) {
        mutateArtifact(root, "render-receipt", (artifact) => {
          const command = record(artifact.payload).command as unknown[];
          command[command.indexOf("-filter_complex_script") + 1] = "outputs/untrusted-filter.txt";
        });
      },
      expected: /filter script.*inside the M6 allowedReadRoots/iu,
    },
    {
      name: "render command writes a different output",
      mutate(root) {
        mutateArtifact(root, "render-receipt", (artifact) => {
          const command = record(artifact.payload).command as unknown[];
          command[command.length - 1] = "outputs/unbound-candidate.mp4";
        });
      },
      expected: /must equal receipt output\.relativePath inside the M6 allowedWriteRoots/iu,
    },
    {
      name: "filter script content escapes the select-only edit plan",
      mutate(root) {
        const filterPath = path.join(root, "artifacts/07-render-filter.txt");
        writeFileSync(
          filterPath,
          "movie=http\\://127.0.0.1\\:9/undeclared.mp4[v];amovie=/tmp/undeclared.wav[a]\n",
          "utf8",
        );
        mutateArtifact(root, "render-receipt", (artifact) => {
          const filter = record(record(artifact.payload).filterScript);
          filter.sha256 = sha256AgenticVideoEditingFile(filterPath);
          filter.byteLength = readFileSync(filterPath).byteLength;
        });
      },
      expected: /canonical select-only graph derived exactly from the validated edit-plan/iu,
    },
    {
      name: "render command omits non-interactive stdin protection",
      mutate(root) {
        mutateArtifact(root, "render-receipt", (artifact) => {
          const command = record(artifact.payload).command as unknown[];
          command.splice(command.indexOf("-nostdin"), 1);
        });
      },
      expected: /exactly one -nostdin and one -y/iu,
    },
    {
      name: "unledgered residual file on disk",
      mutate(root) {
        writeFileSync(path.join(root, "artifacts/unledgered-residual.txt"), "not in the fixture ledger\n", "utf8");
      },
      expected: /disk inventory must contain every and only/iu,
    },
    {
      name: "stale M9 technical evidence",
      mutate(root) {
        mutateArtifact(root, "verification-report", (artifact) => {
          const checks = records(record(artifact.payload).technicalChecks);
          checks[0].evidence = "Every selected range stays inside the obsolete 3600-frame source clock.";
        });
      },
      expected: /exact artifact-derived frame, timeline, and playable-variant evidence set/iu,
    },
    {
      name: "nested early publish decision inside M9 rights review",
      mutate(root) {
        mutateArtifact(root, "verification-report", (artifact) => {
          record(record(artifact.payload).rightsReview).finalHumanDecision = {
            decision: "publish",
            candidateSha256: record(record(artifact.payload).candidateReview).candidateSha256,
          };
        });
      },
      expected: /rights reviews require named reviewers|explicit pass or blocked status/iu,
    },
  ];

  for (const entry of cases) {
    await t.test(entry.name, (nested) => {
      const root = copyGuidedProject(nested);
      entry.mutate(root);
      const result = validateAgenticVideoEditingGuidedProject(root, {
        validatedAt: FIXED_VALIDATED_AT,
      });
      assert.equal(result.ok, false);
      assert.match(result.issues.join("\n"), entry.expected);
    });
  }
});

test("a fresh learner project can pass with twelve hash-bound evidence records and do-not-publish", (t) => {
  const root = buildLearnerFinal(t);
  const result = validateAgenticVideoEditingLearnerFinal(root, {
    validatedAt: FIXED_VALIDATED_AT,
  });
  assert.deepEqual(result.issues, []);
  assert.equal(result.ok, true);
  assert.notEqual(result.projectId, AGENTIC_VIDEO_EDITING_GUIDED_PROJECT_ID);
  assert.equal(result.artifacts["production-dossier"]?.artifact.projectId, result.projectId);
  assert.equal(result.artifacts["release-decision"]?.artifact.payload.decision, "do-not-publish");
  assert.deepEqual(
    result.receiptArrays["production-capstone"]?.map((receipt) => receipt.artifactId).sort(),
    ["production-dossier", "release-decision"],
  );
  assert.equal(result.receiptArrays["production-capstone"]?.every((receipt) => receipt.status === "validated"), true);
});

test("an evidence-complete learner final may pass assessment with a blocked rights review and do-not-publish", (t) => {
  const root = buildLearnerFinal(t, { rightsBlocked: true });
  const result = validateAgenticVideoEditingLearnerFinal(root, {
    validatedAt: FIXED_VALIDATED_AT,
  });
  assert.deepEqual(result.issues, []);
  assert.equal(result.ok, true);
  assert.equal(result.artifacts["release-decision"]?.artifact.payload.decision, "do-not-publish");
  assert.equal(result.artifacts["release-decision"]?.artifact.payload.rightsState, "blocked");
  const verification = result.artifacts["capstone-verification-report"]?.artifact.payload;
  assert.equal(record(verification?.rightsReview).status, "blocked");
  assert.equal(record(verification?.candidateReview).disposition, "blocked-before-release-decision");
});

test("a learner capstone receipt exact command reproduces the byte-identical receipt", (t) => {
  const root = buildLearnerFinal(t);
  const result = validateAgenticVideoEditingLearnerFinal(root, {
    receiptPathRoot: path.resolve("."),
    validatedAt: FIXED_VALIDATED_AT,
  });
  assert.equal(result.ok, true, result.issues.join("\n"));
  const expected = result.receiptArrays["production-capstone"]?.find(
    (receipt) => receipt.artifactId === "release-decision",
  );
  assert.ok(expected);
  const rerun = spawnSync("/bin/sh", ["-c", expected.executedCommand], {
    cwd: path.resolve("."),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert.equal(rerun.status, 0, rerun.stderr);
  assert.deepEqual(JSON.parse(rerun.stdout), expected);
});

test("learner media, delivery, ffprobe, M9 review, and M10 decision fail closed", async (t) => {
  const strongWrongHash = "1234567890abcdef".repeat(4);
  await t.test("exact guided media bytes are not learner-final evidence", (nested) => {
    const root = buildLearnerFinal(nested);
    const learnerPath = path.join(root, "assets/camera-a.mp4");
    cpSync(path.join(GUIDED_ROOT, "assets/camera-a.mp4"), learnerPath);
    mutateArtifact(root, "media-manifest", (artifact) => {
      const asset = records(record(artifact.payload).assets)[0];
      asset.sha256 = sha256AgenticVideoEditingFile(learnerPath);
      asset.byteLength = readFileSync(learnerPath).byteLength;
    });
    const result = validateAgenticVideoEditingLearnerFinal(root);
    assert.equal(result.ok, false);
    assert.match(result.issues.join("\n"), /reuses exact guided-fixture bytes/iu);
  });

  await t.test("JSON metadata cannot masquerade as learner video", (nested) => {
    const root = buildLearnerFinal(nested);
    const fakePath = path.join(root, "assets/fake-video.json");
    writeFileSync(fakePath, '{"playableMediaIncluded":false}\n', "utf8");
    mutateArtifact(root, "media-manifest", (artifact) => {
      const asset = records(record(artifact.payload).assets)[0];
      asset.relativePath = "assets/fake-video.json";
      asset.mediaKind = "video/mp4";
      asset.sha256 = sha256AgenticVideoEditingFile(fakePath);
      asset.byteLength = readFileSync(fakePath).byteLength;
    });
    const result = validateAgenticVideoEditingLearnerFinal(root);
    assert.equal(result.ok, false);
    assert.match(result.issues.join("\n"), /JSON or stub|ffprobe-readable playable media/iu);
  });

  await t.test("declared MP4 with non-media bytes is rejected", (nested) => {
    const root = buildLearnerFinal(nested);
    const outputPath = path.join(root, "outputs/candidate-render.mp4");
    writeFileSync(outputPath, '{"format":"mp4","playableMediaIncluded":false}\n', "utf8");
    mutateArtifact(root, "render-receipt", (artifact) => {
      const output = record(record(artifact.payload).output);
      output.sha256 = sha256AgenticVideoEditingFile(outputPath);
      output.byteLength = readFileSync(outputPath).byteLength;
    });
    const result = validateAgenticVideoEditingLearnerFinal(root);
    assert.equal(result.ok, false);
    assert.match(result.issues.join("\n"), /ffprobe-readable playable media|actual playable/iu);
  });

  await t.test("horizontal-only final delivery is rejected", (nested) => {
    const root = buildLearnerFinal(nested);
    mutateArtifact(root, "delivery-matrix", (artifact) => {
      record(artifact.payload).finalDeliveryVariantId = "review-1080p";
    });
    const result = validateAgenticVideoEditingLearnerFinal(root);
    assert.equal(result.ok, false);
    assert.match(result.issues.join("\n"), /1080x1920 MP4/iu);
  });

  await t.test("short final media is rejected from actual ffprobe duration", (nested) => {
    const root = buildLearnerFinal(nested);
    const outputPath = path.join(root, "outputs/review-captioned.mp4");
    const generated = spawnSync("ffmpeg", [
      "-y", "-v", "error",
      "-f", "lavfi", "-i", "color=c=black:s=1080x1920:r=30000/1001",
      "-f", "lavfi", "-i", "sine=frequency=330:sample_rate=48000",
      "-t", "10", "-c:v", "libx264", "-preset", "ultrafast", "-crf", "40",
      "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", outputPath,
    ], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    assert.equal(generated.status, 0, generated.stderr);
    const result = validateAgenticVideoEditingLearnerFinal(root);
    assert.equal(result.ok, false);
    assert.match(result.issues.join("\n"), /between 45 and 60 seconds/iu);
  });

  await t.test("ffprobe receipt must bind the actual output hash", (nested) => {
    const root = buildLearnerFinal(nested);
    mutateArtifact(root, "variant-receipts", (artifact) => {
      const receipt = records(record(artifact.payload).receipts)[1];
      record(receipt.probe).sourceSha256 = strongWrongHash;
    });
    const result = validateAgenticVideoEditingLearnerFinal(root);
    assert.equal(result.ok, false);
    assert.match(result.issues.join("\n"), /ffprobe receipt does not match/iu);
  });

  await t.test("M9 cannot contain an early publish decision", (nested) => {
    const root = buildLearnerFinal(nested);
    mutateArtifact(root, "verification-report", (artifact) => {
      const payload = record(artifact.payload);
      payload.finalHumanDecision = {
        decision: "publish",
        candidateSha256: strongWrongHash,
      };
    });
    const result = validateAgenticVideoEditingLearnerFinal(root);
    assert.equal(result.ok, false);
    assert.match(result.issues.join("\n"), /verification report payload fields must be exactly/iu);
  });

  await t.test("M9 candidate review must bind the selected final variant", (nested) => {
    const root = buildLearnerFinal(nested);
    mutateArtifact(root, "verification-report", (artifact) => {
      record(record(artifact.payload).candidateReview).candidateSha256 = strongWrongHash;
    });
    const result = validateAgenticVideoEditingLearnerFinal(root);
    assert.equal(result.ok, false);
    assert.match(result.issues.join("\n"), /candidate-review disposition bound to the selected final variant/iu);
  });

  await t.test("a blocked M9 rights review cannot leave the candidate ready", (nested) => {
    const root = buildLearnerFinal(nested);
    mutateArtifact(root, "verification-report", (artifact) => {
      const payload = record(artifact.payload);
      const rightsReview = record(payload.rightsReview);
      rightsReview.status = "blocked";
      rightsReview.notes = "Named review found unresolved territorial rights for the exact final candidate.";
    });
    const result = validateAgenticVideoEditingLearnerFinal(root);
    assert.equal(result.ok, false);
    assert.match(result.issues.join("\n"), /repair loop explicitly blocked|must block the candidate/iu);
  });

  await t.test("M10 cannot publish a candidate blocked by the M9 rights review", (nested) => {
    const root = buildLearnerFinal(nested, { rightsBlocked: true });
    const decisionPath = path.join(root, "release-decision.json");
    const decision = readJson(decisionPath);
    const payload = record(decision.payload);
    payload.decision = "publish";
    payload.reason = "Attempt to publish despite the exact candidate's unresolved named rights review.";
    writeJson(decisionPath, decision);
    const result = validateAgenticVideoEditingLearnerFinal(root);
    assert.equal(result.ok, false);
    assert.match(result.issues.join("\n"), /publish is forbidden when rights|publish is forbidden unless M9/iu);
  });

  await t.test("dossier cannot label a blocked M9 verification report reviewed-pass", (nested) => {
    const root = buildLearnerFinal(nested, { rightsBlocked: true });
    const dossierPath = path.join(root, "production-dossier.json");
    const dossier = readJson(dossierPath);
    const evidence = records(record(dossier.payload).evidence);
    const verificationEvidence = evidence.find(
      (entry) => entry.artifactId
        === AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_ALIASES["verification-report"],
    );
    assert.ok(verificationEvidence);
    verificationEvidence.reviewState = "reviewed-pass";
    writeJson(dossierPath, dossier);
    const result = validateAgenticVideoEditingLearnerFinal(root);
    assert.equal(result.ok, false);
    assert.match(result.issues.join("\n"), /verification-report evidence state must match/iu);
  });

  await t.test("M10 decision must agree with M9 and final variant hash", (nested) => {
    const root = buildLearnerFinal(nested);
    const decisionPath = path.join(root, "release-decision.json");
    const decision = readJson(decisionPath);
    record(decision.payload).candidateSha256 = strongWrongHash;
    writeJson(decisionPath, decision);
    const result = validateAgenticVideoEditingLearnerFinal(root);
    assert.equal(result.ok, false);
    assert.match(result.issues.join("\n"), /must equal both the M9 candidate review and the selected final variant/iu);
  });
});

test("learner final fails closed for guided-project reuse, unnamed publish, bad locators, and incomplete evidence", async (t) => {
  await t.test("guided project ID reuse", (nested) => {
    const root = buildLearnerFinal(nested);
    mutateArtifact(root, "creative-brief", (artifact) => {
      artifact.projectId = AGENTIC_VIDEO_EDITING_GUIDED_PROJECT_ID;
    });
    const result = validateAgenticVideoEditingLearnerFinal(root);
    assert.equal(result.ok, false);
    assert.match(result.issues.join("\n"), /new stable projectId distinct/iu);
  });

  await t.test("unnamed publish decision", (nested) => {
    const root = buildLearnerFinal(nested);
    const decisionPath = path.join(root, "release-decision.json");
    const decision = readJson(decisionPath);
    const payload = record(decision.payload);
    payload.reviewerName = "";
    payload.decision = "publish";
    writeJson(decisionPath, decision);
    const result = validateAgenticVideoEditingLearnerFinal(root);
    assert.equal(result.ok, false);
    assert.match(result.issues.join("\n"), /named role|decisionArtifact|evidence/iu);
  });

  await t.test("evidence locator traversal", (nested) => {
    const root = buildLearnerFinal(nested);
    const dossierPath = path.join(root, "production-dossier.json");
    const dossier = readJson(dossierPath);
    const evidence = records(record(dossier.payload).evidence);
    evidence[0].locator = "../../outside.json";
    writeJson(dossierPath, dossier);
    const result = validateAgenticVideoEditingLearnerFinal(root);
    assert.equal(result.ok, false);
    assert.match(result.issues.join("\n"), /evidence is invalid or hash-drifted/iu);
  });

  await t.test("missing semantic evidence ID", (nested) => {
    const root = buildLearnerFinal(nested);
    const dossierPath = path.join(root, "production-dossier.json");
    const dossier = readJson(dossierPath);
    const payload = record(dossier.payload);
    payload.evidence = records(payload.evidence).slice(1);
    writeJson(dossierPath, dossier);
    const result = validateAgenticVideoEditingLearnerFinal(root);
    assert.equal(result.ok, false);
    assert.match(result.issues.join("\n"), /exact twelve semantic evidence IDs/iu);
  });
});
