#!/usr/bin/env python3
"""Validate the Course 20 foundation example without granting capstone credit."""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

from run_experiment import (
    CAPSTONE_VERSION,
    COURSE_ID,
    COURSE_VERSION,
    FIXTURE_HASHES,
    VALIDATOR_ID,
    build_results,
    sha256,
)


ARTIFACT_IDS = [
    "environment-lock",
    "training-log",
    "cost-energy-record",
    "error-slices",
    "ablation",
    "training-card",
    "limitations",
    "reproducibility-receipt",
]
SCHEMA_ID = "aicourse.deep-learning.reference-package.v2"
REFERENCE_VALIDATOR_ID = "aicourse.deep-learning.reference-validator.v1"


def is_sha256(value: Any) -> bool:
    return isinstance(value, str) and bool(re.fullmatch(r"[0-9a-f]{64}", value)) and len(set(value)) > 1


def validate_reference(path: Path) -> List[str]:
    issues: List[str] = []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        return [f"reference package is unreadable JSON: {error}"]
    expected = {
        "schemaVersion": SCHEMA_ID,
        "courseId": COURSE_ID,
        "courseVersion": COURSE_VERSION,
        "referenceVersion": CAPSTONE_VERSION,
        "validatorId": VALIDATOR_ID,
        "mode": "reference-example",
        "capstoneEligible": False,
        "independentReviewComplete": False,
        "decision": "no-deploy",
    }
    allowed = set(expected) | {"generatedAt", "artifacts"}
    if not isinstance(data, dict) or set(data) != allowed:
        return ["reference package top-level contract drifted"]
    for key, value in expected.items():
        if data.get(key) != value:
            issues.append(f"{key} must equal {value!r}")
    try:
        datetime.fromisoformat(str(data.get("generatedAt", "")).replace("Z", "+00:00"))
    except ValueError:
        issues.append("generatedAt must be an ISO 8601 timestamp")
    artifacts = data.get("artifacts")
    if not isinstance(artifacts, list) or [item.get("artifactId") for item in artifacts if isinstance(item, dict)] != ARTIFACT_IDS:
        return issues + ["reference artifacts must contain the exact eight ordered foundation records"]
    by_id: Dict[str, Dict[str, Any]] = {}
    for item in artifacts:
        if not isinstance(item, dict) or set(item) != {"artifactId", "content"} or not isinstance(item.get("content"), dict):
            issues.append("every reference artifact needs only artifactId and object content")
            continue
        by_id[item["artifactId"]] = item["content"]
    if set(by_id) != set(ARTIFACT_IDS):
        return issues + ["reference artifact set is incomplete"]
    try:
        expected_results = build_results(Path(__file__).resolve().parent.parent)
    except Exception as error:
        return issues + [f"fresh foundation recomputation failed: {error}"]
    environment = by_id["environment-lock"]
    if environment.get("networkRequired") is not False or environment.get("acceleratorRequired") is not False:
        issues.append("foundation reference must remain offline and CPU-only")
    if environment.get("inputHashes") != expected_results["inputReceipts"]:
        issues.append("foundation fixture hashes drifted")
    training = by_id["training-log"]
    if training.get("milestones") != expected_results["milestones"] or training.get("gradientCheck") != expected_results["gradientCheck"]:
        issues.append("foundation training/gradient evidence does not recompute")
    for artifact_id, output_fields in (("training-log", ("outputPath", "outputSha256")), ("training-card", ("outputPath", "outputSha256"))):
        content = by_id[artifact_id]
        output = path.parent / str(content.get(output_fields[0], ""))
        if not output.is_file() or not is_sha256(content.get(output_fields[1])) or sha256(output) != content[output_fields[1]]:
            issues.append(f"{artifact_id} output/hash mismatch")
    receipt = by_id["reproducibility-receipt"]
    reviewer = receipt.get("reviewer", {})
    if reviewer.get("externalReviewComplete") is not False or "not an external reviewer" not in str(reviewer.get("name", "")):
        issues.append("reference package must not fabricate independent review")
    if receipt.get("decision") != "no-deploy" or receipt.get("validatorId") != VALIDATOR_ID:
        issues.append("reference receipt lost its no-deploy or validator boundary")
    for output in receipt.get("outputs", []):
        output_path = path.parent / str(output.get("path", ""))
        if not output_path.is_file() or sha256(output_path) != output.get("sha256"):
            issues.append(f"reference output/hash mismatch: {output.get('path')}")
    return issues


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--package", required=True, type=Path)
    args = parser.parse_args()
    issues = validate_reference(args.package.resolve())
    if issues:
        print(f"{VALIDATOR_ID}: FAIL ({len(issues)} issue(s))")
        for issue in issues:
            print(f"- {issue}")
        return 1
    print(f"{VALIDATOR_ID}: REFERENCE_PASS")
    print("capstoneEligible=false independentReviewComplete=false decision=no-deploy")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
