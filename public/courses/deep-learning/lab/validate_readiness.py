#!/usr/bin/env python3
"""Validate the non-milestone Course 20 math/framework readiness diagnostic."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


EXPECTED = {
    "schemaVersion": "aicourse.deep-learning.readiness.v1",
    "courseVersion": "2026.08.28-v2",
    "matrixProduct": [[4, 4], [10, 8]],
    "broadcastShape": [2, 4, 3],
    "partialDerivative": 6,
    "chainRuleDerivative": 12,
    "stableSoftmaxMethod": "subtract-maximum-logit",
    "splitBoundary": "test-set-used-once-after-model-selection",
}


def validate(path: Path):
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        return [f"readiness diagnostic is unreadable: {error}"]
    issues = [f"{key} is incorrect" for key, value in EXPECTED.items() if data.get(key) != value]
    python_test = data.get("pythonTest", {})
    if not isinstance(python_test, dict) or python_test.get("exitCode") != 0 or not str(python_test.get("command", "")).strip():
        issues.append("a passing Python unit-test receipt is required")
    if data.get("decision") != ("ready" if not issues else "bridge"):
        issues.append("decision must be ready only when every diagnostic passes; otherwise use bridge")
    return issues


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--package", required=True, type=Path)
    args = parser.parse_args()
    issues = validate(args.package.resolve())
    if issues:
        print("aicourse.deep-learning.readiness.v1: BRIDGE_REQUIRED")
        for issue in issues:
            print(f"- {issue}")
        return 3
    print("aicourse.deep-learning.readiness.v1: READY")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
