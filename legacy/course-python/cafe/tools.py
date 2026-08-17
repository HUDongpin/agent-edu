"""Tools the agent may call, from stage 5 onward.

A "tool" is nothing exotic: a JSON schema the model can read, plus a Python
function you run when it asks. The model never executes anything — it only
ever asks. You decide what actually happens. That gap is where stage 6's
whole job lives.
"""

from __future__ import annotations

import random

# A tiny fake store room, so the stages have something to change.
STOCK = {"coffee_beans": 2.0, "oat_milk": 6.0, "cups_12oz": 40, "tea": 8}
WEEKLY_SALES = {"coffee_beans": 6.0, "oat_milk": 5.0, "cups_12oz": 310, "tea": 3}
SUPPLIER_MINIMUM = {"cups_12oz": 1000}

ORDERS: list[dict] = []
LOG: list[str] = []

# Stage 6 flips these to show what each harness part is worth.
FAIL_ONCE = {"read_sales": True}   # first call fails, like a real flaky API


def read_inventory() -> str:
    return " · ".join(f"{k} {v}" for k, v in STOCK.items())


def read_sales(days: int = 7) -> str:
    # Transient failures are normal. Without a retry, this ends the run.
    if FAIL_ONCE.get("read_sales"):
        FAIL_ONCE["read_sales"] = False
        raise ConnectionError("temporary network failure talking to the sales API")
    return " · ".join(f"{k} {v}/wk" for k, v in WEEKLY_SALES.items())


def place_order(item: str, qty: float) -> str:
    minimum = SUPPLIER_MINIMUM.get(item)
    if minimum and qty < minimum:
        # A refusal with a *reason*. Stage 6 shows what happens when the
        # reason is stripped out and the model just sees "Error".
        raise ValueError(f"supplier minimum for {item} is {minimum}")
    ORDERS.append({"item": item, "qty": qty})
    return f"OK — order #{1180 + len(ORDERS)} for {qty} {item}"


def send_email(to: str, body: str) -> str:
    LOG.append(f"email to {to}: {body}")
    return "sent"


# What the model sees. Descriptions do real work here: be specific about
# *when* to call a tool, not just what it does.
SCHEMAS = [
    {
        "name": "read_inventory",
        "description": "Read current stock levels in the store room. Call this "
                       "first when asked about restocking — you cannot know what "
                       "is short without it.",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "read_sales",
        "description": "Read how much of each item sold over the last N days. "
                       "Use it to work out what 'enough stock' means.",
        "input_schema": {
            "type": "object",
            "properties": {"days": {"type": "integer", "description": "How many days back"}},
            "required": ["days"],
        },
    },
    {
        "name": "place_order",
        "description": "Order more of one item from the supplier. This spends "
                       "real money and cannot be undone from here.",
        "input_schema": {
            "type": "object",
            "properties": {
                "item": {"type": "string", "description": "Exact item key, e.g. coffee_beans"},
                "qty":  {"type": "number", "description": "How many units to order"},
            },
            "required": ["item", "qty"],
        },
    },
    {
        "name": "send_email",
        "description": "Email a person. Use it to tell the manager what you did.",
        "input_schema": {
            "type": "object",
            "properties": {
                "to":   {"type": "string"},
                "body": {"type": "string"},
            },
            "required": ["to", "body"],
        },
    },
]

RUNNERS = {
    "read_inventory": read_inventory,
    "read_sales": read_sales,
    "place_order": place_order,
    "send_email": send_email,
}


def reset() -> None:
    """Put the world back, so a stage can be run twice."""
    ORDERS.clear()
    LOG.clear()
    FAIL_ONCE["read_sales"] = True
