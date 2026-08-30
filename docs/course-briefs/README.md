# Course briefs

Specifications for the three courses `lib/courses.ts` lists as `status: "soon"`. Each brief is the
document a contributor builds from.

These exist because the scope of those three courses used to be circular. `lib/courses.ts`
described its own `soon` entries as "the gaps the README already names"; `README.md` described them
as "already named as gaps in the catalogue". Neither held a specification, so the only authoritative
scope for a sixty-minute advanced course was a one-line blurb — and the contribution recipe printed
directly beneath that sentence in `README.md` builds a *handbook section*, which is not what any of
the three is. A contributor accepting that invitation would have built the wrong artefact.

| Brief | Catalogue id | Shipped metadata | Modelled on |
|---|---|---|---|
| [Human in the Loop](human-in-the-loop.md) | `hitl` | 35 min · read · safety · intermediate | the Handbook |
| [Cost Engineering](cost-engineering.md) | `cost` | 30 min · interactive · evaluation · intermediate | the Lab |
| [Tool Design](tool-design.md) | `tools` | 60 min · code · agents · advanced | the TypeScript course at `course/` |

## What a brief is, and is not

A brief settles scope, boundary, outline, artefact, completion evidence and the four catalogue
strings, and it closes the decisions that would otherwise block a contributor on their first day.
Every repository fact in one carries a file reference so it can be re-verified rather than trusted.

A brief is **not** permission to publish. Each names the release obligations its course inherits —
nine-language parity, the route manifest and its pinned test counts, the widget ratchet, native
review — and none of those is waived by an approved specification.

## Shared prerequisites

Two pieces of work sit underneath all three and should be done once, before any course content:

- **Widen the `CourseProgress` union in `lib/progress.ts`.** It hard-codes three literal course ids
  and cannot express a fourth. The same change fixes the standing defect that Build an Agent — an
  available 150-minute course — can never be marked complete.
- **Decide the string-checker question.** `scripts/check-widgets.mjs` reads exactly one behaviour
  file and one table, so run-time copy outside the Handbook has no placeholder, plural or DOM-id
  proof. The Human in the Loop brief decides to widen it to a list of (behaviour, markup, table)
  triples; the Cost Engineering brief leaves the same question open for `messages/*.json`. Settle
  both together.

## Order

Cheapest first, so the promotion checklist is proven on the course that reuses the most existing
machinery: **Human in the Loop → Cost Engineering → Tool Design.** Cost Engineering should not
start before the Lab's provider canary closes, or it inherits an unproven payment path.

A decision gate belongs after the shared prerequisites and before any course is built. `lib/courses.ts`
argues its own case there: "a catalogue that lists courses you cannot take is a catalogue nobody
trusts twice." Shipping one of the three and removing the other two is a legitimate outcome, and a
better one than three placeholders that outlive another year.
