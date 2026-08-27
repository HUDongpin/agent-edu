#!/usr/bin/env python3
"""Fail-closed, schema-specific validator for the Course 21 capstone package."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

from run_capstone import (
    CAPSTONE_VERSION,
    COURSE_ID,
    COURSE_VERSION,
    FIXTURE_HASHES,
    SEED,
    run_exercise,
)
from services import PREDICTIVE_CANDIDATE, PREDICTIVE_ROLLBACK, RAG_CANDIDATE, RAG_ROLLBACK

ARTIFACT_IDS = [
    "lineage-manifest", "experiment-record", "registry-entry", "serving-contract",
    "monitoring-dashboard", "drift-evidence", "alert-runbook", "rollback-evidence",
    "postmortem", "governance-approval",
]
CAPSTONE_SCHEMA_ID = "aicourse.production-ai.capstone.v1"
VALIDATOR_ID = "aicourse.production-ai.validator.v1"
REQUIRED_STATES = ["clean", "injected", "alerted", "held", "rolled-back", "verified"]
REQUIRED_INJECTIONS = ["numeric-data-drift-v1", "retrieval-degradation-v1"]
REQUIRED_ALERT_IDS = [
    "predictive-feature-mean-shift", "predictive-quality-regression",
    "rag-support-regression", "rag-quarantined-document-retrieved",
]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def is_sha256(value: Any) -> bool:
    return isinstance(value, str) and bool(re.fullmatch(r"[0-9a-f]{64}", value))


def exact_top(data: Dict[str, Any], issues: List[str]) -> None:
    expected = {
        "schemaVersion": "aicourse.capstone-submission.v1",
        "courseId": COURSE_ID,
        "courseVersion": COURSE_VERSION,
        "capstoneVersion": CAPSTONE_VERSION,
        "validatorId": VALIDATOR_ID,
        "generatedOn": "2026-08-26",
    }
    extras = set(data) - (set(expected) | {"artifacts"})
    if extras:
        issues.append("unexpected top-level fields: {}".format(sorted(extras)))
    for field, expected_value in expected.items():
        if data.get(field) != expected_value:
            issues.append("{} must equal {!r}".format(field, expected_value))


def artifacts(data: Dict[str, Any], issues: List[str]) -> Optional[Dict[str, Dict[str, Any]]]:
    values = data.get("artifacts")
    if not isinstance(values, list):
        issues.append("artifacts must be an array")
        return None
    if len(values) != 10:
        issues.append("exactly ten artifacts are required")
    observed = [item.get("artifactId") if isinstance(item, dict) else None for item in values]
    if observed != ARTIFACT_IDS:
        issues.append("artifact IDs/order must equal {!r}".format(ARTIFACT_IDS))
    result = {}
    for item in values:
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


def verify_output(path: Path, digest: Any, issues: List[str], label: str) -> None:
    if not path.is_file():
        issues.append("{} output missing: {}".format(label, path.name))
    elif not is_sha256(digest) or sha256(path) != digest:
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
    if schema.get("x-requiredServices") != ["predictive", "rag"] or schema.get("x-requiredInjections") != REQUIRED_INJECTIONS:
        issues.append("capstone.schema.json service/injection contract drift")
    if schema.get("x-requiredLifecycle") != REQUIRED_STATES or schema.get("x-decisionBoundary") != "no-deploy":
        issues.append("capstone.schema.json lifecycle/decision contract drift")
    exact_top(data, issues)
    by_id = artifacts(data, issues)
    if by_id is None:
        return issues
    if "FAKE_SECRET_DO_NOT_USE" in json.dumps(data):
        issues.append("planted marker leaked into the submitted evidence")

    try:
        expected = run_exercise(course_dir)
    except Exception as error:
        return issues + ["locked dual-service exercise could not be recomputed: {}".format(error)]

    lineage = by_id["lineage-manifest"]
    if lineage.get("inputs") != expected["inputReceipts"]:
        issues.append("lineage inputs do not match locked fixture hashes")
    expected_code_names = ["services.py", "run_capstone.py", "validate.py", "capstone.schema.json", "environment.lock.json"]
    code = lineage.get("code")
    code_map = {item.get("path"): item.get("sha256") for item in code} if isinstance(code, list) else {}
    if set(code_map) != set(expected_code_names):
        issues.append("lineage code inventory is incomplete")
    for name in expected_code_names:
        if code_map.get(name) != sha256(lab_dir / name):
            issues.append("lineage code hash mismatch: {}".format(name))
    systems = lineage.get("systems")
    if not isinstance(systems, list) or [system.get("systemId") for system in systems] != ["fictional-classifier", "fictional-rag"]:
        issues.append("lineage must bind both fictional systems")
    if lineage.get("environmentLockSha256") != sha256(lab_dir / "environment.lock.json") or "127.0.0.1" not in str(lineage.get("networkBoundary", "")):
        issues.append("lineage environment or localhost boundary mismatch")
    if "no personal data" not in str(lineage.get("rightsBoundary", "")):
        issues.append("lineage rights boundary is incomplete")
    output_map = {item.get("path"): item.get("sha256") for item in lineage.get("outputs", [])}
    if set(output_map) != {"http-transcript.json", "dashboard-data.json", "rollback-receipt.json"}:
        issues.append("lineage must bind all three generated evidence files")
    for name, digest in output_map.items():
        verify_output(submission_path.parent / name, digest, issues, "lineage")

    experiment = by_id["experiment-record"]
    if experiment.get("services") != ["predictive", "rag"] or experiment.get("phases") != REQUIRED_STATES:
        issues.append("experiment must include both services and the complete lifecycle")
    if experiment.get("transportVerified") is not True or experiment.get("httpRequestCount") != 16 or experiment.get("preservedFailedEvidence") is not True:
        issues.append("experiment lacks actual HTTP, all 16 requests, or failed evidence")
    if experiment.get("seed") != SEED or "not a production trial" not in str(experiment.get("boundary", "")):
        issues.append("experiment seed or scope boundary drifted")
    transcript_path = submission_path.parent / str(experiment.get("httpTranscriptPath", ""))
    verify_output(transcript_path, experiment.get("httpTranscriptSha256"), issues, "experiment")
    if transcript_path.is_file():
        transcript_file = json.loads(transcript_path.read_text(encoding="utf-8"))
        if transcript_file.get("transport") != "actual localhost HTTP" or transcript_file.get("binding") != "127.0.0.1:ephemeral" or transcript_file.get("records") != expected["transcript"]:
            issues.append("HTTP transcript does not reproduce the fixed local exercise")

    registry = by_id["registry-entry"]
    predictive = registry.get("predictive", {})
    rag = registry.get("rag", {})
    if predictive != {"candidate": PREDICTIVE_CANDIDATE, "candidateState": "rejected", "active": PREDICTIVE_ROLLBACK, "rollbackVerified": True}:
        issues.append("predictive registry transition is wrong")
    if rag != {"candidate": RAG_CANDIDATE, "candidateState": "quarantined", "active": RAG_ROLLBACK, "rollbackVerified": True}:
        issues.append("RAG registry transition is wrong")
    if registry.get("states") != REQUIRED_STATES or registry.get("approvalRequired") is not True or registry.get("promotionAllowed") is not False:
        issues.append("registry lifecycle/human promotion boundary is incomplete")

    serving = by_id["serving-contract"]
    if serving.get("host") != "127.0.0.1" or serving.get("ports") != "ephemeral" or serving.get("externalNetwork") is not False:
        issues.append("serving contract must be localhost-only on ephemeral ports")
    service_rows = serving.get("services", [])
    if [row.get("id") for row in service_rows] != ["predictive", "rag"] or [row.get("path") for row in service_rows] != ["/predict", "/answer"]:
        issues.append("serving contract must define both actual HTTP endpoints")
    if serving.get("secrets") != "none" or "never expose" not in str(serving.get("productionHardening", "")):
        issues.append("serving contract secret/hardening boundary is missing")

    dashboard = by_id["monitoring-dashboard"]
    if dashboard.get("signals") != expected["dashboard"]["signals"] or dashboard.get("thresholds") != expected["dashboard"]["thresholds"]:
        issues.append("monitoring signals or thresholds drifted")
    if dashboard.get("alerts") != expected["alerts"] or dashboard.get("separateQualityCostLatencySafety") is not True or dashboard.get("terminalState") != "verified":
        issues.append("monitoring alert separation or terminal state is wrong")
    dashboard_path = submission_path.parent / str(dashboard.get("dashboardDataPath", ""))
    verify_output(dashboard_path, dashboard.get("dashboardDataSha256"), issues, "dashboard")
    if dashboard_path.is_file() and json.loads(dashboard_path.read_text(encoding="utf-8")) != expected["dashboard"]:
        issues.append("dashboard data does not reproduce the fixed exercise")

    drift = by_id["drift-evidence"]
    if drift.get("injections") != REQUIRED_INJECTIONS or drift.get("predictive") != expected["drift"]["predictive"] or drift.get("rag") != expected["drift"]["rag"]:
        issues.append("both active degradation injections must be present and exact")
    if drift.get("detected") is not True or drift.get("evidenceLinks") != ["http-transcript.json", "dashboard-data.json"]:
        issues.append("drift evidence must be detected and linked")
    if "two authored injections" not in str(drift.get("claimBoundary", "")):
        issues.append("drift evidence claim boundary is missing")

    runbook = by_id["alert-runbook"]
    if runbook.get("alerts") != expected["alerts"] or [alert.get("alertId") for alert in runbook.get("alerts", [])] != REQUIRED_ALERT_IDS:
        issues.append("runbook must carry all four exact alerts")
    if len(runbook.get("steps", [])) < 7 or len(runbook.get("owners", [])) < 3 or len(runbook.get("stopConditions", [])) < 5:
        issues.append("runbook steps, owners, or stop conditions are incomplete")
    if runbook.get("automaticPromotion") is not False or "named human" not in str(runbook.get("escalation", "")):
        issues.append("runbook must preserve human hold/no-deploy authority")

    rollback = by_id["rollback-evidence"]
    if rollback.get("predictive") != expected["rollback"]["predictive"] or rollback.get("rag") != expected["rollback"]["rag"]:
        issues.append("rollback targets or replay evidence drifted")
    if rollback.get("verified") is not True or rollback.get("priorEvidencePreserved") is not True or rollback.get("promotionAfterRollback") is not False:
        issues.append("rollback must verify recovery, preserve prior evidence, and block promotion")
    rollback_path = submission_path.parent / str(rollback.get("receiptPath", ""))
    verify_output(rollback_path, rollback.get("receiptSha256"), issues, "rollback")
    if rollback_path.is_file() and json.loads(rollback_path.read_text(encoding="utf-8")) != expected["rollback"]:
        issues.append("rollback receipt file does not reproduce both recoveries")

    postmortem = by_id["postmortem"]
    if [event.get("time") for event in postmortem.get("timeline", [])] != ["T+00", "T+01", "T+02", "T+03", "T+04"]:
        issues.append("postmortem lifecycle timeline is incomplete")
    if len(postmortem.get("contributingConditions", [])) < 3 or len(postmortem.get("detectionGaps", [])) < 2 or len(postmortem.get("consequences", [])) < 3 or len(postmortem.get("correctiveActions", [])) < 3 or len(postmortem.get("unresolved", [])) < 3:
        issues.append("postmortem evidence is incomplete")
    if postmortem.get("blameless") is not True:
        issues.append("postmortem must retain its blameless system focus")

    governance = by_id["governance-approval"]
    reviewer = governance.get("reviewer", {})
    if reviewer.get("externalReviewComplete") is not False or "not an external reviewer" not in str(reviewer.get("name", "")):
        issues.append("reference package must not fabricate external review")
    if governance.get("decision") != "no-deploy" or governance.get("scope") != "local fictional dual-service exercise only":
        issues.append("governance decision must remain scoped no-deploy")
    if governance.get("issuedOn") != "2026-08-26" or governance.get("expiresOn") != "2026-09-26" or len(governance.get("revocationConditions", [])) < 5:
        issues.append("governance decision must be time-bounded and revocable")
    expected_criteria = ["purpose-risk-stop", "data-rights-minimisation", "subgroups-uncertainty", "human-authority-recourse", "challenge-incident-recovery", "evidence-decision-expiry"]
    if governance.get("responsibleAiCriteria") != expected_criteria or "different named human" not in str(governance.get("appeal", "")):
        issues.append("governance must map all Responsible AI criteria and preserve appeal")
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
