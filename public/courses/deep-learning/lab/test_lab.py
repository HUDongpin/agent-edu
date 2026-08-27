#!/usr/bin/env python3
"""Clean-run, positive, and destructive negative tests for the Course 20 pack."""

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
    with tempfile.TemporaryDirectory(prefix="aicourse-deep-learning-") as temp:
        work = Path(temp) / "work"
        subprocess.run([sys.executable, str(lab_dir / "run_experiment.py"), "--output-dir", str(work)], cwd=str(lab_dir), check=True, capture_output=True, text=True)
        submission_path = work / "submission.generated.json"
        subprocess.run([sys.executable, str(lab_dir / "validate.py"), "--package", str(submission_path)], cwd=str(lab_dir), check=True, capture_output=True, text=True)
        if validate_submission(submission_path):
            raise AssertionError("clean generated submission did not pass in-process validation")
        source = json.loads(submission_path.read_text(encoding="utf-8"))

        wrong_version = copy.deepcopy(source)
        wrong_version["courseVersion"] = "wrong-version"
        require_failure("wrong course version", wrong_version, work / "mutated-version.json")

        missing = copy.deepcopy(source)
        missing["artifacts"].pop()
        require_failure("missing artifact", missing, work / "mutated-missing.json")

        wrong_id = copy.deepcopy(source)
        wrong_id["artifacts"][3]["artifactId"] = "invented-slice"
        require_failure("wrong artifact ID", wrong_id, work / "mutated-id.json")

        wrong_training = copy.deepcopy(source)
        wrong_training["artifacts"][1]["content"]["milestones"][-1]["validationAccuracy"] = -1
        require_failure("changed neural evidence", wrong_training, work / "mutated-training.json")

        metrics_path = work / "metrics.json"
        original_metrics = metrics_path.read_bytes()
        metrics_path.write_bytes(original_metrics + b" ")
        issues = validate_submission(submission_path)
        if not any("hash mismatch" in issue for issue in issues):
            raise AssertionError("changed generated output did not fail its hash contract: {}".format(issues))
        metrics_path.write_bytes(original_metrics)

    print("aicourse.deep-learning.lab-tests.v1: PASS (1 clean + 5 negative)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
