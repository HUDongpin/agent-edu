#!/usr/bin/env python3
"""Clean-run and destructive negative tests for the Course 17 evidence lab."""

from __future__ import annotations

import copy
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from validate import validate


def write_package(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def require_failure(name: str, package: object, path: Path, root: Path) -> None:
    write_package(path, package)
    if not validate(path, root):
        raise AssertionError(f"negative mutation unexpectedly passed: {name}")


def main() -> int:
    lab = Path(__file__).resolve().parent
    repository = lab.parents[3]
    with tempfile.TemporaryDirectory(prefix="aicourse-ai-research-") as temporary:
        work = Path(temporary)
        output = work / "generated"
        subprocess.run(
            [sys.executable, str(lab / "run_mini_review.py"), "--output-dir", str(output)],
            cwd=str(repository),
            check=True,
            capture_output=True,
            text=True,
        )
        package_path = output / "mini-review.generated.json"
        if validate(package_path, repository):
            raise AssertionError("clean generated mini-review failed validation")
        source = json.loads(package_path.read_text(encoding="utf-8"))

        rag_as_evidence = copy.deepcopy(source)
        rag_as_evidence["primaryEvidence"][0]["evidenceKind"] = "rag-chunk"
        require_failure("RAG chunk used as final evidence", rag_as_evidence, work / "rag-final.json", repository)

        wrong_page = copy.deepcopy(source)
        wrong_page["primaryEvidence"][0]["page"] = 1
        require_failure("wrong primary page", wrong_page, work / "wrong-page.json", repository)

        stale_citation = copy.deepcopy(source)
        stale_citation["citationAudit"][2]["saferWording"] = "The stale PDF cell is accepted without checking its linked correction."
        require_failure("stale linked correction", stale_citation, work / "stale-citation.json", repository)

        copied_root = work / "copied-root"
        copied_course = copied_root / "public/courses/ai-research"
        copied_course.parent.mkdir(parents=True)
        shutil.copytree(repository / "public/courses/ai-research", copied_course)
        copied_scripts = copied_root / "scripts"
        copied_scripts.mkdir()
        shutil.copy2(repository / "scripts/generate-ai-research-primary-pdfs.py", copied_scripts)
        if validate(package_path, copied_root):
            raise AssertionError("copied locked inputs failed before mutation")
        copied_pdf = copied_course / "primary/REC-005.pdf"
        copied_pdf.write_bytes(copied_pdf.read_bytes() + b" ")
        if not any("REC-005 PDF bytes" in issue for issue in validate(package_path, copied_root)):
            raise AssertionError("mutated primary PDF bytes did not fail the asset binding")

    print("aicourse.ai-research.lab-tests.v1: PASS (1 clean + 4 negative)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
