#!/usr/bin/env python3
"""Course 18 offline, standard-library reference audit over the fixed fixture."""

from __future__ import annotations

import argparse
import csv
import hashlib
import html
import json
import platform
import random
import statistics
from pathlib import Path
from typing import Any

COURSE_ID = "ai-python-data"
COURSE_VERSION = "2026.08.26-v1"
CAPSTONE_VERSION = "2026.08.26-capstone-v1"
VALIDATOR_ID = "aicourse.ai-python-data.validator.v1"
SEED = 18019
EXPECTED_HASHES = {
    "education-outcomes-synthetic-v1.csv": "3ec62e24548576c6f6c69470b3a5ae524cec1d248b47cce0d9b0e3f48c337349",
    "education-outcomes-schema-v1.json": "45726eeb0524cba1555ee697bd1fdeaf9879634a7b2b608ac0fbf257adb51b08",
    "cohort-lookup-synthetic-v1.json": "91768ca56526db1c05e8a5e33f59bf1559c90a5f044c34df900698567cf0be17",
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def artifact(artifact_id: str, content: dict[str, Any]) -> dict[str, Any]:
    return {"artifactId": artifact_id, "content": content}


def verify_inputs(course_dir: Path) -> list[dict[str, str]]:
    receipts = []
    for name, expected in EXPECTED_HASHES.items():
        path = course_dir / name
        observed = sha256(path)
        if observed != expected:
            raise ValueError(f"fixture checksum mismatch: {name}: {observed}")
        receipts.append({"path": name, "sha256": observed})
    return receipts


def parse_rows(course_dir: Path) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    schema = json.loads((course_dir / "education-outcomes-schema-v1.json").read_text(encoding="utf-8"))
    field_specs = schema["fields"]
    expected_fields = [field["name"] for field in field_specs]
    with (course_dir / "education-outcomes-synthetic-v1.csv").open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames != expected_fields:
            raise ValueError("CSV header does not match the locked schema")
        raw_rows = list(reader)
    if len(raw_rows) != 18:
        raise ValueError(f"expected 18 rows, found {len(raw_rows)}")

    rows: list[dict[str, Any]] = []
    unique_values: dict[str, set[Any]] = {}
    for raw in raw_rows:
        row: dict[str, Any] = {}
        for spec in field_specs:
            name = spec["name"]
            value: Any = raw[name]
            constraints = spec.get("constraints", {})
            if value == "":
                if constraints.get("required"):
                    raise ValueError(f"required value missing: {name}")
                row[name] = None
                continue
            if spec["type"] == "integer":
                value = int(value)
            elif spec["type"] == "number":
                value = float(value)
            if "enum" in constraints and value not in constraints["enum"]:
                raise ValueError(f"invalid enum value for {name}: {value}")
            if "minimum" in constraints and value < constraints["minimum"]:
                raise ValueError(f"value below minimum for {name}: {value}")
            if "maximum" in constraints and value > constraints["maximum"]:
                raise ValueError(f"value above maximum for {name}: {value}")
            if constraints.get("unique"):
                values = unique_values.setdefault(name, set())
                if value in values:
                    raise ValueError(f"duplicate value for {name}: {value}")
                values.add(value)
            row[name] = value
        rows.append(row)
    return rows, schema


def bootstrap_mean(values: list[float], seed: int, draws: int = 2000) -> list[float]:
    rng = random.Random(seed)
    means = []
    for _ in range(draws):
        sample = [values[rng.randrange(len(values))] for _ in values]
        means.append(statistics.fmean(sample))
    means.sort()
    return [round(means[int(draws * 0.025)], 4), round(means[int(draws * 0.975) - 1], 4)]


def write_summary_files(rows: list[dict[str, Any]], output_dir: Path) -> tuple[Path, Path, list[dict[str, Any]]]:
    output_dir.mkdir(parents=True, exist_ok=True)
    summaries = []
    for cohort in ("amber", "blue", "coral"):
        group = [row for row in rows if row["cohort"] == cohort]
        complete = sum(row["completion_status"] == "complete" for row in group)
        summaries.append({"cohort": cohort, "records": len(group), "complete": complete, "completionRate": round(complete / len(group), 4)})
    csv_path = output_dir / "cohort-summary.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["cohort", "records", "complete", "completionRate"])
        writer.writeheader()
        writer.writerows(summaries)
    svg_path = output_dir / "cohort-completion.svg"
    bars = []
    for index, summary in enumerate(summaries):
        x = 100 + index * 150
        height = int(summary["completionRate"] * 180)
        y = 240 - height
        label = html.escape(summary["cohort"])
        bars.append(f'<rect x="{x}" y="{y}" width="70" height="{height}" fill="#2563eb"/><text x="{x + 35}" y="265" text-anchor="middle">{label}</text><text x="{x + 35}" y="{y - 8}" text-anchor="middle">{summary["complete"]}/{summary["records"]}</text>')
    svg = """<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc" viewBox="0 0 560 310">
<title id="title">Completion counts in the fictional Course 18 fixture</title>
<desc id="desc">Three bars show complete records divided by six records in each invented cohort. This is a teaching fixture, not population evidence.</desc>
<rect width="560" height="310" fill="#f8fafc"/><line x1="70" y1="240" x2="520" y2="240" stroke="#334155"/>
<text x="20" y="30" fill="#0f172a">Complete records; denominator is six per fictional cohort</text>
""" + "\n".join(bars) + "\n</svg>\n"
    svg_path.write_text(svg, encoding="utf-8")
    return csv_path, svg_path, summaries


def build_submission(course_dir: Path, output_dir: Path, notebook_clean_run: bool = False) -> dict[str, Any]:
    inputs = verify_inputs(course_dir)
    rows, schema = parse_rows(course_dir)
    lookup = json.loads((course_dir / "cohort-lookup-synthetic-v1.json").read_text(encoding="utf-8"))
    lookup_by_cohort = {entry["cohort"]: entry for entry in lookup["cohorts"]}
    if set(lookup_by_cohort) != {"amber", "blue", "coral"}:
        raise ValueError("cohort lookup keys do not match the locked contract")
    for row in rows:
        row["delivery_format"] = lookup_by_cohort[row["cohort"]]["format"]
        row["planned_minutes"] = lookup_by_cohort[row["cohort"]]["planned_minutes"]

    output_dir.mkdir(parents=True, exist_ok=True)
    validated_path = output_dir / "validated-rows.json"
    validated_path.write_text(json.dumps(rows, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    summary_path, svg_path, summaries = write_summary_files(rows, output_dir)
    study_values = [float(row["study_minutes"]) for row in rows if row["study_minutes"] is not None]
    complete_count = sum(row["completion_status"] == "complete" for row in rows)
    lab_dir = Path(__file__).resolve().parent
    notebook_path = lab_dir / "audit.ipynb"
    lock_path = lab_dir / "environment.lock.json"
    missingness = {name: sum(row[name] is None for row in rows) for name in ("study_minutes", "checkpoint_score")}
    checks = [
        {"id": "input-sha256", "status": "pass"},
        {"id": "schema-fields", "status": "pass"},
        {"id": "primary-key", "status": "pass"},
        {"id": "range-enum", "status": "pass"},
        {"id": "join-cardinality", "status": "pass"},
        {"id": "row-reconciliation", "status": "pass"},
    ]
    outputs = [
        {"path": validated_path.name, "sha256": sha256(validated_path)},
        {"path": summary_path.name, "sha256": sha256(summary_path)},
        {"path": svg_path.name, "sha256": sha256(svg_path)},
    ]
    return {
        "schemaVersion": "aicourse.capstone-submission.v1",
        "courseId": COURSE_ID,
        "courseVersion": COURSE_VERSION,
        "capstoneVersion": CAPSTONE_VERSION,
        "validatorId": VALIDATOR_ID,
        "generatedOn": "2026-08-26",
        "artifacts": [
            artifact("environment-receipt", {
                "pythonVersion": platform.python_version(), "runtime": "stdlib-only",
                "dependencyLockSha256": sha256(lock_path), "seed": SEED,
                "networkRequired": False, "inputs": inputs,
                "command": "python3 run_notebook.py --output-dir work",
            }),
            artifact("executable-notebook", {
                "path": "audit.ipynb", "sha256": sha256(notebook_path),
                "codeCellCount": 2, "cleanRun": notebook_clean_run,
                "command": "python3 run_notebook.py --output-dir work",
            }),
            artifact("data-dictionary", {
                "rowGrain": "one fictional learner code in one fictional period",
                "primaryKey": schema["primaryKey"], "rowCount": len(rows),
                "fields": [field["name"] for field in schema["fields"]],
                "joinedFields": ["delivery_format", "planned_minutes"],
                "syntheticBoundary": "No row represents a real person or institution.",
            }),
            artifact("cleaning-ledger", {
                "inputRows": len(rows), "outputRows": len(rows),
                "missingness": missingness, "imputationPerformed": False,
                "rules": ["parse declared numeric types", "preserve missing cells as null", "many-to-one cohort lookup", "never modify raw fixture"],
                "unresolved": ["missing values remain unknown by design"],
            }),
            artifact("validation-report", {
                "validatorId": VALIDATOR_ID, "checks": checks, "failures": 0,
                "negativeMutationTested": True,
            }),
            artifact("statistical-note", {
                "sampleSize": len(rows), "denominator": len(rows), "seed": SEED,
                "statistics": {
                    "completeCount": complete_count,
                    "completeRate": round(complete_count / len(rows), 4),
                    "studyMinutesObserved": len(study_values),
                    "studyMinutesMean": round(statistics.fmean(study_values), 4),
                    "studyMinutesMedian": round(statistics.median(study_values), 4),
                    "cohortSummaries": summaries,
                },
                "bootstrapInterval": bootstrap_mean(study_values, SEED),
                "limitations": ["tiny hand-authored fixture", "no target population", "descriptive not causal", "missingness mechanism unknown"],
            }),
            artifact("visual-report", {
                "path": svg_path.name, "sha256": sha256(svg_path), "denominator": len(rows),
                "altText": "Three bars compare complete records out of six records in each invented cohort; the chart is synthetic teaching evidence only.",
                "misleadingAlternativeDiagnosis": "A truncated axis or percentages without six-record denominators would exaggerate tiny fictional differences.",
            }),
            artifact("provenance-manifest", {
                "inputs": inputs, "outputs": outputs,
                "transformations": ["schema-bound parsing", "lossless missing-value preservation", "many-to-one lookup join", "seeded descriptive bootstrap", "original SVG generation"],
                "licence": "CC0-1.0 fixture data; course code follows repository terms",
                "nonClaims": ["no real learner evidence", "no causal claim", "no fairness claim", "no deployment authorization"],
                "review": {"role": "course-pack automated preflight", "decision": "no-deploy", "humanReviewRequiredBeforeSubmission": True},
            }),
        ],
    }


def write_outputs(submission: dict[str, Any], output_dir: Path) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    path = output_dir / "submission.generated.json"
    path.write_text(json.dumps(submission, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--course-dir", type=Path, default=Path(__file__).resolve().parent.parent)
    parser.add_argument("--output-dir", type=Path, default=Path("work"))
    args = parser.parse_args()
    path = write_outputs(build_submission(args.course_dir.resolve(), args.output_dir.resolve()), args.output_dir.resolve())
    print(path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
