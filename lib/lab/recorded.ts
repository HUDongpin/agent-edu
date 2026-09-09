/**
 * A scripted run of the twenty cases, for a reader who has no key.
 *
 * WHAT THIS IS: the course's own deterministic stand-in — the same offlineOrder
 * and offlineJudge a learner runs with `--offline` — answering the twenty cases
 * once without the menu in the prompt and once with it. Every verdict here was
 * produced by that code. None of it was written by hand.
 *
 * WHAT THIS IS NOT: a model. The stand-in is a small parser, so its numbers are
 * not the numbers a real provider gives — a real run starts nearer 7/20 than
 * zero, and lands nowhere exactly. The copy beside this table says so, and must
 * keep saying so: the point of showing it is the mechanism, which is true, and
 * not the score, which is scripted.
 *
 * Why it exists: only the rules wall runs without a key, so a learner with no
 * card, on a managed laptop, or where the provider's billing does not reach felt
 * the wall and never saw the answer on the other side. Watching a recording is
 * weaker than running it. It is stronger than the wall with nothing behind it.
 *
 * Regenerate rather than edit: the generator lives in the commit that added this
 * file, and re-running the stand-in is the only thing that should ever change it.
 */
export interface RecordedCase {
  id: string;
  said: string;
  kind: string;
  /** Verdict with no menu in the prompt. */
  before: boolean;
  /** Verdict with the menu in the prompt. */
  after: boolean;
  /** Why the no-menu run failed, in the stand-in's own words. */
  why: string;
}

export const RECORDED_RUN: readonly RecordedCase[] = [
  {
    "id": "large-flat-white",
    "said": "large flat white please",
    "kind": "rule",
    "before": false,
    "after": true,
    "why": "flat white priced 5.6, menu says 5.1"
  },
  {
    "id": "two-teas",
    "said": "two teas",
    "kind": "rule",
    "before": false,
    "after": true,
    "why": "tea priced 3.55, menu says 2.8"
  },
  {
    "id": "latte-americano",
    "said": "a small latte and a large americano",
    "kind": "rule",
    "before": false,
    "after": true,
    "why": "latte priced 5, menu says 4"
  },
  {
    "id": "the-usual",
    "said": "I'll have the usual",
    "kind": "judge",
    "before": false,
    "after": false,
    "why": "The scripted offline judge could not read the order."
  },
  {
    "id": "hot-choc",
    "said": "hot chocolate please",
    "kind": "rule",
    "before": false,
    "after": true,
    "why": "hot chocolate priced 4.25, menu says 3.5"
  },
  {
    "id": "make-it-large",
    "said": "flat white, make it large",
    "kind": "rule",
    "before": false,
    "after": true,
    "why": "flat white priced 6.1, menu says 5.1"
  },
  {
    "id": "orange-juice",
    "said": "can I get an orange juice",
    "kind": "rule",
    "before": false,
    "after": true,
    "why": "orange juice priced 4.1, menu says 3.6"
  },
  {
    "id": "kid-no-coffee",
    "said": "something warm for my kid, no coffee",
    "kind": "judge",
    "before": false,
    "after": false,
    "why": "The scripted offline judge could not read the order."
  },
  {
    "id": "tea-for-mum",
    "said": "a tea for my mum",
    "kind": "rule",
    "before": false,
    "after": true,
    "why": "tea priced 3.8, menu says 2.8"
  },
  {
    "id": "large-cappuccino",
    "said": "large cappuccino",
    "kind": "rule",
    "before": false,
    "after": true,
    "why": "cappuccino priced 5.4, menu says 4.9"
  },
  {
    "id": "a-coffee",
    "said": "just a coffee",
    "kind": "judge",
    "before": false,
    "after": false,
    "why": "The scripted offline judge could not read the order."
  },
  {
    "id": "two-lattes-tea",
    "said": "two large lattes and a small tea",
    "kind": "rule",
    "before": false,
    "after": true,
    "why": "latte priced 5.9, menu says 4.9"
  },
  {
    "id": "kids-drink",
    "said": "a kids drink",
    "kind": "judge",
    "before": false,
    "after": false,
    "why": "The scripted offline judge could not read the order."
  },
  {
    "id": "americano-small",
    "said": "americano, small",
    "kind": "rule",
    "before": false,
    "after": true,
    "why": "americano priced 4.15, menu says 3.4"
  },
  {
    "id": "nothing-sweet",
    "said": "something that isn't too sweet",
    "kind": "judge",
    "before": false,
    "after": false,
    "why": "The scripted offline judge could not read the order."
  },
  {
    "id": "same-as-yesterday",
    "said": "same as yesterday",
    "kind": "judge",
    "before": false,
    "after": false,
    "why": "The scripted offline judge could not read the order."
  },
  {
    "id": "one-of-each-tea",
    "said": "one tea in each size",
    "kind": "rule",
    "before": false,
    "after": true,
    "why": "tea priced 3.55, menu says 2.8"
  },
  {
    "id": "black-coffee",
    "said": "black coffee",
    "kind": "judge",
    "before": false,
    "after": false,
    "why": "The scripted offline judge could not read the order."
  },
  {
    "id": "shouty",
    "said": "LARGE FLAT WHITE!!!",
    "kind": "rule",
    "before": false,
    "after": true,
    "why": "flat white priced 5.6, menu says 5.1"
  },
  {
    "id": "a-treat",
    "said": "surprise me with a treat",
    "kind": "judge",
    "before": false,
    "after": false,
    "why": "The scripted offline judge could not read the order."
  }
];

/** Scores are derived, never stored, so they cannot drift from the rows. */
export const RECORDED_BEFORE = RECORDED_RUN.filter((c) => c.before).length;
export const RECORDED_AFTER = RECORDED_RUN.filter((c) => c.after).length;
