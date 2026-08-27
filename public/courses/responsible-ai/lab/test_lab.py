#!/usr/bin/env python3
"""Positive and destructive negative tests for the Course 16 dossier contract."""

from __future__ import annotations

import copy
import json
import shutil
import tempfile
from pathlib import Path

from validate import validate


def require_failure(name: str, package: object, path: Path, root: Path) -> None:
    path.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if not validate(path, root):
        raise AssertionError(f"negative mutation unexpectedly passed: {name}")


def main() -> int:
    lab = Path(__file__).resolve().parent
    repository = lab.parents[3]
    example_path = lab / "governance-dossier-example.json"
    source = json.loads(example_path.read_text(encoding="utf-8"))
    if validate(example_path, repository):
        raise AssertionError("clean reference dossier failed validation")
    if not validate(lab / "governance-dossier-template.json", repository):
        raise AssertionError("incomplete learner template unexpectedly passed")

    with tempfile.TemporaryDirectory(prefix="aicourse-responsible-ai-") as temporary:
        work = Path(temporary)
        wrong_version = copy.deepcopy(source)
        wrong_version["capstoneVersion"] = "wrong-version"
        require_failure("wrong capstone version", wrong_version, work / "wrong-version.json", repository)

        missing_override = copy.deepcopy(source)
        del missing_override["artifacts"]["override-appeal-flow"]
        require_failure("missing human authority artifact", missing_override, work / "missing-override.json", repository)

        stale_gate = copy.deepcopy(source)
        stale_gate["responsibleAiGate"]["criteria"].pop()
        require_failure("incomplete Responsible AI gate", stale_gate, work / "stale-gate.json", repository)

        copied_root = work / "copied-root"
        copied_fixture = copied_root / "public/courses/responsible-ai/governance-case-synthetic-v1.json"
        copied_fixture.parent.mkdir(parents=True)
        shutil.copy2(repository / "public/courses/responsible-ai/governance-case-synthetic-v1.json", copied_fixture)
        if validate(example_path, copied_root):
            raise AssertionError("copied locked fixture failed before mutation")
        copied_fixture.write_bytes(copied_fixture.read_bytes() + b" ")
        if not any("fixture" in issue for issue in validate(example_path, copied_root)):
            raise AssertionError("mutated fixture bytes did not fail the asset binding")

    print("aicourse.responsible-ai.lab-tests.v1: PASS (1 clean + template + 4 negative)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
