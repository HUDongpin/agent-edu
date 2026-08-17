"""Stage 3 — score the stage-2 prompt against twenty real orders."""

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "stage2_prompt"))

from cafe import evalset, llm  # noqa: E402

# ---------------------------------------------------------------------------
# TODO: use your stage-2 prompt here.
#
#   from run import take_order          # stage2_prompt/run.py
#
# and then set SYSTEM_UNDER_TEST = take_order.
#
# (If that import feels like a hack: it is. Real projects put the prompt in a
# module both the app and the eval import. Doing it the awkward way once is a
# good argument for doing it properly next time.)
# ---------------------------------------------------------------------------
SYSTEM_UNDER_TEST = None
# ---------------------------------------------------------------------------


if __name__ == "__main__":
    llm.preflight()
    if SYSTEM_UNDER_TEST is None:
        raise SystemExit("Point SYSTEM_UNDER_TEST at your stage-2 take_order, "
                         "then run this again.")

    print(f"\nRunning {len(evalset.CASES)} cases\n")
    score, failures = evalset.run(SYSTEM_UNDER_TEST)

    print(f"\n  score: {score}/{len(evalset.CASES)}")
    if failures:
        print(f"  failing: {', '.join(failures)}")
    print(f"\n  Write that number down. Stage 4 is going to move it.")
    print(f"\ncost  : {llm.spend()}")
