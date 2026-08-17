"""Stage 7 — a routed workflow where the review step cannot be skipped."""

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))

from cafe import llm  # noqa: E402

POLICY = ("Refund policy: for a damaged item we refund that item, or ship a "
          "replacement. We never issue store credit, never refund an entire "
          "order because one item was damaged, and never offer free delivery.")

COMPLAINT = ("My order #4381 arrived crushed — one of the two bags of beans "
             "was split open. Really disappointed, this is the second time.")

ROUTE_SCHEMA = {
    "type": "object",
    "properties": {"lane": {"type": "string", "enum": ["order", "question", "complaint"]}},
    "required": ["lane"],
    "additionalProperties": False,
}

REVIEW_SCHEMA = {
    "type": "object",
    "properties": {
        "approved": {"type": "boolean"},
        "problem": {"type": "string", "description": "Empty when approved."},
    },
    "required": ["approved", "problem"],
    "additionalProperties": False,
}

SENT: list[str] = []


# --- nodes -----------------------------------------------------------------

def route(message: str) -> str:
    """Decide which lane this message belongs in. A model node."""
    # TODO 1: ask the model to classify `message` using ROUTE_SCHEMA and
    # return the lane. One call, low effort — this is a cheap decision.
    raise NotImplementedError("TODO 1: write the router")


def draft_complaint_reply(message: str, note: str = "") -> str:
    """Write the customer-facing reply. A model node."""
    return llm.ask(
        f"A customer complained:\n{message}\n\n{POLICY}\n\n"
        f"{note}\n\nWrite the reply to the customer. Two sentences.",
        system="You write short, warm replies for a café's support team.",
    )


def review(draft: str) -> tuple[bool, str]:
    """Check a draft against policy. A model node — but a mandatory one."""
    # TODO 2: ask the model whether `draft` complies with POLICY, using
    # REVIEW_SCHEMA, and return (approved, problem).
    raise NotImplementedError("TODO 2: write the reviewer")


def send(text: str) -> None:
    """The only way anything reaches a customer."""
    SENT.append(text)


# --- the graph -------------------------------------------------------------

def handle(message: str, *, reviewer: bool, max_rewrites: int = 2) -> str:
    lane = route(message)

    if lane != "complaint":
        send(f"[{lane} lane] not implemented in this stage")
        return SENT[-1]

    draft = draft_complaint_reply(message)

    if reviewer:
        for _ in range(max_rewrites):
            approved, problem = review(draft)
            if approved:
                break
            print(f"    reviewer rejected: {problem}")
            draft = draft_complaint_reply(message, f"A reviewer rejected your "
                                                   f"previous draft: {problem}")
    send(draft)
    return draft


if __name__ == "__main__":
    llm.preflight()
    for reviewer in (False, True):
        SENT.clear()
        print(f"\n--- reviewer {'ON' if reviewer else 'OFF'} ---")
        try:
            print(f"  sent: {handle(COMPLAINT, reviewer=reviewer)}")
        except NotImplementedError as exc:
            raise SystemExit(f"\n  {exc}\n")
    print(f"\n  Same model both times. The difference is the control flow.")
    print(f"\ncost  : {llm.spend()}")
