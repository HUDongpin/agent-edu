#!/usr/bin/env python3
"""Deterministic, offline self-test for the Course 17 synthetic replay pack.

This script uses Python's standard library and local files only. It contains no
network client, remote endpoint, external account integration, or order path.
Passing assertions means only that the bundled educational fixtures satisfy this
small contract; it is not performance evidence or permission for market action.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
from datetime import date, datetime, time, timezone
from pathlib import Path
from typing import Any


SCRIPT_DIRECTORY = Path(__file__).resolve().parent
FORMULA = {
    "id": "aicourse.synthetic-evidence-decay",
    "version": "1.0.0",
    "base": {
        "sharpe_like_score": 2.34,
        "maximum_drawdown_percent": -8.1,
        "annual_turnover": 9.4,
    },
    "expressions": {
        "sharpe_like_score": "max(0.10, 2.34 - 0.51*chronological - 0.37*point_in_time - 0.28*costs)",
        "maximum_drawdown_percent": "-(8.1 + 2.6*chronological + 1.8*point_in_time + 1.1*costs)",
        "annual_turnover": "6.8 if costs else 9.4",
    },
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def parse_timestamp(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise ValueError(f"Timestamp is missing a timezone: {value}")
    return parsed.astimezone(timezone.utc)


def load_json(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as handle:
        value = json.load(handle)
    if not isinstance(value, dict):
        raise ValueError(f"Expected a JSON object: {path.name}")
    return value


def append_assertion(
    assertions: list[dict[str, Any]],
    assertion_id: str,
    passed: bool,
    failure_reason: str,
    details: dict[str, Any],
) -> None:
    assertions.append(
        {
            "id": assertion_id,
            "passed": passed,
            "failure_reason": None if passed else failure_reason,
            "details": details,
        }
    )


def illustrative_metrics() -> dict[str, float]:
    chronological = point_in_time = costs = 1
    return {
        "sharpe_like_score": round(
            max(0.10, 2.34 - 0.51 * chronological - 0.37 * point_in_time - 0.28 * costs),
            2,
        ),
        "maximum_drawdown_percent": round(
            -(8.1 + 2.6 * chronological + 1.8 * point_in_time + 1.1 * costs),
            1,
        ),
        "annual_turnover": 6.8 if costs else 9.4,
    }


def run_self_test(fixture_directory: Path) -> dict[str, Any]:
    fixture_directory = fixture_directory.resolve()
    csv_path = fixture_directory / "market-regime-synthetic-v1.csv"
    events_path = fixture_directory / "news-signals-synthetic-v1.json"
    policy_path = fixture_directory / "risk-policy.template.json"
    provenance_path = fixture_directory / "provenance.v1.json"

    with csv_path.open(newline="", encoding="utf-8") as handle:
        bars = list(csv.DictReader(handle))
    events = load_json(events_path)
    policy = load_json(policy_path)
    provenance = load_json(provenance_path)

    assertions: list[dict[str, Any]] = []

    provenance_records = {
        record.get("path"): record
        for record in provenance.get("files", [])
        if isinstance(record, dict)
    }
    integrity_failures: list[str] = []
    actual_hashes: dict[str, str] = {}
    for name in (
        "market-regime-synthetic-v1.csv",
        "news-signals-synthetic-v1.json",
        "risk-policy.template.json",
        "local-replay-lab.py",
    ):
        path = fixture_directory / name
        if not path.is_file():
            integrity_failures.append(f"missing:{name}")
            continue
        actual_hash = sha256(path)
        actual_hashes[name] = actual_hash
        expected_hash = provenance_records.get(name, {}).get("sha256")
        if expected_hash != actual_hash:
            integrity_failures.append(f"sha256-mismatch:{name}")
    append_assertion(
        assertions,
        "fixture-integrity",
        not integrity_failures,
        "; ".join(integrity_failures) or "fixture hash verification failed",
        {"sha256": actual_hashes},
    )

    asset_ids = {row.get("asset_id") for row in bars}
    event_asset = events.get("assetId")
    synthetic_identity_ok = bool(bars) and asset_ids == {"SYN-A"} and event_asset == "SYN-A"
    append_assertion(
        assertions,
        "synthetic-identity",
        synthetic_identity_ok,
        "fixtures must contain only the fictional SYN-A identifier",
        {"bar_asset_ids": sorted(str(value) for value in asset_ids), "event_asset_id": event_asset},
    )

    bar_dates = [date.fromisoformat(row["bar_date"]) for row in bars]
    split_index = max(1, min(len(bar_dates) - 1, int(len(bar_dates) * 0.6))) if len(bar_dates) > 1 else 0
    chronological_ok = (
        len(bar_dates) > 1
        and bar_dates == sorted(bar_dates)
        and len(set(bar_dates)) == len(bar_dates)
        and max(bar_dates[:split_index]) < min(bar_dates[split_index:])
    )
    append_assertion(
        assertions,
        "chronological-split",
        chronological_ok,
        "training and validation dates must be unique, ordered, and non-overlapping",
        {
            "training_rows": split_index,
            "validation_rows": len(bar_dates) - split_index,
            "training_end": bar_dates[split_index - 1].isoformat() if split_index else None,
            "validation_start": bar_dates[split_index].isoformat() if split_index < len(bar_dates) else None,
        },
    )

    bar_timestamp_failures = [
        row["bar_date"]
        for row in bars
        if parse_timestamp(row["known_at"])
        <= datetime.combine(date.fromisoformat(row["bar_date"]), time(23, 59), tzinfo=timezone.utc)
    ]
    event_timestamp_failures = [
        item.get("id", "unknown")
        for item in events.get("items", [])
        if parse_timestamp(item["knownAt"]) < parse_timestamp(item["publishedAt"])
    ]
    as_of_ok = not bar_timestamp_failures and not event_timestamp_failures
    append_assertion(
        assertions,
        "as-of-timestamps",
        as_of_ok,
        "a fixture timestamp would make information available before its observation or publication",
        {
            "bars_known_too_early": bar_timestamp_failures,
            "events_known_before_publication": event_timestamp_failures,
        },
    )

    unavailable_bar_inputs: list[str] = []
    for index in range(1, len(bars)):
        decision_at = datetime.combine(bar_dates[index], time(0, 10), tzinfo=timezone.utc)
        prior_known_at = parse_timestamp(bars[index - 1]["known_at"])
        if prior_known_at > decision_at:
            unavailable_bar_inputs.append(bars[index - 1]["bar_date"])
    no_lookahead_ok = not unavailable_bar_inputs
    append_assertion(
        assertions,
        "no-lookahead-leakage",
        no_lookahead_ok,
        "a replay input was used before its known-at timestamp",
        {
            "decision_rule": "At 00:10 UTC on bar date t, use only the preceding row when known_at <= decision_at.",
            "unavailable_bar_inputs": unavailable_bar_inputs,
        },
    )

    boundary = policy.get("executionBoundary", {})
    fail_closed = policy.get("failClosed", {})
    limits = policy.get("limits", {})
    risk_failures: list[str] = []
    if policy.get("mode") != "local-synthetic-replay":
        risk_failures.append("mode-must-be-local-synthetic-replay")
    for key in ("networkAccess", "externalAccounts", "brokerConnections", "credentialsAccepted", "liveOrderCapability"):
        if boundary.get(key) is not False:
            risk_failures.append(f"executionBoundary.{key}-must-be-false")
    if boundary.get("remoteEndpoints") != []:
        risk_failures.append("executionBoundary.remoteEndpoints-must-be-empty")
    if fail_closed.get("enabled") is not True or fail_closed.get("defaultDecision") != "deny":
        risk_failures.append("failClosed-must-default-to-deny")
    if fail_closed.get("overrideAllowed") is not False:
        risk_failures.append("failClosed.overrideAllowed-must-be-false")
    gross = limits.get("maxGrossExposure", {}).get("value")
    position = limits.get("maxPositionWeight", {}).get("value")
    if not isinstance(gross, (int, float)) or not isinstance(position, (int, float)) or not 0 < position <= gross <= 1:
        risk_failures.append("fictional-exposure-limits-are-invalid")
    append_assertion(
        assertions,
        "fail-closed-risk-policy",
        not risk_failures,
        "; ".join(risk_failures) or "risk policy assertion failed",
        {
            "mode": policy.get("mode"),
            "default_decision": fail_closed.get("defaultDecision"),
            "violations": risk_failures,
        },
    )

    metrics = illustrative_metrics()
    formula_ok = metrics == {
        "sharpe_like_score": 1.18,
        "maximum_drawdown_percent": -13.6,
        "annual_turnover": 6.8,
    }
    append_assertion(
        assertions,
        "formula-determinism",
        formula_ok,
        "illustrative formula output changed without a version change",
        {"formula": FORMULA, "all_three_evidence_claims_selected": metrics},
    )

    failure_reasons = [
        assertion["failure_reason"]
        for assertion in assertions
        if not assertion["passed"] and assertion["failure_reason"]
    ]
    return {
        "schema": "aicourse.local-synthetic-replay-self-test.v1",
        "status": "pass" if not failure_reasons else "fail",
        "illustrative_only": True,
        "eligible_for_human_review": not failure_reasons,
        "authorises_market_action": False,
        "network_calls": 0,
        "fixture_directory": str(fixture_directory),
        "formula": FORMULA,
        "assertions": assertions,
        "failure_reasons": failure_reasons,
        "disclaimer": (
            "Synthetic educational replay only. Passing these assertions is not performance evidence, "
            "investment advice, or permission for market action."
        ),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Run the Course 17 deterministic local-fixture self-test.")
    parser.add_argument(
        "--fixture-dir",
        type=Path,
        default=SCRIPT_DIRECTORY,
        help="Local directory containing the bundled Course 17 fixtures (default: script directory).",
    )
    parser.add_argument(
        "--self-test",
        action="store_true",
        help="Run integrity, chronology, point-in-time, formula, and fail-closed assertions.",
    )
    arguments = parser.parse_args()
    if not arguments.self_test:
        parser.error("--self-test is required; this utility has no execution mode beyond local verification")
    result = run_self_test(arguments.fixture_dir)
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["status"] == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main())
