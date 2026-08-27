#!/usr/bin/env python3
"""Fail-closed, schema-specific validator for the Course 20 capstone package."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

from run_experiment import (
    CAPSTONE_VERSION,
    COURSE_ID,
    COURSE_VERSION,
    EPOCHS,
    FIXTURE_HASHES,
    HIDDEN_UNITS,
    LEARNING_RATE,
    SEED,
    build_results,
)

ARTIFACT_IDS = [
    "environment-lock", "training-log", "cost-energy-record", "error-slices",
    "ablation", "training-card", "limitations", "reproducibility-receipt",
]
CAPSTONE_SCHEMA_ID = "aicourse.deep-learning.capstone.v1"
VALIDATOR_ID = "aicourse.deep-learning.validator.v1"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def is_sha256(value: Any) -> bool:
    return isinstance(value, str) and bool(re.fullmatch(r"[0-9a-f]{64}", value))


def exact_top_level(data: Dict[str, Any], issues: List[str]) -> None:
    expected = {
        "schemaVersion": "aicourse.capstone-submission.v1",
        "courseId": COURSE_ID,
        "courseVersion": COURSE_VERSION,
        "capstoneVersion": CAPSTONE_VERSION,
        "validatorId": VALIDATOR_ID,
        "generatedOn": "2026-08-26",
    }
    allowed = set(expected) | {"artifacts"}
    extra = set(data) - allowed
    if extra:
        issues.append("unexpected top-level fields: {}".format(sorted(extra)))
    for field, value in expected.items():
        if data.get(field) != value:
            issues.append("{} must equal {!r}".format(field, value))


def artifact_map(data: Dict[str, Any], issues: List[str]) -> Optional[Dict[str, Dict[str, Any]]]:
    artifacts = data.get("artifacts")
    if not isinstance(artifacts, list):
        issues.append("artifacts must be an array")
        return None
    if len(artifacts) != len(ARTIFACT_IDS):
        issues.append("exactly eight artifacts are required")
    observed = [item.get("artifactId") if isinstance(item, dict) else None for item in artifacts]
    if observed != ARTIFACT_IDS:
        issues.append("artifact IDs/order must equal {!r}".format(ARTIFACT_IDS))
    result = {}
    for item in artifacts:
        if not isinstance(item, dict) or set(item) != {"artifactId", "content"} or not isinstance(item.get("content"), dict):
            issues.append("every artifact must contain only artifactId and object content")
            continue
        artifact_id = item["artifactId"]
        if artifact_id in result:
            issues.append("duplicate artifact ID: {}".format(artifact_id))
        if artifact_id in ARTIFACT_IDS:
            result[artifact_id] = item["content"]
    if set(result) != set(ARTIFACT_IDS):
        issues.append("artifact set is incomplete")
        return None
    return result


def verify_output(path: Path, expected_hash: Any, issues: List[str], label: str) -> None:
    if not path.is_file():
        issues.append("{} output is missing: {}".format(label, path.name))
    elif not is_sha256(expected_hash) or sha256(path) != expected_hash:
        issues.append("{} output/hash mismatch: {}".format(label, path.name))


def validate_submission(path: Path) -> List[str]:
    submission_path = Path(path).resolve()
    lab_dir = Path(__file__).resolve().parent
    course_dir = lab_dir.parent
    issues = []
    try:
        data = json.loads(submission_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        return ["submission is unreadable JSON: {}".format(error)]
    if not isinstance(data, dict):
        return ["submission root must be an object"]
    try:
        schema = json.loads((lab_dir / "capstone.schema.json").read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        return ["capstone schema is unreadable: {}".format(error)]
    if schema.get("x-schemaId") != CAPSTONE_SCHEMA_ID or schema.get("x-validatorId") != VALIDATOR_ID or schema.get("x-artifactIds") != ARTIFACT_IDS:
        issues.append("capstone.schema.json validator/artifact contract drift")
    if schema.get("x-requiredComparisons") != ["orientation-rule-baseline", "tiny-neural-network", "no-bias-ablation"]:
        issues.append("capstone.schema.json comparison contract drift")
    if schema.get("x-requiredSlices") != ["clean", "contrast-drop", "occlusion"] or schema.get("x-decisionBoundary") != "no-deploy":
        issues.append("capstone.schema.json slice or decision contract drift")
    exact_top_level(data, issues)
    by_id = artifact_map(data, issues)
    if by_id is None:
        return issues

    try:
        expected_results = build_results(course_dir)
    except Exception as error:  # fail closed if local evidence cannot be recomputed
        return issues + ["locked reference computation failed: {}".format(error)]

    environment = by_id["environment-lock"]
    if environment.get("referenceRuntime") != "CPython 3.9.6" or environment.get("processor") != "CPU":
        issues.append("environment must bind the exact CPython 3.9.6 CPU reference")
    if environment.get("acceleratorRequired") is not False or environment.get("networkRequired") is not False or environment.get("seed") != SEED:
        issues.append("environment must keep GPU/network optional and seed fixed")
    if environment.get("inputHashes") != expected_results["inputReceipts"]:
        issues.append("environment fixture hashes do not match the locked inputs")
    if environment.get("environmentLockSha256") != sha256(lab_dir / "environment.lock.json"):
        issues.append("environment lock hash mismatch")

    training = by_id["training-log"]
    if training.get("architecture") != "16-4-1-tanh-sigmoid" or training.get("epochs") != EPOCHS or training.get("learningRate") != LEARNING_RATE:
        issues.append("training configuration drifted")
    if training.get("milestones") != expected_results["milestones"]:
        issues.append("training milestones do not reproduce the locked experiment")
    gradient = training.get("gradientCheck", {})
    if gradient != expected_results["gradientCheck"] or gradient.get("status") != "pass":
        issues.append("finite-difference gradient check failed or drifted")
    if training.get("failedRunsRetained") is not True:
        issues.append("training log must retain failed-run evidence")
    training_path = submission_path.parent / str(training.get("outputPath", ""))
    verify_output(training_path, training.get("outputSha256"), issues, "training-log")

    cost = by_id["cost-energy-record"]
    for field in ("proxyType", "estimatedMultiplyAdds", "trainingExamplesProcessed", "physicalEnergyMeasured", "monetaryCostMeasured", "boundary"):
        if cost.get(field) != expected_results["costProxy"].get(field):
            issues.append("cost/energy proxy field drifted: {}".format(field))
    if len(cost.get("limitations", [])) < 3:
        issues.append("cost/energy proxy limitations are incomplete")

    slices = by_id["error-slices"]
    if slices.get("slices") != expected_results["slices"]:
        issues.append("clean/contrast/occlusion slice evidence drifted")
    if slices.get("baseline") != expected_results["models"]["orientation-rule-baseline"] or slices.get("neural") != expected_results["models"]["tiny-neural-network"]:
        issues.append("baseline versus neural comparison is missing or incorrect")
    if len(slices.get("limitations", [])) < 4 or "Two fixed test records" not in str(slices.get("denominatorBoundary", "")):
        issues.append("slice denominators and limitations must remain explicit")

    ablation = by_id["ablation"]
    for field, value in expected_results["ablation"].items():
        if ablation.get(field) != value:
            issues.append("ablation field drifted: {}".format(field))
    if "fixture/configuration" not in str(ablation.get("causalBoundary", "")):
        issues.append("ablation must retain its causal boundary")

    card = by_id["training-card"]
    if card.get("models") != expected_results["models"] or card.get("architecture") != "16-4-1-tanh-sigmoid":
        issues.append("training card lacks the exact baseline and neural model evidence")
    if card.get("decision") != "no-deploy" or len(card.get("intendedUses", [])) < 3 or len(card.get("excludedUses", [])) < 4:
        issues.append("training card use and no-deploy boundaries are incomplete")
    if "no third-party or personal data" not in str(card.get("rightsBoundary", "")):
        issues.append("training card rights boundary is missing")
    card_path = submission_path.parent / str(card.get("outputPath", ""))
    verify_output(card_path, card.get("outputSha256"), issues, "training-card")

    limitations = by_id["limitations"]
    if limitations.get("decision") != "no-deploy" or len(limitations.get("knownFailures", [])) < 3 or len(limitations.get("untestedConditions", [])) < 5 or len(limitations.get("stopConditions", [])) < 5:
        issues.append("limitations/no-go register is incomplete")
    if set(limitations.get("owners", [])) != {"learner", "independent reviewer"}:
        issues.append("limitations register must name learner and independent-review roles")

    receipt = by_id["reproducibility-receipt"]
    if receipt.get("validatorId") != VALIDATOR_ID or receipt.get("seed") != SEED or receipt.get("inputs") != expected_results["inputReceipts"]:
        issues.append("reproducibility receipt is not bound to this validator, seed, and fixture")
    outputs = receipt.get("outputs")
    output_map = {item.get("path"): item.get("sha256") for item in outputs} if isinstance(outputs, list) else {}
    if set(output_map) != {"training-log.json", "metrics.json", "training-card.json"}:
        issues.append("reproducibility receipt must list all three generated evidence files")
    for name, digest in output_map.items():
        verify_output(submission_path.parent / name, digest, issues, "reproducibility")
    reviewer = receipt.get("reviewer", {})
    if reviewer.get("externalReviewComplete") is not False or "not an external reviewer" not in str(reviewer.get("name", "")):
        issues.append("reference receipt must not fabricate completed external review")
    if receipt.get("decision") != "no-deploy" or "Mutate version" not in str(receipt.get("challenge", "")):
        issues.append("reproducibility receipt must retain mutation challenge and no-deploy decision")
    return issues


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("submission", nargs="?", type=Path)
    parser.add_argument("--package", dest="package", type=Path)
    args = parser.parse_args()
    package = args.package or args.submission
    if package is None:
        parser.error("provide --package PATH (or a positional PATH)")
    issues = validate_submission(package)
    if issues:
        print("{}: FAIL ({} issue(s))".format(VALIDATOR_ID, len(issues)))
        for issue in issues:
            print("- {}".format(issue))
        return 1
    print("{}: PASS".format(VALIDATOR_ID))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
