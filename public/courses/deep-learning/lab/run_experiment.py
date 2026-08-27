#!/usr/bin/env python3
"""Deterministic Course 20 CPU experiment using only the Python standard library."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import platform
import random
from pathlib import Path
from typing import Any, Dict, Iterable, List, Sequence, Tuple

COURSE_ID = "deep-learning"
COURSE_VERSION = "2026.08.26-v1"
CAPSTONE_VERSION = "2026.08.26-capstone-v1"
VALIDATOR_ID = "aicourse.deep-learning.validator.v1"
SEED = 20260826
EPOCHS = 800
LEARNING_RATE = 0.18
HIDDEN_UNITS = 4
FIXTURE_HASHES = {
    "fixtures/neural-training-fixture-v1.json": "70a3a7c10ef24a15df050434f34350e7283eba1be145ee2bedb5cb34e7d5cb6a",
    "fixtures/neural-training-fixture-v1.schema.json": "cfd032a6bed0f5c97d138aabdb16d813b72251bd565c76ae883790182b1029f8",
}
MILESTONE_EPOCHS = {1, 10, 50, 100, 200, 400, 800}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def rounded(value: float) -> float:
    return round(float(value), 8)


def write_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def verify_and_load_fixture(course_dir: Path) -> Tuple[Dict[str, Any], List[Dict[str, str]]]:
    receipts = []
    for relative_path, expected in FIXTURE_HASHES.items():
        path = course_dir / relative_path
        observed = sha256(path)
        if observed != expected:
            raise ValueError("fixture checksum mismatch: {}: {}".format(relative_path, observed))
        receipts.append({"path": relative_path, "sha256": observed})
    data = json.loads((course_dir / "fixtures/neural-training-fixture-v1.json").read_text(encoding="utf-8"))
    if data.get("schemaVersion") != "deep-learning.fixture.v1" or data.get("seed") != SEED:
        raise ValueError("fixture version or seed does not match the locked course contract")
    records = data.get("records")
    if not isinstance(records, list) or len(records) != 12:
        raise ValueError("the locked fixture must contain exactly 12 records")
    ids = set()
    split_counts = {"train": 0, "validation": 0, "test": 0}
    for record in records:
        sample_id = record.get("sampleId")
        if sample_id in ids:
            raise ValueError("duplicate sample ID: {}".format(sample_id))
        ids.add(sample_id)
        split = record.get("split")
        if split not in split_counts:
            raise ValueError("invalid split: {}".format(split))
        split_counts[split] += 1
        pixels = record.get("pixels")
        if len(pixels) != 4 or any(len(row) != 4 for row in pixels):
            raise ValueError("{} is not a 4x4 tensor".format(sample_id))
        if record.get("label") not in ("horizontal", "vertical"):
            raise ValueError("invalid label for {}".format(sample_id))
    if split_counts != {"train": 8, "validation": 2, "test": 2}:
        raise ValueError("split counts drifted: {}".format(split_counts))
    return data, receipts


def vector(record: Dict[str, Any]) -> List[float]:
    return [float(value) for row in record["pixels"] for value in row]


def target(record: Dict[str, Any]) -> int:
    return 1 if record["label"] == "vertical" else 0


def orientation_baseline(values: Sequence[float]) -> int:
    rows = [sum(values[row * 4:(row + 1) * 4]) for row in range(4)]
    columns = [sum(values[column + row * 4] for row in range(4)) for column in range(4)]
    return 1 if max(columns) > max(rows) else 0


def sigmoid(value: float) -> float:
    if value >= 0:
        inverse = math.exp(-value)
        return 1.0 / (1.0 + inverse)
    exponent = math.exp(value)
    return exponent / (1.0 + exponent)


def initial_parameters() -> Dict[str, Any]:
    rng = random.Random(SEED)
    return {
        "w1": [[rng.uniform(-0.25, 0.25) for _ in range(16)] for _ in range(HIDDEN_UNITS)],
        "b1": [0.0 for _ in range(HIDDEN_UNITS)],
        "w2": [rng.uniform(-0.25, 0.25) for _ in range(HIDDEN_UNITS)],
        "b2": 0.0,
    }


def forward(parameters: Dict[str, Any], values: Sequence[float], use_bias: bool = True) -> Tuple[List[float], float]:
    hidden = []
    for unit in range(HIDDEN_UNITS):
        activation = sum(parameters["w1"][unit][index] * values[index] for index in range(16))
        if use_bias:
            activation += parameters["b1"][unit]
        hidden.append(math.tanh(activation))
    logit = sum(parameters["w2"][unit] * hidden[unit] for unit in range(HIDDEN_UNITS))
    if use_bias:
        logit += parameters["b2"]
    return hidden, sigmoid(logit)


def binary_loss(probability: float, label: int) -> float:
    clipped = min(max(probability, 1e-12), 1.0 - 1e-12)
    return -(label * math.log(clipped) + (1 - label) * math.log(1.0 - clipped))


def accuracy(parameters: Dict[str, Any], records: Sequence[Dict[str, Any]], use_bias: bool = True) -> float:
    correct = 0
    for record in records:
        _, probability = forward(parameters, vector(record), use_bias)
        correct += int((1 if probability >= 0.5 else 0) == target(record))
    return correct / len(records)


def train(records: Sequence[Dict[str, Any]], validation: Sequence[Dict[str, Any]], use_bias: bool) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    parameters = initial_parameters()
    milestones = []
    for epoch in range(1, EPOCHS + 1):
        gw1 = [[0.0 for _ in range(16)] for _ in range(HIDDEN_UNITS)]
        gb1 = [0.0 for _ in range(HIDDEN_UNITS)]
        gw2 = [0.0 for _ in range(HIDDEN_UNITS)]
        gb2 = 0.0
        total_loss = 0.0
        for record in records:
            values = vector(record)
            label = target(record)
            hidden, probability = forward(parameters, values, use_bias)
            total_loss += binary_loss(probability, label)
            output_delta = probability - label
            for unit in range(HIDDEN_UNITS):
                gw2[unit] += output_delta * hidden[unit]
                hidden_delta = output_delta * parameters["w2"][unit] * (1.0 - hidden[unit] ** 2)
                if use_bias:
                    gb1[unit] += hidden_delta
                for index in range(16):
                    gw1[unit][index] += hidden_delta * values[index]
            if use_bias:
                gb2 += output_delta
        scale = LEARNING_RATE / len(records)
        for unit in range(HIDDEN_UNITS):
            parameters["w2"][unit] -= scale * gw2[unit]
            if use_bias:
                parameters["b1"][unit] -= scale * gb1[unit]
            for index in range(16):
                parameters["w1"][unit][index] -= scale * gw1[unit][index]
        if use_bias:
            parameters["b2"] -= scale * gb2
        if epoch in MILESTONE_EPOCHS:
            milestones.append({
                "epoch": epoch,
                "meanTrainingLoss": rounded(total_loss / len(records)),
                "trainingAccuracy": rounded(accuracy(parameters, records, use_bias)),
                "validationAccuracy": rounded(accuracy(parameters, validation, use_bias)),
            })
    return parameters, milestones


def gradient_check(parameters: Dict[str, Any], record: Dict[str, Any]) -> Dict[str, Any]:
    values = vector(record)
    label = target(record)
    hidden, probability = forward(parameters, values, True)
    analytic = (probability - label) * hidden[0]
    epsilon = 1e-5
    original = parameters["w2"][0]
    parameters["w2"][0] = original + epsilon
    plus = binary_loss(forward(parameters, values, True)[1], label)
    parameters["w2"][0] = original - epsilon
    minus = binary_loss(forward(parameters, values, True)[1], label)
    parameters["w2"][0] = original
    numeric = (plus - minus) / (2.0 * epsilon)
    return {"parameter": "w2[0]", "analytic": rounded(analytic), "numeric": rounded(numeric), "absoluteDifference": rounded(abs(analytic - numeric)), "tolerance": 1e-6, "status": "pass" if abs(analytic - numeric) < 1e-6 else "fail"}


def transformed(records: Sequence[Dict[str, Any]], transformation: str) -> List[Dict[str, Any]]:
    transformed_records = []
    for record in records:
        copy = json.loads(json.dumps(record))
        if transformation == "contrast-drop":
            copy["pixels"] = [[value * 0.35 for value in row] for row in copy["pixels"]]
        elif transformation == "occlusion":
            changed = False
            for row_index, row in enumerate(copy["pixels"]):
                for column_index, value in enumerate(row):
                    if value > 0 and not changed:
                        copy["pixels"][row_index][column_index] = 0
                        changed = True
        elif transformation != "clean":
            raise ValueError("unknown transformation: {}".format(transformation))
        copy["evaluationSlice"] = transformation
        transformed_records.append(copy)
    return transformed_records


def evaluate_slices(parameters: Dict[str, Any], test_records: Sequence[Dict[str, Any]]) -> List[Dict[str, Any]]:
    slices = []
    for name in ("clean", "contrast-drop", "occlusion"):
        records = transformed(test_records, name)
        baseline_errors = [record["sampleId"] for record in records if orientation_baseline(vector(record)) != target(record)]
        neural_errors = [record["sampleId"] for record in records if (1 if forward(parameters, vector(record))[1] >= 0.5 else 0) != target(record)]
        slices.append({
            "slice": name,
            "denominator": len(records),
            "baselineCorrect": len(records) - len(baseline_errors),
            "neuralCorrect": len(records) - len(neural_errors),
            "baselineErrors": baseline_errors,
            "neuralErrors": neural_errors,
            "transformation": "none" if name == "clean" else ("multiply every pixel by 0.35" if name == "contrast-drop" else "set the first non-zero pixel to zero"),
        })
    return slices


def build_results(course_dir: Path) -> Dict[str, Any]:
    fixture, input_receipts = verify_and_load_fixture(course_dir)
    records = fixture["records"]
    training = [record for record in records if record["split"] == "train"]
    validation = [record for record in records if record["split"] == "validation"]
    test = [record for record in records if record["split"] == "test"]
    parameters, milestones = train(training, validation, True)
    ablated_parameters, ablated_milestones = train(training, validation, False)
    baseline_test = sum(orientation_baseline(vector(record)) == target(record) for record in test) / len(test)
    neural_test = accuracy(parameters, test, True)
    ablated_test = accuracy(ablated_parameters, test, False)
    slices = evaluate_slices(parameters, test)
    return {
        "inputReceipts": input_receipts,
        "splitCounts": {"train": len(training), "validation": len(validation), "test": len(test)},
        "models": {
            "orientation-rule-baseline": {"parameters": 0, "testAccuracy": rounded(baseline_test)},
            "tiny-neural-network": {"architecture": "16-4-1-tanh-sigmoid", "trainableParameters": 73, "epochs": EPOCHS, "learningRate": LEARNING_RATE, "testAccuracy": rounded(neural_test)},
        },
        "milestones": milestones,
        "gradientCheck": gradient_check(parameters, training[0]),
        "slices": slices,
        "ablation": {
            "id": "disable-hidden-and-output-biases",
            "onlyChangedFactor": "all hidden and output biases fixed at zero",
            "matchedBudget": {"seed": SEED, "epochs": EPOCHS, "learningRate": LEARNING_RATE, "trainingRecords": len(training)},
            "referenceTestAccuracy": rounded(neural_test),
            "ablatedTestAccuracy": rounded(ablated_test),
            "referenceFinalValidationAccuracy": milestones[-1]["validationAccuracy"],
            "ablatedFinalValidationAccuracy": ablated_milestones[-1]["validationAccuracy"],
        },
        "costProxy": {
            "proxyType": "logical-operation-count",
            "estimatedMultiplyAdds": EPOCHS * len(training) * ((16 * HIDDEN_UNITS + HIDDEN_UNITS) * 3),
            "trainingExamplesProcessed": EPOCHS * len(training),
            "failedRunsIncluded": 0,
            "physicalEnergyMeasured": False,
            "monetaryCostMeasured": False,
            "boundary": "A deterministic logical-work proxy only; it is not joules, carbon, power draw, cloud billing, or cross-hardware comparison.",
        },
    }


def artifact(artifact_id: str, content: Dict[str, Any]) -> Dict[str, Any]:
    return {"artifactId": artifact_id, "content": content}


def build_submission(course_dir: Path, lab_dir: Path, output_dir: Path) -> Dict[str, Any]:
    results = build_results(course_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    training_log_path = output_dir / "training-log.json"
    metrics_path = output_dir / "metrics.json"
    card_path = output_dir / "training-card.json"
    write_json(training_log_path, {"seed": SEED, "models": results["models"], "milestones": results["milestones"], "gradientCheck": results["gradientCheck"]})
    write_json(metrics_path, {"splitCounts": results["splitCounts"], "slices": results["slices"], "ablation": results["ablation"], "costProxy": results["costProxy"]})
    card = {
        "purpose": "Compare an inspectable rule baseline and tiny neural classifier on a fixed synthetic line-orientation mechanics task.",
        "architecture": "16-4-1-tanh-sigmoid",
        "data": "12 original synthetic 4x4 grids with fixed 8/2/2 train/validation/test split",
        "models": results["models"],
        "intendedUses": ["offline learning mechanics", "gradient and training-loop inspection", "validator practice"],
        "excludedUses": ["real-image inference", "people or institution decisions", "safety or fairness certification", "production deployment"],
        "decision": "no-deploy",
        "evidenceLinks": ["training-log.json", "metrics.json"],
    }
    write_json(card_path, card)
    outputs = [{"path": path.name, "sha256": sha256(path)} for path in (training_log_path, metrics_path, card_path)]
    environment_path = lab_dir / "environment.lock.json"
    return {
        "schemaVersion": "aicourse.capstone-submission.v1",
        "courseId": COURSE_ID,
        "courseVersion": COURSE_VERSION,
        "capstoneVersion": CAPSTONE_VERSION,
        "validatorId": VALIDATOR_ID,
        "generatedOn": "2026-08-26",
        "artifacts": [
            artifact("environment-lock", {"runtime": "CPython {}".format(platform.python_version()), "referenceRuntime": "CPython 3.9.6", "processor": "CPU", "acceleratorRequired": False, "networkRequired": False, "seed": SEED, "inputHashes": results["inputReceipts"], "environmentLockSha256": sha256(environment_path), "command": "python3 run_experiment.py --output-dir work"}),
            artifact("training-log", {"architecture": "16-4-1-tanh-sigmoid", "epochs": EPOCHS, "learningRate": LEARNING_RATE, "milestones": results["milestones"], "gradientCheck": results["gradientCheck"], "outputPath": training_log_path.name, "outputSha256": sha256(training_log_path), "failedRunsRetained": True}),
            artifact("cost-energy-record", dict(results["costProxy"], limitations=["No wall-power instrumentation", "No embodied energy estimate", "Not comparable across runtimes or hardware"])),
            artifact("error-slices", {"slices": results["slices"], "baseline": results["models"]["orientation-rule-baseline"], "neural": results["models"]["tiny-neural-network"], "denominatorBoundary": "Two fixed test records per synthetic transformation", "limitations": ["tiny sample", "synthetic transformations", "not demographic subgroups", "no population inference"]}),
            artifact("ablation", dict(results["ablation"], causalBoundary="The matched local intervention supports only this fixture/configuration comparison.")),
            artifact("training-card", dict(card, outputPath=card_path.name, outputSha256=sha256(card_path), rightsBoundary="Original synthetic fixture; no third-party or personal data.")),
            artifact("limitations", {"knownFailures": ["No real-domain evaluation", "No accelerator determinism evidence", "No physical energy measurement"], "untestedConditions": ["larger images", "distribution shift beyond two authored transforms", "real populations", "adversarial inputs", "different Python math libraries"], "stopConditions": ["fixture or output hash mismatch", "gradient check failure", "critical slice regression", "rights boundary uncertainty", "missing independent review"], "owners": ["learner", "independent reviewer"], "decision": "no-deploy", "decisionReason": "A mechanics fixture cannot support an external deployment claim."}),
            artifact("reproducibility-receipt", {"validatorId": VALIDATOR_ID, "command": "python3 validate.py --package work/submission.generated.json", "seed": SEED, "inputs": results["inputReceipts"], "outputs": outputs, "expectedResult": "PASS only before mutation", "reviewer": {"name": "Reference Review Boundary (not an external reviewer)", "role": "course-pack safeguard", "externalReviewComplete": False}, "challenge": "Mutate version, artifact identity, neural evidence, and output bytes; every mutation must fail.", "decision": "no-deploy", "signedOn": "2026-08-26"}),
        ],
    }


def write_outputs(submission: Dict[str, Any], output_dir: Path) -> Path:
    submission_path = output_dir / "submission.generated.json"
    write_json(submission_path, submission)
    return submission_path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()
    lab_dir = Path(__file__).resolve().parent
    course_dir = lab_dir.parent
    output_dir = args.output_dir.resolve()
    submission = build_submission(course_dir, lab_dir, output_dir)
    submission_path = write_outputs(submission, output_dir)
    print("wrote {}".format(submission_path))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
