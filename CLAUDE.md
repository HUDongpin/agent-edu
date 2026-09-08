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

A server component reads the whole table for free; a *client* one reads through
React context, and everything in that context is serialised into the page twice
— into the flight payload inlined in the HTML, and into the `.txt` a `<Link>`
prefetches. So the table is scoped: `Shell` provides the chrome's six keys and
each route adds its own with `<I18nScope>`. `config/i18n-scopes.json` is
**generated** from the import graph by `npm run i18n:extract` — never hand-edit
it — and `npm run i18n:check` fails on drift, on a route that has a scope and
does not apply it, and on any key rendered as its own name in `out/`. That last
rule is the point: a key outside its scope does not throw, it renders as
`nav.theme`, and every other gate stays green. Add a `t()` call to a client
component and re-extract; `tests/i18n-scopes.test.ts` watches all three rules
fail on the shape each was written to catch.

The handbook's article prose is the exception, and lives in `messages/handbook/`.
`en.json` there is **generated** — never hand-edit it. Change the wording in
`lib/handbook/markup.ts` and re-run `npm run handbook:extract`; `npm run
handbook:check` fails when the two have drifted. A locale with *no* file keeps
the English prose, and dropping one in turns that language on at the next
build. All eight exist today, though, and that changes the arithmetic: an
existing file missing even one key sets `localised` false in
`lib/handbook/localise.ts`, which shows the English-only note and forces
`dir="ltr"` — so two untranslated strings would take Arabic out of RTL
entirely. Adding a handbook string is nine translations or none, never one.

Keys carry an ordinal, so inserting a paragraph mid-section renumbers the text
nodes after it and silently re-points every translation of them. Append to the
end of a container where the content allows it; when it does not, re-extract,
re-map all eight files by hand, and re-check every table.

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

## Prose that names code
`course/**/*.md` names real files and real functions, and the compiler never
opens a README — a rename is silent here in a way it is nowhere else in this
repo, because prose that has gone wrong still reads perfectly well. `npm run
prose:check` is the gate: every path resolves, every identifier exists in
`course/**/*.ts` or in the `@anthropic-ai/sdk` types, an identifier named in
the same paragraph as one of the course's own files is *in* that file, and
`_leading_underscore` names and `name=value` keyword arguments fail outright
as leftovers from the Python original. It found `tool_runner` for
`toolRunner` and `handleOrder` for `takeOrder` on its first run.

A fifth rule runs repository-wide: every `file:line` citation in every
document git tracks or would track must land on its subject. The file has to
resolve, the line has to exist, and whatever the surrounding bullet names in
backticks has to actually be within a few lines of the number. The bare
`(606)` form counts too, where a bullet names its file once and then lists the
selectors it holds. That is the rule that catches drift — insert nine lines
above a CSS block and every citation below it lies while still reading
perfectly. It found fourteen on its first run.

The scoping is deliberate and worth not undoing. `docs/course-briefs/` stays
exempt from identifier resolution, because those briefs specify courses that do
not exist yet, so their identifiers are *supposed* to be unresolvable. Their
citations are a different matter: they point into `lib/`, `app/` and `tests/`,
which exist and move. The exemption was always about a subject that is not
written, never about line numbers. Beyond that, do not answer a failure by
loosening the checker — one that drowns in false positives gets switched off.
`tests/prose.test.ts` watches all five rules fail on the prose each was written
to catch, so weakening one is a red test rather than a quiet regression.

## Static export
`output: "export"`. No server, no middleware, no route handlers, no server
actions, no `next/image` optimiser. The lab calls the model provider straight
from the reader's browser with the reader's own key; nothing may introduce a
runtime that could hold a key.

## Prose
British spelling. Sentence case in headings. Prefer deleting a widget over adding
one. Do not rewrite existing copy to satisfy a linter.

## Before you say you're done
`npm run build` must pass — it runs `scripts/prune-export.mjs` afterwards,
which drops the byte-identical copy Next writes of every route payload and
stops without deleting anything if a copy ever stops being one. `npm run
i18n:check` must pass, and wants an `out/` to scan, so run it after the build
as CI does. `npm run prose:check` must pass if you touched `course/` — or
anything a citation counts lines against: inserting a comment into
`app/globals.css` moved nine of them. `npm run transfer:check` must pass if you
changed what a route loads: it measures what each route actually pulls over
the wire and compares it against `config/transfer-budget.json`, broken down by
document, script, stylesheet and prefetch payload — because shared JavaScript
is most of a route, and a doubled document hides inside a total that large.
The measurement is byte-exact; the 3% allowance is for a different zlib, not
for growth. Intended growth is not an error, it is a diff: run `npm run
transfer:update` and commit the new numbers so the cost is reviewable as
bytes. `npm run routes:check` must agree with
`config/route-manifest.json` — that checker is the gate, not a number written
down here. It currently reports 66 public + 2 internal = 68. The count moves by
nine every time a localised path is added, so check it rather than trusting this
sentence. Never commit `All API Keys.docx` or anything matching the secrets
block in `.gitignore`.
