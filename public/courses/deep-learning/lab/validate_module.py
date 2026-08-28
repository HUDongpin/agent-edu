#!/usr/bin/env python3
"""Validate one Course 20 v2 module artifact and optionally issue a receipt."""

from __future__ import annotations

import argparse
import copy
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Mapping

from run_modules import (
    ARTIFACT_SCHEMA_ID,
    COURSE_ID,
    COURSE_VERSION,
    FIXTURES,
    MODULE_ARTIFACTS,
    MODULE_INPUTS,
    build_artifact,
    sha256_file,
)


RECEIPT_SCHEMA = "aicourse.module-evidence-receipt.v2"
TOP_LEVEL_FIELDS = {
    "schemaVersion",
    "courseId",
    "courseVersion",
    "moduleSlug",
    "artifactId",
    "generatedAt",
    "environment",
    "inputs",
    "inputArtifactIdsAndHashes",
    "evidence",
    "limitations",
    "runtime",
}


def is_sha256(value: Any) -> bool:
    return isinstance(value, str) and bool(re.fullmatch(r"[0-9a-f]{64}", value)) and len(set(value)) > 1


def stable_evidence(value: Mapping[str, Any]) -> Dict[str, Any]:
    result = copy.deepcopy(dict(value))
    resource = result.get("resourceRecord")
    if isinstance(resource, dict):
        resource.pop("wallSeconds", None)
        resource.pop("peakRssPlatformUnits", None)
    return result


