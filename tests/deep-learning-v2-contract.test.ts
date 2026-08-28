import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  DEEP_LEARNING_CAPSTONE,
  DEEP_LEARNING_CLAIM_REVIEW_SNAPSHOT,
  DEEP_LEARNING_CLAIMS,
  DEEP_LEARNING_COURSE,
  DEEP_LEARNING_FIXTURE,
  DEEP_LEARNING_MODULES,
  DEEP_LEARNING_CAPABILITY_QUESTION_IDS,
  DEEP_LEARNING_CRITICAL_QUESTION_IDS,
  DEEP_LEARNING_MIN_CAPABILITY_QUESTIONS_PER_FORM,
  DEEP_LEARNING_QUESTION_BANK,
  DEEP_LEARNING_QUIZ_COVERAGE_REPORT,
  DEEP_LEARNING_QUIZ_FORMS,
  DEEP_LEARNING_RELEASE,
  DEEP_LEARNING_SOURCE_SEEDS,
  buildDeepLearningQuizCoverageReport,
  computeDeepLearningClaimContractSha256,
  computeDeepLearningParagraphCopySha256,
  validateDeepLearningClaimLedger,
  validateDeepLearningQuizCapabilityCoverage,
  type DeepLearningClaimRecord,
} from "../lib/deep-learning";

const COURSE_ROOT = new URL("../public/courses/deep-learning/", import.meta.url);

test("Course 20 v2 exposes the complete prerequisite DAG and stays within 900 minutes", () => {
  assert.equal(DEEP_LEARNING_COURSE.manifest.version, "2026.08.28-v2");
  assert.equal(DEEP_LEARNING_COURSE.manifest.publishedOn, "2026-08-28");
  assert.equal(
    DEEP_LEARNING_MODULES.reduce((total, module) => total + module.minutes, 0),
    900,
  );

  const slugs = DEEP_LEARNING_MODULES.map((module) => module.slug);
  assert.deepEqual(slugs.slice(0, 4), [
    "tensors-computational-graphs",
    "backpropagation-autodiff",
    "training-loops-debugging",
    "optimisation-initialisation-normalisation-regularisation",
  ]);

  const seen = new Set<string>();
  const artifacts = new Set<string>();
  for (const courseModule of DEEP_LEARNING_MODULES) {
    for (const prerequisite of courseModule.prerequisiteModuleSlugs) {
      assert.ok(seen.has(prerequisite), `${courseModule.slug} depends on a later or unknown module: ${prerequisite}`);
    }
    assert.ok(courseModule.producesArtifactIds.length > 0, `${courseModule.slug} produces no artifact`);
    assert.ok(courseModule.consumesArtifactIds.every((artifact) => artifacts.has(artifact)), `${courseModule.slug} consumes an unknown or future artifact`);
    assert.match(courseModule.artifactSchemaId, /^aicourse\.deep-learning\.module-artifact\.v2$/);
    assert.equal(courseModule.validatorId, `aicourse.deep-learning.module.${courseModule.slug}.v2`);
    assert.match(courseModule.validatorCommand, new RegExp(`--module ${courseModule.slug}`));
    assert.equal(courseModule.completionMode, "validated-artifact");
    for (const artifact of courseModule.producesArtifactIds) {
      assert.ok(!artifacts.has(artifact), `duplicate produced artifact: ${artifact}`);
      artifacts.add(artifact);
    }
    seen.add(courseModule.slug);
  }
  assert.equal(seen.size, 12);
  assert.equal(artifacts.size, 12);
  const prerequisites = new Map(
    DEEP_LEARNING_MODULES.map((module) => [module.slug, module.prerequisiteModuleSlugs]),
  );
  assert.deepEqual(Object.fromEntries(prerequisites), {
    "tensors-computational-graphs": [],
    "backpropagation-autodiff": ["tensors-computational-graphs"],
    "training-loops-debugging": ["backpropagation-autodiff"],
    "optimisation-initialisation-normalisation-regularisation": ["training-loops-debugging"],
    "cnns-visual-representations": [
      "training-loops-debugging",
      "optimisation-initialisation-normalisation-regularisation",
    ],
    "transfer-learning": ["cnns-visual-representations"],
    "sequence-models-rnns-lstms": [
      "training-loops-debugging",
      "optimisation-initialisation-normalisation-regularisation",
    ],
    attention: ["sequence-models-rnns-lstms"],
    "transformer-encoder-decoder": ["attention"],
    "tokenisation-pretraining": [
      "sequence-models-rnns-lstms",
      "transformer-encoder-decoder",
    ],
    "fine-tuning-parameter-efficient-adaptation": [
      "transfer-learning",
      "transformer-encoder-decoder",
      "tokenisation-pretraining",
    ],
    "robustness-evaluation-training-card-capstone": DEEP_LEARNING_MODULES
      .slice(0, -1)
      .map((module) => module.slug),
  });
  const adaptation = DEEP_LEARNING_MODULES.find(
    (module) => module.slug === "fine-tuning-parameter-efficient-adaptation",
  );
  assert.deepEqual(adaptation?.prerequisiteModuleSlugs, [
    "transfer-learning",
    "transformer-encoder-decoder",
    "tokenisation-pretraining",
  ]);
  assert.deepEqual(adaptation?.consumesArtifactIds, [
    "transfer-strategy-ledger",
    "transformer-leakage-test",
    "tokenisation-provenance-audit",
  ]);
  assert.deepEqual(
    DEEP_LEARNING_MODULES.find((courseModule) =>
      courseModule.slug === "tokenisation-pretraining"
    )?.consumesArtifactIds,
    ["sequence-state-mask-audit", "transformer-leakage-test"],
  );
  assert.deepEqual(
    DEEP_LEARNING_MODULES.at(-1)?.prerequisiteModuleSlugs,
    DEEP_LEARNING_MODULES.slice(0, -1).map((module) => module.slug),
  );
  assert.equal(DEEP_LEARNING_MODULES.at(-1)?.consumesArtifactIds.length, 11);
});

