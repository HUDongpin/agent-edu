"""The café. Same one from the web page, so the domain costs you nothing.

Every stage works on this data, which means your attention stays on the new
technique rather than on learning a new toy problem each time.
"""

from __future__ import annotations

MENU = {
    "flat white":    {"S": 4.20, "L": 5.10},
    "latte":         {"S": 4.00, "L": 4.90},
    "cappuccino":    {"S": 4.00, "L": 4.90},
    "americano":     {"S": 3.40, "L": 4.10},
    "hot chocolate": {"S": 3.50, "L": 4.20},
    "tea":           {"S": 2.80, "L": 3.40},
    "orange juice":  {"S": 3.60, "L": 4.40},
}

# Which items a child can be served. Stage 4 gives this to the model; stage 2
# does not, which is exactly why stage 2 invents a "babyccino".
NON_COFFEE = ["hot chocolate", "tea", "orange juice"]


def menu_text() -> str:
    """The menu as the model should see it: compact, complete, unambiguous."""
    lines = ["MENU (name, small price, large price)"]
    for name, sizes in MENU.items():
        caffeine = "" if name in NON_COFFEE else "  [contains coffee]"
        lines.append(f"  {name:<14} S ${sizes['S']:.2f}   L ${sizes['L']:.2f}{caffeine}")
    return "\n".join(lines)


def price(item: str, size: str) -> float | None:
    """Ground truth. The eval in stage 3 checks the model against this."""
    return MENU.get(item.strip().lower(), {}).get(size.strip().upper())