def semantic_issues(module_slug: str, evidence: Mapping[str, Any]) -> List[str]:
    issues: List[str] = []
    if module_slug == "tensors-computational-graphs":
        if evidence.get("shape") != [12, 4, 4] or evidence.get("broadcastShape") != [2, 3]:
            issues.append("tensor and broadcast shapes are not the locked exercise")
        if evidence.get("viewSharesStorage") is not True or evidence.get("detachBreaksGradientTracking") is not True:
            issues.append("view/copy or detach boundary failed")
    elif module_slug == "backpropagation-autodiff":
        if evidence.get("status") != "pass" or float(evidence.get("maximumAbsoluteError", 1)) > float(evidence.get("absoluteTolerance", 0)):
            issues.append("analytic/autograd/finite-difference gradient agreement failed")
    elif module_slug == "training-loops-debugging":
        for field in ("oneBatchOverfit", "gradientResetEveryStep", "trainEvalBoundaryDeclared", "resumeLossTailMatches"):
            if evidence.get(field) is not True:
                issues.append(f"training-loop invariant failed: {field}")
        if float(evidence.get("resumeMaximumParameterDelta", 1)) > 1e-9:
            issues.append("checkpoint/resume does not match uninterrupted execution")
        if len(evidence.get("faultTests", [])) < 3:
            issues.append("training-loop destructive tests are incomplete")
    elif module_slug == "optimisation-initialisation-normalisation-regularisation":
        if evidence.get("seeds") != [20260828, 20260829, 20260830]:
            issues.append("the optimisation ablation must contain three declared seeds")
        if len(evidence.get("results", [])) != 3 or "LayerNorm" not in str(evidence.get("onlyChangedFactor", "")):
            issues.append("the matched single-factor normalisation ablation is incomplete")
    elif module_slug == "cnns-visual-representations":
        models = {item.get("model") for item in evidence.get("comparison", []) if isinstance(item, dict)}
        if models != {"linear", "cnn", "residual-cnn"}:
            issues.append("linear/CNN/residual comparison is incomplete")
        if evidence.get("receptiveField", {}).get("conv2") != 5 or evidence.get("residualIdentityPathTested") is not True:
            issues.append("receptive-field or residual-path evidence failed")
    elif module_slug == "transfer-learning":
        strategies = {item.get("strategy") for item in evidence.get("strategies", []) if isinstance(item, dict)}
        if strategies != {"scratch", "frozen-feature-extractor", "partial-unfreeze", "full-fine-tune"}:
            issues.append("the four matched transfer strategies are incomplete")
        if not is_sha256(evidence.get("sourceCheckpointSha256")):
            issues.append("course-owned source checkpoint hash is missing")
    elif module_slug == "sequence-models-rnns-lstms":
        if evidence.get("paddingIndex") != 0 or evidence.get("paddingExcludedByPackedSequence") is not True:
            issues.append("padding boundary failed")
        if evidence.get("stateResetPass") is not True or float(evidence.get("stateResetMaximumDelta", 1)) > float(evidence.get("stateResetTolerance", 0)):
            issues.append("recurrent state leaked across samples")
        if not all(name in evidence for name in ("rnn", "lstm")):
            issues.append("RNN/LSTM comparison is incomplete")
    elif module_slug == "attention":
        if float(evidence.get("maskedProbabilityMaximum", 1)) > 1e-12:
            issues.append("a prohibited attention position received probability")
        if float(evidence.get("forbiddenValuePerturbationDelta", 1)) > 1e-12:
            issues.append("a masked value changed the attention output")
        if evidence.get("allMaskedRowPolicy") != "reject-before-softmax":
            issues.append("all-masked-row policy is missing")
    elif module_slug == "transformer-encoder-decoder":
        architecture = evidence.get("architecture", {})
        if architecture.get("dropout") != 0.0 or evidence.get("evaluationMode") is not True or evidence.get("cacheDisabled") is not True:
            issues.append("future-token invariance environment is uncontrolled")
        if evidence.get("causalLeakageTestPass") is not True:
            issues.append("causal-mask leakage regression failed")
        if float(evidence.get("futureTokenOpenMaskMaximumDelta", 0)) <= float(evidence.get("comparisonTolerance", 1)):
            issues.append("negative open-mask control did not detect future-token influence")
    elif module_slug == "tokenisation-pretraining":
        if evidence.get("allRoundTripsPass") is not True or not all(item.get("roundTrip") for item in evidence.get("audits", [])):
            issues.append("tokenizer normalization/round-trip audit failed")
        provenance = evidence.get("corpusProvenance", {})
        if provenance.get("rights", {}).get("containsThirdPartyCorpus") is not False:
            issues.append("pretraining corpus rights boundary is unresolved")
    elif module_slug == "fine-tuning-parameter-efficient-adaptation":
        strategies = {item.get("name"): item.get("trainableParameters") for item in evidence.get("strategies", []) if isinstance(item, dict)}
        if set(strategies) != {"frozen", "lora", "full"} or not (strategies["frozen"] < strategies["lora"] < strategies["full"]):
            issues.append("frozen/LoRA/full parameter comparison failed")
        if evidence.get("mergeEquivalencePass") is not True or float(evidence.get("mergeMaximumDelta", 1)) > float(evidence.get("mergeTolerance", 0)):
            issues.append("LoRA merge equivalence failed")
        if float(evidence.get("finalAdaptationLoss", 1)) >= float(evidence.get("initialAdaptationLoss", 0)):
            issues.append("LoRA adaptation did not reduce the declared objective")
    elif module_slug == "robustness-evaluation-training-card-capstone":
        slices = {item.get("slice") for item in evidence.get("draftSlices", []) if isinstance(item, dict)}
        if slices != {"clean", "token-corruption", "held-out-length"}:
            issues.append("robustness dossier slices are incomplete")
        if evidence.get("decision") != "no-deploy" or evidence.get("humanDecisionRequired") is not True:
            issues.append("draft dossier lost the no-deploy human-authority boundary")
        resource_record = evidence.get("resourceRecord", {})
        for field in ("wallSeconds", "peakRssPlatformUnits", "runCount", "failedRunCount", "monetaryCost", "networkRequired"):
            if field not in resource_record:
                issues.append(f"resource record is missing {field}")
    return issues