test("Course 20 v2 source records are atomic, immutable where pinned, and exclude the deprecated Transformer tutorial", () => {
  const ids = new Set<string>(DEEP_LEARNING_SOURCE_SEEDS.map((source) => source.record.id));
  for (const retired of [
    "dl03-optimisation-adam",
    "dl08-lstm-sequences",
    "dl10-transformer",
    "dl12-lora-peft",
    "dl04-normalisation-regularisation",
    "dl06-cnn-resnet",
    "dl11-tokenisation-pretraining",
  ]) {
    assert.equal(ids.has(retired), false, `mixed source record remains: ${retired}`);
  }

  for (const { record } of DEEP_LEARNING_SOURCE_SEEDS) {
    assert.match(record.accessedAt, /^2026-08-28T00:00:00\+08:00$/);
    assert.equal(
      record.evidenceUrls.some((url) => url.includes("beginner/transformer_tutorial")),
      false,
      `${record.id} still cites the deprecated Transformer tutorial`,
    );
    if (record.stability !== "version-pinned") continue;
    assert.equal(record.immutableRef?.kind, "commit-sha");
    assert.match(record.immutableRef?.value ?? "", /^[a-f0-9]{40}$/);
    assert.match(record.immutableRef?.url ?? "", /^https:\/\/github\.com\//);
    for (const url of record.evidenceUrls) {
      assert.doesNotMatch(url, /\/docs\/stable\//, `${record.id} calls rolling stable docs pinned`);
      assert.doesNotMatch(url, /\/docs\/peft\/(?:index|main)(?:\/|$)/, `${record.id} calls rolling PEFT docs pinned`);
      assert.doesNotMatch(url, /\/tutorials\/(?:beginner|intermediate|recipes)\//, `${record.id} calls an unversioned tutorial pinned`);
    }
  }
  for (const { record } of DEEP_LEARNING_SOURCE_SEEDS) {
    if (record.kind === "research") {
      assert.equal(
        record.evidenceUrls.length,
        1,
        `${record.id} combines more than one research publication identity`,
      );
    }
  }
});

test("Course 20 v2 marks claim ownership per paragraph and makes mask contracts executable", () => {
  for (const courseModule of DEEP_LEARNING_MODULES) {
    const moduleSourceIds = new Set(courseModule.sourceIds);
    for (const locale of [courseModule.copy.en, courseModule.copy.zhHans]) {
      assert.equal(locale.sections.length, 3);
      for (const section of locale.sections) {
        const sourceIds = section.sourceIds ?? courseModule.sourceIds;
        assert.ok(
          sourceIds.every((sourceId) => moduleSourceIds.has(sourceId)),
          `${courseModule.slug} section cites a source outside its manifest`,
        );
        assert.match(
          section.heading,
          /^(?:Source-grounded|Course synthesis|Course policy|Version watch|来源支持|课程综合|课程政策|版本观察) · /,
        );
      }
    }
  }

  const attention = DEEP_LEARNING_MODULES.find((module) => module.slug === "attention");
  assert.deepEqual(attention?.copy.en.sections[0].sourceIds, [
    "dl08-bahdanau-attention-paper",
    "dl09-transformer-paper",
  ]);
  assert.deepEqual(attention?.copy.en.sections[2].sourceIds, [
    "dl08-attention-not-explanation-paper",
    "dl08-attention-not-not-explanation-paper",
  ]);
  assert.match(attention?.copy.en.sections[1].paragraphs.join(" ") ?? "", /all-masked query row/);
  assert.match(attention?.copy.en.sections[1].paragraphs.join(" ") ?? "", /1e-12/);

  const transformer = DEEP_LEARNING_MODULES.find(
    (module) => module.slug === "transformer-encoder-decoder",
  );
  assert.equal(transformer?.copy.en.sections[1].evidenceMode, "version-watch");
  assert.match(transformer?.copy.en.sections[1].paragraphs.join(" ") ?? "", /Boolean mask polarity differs/);
  assert.match(transformer?.copy.en.sections[1].paragraphs.join(" ") ?? "", /dropout disabled/);
  assert.match(transformer?.copy.en.sections[1].paragraphs.join(" ") ?? "", /declared tolerance/);
});

test("Course 20 v2 closes every paragraph through an atomic bilingual claim ledger", () => {
  const sourceById = new Map(
    DEEP_LEARNING_SOURCE_SEEDS.map((source) => [source.record.id, source.record]),
  );
  assert.deepEqual(validateDeepLearningClaimLedger(), []);
  assert.equal(
    new Set(DEEP_LEARNING_CLAIMS.map((claim) => claim.id)).size,
    DEEP_LEARNING_CLAIMS.length,
  );

  for (const courseModule of DEEP_LEARNING_MODULES) {
    for (const [sectionIndex, section] of courseModule.copy.en.sections.entries()) {
      for (const [paragraphIndex] of section.paragraphs.entries()) {
        const claims = DEEP_LEARNING_CLAIMS.filter((claim) => (
          claim.moduleSlug === courseModule.slug
          && claim.sectionIndex === sectionIndex
          && claim.paragraphIndex === paragraphIndex
        ));
        assert.ok(
          claims.length > 0,
          `${courseModule.slug}/${sectionIndex}/${paragraphIndex}`,
        );
        assert.ok(claims.some((claim) => claim.evidenceMode === section.evidenceMode));
      }
    }
  }

  for (const claim of DEEP_LEARNING_CLAIMS) {
    assert.ok(claim.locator.length >= 16, claim.id);
    assert.ok(claim.boundary.length >= 40, claim.id);
    assert.ok(claim.boundaryZhHans.length >= 16, claim.id);
    if (claim.evidenceMode === "source-grounded" || claim.evidenceMode === "version-watch") {
      assert.ok(claim.sourceId, claim.id);
      assert.ok(claim.evidenceUrl, claim.id);
      assert.ok(
        (sourceById.get(claim.sourceId!)?.evidenceUrls as readonly string[] | undefined)
          ?.includes(claim.evidenceUrl!),
        claim.id,
      );
    } else {
      assert.equal(claim.sourceId, undefined, claim.id);
      assert.equal(claim.evidenceUrl, undefined, claim.id);
    }
  }
  assert.equal(
    computeDeepLearningParagraphCopySha256(),
    DEEP_LEARNING_CLAIM_REVIEW_SNAPSHOT.paragraphCopySha256,
  );
  assert.equal(
    computeDeepLearningClaimContractSha256(),
    DEEP_LEARNING_CLAIM_REVIEW_SNAPSHOT.claimContractSha256,
  );
  const mixedOwnership = DEEP_LEARNING_CLAIMS.filter((claim) => (
    claim.moduleSlug === "tensors-computational-graphs"
    && claim.sectionIndex === 2
  ));
  assert.deepEqual(
    new Set(mixedOwnership.map((claim) => claim.evidenceMode)),
    new Set(["source-grounded", "instructional-synthesis"]),
  );
});

test("Course 20 atomic claim validator rejects missing, inherited, and malformed evidence", () => {
  const clone = () => DEEP_LEARNING_CLAIMS.map((claim) => ({ ...claim }));

  const missingParagraph = clone().filter((claim) => !(
    claim.moduleSlug === "tensors-computational-graphs"
    && claim.sectionIndex === 0
    && claim.paragraphIndex === 0
  ));
  assert.match(
    validateDeepLearningClaimLedger(missingParagraph).join("\n"),
    /paragraph has no atomic claim mapping/,
  );

  const wrongUrl = clone();
  const wrongUrlIndex = wrongUrl.findIndex((claim) => claim.evidenceUrl);
  wrongUrl[wrongUrlIndex] = {
    ...wrongUrl[wrongUrlIndex],
    evidenceUrl: "https://docs.pytorch.org/",
  };
  assert.match(
    validateDeepLearningClaimLedger(wrongUrl).join("\n"),
    /evidenceUrl must exactly match/,
  );

  const vagueLocator = clone();
  vagueLocator[0] = { ...vagueLocator[0], locator: "docs" };
  assert.match(
    validateDeepLearningClaimLedger(vagueLocator).join("\n"),
    /exact section\/page\/API\/course-contract locator is required/,
  );

  const missingBilingualBoundary = clone();
  missingBilingualBoundary[0] = {
    ...missingBilingualBoundary[0],
    boundaryZhHans: "",
  };
  assert.match(
    validateDeepLearningClaimLedger(missingBilingualBoundary).join("\n"),
    /bilingual evidence boundary is incomplete/,
  );

  const policyImpersonatesSource = clone();
  const policyIndex = policyImpersonatesSource.findIndex(
    (claim) => claim.evidenceMode === "course-policy",
  );
  policyImpersonatesSource[policyIndex] = {
    ...policyImpersonatesSource[policyIndex],
    sourceId: "dl09-transformer-paper",
    evidenceUrl: "https://papers.neurips.cc/paper/7181-attention-is-all-you-need",
  } as DeepLearningClaimRecord;
  assert.match(
    validateDeepLearningClaimLedger(policyImpersonatesSource).join("\n"),
    /must not impersonate an external source/,
  );

  const inheritedSectionSource = clone().filter((claim) => !(
    claim.moduleSlug === "attention"
    && claim.sectionIndex === 0
    && claim.sourceId === "dl09-transformer-paper"
  ));
  assert.match(
    validateDeepLearningClaimLedger(inheritedSectionSource).join("\n"),
    /reading-set source dl09-transformer-paper has no atomic claim mapping/,
  );

  const semanticOverclaim = clone();
  semanticOverclaim[0] = {
    ...semanticOverclaim[0],
    claim: "This source proves universal safety and accuracy for every future model and deployment domain.",
    locator: "Invented Section 99 — universal deployment guarantee",
  };
  assert.match(
    validateDeepLearningClaimLedger(semanticOverclaim).join("\n"),
    /claim\/source\/locator contract drifted from the frozen review snapshot/,
  );

  const paragraphDrift = structuredClone(DEEP_LEARNING_MODULES);
  const mutableParagraphDrift = paragraphDrift as unknown as Array<{
    copy: {
      en: { sections: Array<{ paragraphs: string[] }> };
      zhHans: { sections: Array<{ paragraphs: string[] }> };
    };
  }>;
  mutableParagraphDrift[0].copy.en.sections[0].paragraphs[0] =
    "A replacement external performance claim with no reviewed atomic mapping.";
  mutableParagraphDrift[0].copy.zhHans.sections[0].paragraphs[0] =
    "一条没有经过审核原子映射的替代外部性能主张。";
  assert.match(
    validateDeepLearningClaimLedger(
      DEEP_LEARNING_CLAIMS,
      paragraphDrift,
    ).join("\n"),
    /paragraph copy drifted from the frozen atomic-claim review snapshot/,
  );

  const sourceBoundaryDrift = structuredClone(DEEP_LEARNING_SOURCE_SEEDS);
  (sourceBoundaryDrift as unknown as Array<{ record: { supports: string } }>)[0].record.supports =
    "A replacement support statement that was never part of the reviewed source contract.";
  assert.match(
    validateDeepLearningClaimLedger(
      DEEP_LEARNING_CLAIMS,
      DEEP_LEARNING_MODULES,
      sourceBoundaryDrift,
    ).join("\n"),
    /claim\/source\/locator contract drifted from the frozen review snapshot/,
  );
});

test("Course 20 v2 binds foundation, visual, and sequence fixtures", () => {
  assert.equal(DEEP_LEARNING_FIXTURE.version, "2026.08.28-v2");
  assert.deepEqual(
    DEEP_LEARNING_FIXTURE.fixtures.map((fixture) => fixture.fixtureId),
    [
      "ae-deep-learning-foundation-mlp-v1",
      "ae-deep-learning-visual-patterns-v2",
      "ae-deep-learning-sequences-v2",
    ],
  );
  for (const fixture of DEEP_LEARNING_FIXTURE.fixtures) {
    assert.match(fixture.sha256, /^[a-f0-9]{64}$/);
    const bytes = readFileSync(
      new URL(`fixtures/${fixture.path.split("/").at(-1)}`, COURSE_ROOT),
    );
    assert.ok(bytes.length > 0);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), fixture.sha256);
  }
  assert.deepEqual(DEEP_LEARNING_FIXTURE.optionalFrameworkReference, {
    package: "torch",
    version: "2.13.0",
    pythonAbi: "cp311",
    platformTag: "macosx_14_0_arm64",
    wheelSha256: "e76f9bcecc52b8ff711239a2f7547d5353df95878ab232f0773c1d95928b92f8",
    requiredForFoundationReference: false,
    boundary:
      "This wheel digest binds only the CPython 3.11 macOS 14 arm64 artifact; other operating systems, architectures, Python ABIs, CPU wheels, and accelerator wheels require their own hashes.",
  });
});

test("reference validation and learner-final validation are separate contracts", () => {
  assert.equal(DEEP_LEARNING_CAPSTONE.version, "2026.08.28-capstone-v2");
  assert.deepEqual(
    DEEP_LEARNING_CAPSTONE.artifacts.map((artifact) => artifact.id),
    [
      "environment-lock",
      "run-ledger",
      "failure-ledger",
      "resource-record",
      "evaluation-slices",
      "training-dossier",
      "limitations",
      "reviewer-decision",
    ],
  );
  assert.deepEqual(DEEP_LEARNING_CAPSTONE.referenceEvidenceContract, {
    schemaId: "aicourse.deep-learning.reference-package.v2",
    schemaPath: "/courses/deep-learning/lab/reference.schema.json",
    validatorId: "aicourse.deep-learning.reference-validator.v1",
    validatorPath: "/courses/deep-learning/lab/validate_reference.py",
    validatorCommand: "python3 public/courses/deep-learning/lab/validate_reference.py --package <reference-package.json>",
  });
  assert.equal(DEEP_LEARNING_CAPSTONE.evidenceContract.schemaId, "aicourse.deep-learning.capstone.v2");
  assert.equal(DEEP_LEARNING_CAPSTONE.evidenceContract.validatorId, "aicourse.deep-learning.validator.v2");
  assert.match(DEEP_LEARNING_CAPSTONE.evidenceContract.validatorPath, /validate_capstone\.py$/);
  assert.match(DEEP_LEARNING_CAPSTONE.evidenceContract.validatorCommand, /--receipt-dir <receipt-directory>$/);

  const schema = JSON.parse(readFileSync(new URL("lab/capstone.schema.json", COURSE_ROOT), "utf8"));
  assert.equal(schema["x-minimumSeeds"], 3);
  assert.deepEqual(schema["x-requiredLedgers"], ["run-ledger", "failure-ledger", "resource-record"]);
  assert.deepEqual(schema["x-requiredSliceTypes"], [
    "clean",
    "corruption",
    "held-out-length",
    "synthetic-subgroup",
    "calibration",
    "error-analysis",
  ]);
  assert.deepEqual(schema["x-requiredNegativeCases"], [
    "causal-mask-leakage",
    "unicode-normalization-round-trip",
    "tokenizer-version-drift",
    "lora-merge-equivalence",
  ]);
  assert.equal(schema["x-requiresNamedReviewer"], true);
  assert.equal(schema["x-requiresChallenge"], true);
  assert.equal(schema["x-decisionBoundary"], "no-train-or-no-deploy");
  assert.equal(schema.properties.artifacts.prefixItems.length, 8);
  assert.doesNotMatch(JSON.stringify(schema), /"minProperties":3/);
});

test("the three explicit quiz forms cover modules, critical gates, and genuine capability work", () => {
  assert.equal(DEEP_LEARNING_QUESTION_BANK.length, 36);
  assert.equal(DEEP_LEARNING_QUIZ_FORMS.length, 3);
  assert.deepEqual(validateDeepLearningQuizCapabilityCoverage(), []);
  const moduleSlugs = new Set(DEEP_LEARNING_MODULES.map((module) => module.slug));
  const questionById = new Map(DEEP_LEARNING_QUESTION_BANK.map((question) => [question.id, question]));
  const union = new Set<string>();
  for (const form of DEEP_LEARNING_QUIZ_FORMS) {
    const questionIds: readonly string[] = form.questionIds;
    assert.equal(form.questionIds.length, 16, `${form.id} must contain 16 questions`);
    assert.equal(new Set(form.questionIds).size, 16, `${form.id} repeats a question`);
    const coveredModules = new Set(
      form.questionIds.map((questionId) => questionById.get(questionId)?.moduleSlug),
    );
    assert.deepEqual(coveredModules, moduleSlugs, `${form.id} does not cover all 12 modules`);
    for (const criticalId of DEEP_LEARNING_CRITICAL_QUESTION_IDS) {
      assert.ok(questionIds.includes(criticalId), `${form.id} omits critical question ${criticalId}`);
    }
    const capabilityQuestions = form.questionIds.filter(
      (questionId) => (questionById.get(questionId)?.capabilityTags?.length ?? 0) > 0,
    );
    assert.ok(
      capabilityQuestions.length >= DEEP_LEARNING_MIN_CAPABILITY_QUESTIONS_PER_FORM,
      `${form.id} has only ${capabilityQuestions.length} genuine capability questions`,
    );
    form.questionIds.forEach((questionId) => union.add(questionId));
  }
  assert.equal(union.size, 36, "the three forms do not cover the complete 36-question bank");

  assert.equal(DEEP_LEARNING_QUIZ_COVERAGE_REPORT.bank.questionCount, 36);
  assert.equal(DEEP_LEARNING_QUIZ_COVERAGE_REPORT.bank.bankCoverageCount, 36);
  assert.equal(DEEP_LEARNING_QUIZ_COVERAGE_REPORT.currentDeliveredForm.questionCount, 16);
  assert.equal(DEEP_LEARNING_QUIZ_COVERAGE_REPORT.currentDeliveredForm.moduleCoverageCount, 12);
  assert.ok(
    DEEP_LEARNING_QUIZ_COVERAGE_REPORT.currentDeliveredForm.capabilityQuestionCount
      >= DEEP_LEARNING_MIN_CAPABILITY_QUESTIONS_PER_FORM,
  );
  assert.equal(DEEP_LEARNING_QUIZ_COVERAGE_REPORT.threeFormUnion.bankCoverageCount, 36);
  assert.equal(DEEP_LEARNING_QUIZ_COVERAGE_REPORT.threeFormUnion.bankCoveragePercent, 100);

  for (const questionId of DEEP_LEARNING_CAPABILITY_QUESTION_IDS) {
    const question = questionById.get(questionId);
    assert.ok(question, `missing capability item ${questionId}`);
    assert.ok(question.capabilityTags?.length, `${questionId} has no capability tag`);
    assert.match(question.capabilityAssessmentMode ?? "", /^(?:computational|diagnostic)$/);
    assert.equal(question.copy.en.options.length, 4);
    assert.equal(question.copy.zhHans.options.length, 4);
    assert.doesNotMatch(
      `${question.copy.en.prompt}\n${question.copy.zhHans.prompt}`,
      /Which artifact gives|Which statement best captures|哪一项产物最能|哪项陈述最准确地概括/,
    );
  }

  const lora = questionById.get(
    "q-fine-tuning-parameter-efficient-adaptation-boundary",
  );
  assert.match(lora?.copy.en.options[lora.correctIndex] ?? "", /40 trainable parameters/);
  const gradient = questionById.get("q-backpropagation-autodiff-core");
  assert.equal(gradient?.copy.en.options[gradient.correctIndex], "-2");
  const mask = questionById.get("q-transformer-encoder-decoder-core");
  assert.equal(mask?.copy.en.options[mask.correctIndex], "[false, false, false, true]");
});

test("Deep Learning capability coverage rejects tag stripping and tagged recall-template mutations", () => {
  const sharedCapabilityIds = new Set([
    "q-training-loops-debugging-boundary",
    "q-transformer-encoder-decoder-core",
    "q-tokenisation-pretraining-boundary",
  ]);
  const weakenedBank = DEEP_LEARNING_QUESTION_BANK.map((question) =>
    sharedCapabilityIds.has(question.id)
      ? {
          ...question,
          capabilityTags: undefined,
          capabilityAssessmentMode: undefined,
        }
      : question
  );
  const weakenedIssues = validateDeepLearningQuizCapabilityCoverage(
    weakenedBank,
    DEEP_LEARNING_QUIZ_FORMS,
  );
  assert.ok(
    weakenedIssues.some((finding) => /has 5 capability questions; 6 are required/.test(finding)),
    weakenedIssues.join("\n"),
  );
  assert.ok(
    weakenedIssues.some((finding) => /lost its capability tags/.test(finding)),
    weakenedIssues.join("\n"),
  );

  const taggedRecallBank = DEEP_LEARNING_QUESTION_BANK.map((question) =>
    question.id === "q-transfer-learning-evidence"
      ? {
          ...question,
          capabilityTags: ["fault-diagnosis"] as const,
          capabilityAssessmentMode: "diagnostic" as const,
        }
      : question
  );
  const taggedRecallIssues = validateDeepLearningQuizCapabilityCoverage(
    taggedRecallBank,
    DEEP_LEARNING_QUIZ_FORMS,
  );
  assert.ok(
    taggedRecallIssues.some((finding) => /not an explicitly authored capability item/.test(finding)),
    taggedRecallIssues.join("\n"),
  );
  assert.ok(
    taggedRecallIssues.some((finding) => /generated recall\/title item/.test(finding)),
    taggedRecallIssues.join("\n"),
  );

  const report = buildDeepLearningQuizCoverageReport(
    taggedRecallBank,
    DEEP_LEARNING_QUIZ_FORMS,
  );
  assert.equal(report.bank.questionCount, 36);
  assert.equal(report.currentDeliveredForm.questionCount, 16);
  assert.equal(report.threeFormUnion.bankCoverageCount, 36);
});

test("Course 20 v2 remains on release HOLD until real EN and zh-Hans review exists", () => {
  assert.deepEqual(DEEP_LEARNING_RELEASE, {
    status: "HOLD",
    reason: "human-en-and-zh-hans-review-pending",
    automatedChecksCanApproveRelease: false,
  });
});
