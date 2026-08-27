#!/usr/bin/env python3
"""Fail-closed validator for the Course 18 capstone dossier."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import random
import re
import statistics
from pathlib import Path
from typing import Any

COURSE_ID = "ai-python-data"
COURSE_VERSION = "2026.08.26-v1"
CAPSTONE_VERSION = "2026.08.26-capstone-v1"
VALIDATOR_ID = "aicourse.ai-python-data.validator.v1"
SCHEMA_ID = "aicourse.ai-python-data.capstone.v1"
ARTIFACT_IDS = [
    "environment-receipt", "executable-notebook", "data-dictionary", "cleaning-ledger",
    "validation-report", "statistical-note", "visual-report", "provenance-manifest",
]
INPUT_HASHES = {
    "education-outcomes-synthetic-v1.csv": "3ec62e24548576c6f6c69470b3a5ae524cec1d248b47cce0d9b0e3f48c337349",
    "education-outcomes-schema-v1.json": "45726eeb0524cba1555ee697bd1fdeaf9879634a7b2b608ac0fbf257adb51b08",
    "cohort-lookup-synthetic-v1.json": "91768ca56526db1c05e8a5e33f59bf1559c90a5f044c34df900698567cf0be17",
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def is_sha256(value: Any) -> bool:
    return isinstance(value, str) and bool(re.fullmatch(r"[0-9a-f]{64}", value))


def bootstrap_mean(values: list[float], seed: int, draws: int = 2000) -> list[float]:
    rng = random.Random(seed)
    means = []
    for _ in range(draws):
        sample = [values[rng.randrange(len(values))] for _ in values]
        means.append(statistics.fmean(sample))
    means.sort()
    return [round(means[int(draws * 0.025)], 4), round(means[int(draws * 0.975) - 1], 4)]


def validate_submission(path: Path | str) -> list[str]:
    submission_path = Path(path).resolve()
    lab_dir = Path(__file__).resolve().parent
    course_dir = lab_dir.parent
    issues: list[str] = []
    try:
        data = json.loads(submission_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        return [f"submission is unreadable JSON: {error}"]
    try:
        schema = json.loads((lab_dir / "capstone.schema.json").read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        return [f"locked capstone schema is unreadable: {error}"]
    expected_top = {
        "schemaVersion": "aicourse.capstone-submission.v1", "courseId": COURSE_ID,
        "courseVersion": COURSE_VERSION, "capstoneVersion": CAPSTONE_VERSION,
        "validatorId": VALIDATOR_ID,
    }
    for key, expected in expected_top.items():
        if data.get(key) != expected:
            issues.append(f"{key} must equal {expected!r}")
    if schema.get("x-schemaId") != SCHEMA_ID or schema.get("x-validatorId") != VALIDATOR_ID or schema.get("x-artifactIds") != ARTIFACT_IDS:
        issues.append("capstone.schema.json validator/artifact contract drift")
    if not isinstance(data.get("generatedOn"), str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", data["generatedOn"]):
        issues.append("generatedOn must be an ISO date")
    artifacts = data.get("artifacts")
    if not isinstance(artifacts, list):
        return issues + ["artifacts must be an array"]
    observed_ids = [item.get("artifactId") for item in artifacts if isinstance(item, dict)]
    if observed_ids != ARTIFACT_IDS:
        issues.append(f"artifact IDs/order must equal {ARTIFACT_IDS!r}")
    if len(artifacts) != len(ARTIFACT_IDS) or any(not isinstance(item, dict) or not isinstance(item.get("content"), dict) for item in artifacts):
        return issues + ["each required artifact must have an object content value"]
    by_id = {item["artifactId"]: item["content"] for item in artifacts if item.get("artifactId") in ARTIFACT_IDS}
    if len(by_id) != len(ARTIFACT_IDS):
        return issues + ["artifact IDs must be unique and complete"]

    environment = by_id["environment-receipt"]
    if environment.get("runtime") != "stdlib-only" or environment.get("networkRequired") is not False or environment.get("seed") != 18019:
        issues.append("environment receipt must bind stdlib-only, network=false, and seed=18019")
    inputs = environment.get("inputs")
    input_map = {item.get("path"): item.get("sha256") for item in inputs} if isinstance(inputs, list) else {}
    if input_map != INPUT_HASHES:
        issues.append("environment input hashes do not match the locked fixture")
    for name, expected in INPUT_HASHES.items():
        local_path = course_dir / name
        if not local_path.is_file() or sha256(local_path) != expected:
            issues.append(f"local fixture mismatch: {name}")
    with (course_dir / "education-outcomes-synthetic-v1.csv").open(newline="", encoding="utf-8") as handle:
        fixture_rows = list(csv.DictReader(handle))
    fixture_schema = json.loads((course_dir / "education-outcomes-schema-v1.json").read_text(encoding="utf-8"))
    if environment.get("dependencyLockSha256") != sha256(lab_dir / "environment.lock.json"):
        issues.append("environment lock hash mismatch")

    notebook = by_id["executable-notebook"]
    if notebook.get("path") != "audit.ipynb" or notebook.get("sha256") != sha256(lab_dir / "audit.ipynb"):
        issues.append("notebook path/hash mismatch")
    if notebook.get("codeCellCount") != 2 or notebook.get("cleanRun") is not True:
        issues.append("notebook must record two code cells and a clean run")

    dictionary = by_id["data-dictionary"]
    if dictionary.get("primaryKey") != ["record_id"] or dictionary.get("rowCount") != 18:
        issues.append("data dictionary must bind record_id and all 18 fixture rows")
    if dictionary.get("fields") != [field["name"] for field in fixture_schema["fields"]] or set(dictionary.get("joinedFields", [])) != {"delivery_format", "planned_minutes"}:
        issues.append("data dictionary field/join contract is incomplete")
    if "real person" not in str(dictionary.get("syntheticBoundary", "")):
        issues.append("data dictionary must state the synthetic-person boundary")

    cleaning = by_id["cleaning-ledger"]
    if cleaning.get("inputRows") != 18 or cleaning.get("outputRows") != 18 or cleaning.get("imputationPerformed") is not False:
        issues.append("cleaning ledger must reconcile 18 rows without imputation")
    if cleaning.get("missingness") != {"study_minutes": 2, "checkpoint_score": 2}:
        issues.append("cleaning ledger missingness counts drifted")
    if len(cleaning.get("rules", [])) < 4 or not cleaning.get("unresolved"):
        issues.append("cleaning rules and unresolved missingness must remain visible")

    report = by_id["validation-report"]
    required_checks = {"input-sha256", "schema-fields", "primary-key", "range-enum", "join-cardinality", "row-reconciliation"}
    checks = report.get("checks", [])
    passed = {item.get("id") for item in checks if isinstance(item, dict) and item.get("status") == "pass"}
    if report.get("validatorId") != VALIDATOR_ID or report.get("failures") != 0 or not required_checks.issubset(passed):
        issues.append("validation report lacks required passing checks")
    if report.get("negativeMutationTested") is not True:
        issues.append("negative mutation must be recorded")

    note = by_id["statistical-note"]
    if note.get("sampleSize") != 18 or note.get("denominator") != 18 or note.get("seed") != 18019:
        issues.append("statistical note sample/seed contract drifted")
    statistics_value = note.get("statistics", {})
    if statistics_value.get("completeCount") != 11 or statistics_value.get("studyMinutesObserved") != 16:
        issues.append("statistical note does not reproduce locked fixture counts")
    study_values = [float(row["study_minutes"]) for row in fixture_rows if row["study_minutes"]]
    if statistics_value.get("studyMinutesMean") != round(statistics.fmean(study_values), 4) or statistics_value.get("studyMinutesMedian") != round(statistics.median(study_values), 4):
        issues.append("statistical mean/median do not reproduce the locked fixture")
    interval = note.get("bootstrapInterval")
    if interval != bootstrap_mean(study_values, 18019):
        issues.append("statistical bootstrap interval does not reproduce the locked seed and fixture")
    if len(note.get("limitations", [])) < 4:
        issues.append("statistical limitations are incomplete")

    visual = by_id["visual-report"]
    visual_path = submission_path.parent / str(visual.get("path", ""))
    if visual.get("path") != "cohort-completion.svg" or visual.get("denominator") != 18 or len(str(visual.get("altText", ""))) < 60 or len(str(visual.get("misleadingAlternativeDiagnosis", ""))) < 40:
        issues.append("visual report lacks denominator, alt text, or misleading-chart diagnosis")
    if not visual_path.is_file() or not is_sha256(visual.get("sha256")) or (visual_path.is_file() and sha256(visual_path) != visual.get("sha256")):
        issues.append("visual report file/hash mismatch")

    provenance = by_id["provenance-manifest"]
    if {item.get("path"): item.get("sha256") for item in provenance.get("inputs", [])} != INPUT_HASHES:
        issues.append("provenance inputs do not match locked fixture")
    output_records = provenance.get("outputs", [])
    for record in output_records:
        output_path = submission_path.parent / str(record.get("path", ""))
        if not output_path.is_file() or not is_sha256(record.get("sha256")) or (output_path.is_file() and sha256(output_path) != record.get("sha256")):
            issues.append(f"provenance output file/hash mismatch: {record.get('path')}")
    if [record.get("path") for record in output_records] != ["validated-rows.json", "cohort-summary.csv", "cohort-completion.svg"] or len(provenance.get("transformations", [])) < 5 or "CC0-1.0" not in str(provenance.get("licence", "")):
        issues.append("provenance transformation/licence inventory is incomplete")
    summary_path = submission_path.parent / "cohort-summary.csv"
    if summary_path.is_file():
        with summary_path.open(newline="", encoding="utf-8") as handle:
            summary_rows = list(csv.DictReader(handle))
        if [row.get("cohort") for row in summary_rows] != ["amber", "blue", "coral"] or any(row.get("records") != "6" for row in summary_rows):
            issues.append("cohort summary does not reconcile the locked fixture")
    if len(provenance.get("nonClaims", [])) < 4 or provenance.get("review", {}).get("decision") != "no-deploy" or provenance.get("review", {}).get("humanReviewRequiredBeforeSubmission") is not True:
        issues.append("provenance must retain non-claims, no-deploy, and human-review requirement")
    return issues


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("submission", nargs="?", type=Path)
    parser.add_argument("--package", dest="package_path", type=Path)
    args = parser.parse_args()
    package_path = args.package_path or args.submission
    if package_path is None:
        parser.error("provide --package <artifact-package.json>")
    issues = validate_submission(package_path)
    if issues:
        print(f"{VALIDATOR_ID}: FAIL ({len(issues)} issue(s))")
        for issue in issues:
            print(f"- {issue}")
        return 1
    print(f"{VALIDATOR_ID}: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
