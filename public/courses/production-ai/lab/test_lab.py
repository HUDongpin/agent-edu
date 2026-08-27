#!/usr/bin/env python3
"""Clean-run, positive, and destructive negative tests for the Course 21 pack."""

from __future__ import annotations

import copy
import json
import subprocess
import sys
import tempfile
from pathlib import Path

from validate import validate_submission


def write_json(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def require_failure(name: str, value: object, path: Path) -> None:
    write_json(path, value)
    issues = validate_submission(path)
    if not issues:
        raise AssertionError("negative mutation unexpectedly passed: {}".format(name))


def main() -> int:
    lab_dir = Path(__file__).resolve().parent
    with tempfile.TemporaryDirectory(prefix="aicourse-production-ai-") as temp:
        work = Path(temp) / "work"
        subprocess.run([sys.executable, str(lab_dir / "run_capstone.py"), "--output-dir", str(work)], cwd=str(lab_dir), check=True, capture_output=True, text=True)
        submission_path = work / "submission.generated.json"
        subprocess.run([sys.executable, str(lab_dir / "validate.py"), "--package", str(submission_path)], cwd=str(lab_dir), check=True, capture_output=True, text=True)
        if validate_submission(submission_path):
            raise AssertionError("clean generated submission did not pass in-process validation")
        source = json.loads(submission_path.read_text(encoding="utf-8"))

        wrong_version = copy.deepcopy(source)
        wrong_version["capstoneVersion"] = "wrong-version"
        require_failure("wrong capstone version", wrong_version, work / "mutated-version.json")

        missing = copy.deepcopy(source)
        missing["artifacts"].pop(7)
        require_failure("missing rollback artifact", missing, work / "mutated-missing.json")

        wrong_id = copy.deepcopy(source)
        wrong_id["artifacts"][5]["artifactId"] = "passive-drift-note"
        require_failure("wrong drift artifact ID", wrong_id, work / "mutated-id.json")

        no_injection = copy.deepcopy(source)
        no_injection["artifacts"][5]["content"]["injections"] = ["numeric-data-drift-v1"]
        require_failure("missing retrieval injection", no_injection, work / "mutated-drift.json")

        false_rollback = copy.deepcopy(source)
        false_rollback["artifacts"][7]["content"]["verified"] = False
        require_failure("rollback not verified", false_rollback, work / "mutated-rollback.json")

        dashboard_path = work / "dashboard-data.json"
        original_dashboard = dashboard_path.read_bytes()
        dashboard_path.write_bytes(original_dashboard + b" ")
        issues = validate_submission(submission_path)
        if not any("hash mismatch" in issue for issue in issues):
            raise AssertionError("changed dashboard output did not fail its hash contract: {}".format(issues))
        dashboard_path.write_bytes(original_dashboard)

    print("aicourse.production-ai.lab-tests.v1: PASS (1 clean + 6 negative)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
