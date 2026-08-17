"""Stage 6 — the same agent, wrapped in the boring code that makes it safe."""

import pathlib
import sys
import time

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))

from cafe import llm, tools  # noqa: E402

# Anything above this needs a human. Money is the classic irreversible action.
APPROVAL_THRESHOLD = 100.0
UNIT_COST = {"coffee_beans": 18.0, "cups_12oz": 0.04, "oat_milk": 2.10, "tea": 4.0}

RUN_LOG: list[str] = []


def nobody_is_awake(question: str) -> bool:
    """The approver for an unattended 3am run.

    This is the whole reason a gate is worth building. The interesting
    question is not "will a human say yes?" — it is "what happens when
    there is no human at all?" A gate whose default is *allow* is not a
    gate. Swap this for `input(question)` and you have a human in the loop.
    """
    return False


def nobody_is_awake(question: str) -> bool:
    """The approver for an unattended 3am run.

    This is the whole reason a gate is worth building. The interesting
    question is not "will a human say yes?" — it is "what happens when
    there is no human at all?" A gate whose default is *allow* is not a
    gate. Swap this for `input(question)` and you have a human in the loop.
    """
    RUN_LOG.append(f"NEEDS APPROVAL, nobody awake: {question}")
    return False


def call_tool(name: str, args: dict, *, parts: dict, approve=lambda q: True) -> tuple[str, bool]:
    """Run one tool call. Returns (result_text, is_error).

    This function is the harness. Everything the model asks for comes
    through here, which is what makes it the right place for every rule you
    actually want enforced.
    """
    # -- gate ---------------------------------------------------------------
    # TODO 1: if parts["gate"] and this is a place_order that would take the
    # run's TOTAL committed spend past APPROVAL_THRESHOLD, do not run it.
    # Call approve(question); if that returns False, return a plain-language
    # refusal as an error result so the model can adapt.
    #
    # Total, not just this one order. A per-order cap gets stepped around
    # without anyone intending it: refuse a single $180 order and the model
    # will place three $60 ones, because it is still trying to finish the
    # job. You can read what is already committed off tools.ORDERS.

    # -- run, with retry and timeout ----------------------------------------
    attempts = 2 if parts["retry"] else 1
    for attempt in range(1, attempts + 1):
        try:
            # TODO 2: call tools.RUNNERS[name](**args) and return its result.
            # A real harness would also bound this with a timeout; the fake
            # tools here return instantly, so a comment is honest enough.
            raise NotImplementedError("TODO 2")
        except NotImplementedError:
            raise
        except Exception as exc:
            if attempt < attempts:
                RUN_LOG.append(f"{name} failed ({exc}); retrying")
                time.sleep(0.1)
                continue
            # -- useful errors ------------------------------------------------
            # TODO 3: when parts["errors"] is True, return the real reason
            # (str(exc)) so the model can act on it. When it is False, return
            # the bare string "Error" and watch what that does to the run.
            raise NotImplementedError("TODO 3")

    return "Error", True


def run_agent(parts: dict) -> dict:
    """Run the restock job once, with the given harness parts switched on."""
    client = llm.client()
    tools.reset()
    RUN_LOG.clear()
    messages = [{"role": "user", "content":
                 "Restock the café: order enough of whatever is running short."}]

    for _ in range(8):
        response = client.messages.create(
            model=llm.MODEL, max_tokens=2000, tools=tools.SCHEMAS,
            messages=messages, **llm.tuning(),
        )
        llm.meter(response)
        llm.meter(response)
        if response.stop_reason in ("end_turn", "refusal"):
            break

        messages.append({"role": "assistant", "content": response.content})
        results = []
        for block in response.content:
            if block.type == "tool_use":
                text, failed = call_tool(block.name, block.input, parts=parts,
                                         approve=nobody_is_awake)
                # TODO 4: append every call to RUN_LOG when parts["log"] is on.
                # Without it the "what happened last night?" question has no
                # answer at all.
                results.append({"type": "tool_result", "tool_use_id": block.id,
                                "content": text, "is_error": failed})
        messages.append({"role": "user", "content": results})

    spent = sum(o["qty"] * UNIT_COST.get(o["item"], 0) for o in tools.ORDERS)
    return {"orders": list(tools.ORDERS), "spent": spent,
            "log_lines": len(RUN_LOG), "emails": len(tools.LOG)}


ALL_ON = {"retry": True, "errors": True, "gate": True, "log": True}

if __name__ == "__main__":
    llm.preflight()
    print()
    for missing in [None, "retry", "errors", "gate", "log"]:
        parts = dict(ALL_ON)
        label = "everything on"
        if missing:
            parts[missing] = False
            label = f"{missing} OFF"
        try:
            out = run_agent(parts)
            print(f"  {label:<16} orders={len(out['orders'])} "
                  f"spent=${out['spent']:.2f} log={out['log_lines']} "
                  f"emails={out['emails']}")
        except NotImplementedError as exc:
            raise SystemExit(f"\n  {exc} — finish the TODOs in call_tool first.\n")
        except Exception as exc:
            print(f"  {label:<16} RUN DIED: {type(exc).__name__}: {exc}")
    print(f"\n  Same model, same prompt, same tools in all five runs.")
    print(f"\ncost  : {llm.spend()}")
