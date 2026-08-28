#!/usr/bin/env python3
"""Provision the locked Course 20 v2 test runtime, then run its offline suite."""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path


PYTHON = "3.11"
TORCH = "2.13.0"
NUMPY = "2.4.1"


def current_runtime_matches() -> bool:
    if sys.version_info[:2] != (3, 11):
        return False
    try:
        import numpy  # type: ignore
        import torch  # type: ignore
    except ImportError:
        return False
    return torch.__version__ == TORCH and numpy.__version__ == NUMPY


def main() -> int:
    lab_dir = Path(__file__).resolve().parent
    suite = lab_dir / "test_lab_v2.py"
    if current_runtime_matches():
        command = [sys.executable, str(suite), "-v"]
    else:
        uv = shutil.which("uv")
        if not uv:
            print(
                "Course 20 v2 requires CPython 3.11, torch==2.13.0, and "
                "numpy==2.4.1. Install the locked environment or provide uv.",
                file=sys.stderr,
            )
            return 2
        command = [
            uv,
            "run",
            "--python",
            PYTHON,
            "--with",
            f"torch=={TORCH}",
            "--with",
            f"numpy=={NUMPY}",
            "python",
            str(suite),
            "-v",
        ]
    environment = {
        **os.environ,
        "PYTHONDONTWRITEBYTECODE": "1",
        "PYTHONHASHSEED": "0",
        "TZ": "UTC",
        "OMP_NUM_THREADS": "1",
        "MKL_NUM_THREADS": "1",
    }
    completed = subprocess.run(command, cwd=lab_dir, env=environment, check=False)
    if completed.returncode == 0:
        print("aicourse.deep-learning.lab-tests.v2: PASS (12 modules + reference/capstone negatives)")
    return completed.returncode


if __name__ == "__main__":
    raise SystemExit(main())
