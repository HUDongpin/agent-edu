# Course 20 source and claim ledger

Research cutoff: 2026-08-28

## Evidence classes

| Class | Permitted support | Prohibited inference |
|---|---|---|
| Official standard | The scoped normative or measurement claim in the cited version | Universal destination, legal, rights, or quality guarantee |
| Official documentation | Documented tool/protocol/editorial behavior at the reviewed version/date | Cross-version behavior or complete production correctness |
| Law/regulatory guidance | Jurisdiction-specific text and identified scope | Global rule or legal advice for a learner's facts |
| GitHub repository | Inspectable implementation mechanism, version, and license boundary | Performance, safety, accessibility, rights, or completeness proof |
| X post | Dated author/project field signal and visible oEmbed text | Benchmark, reliability, quality, cost, or normative proof |
| Course policy | Conservative fail-closed rule selected for this curriculum | Claim that the policy is universal law or industry consensus |

## Required official anchors

- W3C/WCAG: media planning, prerecorded captions, and visual-description applicability.
- ITU-R BS.1770 and EBU R 128: measurement algorithm versus broadcast recommendation versus destination contract.
- ACES: official color-management concepts and transform boundaries.
- FFmpeg/ffprobe: execution and machine-readable media observation.
- OpenTimelineIO: timeline structure/interchange and the no-render/no-automatic-range-verification boundary.
- Model Context Protocol: tool schema, results, human confirmation, and untrusted annotations.
- OWASP: prompt injection, indirect multimodal/file input, and excessive agency.
- C2PA 2.4: tamper-evident provenance and the no-value-judgment boundary.
- BBC Editorial Guidelines: materially misleading juxtaposition/manipulation boundary for factual work.
- Adobe Premiere documentation: J/L cut terminology and mechanics as vendor practice.
- EUR-Lex Regulation (EU) 2024/1689 Article 50: EU-specific transparency provisions and exceptions.
- U.S. Copyright Office AI Study: U.S.-specific digital-replica and human-authorship analysis.

The machine-readable source records are in `lib/agentic-video-editing/sources.ts`. The machine-readable claim records and their support/category/boundary fields are in `lib/agentic-video-editing/claims.ts`. Every teaching section references stable claim IDs; release validation rejects missing claims, missing sources, direct X proof, FFmpeg-only caption standards, and legal claims without jurisdiction boundaries.

## High-risk non-inference rules

- A successful FFmpeg or ffprobe process does not prove semantics, accessibility, rights, consent, privacy, or release readiness.
- A C2PA manifest does not prove factual truth, ownership, consent, or lawful use.
- A GitHub repository or X post does not prove performance or course completeness.
- WCAG applicability is assessed against actual content and destination; one sidecar or automated transcript is not conformance proof.
- ITU measurement and EBU broadcast recommendations do not create one loudness target for all social platforms.
- EU and U.S. sources remain jurisdiction-specific and the course is not legal advice.
- `do-not-publish` is an affirmative, valid, hash-bound release decision.
