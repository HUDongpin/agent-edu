"""Stage 2 — the same job as stage 1, but with a model."""

import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))

from cafe import llm  # noqa: E402
from cafe.evalset import ORDER_SCHEMA  # noqa: E402
from cafe.menu import price  # noqa: E402

# Five ways a real customer asks for one thing. Real people do not repeat
# themselves verbatim, so this is the variation that actually reaches you.
SAME_INTENT = [
    "something warm for my kid, no coffee",
    "a warm drink for my little one, nothing with coffee in it",
    "my son wants something hot — he can't have caffeine",
    "got anything warm and caffeine-free for a child?",
    "a hot drink for my daughter please, decaf or no coffee",
]

# ---------------------------------------------------------------------------
# TODO: write the prompt.
#
# The model has to turn one customer sentence into an order matching
# ORDER_SCHEMA (see cafe/evalset.py — items, total, needs_confirmation).
#
# Deliberately do NOT paste the menu in yet. Stage 4 does that, and the
# comparison is the lesson.
# ---------------------------------------------------------------------------
SYSTEM = """"""
# ---------------------------------------------------------------------------


def take_order(said: str, variant: int = 0) -> dict:
    """One customer sentence in, one structured order out."""
    return llm.ask(
        f"Customer said: {said!r}",
        system=SYSTEM,
        schema=ORDER_SCHEMA,
        variant=variant,
    )


if __name__ == "__main__":
    llm.preflight()
    if not SYSTEM.strip():
        raise SystemExit("Write the SYSTEM prompt above, then run this again.")

    clear = "could I grab a large flat white when you get a sec"
    print(f"\nA phrasing you never wrote a rule for:\n  {clear!r}")
    print("  ->", json.dumps(take_order(clear), sort_keys=True))

    # ---- probe 1: is it stable? -------------------------------------------
    vague = "something warm for my kid, no coffee"
    print(f"\nThe same vague question, five times:\n  {vague!r}")
    seen, quotes = set(), []
    for i in range(5):
        got = take_order(vague, variant=i)
        seen.add(json.dumps(got, sort_keys=True))
        quotes.append((got.get("items") or [{}])[0])
        print(f"  {i + 1}. {json.dumps(got, sort_keys=True)}")
    print(f"\n  {len(seen)} distinct answer(s) from 5 identical questions.")

    # ---- probe 2: is it right? --------------------------------------------
    # Stability and correctness are different questions, and only one of them
    # matters. A model that wobbles is obviously guessing; a model that says
    # the same wrong thing five times is guessing too, and hides it better.
    asked = [q.get("price") for q in quotes]
    real = price(quotes[0].get("name", ""), quotes[0].get("size") or "S")
    print(f"\n  it quoted : {asked}")
    print(f"  menu says : {real}")
    if real is None:
        print("  -> that item is not on the menu at all. It invented one.")
    elif len(set(asked)) > 1:
        print("  -> it invented the price, differently each time.")
    elif asked[0] != real:
        print("  -> it invented the price. Confidently. Every single time.")
    else:
        print("  -> right this time — but nobody told it the menu, so that is")
        print("     luck, not knowledge. It has no way to know it was right.")

    # ---- probe 3: does the wording move it? -------------------------------
    print("\nFive ways of asking for the same thing:")
    shapes = set()
    for i, said in enumerate(SAME_INTENT):
        got = take_order(said, variant=10 + i)
        shapes.add(got.get("needs_confirmation"))
        print(f"  needs_confirmation={str(got.get('needs_confirmation')):<5}  {said!r}")
    if len(shapes) > 1:
        print("\n  -> the same order, and the flag that decides whether you ask")
        print("     before charging them flipped on phrasing alone.")

    print("\n  One sample never settles any of this. Stage 3 is how you stop")
    print("  guessing and start counting.")
    print(f"\ncost  : {llm.spend()}")
