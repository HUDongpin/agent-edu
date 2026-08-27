#!/usr/bin/env python3
"""Course 19 offline CPU reference pipeline over the fixed synthetic fixtures."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import platform
import statistics
from pathlib import Path
from typing import Any

COURSE_ID = "machine-learning"
COURSE_VERSION = "2026.08.26-v1"
CAPSTONE_VERSION = "2026.08.26-capstone-v1"
VALIDATOR_ID = "aicourse.machine-learning.validator.v1"
SEED = 19019
ITERATIONS = 4000
LEARNING_RATE = 0.08
L2 = 0.01
THRESHOLD = 0.5
EXPECTED_HASHES = {
    "student-support-synthetic-v1.csv": "104c0a1892fcc4c69676043f1dee95c2c825515f8f4a5e61098f2b0df1d1ade9",
    "student-support-schema-v1.json": "ec3818aaa9ef790451921c523a9798a1ccd0c94e03288ef2beb1efb45f7bd6c8",
    "recommendation-events-synthetic-v1.json": "3935908841ea3a110f57bfcea61aa7f27558287f75f21bbce1144772607845fd",
}
FEATURE_ORDER = [
    "prior_score_z", "study_minutes_z", "practice_attempts_z", "late_submissions_z",
    "support_requested_yes", "cohort_lilac", "cohort_sand",
]
EXCLUDED_FIELDS = ["record_id", "learner_code", "partition"]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def canonical_hash(value: Any) -> str:
    encoded = json.dumps(value, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def artifact(artifact_id: str, content: dict[str, Any]) -> dict[str, Any]:
    return {"artifactId": artifact_id, "content": content}


def verify_inputs(course_dir: Path) -> list[dict[str, str]]:
    receipts = []
    for name, expected in EXPECTED_HASHES.items():
        path = course_dir / name
        observed = sha256(path)
        if observed != expected:
            raise ValueError(f"fixture checksum mismatch: {name}: {observed}")
        receipts.append({"path": name, "sha256": observed})
    return receipts


def parse_rows(course_dir: Path) -> list[dict[str, Any]]:
    schema = json.loads((course_dir / "student-support-schema-v1.json").read_text(encoding="utf-8"))
    fields = schema["fields"]
    names = [field["name"] for field in fields]
    with (course_dir / "student-support-synthetic-v1.csv").open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames != names:
            raise ValueError("CSV header does not match locked schema")
        raw_rows = list(reader)
    if len(raw_rows) != 30:
        raise ValueError(f"expected 30 rows, found {len(raw_rows)}")
    unique: dict[str, set[Any]] = {}
    rows = []
    for raw in raw_rows:
        row: dict[str, Any] = {}
        for spec in fields:
            name = spec["name"]
            value: Any = raw[name]
            constraints = spec.get("constraints", {})
            if spec["type"] == "integer":
                value = int(value)
            elif spec["type"] == "number":
                value = float(value)
            if constraints.get("required") and value == "":
                raise ValueError(f"required value missing: {name}")
            if "enum" in constraints and value not in constraints["enum"]:
                raise ValueError(f"invalid enum value for {name}: {value}")
            if "minimum" in constraints and value < constraints["minimum"]:
                raise ValueError(f"value below minimum for {name}: {value}")
            if "maximum" in constraints and value > constraints["maximum"]:
                raise ValueError(f"value above maximum for {name}: {value}")
            if constraints.get("unique"):
                seen = unique.setdefault(name, set())
                if value in seen:
                    raise ValueError(f"duplicate value for {name}: {value}")
                seen.add(value)
            row[name] = value
        rows.append(row)
    counts = {name: sum(row["partition"] == name for row in rows) for name in ("train", "validation", "holdout")}
    if counts != {"train": 20, "validation": 5, "holdout": 5}:
        raise ValueError(f"partition contract drift: {counts}")
    return rows


def fit_preprocessor(train: list[dict[str, Any]]) -> dict[str, dict[str, float]]:
    numeric = ["prior_score", "study_minutes", "practice_attempts", "late_submissions"]
    return {
        name: {
            "mean": statistics.fmean(float(row[name]) for row in train),
            "scale": statistics.pstdev(float(row[name]) for row in train) or 1.0,
        }
        for name in numeric
    }


def vectorize(row: dict[str, Any], state: dict[str, dict[str, float]]) -> list[float]:
    values = [
        (float(row[name]) - state[name]["mean"]) / state[name]["scale"]
        for name in ("prior_score", "study_minutes", "practice_attempts", "late_submissions")
    ]
    values.extend([
        1.0 if row["support_requested"] == "yes" else 0.0,
        1.0 if row["cohort"] == "lilac" else 0.0,
        1.0 if row["cohort"] == "sand" else 0.0,
    ])
    return values


def sigmoid(value: float) -> float:
    if value >= 0:
        inverse = math.exp(-value)
        return 1.0 / (1.0 + inverse)
    positive = math.exp(value)
    return positive / (1.0 + positive)


def fit_logistic(train: list[dict[str, Any]], state: dict[str, dict[str, float]]) -> list[float]:
    matrix = [vectorize(row, state) for row in train]
    targets = [int(row["completion_next_period"]) for row in train]
    weights = [0.0] * (len(FEATURE_ORDER) + 1)
    for _ in range(ITERATIONS):
        gradient = [0.0] * len(weights)
        for features, target in zip(matrix, targets):
            extended = [1.0, *features]
            prediction = sigmoid(sum(weight * value for weight, value in zip(weights, extended)))
            error = prediction - target
            for index, value in enumerate(extended):
                gradient[index] += error * value
        for index in range(len(weights)):
            penalty = 0.0 if index == 0 else L2 * weights[index]
            weights[index] -= LEARNING_RATE * (gradient[index] / len(train) + penalty)
    return weights


def predict(row: dict[str, Any], state: dict[str, dict[str, float]], weights: list[float]) -> float:
    features = [1.0, *vectorize(row, state)]
    return sigmoid(sum(weight * value for weight, value in zip(weights, features)))


def metric_bundle(records: list[dict[str, Any]]) -> dict[str, Any]:
    targets = [int(item["target"]) for item in records]
    scores = [float(item["score"]) for item in records]
    labels = [int(score >= THRESHOLD) for score in scores]
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


def predictions(rows: list[dict[str, Any]], state: dict[str, dict[str, float]], weights: list[float], partition: str) -> list[dict[str, Any]]:
    result = []
    for row in rows:
        if row["partition"] != partition:
            continue
        score = predict(row, state, weights)
        result.append({
            "record_id": row["record_id"], "partition": partition, "cohort": row["cohort"],
            "score": round(score, 10), "label": int(score >= THRESHOLD),
            "target": int(row["completion_next_period"]),
        })
    return result


def calibration_bins(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    bins = [(0.0, 0.34), (0.34, 0.67), (0.67, 1.0000001)]
    output = []
    for lower, upper in bins:
        group = [item for item in records if lower <= item["score"] < upper]
        if not group:
            continue
        output.append({
            "lower": lower, "upper": min(upper, 1.0), "count": len(group),
            "meanPrediction": round(statistics.fmean(item["score"] for item in group), 6),
            "observedRate": round(statistics.fmean(item["target"] for item in group), 6),
        })
    return output


def recommender_audit(course_dir: Path) -> dict[str, Any]:
    data = json.loads((course_dir / "recommendation-events-synthetic-v1.json").read_text(encoding="utf-8"))
    events = data["events"]
    if len(events) != 14 or not all(event.get("exposed") is True for event in events):
        raise ValueError("recommendation event contract drift")
    exposed_pairs = {(event["user"], event["item"]) for event in events}
    return {
        "users": len(data["users"]), "items": len(data["items"]), "events": len(events),
        "observedExposedPairs": len(exposed_pairs),
        "unobservedUserItemPairs": len(data["users"]) * len(data["items"]) - len(exposed_pairs),
        "boundary": "Missing interactions are not negative preferences; no recommendation is deployed.",
    }


def build_submission(course_dir: Path, output_dir: Path) -> dict[str, Any]:
    input_receipts = verify_inputs(course_dir)
    rows = parse_rows(course_dir)
    train = [row for row in rows if row["partition"] == "train"]
    validation = [row for row in rows if row["partition"] == "validation"]
    holdout = [row for row in rows if row["partition"] == "holdout"]
    state = fit_preprocessor(train)
    weights = fit_logistic(train, state)
    validation_predictions = predictions(validation, state, weights, "validation")
    validation_metrics = metric_bundle(validation_predictions)
    train_prevalence = statistics.fmean(int(row["completion_next_period"]) for row in train)
    baseline_validation = [
        {"target": int(row["completion_next_period"]), "score": train_prevalence}
        for row in validation
    ]
    baseline_metrics = metric_bundle(baseline_validation)
    selected = "stdlib-logistic" if validation_metrics["brier"] < baseline_metrics["brier"] else "train-prevalence"
    # The model selection is frozen above. The holdout is evaluated exactly once below.
    if selected == "stdlib-logistic":
        holdout_predictions = predictions(holdout, state, weights, "holdout")
    else:
        holdout_predictions = [
            {"record_id": row["record_id"], "partition": "holdout", "cohort": row["cohort"],
             "score": round(train_prevalence, 10), "label": int(train_prevalence >= THRESHOLD),
             "target": int(row["completion_next_period"])}
            for row in holdout
        ]
    holdout_metrics = metric_bundle(holdout_predictions)
    output_dir.mkdir(parents=True, exist_ok=True)
    prediction_path = output_dir / "predictions.json"
    prediction_path.write_text(json.dumps(validation_predictions + holdout_predictions, indent=2) + "\n", encoding="utf-8")
    model_record = {
        "algorithm": "binary logistic regression with batch gradient descent",
        "weights": [round(weight, 12) for weight in weights],
        "preprocessor": {name: {key: round(value, 12) for key, value in values.items()} for name, values in state.items()},
        "featureOrder": FEATURE_ORDER,
        "iterations": ITERATIONS, "learningRate": LEARNING_RATE, "l2": L2,
    }
    model_path = output_dir / "model-record.json"
    model_path.write_text(json.dumps(model_record, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    subgroup_groups = []
    for cohort in ("jade", "lilac", "sand"):
        group = [item for item in holdout_predictions if item["cohort"] == cohort]
        subgroup_groups.append({"cohort": cohort, "metrics": metric_bundle(group)})
    environment_lock = Path(__file__).resolve().parent / "environment.lock.json"
    return {
        "schemaVersion": "aicourse.capstone-submission.v1", "courseId": COURSE_ID,
        "courseVersion": COURSE_VERSION, "capstoneVersion": CAPSTONE_VERSION,
        "validatorId": VALIDATOR_ID, "generatedOn": "2026-08-26",
        "artifacts": [
            artifact("problem-split-contract", {
                "task": "Estimate a fictional next-period completion label for metric mechanics only",
                "outcome": "completion_next_period", "positiveClass": 1,
                "partitionCounts": {"train": len(train), "validation": len(validation), "holdout": len(holdout)},
                "partitionSource": "locked fixture partition column", "prohibitedFeatures": EXCLUDED_FIELDS,
                "holdoutPolicy": "open exactly once after model family and selection rule are frozen",
                "consequentialUse": "prohibited",
            }),
            artifact("baseline-experiment", {
                "baseline": "train-prevalence", "trainPrevalence": round(train_prevalence, 6),
                "validationMetrics": baseline_metrics,
                "limitations": ["tiny synthetic sample", "no population prevalence", "no causal or intervention meaning"],
            }),
            artifact("reproducible-pipeline", {
                "pythonVersion": platform.python_version(), "runtime": "stdlib-only", "networkRequired": False,
                "seed": SEED, "iterations": ITERATIONS, "learningRate": LEARNING_RATE, "l2": L2,
                "featureOrder": FEATURE_ORDER, "excludedFields": EXCLUDED_FIELDS,
                "fitScope": "preprocessor and model fit on train only",
                "inputReceipts": input_receipts,
                "environmentLockSha256": sha256(environment_lock),
                "predictionReceipt": {"path": prediction_path.name, "sha256": sha256(prediction_path)},
                "modelReceipt": {"path": model_path.name, "sha256": sha256(model_path), "canonicalStateSha256": canonical_hash(model_record)},
                "recommenderBoundaryAudit": recommender_audit(course_dir),
            }),
            artifact("model-comparison", {
                "selectionPartition": "validation", "metric": "brier", "tieRule": "prefer train-prevalence baseline",
                "candidates": [
                    {"id": "train-prevalence", "validationMetrics": baseline_metrics},
                    {"id": "stdlib-logistic", "validationMetrics": validation_metrics},
                ],
                "selected": selected, "selectionFrozenBeforeHoldout": True,
                "claimBoundary": "Comparison describes only the fixed fictional validation rows.",
            }),
            artifact("metrics-calibration", {
                "thresholdPurpose": "illustrative-only", "threshold": THRESHOLD,
                "validation": validation_metrics, "holdout": holdout_metrics,
                "calibrationBins": calibration_bins(holdout_predictions),
                "holdoutOpenedOnce": True,
                "decisionBoundary": "No metric or threshold triggers support, discipline, ranking, or review.",
            }),
            artifact("subgroup-error-audit", {
                "partition": "holdout", "groupField": "cohort", "groups": subgroup_groups,
                "minimumGroupWarning": "Each invented cohort has only one or two holdout rows; rates are mechanics, not fairness evidence.",
                "fairnessClaim": "none", "actionAuthority": "human review is mandatory and no action is authorized",
            }),
            artifact("model-card", {
                "modelName": "Course 19 stdlib logistic teaching baseline",
                "intendedUse": "Offline reproduction of split, baseline, calibration, and error-audit mechanics on fictional data",
                "outOfScopeUses": ["real learner prediction", "ranking", "triage", "support allocation", "discipline", "automated decisions"],
                "trainingData": "20 locked fictional train rows", "evaluationData": "5 validation and 5 one-shot holdout fictional rows",
                "limitations": ["hand-authored patterns", "tiny partitions", "fictional cohort labels", "no external validity", "no fairness evidence"],
                "humanAuthority": "A qualified human retains authority, appeal, override, and stop control; this artifact authorizes no action.",
            }),
            artifact("no-deploy-review", {
                "decision": "no-deploy",
                "reasons": ["fixture is fictional", "sample is too small", "label has no validated construct", "no population or intervention evidence", "no operational governance review"],
                "prohibitedActions": ["discipline", "ranking", "triage", "support allocation", "profiling", "automated outreach"],
                "humanAuthority": "No prediction may bypass prior human approval, override, stop, escalation, and appeal.",
                "expiry": "Any fixture, schema, feature, label, metric, threshold, or policy change invalidates this review.",
                "reviewer": {"role": "course-pack automated preflight", "decision": "no-deploy", "humanReviewRequiredBeforeSubmission": True},
            }),
        ],
    }


def write_submission(submission: dict[str, Any], output_dir: Path) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    path = output_dir / "submission.generated.json"
    path.write_text(json.dumps(submission, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--course-dir", type=Path, default=Path(__file__).resolve().parent.parent)
    parser.add_argument("--output-dir", type=Path, default=Path("work"))
    args = parser.parse_args()
    output_dir = args.output_dir.resolve()
    path = write_submission(build_submission(args.course_dir.resolve(), output_dir), output_dir)
    print(path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
