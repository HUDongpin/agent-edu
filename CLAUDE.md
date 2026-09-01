@AGENTS.md

# House rules for this repo

## What must not be rewritten
`lib/flowchart.ts`, `lib/handbook/behaviour.ts` and `lib/handbook/markup.ts` were
ported byte-for-byte from the verified single-file build. Twenty diagrams were
checked for text overlap, edge-through-node crossings and greyscale legibility;
`behaviour.ts` carries 210 DOM queries against the ids in `markup.ts`. React owns
mounting, this code owns behaviour. Do not "modernise into JSX", do not rename an
id, do not reformat. Fix a real bug in place, in the smallest possible diff, and
say in the commit message what you verified afterwards.

## Themes
Any new colour needs tokens in all THREE blocks of `app/globals.css`: `:root`,
`@media (prefers-color-scheme:dark) :root:not([data-theme="light"])`, and
`:root[data-theme="dark"]`. Miss one and the element goes invisible for readers
who toggled the theme by hand.

## RTL
CSS logical properties only — `margin-inline-start`, `inset-inline-end`,
`padding-block`. Never `left`/`right`/`margin-left`. Arabic mirrors the whole
layout from `dir="rtl"` on <html> with no second stylesheet, and that only holds
if the rule has no exceptions. Untranslated English content keeps `dir="ltr"`.

## Strings
Every user-visible string lives in `messages/*.json` — flat keys, one file per
language, nine languages, currently 100% covered. Adding a string to English
without adding it to the other eight is a regression, not a to-do. A translator
must be able to fix a line without knowing React.

The handbook's article prose is the exception, and lives in `messages/handbook/`.
`en.json` there is **generated** — never hand-edit it. Change the wording in
`lib/handbook/markup.ts` and re-run `npm run handbook:extract`; `npm run
handbook:check` fails when the two have drifted. The other eight are a
translation queue rather than a regression: a locale with no file keeps the
English prose, and dropping one in turns that language on at the next build.
Keys carry an ordinal, so inserting a paragraph mid-section renumbers the text
nodes after it — re-extract and re-check every table when you do.

The text the widgets write at run time — verdicts, banners, counters, the step
log — is the second exception, and lives in `messages/widgets/`. Same queue
semantics as above, but hand-authored rather than generated, and merged per key
so an untranslated verdict beside a translated counter reads as a gap. Widgets
reach it through the `C` handed to `initHandbook`: `C.t` for a textContent
sink, `C.h` for innerHTML, `C.p(key, n)` to pick a plural form. A message is
plain text carrying `{placeholders}`, `**bold**` and `*italic*` and nothing
else — never HTML, so a translator cannot break the page. Never reassemble a
sentence with `+`: the pieces only go back in the English order.

`npm run widgets:check` is what replaces reading the diff on `behaviour.ts`. It
proves every key resolves, that the placeholders a message declares are the
values the call site passes in every language, that a plural carries the forms
its language needs, and that every id the file queries still exists in
`markup.ts`. It also carries a ratchet on how much copy is still hard-coded:
that number may fall and never rise, which let the widgets move across one at
a time without the half-finished state rotting. They have all moved: the
ratchet is at zero, so it is now a floor rather than an allowance — put a
reader-facing literal in `behaviour.ts` and the check fails.

## Static export
`output: "export"`. No server, no middleware, no route handlers, no server
actions, no `next/image` optimiser. The lab calls the model provider straight
from the reader's browser with the reader's own key; nothing may introduce a
runtime that could hold a key.

## Prose
British spelling. Sentence case in headings. Prefer deleting a widget over adding
one. Do not rewrite existing copy to satisfy a linter.

## Before you say you're done
`npm run build` must pass, and `npm run routes:check` must agree with
`config/route-manifest.json` — that checker is the gate, not a number written
down here. It currently reports 66 public + 2 internal = 68. The count moves by
nine every time a localised path is added, so check it rather than trusting this
sentence. Never commit `All API Keys.docx` or anything matching the secrets
block in `.gitignore`.
