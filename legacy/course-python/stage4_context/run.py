"""Stage 4 — same prompt, but now the model can see the menu."""

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))

from cafe import evalset, llm  # noqa: E402
from cafe.menu import menu_text  # noqa: E402

# ---------------------------------------------------------------------------
# TODO: build the briefed prompt.
#
# Start from your stage-2 SYSTEM, then add:
#   - the menu, via menu_text()
#   - what to do when the order is vague (set needs_confirmation)
#   - what to do when a customer asks for something not on the menu
#   - the default size when nobody says one
#
# Everything you add costs tokens on every call, so add what earns its place
# and let the eval tell you whether it did.
# ---------------------------------------------------------------------------
SYSTEM = f""""""
# ---------------------------------------------------------------------------


def take_order(said: str) -> dict:
    return llm.ask(f"Customer said: {said!r}",
                   system=SYSTEM, schema=evalset.ORDER_SCHEMA)


if __name__ == "__main__":
    llm.preflight()
    if not SYSTEM.strip():
        raise SystemExit("Write the SYSTEM prompt above, then run this again.")

    print(f"\n  prompt size: {llm.tokens(SYSTEM)} tokens, on every single call")
    print(f"\nRunning {len(evalset.CASES)} cases\n")

    score, failures = evalset.run(take_order)

    print(f"\n  score: {score}/{len(evalset.CASES)}")
    if failures:
        print(f"  failing: {', '.join(failures)}")
    print(f"\n  Compare with your stage-3 number. Did it move by more than one?")
    print(f"\ncost  : {llm.spend()}")
