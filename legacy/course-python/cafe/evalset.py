"""Twenty real orders, and the machinery to score a system against them.

This is the most important file in the course. Once you can run it, every
later change becomes a measurement instead of an opinion.

Two kinds of case:

  rule   — a plain Python function decides pass/fail. Cheap, exact, no
           model involved. Use this wherever you possibly can.
  judge  — "correct" is a judgement call, so a second model call grades the
           answer against a written standard. Slower, costs money, and is
           itself fallible — which is why only 8 of the 20 use it.
"""

from __future__ import annotations

from . import llm
from .menu import NON_COFFEE, price

# The shape every stage from 2 onward asks the model to produce.
ORDER_SCHEMA = {
    "type": "object",
    "properties": {
        "items": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name":  {"type": "string"},
                    "size":  {"type": "string", "enum": ["S", "L"]},
                    "price": {"type": "number"},
                },
                "required": ["name", "size", "price"],
                "additionalProperties": False,
            },
        },
        "total": {"type": "number"},
        "needs_confirmation": {"type": "boolean"},
    },
    "required": ["items", "total", "needs_confirmation"],
    "additionalProperties": False,
}


# --- rule helpers ----------------------------------------------------------

def _named(order, *wanted):
    """Every expected (item, size) is present with the right menu price."""
    got = [(i.get("name", "").strip().lower(), i.get("size", "").strip().upper())
           for i in order.get("items", [])]
    if sorted(got) != sorted(wanted):
        return False, f"items were {got}, expected {list(wanted)}"
    for item in order.get("items", []):
        want = price(item["name"], item["size"])
        if want is None or abs(item["price"] - want) > 0.005:
            return False, f"{item['name']} priced {item['price']}, menu says {want}"
    total = sum(price(n, s) for n, s in wanted)
    if abs(order.get("total", -1) - total) > 0.005:
        return False, f"total was {order.get('total')}, expected {total:.2f}"
    return True, "ok"


def _flagged(order):
    """The order is vague, so the model must ask rather than guess."""
    if not order.get("needs_confirmation"):
        return False, "should have set needs_confirmation, but guessed silently"
    return True, "ok"


def _kid_safe(order):
    """Non-coffee, on the menu, and flagged for a human to confirm."""
    items = order.get("items", [])
    if not items:
        return False, "ordered nothing"
    for i in items:
        if i.get("name", "").strip().lower() not in NON_COFFEE:
            return False, f"{i.get('name')!r} is not a caffeine-free menu item"
    return _flagged(order)


# --- the set ---------------------------------------------------------------
# (id, what the customer said, kind, checker-or-standard)

CASES = [
    ("large-flat-white",  "large flat white please",            "rule",  lambda o: _named(o, ("flat white", "L"))),
    ("two-teas",          "two teas",                           "rule",  lambda o: _named(o, ("tea", "S"), ("tea", "S"))),
    ("latte-americano",   "a small latte and a large americano","rule",  lambda o: _named(o, ("latte", "S"), ("americano", "L"))),
    ("the-usual",         "I'll have the usual",                "judge", "The order is impossible to know from the message alone, so needs_confirmation must be true."),
    ("hot-choc",          "hot chocolate please",               "rule",  lambda o: _named(o, ("hot chocolate", "S"))),
    ("make-it-large",     "flat white, make it large",          "rule",  lambda o: _named(o, ("flat white", "L"))),
    ("orange-juice",      "can I get an orange juice",          "rule",  lambda o: _named(o, ("orange juice", "S"))),
    ("kid-no-coffee",     "something warm for my kid, no coffee","judge", "The item must be a caffeine-free menu item (hot chocolate, tea or orange juice) and needs_confirmation must be true, because the customer did not name a drink."),
    ("tea-for-mum",       "a tea for my mum",                   "rule",  lambda o: _named(o, ("tea", "S"))),
    ("large-cappuccino",  "large cappuccino",                   "rule",  lambda o: _named(o, ("cappuccino", "L"))),
    ("a-coffee",          "just a coffee",                      "judge", "Several menu items are coffee, so the model cannot know which one; needs_confirmation must be true."),
    ("two-lattes-tea",    "two large lattes and a small tea",   "rule",  lambda o: _named(o, ("latte", "L"), ("latte", "L"), ("tea", "S"))),
    ("kids-drink",        "a kids drink",                       "judge", "The item must be caffeine-free and on the menu, and needs_confirmation must be true."),
    ("americano-small",   "americano, small",                   "rule",  lambda o: _named(o, ("americano", "S"))),
    ("nothing-sweet",     "something that isn't too sweet",     "judge", "This is a preference, not an order; needs_confirmation must be true."),
    ("same-as-yesterday", "same as yesterday",                  "judge", "There is no record of yesterday in the message, so needs_confirmation must be true."),
    ("one-of-each-tea",   "one tea in each size",               "rule",  lambda o: _named(o, ("tea", "S"), ("tea", "L"))),
    ("black-coffee",      "black coffee",                       "judge", "Americano is the reasonable reading of 'black coffee' on this menu; picking it is correct, and so is flagging for confirmation. Inventing an item that is not on the menu is wrong."),
    ("shouty",            "LARGE FLAT WHITE!!!",                "rule",  lambda o: _named(o, ("flat white", "L"))),
    ("a-treat",           "surprise me with a treat",           "judge", "The customer named no drink, so needs_confirmation must be true."),
]

JUDGE_SCHEMA = {
    "type": "object",
    "properties": {
        "passes": {"type": "boolean"},
        "why": {"type": "string"},
    },
    "required": ["passes", "why"],
    "additionalProperties": False,
}


def judge(said: str, order: dict, standard: str) -> tuple[bool, str]:
    """Ask a second model whether the answer meets a written standard.

    Note what makes this work: the standard is specific and checkable. A
    standard like "the answer should be good" produces a coin flip.
    """
    verdict = llm.ask(
        f"A café customer said: {said!r}\n"
        f"The order-taking system produced: {order}\n\n"
        f"Standard to judge against: {standard}\n\n"
        f"Does the output meet the standard? Be strict.",
        system="You grade one output against one written standard. "
               "You are not judging style, only whether the standard is met.",
        schema=JUDGE_SCHEMA,
    )
    return bool(verdict["passes"]), verdict["why"]


def run(take_order, *, verbose: bool = True) -> tuple[int, list[str]]:
    """Run every case through `take_order` and return (score, failures).

    `take_order` is your function: it takes the customer's message and
    returns the order dict.
    """
    score, failures = 0, []
    for case_id, said, kind, spec in CASES:
        try:
            order = take_order(said)
            ok, why = spec(order) if kind == "rule" else judge(said, order, spec)
        except Exception as exc:                      # a crash is a failure
            ok, why = False, f"raised {type(exc).__name__}: {exc}"
        score += ok
        if verbose:
            print(f"  {'PASS' if ok else 'FAIL'}  {case_id:<18} {'' if ok else why}")
        if not ok:
            failures.append(case_id)
    return score, failures
