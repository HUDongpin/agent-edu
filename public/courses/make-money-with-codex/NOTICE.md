# Course 11 figure notice

Last reviewed: 2026-08-23

This notice applies to the nine figure pairs in `figures/`. Every pair contains a master local asset and a derived WebP copy used for web delivery. Eight masters are first-party Course 11 captures or teaching fixtures. One master, `fig-03`, is transformed from an official image in a commit-pinned OpenAI repository.

## What the figures establish

The course deliberately separates authentic product-interface evidence from synthetic teaching evidence:

- `fig-01` and `fig-02` are real, current Codex desktop interface crops captured by the Course 11 production team on 2026-08-23 in the disposable `course11-codex-demo` workspace.
- `fig-03` is an official historical Codex CLI illustration from the `openai/codex` repository at immutable commit `343074d`. It is not presented as current UI.
- `fig-04` is an actual Codex CLI transcript from an ephemeral read-only run against the disposable repository. The substantive response was rendered verbatim in a first-party HTML fixture for legibility. Transport and plugin warnings, token count, and the ephemeral session ID were omitted.
- `fig-05` to `fig-07` are first-party synthetic product-output fixtures: a delivery dashboard, a proof-of-value prototype, and a digital-product reader.
- `fig-08` and `fig-09` are first-party synthetic repository-handoff fixtures. They are not GitHub screenshots and contain no external repository data.

Four figures therefore carry authentic Codex interface or transcript evidence: two live desktop captures, one official historical CLI illustration, and one actual CLI transcript rendering. Five figures teach downstream commercial delivery patterns with invented data. A figure can show an interface, artefact, or review pattern; it cannot by itself prove customer demand, a paid contract, revenue, profit, productivity, production readiness, or a typical outcome.

The X links attached to eight figures remain valuable practitioner context, and the OpenAI Developers community page remains a provenance locator. Those contextual links are not the pixel source for the first-party figures. The record confirms that no creator-post image pixels were copied or redistributed in `fig-01`, `fig-02`, or `fig-04` to `fig-09`. OpenAI curation is not treated as independent verification, a reuse licence, or an endorsement.

Exact source links, classifications, dimensions, SHA-256 digests, contextual authors, evidence boundaries, visible identifiers, and privacy notes are recorded in `lib/make-money-with-codex/figures.ts` and `evidence/course-audits/make-money-with-codex/figure-provenance.md`.

## Rights basis

The repository records two rights bases:

- `fig-01`, `fig-02`, and `fig-04` to `fig-09` use `first-party-original` with capture method `first-party-synthetic-capture`. Their capture details and publication permission are recorded in `evidence/course-audits/make-money-with-codex/first-party-captures/rights-record.md`. The synthetic qualifier refers to the disposable workspace and invented teaching data. The desktop pixels in `fig-01` and `fig-02` are live Codex app captures, and the substantive CLI response in `fig-04` came from an actual run.
- `fig-03` uses `apache-2.0-pinned-source`. Its source is the official `openai/codex` repository at commit `343074d4207d572809bd8cea15f4be1d09d98e0b`. The applicable files are retained as `licenses/openai-codex-343074d-LICENSE.txt` and `licenses/openai-codex-343074d-NOTICE.txt`. Reuse must retain and comply with that licence and notice.

OpenAI, Codex, GitHub, X, and other names or interface elements may be protected by trademark or other rights. This course does not claim those rights and does not imply endorsement by OpenAI, GitHub, X, any practitioner, or any contextual source. This notice documents provenance and permissions; it is not legal advice.

## Privacy review

Every first-party master was manually reviewed at full resolution on 2026-08-23. The live app capture was deliberately cropped to exclude the account name, sidebar, unrelated projects, task history, notifications, and unrelated windows. The actual CLI run used a disposable local path, approval policy `never`, and sandbox `read-only`; the inspected disposable project used no external integrations or customer services. The five teaching fixtures were authored locally with invented project names, records, prices, findings, and commit hashes.

No first-party figure contains a credential, token, email address, private account identifier, real customer record, private repository detail, real person name, or third-party avatar. The visible identifiers are limited to invented course identifiers, dated public product labels, and the disposable `/tmp/course11-codex-demo` path. `fig-03` contains only public historical labels from the official repository image.

The full record for each first-party figure includes the figure ID, contextual source URL, synthetic-data statement, capture date, product version, operating system, capture method, and privacy review.

## Transformations and local bytes

The PNG masters for `fig-01`, `fig-02`, and `fig-04` to `fig-09` are the first-party capture outputs. Their matching WebP files were generated locally for delivery with metadata excluded. The recorded hashes identify the exact local bytes.

The upstream `fig-03` asset is a 1898 x 1190 PNG. It was resized and converted into the local 1600 x 1003 JPEG master and 1600 x 1003 WebP delivery copy. Upstream EXIF, XMP, and display-profile metadata were removed after conversion so the embedded metadata cannot contradict the published dimensions. The local digests therefore identify transformed assets, not the upstream PNG bytes.

The release validator checks the expected files, pixel dimensions, SHA-256 digests, classification counts, lesson references, rights record, privacy record, and absence of unverified creator-image rights. It also confirms that the strict Course 11 gate runs before the production build.

Run from the repository root:

```sh
node scripts/check-make-money-with-codex-course.mjs
node scripts/check-make-money-with-codex-course.mjs --release
```

A passing result establishes internal repository consistency. It does not independently verify remote claims, guarantee that a UI is still current after the recorded date, create trademark rights, promise income, or replace legal review for a particular publication.
