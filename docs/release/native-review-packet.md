# Native review packet

A working aid for the reviewer completing `native-review-form.md`. It is not
evidence, and it does not replace any row of that form.

```bash
npm run review:packet          # all eight locales
npm run review:packet -- de    # one
```

Writes `review-packets/<locale>.md`, one file per locale, gitignored on purpose:
each is roughly 250KB of bulk source text, and `docs/release/evidence/` is for
sanitized conclusions. Regenerate against the frozen candidate before a review
starts; a packet built from a different commit is describing a different site.

## Why it exists

The form asks a reviewer to judge terminology consistency across all three
course parts, to find unexplained English fallbacks, and to confirm placeholders
sit in the right surrounding grammar. Nothing in the repository let them see the
English beside their own language, so doing that honestly meant reading three
JSON files or clicking through every page in two themes at two widths. The
packet puts the two columns side by side, grouped one screen at a time, which is
the same property that makes the flat catalogues translator-editable in the
first place.

Each row is marked when it needs attention:

- **MISSING** — the key has no value in this locale.
- **SAME — unexplained** — the value is byte-identical to English and no entry
  in `localization.sameAsEnglishAllowlist` says why. Either correct it or add a
  reason; `tests/release-readiness.test.ts` checks the reasons stay true.
- **PLACEHOLDER MISMATCH** — the `{tokens}` differ from the English source.
- *plural form this language does not use* — not a gap. Japanese, Korean and
  both Chinese scripts carry only `.other`; Arabic carries `.zero`, `.two`,
  `.few` and `.many` that English never needs. Reported so a reviewer does not
  go looking for a string that is correctly absent.

The packet cannot see the rendered page. Line breaks, long labels, keyboard
order, RTL mirroring and anything else in the "Required paths and environments"
section still need the deployed candidate.

## What a review actually costs

Measured on 2026-08-30, per locale:

| Catalogue | Strings | English source words |
|---|---:|---:|
| Interface (`messages/*.json`) | 406 | 4,066 |
| Handbook prose (`messages/handbook/*.json`) | 540 | 4,519 |
| Widget run-time text (`messages/widgets/*.json`) | 676 | 5,494 |
| **Total** | **1,622** | **14,079** |

Eight locales is therefore about **112,600 words** of qualified human review,
plus the rendered-page passes the form requires. Budget from the word count, not
the string count: the three catalogues differ by more than three times in words
per string, so "1,622 strings" reads far cheaper than the work is.

This is the number the roadmap has been missing. It is worth running **one
locale end to end before committing to the rest** — the real hourly rate for
careful review in this register is unknown, and eight simultaneous reviews is an
expensive place to discover it. A locale with no unexplained-identical rows and
no placeholder mismatches, which is currently all eight, is the cheapest possible
starting condition; the cost is in reading meaning, not in chasing defects.

Adding a course adds to this queue. The three briefs in `docs/course-briefs/`
each name it as an inherited obligation for that reason.
