#!/usr/bin/env python3
"""Offline, fail-closed validator for the Course 16 governance dossier."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

SCHEMA_ID = "aicourse.responsible-ai.capstone.v1"
VALIDATOR_ID = "aicourse.responsible-ai.validator.v1"
COURSE_VERSION = "2026.08.26-v1"
CAPSTONE_VERSION = "2026.08.26-capstone-v1"
FIXTURE_PATH = "public/courses/responsible-ai/governance-case-synthetic-v1.json"
FIXTURE_SHA256 = "289625c9ff824dea69c96048f6e1b8293d94f2d8434f0ef268aaaf271fad1253"
ROOT = Path(__file__).resolve().parents[4]
ARTIFACT_IDS = (
    "impact-assessment",
    "stakeholder-map",
    "risk-register",
    "data-map",
    "subgroup-test",
    "explanation-limitations-card",
    "override-appeal-flow",
    "red-team-incident-log",
    "go-no-go-memo",
)
CRITERIA = (
    "purpose-risk-stop",
    "data-rights-minimisation",
    "subgroups-uncertainty",
    "human-authority-recourse",
    "challenge-incident-recovery",
    "evidence-decision-expiry",
)
PLACEHOLDER = re.compile(r"\b(?:todo|tbd|placeholder|coming soon)\b|<[^>]+>", re.I)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(65536), b""):
            digest.update(block)
    return digest.hexdigest()


def nonempty_strings(value: object) -> bool:
    return isinstance(value, list) and bool(value) and all(
        isinstance(item, str) and bool(item.strip()) for item in value
    )


def validate(package_path: Path, root: Path = ROOT) -> list[str]:
    errors: list[str] = []
    try:
        package = json.loads(package_path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        return [f"package is not readable JSON: {error}"]
    if not isinstance(package, dict):
        return ["package root must be an object"]
    expected_scalars = {
        "schemaId": SCHEMA_ID,
        "courseId": "responsible-ai",
        "courseVersion": COURSE_VERSION,
        "capstoneVersion": CAPSTONE_VERSION,
    }
    for key, expected in expected_scalars.items():
        if package.get(key) != expected:
            errors.append(f"{key} must equal {expected}")
    fixture = package.get("fixture")
    if fixture != {"path": FIXTURE_PATH, "sha256": FIXTURE_SHA256}:
        errors.append("fixture must bind the locked Course 16 path and SHA-256")
    fixture_path = root / FIXTURE_PATH
    if not fixture_path.is_file() or sha256(fixture_path) != FIXTURE_SHA256:
        errors.append("locked Course 16 fixture is missing or its bytes changed")
    artifacts = package.get("artifacts")
    if not isinstance(artifacts, dict) or set(artifacts) != set(ARTIFACT_IDS):
        errors.append("artifacts must contain exactly the nine locked IDs")
    else:
        for artifact_id in ARTIFACT_IDS:
            artifact = artifacts[artifact_id]
            if not isinstance(artifact, dict):
                errors.append(f"{artifact_id} must be an object")
                continue
            if not isinstance(artifact.get("owner"), str) or not artifact["owner"].strip():
                errors.append(f"{artifact_id}.owner is required")
            if artifact.get("status") != "complete":
                errors.append(f"{artifact_id}.status must be complete")
            if not nonempty_strings(artifact.get("evidence")):
                errors.append(f"{artifact_id}.evidence requires at least one reviewable statement")
            limitations = artifact.get("limitations")
            if not nonempty_strings(limitations):
                errors.append(f"{artifact_id}.limitations requires at least one explicit boundary")
    gate = package.get("responsibleAiGate")
    if not isinstance(gate, dict) or gate.get("version") != COURSE_VERSION:
        errors.append("responsibleAiGate version is missing or stale")
    elif tuple(gate.get("criteria", [])) != CRITERIA:
        errors.append("responsibleAiGate criteria must use the six canonical IDs in order")
    if package.get("decision") not in {"go", "revise", "no-go", "no-deploy"}:
        errors.append("decision must be go, revise, no-go, or no-deploy")
    reviewer = package.get("reviewer")
    if not isinstance(reviewer, dict):
        errors.append("reviewer object is required")
    else:
        if not isinstance(reviewer.get("role"), str) or not reviewer["role"].strip():
            errors.append("reviewer.role is required")
        if reviewer.get("decision") not in {"accept", "accept-with-limitations"}:
            errors.append("reviewer.decision is invalid")
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(reviewer.get("reviewedOn", ""))):
            errors.append("reviewer.reviewedOn must be an ISO date")
    if PLACEHOLDER.search(json.dumps(package, ensure_ascii=False)):
        errors.append("package contains placeholder text or an unresolved template token")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--package", required=True, type=Path)
    args = parser.parse_args()
    errors = validate(args.package)
    result = {
        "ok": not errors,
        "schemaId": SCHEMA_ID,
        "validatorId": VALIDATOR_ID,
        "package": str(args.package),
        "packageSha256": sha256(args.package) if args.package.is_file() else None,
        "errors": errors,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main())
