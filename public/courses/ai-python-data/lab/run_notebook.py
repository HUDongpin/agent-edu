#!/usr/bin/env python3
"""Execute the Course 18 notebook code cells offline without a Jupyter dependency."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path

EXPECTED_CODE_HASHES = {
    "audit.ipynb": "f404503873b1f98d5f01b982fc1c3cd45b44340e8725f824023794865485a13e",
    "run_audit.py": "61fa7f159f63f99156b406bb1fd291eab20195729bf772534c90cc704e62097b",
    "validate.py": "7f05520a7bdd3ec4f30edea5edaab23cb0dc1a0062904903e7c7ee3065e534a3",
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--notebook", type=Path, default=Path(__file__).resolve().parent / "audit.ipynb")
    parser.add_argument("--output-dir", type=Path, default=Path("work"))
    args = parser.parse_args()
    lab_dir = Path(__file__).resolve().parent
    notebook_path = args.notebook.resolve()
    for name, expected in EXPECTED_CODE_HASHES.items():
        path = notebook_path if name == "audit.ipynb" else lab_dir / name
        if not path.is_file() or sha256(path) != expected:
            raise ValueError(f"refusing to execute modified course code: {name}")
    notebook = json.loads(notebook_path.read_text(encoding="utf-8"))
    if notebook.get("nbformat") != 4:
        raise ValueError("expected notebook format 4")
    code_cells = [cell for cell in notebook.get("cells", []) if cell.get("cell_type") == "code"]
    if len(code_cells) != 2:
        raise ValueError("locked notebook must contain exactly two code cells")
    previous_directory = Path.cwd()
    previous_output = os.environ.get("AICOURSE_NOTEBOOK_OUTPUT")
    namespace = {"__name__": "__aicourse_notebook__"}
    try:
        os.chdir(lab_dir)
        os.environ["AICOURSE_NOTEBOOK_OUTPUT"] = str(args.output_dir.resolve())
        for index, cell in enumerate(code_cells, start=1):
            source = "".join(cell.get("source", []))
            exec(compile(source, f"audit.ipynb:cell-{index}", "exec"), namespace)
    finally:
        os.chdir(previous_directory)
        if previous_output is None:
            os.environ.pop("AICOURSE_NOTEBOOK_OUTPUT", None)
        else:
            os.environ["AICOURSE_NOTEBOOK_OUTPUT"] = previous_output
    submission_path = args.output_dir.resolve() / "submission.generated.json"
    if not submission_path.is_file():
        raise ValueError("notebook did not create submission.generated.json")
    print(submission_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
