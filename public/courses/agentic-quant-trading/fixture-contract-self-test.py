#!/usr/bin/env python3
"""Deterministic offline contract self-test for the Course 17 fixtures.

The utility checks hashes, synthetic identity, chronology, declared timestamp
ordering, and selected fail-closed policy fields. It does not execute a
strategy, order lifecycle, fill, cost model, risk calculation, P&L calculation,
or reconciliation. Passing is not performance evidence or market authority.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any


SCRIPT_DIRECTORY = Path(__file__).resolve().parent
SCRIPT_NAME = "fixture-contract-self-test.py"
ASSERTION_IDS = (
    "fixture-integrity",
    "synthetic-identity",
    "bar-date-ordering",
    "timestamp-contract",
    "decision-input-availability",
    "declared-boundary-policy-shape",
    "performance-metrics-not-computable",
)
HASHED_FIXTURE_NAMES = (
    "market-regime-synthetic-v1.csv",
    "news-signals-synthetic-v1.json",
    "risk-policy.template.json",
    SCRIPT_NAME,
    "LICENSE.txt",
)
REQUIRED_APPROVAL_FAIL_CLOSED_ON = frozenset(
    {
        "missing",
        "expired",
        "reused",
        "revoked",
        "issuer-proof-invalid",
        "intent-hash-mismatch",
        "policy-version-mismatch",
    }
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def parse_timestamp(value: Any) -> datetime:
    if not isinstance(value, str) or not value.strip():
        raise ValueError("timestamp-missing-or-not-string")
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise ValueError("timestamp-missing-timezone")
    return parsed.astimezone(timezone.utc)


def load_json_object(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as handle:
        value = json.load(handle)
    if not isinstance(value, dict):
        raise ValueError("expected-json-object")
    return value


def is_real_number(value: Any) -> bool:
    """Accept JSON numbers while rejecting booleans, which subclass int in Python."""
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def is_positive_integer(value: Any) -> bool:
    return isinstance(value, int) and not isinstance(value, bool) and value >= 1


def nested_object(
    parent: dict[str, Any],
    key: str,
    failures: list[str],
    failure_path: str,
) -> dict[str, Any]:
    value = parent.get(key)
    if not isinstance(value, dict):
        failures.append(failure_path)
        return {}
    return value


def is_exact_string_set(value: Any, expected: frozenset[str]) -> bool:
    return (
        isinstance(value, list)
        and all(isinstance(item, str) for item in value)
        and len(value) == len(expected)
        and frozenset(value) == expected
    )


def append_assertion(
    assertions: list[dict[str, Any]],
    assertion_id: str,
    passed: bool,
    reason_code: str | None,
    details: dict[str, Any],
) -> None:
    assertions.append(
        {
            "id": assertion_id,
            "passed": passed,
            "reason_code": None if passed else reason_code,
            "details": details,
        }
    )


def blocked_assertions(
    assertions: list[dict[str, Any]],
    completed_ids: set[str],
    reason_code: str,
) -> None:
    for assertion_id in ASSERTION_IDS:
        if assertion_id not in completed_ids:
            append_assertion(
                assertions,
                assertion_id,
                False,
                reason_code,
                {"blocked_by": reason_code},
            )


def receipt(
    fixture_directory: Path,
    assertions: list[dict[str, Any]],
) -> dict[str, Any]:
    failure_reasons = [
        assertion["reason_code"]
        for assertion in assertions
        if not assertion["passed"] and assertion["reason_code"]
    ]
    performance_assertion = next(
        (
            assertion
            for assertion in assertions
            if assertion.get("id") == "performance-metrics-not-computable"
        ),
        None,
    )
    performance_details = (
        performance_assertion.get("details", {})
        if isinstance(performance_assertion, dict)
        else {}
    )
    if performance_assertion and performance_assertion.get("passed") is True:
        performance_status = "not-computable"
        performance_reason = (
            "The fixture pack has no complete strategy-return, position, order-fill-cost, "
            "or portfolio-equity series needed for the named performance metrics."
        )
    elif performance_details.get("computable_metrics"):
        performance_status = "capability-present-review-required"
        performance_reason = (
            "One or more metric input capabilities are present, so this utility cannot "
            "claim that performance metrics are not computable."
        )
    else:
        performance_status = "indeterminate"
        performance_reason = (
            "Fixture integrity or prerequisite assertions failed before metric "
            "computability could be established."
        )
    return {
        "schema": "aicourse.fixture-contract-self-test.v2",
        "status": "pass" if not failure_reasons else "fail",
        "illustrative_only": True,
        "eligible_for_human_review": not failure_reasons,
        "authorises_replay": False,
        "authorises_market_action": False,
        "network_client_code_present": False,
        "network_isolation_verified": False,
        "network_isolation_note": (
            "This utility contains no network-client path, but it does not attest to "
            "operating-system-level network isolation."
        ),
        "fixture_scope": "same-directory-local-files",
        "performance_metrics": {
            "status": performance_status,
            "missing_inputs": performance_details.get("missing_inputs", []),
            "computable_metrics": performance_details.get("computable_metrics", []),
            "reason": performance_reason,
        },
        "assertions": assertions,
        "failure_reasons": failure_reasons,
        "disclaimer": (
            "Fixture-contract checks only. Passing is not a no-look-ahead strategy proof, "
            "performance evidence, external replay permission, investment advice, or market authority."
        ),
    }


def run_self_test(fixture_directory: Path) -> dict[str, Any]:
    fixture_directory = fixture_directory.resolve()
    provenance_path = fixture_directory / "provenance.v1.json"
    assertions: list[dict[str, Any]] = []
    completed_ids: set[str] = set()

    integrity_failures: list[str] = []
    actual_hashes: dict[str, str] = {}
    provenance: dict[str, Any] | None = None
    try:
        provenance = load_json_object(provenance_path)
    except (OSError, ValueError, json.JSONDecodeError) as error:
        integrity_failures.append(f"provenance-unreadable:{type(error).__name__}")

    provenance_records: dict[str, dict[str, Any]] = {}
    raw_provenance_records = (provenance or {}).get("files")
    if not isinstance(raw_provenance_records, list):
        integrity_failures.append("provenance.files:not-array")
        raw_provenance_records = []
    for index, record in enumerate(raw_provenance_records):
        if not isinstance(record, dict):
            integrity_failures.append(f"provenance.files[{index}]:not-object")
            continue
        path_value = record.get("path")
        hash_value = record.get("sha256")
        if not isinstance(path_value, str) or not isinstance(hash_value, str):
            integrity_failures.append(f"provenance.files[{index}]:invalid-record")
            continue
        if path_value in provenance_records:
            integrity_failures.append(f"provenance.files[{index}]:duplicate-path")
            continue
        provenance_records[path_value] = record
    for name in HASHED_FIXTURE_NAMES:
        path = fixture_directory / name
        if not path.is_file():
            integrity_failures.append(f"missing:{name}")
            continue
        try:
            actual_hash = sha256(path)
        except OSError as error:
            integrity_failures.append(f"unreadable:{name}:{type(error).__name__}")
            continue
        actual_hashes[name] = actual_hash
        expected_hash = provenance_records.get(name, {}).get("sha256")
        if expected_hash != actual_hash:
            integrity_failures.append(f"sha256-mismatch:{name}")

    append_assertion(
        assertions,
        "fixture-integrity",
        not integrity_failures,
        "fixture-integrity-failed" if integrity_failures else None,
        {"failures": integrity_failures, "sha256": actual_hashes},
    )
    completed_ids.add("fixture-integrity")
    if integrity_failures:
        blocked_assertions(assertions, completed_ids, "blocked-by-fixture-integrity")
        return receipt(fixture_directory, assertions)

    try:
        with (fixture_directory / "market-regime-synthetic-v1.csv").open(
            newline="", encoding="utf-8"
        ) as handle:
            bars = list(csv.DictReader(handle))
        events = load_json_object(fixture_directory / "news-signals-synthetic-v1.json")
        policy = load_json_object(fixture_directory / "risk-policy.template.json")
    except (OSError, ValueError, json.JSONDecodeError, csv.Error) as error:
        blocked_assertions(
            assertions,
            completed_ids,
            f"fixture-parse-failed:{type(error).__name__}",
        )
        return receipt(fixture_directory, assertions)

    raw_event_items = events.get("items")
    event_item_structure_failures: list[str] = []
    if not isinstance(raw_event_items, list):
        event_item_structure_failures.append("events.items:not-array")
        event_items: list[Any] = []
    else:
        event_items = raw_event_items
        if not event_items:
            event_item_structure_failures.append("events.items:empty")
    asset_ids = {row.get("asset_id") for row in bars}
    regime_feature_values = {
        str(row.get("evaluation_regime_feature_eligible", "")).lower()
        for row in bars
    }
    synthetic_identity_ok = (
        bool(bars)
        and not event_item_structure_failures
        and asset_ids == {"SYN-A"}
        and events.get("assetId") == "SYN-A"
        and regime_feature_values == {"false"}
    )
    append_assertion(
        assertions,
        "synthetic-identity",
        synthetic_identity_ok,
        "synthetic-identity-or-regime-boundary-failed" if not synthetic_identity_ok else None,
        {
            "bar_asset_ids": sorted(str(value) for value in asset_ids),
            "event_asset_id": events.get("assetId"),
            "event_item_structure_failures": event_item_structure_failures,
            "evaluation_regime_feature_eligible_values": sorted(regime_feature_values),
        },
    )
    completed_ids.add("synthetic-identity")

    date_errors: list[str] = []
    bar_dates: list[date] = []
    for row_number, row in enumerate(bars, start=2):
        try:
            bar_dates.append(date.fromisoformat(str(row.get("bar_date", ""))))
        except ValueError:
            date_errors.append(f"row-{row_number}:invalid-bar-date")
    bar_date_ordering_ok = (
        not date_errors
        and len(bar_dates) > 1
        and bar_dates == sorted(bar_dates)
        and len(set(bar_dates)) == len(bar_dates)
    )
    append_assertion(
        assertions,
        "bar-date-ordering",
        bar_date_ordering_ok,
        "bar-date-ordering-failed" if not bar_date_ordering_ok else None,
        {
            "errors": date_errors,
            "rows": len(bar_dates),
            "first_bar_date": bar_dates[0].isoformat() if bar_dates else None,
            "last_bar_date": bar_dates[-1].isoformat() if bar_dates else None,
            "scope_note": (
                "This checks unique ascending bar dates only. It does not invent, validate, "
                "or attest to a train-validation split."
            ),
        },
    )
    completed_ids.add("bar-date-ordering")

    timestamp_failures: list[str] = list(event_item_structure_failures)
    decision_failures: list[str] = []
    for row_number, row in enumerate(bars, start=2):
        try:
            observed = parse_timestamp(row.get("observed_through"))
            available = parse_timestamp(row.get("available_at"))
            ingested = parse_timestamp(row.get("ingested_at"))
            known = parse_timestamp(row.get("known_at"))
            decision = parse_timestamp(row.get("decision_at"))
            regime_known = parse_timestamp(row.get("evaluation_regime_known_at"))
            if not observed <= available <= ingested <= known:
                timestamp_failures.append(f"bar-row-{row_number}:clock-order")
            if row.get("calendar") != "SYN-WEEKDAY-UTC-v1":
                timestamp_failures.append(f"bar-row-{row_number}:calendar")
            if row.get("timezone") != "UTC":
                timestamp_failures.append(f"bar-row-{row_number}:timezone")
            if row.get("bar_label_semantics") != "synthetic-session-close":
                timestamp_failures.append(f"bar-row-{row_number}:bar-label-semantics")
            if regime_known <= observed:
                timestamp_failures.append(f"bar-row-{row_number}:regime-known-too-early")
            if regime_known <= decision:
                timestamp_failures.append(
                    f"bar-row-{row_number}:evaluation-regime-known-by-historical-decision"
                )
            if known > decision:
                decision_failures.append(f"bar-row-{row_number}:known-after-decision")
        except (KeyError, TypeError, ValueError) as error:
            timestamp_failures.append(
                f"bar-row-{row_number}:timestamp-error:{type(error).__name__}"
            )

    for index, item in enumerate(event_items):
        if not isinstance(item, dict):
            timestamp_failures.append(f"event-{index}:not-object")
            continue
        event_id = str(item.get("id", index))
        try:
            event_at = parse_timestamp(item.get("eventAt"))
            published = parse_timestamp(item.get("publishedAt"))
            available = parse_timestamp(item.get("availableAt"))
            ingested = parse_timestamp(item.get("ingestedAt"))
            known = parse_timestamp(item.get("knownAt"))
            decision = parse_timestamp(item.get("decisionAt"))
            if not event_at <= published <= available <= ingested <= known:
                timestamp_failures.append(f"{event_id}:clock-order")
            if known > decision:
                decision_failures.append(f"{event_id}:known-after-decision")
        except (TypeError, ValueError) as error:
            timestamp_failures.append(
                f"{event_id}:timestamp-error:{type(error).__name__}"
            )

    append_assertion(
        assertions,
        "timestamp-contract",
        not timestamp_failures,
        "timestamp-contract-failed" if timestamp_failures else None,
        {
            "failures": timestamp_failures,
            "scope_note": (
                "Checks declared field shape and ordering only; it does not execute a feature join, "
                "signal, strategy, or fill and therefore is not a no-look-ahead proof."
            ),
        },
    )
    completed_ids.add("timestamp-contract")

    append_assertion(
        assertions,
        "decision-input-availability",
        not decision_failures,
        "known-at-after-decision" if decision_failures else None,
        {
            "failures": decision_failures,
            "rule": "A declared fixture row is decision-eligible only when known_at <= decision_at.",
            "boundary": (
                "Eligibility under declared timestamps is not proof that learner code actually uses "
                "only eligible inputs."
            ),
        },
    )
    completed_ids.add("decision-input-availability")

    policy_failures: list[str] = []
    boundary = nested_object(
        policy, "executionBoundary", policy_failures, "executionBoundary:not-object"
    )
    fail_closed = nested_object(
        policy, "failClosed", policy_failures, "failClosed:not-object"
    )
    limits = nested_object(policy, "limits", policy_failures, "limits:not-object")
    approval = nested_object(
        policy, "intentApproval", policy_failures, "intentApproval:not-object"
    )
    human_review = nested_object(
        policy, "humanReview", policy_failures, "humanReview:not-object"
    )
    if policy.get("mode") != "local-synthetic-replay":
        policy_failures.append("mode")
    for key in (
        "networkAccess",
        "externalAccounts",
        "brokerConnections",
        "credentialsAccepted",
        "liveOrderCapability",
    ):
        if boundary.get(key) is not False:
            policy_failures.append(f"executionBoundary.{key}")
    if boundary.get("remoteEndpoints") != []:
        policy_failures.append("executionBoundary.remoteEndpoints")
    if fail_closed.get("enabled") is not True:
        policy_failures.append("failClosed.enabled")
    if fail_closed.get("defaultDecision") != "deny":
        policy_failures.append("failClosed.defaultDecision")
    if fail_closed.get("overrideAllowed") is not False:
        policy_failures.append("failClosed.overrideAllowed")
    if fail_closed.get("onMissingEvidence") != "deny":
        policy_failures.append("failClosed.onMissingEvidence")
    if fail_closed.get("onStaleData") != "deny":
        policy_failures.append("failClosed.onStaleData")
    if fail_closed.get("onAssertionFailure") != "deny":
        policy_failures.append("failClosed.onAssertionFailure")
    if fail_closed.get("failureReasonsRequired") is not True:
        policy_failures.append("failClosed.failureReasonsRequired")

    gross_limit = nested_object(
        limits, "maxGrossExposure", policy_failures, "limits.maxGrossExposure:not-object"
    )
    position_limit = nested_object(
        limits, "maxPositionWeight", policy_failures, "limits.maxPositionWeight:not-object"
    )
    intent_rate = nested_object(
        limits, "maxIntentRate", policy_failures, "limits.maxIntentRate:not-object"
    )
    gross = gross_limit.get("value")
    position = position_limit.get("value")
    if (
        not is_real_number(gross)
        or not is_real_number(position)
        or not 0 < position <= gross <= 1
    ):
        policy_failures.append("declared-exposure-limit-shape")
    if (
        not is_positive_integer(intent_rate.get("value"))
        or not is_positive_integer(intent_rate.get("windowSeconds"))
        or intent_rate.get("idempotentRetriesCountAsNew") is not False
    ):
        policy_failures.append("declared-intent-rate-limit-shape")

    required_approval_fields = {
        "approvalId",
        "approvalEventId",
        "approverId",
        "approvedAt",
        "expiresAt",
        "intentSha256",
        "policyVersion",
        "proofType",
        "proofLocator",
    }
    issuance_boundary = nested_object(
        approval,
        "issuanceBoundary",
        policy_failures,
        "intentApproval.issuanceBoundary:not-object",
    )
    accepted_proof_types = frozenset(
        {
            "append-only-human-approval-event-with-acl-evidence",
            "detached-signature-with-pinned-public-key",
        }
    )
    if (
        approval.get("requiredBeforeSubmittedState") is not True
        or approval.get("namedHumanRequired") is not True
        or approval.get("agentMayApprove") is not False
        or approval.get("singleUse") is not True
        or approval.get("mustBindExactIntentSha256") is not True
        or approval.get("mustBindPolicyVersion") is not True
        or not is_exact_string_set(
            approval.get("requiredFields"), frozenset(required_approval_fields)
        )
        or not is_exact_string_set(
            approval.get("failClosedOn"), REQUIRED_APPROVAL_FAIL_CLOSED_ON
        )
        or issuance_boundary.get("humanControlledChannelRequired") is not True
        or issuance_boundary.get("agentWriteAccess") is not False
        or not is_exact_string_set(
            issuance_boundary.get("acceptedProofTypes"), accepted_proof_types
        )
        or issuance_boundary.get("verificationRequiredBeforeConsumption") is not True
        or issuance_boundary.get("revocationCheckRequiredBeforeConsumption") is not True
        or issuance_boundary.get("consumptionLedgerRequired") is not True
    ):
        policy_failures.append("intent-approval-contract-shape")
    if (
        human_review.get("required") is not True
        or human_review.get("eligibilityIsAuthorisation") is not False
        or human_review.get("reviewCannotEnableNetworkOrExternalExecution") is not True
    ):
        policy_failures.append("human-review-boundary-shape")
    required_assertions = policy.get("requiredAssertions")
    if not isinstance(required_assertions, list) or tuple(required_assertions) != ASSERTION_IDS:
        policy_failures.append("required-assertion-set")

    append_assertion(
        assertions,
        "declared-boundary-policy-shape",
        not policy_failures,
        "declared-policy-shape-failed" if policy_failures else None,
        {
            "failures": policy_failures,
            "scope_note": (
                "This checks selected declarative fields only. It does not calculate portfolio risk, "
                "execute an intent, validate an approval receipt instance, or test a kill switch."
            ),
        },
    )
    completed_ids.add("declared-boundary-policy-shape")

    def normalize_field_name(value: Any) -> str:
        return "".join(character for character in str(value).lower() if character.isalnum())

    bar_fields = {normalize_field_name(key) for key in bars[0].keys()} if bars else set()
    event_fields: set[str] = set()
    for item in event_items:
        if isinstance(item, dict):
            event_fields.update(normalize_field_name(key) for key in item.keys())
    return_or_pnl_fields = {
        "strategyreturn",
        "strategyreturns",
        "portfolioreturn",
        "portfolioreturns",
        "pnl",
        "profitandloss",
    }
    benchmark_or_risk_free_fields = {
        "benchmarkreturn",
        "benchmarkreturns",
        "riskfreereturn",
        "riskfreereturns",
    }
    equity_fields = {"portfolioequity", "equitycurve", "netassetvalue", "nav"}
    position_fields = {
        "position",
        "positions",
        "positionweight",
        "positionweights",
        "holdingweight",
        "holdingweights",
    }
    order_fields = {"orderid", "orderquantity", "ordernotional"}
    fill_fields = {"fillid", "fillquantity", "fillprice"}
    cost_fields = {"fee", "fees", "slippage", "transactioncost", "transactioncosts"}
    capabilities = {
        "return_or_pnl_series": sorted(bar_fields & return_or_pnl_fields),
        "benchmark_or_risk_free_series": sorted(
            bar_fields & benchmark_or_risk_free_fields
        ),
        "portfolio_equity_series": sorted(bar_fields & equity_fields),
        "position_series": sorted(bar_fields & position_fields),
        "order_fields": sorted(event_fields & order_fields),
        "fill_fields": sorted(event_fields & fill_fields),
        "cost_fields": sorted((bar_fields | event_fields) & cost_fields),
    }
    computable_metrics: list[str] = []
    if capabilities["return_or_pnl_series"]:
        computable_metrics.append("return-risk-or-pnl-metrics")
    if capabilities["portfolio_equity_series"]:
        computable_metrics.append("maximum-drawdown")
    if capabilities["position_series"]:
        computable_metrics.append("turnover")
    if (
        capabilities["order_fields"]
        and capabilities["fill_fields"]
        and capabilities["cost_fields"]
    ):
        computable_metrics.append("execution-cost-summary")
    performance_not_computable = not computable_metrics
    missing_inputs: list[str] = []
    if not capabilities["return_or_pnl_series"]:
        missing_inputs.append("strategy return series")
    if not capabilities["benchmark_or_risk_free_series"]:
        missing_inputs.append("benchmark or risk-free return series")
    if not capabilities["position_series"]:
        missing_inputs.append("position series")
    if not capabilities["order_fields"] or not capabilities["fill_fields"]:
        missing_inputs.append("order and fill series")
    if not capabilities["cost_fields"]:
        missing_inputs.append("fee and slippage series")
    if not capabilities["portfolio_equity_series"]:
        missing_inputs.append("portfolio equity series")
    append_assertion(
        assertions,
        "performance-metrics-not-computable",
        performance_not_computable,
        "performance-input-capability-present" if not performance_not_computable else None,
        {
            "status": (
                "not-computable"
                if performance_not_computable
                else "capability-present-review-required"
            ),
            "capabilities": capabilities,
            "computable_metrics": computable_metrics,
            "missing_inputs": missing_inputs,
            "scope_note": (
                "Capabilities are assessed from series-bearing bar fields and coherent "
                "order-fill-cost field groups, not from a single similarly named event key."
            ),
        },
    )
    completed_ids.add("performance-metrics-not-computable")

    return receipt(fixture_directory, assertions)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Run the Course 17 local synthetic fixture-contract self-test."
    )
    parser.add_argument(
        "--fixture-dir",
        type=Path,
        default=SCRIPT_DIRECTORY,
        help="Directory containing the bundled Course 17 fixtures.",
    )
    parser.add_argument(
        "--self-test",
        action="store_true",
        help="Run the seven bounded fixture-contract assertions.",
    )
    arguments = parser.parse_args()
    if not arguments.self_test:
        parser.error("--self-test is required; this utility has no strategy or execution mode")
    result = run_self_test(arguments.fixture_dir)
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["status"] == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main())
