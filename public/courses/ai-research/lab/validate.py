#!/usr/bin/env python3
"""Offline, fail-closed validator for the Course 17 mini-review package."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

SCHEMA_ID = "aicourse.ai-research.capstone.v1"
VALIDATOR_ID = "aicourse.ai-research.validator.v1"
COURSE_VERSION = "2026.08.26-v1"
CAPSTONE_VERSION = "2026.08.26-capstone-v1"
FIXTURE_PATH = "public/courses/ai-research/mini-review-corpus-synthetic-v1.json"
FIXTURE_SHA256 = "5422f89257ff800668e0c6c5db862349d1bcbd11ab932a005fa4bd42b3610ad4"
PRIMARY_MANIFEST_PATH = "public/courses/ai-research/lab/primary-object-manifest.json"
PRIMARY_MANIFEST_SCHEMA = "aicourse.ai-research.primary-manifest.v1"
PRIMARY_MANIFEST_SHA256 = "d015a6bc161379a15b6dee8ca59b935a536e9616082772086af17a69d3ac3a8e"
GENERATOR_PATH = "scripts/generate-ai-research-primary-pdfs.py"
GENERATOR_SHA256 = "fed796e8c2e100c120894f87f05f6c455654853b1aefaba6b247675b4f8d9860"
ROOT = Path(__file__).resolve().parents[4]

ARTIFACT_IDS = (
    "protocol",
    "search-log",
    "inclusion-exclusion-ledger",
    "claim-evidence-matrix",
    "extraction-sheet",
    "analysis-reproduction-package",
    "citation-audit",
    "ai-disclosure-failure-log",
)
CRITERIA = (
    "purpose-risk-stop",
    "data-rights-minimisation",
    "subgroups-uncertainty",
    "human-authority-recourse",
    "challenge-incident-recovery",
    "evidence-decision-expiry",
)
SCREENING_FLOW = {
    "total": 11,
    "included": 3,
    "excluded": 5,
    "duplicate": 1,
    "awaiting": 1,
    "linkedCorrection": 1,
}
EXPECTED_PDFS = {
    "REC-001": ("public/courses/ai-research/primary/REC-001.pdf", 9, "6b7ade61c5c33784fb48c22b4ec6fa6e2ee235c6c436551743eb41445b66c1ef"),
    "REC-002": ("public/courses/ai-research/primary/REC-002.pdf", 11, "631a4bd74a026fcce0d16681ebd5a37d206851ed4767473f460dd7c320af371a"),
    "REC-005": ("public/courses/ai-research/primary/REC-005.pdf", 13, "8a7d06815c40041f97b4a67fd453b7a144e07175609021494dae4448b612043e"),
}
PLACEHOLDER = re.compile(r"\b(?:todo|tbd|placeholder|coming soon)\b|<[^>]+>", re.I)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(65536), b""):
            digest.update(block)
    return digest.hexdigest()


def load_json(path: Path, label: str, errors: list[str]) -> object | None:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        errors.append(f"{label} is not readable JSON: {error}")
        return None


def nonempty_strings(value: object) -> bool:
    return isinstance(value, list) and bool(value) and all(
        isinstance(item, str) and bool(item.strip()) for item in value
    )


def validate_locked_inputs(root: Path, errors: list[str]) -> tuple[dict[str, object] | None, dict[str, object] | None]:
    fixture_path = root / FIXTURE_PATH
    if not fixture_path.is_file() or sha256(fixture_path) != FIXTURE_SHA256:
        errors.append("locked fictional corpus is missing or its SHA-256 changed")
        fixture = None
    else:
        loaded_fixture = load_json(fixture_path, "locked fictional corpus", errors)
        fixture = loaded_fixture if isinstance(loaded_fixture, dict) else None
        if fixture is not None and fixture.get("fixture_version") != "ai-research-mini-review-corpus.v1":
            errors.append("locked fictional corpus version is invalid")

    manifest_path = root / PRIMARY_MANIFEST_PATH
    if not manifest_path.is_file() or sha256(manifest_path) != PRIMARY_MANIFEST_SHA256:
        errors.append("primary-object manifest is missing or its SHA-256 changed")
        manifest = None
    else:
        loaded_manifest = load_json(manifest_path, "primary-object manifest", errors)
        manifest = loaded_manifest if isinstance(loaded_manifest, dict) else None

    generator = root / GENERATOR_PATH
    if not generator.is_file() or sha256(generator) != GENERATOR_SHA256:
        errors.append("the locked PDF generator is missing or its SHA-256 changed")

    if manifest is None:
        return fixture, None
    if manifest.get("schemaId") != PRIMARY_MANIFEST_SCHEMA:
        errors.append("primary-object manifest schema ID is invalid")
    objects = manifest.get("objects")
    if not isinstance(objects, list) or {item.get("recordId") for item in objects if isinstance(item, dict)} != set(EXPECTED_PDFS):
        errors.append("primary-object manifest must contain exactly REC-001, REC-002, and REC-005")
        return fixture, manifest
    seen_locators: set[str] = set()
    for item in objects:
        if not isinstance(item, dict):
            continue
        record_id = item.get("recordId")
        if record_id not in EXPECTED_PDFS:
            continue
        expected_path, expected_pages, expected_hash = EXPECTED_PDFS[record_id]
        if (item.get("path"), item.get("pages"), item.get("sha256")) != (expected_path, expected_pages, expected_hash):
            errors.append(f"{record_id} manifest path, page count, or SHA-256 changed")
        pdf_path = root / expected_path
        if not pdf_path.is_file():
            errors.append(f"{record_id} PDF is missing")
            continue
        payload = pdf_path.read_bytes()
        if not payload.startswith(b"%PDF-") or sha256(pdf_path) != expected_hash:
            errors.append(f"{record_id} PDF bytes do not match the locked primary object")
        page_count = len(re.findall(rb"/Type\s*/Page(?!s)\b", payload))
        if page_count != expected_pages:
            errors.append(f"{record_id} PDF page count must be {expected_pages}, found {page_count}")
        locators = item.get("locators")
        if not isinstance(locators, list) or len(locators) != 3:
            errors.append(f"{record_id} must expose exactly three page-level locators")
            continue
        for locator in locators:
            if not isinstance(locator, dict):
                errors.append(f"{record_id} contains an invalid locator")
                continue
            locator_id = locator.get("id")
            if not isinstance(locator_id, str) or locator_id in seen_locators:
                errors.append(f"{record_id} contains a missing or duplicate locator ID")
                continue
            seen_locators.add(locator_id)
            if not isinstance(locator.get("page"), int) or not 1 <= locator["page"] <= expected_pages:
                errors.append(f"{locator_id} points outside the PDF")
            for key in ("locator", "expectedText", "boundary"):
                if not isinstance(locator.get(key), str) or not locator[key].strip():
                    errors.append(f"{locator_id}.{key} is required")
    if len(seen_locators) != 9:
        errors.append("the primary-object manifest must expose exactly nine unique locators")
    return fixture, manifest


def validate(package_path: Path, root: Path = ROOT) -> list[str]:
    errors: list[str] = []
    package_object = load_json(package_path, "package", errors)
    if not isinstance(package_object, dict):
        return errors or ["package root must be an object"]
    package = package_object
    fixture, manifest = validate_locked_inputs(root, errors)

    expected_scalars = {
        "schemaId": SCHEMA_ID,
        "courseId": "ai-research",
        "courseVersion": COURSE_VERSION,
        "capstoneVersion": CAPSTONE_VERSION,
    }
    for key, expected in expected_scalars.items():
        if package.get(key) != expected:
            errors.append(f"{key} must equal {expected}")
    fixture_ref = package.get("fixture")
    if not isinstance(fixture_ref, dict) or fixture_ref != {"path": FIXTURE_PATH, "sha256": FIXTURE_SHA256}:
        errors.append("fixture reference must bind the locked fictional corpus path and SHA-256")
    manifest_ref = package.get("primaryManifest")
    if not isinstance(manifest_ref, dict) or manifest_ref != {"path": PRIMARY_MANIFEST_PATH, "schemaId": PRIMARY_MANIFEST_SCHEMA}:
        errors.append("primaryManifest must bind the locked page-evidence manifest")

    artifacts = package.get("artifacts")
    if not isinstance(artifacts, dict) or set(artifacts) != set(ARTIFACT_IDS):
        errors.append("artifacts must contain exactly the eight locked IDs")
    else:
        for artifact_id in ARTIFACT_IDS:
            artifact = artifacts[artifact_id]
            if not isinstance(artifact, dict):
                errors.append(f"{artifact_id} must be an object")
                continue
            if artifact.get("status") != "complete":
                errors.append(f"{artifact_id}.status must be complete")
            if not nonempty_strings(artifact.get("evidence")):
                errors.append(f"{artifact_id}.evidence requires reviewable evidence")
            if not nonempty_strings(artifact.get("limitations")):
                errors.append(f"{artifact_id}.limitations requires an explicit boundary")

    if package.get("screeningFlow") != SCREENING_FLOW:
        errors.append("screeningFlow must reconcile all eleven fixture records")

    manifest_locators: dict[str, tuple[dict[str, object], dict[str, object]]] = {}
    if manifest is not None:
        for obj in manifest.get("objects", []):
            if not isinstance(obj, dict):
                continue
            for locator in obj.get("locators", []):
                if isinstance(locator, dict) and isinstance(locator.get("id"), str):
                    manifest_locators[locator["id"]] = (obj, locator)
    primary_evidence = package.get("primaryEvidence")
    if not isinstance(primary_evidence, list) or len(primary_evidence) != 9:
        errors.append("primaryEvidence must contain the nine locked page checks")
    else:
        evidence_ids = {item.get("locatorId") for item in primary_evidence if isinstance(item, dict)}
        if evidence_ids != set(manifest_locators):
            errors.append("primaryEvidence locator IDs must exactly match the primary manifest")
        for item in primary_evidence:
            if not isinstance(item, dict):
                errors.append("primaryEvidence entries must be objects")
                continue
            locator_id = item.get("locatorId")
            if locator_id not in manifest_locators:
                continue
            obj, locator = manifest_locators[locator_id]
            exact = {
                "recordId": obj.get("recordId"),
                "path": obj.get("path"),
                "page": locator.get("page"),
                "locator": locator.get("locator"),
                "extractedText": locator.get("expectedText"),
                "boundary": locator.get("boundary"),
            }
            for key, expected in exact.items():
                if item.get(key) != expected:
                    errors.append(f"{locator_id}.{key} must match the locked PDF locator")
            if item.get("evidenceKind") != "primary-pdf-page":
                errors.append(f"{locator_id} final evidence must be primary-pdf-page, never a RAG chunk")
            if item.get("verified") is not True:
                errors.append(f"{locator_id} must record a completed primary-object check")
            if not isinstance(item.get("verifier"), str) or not item["verifier"].strip():
                errors.append(f"{locator_id}.verifier is required")

    rejections = package.get("ragLocatorRejections")
    if not isinstance(rejections, list) or not rejections:
        errors.append("ragLocatorRejections must preserve at least one rejected locator-only claim")
    else:
        for index, rejection in enumerate(rejections):
            if not isinstance(rejection, dict):
                errors.append(f"ragLocatorRejections[{index}] must be an object")
                continue
            if rejection.get("evidenceKind") != "rag-chunk" or rejection.get("rejected") is not True:
                errors.append(f"ragLocatorRejections[{index}] must explicitly reject a RAG chunk")
            if rejection.get("primaryResolution") not in manifest_locators:
                errors.append(f"ragLocatorRejections[{index}] must resolve to a locked PDF locator")
            if not isinstance(rejection.get("reason"), str) or not rejection["reason"].strip():
                errors.append(f"ragLocatorRejections[{index}].reason is required")

    expected_citations = {}
    if fixture is not None:
        for case in fixture.get("citation_audit_cases", []):
            if isinstance(case, dict) and isinstance(case.get("audit_id"), str):
                expected_citations[case["audit_id"]] = case
    citation_audit = package.get("citationAudit")
    if not isinstance(citation_audit, list) or {item.get("auditId") for item in citation_audit if isinstance(item, dict)} != set(expected_citations):
        errors.append("citationAudit must cover exactly the three locked citation cases")
    else:
        for item in citation_audit:
            if not isinstance(item, dict):
                continue
            audit_id = item.get("auditId")
            expected = expected_citations[audit_id]
            if item.get("status") != "corrected" or item.get("reviewed") is not True:
                errors.append(f"{audit_id} must be human-reviewed and corrected")
            if item.get("saferWording") != expected.get("safer_wording"):
                errors.append(f"{audit_id}.saferWording must match the locked correction")
            if not isinstance(item.get("primaryLocator"), str) or not item["primaryLocator"].strip():
                errors.append(f"{audit_id}.primaryLocator is required")

    gate = package.get("responsibleAiGate")
    if not isinstance(gate, dict) or gate.get("version") != COURSE_VERSION:
        errors.append("responsibleAiGate version is missing or stale")
    elif tuple(gate.get("criteria", [])) != CRITERIA:
        errors.append("responsibleAiGate criteria must use the six canonical IDs in order")

    disclosure = package.get("aiDisclosure")
    if not isinstance(disclosure, dict):
        errors.append("aiDisclosure is required")
    else:
        if disclosure.get("verifiedByHuman") is not True:
            errors.append("aiDisclosure.verifiedByHuman must be true")
        if not isinstance(disclosure.get("tool"), str) or not disclosure["tool"].strip():
            errors.append("aiDisclosure.tool is required")
        if not nonempty_strings(disclosure.get("failures")):
            errors.append("aiDisclosure.failures must preserve at least one failure or rejected output")
        if not nonempty_strings(disclosure.get("nonClaims")):
            errors.append("aiDisclosure.nonClaims must state what the review does not establish")

    reviewer = package.get("reviewer")
    if not isinstance(reviewer, dict):
        errors.append("reviewer object is required")
    else:
        if not isinstance(reviewer.get("role"), str) or not reviewer["role"].strip():
            errors.append("reviewer.role is required")
        if reviewer.get("decision") not in {"accept", "accept-with-limitations"}:
            errors.append("reviewer.decision is invalid")
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(reviewer.get("reviewedOn", ""))):
            errors.append("reviewer.reviewedOn must be an ISO date")

    if PLACEHOLDER.search(json.dumps(package, ensure_ascii=False)):
        errors.append("package contains an unresolved template token")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--package", required=True, type=Path)
    args = parser.parse_args()
    errors = validate(args.package)
    result = {
        "ok": not errors,
        "schemaId": SCHEMA_ID,
        "validatorId": VALIDATOR_ID,
        "courseVersion": COURSE_VERSION,
        "package": str(args.package),
        "packageSha256": sha256(args.package) if args.package.is_file() else None,
        "errors": errors,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main())
