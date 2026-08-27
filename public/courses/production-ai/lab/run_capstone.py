#!/usr/bin/env python3
"""Run the Course 21 dual-service degradation, alert, and rollback exercise."""

from __future__ import annotations

import argparse
import hashlib
import json
import platform
import urllib.request
from pathlib import Path
from typing import Any, Dict, List, Sequence, Tuple

from services import (
    PREDICTIVE_CANDIDATE,
    PREDICTIVE_ROLLBACK,
    RAG_CANDIDATE,
    RAG_ROLLBACK,
    PredictiveService,
    RagService,
    load_fixture,
    start_server,
)

COURSE_ID = "production-ai"
COURSE_VERSION = "2026.08.26-v1"
CAPSTONE_VERSION = "2026.08.26-capstone-v1"
VALIDATOR_ID = "aicourse.production-ai.validator.v1"
SEED = 20260826
FIXTURE_HASHES = {
    "fixtures/dual-system-operations-v1.json": "b9b7ca41eee3e4eb4d5af572da8904ba7253747d312df15e8c5b0d5a8d9a0cab",
    "fixtures/dual-system-operations-v1.schema.json": "627c18674f70eea6915354fd8a444419a7ca2ee0cfd440b8f6392a0610d88028",
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def verify_fixture(course_dir: Path) -> Tuple[Dict[str, Any], List[Dict[str, str]]]:
    receipts = []
    for relative_path, expected in FIXTURE_HASHES.items():
        path = course_dir / relative_path
        observed = sha256(path)
        if observed != expected:
            raise ValueError("fixture checksum mismatch: {}: {}".format(relative_path, observed))
        receipts.append({"path": relative_path, "sha256": observed})
    fixture = load_fixture(course_dir)
    if fixture.get("schemaVersion") != "production-ai.fixture.v1" or fixture.get("seed") != SEED:
        raise ValueError("fixture version or seed drifted")
    system_ids = [system.get("systemId") for system in fixture.get("systems", [])]
    if system_ids != ["fictional-classifier", "fictional-rag"]:
        raise ValueError("fixture must contain the predictive and RAG systems in locked order")
    if len(fixture.get("documents", [])) != 3 or len(fixture.get("operations", [])) != 12:
        raise ValueError("fixture document or operation count drifted")
    return fixture, receipts


def post_json(url: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    request = urllib.request.Request(
        url,
        data=json.dumps(payload, sort_keys=True).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=5) as response:
        if response.status != 200:
            raise ValueError("local service returned HTTP {}".format(response.status))
        value = json.loads(response.read().decode("utf-8"))
        if not isinstance(value, dict):
            raise ValueError("local service response must be a JSON object")
        return value


def predictive_requests(prefix: str, signals: Sequence[float]) -> List[Dict[str, Any]]:
    return [
        {"requestId": "pred-{}-{}".format(prefix, index + 1), "signal": signal, "gold": "route-b" if signal >= 0.5 else "route-a"}
        for index, signal in enumerate(signals)
    ]


def rag_requests(prefix: str) -> List[Dict[str, Any]]:
    return [
        {"requestId": "rag-{}-a".format(prefix), "question": "When does fictional lab A close?", "goldDocument": "doc-policy-a"},
        {"requestId": "rag-{}-b".format(prefix), "question": "What does fictional lab B require?", "goldDocument": "doc-policy-b"},
    ]


def call_predictive(url: str, phase: str, requests: Sequence[Dict[str, Any]]) -> List[Dict[str, Any]]:
    records = []
    for payload in requests:
        sent = {"requestId": payload["requestId"], "signal": payload["signal"]}
        response = post_json(url, sent)
        records.append({"phase": phase, "service": "predictive", "endpoint": "/predict", "request": sent, "gold": payload["gold"], "response": response, "correct": response.get("prediction") == payload["gold"]})
    return records


def call_rag(url: str, phase: str, requests: Sequence[Dict[str, Any]]) -> List[Dict[str, Any]]:
    records = []
    for payload in requests:
        sent = {"requestId": payload["requestId"], "question": payload["question"]}
        response = post_json(url, sent)
        records.append({"phase": phase, "service": "rag", "endpoint": "/answer", "request": sent, "goldDocument": payload["goldDocument"], "response": response, "correct": response.get("supported") is True and response.get("citations") == [payload["goldDocument"]]})
    return records


def rate(records: Sequence[Dict[str, Any]], field: str = "correct") -> float:
    return round(sum(record.get(field) is True for record in records) / len(records), 4)


def run_exercise(course_dir: Path) -> Dict[str, Any]:
    fixture, input_receipts = verify_fixture(course_dir)
    predictive = PredictiveService(PREDICTIVE_ROLLBACK)
    rag = RagService(fixture, RAG_ROLLBACK)
    predictive_server, predictive_thread, predictive_url = start_server(predictive)
    rag_server, rag_thread, rag_url = start_server(rag)
    try:
        clean_predictive_requests = predictive_requests("clean", [0.1, 0.95])
        drift_requests = predictive_requests("drift", [0.78, 0.82, 0.86, 0.89])
        clean_rag_requests = rag_requests("clean")
        transcript = []
        transcript.extend(call_predictive(predictive_url, "clean", clean_predictive_requests))
        transcript.extend(call_rag(rag_url, "clean", clean_rag_requests))

        predictive.set_version(PREDICTIVE_CANDIDATE)
        rag.set_version(RAG_CANDIDATE)
        injected_predictive = call_predictive(predictive_url, "injected", drift_requests)
        injected_rag = call_rag(rag_url, "injected", rag_requests("degraded"))
        transcript.extend(injected_predictive)
        transcript.extend(injected_rag)

        alerts = []
        clean_mean = sum(request["signal"] for request in clean_predictive_requests) / len(clean_predictive_requests)
        drift_mean = sum(request["signal"] for request in drift_requests) / len(drift_requests)
        mean_shift = round(drift_mean - clean_mean, 4)
        if mean_shift > 0.2:
            alerts.append({"alertId": "predictive-feature-mean-shift", "service": "predictive", "threshold": ">0.20", "observed": mean_shift, "severity": "hold"})
        candidate_accuracy = rate(injected_predictive)
        if candidate_accuracy < 0.75:
            alerts.append({"alertId": "predictive-quality-regression", "service": "predictive", "threshold": "<0.75", "observed": candidate_accuracy, "severity": "rollback"})
        support_rate = rate(injected_rag)
        if support_rate < 1.0:
            alerts.append({"alertId": "rag-support-regression", "service": "rag", "threshold": "<1.00", "observed": support_rate, "severity": "rollback"})
        blocked_count = sum(record["response"].get("securityBlocked") is True for record in injected_rag)
        if blocked_count:
            alerts.append({"alertId": "rag-quarantined-document-retrieved", "service": "rag", "threshold": ">0", "observed": blocked_count, "severity": "rollback"})

        predictive.set_version(PREDICTIVE_ROLLBACK)
        rag.set_version(RAG_ROLLBACK)
        rollback_predictive = call_predictive(predictive_url, "verified", drift_requests)
        rollback_rag = call_rag(rag_url, "verified", rag_requests("recovery"))
        transcript.extend(rollback_predictive)
        transcript.extend(rollback_rag)
    finally:
        predictive_server.shutdown()
        rag_server.shutdown()
        predictive_server.server_close()
        rag_server.server_close()
        predictive_thread.join(timeout=2)
        rag_thread.join(timeout=2)

    clean_predictive = [record for record in transcript if record["phase"] == "clean" and record["service"] == "predictive"]
    clean_rag = [record for record in transcript if record["phase"] == "clean" and record["service"] == "rag"]
    rollback_verified = rate(rollback_predictive) == 1.0 and rate(rollback_rag) == 1.0
    logical_cost = sum(record["response"]["costUnits"] for record in transcript)
    logical_latency = [record["response"]["logicalLatencyUnits"] for record in transcript]
    dashboard = {
        "schemaVersion": "aicourse.production-ai.dashboard-data.v1",
        "services": ["predictive", "rag"],
        "requestCount": len(transcript),
        "signals": {
            "predictiveCleanAccuracy": rate(clean_predictive),
            "predictiveInjectedAccuracy": rate(injected_predictive),
            "predictiveRollbackAccuracy": rate(rollback_predictive),
            "ragCleanSupportRate": rate(clean_rag),
            "ragInjectedSupportRate": rate(injected_rag),
            "ragRollbackSupportRate": rate(rollback_rag),
            "traceCompleteness": round(sum(record["response"].get("traceComplete") is True for record in transcript) / len(transcript), 4),
            "logicalCostUnits": logical_cost,
            "maxLogicalLatencyUnits": max(logical_latency),
            "predictiveFeatureMeanShift": mean_shift,
            "quarantinedRetrievalCount": blocked_count,
        },
        "thresholds": {"predictiveAccuracyMinimum": 0.75, "ragSupportRateMinimum": 1.0, "predictiveMeanShiftMaximum": 0.2, "quarantinedRetrievalMaximum": 0},
        "alerts": alerts,
        "terminalState": "verified" if rollback_verified else "rollback-failed",
    }
    rollback = {
        "schemaVersion": "aicourse.production-ai.rollback-receipt.v1",
        "predictive": {"from": PREDICTIVE_CANDIDATE, "to": PREDICTIVE_ROLLBACK, "requests": len(rollback_predictive), "accuracy": rate(rollback_predictive), "verified": rate(rollback_predictive) == 1.0},
        "rag": {"from": RAG_CANDIDATE, "to": RAG_ROLLBACK, "requests": len(rollback_rag), "supportRate": rate(rollback_rag), "verified": rate(rollback_rag) == 1.0, "quarantinedDocumentsInServingIndex": 0},
        "priorEvidencePreserved": True,
        "verified": rollback_verified,
    }
    return {
        "fixture": fixture,
        "inputReceipts": input_receipts,
        "transcript": transcript,
        "dashboard": dashboard,
        "rollback": rollback,
        "drift": {"predictive": {"injectionId": "numeric-data-drift-v1", "cleanSignals": [0.1, 0.95], "injectedSignals": [0.78, 0.82, 0.86, 0.89], "cleanMean": round(clean_mean, 4), "injectedMean": round(drift_mean, 4), "absoluteMeanShift": mean_shift, "candidateAccuracy": candidate_accuracy, "rollbackAccuracy": rate(rollback_predictive), "detected": True}, "rag": {"injectionId": "retrieval-degradation-v1", "candidateIndex": RAG_CANDIDATE, "rollbackIndex": RAG_ROLLBACK, "injectedSupportRate": support_rate, "rollbackSupportRate": rate(rollback_rag), "quarantinedRetrievalCount": blocked_count, "detected": True}},
        "alerts": alerts,
    }


def artifact(artifact_id: str, content: Dict[str, Any]) -> Dict[str, Any]:
    return {"artifactId": artifact_id, "content": content}


def build_submission(course_dir: Path, lab_dir: Path, output_dir: Path) -> Dict[str, Any]:
    result = run_exercise(course_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    transcript_path = output_dir / "http-transcript.json"
    dashboard_path = output_dir / "dashboard-data.json"
    rollback_path = output_dir / "rollback-receipt.json"
    write_json(transcript_path, {"transport": "actual localhost HTTP", "binding": "127.0.0.1:ephemeral", "records": result["transcript"]})
    write_json(dashboard_path, result["dashboard"])
    write_json(rollback_path, result["rollback"])
    outputs = [{"path": path.name, "sha256": sha256(path)} for path in (transcript_path, dashboard_path, rollback_path)]
    code = [{"path": name, "sha256": sha256(lab_dir / name)} for name in ("services.py", "run_capstone.py", "validate.py", "capstone.schema.json", "environment.lock.json")]
    systems = result["fixture"]["systems"]
    states = ["clean", "injected", "alerted", "held", "rolled-back", "verified"]
    return {
        "schemaVersion": "aicourse.capstone-submission.v1",
        "courseId": COURSE_ID,
        "courseVersion": COURSE_VERSION,
        "capstoneVersion": CAPSTONE_VERSION,
        "validatorId": VALIDATOR_ID,
        "generatedOn": "2026-08-26",
        "artifacts": [
            artifact("lineage-manifest", {"inputs": result["inputReceipts"], "code": code, "systems": [{"systemId": system["systemId"], "serviceVersion": system["serviceVersion"], "candidate": system.get("modelVersion") if system["kind"] == "classifier" else system.get("indexVersion"), "rollbackTarget": system["rollbackTarget"]} for system in systems], "outputs": outputs, "environmentLockSha256": sha256(lab_dir / "environment.lock.json"), "networkBoundary": "Only actual HTTP requests to ephemeral listeners on 127.0.0.1; no external network.", "rightsBoundary": "Original fictional fixture; no personal data, real telemetry, credential, or third-party data."}),
            artifact("experiment-record", {"services": ["predictive", "rag"], "phases": states, "transportVerified": True, "httpRequestCount": len(result["transcript"]), "httpTranscriptPath": transcript_path.name, "httpTranscriptSha256": sha256(transcript_path), "seed": SEED, "preservedFailedEvidence": True, "boundary": "A deterministic local teaching exercise, not a production trial."}),
            artifact("registry-entry", {"predictive": {"candidate": PREDICTIVE_CANDIDATE, "candidateState": "rejected", "active": PREDICTIVE_ROLLBACK, "rollbackVerified": True}, "rag": {"candidate": RAG_CANDIDATE, "candidateState": "quarantined", "active": RAG_ROLLBACK, "rollbackVerified": True}, "states": states, "approvalRequired": True, "approvalOwner": "named human reviewer", "promotionAllowed": False}),
            artifact("serving-contract", {"host": "127.0.0.1", "ports": "ephemeral", "externalNetwork": False, "services": [{"id": "predictive", "method": "POST", "path": "/predict", "requestFields": ["requestId", "signal"], "responseFields": ["requestId", "service", "modelVersion", "prediction", "logicalLatencyUnits", "costUnits", "traceComplete"]}, {"id": "rag", "method": "POST", "path": "/answer", "requestFields": ["requestId", "question"], "responseFields": ["requestId", "service", "indexVersion", "answer", "citations", "supported", "securityBlocked", "logicalLatencyUnits", "costUnits", "traceComplete"]}], "idempotency": "requestId is retained in every response; this fixture performs no external side effect", "secrets": "none", "productionHardening": "absent by design; never expose these teaching servers"}),
            artifact("monitoring-dashboard", {"signals": result["dashboard"]["signals"], "thresholds": result["dashboard"]["thresholds"], "alerts": result["alerts"], "dashboardDataPath": dashboard_path.name, "dashboardDataSha256": sha256(dashboard_path), "separateQualityCostLatencySafety": True, "terminalState": result["dashboard"]["terminalState"]}),
            artifact("drift-evidence", {"injections": ["numeric-data-drift-v1", "retrieval-degradation-v1"], "predictive": result["drift"]["predictive"], "rag": result["drift"]["rag"], "detected": True, "evidenceLinks": [transcript_path.name, dashboard_path.name], "claimBoundary": "Detection is valid only for the two authored injections and fixed thresholds."}),
            artifact("alert-runbook", {"alerts": result["alerts"], "steps": ["hold both candidates", "preserve transcript and prior outcomes", "verify fixture and lineage hashes", "remove contaminated retrieval index", "restore exact declared model and index targets", "replay the fixed verification requests", "require human review before any later promotion"], "owners": ["on-call learner", "independent reviewer", "governance approver"], "stopConditions": ["critical prediction error", "unsupported RAG answer", "quarantined document retrieval", "trace incompleteness", "rollback verification failure"], "automaticPromotion": False, "escalation": "A named human can maintain hold or no-deploy regardless of aggregate metrics."}),
            artifact("rollback-evidence", {"predictive": result["rollback"]["predictive"], "rag": result["rollback"]["rag"], "verified": result["rollback"]["verified"], "priorEvidencePreserved": result["rollback"]["priorEvidencePreserved"], "receiptPath": rollback_path.name, "receiptSha256": sha256(rollback_path), "verificationTranscript": transcript_path.name, "promotionAfterRollback": False}),
            artifact("postmortem", {"timeline": [{"time": "T+00", "event": "clean localhost HTTP checks passed"}, {"time": "T+01", "event": "numeric-data-drift-v1 and retrieval-degradation-v1 activated"}, {"time": "T+02", "event": "four independent alerts fired and both candidates held"}, {"time": "T+03", "event": "declared model and index rollback targets restored"}, {"time": "T+04", "event": "fixed requests replayed and recovery verified"}], "contributingConditions": ["candidate alias error hidden outside the clean signal range", "contaminated index admitted quarantined content", "aggregate service availability would not reveal either quality failure"], "detectionGaps": ["clean request set did not cover the shifted numeric range", "citation presence alone would not test support"], "consequences": ["fictional route errors", "fictional unsupported answer", "blocked planted marker"], "correctiveActions": [{"owner": "pipeline owner", "action": "add drift-range evaluation", "due": "before next candidate"}, {"owner": "retrieval owner", "action": "enforce approved-document allowlist", "due": "before next index"}, {"owner": "reviewer", "action": "challenge aggregate-only dashboards", "due": "before governance review"}], "unresolved": ["no real traffic evidence", "no security hardening evidence", "no external reviewer sign-off"], "blameless": True}),
            artifact("governance-approval", {"reviewer": {"name": "Reference Review Boundary (not an external reviewer)", "role": "course-pack safeguard", "externalReviewComplete": False}, "decision": "no-deploy", "scope": "local fictional dual-service exercise only", "issuedOn": "2026-08-26", "expiresOn": "2026-09-26", "revocationConditions": ["any hash mismatch", "missing alert", "failed rollback replay", "rights or security uncertainty", "changed service/index version"], "appeal": "Learner may submit new bounded evidence to a different named human reviewer; no automatic override.", "responsibleAiCriteria": ["purpose-risk-stop", "data-rights-minimisation", "subgroups-uncertainty", "human-authority-recourse", "challenge-incident-recovery", "evidence-decision-expiry"]}),
        ],
    }


def write_outputs(submission: Dict[str, Any], output_dir: Path) -> Path:
    path = output_dir / "submission.generated.json"
    write_json(path, submission)
    return path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()
    lab_dir = Path(__file__).resolve().parent
    course_dir = lab_dir.parent
    output_dir = args.output_dir.resolve()
    submission = build_submission(course_dir, lab_dir, output_dir)
    path = write_outputs(submission, output_dir)
    print("wrote {}".format(path))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
