# Course 2 Codex figure notice

Last reviewed: 2026-08-26

This notice separates two different kinds of instructional media. They do not
share a provenance contract and must not be relabeled as one another.

## Product-interface captures

Figures `fig-13`, `fig-14`, `fig-15`, `fig-16`, `fig-17`, and `fig-22` are real
Codex product-interface captures. Their exact capture date, observed Codex
version, operating system, raw-source reference, OCR review, metadata review,
privacy review, publication approval, served-asset dimensions, and SHA-256
digests remain frozen in `lib/codex/figure-audits.json`.

Those six figures are editorial evidence of the identified interface state at
the recorded capture date. They do not promise that a later product version has
the same controls, prove that a learner's task will succeed, or imply OpenAI
endorsement. Their release requirements are not weakened by the presence of
course-original diagrams elsewhere in the course.

## Course-original abstract diagrams

Figures `fig-01` through `fig-12`, `fig-18` through `fig-21`, `fig-23`, and
`fig-24` are original abstract process diagrams created for this course. They
are not screenshots, simulated screenshots, interface mockups, or records of a
Codex session. Each image visibly states:

`COURSE-ORIGINAL ABSTRACT DIAGRAM · NOT PRODUCT UI`

The diagrams use course-authored geometry, text, colour, and synthetic labels.
They contain no copied third-party pixels, vendor logos, avatars, window chrome,
product trade dress, account data, personal data, private repository data,
credentials, tokens, or customer records. The renderer is
`scripts/render-codex-original-diagrams.mjs` at the version and SHA-256 recorded
in `lib/codex/diagram-rights.json`. The rights ledger also freezes every served
PNG/WebP path, dimension, and digest.

Rendering is bound to Sharp 0.35.3, libvips 8.18.3, and the declared
`Arial, Helvetica, sans-serif` host font stack. No font binary is copied into or
served by this course. Host font resolution is not claimed to be portable:
release validation rerenders all eighteen diagrams in an isolated temporary
directory and requires all fifty-four outputs to be byte-identical to the
published assets. Toolchain or font drift therefore fails closed instead of
authorizing replacement pixels or hashes. The project claims authorship of the
diagram composition and instructional text, not ownership of host font
software; the release operator remains responsible for an authorized rendering
environment.

The original diagrams and renderer are covered by the repository's MIT License,
whose copyright holder is HU Dongpin. Brand and product names used in the course
remain the property of their respective owners. This rights statement applies
to the course-original pixels; it does not grant rights in OpenAI, Codex,
ChatGPT, GitHub, IDE, or other third-party names and products.

## Source support and evidence boundary

Every original diagram is bound to one or more official OpenAI documentation
records already cited by its owning lesson. Those links support the described
product behavior or workflow concept. They are not the pixel source, do not
license a screenshot, and do not imply that the course diagram is an official
OpenAI diagram or standard.

The localized HTML caption supplies the learner-facing explanation. Text inside
the image is a compact supporting model and must not be treated as the only
instructional channel. The rendered model explains relationships; it does not
prove that a command ran, a test passed, a cloud task completed, a review found
all defects, an automation is safe, or a deployment is production-ready.

## Release checks

The Course 2 release checker fails closed unless:

- the product-interface set remains exactly the six audited figures above;
- the original-diagram set remains exactly the other eighteen figures;
- every product capture has its complete matching audit and authentic capture
  metadata;
- every original diagram has its complete matching rights record and has no
  capture date, Codex version, operating-system, screenshot source URL, or UI
  audit ID;
- official source IDs are valid and belong to the owning lesson;
- renderer, notice, license, asset paths, image containers, dimensions, metadata
  policy, and hashes match the frozen records;
- a release-only isolated rerender reproduces every original PNG and WebP byte
  for byte using the recorded Sharp/libvips/font-stack environment; and
- the original-diagram privacy and non-impersonation policy remains explicit.

A passing local gate establishes internal repository consistency for these
artifacts. It does not independently re-check remote documentation, establish
trademark rights, replace legal advice, verify a future product interface, or
prove production deployment.
