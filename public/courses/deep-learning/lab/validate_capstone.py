#!/usr/bin/env python3
"""Fail-closed semantic validator for Course 20 learner-final evidence.

Passing establishes an internally reviewable package. It does not authenticate
the reviewer, certify the science, or grant train/deploy authority. When
``--receipt-dir`` is supplied, the validator emits one browser-compatible
receipt for each exact, content-hashed capstone artifact only after the complete
package passes.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
import shlex
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Mapping, Sequence, Tuple


SCHEMA_VERSION = "aicourse.deep-learning.capstone.v2"
COURSE_ID = "deep-learning"
COURSE_VERSION = "2026.08.28-v2"
CAPSTONE_VERSION = "2026.08.28-capstone-v2"
VALIDATOR_ID = "aicourse.deep-learning.validator.v2"
ARTIFACT_IDS = [
    "environment-lock", "run-ledger", "failure-ledger", "resource-record",
    "evaluation-slices", "training-dossier", "limitations", "reviewer-decision",
]
REVIEWED_ARTIFACT_IDS = ARTIFACT_IDS[:-1]
LINKED_DOSSIER_ARTIFACT_IDS = [
    "run-ledger", "failure-ledger", "resource-record", "evaluation-slices",
]
REQUIRED_SLICE_TYPES = {
    "clean", "corruption", "held-out-length", "synthetic-subgroup",
    "calibration", "error-analysis",
}
REQUIRED_NEGATIVE_CASES = {
    "causal-mask-leakage": "transformer-leakage-test",
    "unicode-normalization-round-trip": "tokenisation-provenance-audit",
    "tokenizer-version-drift": "tokenisation-provenance-audit",
    "lora-merge-equivalence": "adaptation-lifecycle-audit",
}
COMMON_RUN_MODULE_ARTIFACTS = {
    "training-state-receipt", "optimisation-ablation-report",
}
MODEL_MODULE_ARTIFACTS = {
    "transformer": {
        "transformer-leakage-test", "tokenisation-provenance-audit",
        "adaptation-lifecycle-audit",
    },
    "rnn": {"sequence-state-mask-audit"},
    "simple-baseline": {"tensor-graph-ledger"},
}
PLACEHOLDER_RE = re.compile(r"^(?:replace(?:_with.*)?|todo|tbd|placeholder)$", re.IGNORECASE)
OFFSET_TIMESTAMP_RE = re.compile(r"^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$")
STABLE_ID_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def canonical_content_hash(value: Mapping[str, Any]) -> str:
    encoded = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def is_sha256(value: Any) -> bool:
    return (
        isinstance(value, str)
        and bool(re.fullmatch(r"[0-9a-f]{64}", value))
        and len(set(value)) > 1
        and value != "deadbeef" * 8
    )


def nonempty(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def meaningful(value: Any) -> bool:
    return nonempty(value) and not PLACEHOLDER_RE.search(value.strip())


def is_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def parse_offset_timestamp(value: Any) -> datetime | None:
    if not isinstance(value, str) or not OFFSET_TIMESTAMP_RE.fullmatch(value):
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        return None
    return parsed


def is_safe_relative_path(value: Any) -> bool:
    if not isinstance(value, str) or not value or len(value) > 500:
        return False
    if value.startswith(("/", "\\")) or "\\" in value:
        return False
    return ".." not in value.split("/")


def exact_keys(value: Mapping[str, Any], required: Iterable[str], label: str, issues: List[str], optional: Iterable[str] = ()) -> None:
    required_set = set(required)
    allowed = required_set | set(optional)
    observed = set(value)
    missing = sorted(required_set - observed)
    unexpected = sorted(observed - allowed)
    if missing:
        issues.append(f"{label} is missing fields: {', '.join(missing)}")
    if unexpected:
        issues.append(f"{label} has unexpected fields: {', '.join(unexpected)}")


def require_string_list(value: Any, label: str, issues: List[str], minimum: int = 1) -> List[str]:
    if (
        not isinstance(value, list)
        or len(value) < minimum
        or any(not meaningful(item) for item in value)
        or len(set(value)) != len(value)
    ):
        issues.append(f"{label} must contain at least {minimum} unique, meaningful string(s)")
        return []
    return value


def validate_hash_map(value: Any, label: str, issues: List[str], expected_ids: Iterable[str] | None = None) -> Dict[str, str]:
    if not isinstance(value, dict):
        issues.append(f"{label} must be an artifact-ID to SHA-256 object")
        return {}
    if expected_ids is not None and set(value) != set(expected_ids):
        issues.append(f"{label} must contain exactly {sorted(expected_ids)!r}")
    for artifact_id, digest in value.items():
        if not isinstance(artifact_id, str) or not STABLE_ID_RE.fullmatch(artifact_id) or not is_sha256(digest):
            issues.append(f"{label} contains an invalid artifact ID or SHA-256: {artifact_id!r}")
    return value


def artifact_map(data: Mapping[str, Any], issues: List[str]) -> Tuple[Dict[str, Dict[str, Any]], Dict[str, str]]:
    artifacts = data.get("artifacts")
    if not isinstance(artifacts, list) or len(artifacts) != len(ARTIFACT_IDS):
        issues.append("exactly eight learner-final artifacts are required")
        return {}, {}
    observed = [item.get("artifactId") if isinstance(item, dict) else None for item in artifacts]
    if observed != ARTIFACT_IDS:
        issues.append(f"artifact IDs/order must equal {ARTIFACT_IDS!r}")
    contents: Dict[str, Dict[str, Any]] = {}
    hashes: Dict[str, str] = {}
    for item in artifacts:
        if not isinstance(item, dict) or set(item) != {"artifactId", "content", "sha256"} or not isinstance(item.get("content"), dict):
            issues.append("every artifact must contain only artifactId, object content, and sha256")
            continue
        artifact_id = item["artifactId"]
        if not isinstance(artifact_id, str) or artifact_id not in ARTIFACT_IDS:
            issues.append(f"unknown or malformed artifact ID: {artifact_id!r}")
            continue
        if artifact_id in contents:
            issues.append(f"duplicate artifact: {artifact_id}")
            continue
        expected_hash = canonical_content_hash(item["content"])
        if not is_sha256(item.get("sha256")) or item["sha256"] != expected_hash:
            issues.append(f"artifact content/hash mismatch: {artifact_id}")
        contents[artifact_id] = item["content"]
        hashes[artifact_id] = item.get("sha256", "")
    return contents, hashes


def validate_environment(environment: Mapping[str, Any], issues: List[str]) -> None:
    fields = {
        "python", "torch", "platform", "hardware", "networkRequired",
        "acceleratorRequired", "codeSha256", "dataSha256", "configSha256",
        "schemaSha256", "rightsBoundary",
    }
    exact_keys(environment, fields, "environment-lock", issues)
    for field in ("python", "torch", "platform", "hardware", "rightsBoundary"):
        if not meaningful(environment.get(field)):
            issues.append(f"environment-lock is missing meaningful {field}")
    for field in ("codeSha256", "dataSha256", "configSha256", "schemaSha256"):
        if not is_sha256(environment.get(field)):
            issues.append(f"environment-lock {field} is not a non-placeholder SHA-256")
    try:
        current_schema_sha256 = hashlib.sha256(Path(__file__).with_name("capstone.schema.json").read_bytes()).hexdigest()
    except OSError as error:
        issues.append(f"current capstone schema cannot be hashed: {error}")
    else:
        if environment.get("schemaSha256") != current_schema_sha256:
            issues.append("environment-lock schemaSha256 does not bind the current capstone.schema.json bytes")
    if environment.get("networkRequired") is not False:
        issues.append("required learner-final evidence must be reproducible without network access")
    if environment.get("acceleratorRequired") is not False:
        issues.append("the required learner-final lane must remain CPU-only; accelerators are optional extensions")


def validate_runs(run_ledger: Mapping[str, Any], environment: Mapping[str, Any], issues: List[str]) -> Tuple[List[Dict[str, Any]], set[int], List[Dict[str, Any]]]:
    exact_keys(run_ledger, {"runs", "predeclaredAt", "checkpointResume", "uncertaintyMethod"}, "run-ledger", issues)
    runs_value = run_ledger.get("runs")
    if not isinstance(runs_value, list) or len(runs_value) < 6:
        issues.append("run-ledger needs three primary Transformer seeds, a baseline, a checkpoint-resume attempt, and a retained failed attempt")
        runs_value = []
    runs: List[Dict[str, Any]] = []
    run_ids: set[str] = set()
    run_by_id: Dict[str, Dict[str, Any]] = {}
    split_bindings: set[Tuple[Any, Any]] = set()
    earliest_start: datetime | None = None
    required_fields = {
        "runId", "modelFamily", "seed", "purpose", "status", "startedAt",
        "endedAt", "elapsedSeconds", "wallSeconds", "stopReason",
        "metricDefinition", "trainingMode", "evaluationMode", "checkpointSha256",
        "configSha256", "splitReceiptId", "splitReceiptSha256",
        "moduleReceiptIdsAndHashes", "command", "outputSha256",
    }
    for position, value in enumerate(runs_value):
        if not isinstance(value, dict):
            issues.append(f"run-ledger entry {position} must be an object")
            continue
        run = value
        runs.append(run)
        label = f"run {run.get('runId', position)!r}"
        exact_keys(run, required_fields, label, issues, optional={"parentRunId"})
        run_id = run.get("runId")
        if not isinstance(run_id, str) or not STABLE_ID_RE.fullmatch(run_id) or run_id in run_ids:
            issues.append(f"{label} has an invalid or duplicate runId")
        else:
            run_ids.add(run_id)
            run_by_id[run_id] = run
        if run.get("modelFamily") not in MODEL_MODULE_ARTIFACTS:
            issues.append(f"{label} has unsupported modelFamily")
        if run.get("purpose") not in {"primary", "baseline", "checkpoint-resume", "negative-control"}:
            issues.append(f"{label} has unsupported purpose")
        if run.get("status") not in {"completed", "failed", "interrupted", "rejected", "excluded"}:
            issues.append(f"{label} has unsupported status")
        if not isinstance(run.get("seed"), int) or isinstance(run.get("seed"), bool):
            issues.append(f"{label} seed must be an integer")
        for field in ("stopReason", "metricDefinition", "trainingMode", "evaluationMode", "command"):
            if not meaningful(run.get(field)):
                issues.append(f"{label} is missing meaningful {field}")
        started = parse_offset_timestamp(run.get("startedAt"))
        ended = parse_offset_timestamp(run.get("endedAt"))
        if started is None or ended is None:
            issues.append(f"{label} timestamps must be offset-aware ISO 8601 values")
        elif ended <= started:
            issues.append(f"{label} endedAt must be after startedAt")
        else:
            earliest_start = started if earliest_start is None or started < earliest_start else earliest_start
            expected_wall = (ended - started).total_seconds()
            wall = run.get("wallSeconds")
            tolerance = max(1.0, expected_wall * 0.02)
            if not is_number(wall) or float(wall) <= 0 or abs(float(wall) - expected_wall) > tolerance:
                issues.append(f"{label} wallSeconds does not match its offset-aware timestamps")
        elapsed = run.get("elapsedSeconds")
        wall = run.get("wallSeconds")
        if not is_number(elapsed) or float(elapsed) <= 0:
            issues.append(f"{label} elapsedSeconds must be positive")
        elif is_number(wall) and float(elapsed) > float(wall) + max(1.0, float(wall) * 0.02):
            issues.append(f"{label} elapsedSeconds exceeds declared wallSeconds")
        for field in ("checkpointSha256", "configSha256", "splitReceiptSha256", "outputSha256"):
            if not is_sha256(run.get(field)):
                issues.append(f"{label} has a placeholder or missing {field}")
        if run.get("configSha256") != environment.get("configSha256"):
            issues.append(f"{label} configSha256 is not bound to environment-lock")
        if not isinstance(run.get("splitReceiptId"), str) or not STABLE_ID_RE.fullmatch(run["splitReceiptId"]):
            issues.append(f"{label} splitReceiptId is invalid")
        if isinstance(run.get("splitReceiptId"), str) and isinstance(run.get("splitReceiptSha256"), str):
            split_bindings.add((run["splitReceiptId"], run["splitReceiptSha256"]))
        else:
            split_bindings.add(("invalid-split-binding", str(position)))
        module_receipts = validate_hash_map(run.get("moduleReceiptIdsAndHashes"), f"{label} moduleReceiptIdsAndHashes", issues)
        family = run.get("modelFamily")
        if family in MODEL_MODULE_ARTIFACTS:
            required_modules = COMMON_RUN_MODULE_ARTIFACTS | MODEL_MODULE_ARTIFACTS[family]
            if not required_modules.issubset(module_receipts):
                issues.append(f"{label} does not link required module-artifact receipts {sorted(required_modules)!r}")
    if len(split_bindings) != 1:
        issues.append("all capstone comparison runs must bind the same split receipt ID and hash")
    predeclared_at = parse_offset_timestamp(run_ledger.get("predeclaredAt"))
    if predeclared_at is None:
        issues.append("run-ledger predeclaredAt must be offset-aware")
    elif earliest_start is not None and predeclared_at > earliest_start:
        issues.append("run-ledger uncertainty policy must be predeclared before the first run")
    if not meaningful(run_ledger.get("uncertaintyMethod")):
        issues.append("run-ledger must predeclare an uncertainty method")

    primary_transformers = [
        run for run in runs
        if run.get("modelFamily") == "transformer"
        and run.get("purpose") == "primary"
        and run.get("status") == "completed"
    ]
    seeds = {run.get("seed") for run in primary_transformers if isinstance(run.get("seed"), int)}
    if len(seeds) < 3:
        issues.append("learner final requires at least three distinct completed primary Transformer seeds")
    baseline_runs = [
        run for run in runs
        if run.get("modelFamily") in {"rnn", "simple-baseline"}
        and run.get("purpose") == "baseline"
        and run.get("status") == "completed"
    ]
    if not baseline_runs:
        issues.append("learner final requires a completed simple or RNN baseline")
    failed_runs = [run for run in runs if run.get("status") != "completed"]
    if not failed_runs:
        issues.append("run-ledger must retain at least one failed, interrupted, rejected, or excluded attempt")

    checkpoint = run_ledger.get("checkpointResume")
    checkpoint_fields = {
        "sourceRunId", "resumedRunId", "checkpointSha256",
        "uninterruptedOutputSha256", "resumedOutputSha256", "freshProcess",
        "equivalenceMode", "tolerance", "maxAbsoluteDifference", "status", "command",
    }
    if not isinstance(checkpoint, dict):
        issues.append("run-ledger needs a structured checkpointResume receipt")
    else:
        exact_keys(checkpoint, checkpoint_fields, "checkpointResume", issues)
        source_id = checkpoint.get("sourceRunId")
        resumed_id = checkpoint.get("resumedRunId")
        source = run_by_id.get(source_id) if isinstance(source_id, str) else None
        resumed = run_by_id.get(resumed_id) if isinstance(resumed_id, str) else None
        if not source or source.get("purpose") != "primary" or source.get("status") != "completed":
            issues.append("checkpointResume sourceRunId must name a completed primary run")
        if not resumed or resumed.get("purpose") != "checkpoint-resume" or resumed.get("status") != "completed":
            issues.append("checkpointResume resumedRunId must name a completed checkpoint-resume attempt")
        if resumed and resumed.get("parentRunId") != checkpoint.get("sourceRunId"):
            issues.append("checkpoint-resume run must link its primary parentRunId")
        for field in ("checkpointSha256", "uninterruptedOutputSha256", "resumedOutputSha256"):
            if not is_sha256(checkpoint.get(field)):
                issues.append(f"checkpointResume {field} is missing or a placeholder")
        if source and checkpoint.get("checkpointSha256") != source.get("checkpointSha256"):
            issues.append("checkpointResume checkpoint hash does not match its source run")
        if resumed and checkpoint.get("checkpointSha256") != resumed.get("checkpointSha256"):
            issues.append("checkpointResume checkpoint hash does not match its resumed run")
        if source and checkpoint.get("uninterruptedOutputSha256") != source.get("outputSha256"):
            issues.append("checkpointResume uninterrupted output hash does not match its source run")
        if resumed and checkpoint.get("resumedOutputSha256") != resumed.get("outputSha256"):
            issues.append("checkpointResume resumed output hash does not match its resumed run")
        if checkpoint.get("freshProcess") is not True or checkpoint.get("status") != "pass":
            issues.append("checkpointResume must pass in a fresh process")
        if checkpoint.get("equivalenceMode") not in {"exact", "tolerance-bounded"}:
            issues.append("checkpointResume equivalenceMode must be exact or tolerance-bounded")
        tolerance = checkpoint.get("tolerance")
        difference = checkpoint.get("maxAbsoluteDifference")
        if not is_number(tolerance) or float(tolerance) < 0 or not is_number(difference) or float(difference) < 0:
            issues.append("checkpointResume tolerance and difference must be finite non-negative numbers")
        elif checkpoint.get("equivalenceMode") == "exact" and (
            float(tolerance) != 0
            or float(difference) != 0
            or checkpoint.get("uninterruptedOutputSha256") != checkpoint.get("resumedOutputSha256")
        ):
            issues.append("exact checkpointResume requires equal output hashes and zero difference")
        elif checkpoint.get("equivalenceMode") == "tolerance-bounded" and float(difference) > float(tolerance):
            issues.append("checkpointResume difference exceeds its declared tolerance")
        if not meaningful(checkpoint.get("command")):
            issues.append("checkpointResume must retain its fresh-process command")
    return runs, seeds, failed_runs


def validate_failures(failure_ledger: Mapping[str, Any], runs: Sequence[Mapping[str, Any]], failed_runs: Sequence[Mapping[str, Any]], issues: List[str]) -> List[Dict[str, Any]]:
    exact_keys(failure_ledger, {"failures", "failedRunsRetained", "boundary"}, "failure-ledger", issues)
    failures_value = failure_ledger.get("failures")
    if not isinstance(failures_value, list) or not failures_value:
        issues.append("failure-ledger must retain at least one attempted fault/failure record")
        failures_value = []
    failures: List[Dict[str, Any]] = []
    run_by_id = {run.get("runId"): run for run in runs}
    failure_ids: set[str] = set()
    linked_run_ids: set[str] = set()
    fields = {
        "failureId", "runId", "seed", "failureType", "observedSymptom",
        "triggeredInvariant", "evidencePath", "evidenceSha256", "recoveryAction",
        "disposition", "owner",
    }
    for position, value in enumerate(failures_value):
        if not isinstance(value, dict):
            issues.append(f"failure-ledger entry {position} must be an object")
            continue
        failure = value
        failures.append(failure)
        label = f"failure {failure.get('failureId', position)!r}"
        exact_keys(failure, fields, label, issues)
        failure_id = failure.get("failureId")
        if not isinstance(failure_id, str) or not STABLE_ID_RE.fullmatch(failure_id) or failure_id in failure_ids:
            issues.append(f"{label} has an invalid or duplicate failureId")
        else:
            failure_ids.add(failure_id)
        for field in ("runId", "failureType", "observedSymptom", "triggeredInvariant", "recoveryAction", "disposition", "owner"):
            if not meaningful(failure.get(field)):
                issues.append(f"{label} is missing meaningful {field}")
        if not is_safe_relative_path(failure.get("evidencePath")) or not is_sha256(failure.get("evidenceSha256")):
            issues.append(f"{label} needs a safe evidencePath and non-placeholder evidenceSha256")
        run_id = failure.get("runId")
        run = run_by_id.get(run_id) if isinstance(run_id, str) else None
        if not run or run.get("status") == "completed":
            issues.append(f"{label} must link a non-completed attempted run")
        elif failure.get("seed") != run.get("seed"):
            issues.append(f"{label} seed does not match its run-ledger entry")
        if isinstance(failure.get("runId"), str):
            linked_run_ids.add(failure["runId"])
    expected_failed_ids = {run.get("runId") for run in failed_runs}
    if linked_run_ids != expected_failed_ids:
        issues.append("failure-ledger must link every and only non-completed run-ledger attempt")
    if len(linked_run_ids) != len(failures):
        issues.append("each failure-ledger entry must link a distinct non-completed run")
    if failure_ledger.get("failedRunsRetained") is not True:
        issues.append("failure-ledger must explicitly retain failed runs")
    if not meaningful(failure_ledger.get("boundary")):
        issues.append("failure-ledger must state its aggregation/exclusion boundary")
    return failures


def validate_resources(resources: Mapping[str, Any], runs: Sequence[Mapping[str, Any]], failures: Sequence[Mapping[str, Any]], issues: List[str]) -> None:
    fields = {
        "hardware", "runtime", "measurementBoundary", "executionAggregation",
        "wallSeconds", "peakMemoryBytes", "runCount", "failedRunCount",
        "monetaryCostEstimate", "monetaryCostUncertainty", "energyProxy",
        "energyProxyUncertainty", "supportsDecisions", "doesNotSupportDecisions",
    }
    exact_keys(resources, fields, "resource-record", issues)
    for field in ("hardware", "runtime", "measurementBoundary"):
        if not meaningful(resources.get(field)):
            issues.append(f"resource-record is missing meaningful {field}")
    if resources.get("executionAggregation") != "sequential":
        issues.append("required CPU capstone lane must declare sequential resource aggregation")
    wall_seconds = resources.get("wallSeconds")
    if not is_number(wall_seconds) or float(wall_seconds) <= 0:
        issues.append("resource-record wallSeconds must be positive")
    elif float(wall_seconds) > 600:
        issues.append("resource-record exceeds the 600-second required CPU clean-run budget")
    run_wall_total = sum(float(run.get("wallSeconds", 0)) for run in runs if is_number(run.get("wallSeconds")))
    if is_number(wall_seconds) and float(wall_seconds) + 1e-9 < run_wall_total:
        issues.append("resource-record wallSeconds is less than the sequential per-run wall-time total")
    peak_memory = resources.get("peakMemoryBytes")
    if not isinstance(peak_memory, int) or isinstance(peak_memory, bool) or peak_memory <= 0:
        issues.append("resource-record peakMemoryBytes must be a positive integer")
    elif peak_memory > 2 * 1024 * 1024 * 1024:
        issues.append("resource-record exceeds the 2 GiB required CPU peak-memory budget")
    if resources.get("runCount") != len(runs) or resources.get("failedRunCount") != len(failures):
        issues.append("resource-record run counts do not match the run/failure ledgers")

    cost = resources.get("monetaryCostEstimate")
    if not isinstance(cost, dict):
        issues.append("resource-record needs a monetaryCostEstimate object")
        cost = {}
    else:
        exact_keys(cost, {"amount", "currency", "basis"}, "monetaryCostEstimate", issues)
    if not is_number(cost.get("amount")) or float(cost.get("amount", -1)) < 0 or not meaningful(cost.get("currency")) or not meaningful(cost.get("basis")):
        issues.append("monetaryCostEstimate needs a non-negative amount, currency, and basis")
    cost_uncertainty = resources.get("monetaryCostUncertainty")
    if not isinstance(cost_uncertainty, dict):
        issues.append("resource-record needs monetaryCostUncertainty")
        cost_uncertainty = {}
    else:
        exact_keys(cost_uncertainty, {"lowerBound", "upperBound", "basis"}, "monetaryCostUncertainty", issues)
    if (
        not is_number(cost_uncertainty.get("lowerBound"))
        or not is_number(cost_uncertainty.get("upperBound"))
        or float(cost_uncertainty.get("lowerBound", -1)) < 0
        or float(cost_uncertainty.get("upperBound", -1)) < float(cost_uncertainty.get("lowerBound", 0))
        or not meaningful(cost_uncertainty.get("basis"))
    ):
        issues.append("monetaryCostUncertainty needs ordered non-negative bounds and a basis")
    elif is_number(cost.get("amount")) and not (
        float(cost_uncertainty["lowerBound"]) <= float(cost["amount"]) <= float(cost_uncertainty["upperBound"])
    ):
        issues.append("monetary cost estimate lies outside its uncertainty bounds")

    energy = resources.get("energyProxy")
    if not isinstance(energy, dict):
        issues.append("resource-record needs an energyProxy object")
        energy = {}
    else:
        exact_keys(energy, {"value", "unit", "method", "measurementBoundary"}, "energyProxy", issues)
    if (
        not is_number(energy.get("value"))
        or float(energy.get("value", 0)) <= 0
        or any(not meaningful(energy.get(field)) for field in ("unit", "method", "measurementBoundary"))
    ):
        issues.append("energyProxy needs a positive value, unit, method, and explicit measurement boundary")
    energy_uncertainty = resources.get("energyProxyUncertainty")
    if not isinstance(energy_uncertainty, dict):
        issues.append("resource-record needs energyProxyUncertainty")
        energy_uncertainty = {}
    else:
        exact_keys(energy_uncertainty, {"lowerBound", "upperBound", "basis"}, "energyProxyUncertainty", issues)
    if (
        not is_number(energy_uncertainty.get("lowerBound"))
        or not is_number(energy_uncertainty.get("upperBound"))
        or float(energy_uncertainty.get("lowerBound", -1)) < 0
        or float(energy_uncertainty.get("upperBound", -1)) < float(energy_uncertainty.get("lowerBound", 0))
        or not meaningful(energy_uncertainty.get("basis"))
    ):
        issues.append("energyProxyUncertainty needs ordered non-negative bounds and a basis")
    elif is_number(energy.get("value")) and not (
        float(energy_uncertainty["lowerBound"]) <= float(energy["value"]) <= float(energy_uncertainty["upperBound"])
    ):
        issues.append("energy proxy lies outside its uncertainty bounds")
    require_string_list(resources.get("supportsDecisions"), "resource-record supportsDecisions", issues)
    require_string_list(resources.get("doesNotSupportDecisions"), "resource-record doesNotSupportDecisions", issues)


def validate_evaluation(evaluation: Mapping[str, Any], primary_seed_count: int, issues: List[str]) -> None:
    fields = {
        "slices", "negativeCases", "calibrationMethod", "errorAnalysis",
        "controlledAblation", "seedLevelTraceRef", "uncertaintySummary",
        "missingTests", "generalisationLimits",
    }
    exact_keys(evaluation, fields, "evaluation-slices", issues)
    slices = evaluation.get("slices")
    if not isinstance(slices, list):
        issues.append("evaluation-slices slices must be an array")
        slices = []
    slice_types: set[str] = set()
    slice_ids: set[str] = set()
    common_slice_fields = {
        "sliceId", "sliceType", "denominator", "metric", "seedResults",
        "uncertainty", "evidenceSha256", "boundary",
    }
    for position, value in enumerate(slices):
        if not isinstance(value, dict):
            issues.append(f"evaluation slice {position} must be an object")
            continue
        slice_type = value.get("sliceType")
        required = common_slice_fields | ({"transformationReceipt"} if slice_type != "clean" else set())
        exact_keys(value, required, f"evaluation slice {value.get('sliceId', position)!r}", issues)
        slice_id = value.get("sliceId")
        if not isinstance(slice_id, str) or not STABLE_ID_RE.fullmatch(slice_id) or slice_id in slice_ids:
            issues.append("evaluation slice IDs must be unique stable IDs")
        else:
            slice_ids.add(slice_id)
        if slice_type not in REQUIRED_SLICE_TYPES:
            issues.append(f"evaluation slice {slice_id!r} has unsupported sliceType")
        else:
            slice_types.add(slice_type)
        denominator = value.get("denominator")
        if not isinstance(denominator, int) or isinstance(denominator, bool) or denominator <= 0:
            issues.append(f"evaluation slice {slice_id!r} denominator must be a positive integer")
        seed_results = value.get("seedResults")
        if (
            not isinstance(seed_results, list)
            or len(seed_results) < max(3, primary_seed_count)
            or any(not is_number(result) for result in seed_results)
        ):
            issues.append(f"evaluation slice {slice_id!r} must retain one finite result per primary seed")
        for field in ("metric", "uncertainty", "boundary"):
            if not meaningful(value.get(field)):
                issues.append(f"evaluation slice {slice_id!r} is missing meaningful {field}")
        if not is_sha256(value.get("evidenceSha256")):
            issues.append(f"evaluation slice {slice_id!r} needs non-placeholder evidenceSha256")
        if slice_type != "clean":
            receipt = value.get("transformationReceipt")
            if not isinstance(receipt, dict):
                issues.append(f"evaluation slice {slice_id!r} needs a transformation receipt")
            else:
                exact_keys(receipt, {"id", "sha256"}, f"evaluation slice {slice_id!r} transformationReceipt", issues)
                if not isinstance(receipt.get("id"), str) or not STABLE_ID_RE.fullmatch(receipt["id"]) or not is_sha256(receipt.get("sha256")):
                    issues.append(f"evaluation slice {slice_id!r} has an invalid transformation receipt")
    if not REQUIRED_SLICE_TYPES.issubset(slice_types):
        issues.append(f"evaluation-slices must include {sorted(REQUIRED_SLICE_TYPES)!r}")

    negative_cases = evaluation.get("negativeCases")
    if not isinstance(negative_cases, list):
        issues.append("evaluation-slices negativeCases must be an array")
        negative_cases = []
    observed_cases: Dict[str, str] = {}
    negative_fields = {
        "caseId", "moduleArtifactId", "injectedFault", "expectedFailure",
        "observedFailure", "evidenceSha256", "status",
    }
    for position, value in enumerate(negative_cases):
        if not isinstance(value, dict):
            issues.append(f"negative case {position} must be an object")
            continue
        case_id = value.get("caseId")
        exact_keys(value, negative_fields, f"negative case {case_id!r}", issues)
        if case_id in observed_cases:
            issues.append(f"duplicate negative case: {case_id}")
        if isinstance(case_id, str):
            observed_cases[case_id] = value.get("moduleArtifactId")
        if value.get("status") != "rejected-as-expected":
            issues.append(f"negative case {case_id!r} did not fail as expected")
        for field in ("injectedFault", "expectedFailure", "observedFailure"):
            if not meaningful(value.get(field)):
                issues.append(f"negative case {case_id!r} is missing meaningful {field}")
        if not is_sha256(value.get("evidenceSha256")):
            issues.append(f"negative case {case_id!r} needs non-placeholder evidenceSha256")
    if observed_cases != REQUIRED_NEGATIVE_CASES:
        issues.append("negative-case ledger must bind Unicode normalization, tokenizer drift, causal-mask leakage, and LoRA merge faults to their exact module artifacts")

    if not meaningful(evaluation.get("calibrationMethod")):
        issues.append("evaluation-slices must state a calibration method and boundary")
    error_analysis = evaluation.get("errorAnalysis")
    if not isinstance(error_analysis, dict):
        issues.append("evaluation-slices needs structured errorAnalysis evidence")
    else:
        exact_keys(error_analysis, {"representativeErrors", "evidenceSha256"}, "errorAnalysis", issues)
        errors = error_analysis.get("representativeErrors")
        if not isinstance(errors, list) or not errors:
            issues.append("errorAnalysis must retain at least one representative error")
        else:
            for error in errors:
                if not isinstance(error, dict):
                    issues.append("representative error entries must be objects")
                    continue
                exact_keys(error, {"exampleId", "observed", "hypothesis", "disposition"}, "representative error", issues)
                if any(not meaningful(error.get(field)) for field in ("exampleId", "observed", "hypothesis", "disposition")):
                    issues.append("representative errors require exampleId, observation, hypothesis, and disposition")
        if not is_sha256(error_analysis.get("evidenceSha256")):
            issues.append("errorAnalysis needs a non-placeholder evidenceSha256")
    ablation = evaluation.get("controlledAblation")
    if not isinstance(ablation, dict):
        issues.append("evaluation-slices needs a structured controlledAblation")
    else:
        exact_keys(ablation, {"variableChanged", "fixedBudget", "seedResults", "evidenceSha256"}, "controlledAblation", issues)
        if not meaningful(ablation.get("variableChanged")) or ablation.get("fixedBudget") is not True:
            issues.append("controlledAblation must change one named variable under a fixed budget")
        if not isinstance(ablation.get("seedResults"), list) or len(ablation["seedResults"]) < 3 or any(not is_number(value) for value in ablation["seedResults"]):
            issues.append("controlledAblation must retain at least three finite seed results")
        if not is_sha256(ablation.get("evidenceSha256")):
            issues.append("controlledAblation needs a non-placeholder evidenceSha256")
    if evaluation.get("seedLevelTraceRef") != "run-ledger:runs" or not meaningful(evaluation.get("uncertaintySummary")):
        issues.append("evaluation-slices must bind run-ledger seed traces and explain uncertainty")
    require_string_list(evaluation.get("missingTests"), "evaluation-slices missingTests", issues)
    require_string_list(evaluation.get("generalisationLimits"), "evaluation-slices generalisationLimits", issues, minimum=2)


def validate_dossier(dossier: Mapping[str, Any], artifact_hashes: Mapping[str, str], seeds: set[int], decision: Any, issues: List[str]) -> None:
    fields = {
        "purpose", "primaryModel", "version", "architecture", "dataProvenance",
        "rightsBoundary", "optimisationSummary", "adaptationStrategy", "seeds",
        "decision", "decisionReason", "intendedUses", "excludedUses", "owners",
        "evidenceLinks", "claims",
    }
    exact_keys(dossier, fields, "training-dossier", issues)
    for field in (
        "purpose", "version", "architecture", "dataProvenance", "rightsBoundary",
        "optimisationSummary", "adaptationStrategy", "decisionReason",
    ):
        if not meaningful(dossier.get(field)):
            issues.append(f"training-dossier is missing meaningful {field}")
    if dossier.get("primaryModel") != "transformer":
        issues.append("training-dossier must be Transformer-backed")
    if dossier.get("seeds") != sorted(seeds):
        issues.append("training-dossier seeds must equal the primary Transformer run seeds")
    if dossier.get("decision") != decision or decision not in {"no-train", "no-deploy"}:
        issues.append("training-dossier decision must match the package no-train/no-deploy decision")
    require_string_list(dossier.get("intendedUses"), "training-dossier intendedUses", issues)
    require_string_list(dossier.get("excludedUses"), "training-dossier excludedUses", issues)
    require_string_list(dossier.get("owners"), "training-dossier owners", issues)
    links = validate_hash_map(dossier.get("evidenceLinks"), "training-dossier evidenceLinks", issues, LINKED_DOSSIER_ARTIFACT_IDS)
    for artifact_id in LINKED_DOSSIER_ARTIFACT_IDS:
        if links.get(artifact_id) != artifact_hashes.get(artifact_id):
            issues.append(f"training-dossier evidence link drifted: {artifact_id}")
    claims = dossier.get("claims")
    if not isinstance(claims, list) or len(claims) < len(LINKED_DOSSIER_ARTIFACT_IDS):
        issues.append("training-dossier must contain atomic claims linked to each evidence artifact")
        claims = []
    claim_ids: set[str] = set()
    claim_artifacts: set[str] = set()
    for claim in claims:
        if not isinstance(claim, dict):
            issues.append("training-dossier claims must be objects")
            continue
        exact_keys(claim, {"claimId", "claim", "evidenceArtifactId", "evidenceSha256"}, "training-dossier claim", issues)
        claim_id = claim.get("claimId")
        if not isinstance(claim_id, str) or not STABLE_ID_RE.fullmatch(claim_id) or claim_id in claim_ids:
            issues.append("training-dossier claim IDs must be unique stable IDs")
        else:
            claim_ids.add(claim_id)
        artifact_id = claim.get("evidenceArtifactId")
        expected_hash = artifact_hashes.get(artifact_id) if isinstance(artifact_id, str) else None
        if artifact_id not in LINKED_DOSSIER_ARTIFACT_IDS or claim.get("evidenceSha256") != expected_hash:
            issues.append(f"training-dossier claim {claim_id!r} is not bound to its exact evidence hash")
        elif isinstance(artifact_id, str):
            claim_artifacts.add(artifact_id)
        if not meaningful(claim.get("claim")):
            issues.append(f"training-dossier claim {claim_id!r} has no meaningful text")
    if claim_artifacts != set(LINKED_DOSSIER_ARTIFACT_IDS):
        issues.append("training-dossier claims do not cover all run, failure, resource, and evaluation evidence")


def validate_limitations(limitations: Mapping[str, Any], decision: Any, issues: List[str]) -> None:
    fields = {
        "knownFailures", "untestedConditions", "stopConditions", "invalidUses",
        "safetyMisuseRisks", "remediationOwners", "costCeiling",
        "dataRightsBoundary", "unresolvedRightsUncertainty",
    }
    exact_keys(limitations, fields, "limitations", issues)
    for field in ("knownFailures", "untestedConditions", "stopConditions", "invalidUses", "safetyMisuseRisks"):
        require_string_list(limitations.get(field), f"limitations {field}", issues, minimum=2)
    require_string_list(limitations.get("remediationOwners"), "limitations remediationOwners", issues)
    for field in ("costCeiling", "dataRightsBoundary"):
        if not meaningful(limitations.get(field)):
            issues.append(f"limitations is missing meaningful {field}")
    unresolved = limitations.get("unresolvedRightsUncertainty")
    if not isinstance(unresolved, bool):
        issues.append("limitations unresolvedRightsUncertainty must be Boolean")
    elif unresolved and decision != "no-train":
        issues.append("unresolved rights uncertainty requires the stricter no-train decision")


def validate_reviewer(reviewer: Mapping[str, Any], artifact_hashes: Mapping[str, str], decision: Any, generated_at: datetime | None, issues: List[str]) -> None:
    fields = {
        "reviewerName", "reviewerRole", "externalReviewComplete",
        "reviewedArtifactIdsAndHashes", "cleanRoomCommands",
        "cleanRoomTranscriptPath", "cleanRoomTranscriptSha256", "rerunResults",
        "failedChecks", "unresolvedVariance", "remediation", "challenge",
        "rationale", "signedAt", "decision", "identityBoundary",
    }
    exact_keys(reviewer, fields, "reviewer-decision", issues)
    for field in (
        "reviewerName", "reviewerRole", "unresolvedVariance", "remediation",
        "challenge", "rationale",
    ):
        if not meaningful(reviewer.get(field)):
            issues.append(f"reviewer-decision is missing meaningful {field}")
    if reviewer.get("externalReviewComplete") is not True:
        issues.append("learner final requires a structurally complete external-review record")
    reviewed = validate_hash_map(
        reviewer.get("reviewedArtifactIdsAndHashes"),
        "reviewer-decision reviewedArtifactIdsAndHashes",
        issues,
        REVIEWED_ARTIFACT_IDS,
    )
    for artifact_id in REVIEWED_ARTIFACT_IDS:
        if reviewed.get(artifact_id) != artifact_hashes.get(artifact_id):
            issues.append(f"reviewer did not bind the exact current artifact hash: {artifact_id}")
    require_string_list(reviewer.get("cleanRoomCommands"), "reviewer-decision cleanRoomCommands", issues)
    require_string_list(reviewer.get("rerunResults"), "reviewer-decision rerunResults", issues)
    require_string_list(reviewer.get("failedChecks"), "reviewer-decision failedChecks", issues)
    if not is_safe_relative_path(reviewer.get("cleanRoomTranscriptPath")) or not is_sha256(reviewer.get("cleanRoomTranscriptSha256")):
        issues.append("reviewer-decision needs a safe clean-room transcript path and non-placeholder hash")
    signed_at = parse_offset_timestamp(reviewer.get("signedAt"))
    if signed_at is None:
        issues.append("reviewer-decision signedAt must be offset-aware")
    elif generated_at is not None and signed_at > generated_at:
        issues.append("reviewer-decision signedAt cannot be after package generatedAt")
    if reviewer.get("decision") != decision or decision not in {"no-train", "no-deploy"}:
        issues.append("reviewer decision must match the package no-train/no-deploy decision")
    if reviewer.get("identityBoundary") != "learner-supplied-not-authenticated-by-local-validator":
        issues.append("reviewer record must disclose that local validation does not authenticate identity")


def load_and_validate_capstone(path: Path) -> Tuple[List[str], Dict[str, Any] | None, Dict[str, Dict[str, Any]], Dict[str, str]]:
    issues: List[str] = []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        return [f"learner final is unreadable JSON: {error}"], None, {}, {}
    expected = {
        "schemaVersion": SCHEMA_VERSION,
        "courseId": COURSE_ID,
        "courseVersion": COURSE_VERSION,
        "capstoneVersion": CAPSTONE_VERSION,
        "validatorId": VALIDATOR_ID,
        "mode": "learner-final",
    }
    allowed = set(expected) | {"generatedAt", "decision", "artifacts"}
    if not isinstance(data, dict) or set(data) != allowed:
        return ["learner-final top-level contract drifted"], None, {}, {}
    for key, value in expected.items():
        if data.get(key) != value:
            issues.append(f"{key} must equal {value!r}")
    generated_at = parse_offset_timestamp(data.get("generatedAt"))
    if generated_at is None:
        issues.append("generatedAt must be an offset-aware ISO 8601 timestamp")
    decision = data.get("decision")
    if decision not in {"no-train", "no-deploy"}:
        issues.append("package decision must be no-train or no-deploy; PASS grants no deployment authority")
    by_id, artifact_hashes = artifact_map(data, issues)
    if set(by_id) != set(ARTIFACT_IDS):
        return issues + ["learner-final artifact set is incomplete"], data, by_id, artifact_hashes

    environment = by_id["environment-lock"]
    validate_environment(environment, issues)
    runs, seeds, failed_runs = validate_runs(by_id["run-ledger"], environment, issues)
    failures = validate_failures(by_id["failure-ledger"], runs, failed_runs, issues)
    validate_resources(by_id["resource-record"], runs, failures, issues)
    validate_evaluation(by_id["evaluation-slices"], len(seeds), issues)
    validate_dossier(by_id["training-dossier"], artifact_hashes, seeds, decision, issues)
    validate_limitations(by_id["limitations"], decision, issues)
    validate_reviewer(by_id["reviewer-decision"], artifact_hashes, decision, generated_at, issues)
    return issues, data, by_id, artifact_hashes


def validate_capstone(path: Path) -> List[str]:
    issues, _, _, _ = load_and_validate_capstone(path)
    return issues


def command_relative_path(path: Path, cwd: Path) -> str:
    try:
        relative = path.resolve().relative_to(cwd.resolve()).as_posix()
    except ValueError as error:
        raise ValueError("receipt output requires package and receipt directory paths inside the current workspace") from error
    if not is_safe_relative_path(relative):
        raise ValueError("receipt output paths must be safe workspace-relative paths")
    return relative


def emit_receipts(
    package_path: Path,
    receipt_dir: Path,
    data: Mapping[str, Any],
    artifact_hashes: Mapping[str, str],
) -> List[Path]:
    cwd = Path.cwd()
    package_relative = command_relative_path(package_path, cwd)
    receipt_relative = command_relative_path(receipt_dir, cwd)
    command = (
        "python3 public/courses/deep-learning/lab/validate_capstone.py "
        f"--package {shlex.quote(package_relative)} --receipt-dir {shlex.quote(receipt_relative)}"
    )
    reviewer = data["artifacts"][ARTIFACT_IDS.index("reviewer-decision")]["content"]
    resources = data["artifacts"][ARTIFACT_IDS.index("resource-record")]["content"]
    checked_on = datetime.now(timezone.utc).date().isoformat()
    limitations = [
        "The local validator checks structure, hashes, and declared semantic links; it does not authenticate reviewer identity or review quality.",
        f"The package decision is {data['decision']}; validator PASS grants no training or deployment authority.",
        f"Resource boundary: {resources['measurementBoundary']}",
    ]
    receipt_dir.mkdir(parents=True, exist_ok=True)
    written: List[Path] = []
    for index, artifact_id in enumerate(ARTIFACT_IDS):
        receipt = {
            "schemaVersion": "aicourse.evidence-receipt.v1",
            "kind": "capstone-artifact",
            "courseId": COURSE_ID,
            "courseVersion": COURSE_VERSION,
            "artifactId": artifact_id,
            "artifactPath": f"{package_relative}#artifacts/{index}/content",
            "sha256": artifact_hashes[artifact_id],
            "validator": {
                "id": VALIDATOR_ID,
                "command": command,
                "status": "pass",
                "checkedOn": checked_on,
            },
            "reviewer": {
                "role": reviewer["reviewerRole"],
                "decision": "accept-with-limitations",
            },
            "limitations": limitations,
        }
        destination = receipt_dir / f"{artifact_id}.receipt.json"
        destination.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        written.append(destination)
    return written


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--package", required=True, type=Path)
    parser.add_argument(
        "--receipt-dir",
        type=Path,
        help="after full PASS, emit eight workspace-relative aicourse.evidence-receipt.v1 files",
    )
    args = parser.parse_args()
    package_path = args.package.resolve()
    issues, data, _, artifact_hashes = load_and_validate_capstone(package_path)
    if issues:
        print(f"{VALIDATOR_ID}: FAIL ({len(issues)} issue(s))")
        for issue in issues:
            print(f"- {issue}")
        return 1
    written: List[Path] = []
    if args.receipt_dir is not None:
        try:
            assert data is not None
            written = emit_receipts(package_path, args.receipt_dir.resolve(), data, artifact_hashes)
        except (OSError, ValueError) as error:
            print(f"{VALIDATOR_ID}: FAIL (receipt output: {error})")
            return 1
    print(f"{VALIDATOR_ID}: PASS")
    print("reviewableEvidence=true identityAuthenticated=false deploymentAuthority=false")
    for receipt_path in written:
        print(f"receipt={receipt_path.relative_to(Path.cwd()).as_posix()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
