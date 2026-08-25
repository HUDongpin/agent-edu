# Course 11 translation readiness

Audit date: 2026-08-24<br>
Content language: English (`en`)<br>
Localized scope: navigation and course, unit, and lesson titles<br>
Independent native-speaker review: pending for every non-English locale

## Release truth

Course 11 is not a fully translated course. Its evidence-audited lesson text, exercises, assessment questions and answers, figure captions and provenance, source ledger, and interactive worksheets remain English and left-to-right. The locale routes provide localized navigation and course, unit, and lesson titles so a learner can discover and move through the English edition.

The structured locale dictionaries make this boundary machine-checkable with:

- `contentLanguage: en`
- `localizedScope: navigation-and-titles`
- `reviewStatus: pending-independent-native-review`

No locale may be advertised as a complete course translation while that status remains. Automated key parity, JSON validation, route rendering, and browser checks do not substitute for independent native-speaker review of meaning, terminology, cultural fit, bidirectional text, or commercial and legal nuance.

## Locale matrix

| Locale | Navigation and titles | Long-form course content | Native review | Release description |
| --- | --- | --- | --- | --- |
| `en` | Source edition | English | Editorially audited with the course | Audited English edition |
| `es` | Localized | English | Pending | Localized navigation to the English edition |
| `fr` | Localized | English | Pending | Localized navigation to the English edition |
| `de` | Localized | English | Pending | Localized navigation to the English edition |
| `zh-Hans` | Localized | English | Pending | Localized navigation to the English edition |
| `zh-Hant` | Localized | English | Pending | Localized navigation to the English edition |
| `ja` | Localized | English | Pending | Localized navigation to the English edition |
| `ko` | Localized | English | Pending | Localized navigation to the English edition |
| `ar` | Localized | English | Pending | Localized navigation to the English edition |

## Promotion gate

A non-English locale can move beyond `navigation-and-titles` only after all substantive lesson content, exercises, assessment, figure explanations, source boundaries, worksheets, privacy warnings, and earnings disclaimers are translated; an independent native speaker reviews the rendered route; bidirectional and keyboard behavior pass in a real browser; and the audit record is updated with reviewer, date, scope, findings, and corrections. Until then, canonical metadata and structured-data content language remain English.
