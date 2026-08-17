"""Stage 5 — the agent loop, written by hand."""

import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))

from cafe import llm, tools  # noqa: E402

GOAL = ("Restock the café. Work out what is running short and order enough of "
        "it, then email the manager a one-line summary of what you ordered.")

MAX_STEPS = 8


def run_agent(verbose: bool = True) -> list[dict]:
    """Loop until the model stops asking for tools. Return the orders placed."""
    client = llm.client()
    messages: list[dict] = [{"role": "user", "content": GOAL}]

    for step in range(1, MAX_STEPS + 1):
        response = client.messages.create(
            model=llm.MODEL,
            max_tokens=2000,
            tools=tools.SCHEMAS,
            messages=messages,
            **llm.tuning(),          # vendor-specific "how hard to think"
        )
        llm.meter(response)
        llm.meter(response)

        if response.stop_reason == "refusal":
            raise RuntimeError("the model declined this request")

        for block in response.content:
            if block.type == "text" and block.text.strip() and verbose:
                print(f"  [{step}] {block.text.strip()[:120]}")

        if response.stop_reason == "end_turn":
            if verbose:
                print(f"  [{step}] done — the model stopped asking for tools")
            break

        # -------------------------------------------------------------
        # TODO: this is the loop.
        #
        # 1. Append the assistant's whole `response.content` to `messages`.
        #    Pass the list through unchanged — it carries the tool_use blocks
        #    (and the model's thinking) that the next turn needs.
        #
        # 2. For every block where block.type == "tool_use":
        #       - look the function up in tools.RUNNERS[block.name]
        #       - call it with **block.input
        #       - build {"type": "tool_result",
        #                "tool_use_id": block.id,
        #                "content": <the result, as a string>}
        #
        #    When the tool raises, do NOT let it crash the loop. Send the
        #    error back as a tool_result with "is_error": True — the model
        #    reads it and adapts. That is the whole trick.
        #
        # 3. Append all the results as ONE user message:
        #       messages.append({"role": "user", "content": results})
        #    All of them, in one message. Splitting them across several
        #    messages quietly teaches the model to stop calling tools in
        #    parallel.
        # -------------------------------------------------------------
        raise SystemExit("Write the loop body above, then run this again.")

    else:
        if verbose:
            print(f"\n  stopped at the {MAX_STEPS}-step limit, job unfinished")

    return tools.ORDERS


if __name__ == "__main__":
    llm.preflight()
    tools.reset()
    print(f"\ngoal  : {GOAL}\n")
    placed = run_agent()
    print(f"\norders: {json.dumps(placed)}")
    print(f"emails: {tools.LOG}")
    print(f"\ncost  : {llm.spend()}")
