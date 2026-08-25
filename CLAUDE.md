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
User-visible strings are expected to live in the appropriate `messages/`
namespace. Never infer completion from the root dictionary or the language
menu: `npm run i18n:check:release -- --json` dynamically discovers namespaces,
routes and course contracts, and any missing target value is a release failure.
A translator must be able to fix a line without knowing React.

That audit needs a frozen build, browser evidence and a named human reviewer,
so it cannot gate a commit. `npm run i18n:check:keys` is the half that can:
the same discovery, restricted to what a missing key can decide on its own —
missing, extra, empty, wrong leaf type, wrong `{placeholder}` set, wrong
`**bold**` markers. It runs inside `npm run build`. It deliberately does not
judge whether a translation is any good; `unapproved-identical-to-english` is
a question for a native speaker and stays in the release audit. A namespace
with no file for a locale is the queue described below, so it is reported and
not failed.

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
that number may fall and never rise, which is what lets the remaining widgets
move across one at a time without the half-finished state rotting.

## Static export
`output: "export"`. No server, no middleware, no route handlers, no server
actions, no `next/image` optimiser. The lab calls the model provider straight
from the reader's browser with the reader's own key; nothing may introduce a
runtime that could hold a key.

## Prose
British spelling. Sentence case in headings. Prefer deleting a widget over adding
one. Do not rewrite existing copy to satisfy a linter.

## Before you say you're done
`npm run build` must pass; never assert a fixed page count. Reconcile the
App Router patterns, course manifests, sitemap and actual `out/**/*.html`
inventory dynamically. It runs `handbook:check`, `widgets:check`,
`i18n:check:keys` and every course release checker, so a missing translation
key fails the build rather than the release. `npm run i18n:check:release
-- --json` must additionally pass before release. Never commit `All API Keys.docx`
or anything matching the secrets block in `.gitignore`.
