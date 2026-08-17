"""Stage 0 — prove the wiring works."""

import pathlib
import sys

# Let this script find the `cafe` package no matter where you run it from.
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))

from cafe import llm  # noqa: E402

llm.preflight()

# ---------------------------------------------------------------------------
# TODO: ask the model something. Anything. Replace the empty string.
# ---------------------------------------------------------------------------
QUESTION = ""
# ---------------------------------------------------------------------------

if not QUESTION:
    raise SystemExit("Fill in QUESTION above, then run this again.")

answer = llm.ask(QUESTION, max_tokens=300)

print(f"you   : {QUESTION}")
print(f"claude: {answer}")
print(f"\ncost  : {llm.spend()}")
