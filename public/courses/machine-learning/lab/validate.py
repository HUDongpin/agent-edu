#!/usr/bin/env python3
"""Fail-closed validator for the Course 19 model capstone dossier."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import re
import statistics
from pathlib import Path
from typing import Any

COURSE_ID = "machine-learning"
COURSE_VERSION = "2026.08.26-v1"
CAPSTONE_VERSION = "2026.08.26-capstone-v1"
VALIDATOR_ID = "aicourse.machine-learning.validator.v1"
SCHEMA_ID = "aicourse.machine-learning.capstone.v1"
ARTIFACT_IDS = [
    "problem-split-contract", "baseline-experiment", "reproducible-pipeline", "model-comparison",
    "metrics-calibration", "subgroup-error-audit", "model-card", "no-deploy-review",
]
INPUT_HASHES = {
    "student-support-synthetic-v1.csv": "104c0a1892fcc4c69676043f1dee95c2c825515f8f4a5e61098f2b0df1d1ade9",
    "student-support-schema-v1.json": "ec3818aaa9ef790451921c523a9798a1ccd0c94e03288ef2beb1efb45f7bd6c8",
    "recommendation-events-synthetic-v1.json": "3935908841ea3a110f57bfcea61aa7f27558287f75f21bbce1144772607845fd",
}
FEATURE_ORDER = ["prior_score_z", "study_minutes_z", "practice_attempts_z", "late_submissions_z", "support_requested_yes", "cohort_lilac", "cohort_sand"]
EXCLUDED_FIELDS = ["record_id", "learner_code", "partition"]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def canonical_hash(value: Any) -> str:
    encoded = json.dumps(value, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def is_sha256(value: Any) -> bool:
    return isinstance(value, str) and bool(re.fullmatch(r"[0-9a-f]{64}", value))


def metric_bundle(records: list[dict[str, Any]], threshold: float = 0.5) -> dict[str, Any]:
    targets = [int(item["target"]) for item in records]
    scores = [float(item["score"]) for item in records]
    labels = [int(score >= threshold) for score in scores]
    tp = sum(label == 1 and target == 1 for label, target in zip(labels, targets))
    tn = sum(label == 0 and target == 0 for label, target in zip(labels, targets))
    fp = sum(label == 1 and target == 0 for label, target in zip(labels, targets))
    fn = sum(label == 0 and target == 1 for label, target in zip(labels, targets))
    safe = lambda numerator, denominator: round(numerator / denominator, 6) if denominator else None
    clipped = [min(max(score, 1e-12), 1 - 1e-12) for score in scores]
    return {
        "n": len(records), "positives": sum(targets), "negatives": len(targets) - sum(targets),
        "brier": round(statistics.fmean((score - target) ** 2 for score, target in zip(scores, targets)), 6),
        "logLoss": round(-statistics.fmean(target * math.log(score) + (1 - target) * math.log(1 - score) for score, target in zip(clipped, targets)), 6),
        "accuracy": safe(tp + tn, len(records)), "precision": safe(tp, tp + fp),
        "recall": safe(tp, tp + fn), "specificity": safe(tn, tn + fp),
        "confusion": {"tp": tp, "tn": tn, "fp": fp, "fn": fn},
    }


def sigmoid(value: float) -> float:
    if value >= 0:
        inverse = math.exp(-value)
        return 1.0 / (1.0 + inverse)
    positive = math.exp(value)
    return positive / (1.0 + positive)


def model_score(row: dict[str, str], model_record: dict[str, Any]) -> float:
    state = model_record["preprocessor"]
    features = [
        (float(row[name]) - float(state[name]["mean"])) / float(state[name]["scale"])
        for name in ("prior_score", "study_minutes", "practice_attempts", "late_submissions")
    ]
    features.extend([
        1.0 if row["support_requested"] == "yes" else 0.0,
        1.0 if row["cohort"] == "lilac" else 0.0,
        1.0 if row["cohort"] == "sand" else 0.0,
    ])
    weights = [float(value) for value in model_record["weights"]]
    return sigmoid(sum(weight * value for weight, value in zip(weights, [1.0, *features])))


def validate_submission(path: Path | str) -> list[str]:
    submission_path = Path(path).resolve()
    lab_dir = Path(__file__).resolve().parent
    course_dir = lab_dir.parent
    issues: list[str] = []
    try:
        data = json.loads(submission_path.read_text(encoding="utf-8"))
        schema = json.loads((lab_dir / "capstone.schema.json").read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        return [f"submission/schema is unreadable JSON: {error}"]
    for key, expected in {
        "schemaVersion": "aicourse.capstone-submission.v1", "courseId": COURSE_ID,
        "courseVersion": COURSE_VERSION, "capstoneVersion": CAPSTONE_VERSION,
        "validatorId": VALIDATOR_ID,
    }.items():
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

    with (course_dir / "student-support-synthetic-v1.csv").open(newline="", encoding="utf-8") as handle:
        fixture_rows = list(csv.DictReader(handle))
    fixture_by_id = {row["record_id"]: row for row in fixture_rows}
    expected_partition_counts = {name: sum(row["partition"] == name for row in fixture_rows) for name in ("train", "validation", "holdout")}
    for name, expected in INPUT_HASHES.items():
        local_path = course_dir / name
        if not local_path.is_file() or sha256(local_path) != expected:
            issues.append(f"local fixture mismatch: {name}")

    split = by_id["problem-split-contract"]
    if split.get("outcome") != "completion_next_period" or split.get("positiveClass") != 1:
        issues.append("problem contract outcome/positive class drifted")
    if split.get("partitionCounts") != expected_partition_counts or split.get("partitionSource") != "locked fixture partition column":
        issues.append("split contract must preserve the locked 20/5/5 fixture partition")
    if split.get("prohibitedFeatures") != EXCLUDED_FIELDS or split.get("consequentialUse") != "prohibited" or "exactly once" not in str(split.get("holdoutPolicy", "")):
        issues.append("split contract does not prohibit identifiers/consequential use or protect holdout")

    baseline = by_id["baseline-experiment"]
    train_targets = [int(row["completion_next_period"]) for row in fixture_rows if row["partition"] == "train"]
    expected_prevalence = round(statistics.fmean(train_targets), 6)
    baseline_validation_rows = [{"target": int(row["completion_next_period"]), "score": expected_prevalence} for row in fixture_rows if row["partition"] == "validation"]
    if baseline.get("baseline") != "train-prevalence" or baseline.get("trainPrevalence") != expected_prevalence:
        issues.append("baseline must be derived from training prevalence only")
    if baseline.get("validationMetrics") != metric_bundle(baseline_validation_rows) or len(baseline.get("limitations", [])) < 3:
        issues.append("baseline metrics/limitations do not reproduce the frozen validation set")

    pipeline = by_id["reproducible-pipeline"]
    if pipeline.get("runtime") != "stdlib-only" or pipeline.get("networkRequired") is not False or pipeline.get("seed") != 19019 or pipeline.get("iterations") != 4000:
        issues.append("pipeline must be offline stdlib-only with the locked seed/iterations")
    if pipeline.get("featureOrder") != FEATURE_ORDER or pipeline.get("excludedFields") != EXCLUDED_FIELDS or pipeline.get("fitScope") != "preprocessor and model fit on train only":
        issues.append("pipeline feature/exclusion/fit-scope contract drifted")
    input_map = {item.get("path"): item.get("sha256") for item in pipeline.get("inputReceipts", [])}
    if input_map != INPUT_HASHES:
        issues.append("pipeline input hashes do not match the locked fixtures")
    if pipeline.get("environmentLockSha256") != sha256(lab_dir / "environment.lock.json"):
        issues.append("pipeline environment lock hash mismatch")
    recommender = pipeline.get("recommenderBoundaryAudit", {})
    if recommender.get("users") != 6 or recommender.get("items") != 6 or recommender.get("events") != 14 or "not negative" not in str(recommender.get("boundary", "")):
        issues.append("recommender boundary audit does not reproduce the synthetic event fixture")

    prediction_receipt = pipeline.get("predictionReceipt", {})
    prediction_path = submission_path.parent / str(prediction_receipt.get("path", ""))
    if not prediction_path.is_file() or not is_sha256(prediction_receipt.get("sha256")) or (prediction_path.is_file() and sha256(prediction_path) != prediction_receipt.get("sha256")):
        issues.append("prediction file/hash mismatch")
        predictions: list[dict[str, Any]] = []
    else:
        try:
            predictions = json.loads(prediction_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            predictions = []
            issues.append("prediction file is not valid JSON")
    model_receipt = pipeline.get("modelReceipt", {})
    model_path = submission_path.parent / str(model_receipt.get("path", ""))
    model_record: dict[str, Any] = {}
    if not model_path.is_file() or not is_sha256(model_receipt.get("sha256")) or (model_path.is_file() and sha256(model_path) != model_receipt.get("sha256")):
        issues.append("model record file/hash mismatch")
    elif model_path.is_file():
        try:
            model_record = json.loads(model_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            model_record = {}
            issues.append("model record is not valid JSON")
        if model_record.get("featureOrder") != FEATURE_ORDER or model_record.get("iterations") != 4000 or model_record.get("algorithm") != "binary logistic regression with batch gradient descent":
            issues.append("model record algorithm/feature/iteration contract drifted")
        if model_receipt.get("canonicalStateSha256") != canonical_hash(model_record):
            issues.append("model canonical-state hash mismatch")
    if len(predictions) != 10 or {item.get("partition") for item in predictions} != {"validation", "holdout"}:
        issues.append("predictions must contain exactly five validation and five holdout records")
    else:
        if len({item.get("record_id") for item in predictions}) != 10:
            issues.append("prediction record IDs must be unique")
        for item in predictions:
            source = fixture_by_id.get(item.get("record_id"))
            if source is None or source["partition"] != item.get("partition") or source["cohort"] != item.get("cohort") or int(source["completion_next_period"]) != item.get("target"):
                issues.append(f"prediction/source binding mismatch: {item.get('record_id')}")
            if not isinstance(item.get("score"), (int, float)) or not 0 <= item["score"] <= 1 or item.get("label") != int(item["score"] >= 0.5):
                issues.append(f"invalid prediction score/label: {item.get('record_id')}")
    validation_predictions = [item for item in predictions if item.get("partition") == "validation"]
    holdout_predictions = [item for item in predictions if item.get("partition") == "holdout"]

    comparison = by_id["model-comparison"]
    if comparison.get("selectionPartition") != "validation" or comparison.get("metric") != "brier" or comparison.get("selectionFrozenBeforeHoldout") is not True:
        issues.append("model comparison must select on validation Brier before holdout")
    candidates = comparison.get("candidates", [])
    candidate_map = {item.get("id"): item.get("validationMetrics") for item in candidates if isinstance(item, dict)}
    recomputed_logistic_validation = metric_bundle(validation_predictions) if len(validation_predictions) == 5 else None
    if set(candidate_map) != {"train-prevalence", "stdlib-logistic"} or candidate_map.get("train-prevalence") != baseline.get("validationMetrics") or candidate_map.get("stdlib-logistic") != recomputed_logistic_validation:
        issues.append("model comparison candidates/baseline drifted")
    expected_selected = "stdlib-logistic" if candidate_map.get("stdlib-logistic", {}).get("brier", float("inf")) < candidate_map.get("train-prevalence", {}).get("brier", float("inf")) else "train-prevalence"
    if comparison.get("selected") != expected_selected:
        issues.append("model selection does not follow the frozen Brier/tie rule")
    if model_record and len(predictions) == 10:
        for item in predictions:
            source = fixture_by_id[item["record_id"]]
            expected_score = model_score(source, model_record) if item["partition"] == "validation" or expected_selected == "stdlib-logistic" else expected_prevalence
            if abs(float(item["score"]) - expected_score) > 1e-9:
                issues.append(f"prediction does not reproduce the locked model/baseline: {item['record_id']}")

    metrics = by_id["metrics-calibration"]
    if len(validation_predictions) == 5 and metrics.get("validation") != metric_bundle(validation_predictions):
        issues.append("validation metrics do not reconcile with predictions")
    if len(holdout_predictions) == 5 and metrics.get("holdout") != metric_bundle(holdout_predictions):
        issues.append("holdout metrics do not reconcile with predictions")
    if metrics.get("thresholdPurpose") != "illustrative-only" or metrics.get("threshold") != 0.5 or metrics.get("holdoutOpenedOnce") is not True or "No metric" not in str(metrics.get("decisionBoundary", "")):
        issues.append("threshold/holdout/human-decision boundary drifted")
    if sum(item.get("count", 0) for item in metrics.get("calibrationBins", [])) != 5:
        issues.append("calibration bins must reconcile all five holdout rows")

    subgroup = by_id["subgroup-error-audit"]
    groups = subgroup.get("groups", [])
    if subgroup.get("partition") != "holdout" or subgroup.get("groupField") != "cohort" or subgroup.get("fairnessClaim") != "none":
        issues.append("subgroup audit must stay on holdout and make no fairness claim")
    if [item.get("cohort") for item in groups] != ["jade", "lilac", "sand"] or sum(item.get("metrics", {}).get("n", 0) for item in groups) != 5:
        issues.append("subgroup audit does not reconcile the five holdout rows")
    if "one or two" not in str(subgroup.get("minimumGroupWarning", "")) or "human" not in str(subgroup.get("actionAuthority", "")).lower():
        issues.append("subgroup small-n and human-authority boundaries are missing")

    model_card = by_id["model-card"]
    required_out_of_scope = {"real learner prediction", "ranking", "triage", "support allocation", "discipline", "automated decisions"}
    if not required_out_of_scope.issubset(set(model_card.get("outOfScopeUses", []))) or len(model_card.get("limitations", [])) < 5:
        issues.append("model card out-of-scope uses/limitations are incomplete")
    if "appeal" not in str(model_card.get("humanAuthority", "")).lower() or "authorizes no action" not in str(model_card.get("humanAuthority", "")):
        issues.append("model card must preserve appeal and deny action authority")

    review = by_id["no-deploy-review"]
    required_actions = {"discipline", "ranking", "triage", "support allocation", "profiling", "automated outreach"}
    if review.get("decision") != "no-deploy" or len(review.get("reasons", [])) < 5 or not required_actions.issubset(set(review.get("prohibitedActions", []))):
        issues.append("no-deploy decision/reasons/prohibited actions are incomplete")
    if not all(word in str(review.get("humanAuthority", "")).lower() for word in ("approval", "override", "stop", "appeal")):
        issues.append("no-deploy review must preserve approval, override, stop, and appeal")
    if "invalidates" not in str(review.get("expiry", "")) or review.get("reviewer", {}).get("decision") != "no-deploy" or review.get("reviewer", {}).get("humanReviewRequiredBeforeSubmission") is not True:
        issues.append("no-deploy expiry/reviewer contract is incomplete")
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
