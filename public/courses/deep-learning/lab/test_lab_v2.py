#!/usr/bin/env python3
"""Positive and destructive tests for the Course 20 v2 evidence system."""

from __future__ import annotations

import copy
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from run_experiment import build_submission, write_outputs
from run_modules import BUILDERS, MODULE_ARTIFACTS, MODULE_INPUTS, build_artifact, write_artifact
from validate_capstone import ARTIFACT_IDS, canonical_content_hash, validate_capstone
from validate_module import validate_module_artifact
from validate_reference import validate_reference
from validate_readiness import validate as validate_readiness


LAB_DIR = Path(__file__).resolve().parent
COURSE_DIR = LAB_DIR.parent
REPO_ROOT = LAB_DIR.parents[3]


def capstone_artifact(artifact_id: str, content: dict) -> dict:
    return {"artifactId": artifact_id, "content": content, "sha256": canonical_content_hash(content)}


def rehash(package: dict, artifact_index: int) -> None:
    artifact = package["artifacts"][artifact_index]
    artifact["sha256"] = canonical_content_hash(artifact["content"])


def artifact_index(artifact_id: str) -> int:
    return ARTIFACT_IDS.index(artifact_id)


def valid_capstone() -> dict:
    module_hashes = {
        "training-state-receipt": "7a" * 32,
        "optimisation-ablation-report": "7b" * 32,
        "sequence-state-mask-audit": "7c" * 32,
        "transformer-leakage-test": "7d" * 32,
        "tokenisation-provenance-audit": "7e" * 32,
        "adaptation-lifecycle-audit": "7f" * 32,
    }

    def run(
        run_id: str,
        model_family: str,
        seed: int,
        purpose: str,
        started_at: str,
        ended_at: str,
        seconds: float,
        checkpoint_hash: str,
        output_hash: str,
        module_ids: list[str],
        *,
        status: str = "completed",
        stop_reason: str = "predeclared epoch budget reached",
        parent_run_id: str | None = None,
    ) -> dict:
        value = {
            "runId": run_id,
            "modelFamily": model_family,
            "seed": seed,
            "purpose": purpose,
            "status": status,
            "startedAt": started_at,
            "endedAt": ended_at,
            "elapsedSeconds": seconds,
            "wallSeconds": seconds,
            "stopReason": stop_reason,
            "metricDefinition": "token accuracy on the fixed held-out split; padding excluded",
            "trainingMode": "train() with deterministic CPU algorithms and fixed dropout state",
            "evaluationMode": "eval() with no_grad(), fixed batching, and cache disabled",
            "checkpointSha256": checkpoint_hash,
            "configSha256": "5e" * 32,
            "splitReceiptId": "course20-sequence-fixed-split-v2",
            "splitReceiptSha256": "8a" * 32,
            "moduleReceiptIdsAndHashes": {
                module_id: module_hashes[module_id] for module_id in module_ids
            },
            "command": f"python3 learner_train.py --run-id {run_id}",
            "outputSha256": output_hash,
        }
        if parent_run_id is not None:
            value["parentRunId"] = parent_run_id
        return value

    runs = [
        run(
            "transformer-seed-1", "transformer", 20260828, "primary",
            "2026-08-28T01:00:00+00:00", "2026-08-28T01:01:00+00:00", 60,
            "1a" * 32, "2b" * 32,
            ["training-state-receipt", "optimisation-ablation-report", "transformer-leakage-test", "tokenisation-provenance-audit", "adaptation-lifecycle-audit"],
        ),
        run(
            "transformer-seed-2", "transformer", 20260829, "primary",
            "2026-08-28T01:01:00+00:00", "2026-08-28T01:02:00+00:00", 60,
            "1b" * 32, "2c" * 32,
            ["training-state-receipt", "optimisation-ablation-report", "transformer-leakage-test", "tokenisation-provenance-audit", "adaptation-lifecycle-audit"],
        ),
        run(
            "transformer-seed-3", "transformer", 20260830, "primary",
            "2026-08-28T01:02:00+00:00", "2026-08-28T01:03:00+00:00", 60,
            "1c" * 32, "2d" * 32,
            ["training-state-receipt", "optimisation-ablation-report", "transformer-leakage-test", "tokenisation-provenance-audit", "adaptation-lifecycle-audit"],
        ),
        run(
            "rnn-baseline", "rnn", 20260828, "baseline",
            "2026-08-28T01:03:00+00:00", "2026-08-28T01:04:00+00:00", 60,
            "1d" * 32, "2e" * 32,
            ["training-state-receipt", "optimisation-ablation-report", "sequence-state-mask-audit"],
        ),
        run(
            "transformer-seed-1-resume", "transformer", 20260828, "checkpoint-resume",
            "2026-08-28T01:04:00+00:00", "2026-08-28T01:04:45+00:00", 45,
            "1a" * 32, "2b" * 32,
            ["training-state-receipt", "optimisation-ablation-report", "transformer-leakage-test", "tokenisation-provenance-audit", "adaptation-lifecycle-audit"],
            parent_run_id="transformer-seed-1",
        ),
        run(
            "fault-permissive-mask", "transformer", 20260828, "negative-control",
            "2026-08-28T01:04:45+00:00", "2026-08-28T01:05:00+00:00", 15,
            "1e" * 32, "2f" * 32,
            ["training-state-receipt", "optimisation-ablation-report", "transformer-leakage-test", "tokenisation-provenance-audit", "adaptation-lifecycle-audit"],
            status="rejected",
            stop_reason="future-token invariance failed under the injected permissive mask",
        ),
    ]
    failure = {
        "failureId": "failure-causal-mask-negative-control",
        "runId": "fault-permissive-mask",
        "seed": 20260828,
        "failureType": "causal-mask-leakage",
        "observedSymptom": "Changing a future token changed an earlier logit under the deliberately permissive mask.",
        "triggeredInvariant": "future-token logits must remain invariant in eval mode with dropout and cache disabled",
        "evidencePath": "evidence/fault-permissive-mask.json",
        "evidenceSha256": "9a" * 32,
        "recoveryAction": "Restored the causal mask and reran the fixed perturbation test.",
        "disposition": "Rejected the run, restored the causal mask, and retained this negative-control record.",
        "owner": "learner",
    }
    content = {
        "environment-lock": {
            "python": "3.11.15",
            "torch": "2.13.0",
            "platform": "macOS 26 arm64",
            "hardware": "CPU reference lane",
            "networkRequired": False,
            "acceleratorRequired": False,
            "codeSha256": "3c" * 32,
            "dataSha256": "4d" * 32,
            "configSha256": "5e" * 32,
            "schemaSha256": "f739aba5f9dce5ae510dc1cd21548ba589b5f91495f634e8065996c8346689a4",
            "rightsBoundary": "Only original course fixtures; no personal or third-party corpus data.",
        },
        "run-ledger": {
            "runs": runs,
            "predeclaredAt": "2026-08-28T00:55:00+00:00",
            "checkpointResume": {
                "sourceRunId": "transformer-seed-1",
                "resumedRunId": "transformer-seed-1-resume",
                "checkpointSha256": "1a" * 32,
                "uninterruptedOutputSha256": "2b" * 32,
                "resumedOutputSha256": "2b" * 32,
                "freshProcess": True,
                "equivalenceMode": "exact",
                "tolerance": 0,
                "maxAbsoluteDifference": 0,
                "status": "pass",
                "command": "python3 learner_train.py --run-id transformer-seed-1-resume --resume checkpoints/seed-1.pt",
            },
            "uncertaintyMethod": "Report seed-level traces and mean plus min/max across the three preregistered Transformer seeds.",
        },
        "failure-ledger": {
            "failures": [failure],
            "failedRunsRetained": True,
            "boundary": "Fault injection is retained as negative evidence and excluded from performance aggregation.",
        },
        "resource-record": {
            "hardware": "CPU reference lane",
            "runtime": "CPython 3.11.15 / PyTorch 2.13.0 CPU",
            "measurementBoundary": "Sequential course runs from process start through artifact flush; excludes installation, reviewer time, embodied energy, and host background work.",
            "executionAggregation": "sequential",
            "wallSeconds": 305,
            "peakMemoryBytes": 268435456,
            "runCount": 6,
            "failedRunCount": 1,
            "monetaryCostEstimate": {
                "amount": 0,
                "currency": "USD",
                "basis": "No metered cloud or paid API was used; learner-owned CPU depreciation is excluded.",
            },
            "monetaryCostUncertainty": {
                "lowerBound": 0,
                "upperBound": 0.05,
                "basis": "Upper bound is a course-local sensitivity value, not an invoice.",
            },
            "energyProxy": {
                "value": 300,
                "unit": "cpu-seconds",
                "method": "Sum of per-run monotonic elapsed CPU-lane seconds.",
                "measurementBoundary": "Compute-time proxy only; not measured joules, carbon, facility overhead, or embodied energy.",
            },
            "energyProxyUncertainty": {
                "lowerBound": 285,
                "upperBound": 330,
                "basis": "Timing jitter and host scheduling; no wall-power instrument was available.",
            },
            "supportsDecisions": ["Whether this exact course fixture stayed within its CPU time and memory budget."],
            "doesNotSupportDecisions": ["Carbon comparison, production sizing, or cross-hardware efficiency claims."],
        },
        "evaluation-slices": {
            "slices": [
                {"sliceId": "clean-fixed-test", "sliceType": "clean", "denominator": 24, "metric": "token-accuracy", "seedResults": [0.91, 0.92, 0.9], "uncertainty": "three-seed min/max only", "evidenceSha256": "a0" * 32, "boundary": "Course-owned fixed sequence fixture only."},
                {"sliceId": "token-corruption", "sliceType": "corruption", "denominator": 24, "metric": "token-accuracy", "seedResults": [0.72, 0.7, 0.71], "uncertainty": "three-seed min/max only", "evidenceSha256": "ab" * 32, "boundary": "One preregistered synthetic token replacement; not natural distribution shift.", "transformationReceipt": {"id": "replace-middle-token-v1", "sha256": "ba" * 32}},
                {"sliceId": "length-ten", "sliceType": "held-out-length", "denominator": 16, "metric": "token-accuracy", "seedResults": [0.66, 0.68, 0.67], "uncertainty": "three-seed min/max only", "evidenceSha256": "ac" * 32, "boundary": "Synthetic length 10, held out before training.", "transformationReceipt": {"id": "length-split-v2", "sha256": "b0" * 32}},
                {"sliceId": "cycle-family-b", "sliceType": "synthetic-subgroup", "denominator": 12, "metric": "token-accuracy", "seedResults": [0.82, 0.8, 0.81], "uncertainty": "three-seed min/max only", "evidenceSha256": "ad" * 32, "boundary": "Synthetic cycle family, not a demographic or population subgroup.", "transformationReceipt": {"id": "cycle-family-membership-v2", "sha256": "bc" * 32}},
                {"sliceId": "ece-five-bin", "sliceType": "calibration", "denominator": 24, "metric": "expected-calibration-error-five-bin", "seedResults": [0.11, 0.09, 0.1], "uncertainty": "three-seed min/max only; bins fixed before evaluation", "evidenceSha256": "ae" * 32, "boundary": "Small synthetic sample; not a population calibration claim.", "transformationReceipt": {"id": "five-bin-calibration-v1", "sha256": "bd" * 32}},
                {"sliceId": "representative-errors", "sliceType": "error-analysis", "denominator": 7, "metric": "error-count", "seedResults": [3, 2, 2], "uncertainty": "all seven fixed-fixture errors retained", "evidenceSha256": "af" * 32, "boundary": "Descriptive error inventory only.", "transformationReceipt": {"id": "error-selection-all-v1", "sha256": "be" * 32}},
            ],
            "negativeCases": [
                {"caseId": "causal-mask-leakage", "moduleArtifactId": "transformer-leakage-test", "injectedFault": "Replace the causal mask with an all-visible mask.", "expectedFailure": "A future-token perturbation changes an earlier logit.", "observedFailure": "Future-token invariance assertion failed.", "evidenceSha256": "ca" * 32, "status": "rejected-as-expected"},
                {"caseId": "unicode-normalization-round-trip", "moduleArtifactId": "tokenisation-provenance-audit", "injectedFault": "Skip declared Unicode normalization before tokenization.", "expectedFailure": "Canonical-equivalent probes no longer satisfy the declared round-trip contract.", "observedFailure": "Normalization/round-trip assertion failed.", "evidenceSha256": "cb" * 32, "status": "rejected-as-expected"},
                {"caseId": "tokenizer-version-drift", "moduleArtifactId": "tokenisation-provenance-audit", "injectedFault": "Change the tokenizer version without updating the receipt.", "expectedFailure": "Tokenizer identity and output hash drift.", "observedFailure": "Version/hash binding assertion failed.", "evidenceSha256": "c0" * 32, "status": "rejected-as-expected"},
                {"caseId": "lora-merge-equivalence", "moduleArtifactId": "adaptation-lifecycle-audit", "injectedFault": "Merge LoRA with the wrong scaling factor.", "expectedFailure": "Merged and unmerged outputs exceed the declared tolerance.", "observedFailure": "Merge-equivalence assertion failed.", "evidenceSha256": "cd" * 32, "status": "rejected-as-expected"},
            ],
            "calibrationMethod": "Five fixed equal-width confidence bins; expected calibration error reported per seed without population extrapolation.",
            "errorAnalysis": {
                "representativeErrors": [
                    {"exampleId": "sequence-error-07", "observed": "cycle B token predicted as cycle A", "hypothesis": "held-out length interaction", "disposition": "retained; no post-hoc relabeling"}
                ],
                "evidenceSha256": "da" * 32,
            },
            "controlledAblation": {
                "variableChanged": "LoRA rank 2 to rank 1",
                "fixedBudget": True,
                "seedResults": [0.02, 0.03, 0.01],
                "evidenceSha256": "db" * 32,
            },
            "seedLevelTraceRef": "run-ledger:runs",
            "uncertaintySummary": "Three-seed traces are shown without a population-level confidence claim.",
            "missingTests": ["Natural-language distribution shifts", "Different tokenizer implementations"],
            "generalisationLimits": ["Synthetic fixtures only", "No demographic or real-population inference"],
        },
        "limitations": {
            "knownFailures": ["Performance drops under token corruption.", "Held-out lengths remain weak."],
            "untestedConditions": ["Natural language corpora", "Different hardware and releases"],
            "stopConditions": ["Any fixture/hash drift", "Mask leakage, unresolved rights, or reviewer challenge"],
            "invalidUses": ["Consequential decisions", "Claims about real people or demographic groups"],
            "safetyMisuseRisks": ["Synthetic accuracy may be misrepresented as production quality", "Tokenizer behavior may drift on real text"],
            "remediationOwners": ["learner", "named independent reviewer"],
            "costCeiling": "Stop if the declared CPU, memory, or paid-cost budget is exceeded.",
            "dataRightsBoundary": "Only course-authored fixtures are cleared; any external corpus requires a new rights review.",
            "unresolvedRightsUncertainty": False,
        },
    }
    linked_ids = ["run-ledger", "failure-ledger", "resource-record", "evaluation-slices"]
    evidence_links = {artifact_id: canonical_content_hash(content[artifact_id]) for artifact_id in linked_ids}
    content["training-dossier"] = {
        "purpose": "Test a tiny Transformer learner on course-authored symbolic sequences and decide whether evidence supports any use beyond instruction.",
        "primaryModel": "transformer",
        "version": "learner-final-test-fixture-v2",
        "architecture": "one-layer, two-head Transformer with a simple RNN baseline",
        "dataProvenance": "Only the course-authored sequence fixture and its fixed split receipt.",
        "rightsBoundary": "Only original course fixtures; external training or deployment data is out of scope.",
        "optimisationSummary": "Identical fixed budget across three preregistered seeds; rank-2 LoRA adaptation comparison.",
        "adaptationStrategy": "rank-2 LoRA on the output projection with merge-equivalence regression",
        "seeds": [20260828, 20260829, 20260830],
        "decision": "no-deploy",
        "decisionReason": "Synthetic course evidence does not establish external validity, rights, safety, or production fitness.",
        "intendedUses": ["Offline instruction and validator testing"],
        "excludedUses": ["Training on unreviewed external data", "Deployment or consequential decision support"],
        "owners": ["learner", "named independent reviewer"],
        "evidenceLinks": evidence_links,
        "claims": [
            {"claimId": "run-reproducibility", "claim": "Three primary Transformer seeds and a baseline were attempted under one fixed split.", "evidenceArtifactId": "run-ledger", "evidenceSha256": evidence_links["run-ledger"]},
            {"claimId": "failed-run-retention", "claim": "The permissive-mask negative control is retained and rejected.", "evidenceArtifactId": "failure-ledger", "evidenceSha256": evidence_links["failure-ledger"]},
            {"claimId": "resource-boundary", "claim": "Only a CPU-time energy proxy and bounded local cost estimate are reported.", "evidenceArtifactId": "resource-record", "evidenceSha256": evidence_links["resource-record"]},
            {"claimId": "slice-boundary", "claim": "Clean, corruption, length, synthetic subgroup, calibration, and error slices are reported separately.", "evidenceArtifactId": "evaluation-slices", "evidenceSha256": evidence_links["evaluation-slices"]},
        ],
    }
    reviewed_ids = [artifact_id for artifact_id in ARTIFACT_IDS if artifact_id != "reviewer-decision"]
    content["reviewer-decision"] = {
        "reviewerName": "Independent test-fixture reviewer",
        "reviewerRole": "clean-room reproducibility reviewer",
        "externalReviewComplete": True,
        "reviewedArtifactIdsAndHashes": {
            artifact_id: canonical_content_hash(content[artifact_id]) for artifact_id in reviewed_ids
        },
        "cleanRoomCommands": ["python3 run_modules.py --all --output-dir review/modules"],
        "cleanRoomTranscriptPath": "review/clean-room-transcript.txt",
        "cleanRoomTranscriptSha256": "ea" * 32,
        "rerunResults": ["Three seed traces reproduced within the declared boundary."],
        "failedChecks": ["The injected permissive-mask run failed future-token invariance as expected."],
        "unresolvedVariance": "No unresolved variance inside the fixed course tolerance; cross-host equality remains untested.",
        "remediation": "Keep decision at no-deploy and rerun after any environment, code, data, or schema hash change.",
        "challenge": "The reviewer challenged future-token leakage; the negative permissive-mask control failed as expected.",
        "rationale": "Course-local synthetic evidence is structurally reviewable but insufficient for deployment.",
        "signedAt": "2026-08-28T02:00:00+00:00",
        "decision": "no-deploy",
        "identityBoundary": "learner-supplied-not-authenticated-by-local-validator",
    }
    return {
        "schemaVersion": "aicourse.deep-learning.capstone.v2",
        "courseId": "deep-learning",
        "courseVersion": "2026.08.28-v2",
        "capstoneVersion": "2026.08.28-capstone-v2",
        "validatorId": "aicourse.deep-learning.validator.v2",
        "generatedAt": "2026-08-28T03:00:00+00:00",
        "mode": "learner-final",
        "decision": "no-deploy",
        "artifacts": [capstone_artifact(artifact_id, content[artifact_id]) for artifact_id in ARTIFACT_IDS],
    }


