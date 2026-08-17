"""Stage 1 — a kiosk built out of rules. No model involved."""

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))

from cafe.menu import MENU  # noqa: E402


def take_order(said: str):
    """Turn what the customer said into an order, using rules only.

    Returns {"name": ..., "size": ..., "price": ...} or None.
    """
    text = said.lower().strip()

    # ---------------------------------------------------------------
    # TODO: make "large flat white" work.
    #
    # Everything you need is in MENU: MENU["flat white"]["L"] is 5.10.
    # Write the rule however you like — startswith, split, a dict, regex.
    # ---------------------------------------------------------------

    if text == "tea":
        return {"name": "tea", "size": "S", "price": MENU["tea"]["S"]}
    if text == "large tea":
        return {"name": "tea", "size": "L", "price": MENU["tea"]["L"]}

    return None


if __name__ == "__main__":
    tries = [
        "tea",
        "large tea",
        "large flat white",
        "could I grab a large flat white when you get a sec",
    ]
    for said in tries:
        got = take_order(said)
        print(f"  {said!r:<55} -> {got if got else 'no idea'}")
