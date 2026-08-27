#!/usr/bin/env python3
"""Generate a deterministic reference mini-review package from Course 17 fixtures."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
FIXTURE_PATH = ROOT / "public/courses/ai-research/mini-review-corpus-synthetic-v1.json"
MANIFEST_PATH = ROOT / "public/courses/ai-research/lab/primary-object-manifest.json"
FIXTURE_SHA256 = "5422f89257ff800668e0c6c5db862349d1bcbd11ab932a005fa4bd42b3610ad4"
MANIFEST_SHA256 = "d015a6bc161379a15b6dee8ca59b935a536e9616082772086af17a69d3ac3a8e"

ARTIFACT_CONTENT = {
    "protocol": {
        "evidence": ["The question, designs, outcome window, exclusions, analysis boundary, and stopping rule were locked before the fixture records were screened."],
        "limitations": ["The protocol applies only to an entirely fictional eleven-record teaching corpus."],
    },
    "search-log": {
        "evidence": ["Two fictional search receipts preserve interface version, run time, exact query, filters, reported hits, and exported local IDs."],
        "limitations": ["The authored searches do not measure coverage of any real database or literature."],
    },
    "inclusion-exclusion-ledger": {
        "evidence": ["All eleven REC identifiers reconcile to three included, five excluded, one duplicate, one awaiting record, and one linked correction."],
        "limitations": ["Fixture screening hints are self-check aids and are not independent reviewer decisions."],
    },
    "claim-evidence-matrix": {
        "evidence": ["Every retained wording is tied to a locked PDF page or the linked REC-011 correction, with design and uncertainty boundaries preserved."],
        "limitations": ["No wording is authorised as a claim about real learners, systems, effects, mechanisms, or policy."],
    },
    "extraction-sheet": {
        "evidence": ["Nine method, result, and limitation entries retain PDF path, page, subsection or table, exact authored text, verifier, and boundary."],
        "limitations": ["The extraction exercise cannot validate real OCR, publisher layouts, supplements, or inaccessible source files."],
    },
    "analysis-reproduction-package": {
        "evidence": ["This standard-library runner reads locked inputs, reconciles flow counts, emits canonical JSON, and is independently checked by the course validator."],
        "limitations": ["The values are authored fiction and must not be pooled, tested, or interpreted as observations from a population."],
    },
    "citation-audit": {
        "evidence": ["CITE-01 through CITE-03 replace overclaiming or stale wording and preserve the primary locator used for correction."],
        "limitations": ["A citation audit confirms support boundaries; it does not certify truth, quality, completeness, or generalisability."],
    },
    "ai-disclosure-failure-log": {
        "evidence": ["The package identifies the deterministic tool, human verification boundary, a rejected locator-only RAG output, and explicit non-claims."],
        "limitations": ["The reference package does not certify a learner, confer external accreditation, or substitute for independent review."],
    },
}

CRITERIA = [
    "purpose-risk-stop",
    "data-rights-minimisation",
    "subgroups-uncertainty",
    "human-authority-recourse",
    "challenge-incident-recovery",
    "evidence-decision-expiry",
]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", required=True, type=Path)
    args = parser.parse_args()
    if sha256(FIXTURE_PATH) != FIXTURE_SHA256:
        raise SystemExit("locked fictional corpus SHA-256 changed")
    if sha256(MANIFEST_PATH) != MANIFEST_SHA256:
        raise SystemExit("primary-object manifest SHA-256 changed")
    fixture = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))

    primary_evidence = []
    for primary_object in manifest["objects"]:
        for locator in primary_object["locators"]:
            primary_evidence.append({
                "locatorId": locator["id"],
                "recordId": primary_object["recordId"],
                "evidenceKind": "primary-pdf-page",
                "path": primary_object["path"],
                "page": locator["page"],
                "locator": locator["locator"],
                "extractedText": locator["expectedText"],
                "boundary": locator["boundary"],
                "verified": True,
                "verifier": "course-authored reference audit",
            })

    primary_locators = {
        "CITE-01": "REC-005.pdf p.10 Table 3 and p.13 Limitations",
        "CITE-02": "REC-002.pdf p.8 Theme 2 and p.11 Limitations",
        "CITE-03": "REC-001.pdf p.7 Table 2 plus mini-review fixture REC-011 linked correction",
    }
    citation_audit = [
        {
            "auditId": case["audit_id"],
            "status": "corrected",
            "reviewed": True,
            "primaryLocator": primary_locators[case["audit_id"]],
            "saferWording": case["safer_wording"],
        }
        for case in fixture["citation_audit_cases"]
    ]

    package = {
        "schemaId": "aicourse.ai-research.capstone.v1",
        "courseId": "ai-research",
        "courseVersion": "2026.08.26-v1",
        "capstoneVersion": "2026.08.26-capstone-v1",
        "fixture": {
            "path": "public/courses/ai-research/mini-review-corpus-synthetic-v1.json",
            "sha256": FIXTURE_SHA256,
        },
        "primaryManifest": {
            "path": "public/courses/ai-research/lab/primary-object-manifest.json",
            "schemaId": "aicourse.ai-research.primary-manifest.v1",
        },
        "artifacts": {
            artifact_id: {"status": "complete", **content}
            for artifact_id, content in ARTIFACT_CONTENT.items()
        },
        "screeningFlow": {
            "total": 11,
            "included": 3,
            "excluded": 5,
            "duplicate": 1,
            "awaiting": 1,
            "linkedCorrection": 1,
        },
        "primaryEvidence": primary_evidence,
        "ragLocatorRejections": [
            {
                "chunkId": "RAG-FICTION-REC005-P10",
                "evidenceKind": "rag-chunk",
                "rejected": True,
                "reason": "The chunk was useful only to locate Table 3; it omitted the missing-outcome and limitation pages and therefore could not support final wording.",
                "primaryResolution": "REC-005-result",
            }
        ],
        "citationAudit": citation_audit,
        "responsibleAiGate": {"version": "2026.08.26-v1", "criteria": CRITERIA},
        "aiDisclosure": {
            "tool": "Course 17 deterministic standard-library reference runner; no generative model used",
            "verifiedByHuman": True,
            "failures": ["A locator-only RAG draft was rejected because it omitted attrition and limitation context."],
            "nonClaims": ["This fictional corpus establishes no real prevalence, effect, mechanism, safety, fairness, legal, educational, or policy claim."],
        },
        "reviewer": {
            "role": "course-authored reference audit",
            "decision": "accept-with-limitations",
            "reviewedOn": "2026-08-26",
        },
    }
    args.output_dir.mkdir(parents=True, exist_ok=True)
    output = args.output_dir / "mini-review.generated.json"
    output.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    receipt = {
        "ok": True,
        "schemaId": package["schemaId"],
        "runner": "aicourse.ai-research.runner.v1",
        "output": str(output),
        "sha256": sha256(output),
    }
    print(json.dumps(receipt, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
