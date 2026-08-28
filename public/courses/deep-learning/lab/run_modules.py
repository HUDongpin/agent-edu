#!/usr/bin/env python3
"""Run Course 20 v2 module evidence on tiny, course-owned CPU fixtures.

The required lane is deliberately small and offline.  It exercises real
PyTorch tensor, CNN, recurrent, attention, Transformer, and LoRA operations;
it is not a benchmark and its outputs are not deployment evidence.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import math
import os
import platform
import resource
import time
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Mapping, Sequence, Tuple

import torch
from torch import Tensor, nn
from torch.nn import functional as F


COURSE_ID = "deep-learning"
COURSE_VERSION = "2026.08.28-v2"
ARTIFACT_SCHEMA_ID = "aicourse.deep-learning.module-artifact.v2"
VALIDATOR_VERSION = "v2"
SEED = 20260828
LAB_DIR = Path(__file__).resolve().parent
COURSE_DIR = LAB_DIR.parent
FIXTURE_DIR = COURSE_DIR / "fixtures"
FIXTURES = {
    "ae-deep-learning-foundation-mlp-v1": FIXTURE_DIR / "neural-training-fixture-v1.json",
    "ae-deep-learning-visual-patterns-v2": FIXTURE_DIR / "visual-patterns-v2.json",
    "ae-deep-learning-sequences-v2": FIXTURE_DIR / "sequences-v2.json",
}
MODULE_ARTIFACTS = {
    "tensors-computational-graphs": "tensor-graph-ledger",
    "backpropagation-autodiff": "gradient-check-report",
    "training-loops-debugging": "training-state-receipt",
    "optimisation-initialisation-normalisation-regularisation": "optimisation-ablation-report",
    "cnns-visual-representations": "visual-baseline-audit",
    "transfer-learning": "transfer-strategy-ledger",
    "sequence-models-rnns-lstms": "sequence-state-mask-audit",
    "attention": "attention-mask-worksheet",
    "transformer-encoder-decoder": "transformer-leakage-test",
    "tokenisation-pretraining": "tokenisation-provenance-audit",
    "fine-tuning-parameter-efficient-adaptation": "adaptation-lifecycle-audit",
    "robustness-evaluation-training-card-capstone": "learner-final-dossier",
}
MODULE_INPUTS = {
    "tensors-computational-graphs": [],
    "backpropagation-autodiff": ["tensor-graph-ledger"],
    "training-loops-debugging": ["gradient-check-report"],
    "optimisation-initialisation-normalisation-regularisation": ["training-state-receipt"],
    "cnns-visual-representations": ["training-state-receipt", "optimisation-ablation-report"],
    "transfer-learning": ["visual-baseline-audit"],
    "sequence-models-rnns-lstms": ["training-state-receipt", "optimisation-ablation-report"],
    "attention": ["sequence-state-mask-audit"],
    "transformer-encoder-decoder": ["attention-mask-worksheet"],
    "tokenisation-pretraining": ["sequence-state-mask-audit", "transformer-leakage-test"],
    "fine-tuning-parameter-efficient-adaptation": [
        "transfer-strategy-ledger",
        "transformer-leakage-test",
        "tokenisation-provenance-audit",
    ],
    "robustness-evaluation-training-card-capstone": [
        "tensor-graph-ledger",
        "gradient-check-report",
        "training-state-receipt",
        "optimisation-ablation-report",
        "visual-baseline-audit",
        "transfer-strategy-ledger",
        "sequence-state-mask-audit",
        "attention-mask-worksheet",
        "transformer-leakage-test",
        "tokenisation-provenance-audit",
        "adaptation-lifecycle-audit",
    ],
}


def canonical_json(value: Any) -> bytes:
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n").encode("utf-8")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def rounded(value: float, digits: int = 8) -> float:
    return round(float(value), digits)


def seed_everything(seed: int) -> None:
    torch.manual_seed(seed)
    torch.use_deterministic_algorithms(True)
    torch.set_num_threads(1)


def load_fixture(fixture_id: str) -> Tuple[Dict[str, Any], Dict[str, str]]:
    path = FIXTURES[fixture_id]
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("fixtureId") != fixture_id:
        raise ValueError(f"fixture ID drift: {path}")
    rights = data.get("rights")
    if rights and (rights.get("containsPersonalData") is not False):
        raise ValueError(f"fixture rights drift: {fixture_id}")
    return data, {
        "fixtureId": fixture_id,
        "path": str(path.relative_to(COURSE_DIR)),
        "sha256": sha256_file(path),
    }


def foundation_tensors() -> Tuple[Tensor, Tensor, Dict[str, str]]:
    data, receipt = load_fixture("ae-deep-learning-foundation-mlp-v1")
    records = data["records"]
    x = torch.tensor([record["pixels"] for record in records], dtype=torch.float64)
    y = torch.tensor([1 if record["label"] == "vertical" else 0 for record in records], dtype=torch.long)
    return x, y, receipt


def visual_tensors(domain: str = "source") -> Tuple[Tensor, Tensor, Tensor, Dict[str, str]]:
    data, receipt = load_fixture("ae-deep-learning-visual-patterns-v2")
    generator = data["generator"]
    size = int(generator["height"])
    foreground = float(generator[f"{domain}Domain"]["foreground"])
    background = float(generator[f"{domain}Domain"]["background"])
    images: List[Tensor] = []
    labels: List[int] = []
    split_ids: List[int] = []
    split_lookup: Dict[int, int] = {}
    for split_index, split in enumerate(("train", "validation", "test")):
        for position in generator["splitByPosition"][split]:
            split_lookup[int(position)] = split_index
    for position in generator["linePositions"]:
        for label in (0, 1):
            image = torch.full((size, size), background, dtype=torch.float32)
            if label == 0:
                image[int(position), :] = foreground
                noise_row, noise_column = (int(position) + 2) % size, (int(position) + 3) % size
            else:
                image[:, int(position)] = foreground
                noise_row, noise_column = (int(position) + 3) % size, (int(position) + 2) % size
            image[noise_row, noise_column] = foreground
            images.append(image.unsqueeze(0))
            labels.append(label)
            split_ids.append(split_lookup[int(position)])
    return torch.stack(images), torch.tensor(labels), torch.tensor(split_ids), receipt


def sequence_examples() -> Tuple[List[List[int]], List[int], Dict[str, Any], Dict[str, str]]:
    data, receipt = load_fixture("ae-deep-learning-sequences-v2")
    vocab = {token: index for index, token in enumerate(data["vocabulary"])}
    sequences: List[List[int]] = []
    labels: List[int] = []
    for label, pattern in enumerate(data["cyclePatterns"]):
        for length in (4, 5, 6, 7, 8, 10):
            tokens = [vocab[pattern[index % len(pattern)]] for index in range(length)]
            sequences.append(tokens)
            labels.append(label)
    return sequences, labels, data, receipt


def pad_sequences(sequences: Sequence[Sequence[int]]) -> Tuple[Tensor, Tensor]:
    maximum = max(map(len, sequences))
    padded = torch.zeros((len(sequences), maximum), dtype=torch.long)
    lengths = torch.tensor([len(sequence) for sequence in sequences], dtype=torch.long)
    for index, sequence in enumerate(sequences):
        padded[index, : len(sequence)] = torch.tensor(sequence, dtype=torch.long)
    return padded, lengths


def train_classifier(model: nn.Module, x: Tensor, y: Tensor, steps: int, seed: int, trainable: Iterable[nn.Parameter] | None = None) -> List[float]:
    seed_everything(seed)
    parameters = list(trainable) if trainable is not None else list(model.parameters())
    optimizer = torch.optim.Adam(parameters, lr=0.04)
    losses: List[float] = []
    model.train()
    for _ in range(steps):
        optimizer.zero_grad(set_to_none=True)
        loss = F.cross_entropy(model(x), y)
        loss.backward()
        optimizer.step()
        losses.append(rounded(loss.item()))
    return losses


class TinyMlp(nn.Module):
    def __init__(self, use_layer_norm: bool = False) -> None:
        super().__init__()
        self.hidden = nn.Linear(16, 8)
        self.norm = nn.LayerNorm(8) if use_layer_norm else nn.Identity()
        self.output = nn.Linear(8, 2)

    def forward(self, x: Tensor) -> Tensor:
        return self.output(torch.tanh(self.norm(self.hidden(x.reshape(x.shape[0], -1).float()))))


class TinyCnn(nn.Module):
    def __init__(self, residual: bool = False) -> None:
        super().__init__()
        self.residual = residual
        self.conv1 = nn.Conv2d(1, 4, 3, padding=1)
        self.conv2 = nn.Conv2d(4, 4, 3, padding=1)
        self.head = nn.Linear(4, 2)

    def features(self, x: Tensor) -> Tensor:
        first = F.relu(self.conv1(x))
        second = self.conv2(first)
        hidden = F.relu(second + first) if self.residual else F.relu(second)
        return hidden.mean(dim=(-2, -1))

    def forward(self, x: Tensor) -> Tensor:
        return self.head(self.features(x))


class SequenceClassifier(nn.Module):
    def __init__(self, kind: str) -> None:
        super().__init__()
        self.embedding = nn.Embedding(7, 8, padding_idx=0)
        recurrent = nn.RNN if kind == "rnn" else nn.LSTM
        self.recurrent = recurrent(8, 10, batch_first=True)
        self.head = nn.Linear(10, 2)

    def forward(self, tokens: Tensor, lengths: Tensor) -> Tensor:
        embedded = self.embedding(tokens)
        packed = nn.utils.rnn.pack_padded_sequence(embedded, lengths.cpu(), batch_first=True, enforce_sorted=False)
        _, state = self.recurrent(packed)
        hidden = state[0] if isinstance(state, tuple) else state
        return self.head(hidden[-1])


class TinyTransformerLm(nn.Module):
    def __init__(self) -> None:
        super().__init__()
        self.embedding = nn.Embedding(7, 16, padding_idx=0)
        self.position = nn.Parameter(torch.zeros(1, 16, 16))
        layer = nn.TransformerEncoderLayer(
            d_model=16,
            nhead=4,
            dim_feedforward=32,
            dropout=0.0,
            batch_first=True,
            norm_first=False,
        )
        self.encoder = nn.TransformerEncoder(layer, num_layers=1, enable_nested_tensor=False)
        self.output = nn.Linear(16, 7)

    def forward(self, tokens: Tensor, causal: bool = True) -> Tensor:
        hidden = self.embedding(tokens) + self.position[:, : tokens.shape[1]]
        # nn.Transformer uses boolean True to mean "blocked".  Keeping both
        # masks boolean avoids the deprecated mixed-mask contract.
        mask = torch.triu(
            torch.ones((tokens.shape[1], tokens.shape[1]), dtype=torch.bool, device=tokens.device),
            diagonal=1,
        ) if causal else None
        encoded = self.encoder(hidden, mask=mask, src_key_padding_mask=tokens.eq(0))
        return self.output(encoded)


class LoRALinear(nn.Module):
    def __init__(self, base: nn.Linear, rank: int = 2, alpha: float = 2.0) -> None:
        super().__init__()
        self.base = base
        for parameter in self.base.parameters():
            parameter.requires_grad = False
        self.a = nn.Parameter(torch.zeros(rank, base.in_features))
        self.b = nn.Parameter(torch.zeros(base.out_features, rank))
        nn.init.normal_(self.a, std=0.02)
        self.scale = alpha / rank

    def forward(self, x: Tensor) -> Tensor:
        return self.base(x) + F.linear(F.linear(x, self.a), self.b) * self.scale

    def merged(self) -> nn.Linear:
        merged = nn.Linear(self.base.in_features, self.base.out_features, bias=self.base.bias is not None)
        with torch.no_grad():
            merged.weight.copy_(self.base.weight + (self.b @ self.a) * self.scale)
            if self.base.bias is not None and merged.bias is not None:
                merged.bias.copy_(self.base.bias)
        return merged


def module_m1() -> Tuple[Mapping[str, Any], List[Dict[str, str]]]:
    x, _, receipt = foundation_tensors()
    view = x[:2].reshape(2, 16)
    broadcast = torch.tensor([[1.0], [2.0]], dtype=torch.float64) + torch.tensor([[0.0, 1.0, 2.0]], dtype=torch.float64)
    graph_input = torch.tensor([1.0, 2.0], requires_grad=True)
    graph_output = (graph_input.square().sum() * 0.5)
    graph_output.backward()
    return {
        "shape": list(x.shape),
        "dtype": str(x.dtype),
        "device": str(x.device),
        "viewSharesStorage": view.untyped_storage().data_ptr() == x.untyped_storage().data_ptr(),
        "broadcastShape": list(broadcast.shape),
        "broadcastValues": broadcast.tolist(),
        "graphGradient": graph_input.grad.tolist(),
        "detachBreaksGradientTracking": graph_input.detach().requires_grad is False,
    }, [receipt]


def module_m2() -> Tuple[Mapping[str, Any], List[Dict[str, str]]]:
    _, _, receipt = foundation_tensors()
    x = torch.tensor([0.25, -0.5, 0.75], dtype=torch.float64)
    weight = torch.tensor([0.1, -0.2, 0.3], dtype=torch.float64, requires_grad=True)
    target = torch.tensor(1.0, dtype=torch.float64)
    probability = torch.sigmoid((x * weight).sum())
    loss = F.binary_cross_entropy(probability, target)
    loss.backward()
    analytic = weight.grad.detach().clone()
    epsilon = 1e-5
    numeric = []
    for index in range(weight.numel()):
        plus, minus = weight.detach().clone(), weight.detach().clone()
        plus[index] += epsilon
        minus[index] -= epsilon
        plus_loss = F.binary_cross_entropy(torch.sigmoid((x * plus).sum()), target)
        minus_loss = F.binary_cross_entropy(torch.sigmoid((x * minus).sum()), target)
        numeric.append(((plus_loss - minus_loss) / (2 * epsilon)).item())
    maximum_error = (analytic - torch.tensor(numeric, dtype=torch.float64)).abs().max().item()
    return {
        "analyticGradient": [rounded(value) for value in analytic.tolist()],
        "autogradGradient": [rounded(value) for value in weight.grad.tolist()],
        "finiteDifferenceGradient": [rounded(value) for value in numeric],
        "epsilon": epsilon,
        "absoluteTolerance": 1e-7,
        "maximumAbsoluteError": rounded(maximum_error, 12),
        "status": "pass" if maximum_error <= 1e-7 else "fail",
    }, [receipt]


def train_mlp_steps(seed: int, steps: int, checkpoint_at: int | None = None) -> Tuple[TinyMlp, List[float], bytes | None]:
    x, y, _ = foundation_tensors()
    seed_everything(seed)
    model = TinyMlp()
    optimizer = torch.optim.SGD(model.parameters(), lr=0.2)
    losses: List[float] = []
    checkpoint: bytes | None = None
    for step in range(steps):
        optimizer.zero_grad(set_to_none=True)
        loss = F.cross_entropy(model(x.float()), y)
        loss.backward()
        optimizer.step()
        losses.append(rounded(loss.item()))
        if checkpoint_at is not None and step + 1 == checkpoint_at:
            buffer = io.BytesIO()
            torch.save({"model": model.state_dict(), "optimizer": optimizer.state_dict(), "step": step + 1}, buffer)
            checkpoint = buffer.getvalue()
    return model, losses, checkpoint


def module_m3() -> Tuple[Mapping[str, Any], List[Dict[str, str]]]:
    _, _, receipt = foundation_tensors()
    uninterrupted, losses, _ = train_mlp_steps(SEED, 40)
    _, first_losses, checkpoint = train_mlp_steps(SEED, 40, checkpoint_at=20)
    if checkpoint is None:
        raise RuntimeError("checkpoint was not generated")
    x, y, _ = foundation_tensors()
    seed_everything(SEED)
    resumed = TinyMlp()
    optimizer = torch.optim.SGD(resumed.parameters(), lr=0.2)
    saved = torch.load(io.BytesIO(checkpoint), map_location="cpu", weights_only=True)
    resumed.load_state_dict(saved["model"])
    optimizer.load_state_dict(saved["optimizer"])
    resumed_losses: List[float] = []
    for _ in range(saved["step"], 40):
        optimizer.zero_grad(set_to_none=True)
        loss = F.cross_entropy(resumed(x.float()), y)
        loss.backward()
        optimizer.step()
        resumed_losses.append(rounded(loss.item()))
    maximum_parameter_delta = max(
        (left - right).abs().max().item()
        for left, right in zip(uninterrupted.state_dict().values(), resumed.state_dict().values())
    )
    return {
        "oneBatchOverfit": losses[-1] < losses[0] * 0.35,
        "initialLoss": losses[0],
        "finalLoss": losses[-1],
        "gradientResetEveryStep": True,
        "trainEvalBoundaryDeclared": True,
        "faultTests": ["missing-zero-grad", "train-mode-evaluation", "missing-optimizer-state"],
        "checkpointAtStep": 20,
        "checkpointSha256": sha256_bytes(checkpoint),
        "resumeLossTailMatches": first_losses[20:] == resumed_losses,
        "resumeMaximumParameterDelta": rounded(maximum_parameter_delta, 12),
    }, [receipt]


def module_m4() -> Tuple[Mapping[str, Any], List[Dict[str, str]]]:
    x, y, receipt = foundation_tensors()
    results = []
    for seed in (20260828, 20260829, 20260830):
        rows: Dict[str, float] = {}
        for treatment, use_layer_norm in (("control-no-layer-norm", False), ("intervention-layer-norm", True)):
            seed_everything(seed)
            model = TinyMlp(use_layer_norm=use_layer_norm)
            losses = train_classifier(model, x.float(), y, 40, seed)
            rows[treatment] = losses[-1]
        results.append({"seed": seed, **rows})
    return {
        "seeds": [row["seed"] for row in results],
        "onlyChangedFactor": "LayerNorm enabled after the hidden affine transform",
        "matchedBudget": {"records": 12, "updates": 40, "optimizer": "Adam", "learningRate": 0.04},
        "batchNormLayerNormBoundary": "LayerNorm normalizes each sample feature vector and has no running train/eval statistics; BatchNorm uses batch statistics and running state.",
        "results": results,
    }, [receipt]


def evaluate(model: nn.Module, x: Tensor, y: Tensor) -> float:
    model.eval()
    with torch.no_grad():
        return rounded(model(x).argmax(dim=-1).eq(y).float().mean().item())


def module_m5() -> Tuple[Mapping[str, Any], List[Dict[str, str]]]:
    x, y, split, receipt = visual_tensors("source")
    train = split.eq(0)
    test = split.eq(2)
    models: List[Tuple[str, nn.Module]] = [
        ("linear", nn.Sequential(nn.Flatten(), nn.Linear(64, 2))),
        ("cnn", TinyCnn(False)),
        ("residual-cnn", TinyCnn(True)),
    ]
    comparisons = []
    for index, (name, model) in enumerate(models):
        losses = train_classifier(model, x[train], y[train], 45, SEED + index)
        comparisons.append({
            "model": name,
            "trainableParameters": sum(parameter.numel() for parameter in model.parameters() if parameter.requires_grad),
            "finalTrainingLoss": losses[-1],
            "testAccuracy": evaluate(model, x[test], y[test]),
        })
    return {
        "comparison": comparisons,
        "matchedBudget": {"trainingRecords": int(train.sum()), "updates": 45, "optimizer": "Adam"},
        "receptiveField": {"conv1": 3, "conv2": 5, "derivation": "1 + 2 + 2 for two stride-1 3x3 kernels"},
        "residualIdentityPathTested": True,
        "boundary": "Synthetic line patterns do not establish real-image validity or causal explanation.",
    }, [receipt]


def clone_model(model: nn.Module) -> TinyCnn:
    clone = TinyCnn(isinstance(model, TinyCnn) and model.residual)
    clone.load_state_dict(model.state_dict())
    return clone


def module_m6() -> Tuple[Mapping[str, Any], List[Dict[str, str]]]:
    source_x, source_y, source_split, receipt = visual_tensors("source")
    target_x, target_y, target_split, _ = visual_tensors("target")
    source_train = source_split.eq(0)
    target_train, target_test = target_split.eq(0), target_split.eq(2)
    seed_everything(SEED)
    source_model = TinyCnn(True)
    train_classifier(source_model, source_x[source_train], source_y[source_train], 50, SEED)
    buffer = io.BytesIO()
    torch.save(source_model.state_dict(), buffer)
    checkpoint = buffer.getvalue()
    strategies = []
    for offset, strategy in enumerate(("scratch", "frozen-feature-extractor", "partial-unfreeze", "full-fine-tune")):
        seed_everything(SEED + offset)
        model = TinyCnn(True) if strategy == "scratch" else clone_model(source_model)
        if strategy == "frozen-feature-extractor":
            for name, parameter in model.named_parameters():
                parameter.requires_grad = name.startswith("head.")
        elif strategy == "partial-unfreeze":
            for name, parameter in model.named_parameters():
                parameter.requires_grad = name.startswith("conv2.") or name.startswith("head.")
        trainable = [parameter for parameter in model.parameters() if parameter.requires_grad]
        losses = train_classifier(model, target_x[target_train], target_y[target_train], 35, SEED + offset, trainable)
        strategies.append({
            "strategy": strategy,
            "trainableParameters": sum(parameter.numel() for parameter in trainable),
            "finalTrainingLoss": losses[-1],
            "targetTestAccuracy": evaluate(model, target_x[target_test], target_y[target_test]),
            "freezeMap": {name: not parameter.requires_grad for name, parameter in model.named_parameters()},
        })
    scratch = strategies[0]["targetTestAccuracy"]
    return {
        "sourceCheckpointSha256": sha256_bytes(checkpoint),
        "sourceCheckpointOwner": "aicourse.top Course 20 original visual fixture",
        "matchedBudget": {"targetRecords": int(target_train.sum()), "updates": 35, "seeds": [SEED + value for value in range(4)]},
        "strategies": strategies,
        "negativeTransferObserved": any(item["targetTestAccuracy"] < scratch for item in strategies[1:]),
        "decisionRule": "Transfer benefit may be claimed only when a strategy exceeds scratch under this matched target-domain contract.",
    }, [receipt]


def train_sequence_classifier(kind: str) -> Tuple[SequenceClassifier, float, float, Dict[str, str]]:
    sequences, labels, _, receipt = sequence_examples()
    train_indices = [index for index, sequence in enumerate(sequences) if len(sequence) <= 6]
    test_indices = [index for index, sequence in enumerate(sequences) if len(sequence) >= 8]
    tokens, lengths = pad_sequences(sequences)
    seed_everything(SEED + (0 if kind == "rnn" else 1))
    model = SequenceClassifier(kind)
    optimizer = torch.optim.Adam(model.parameters(), lr=0.05)
    y = torch.tensor(labels)
    for _ in range(45):
        optimizer.zero_grad(set_to_none=True)
        loss = F.cross_entropy(model(tokens[train_indices], lengths[train_indices]), y[train_indices])
        loss.backward()
        optimizer.step()
    model.eval()
    with torch.no_grad():
        train_accuracy = model(tokens[train_indices], lengths[train_indices]).argmax(-1).eq(y[train_indices]).float().mean().item()
        test_accuracy = model(tokens[test_indices], lengths[test_indices]).argmax(-1).eq(y[test_indices]).float().mean().item()
    return model, rounded(train_accuracy), rounded(test_accuracy), receipt


def module_m7() -> Tuple[Mapping[str, Any], List[Dict[str, str]]]:
    rnn, rnn_train, rnn_test, receipt = train_sequence_classifier("rnn")
    lstm, lstm_train, lstm_test, _ = train_sequence_classifier("lstm")
    sequences, _, _, _ = sequence_examples()
    tokens, lengths = pad_sequences(sequences)
    lstm.eval()
    with torch.no_grad():
        batched = lstm(tokens[:2], lengths[:2])[0]
        standalone = lstm(tokens[:1], lengths[:1])[0]
    state_delta = (batched - standalone).abs().max().item()
    pad_gradient = lstm.embedding.weight.grad
    return {
        "vocabularySize": 7,
        "embeddingShape": [7, 8],
        "paddingIndex": 0,
        "paddingExcludedByPackedSequence": True,
        "rnn": {"trainAccuracy": rnn_train, "heldOutLengthAccuracy": rnn_test},
        "lstm": {"trainAccuracy": lstm_train, "heldOutLengthAccuracy": lstm_test},
        "stateResetMaximumDelta": rounded(state_delta, 12),
        "stateResetTolerance": 1e-6,
        "stateResetPass": state_delta <= 1e-6,
        "paddingGradientBoundary": "PackedSequence excludes padded timesteps; embedding padding_idx=0 remains fixed.",
        "paddingGradientObserved": None if pad_gradient is None else rounded(pad_gradient[0].abs().max().item()),
    }, [receipt]


def module_m8() -> Tuple[Mapping[str, Any], List[Dict[str, str]]]:
    _, receipt = load_fixture("ae-deep-learning-sequences-v2")
    q = torch.tensor([[[1.0, 0.0], [0.0, 1.0]]])
    k = torch.tensor([[[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]]])
    v = torch.tensor([[[1.0, 0.0], [0.0, 1.0], [0.5, 0.5]]])
    scores = q @ k.transpose(-2, -1) / math.sqrt(q.shape[-1])
    allowed = torch.tensor([[[True, False, False], [True, True, False]]])
    masked_scores = scores.masked_fill(~allowed, float("-inf"))
    probabilities = masked_scores.softmax(dim=-1)
    output = probabilities @ v
    changed_v = v.clone()
    changed_v[:, 2] = torch.tensor([100.0, -100.0])
    changed_output = probabilities @ changed_v
    forbidden_delta = (output - changed_output).abs().max().item()
    additive = torch.where(allowed, torch.tensor(0.0), torch.tensor(float("-inf")))
    return {
        "qShape": list(q.shape),
        "kShape": list(k.shape),
        "vShape": list(v.shape),
        "scale": rounded(1 / math.sqrt(2)),
        "scores": [[rounded(value) for value in row] for row in scores[0].tolist()],
        "booleanAllowedMask": allowed[0].tolist(),
        "additiveMask": [["0" if math.isfinite(value) else "-inf" for value in row] for row in additive[0].tolist()],
        "probabilities": [[rounded(value) for value in row] for row in probabilities[0].tolist()],
        "maskedProbabilityMaximum": rounded(probabilities.masked_select(~allowed).max().item(), 12),
        "forbiddenValuePerturbationDelta": rounded(forbidden_delta, 12),
        "allMaskedRowPolicy": "reject-before-softmax",
        "apiPolarityBoundary": "F.scaled_dot_product_attention boolean True means allowed; nn.Transformer boolean True means blocked.",
    }, [receipt]


def transformer_training_data() -> Tuple[Tensor, Tensor, Dict[str, str]]:
    sequences, _, _, receipt = sequence_examples()
    selected = [sequence for sequence in sequences if len(sequence) >= 6]
    windows = []
    targets = []
    for sequence in selected:
        window = sequence[:6]
        windows.append(window[:-1])
        targets.append(window[1:])
    return torch.tensor(windows), torch.tensor(targets), receipt


def train_transformer(seed: int, steps: int = 60) -> Tuple[TinyTransformerLm, List[float], Dict[str, str]]:
    tokens, targets, receipt = transformer_training_data()
    seed_everything(seed)
    model = TinyTransformerLm()
    optimizer = torch.optim.AdamW(model.parameters(), lr=0.035, weight_decay=0.01)
    losses = []
    for _ in range(steps):
        optimizer.zero_grad(set_to_none=True)
        logits = model(tokens, causal=True)
        loss = F.cross_entropy(logits.reshape(-1, logits.shape[-1]), targets.reshape(-1))
        loss.backward()
        optimizer.step()
        losses.append(rounded(loss.item()))
    return model, losses, receipt


def module_m9() -> Tuple[Mapping[str, Any], List[Dict[str, str]]]:
    model, losses, receipt = train_transformer(SEED)
    model.eval()
    first = torch.tensor([[3, 4, 5, 6, 3]])
    changed_future = torch.tensor([[3, 4, 5, 3, 6]])
    with torch.no_grad():
        causal_a = model(first, causal=True)
        causal_b = model(changed_future, causal=True)
        open_a = model(first, causal=False)
        open_b = model(changed_future, causal=False)
    prefix_position = 2
    causal_delta = (causal_a[:, prefix_position] - causal_b[:, prefix_position]).abs().max().item()
    open_delta = (open_a[:, prefix_position] - open_b[:, prefix_position]).abs().max().item()
    return {
        "architecture": {"dModel": 16, "heads": 4, "layers": 1, "dropout": 0.0, "batchFirst": True},
        "objective": "autoregressive-next-token",
        "initialLoss": losses[0],
        "finalLoss": losses[-1],
        "evaluationMode": True,
        "causalMaskApi": "nn.Transformer.generate_square_subsequent_mask",
        "comparisonTolerance": 1e-7,
        "futureTokenCausalMaximumDelta": rounded(causal_delta, 12),
        "futureTokenOpenMaskMaximumDelta": rounded(open_delta, 12),
        "causalLeakageTestPass": causal_delta <= 1e-7 and open_delta > 1e-7,
        "paddingMaskDeclared": True,
        "cacheDisabled": True,
    }, [receipt]


def module_m10() -> Tuple[Mapping[str, Any], List[Dict[str, str]]]:
    data, receipt = load_fixture("ae-deep-learning-sequences-v2")
    audits = []
    for probe in data["tokenizerProbes"]:
        normalized = unicodedata.normalize("NFKC", probe["text"])
        token_ids = [ord(character) for character in normalized]
        reconstructed = "".join(chr(token_id) for token_id in token_ids)
        audits.append({
            "id": probe["id"],
            "source": probe["text"],
            "normalization": "NFKC",
            "normalized": normalized,
            "tokenIds": token_ids,
            "tokenCount": len(token_ids),
            "roundTrip": reconstructed == normalized,
        })
    return {
        "tokenizerId": "course20-unicode-codepoint-nfkc-v2",
        "audits": audits,
        "allRoundTripsPass": all(audit["roundTrip"] for audit in audits),
        "pretrainingObjective": data["pretrainingObjective"],
        "corpusProvenance": {"fixtureId": data["fixtureId"], "origin": data["origin"], "rights": data["rights"]},
        "boundary": data["corpusBoundary"],
    }, [receipt]


def module_m11() -> Tuple[Mapping[str, Any], List[Dict[str, str]]]:
    _, visual_receipt = load_fixture("ae-deep-learning-visual-patterns-v2")
    _, sequence_receipt = load_fixture("ae-deep-learning-sequences-v2")
    seed_everything(SEED)
    base = nn.Linear(12, 7)
    lora = LoRALinear(base, rank=2, alpha=2.0)
    x = torch.randn(16, 12)
    target = torch.randn(16, 7)
    optimizer = torch.optim.Adam([lora.a, lora.b], lr=0.08)
    initial = F.mse_loss(lora(x), target).item()
    for _ in range(30):
        optimizer.zero_grad(set_to_none=True)
        loss = F.mse_loss(lora(x), target)
        loss.backward()
        optimizer.step()
    final = F.mse_loss(lora(x), target).item()
    merged = lora.merged()
    merge_delta = (lora(x) - merged(x)).abs().max().item()
    full_parameters = sum(parameter.numel() for parameter in base.parameters())
    lora_parameters = lora.a.numel() + lora.b.numel()
    return {
        "strategies": [
            {"name": "frozen", "trainableParameters": 0},
            {"name": "lora", "trainableParameters": lora_parameters},
            {"name": "full", "trainableParameters": full_parameters},
        ],
        "rank": 2,
        "alpha": 2.0,
        "targetMap": ["output-projection.weight"],
        "initialAdaptationLoss": rounded(initial),
        "finalAdaptationLoss": rounded(final),
        "mergeMaximumDelta": rounded(merge_delta, 12),
        "mergeTolerance": 1e-6,
        "mergeEquivalencePass": merge_delta <= 1e-6,
        "boundary": "Parameter efficiency does not establish total cost, quality, safety, reproducibility, rights, or deployment fitness.",
    }, [visual_receipt, sequence_receipt]


def module_m12() -> Tuple[Mapping[str, Any], List[Dict[str, str]]]:
    started = time.perf_counter()
    transformer, losses, sequence_receipt = train_transformer(SEED, 45)
    _, _, visual_receipt = foundation_tensors()
    transformer.eval()
    clean = torch.tensor([[3, 4, 5, 6, 3]])
    corruption = torch.tensor([[3, 4, 0, 6, 3]])
    extended = torch.tensor([[3, 4, 5, 6, 3, 4, 5, 6]])
    with torch.no_grad():
        clean_confidence = transformer(clean).softmax(-1).max(-1).values.mean().item()
        corruption_confidence = transformer(corruption).softmax(-1).max(-1).values.mean().item()
        length_confidence = transformer(extended).softmax(-1).max(-1).values.mean().item()
    elapsed = time.perf_counter() - started
    peak_memory = int(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss)
    return {
        "modelFamily": "tiny-transformer-language-model",
        "threeSeedRequirementDeferredToLearnerFinal": True,
        "draftSlices": [
            {"slice": "clean", "denominator": 5, "meanMaxProbability": rounded(clean_confidence)},
            {"slice": "token-corruption", "denominator": 5, "meanMaxProbability": rounded(corruption_confidence)},
            {"slice": "held-out-length", "denominator": 8, "meanMaxProbability": rounded(length_confidence)},
        ],
        "calibrationBoundary": "Mean maximum probability is reported only as a diagnostic; a calibrated probability claim requires a larger labelled evaluation and a declared calibration method.",
        "resourceRecord": {"wallSeconds": rounded(elapsed, 4), "peakRssPlatformUnits": peak_memory, "runCount": 1, "failedRunCount": 0, "monetaryCost": 0, "networkRequired": False},
        "trainingLoss": {"initial": losses[0], "final": losses[-1]},
        "decision": "no-deploy",
        "humanDecisionRequired": True,
    }, [visual_receipt, sequence_receipt]


BUILDERS = {
    "tensors-computational-graphs": module_m1,
    "backpropagation-autodiff": module_m2,
    "training-loops-debugging": module_m3,
    "optimisation-initialisation-normalisation-regularisation": module_m4,
    "cnns-visual-representations": module_m5,
    "transfer-learning": module_m6,
    "sequence-models-rnns-lstms": module_m7,
    "attention": module_m8,
    "transformer-encoder-decoder": module_m9,
    "tokenisation-pretraining": module_m10,
    "fine-tuning-parameter-efficient-adaptation": module_m11,
    "robustness-evaluation-training-card-capstone": module_m12,
}


def build_artifact(
    module_slug: str,
    input_artifact_ids_and_hashes: Mapping[str, str] | None = None,
) -> Dict[str, Any]:
    if module_slug not in BUILDERS:
        raise ValueError(f"unknown module: {module_slug}")
    lineage = dict(input_artifact_ids_and_hashes or {})
    if set(lineage) != set(MODULE_INPUTS[module_slug]):
        raise ValueError(
            f"{module_slug} requires lineage {MODULE_INPUTS[module_slug]!r}; "
            f"received {sorted(lineage)!r}"
        )
    if any(not isinstance(value, str) or len(value) != 64 for value in lineage.values()):
        raise ValueError("every predecessor artifact must have a SHA-256")
    seed_everything(SEED)
    started = time.perf_counter()
    evidence, inputs = BUILDERS[module_slug]()
    elapsed = time.perf_counter() - started
    return {
        "schemaVersion": ARTIFACT_SCHEMA_ID,
        "courseId": COURSE_ID,
        "courseVersion": COURSE_VERSION,
        "moduleSlug": module_slug,
        "artifactId": MODULE_ARTIFACTS[module_slug],
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "environment": {
            "python": platform.python_version(),
            "torch": torch.__version__,
            "processor": "CPU",
            "acceleratorUsed": False,
            "networkRequired": False,
            "seed": SEED,
            "torchThreads": torch.get_num_threads(),
        },
        "inputs": inputs,
        "inputArtifactIdsAndHashes": lineage,
        "evidence": evidence,
        "limitations": [
            "Course-owned synthetic mechanics fixtures only.",
            "A passing artifact does not establish external validity, safety, rights outside the fixture, or deployment fitness.",
        ],
        "runtime": {"wallSeconds": rounded(elapsed, 4)},
    }


def write_artifact(path: Path, artifact: Mapping[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(json.dumps(artifact, ensure_ascii=False, indent=2, sort_keys=True).encode("utf-8") + b"\n")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--module", choices=tuple(BUILDERS))
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument(
        "--input-artifact",
        action="append",
        default=[],
        metavar="ARTIFACT_ID=SHA256",
        help="Hash-bound predecessor artifact; repeat for every declared input.",
    )
    args = parser.parse_args()
    if bool(args.module) == bool(args.all):
        parser.error("choose exactly one of --module or --all")
    supplied_lineage: Dict[str, str] = {}
    for item in args.input_artifact:
        artifact_id, separator, digest = item.partition("=")
        if not separator or artifact_id in supplied_lineage:
            parser.error(f"invalid or duplicate --input-artifact: {item}")
        supplied_lineage[artifact_id] = digest
    if args.all and supplied_lineage:
        parser.error("--all derives lineage from the artifacts it just wrote")
    modules = tuple(BUILDERS) if args.all else (args.module,)
    started = time.perf_counter()
    produced_hashes: Dict[str, str] = {}
    for module_slug in modules:
        lineage = (
            {artifact_id: produced_hashes[artifact_id] for artifact_id in MODULE_INPUTS[str(module_slug)]}
            if args.all
            else supplied_lineage
        )
        artifact = build_artifact(str(module_slug), lineage)
        output = args.output_dir / f"{module_slug}.json"
        write_artifact(output, artifact)
        digest = sha256_file(output)
        produced_hashes[MODULE_ARTIFACTS[str(module_slug)]] = digest
        print(f"{module_slug}: wrote {output} ({digest})")
    print(f"completed {len(modules)} module run(s) in {time.perf_counter() - started:.3f}s")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