def validate_module_artifact(path: Path, expected_module: str) -> List[str]:
    issues: List[str] = []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        return [f"artifact is unreadable JSON: {error}"]
    if not isinstance(data, dict) or set(data) != TOP_LEVEL_FIELDS:
        return ["artifact top-level fields do not match module-artifact.v2"]
    expected_values = {
        "schemaVersion": ARTIFACT_SCHEMA_ID,
        "courseId": COURSE_ID,
        "courseVersion": COURSE_VERSION,
        "moduleSlug": expected_module,
        "artifactId": MODULE_ARTIFACTS[expected_module],
    }
    for key, expected in expected_values.items():
        if data.get(key) != expected:
            issues.append(f"{key} must equal {expected!r}")
    environment = data.get("environment", {})
    if not isinstance(environment, dict):
        issues.append("environment must be an object")
    else:
        if not str(environment.get("python", "")).startswith("3.11."):
            issues.append("required reference lane is CPython 3.11.x")
        if environment.get("torch") != "2.13.0" or environment.get("processor") != "CPU":
            issues.append("required reference lane is PyTorch 2.13.0 CPU")
        if environment.get("acceleratorUsed") is not False or environment.get("networkRequired") is not False:
            issues.append("required reference lane must remain offline and accelerator-free")
    lineage = data.get("inputArtifactIdsAndHashes")
    if not isinstance(lineage, dict) or set(lineage) != set(MODULE_INPUTS[expected_module]):
        issues.append("predecessor artifact lineage is incomplete or unexpected")
    elif any(not is_sha256(value) for value in lineage.values()):
        issues.append("predecessor lineage contains a placeholder or invalid SHA-256")
    inputs = data.get("inputs")
    if not isinstance(inputs, list) or not inputs:
        issues.append("fixture input receipts are missing")
    else:
        for item in inputs:
            if not isinstance(item, dict) or item.get("fixtureId") not in FIXTURES:
                issues.append("unknown fixture receipt")
                continue
            expected_path = FIXTURES[item["fixtureId"]]
            if item.get("sha256") != sha256_file(expected_path):
                issues.append(f"fixture hash drift: {item.get('fixtureId')}")
    evidence = data.get("evidence")
    if not isinstance(evidence, dict):
        issues.append("evidence must be an object")
    else:
        issues.extend(semantic_issues(expected_module, evidence))
        try:
            recomputed = build_artifact(expected_module, lineage if isinstance(lineage, dict) else {})
            if stable_evidence(evidence) != stable_evidence(recomputed["evidence"]):
                issues.append("evidence does not match a fresh offline recomputation")
        except Exception as error:
            issues.append(f"fresh offline recomputation failed: {error}")
    limitations = data.get("limitations")
    if not isinstance(limitations, list) or len(limitations) < 2:
        issues.append("limitations must retain fixture and deployment boundaries")
    return issues


def build_receipt(path_argument: Path, artifact: Mapping[str, Any], module_slug: str) -> Dict[str, Any]:
    if path_argument.is_absolute() or ".." in path_argument.parts:
        raise ValueError("receipt issuance requires a safe path relative to the repository root")
    validator_id = f"aicourse.deep-learning.module.{module_slug}.v2"
    return {
        "schemaVersion": RECEIPT_SCHEMA,
        "courseId": COURSE_ID,
        "courseVersion": COURSE_VERSION,
        "moduleSlug": module_slug,
        "artifactId": artifact["artifactId"],
        "artifactPath": path_argument.as_posix(),
        "artifactSha256": sha256_file(path_argument),
        "inputArtifactIdsAndHashes": artifact["inputArtifactIdsAndHashes"],
        "artifactSchemaId": ARTIFACT_SCHEMA_ID,
        "validatorId": validator_id,
        "validatorVersion": "v2",
        "executedCommand": f"python3 public/courses/deep-learning/lab/validate_module.py --module {module_slug} --package {path_argument.as_posix()}",
        "validatedAt": datetime.now(timezone.utc).isoformat(),
        "status": "pass",
        "limitations": artifact["limitations"],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--module", required=True, choices=tuple(MODULE_ARTIFACTS))
    parser.add_argument("--package", required=True, type=Path)
    parser.add_argument("--receipt", type=Path)
    args = parser.parse_args()
    issues = validate_module_artifact(args.package.resolve(), args.module)
    validator_id = f"aicourse.deep-learning.module.{args.module}.v2"
    if issues:
        print(f"{validator_id}: FAIL ({len(issues)} issue(s))")
        for issue in issues:
            print(f"- {issue}")
        return 1
    print(f"{validator_id}: PASS")
    if args.receipt:
        artifact = json.loads(args.package.read_text(encoding="utf-8"))
        receipt = build_receipt(args.package, artifact, args.module)
        args.receipt.parent.mkdir(parents=True, exist_ok=True)
        args.receipt.write_text(json.dumps(receipt, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        print(f"wrote receipt {args.receipt}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
