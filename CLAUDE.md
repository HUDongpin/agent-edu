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

## Static export
`output: "export"`. No server, no middleware, no route handlers, no server
actions, no `next/image` optimiser. The lab calls the model provider straight
from the reader's browser with the reader's own key; nothing may introduce a
runtime that could hold a key.

## Prose
British spelling. Sentence case in headings. Prefer deleting a widget over adding
one. Do not rewrite existing copy to satisfy a linter.

## Before you say you're done
`npm run build` must pass and still emit 50 pages. Never commit `All API Keys.docx`
or anything matching the secrets block in `.gitignore`.