class Course20V2LabTests(unittest.TestCase):
    def test_readiness_reference_passes_and_incomplete_template_routes_to_bridge(self) -> None:
        self.assertEqual(validate_readiness(LAB_DIR / "readiness.reference.json"), [])
        self.assertTrue(validate_readiness(LAB_DIR / "readiness.template.json"))

    def test_all_twelve_module_artifacts_recompute_and_validate(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            hashes = {}
            for module_slug in BUILDERS:
                lineage = {artifact_id: hashes[artifact_id] for artifact_id in MODULE_INPUTS[module_slug]}
                artifact = build_artifact(module_slug, lineage)
                path = root / f"{module_slug}.json"
                write_artifact(path, artifact)
                self.assertEqual(validate_module_artifact(path, module_slug), [])
                import hashlib
                hashes[MODULE_ARTIFACTS[module_slug]] = hashlib.sha256(path.read_bytes()).hexdigest()

    def test_every_module_has_a_content_specific_destructive_negative(self) -> None:
        mutations = {
            "tensors-computational-graphs": ("viewSharesStorage", False),
            "backpropagation-autodiff": ("status", "fail"),
            "training-loops-debugging": ("resumeLossTailMatches", False),
            "optimisation-initialisation-normalisation-regularisation": ("seeds", [20260828]),
            "cnns-visual-representations": ("comparison", []),
            "transfer-learning": ("sourceCheckpointSha256", "0" * 64),
            "sequence-models-rnns-lstms": ("stateResetPass", False),
            "attention": ("maskedProbabilityMaximum", 0.25),
            "transformer-encoder-decoder": ("causalLeakageTestPass", False),
            "tokenisation-pretraining": ("allRoundTripsPass", False),
            "fine-tuning-parameter-efficient-adaptation": ("mergeEquivalencePass", False),
            "robustness-evaluation-training-card-capstone": ("decision", "deploy"),
        }
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            hashes = {}
            for module_slug, (field, value) in mutations.items():
                lineage = {artifact_id: hashes[artifact_id] for artifact_id in MODULE_INPUTS[module_slug]}
                clean = build_artifact(module_slug, lineage)
                clean_path = root / f"{module_slug}.clean.json"
                write_artifact(clean_path, clean)
                import hashlib
                hashes[MODULE_ARTIFACTS[module_slug]] = hashlib.sha256(clean_path.read_bytes()).hexdigest()
                changed = copy.deepcopy(clean)
                changed["evidence"][field] = value
                changed_path = root / f"{module_slug}.mutated.json"
                write_artifact(changed_path, changed)
                self.assertTrue(validate_module_artifact(changed_path, module_slug), module_slug)

    def test_reference_example_passes_only_the_reference_validator(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            package = write_outputs(build_submission(COURSE_DIR, LAB_DIR, root), root)
            self.assertEqual(validate_reference(package), [])
            self.assertTrue(validate_capstone(package))

    def test_learner_final_positive_and_critical_negatives(self) -> None:
        package = valid_capstone()
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "learner-final.json"
            path.write_text(json.dumps(package, ensure_ascii=False, indent=2), encoding="utf-8")
            self.assertEqual(validate_capstone(path), [])
            cases: list[tuple[str, dict]] = []
            fewer_seeds = copy.deepcopy(package)
            fewer_seeds["artifacts"][artifact_index("run-ledger")]["content"]["runs"] = fewer_seeds["artifacts"][artifact_index("run-ledger")]["content"]["runs"][:2]
            rehash(fewer_seeds, artifact_index("run-ledger"))
            cases.append(("fewer than three primary Transformer seeds", fewer_seeds))
            no_failures = copy.deepcopy(package)
            no_failures["artifacts"][artifact_index("failure-ledger")]["content"]["failures"] = []
            rehash(no_failures, artifact_index("failure-ledger"))
            cases.append(("missing retained failure entries", no_failures))
            no_review = copy.deepcopy(package)
            no_review["artifacts"][artifact_index("reviewer-decision")]["content"]["externalReviewComplete"] = False
            rehash(no_review, artifact_index("reviewer-decision"))
            cases.append(("incomplete external review", no_review))
            unresolved_rights = copy.deepcopy(package)
            unresolved_rights["artifacts"][artifact_index("limitations")]["content"]["unresolvedRightsUncertainty"] = True
            rehash(unresolved_rights, artifact_index("limitations"))
            cases.append(("rights uncertainty paired with no-deploy instead of no-train", unresolved_rights))
            mlp_only = copy.deepcopy(package)
            for run in mlp_only["artifacts"][artifact_index("run-ledger")]["content"]["runs"]:
                run["modelFamily"] = "simple-baseline"
            rehash(mlp_only, artifact_index("run-ledger"))
            cases.append(("MLP-only learner final", mlp_only))
            placeholder_hash = copy.deepcopy(package)
            placeholder_hash["artifacts"][0]["sha256"] = "0" * 64
            cases.append(("placeholder artifact hash", placeholder_hash))

            def mutate_content(
                name: str,
                artifact_id: str,
                mutation,
            ) -> None:
                changed = copy.deepcopy(package)
                index = artifact_index(artifact_id)
                mutation(changed["artifacts"][index]["content"])
                rehash(changed, index)
                cases.append((name, changed))

            mutate_content(
                "environment binds the current capstone schema bytes",
                "environment-lock",
                lambda content: content.__setitem__("schemaSha256", "9b" * 32),
            )
            mutate_content(
                "required learner final stays on the CPU lane",
                "environment-lock",
                lambda content: content.__setitem__("acceleratorRequired", True),
            )

            mutate_content(
                "run start timestamp must be offset-aware",
                "run-ledger",
                lambda content: content["runs"][0].__setitem__("startedAt", "2026-08-28T01:00:00"),
            )
            mutate_content(
                "run end must be after start",
                "run-ledger",
                lambda content: content["runs"][0].__setitem__("endedAt", "2026-08-28T00:59:00+00:00"),
            )
            mutate_content(
                "elapsed and wall timestamps must agree",
                "run-ledger",
                lambda content: content["runs"][0].__setitem__("wallSeconds", 600),
            )
            for required_field in ("stopReason", "configSha256", "splitReceiptId", "splitReceiptSha256"):
                mutate_content(
                    f"run requires {required_field}",
                    "run-ledger",
                    lambda content, field=required_field: content["runs"][0].pop(field),
                )
            mutate_content(
                "Transformer run requires module-receipt linkage",
                "run-ledger",
                lambda content: content["runs"][0]["moduleReceiptIdsAndHashes"].pop("transformer-leakage-test"),
            )
            mutate_content(
                "checkpoint/resume must bind the source checkpoint",
                "run-ledger",
                lambda content: content["checkpointResume"].__setitem__("checkpointSha256", "9f" * 32),
            )
            mutate_content(
                "checkpoint/resume exact outputs must match",
                "run-ledger",
                lambda content: content["checkpointResume"].__setitem__("resumedOutputSha256", "9e" * 32),
            )
            mutate_content(
                "failure records require recovery evidence",
                "failure-ledger",
                lambda content: content["failures"][0].pop("recoveryAction"),
            )
            for required_field in (
                "measurementBoundary",
                "wallSeconds",
                "peakMemoryBytes",
                "runCount",
                "monetaryCostEstimate",
                "monetaryCostUncertainty",
                "energyProxy",
                "energyProxyUncertainty",
            ):
                mutate_content(
                    f"resource evidence requires {required_field}",
                    "resource-record",
                    lambda content, field=required_field: content.pop(field),
                )
            mutate_content(
                "resource wall time stays within the ten-minute CPU budget",
                "resource-record",
                lambda content: content.__setitem__("wallSeconds", 601),
            )
            mutate_content(
                "resource peak memory stays within the two-GiB CPU budget",
                "resource-record",
                lambda content: content.__setitem__("peakMemoryBytes", 3 * 1024 * 1024 * 1024),
            )
            for slice_type in (
                "corruption",
                "held-out-length",
                "synthetic-subgroup",
                "calibration",
                "error-analysis",
            ):
                mutate_content(
                    f"evaluation requires {slice_type} slice",
                    "evaluation-slices",
                    lambda content, expected=slice_type: content.__setitem__(
                        "slices",
                        [item for item in content["slices"] if item["sliceType"] != expected],
                    ),
                )
            for case_id in (
                "causal-mask-leakage",
                "unicode-normalization-round-trip",
                "tokenizer-version-drift",
                "lora-merge-equivalence",
            ):
                mutate_content(
                    f"evaluation requires {case_id} negative case",
                    "evaluation-slices",
                    lambda content, expected=case_id: content.__setitem__(
                        "negativeCases",
                        [item for item in content["negativeCases"] if item["caseId"] != expected],
                    ),
                )
            mutate_content(
                "calibration method is explicit",
                "evaluation-slices",
                lambda content: content.pop("calibrationMethod"),
            )
            mutate_content(
                "representative error evidence is retained",
                "evaluation-slices",
                lambda content: content.pop("errorAnalysis"),
            )
            mutate_content(
                "training dossier links exact slice hash",
                "training-dossier",
                lambda content: content["evidenceLinks"].__setitem__("evaluation-slices", "9d" * 32),
            )
            mutate_content(
                "reviewer binds the exact seven reviewed artifacts",
                "reviewer-decision",
                lambda content: content["reviewedArtifactIdsAndHashes"].__setitem__("run-ledger", "9c" * 32),
            )

            for index, (name, changed) in enumerate(cases):
                changed_path = Path(directory) / f"negative-{index}.json"
                changed_path.write_text(json.dumps(changed, ensure_ascii=False), encoding="utf-8")
                self.assertTrue(validate_capstone(changed_path), f"negative case unexpectedly passed: {name}")

    def test_no_train_is_a_valid_fail_closed_decision(self) -> None:
        package = valid_capstone()
        package["decision"] = "no-train"
        for artifact_id in ("training-dossier", "reviewer-decision"):
            index = artifact_index(artifact_id)
            package["artifacts"][index]["content"]["decision"] = "no-train"
            rehash(package, index)
        limitations_index = artifact_index("limitations")
        package["artifacts"][limitations_index]["content"]["unresolvedRightsUncertainty"] = True
        rehash(package, limitations_index)
        reviewer_index = artifact_index("reviewer-decision")
        package["artifacts"][reviewer_index]["content"]["reviewedArtifactIdsAndHashes"]["training-dossier"] = package["artifacts"][artifact_index("training-dossier")]["sha256"]
        package["artifacts"][reviewer_index]["content"]["reviewedArtifactIdsAndHashes"]["limitations"] = package["artifacts"][limitations_index]["sha256"]
        rehash(package, reviewer_index)
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "no-train.json"
            path.write_text(json.dumps(package, ensure_ascii=False), encoding="utf-8")
            self.assertEqual(validate_capstone(path), [])

    def test_validator_emits_browser_parseable_receipts_for_exact_artifacts(self) -> None:
        package = valid_capstone()
        with tempfile.TemporaryDirectory(prefix=".receipt-test-", dir=LAB_DIR) as directory:
            root = Path(directory)
            package_path = root / "learner-final.json"
            receipt_dir = root / "receipts"
            package_path.write_text(json.dumps(package, ensure_ascii=False, indent=2), encoding="utf-8")
            package_argument = package_path.relative_to(REPO_ROOT)
            receipt_argument = receipt_dir.relative_to(REPO_ROOT)
            completed = subprocess.run(
                [
                    sys.executable,
                    str(LAB_DIR / "validate_capstone.py"),
                    "--package",
                    str(package_argument),
                    "--receipt-dir",
                    str(receipt_argument),
                ],
                cwd=REPO_ROOT,
                text=True,
                capture_output=True,
                check=False,
            )
            self.assertEqual(completed.returncode, 0, completed.stdout + completed.stderr)
            expected_hashes = {item["artifactId"]: item["sha256"] for item in package["artifacts"]}
            parser_url = (REPO_ROOT / "lib/course-kit/evidence-receipt.ts").as_uri()
            node_program = f"""
import {{ readFileSync }} from 'node:fs';
import {{ isCourseKitEvidenceReceipt }} from {json.dumps(parser_url)};
const [receiptPath, artifactId] = process.argv.slice(1);
const value = readFileSync(receiptPath, 'utf8');
const ok = isCourseKitEvidenceReceipt(value, {{
  kind: 'capstone-artifact',
  courseId: 'deep-learning',
  courseVersion: '2026.08.28-v2',
  artifactId,
  validatorId: 'aicourse.deep-learning.validator.v2',
  validatorCommandPrefix: 'python3 public/courses/deep-learning/lab/validate_capstone.py --package ',
}});
if (!ok) process.exit(1);
"""
            for artifact_id in ARTIFACT_IDS:
                receipt_path = receipt_dir / f"{artifact_id}.receipt.json"
                receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
                self.assertEqual(receipt["sha256"], expected_hashes[artifact_id])
                self.assertEqual(receipt["artifactPath"], f"{package_argument.as_posix()}#artifacts/{artifact_index(artifact_id)}/content")
                parsed = subprocess.run(
                    ["node", "--import", "tsx", "--input-type=module", "-e", node_program, str(receipt_path), artifact_id],
                    cwd=REPO_ROOT,
                    text=True,
                    capture_output=True,
                    check=False,
                )
                self.assertEqual(parsed.returncode, 0, f"{artifact_id}: {parsed.stdout}{parsed.stderr}")


if __name__ == "__main__":
    unittest.main()
