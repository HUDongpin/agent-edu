# Native-language release review form

Complete one copy for each of `zh-Hans`, `zh-Hant`, `ar`, `de`, `es`, `fr`,
`ja`, and `ko`. Automated coverage is a prerequisite, not a substitute for this
signature.

## Review identity and frozen target

After `releaseTarget.candidateCommitSha` and its authoritative
`.github/workflows/ci.yml` blob are frozen, run
`npm run native-review:inventory:generate`. It writes the deterministic final
candidate inventory to
`docs/release/evidence/native-review-catalog-inventory.json`: exactly eight
locales × Site, Handbook, and Widgets, with one SHA-256 digest and top-level key
count per file. Run `npm run native-review:inventory:check` immediately before
and after each review. The checker rejects a wrong candidate/workflow binding,
digest or key-count drift, missing or extra catalog files, unsafe paths, and
private values.

The older automatic precheck at
`docs/release/evidence/native-review-catalog-precheck-2cdf1d6.json` remains a
historical report-only snapshot. It cannot satisfy the final-candidate gate.
The new inventory may save repeated work when a later evidence-only commit
leaves all 24 inputs and the workflow blob unchanged, but any changed digest
requires regeneration and review of that changed locale. Neither inventory
contains reviewer identity, changes any of the eight pending review statuses,
or substitutes for the signed language-quality judgment below.

- Locale and regional variant:
- Reviewer reference (do not add private contact details):
- Reviewer confirms native or professional-level competence: yes / no
- Release commit SHA:
- Vercel deployment ID (not a signed or bypass URL):
- Review started at (UTC):
- Review completed at (UTC):
- Evidence record ID:

## Required paths and environments

Review the home page → Handbook → Control Room → browser Lab → TypeScript course
handoff at 390px and 1440px, in light and dark themes. Use keyboard-only
navigation for the full representative journey. Arabic additionally requires
every row in `arabic-rtl-matrix.md`.

## Native review checklist

- [ ] Site, Handbook, and Widget catalogs contain no unexplained English fallback.
- [ ] Navigation, tabs, Control Room, progress, Part 3 handoff, errors, cost,
      privacy, ARIA labels, and alternative text are understandable.
- [ ] Terminology is consistent across all three course parts.
- [ ] Tone is natural, respectful, and suitable for a software-engineering beginner.
- [ ] Punctuation, spacing, line breaks, numerals, and long labels fit the locale.
- [ ] Placeholders render in the right location and with the right surrounding grammar.
- [ ] Links and controls describe their actual destination/action.
- [ ] DeepSeek, TypeScript, API, JSON, model IDs, hostnames, and code remain
      unchanged only where the reasoned allowlist says they should.
- [ ] Code, URLs, identifiers, and model names remain visually readable and LTR.
- [ ] No translated claim overstates privacy, price certainty, progress, completion,
      Provider support, or classroom capacity.

## Findings

| Severity | Route/key | Observation | Required correction | Retest result |
|---|---|---|---|---|
|  |  |  |  |  |

Severity is `blocker`, `major`, or `minor`. Any unresolved blocker or major
content error makes the locale result `fail`; it is never converted to pending.

## Signed conclusion

- Decision: pass / fail
- Open minor issues accepted for this release, with rationale:
- Reviewer attestation: “I reviewed the frozen target in this locale. The
  conclusion above is my human language-quality judgment; it was not generated
  from automated coverage alone.”
- Reviewer reference:
- UTC timestamp:
- Second reviewer confirms evidence is sanitized: yes / no
