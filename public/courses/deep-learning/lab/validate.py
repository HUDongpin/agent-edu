#!/usr/bin/env python3
"""Compatibility dispatcher that preserves reference/capstone separation."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from validate_capstone import VALIDATOR_ID as CAPSTONE_VALIDATOR_ID
from validate_capstone import validate_capstone
from validate_reference import validate_reference
from run_experiment import VALIDATOR_ID as REFERENCE_VALIDATOR_ID


def validate_submission(path: Path):
    try:
        package = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        return [f"package is unreadable JSON: {error}"]
    mode = package.get("mode") if isinstance(package, dict) else None
    if mode == "reference-example":
        return validate_reference(path)
    if mode == "learner-final":
        return validate_capstone(path)
    return ["package mode must be reference-example or learner-final"]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--package", required=True, type=Path)
    args = parser.parse_args()
    try:
        package = json.loads(args.package.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        package = {}
    mode = package.get("mode") if isinstance(package, dict) else None
    issues = validate_submission(args.package.resolve())
    validator_id = REFERENCE_VALIDATOR_ID if mode == "reference-example" else CAPSTONE_VALIDATOR_ID
    if issues:
        print(f"{validator_id}: FAIL ({len(issues)} issue(s))")
        for issue in issues:
            print(f"- {issue}")
        return 1
    if mode == "reference-example":
        print(f"{REFERENCE_VALIDATOR_ID}: REFERENCE_PASS capstoneEligible=false")
    else:
        print(f"{CAPSTONE_VALIDATOR_ID}: PASS deploymentAuthority=false")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
