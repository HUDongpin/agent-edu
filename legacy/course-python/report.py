"""Your report card:  python report.py

Every stage that produces a number writes it to `progress.json` when it
passes. This prints the lot, in order, so you can see the shape of what you
have actually built rather than a pile of terminal scrollback.

Why this exists
---------------
Stage 3 gives you an eval score. The temptation is to treat that as "the
stage 3 number" and move on. It isn't — it is *the* number, and the only
reason the later stages are worth anything is that it moved. Keeping the
history in one place is what turns nine exercises into one argument.

Note what is deliberately NOT here: the 20 café cases do not apply to stages
5 to 8. An agent placing restock orders is not taking orders, and forcing
the same suite onto it would be theatre. So each later stage reports the
measure that actually fits it — money spent, orders placed, injections
blocked — and the report shows them side by side. Different questions need
different instruments; pretending otherwise is how dashboards start lying.
"""

from __future__ import annotations

import json
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
FILE = HERE / "progress.json"

# stage -> (label, which key to show, how to render it)
SHAPE = [
    (0, "hello",    "ok",        lambda v: "your key works"),
    (1, "kiosk",    "passing",   lambda v: f"{v} rule-based phrasings handled"),
    (2, "prompt",   "distinct",  lambda v: f"{v} distinct answers from 5 identical questions"),
    (3, "evals",    "score",     lambda v: f"{v}/20  ← your baseline"),
    (4, "context",  "score",     lambda v: f"{v}/20  with the menu in context"),
    (5, "loop",     "orders",    lambda v: f"{v} orders placed, recovering from a failed tool"),
    (6, "harness",  "gated",     lambda v: f"${v:.2f} spent unattended with the gate on"),
    (7, "graph",    "blocked",   lambda v: f"{v} off-policy draft(s) stopped by the reviewer"),
    (8, "security", "capped",    lambda v: f"refund capped at ${v:.2f} despite the injection"),
]


def load() -> dict:
    if FILE.exists():
        try:
            return json.loads(FILE.read_text())
        except json.JSONDecodeError:
            return {}
    return {}


def record(stage: int, **values) -> None:
    """Called by check.py when a stage passes. Keeps the best score seen."""
    data = load()
    key = str(stage)
    entry = data.get(key, {})
    for k, v in values.items():
        # scores only ever go up; everything else takes the latest value
        if k == "score" and isinstance(entry.get(k), (int, float)):
            entry[k] = max(entry[k], v)
        else:
            entry[k] = v
    data[key] = entry
    FILE.write_text(json.dumps(data, indent=1, sort_keys=True))


def main() -> None:
    data = load()
    if not data:
        raise SystemExit(
            "\n  Nothing recorded yet.\n\n"
            "  Pass a stage first:  python check.py 1\n"
        )

    print("\n  YOUR REPORT CARD\n  " + "─" * 56)
    for stage, label, key, render in SHAPE:
        entry = data.get(str(stage))
        if not entry or key not in entry:
            print(f"  {stage}  {label:<10} ·")
            continue
        print(f"  {stage}  {label:<10} {render(entry[key])}")

    base = (data.get("3") or {}).get("score")
    withctx = (data.get("4") or {}).get("score")
    print("  " + "─" * 56)
    if base is not None and withctx is not None:
        delta = withctx - base
        print(f"\n  The only number that matters: {base}/20 → {withctx}/20 "
              f"({delta:+d})")
        if delta > 0:
            print("  Same model. Same twenty questions. You told it what it was")
            print("  selling, and that was worth more than any prompt wording.")
        elif delta == 0:
            print("  No movement. Worth knowing — and worth checking whether")
            print("  the menu actually reached the prompt.")
        else:
            print("  It went down. Read the failures; something you added is")
            print("  fighting something already there.")
    elif base is not None:
        print(f"\n  Baseline {base}/20. Do stage 4 and watch what moves it.")
    else:
        print("\n  No eval score yet. Stage 3 is where this stops being")
        print("  opinion and starts being measurement.")
    print()


if __name__ == "__main__":
    main()
