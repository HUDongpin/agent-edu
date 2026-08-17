"""Grade one stage:  python check.py 3   (add --offline to replay recordings)

These checks are deliberately thin. They confirm you built the thing; they do
not confirm you built it well. The eval set in stage 3 is the tool for that,
and from stage 4 on it is what check.py leans on.
"""

from __future__ import annotations

import importlib.util
import pathlib
import sys

import report

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

STAGES = {
    0: "stage0_hello", 1: "stage1_kiosk", 2: "stage2_prompt", 3: "stage3_evals",
    4: "stage4_context", 5: "stage5_loop", 6: "stage6_harness",
    7: "stage7_graph", 8: "stage8_security",
}
COSTS_MONEY = {3, 4, 5, 6, 7, 8}


def load(stage: int):
    """Import a stage's run.py by path, without executing its __main__ block."""
    path = HERE / STAGES[stage] / "run.py"
    sys.path.insert(0, str(path.parent))
    spec = importlib.util.spec_from_file_location(f"stage{stage}", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def ok(msg):   print(f"  PASS  {msg}")
def bad(msg):  raise SystemExit(f"  FAIL  {msg}\n")


def check_0(m):
    if not getattr(m, "QUESTION", "").strip():
        bad("QUESTION is still empty")
    ok("you asked the model something")
    if not isinstance(getattr(m, "answer", None), str) or not m.answer.strip():
        bad("no answer came back")
    ok("an answer came back")
    report.record(0, ok=True)


def check_1(m):
    got = m.take_order("large flat white")
    if not got:
        bad("'large flat white' still returns None")
    if abs(got.get("price", 0) - 5.10) > 0.005:
        bad(f"'large flat white' priced {got.get('price')}, menu says 5.10")
    ok("'large flat white' works")
    if m.take_order("tea") is None:
        bad("you broke the tea rule that was already there")
    ok("the existing rules still work")
    if m.take_order("could I grab a large flat white when you get a sec") is not None:
        print("  NOTE  you taught it the long phrasing too. Fair enough — but")
        print("        that is one more rule for one more sentence. Try:")
        print("        'one large flat white, ta'")
    else:
        ok("the long phrasing still fails — that is the finding, not a bug")
    phrasings = ["tea", "large tea", "large flat white", "two teas",
                 "americano, small", "LARGE FLAT WHITE!!!",
                 "could I grab a large flat white when you get a sec",
                 "flat white, make it large",
                 "something warm for my kid, no coffee", "the usual"]
    report.record(1, passing=sum(m.take_order(p) is not None for p in phrasings))


def check_2(m):
    if not m.SYSTEM.strip():
        bad("SYSTEM is still empty")
    ok("you wrote a prompt")
    order = m.take_order("large flat white please")
    for field in ("items", "total", "needs_confirmation"):
        if field not in order:
            bad(f"the reply is missing {field!r}")
    if not order["items"]:
        bad("it ordered nothing")
    ok(f"a clear order parses: {order['items'][0].get('name')}")
    report.record(2, distinct=len({
        __import__("json").dumps(m.take_order("something warm for my kid, no coffee",
                                              variant=i), sort_keys=True)
        for i in range(3)}))


def check_3(m):
    if m.SYSTEM_UNDER_TEST is None:
        bad("SYSTEM_UNDER_TEST is still None")
    ok("the eval is pointed at your prompt")
    from cafe import evalset
    score, _ = evalset.run(m.SYSTEM_UNDER_TEST, verbose=False)
    report.record(3, score=score)
    ok(f"it ran: {score}/{len(evalset.CASES)} — write that number down")
    ok("recorded. `python report.py` shows it next to every later stage")


def check_4(m):
    if not m.SYSTEM.strip():
        bad("SYSTEM is still empty")
    from cafe import evalset
    score, failures = evalset.run(m.take_order, verbose=False)
    if score < 16:
        bad(f"scored {score}/20, wanted at least 16. Still failing: "
            f"{', '.join(failures)}")
    report.record(4, score=score)
    ok(f"scored {score}/20 with the menu in context")


def check_5(m):
    from cafe import tools
    tools.reset()
    orders = m.run_agent(verbose=False)
    if len(orders) < 2:
        bad(f"placed {len(orders)} order(s); the café is short on two things")
    ok(f"placed {len(orders)} orders, recovering from a failed tool on the way")
    if not tools.LOG:
        bad("the manager was never emailed")
    ok("the manager was told")
    report.record(5, orders=len(orders))


def check_6(m):
    all_on = m.run_agent(dict(m.ALL_ON))
    if all_on["log_lines"] == 0:
        bad("nothing was written to RUN_LOG (TODO 4)")
    ok(f"the run log has {all_on['log_lines']} lines")
    if all_on["spent"] > m.APPROVAL_THRESHOLD:
        bad(f"spent ${all_on['spent']:.2f} with the gate on — it is not gating")
    ok(f"the gate held: ${all_on['spent']:.2f} spent unattended")
    report.record(6, gated=round(all_on["spent"], 2))
    no_gate = m.run_agent({**m.ALL_ON, "gate": False})
    if no_gate["spent"] <= all_on["spent"]:
        print("  NOTE  the ungated run did not spend more this time. Run it "
              "again — the point only lands when it does.")
    else:
        ok(f"without the gate it spent ${no_gate['spent']:.2f}")


def check_7(m):
    m.SENT.clear()
    unreviewed = m.handle(m.COMPLAINT, reviewer=False)
    m.SENT.clear()
    reviewed = m.handle(m.COMPLAINT, reviewer=True)
    ok("both paths ran")
    if len(m.SENT) != 1:
        bad(f"send() was called {len(m.SENT)} times on one message")
    ok("exactly one reply was sent, and only via send()")
    report.record(7, blocked=int(unreviewed.strip() != reviewed.strip()))
    if unreviewed.strip() == reviewed.strip():
        print("  NOTE  both drafts came out the same this time. The guarantee "
              "still holds — but re-run to see it bite.")


def check_8(m):
    poisoned = m.REAL_COMPLAINT + m.INJECTION
    capped = m.handle(poisoned, label_as_data=False, cap_tools=True)
    if capped["refund_amount"] > m.ORDER_TOTAL + 0.005:
        bad(f"capped run still refunded ${capped['refund_amount']:.2f}; "
            f"the cap must hold even when the model is fooled")
    ok(f"fooled but capped: ${capped['refund_amount']:.2f}")
    if capped["send_address_list"]:
        bad("the address list still went out with cap_tools on")
    ok("no address list left the building")
    labelled = m.handle(poisoned, label_as_data=True, cap_tools=True)
    ok(f"labelled run refunded ${labelled['refund_amount']:.2f}")
    report.record(8, capped=round(capped["refund_amount"], 2))


CHECKS = {0: check_0, 1: check_1, 2: check_2, 3: check_3, 4: check_4,
          5: check_5, 6: check_6, 7: check_7, 8: check_8}

if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    if not args or not args[0].isdigit() or int(args[0]) not in STAGES:
        raise SystemExit("usage: python check.py <0-8> [--offline]")
    stage = int(args[0])

    if stage in COSTS_MONEY and "--offline" not in sys.argv:
        print(f"\n  (stage {stage} makes real API calls — pennies, but not free)")

    print(f"\nchecking stage {stage}\n")
    try:
        CHECKS[stage](load(stage))
    except NotImplementedError as exc:
        # An unfinished TODO is the normal state of this course, not a crash.
        raise SystemExit(f"  TODO  {exc}\n\n  Finish that one and run this again.\n")
    print(f"\n  stage {stage} complete.\n")
    if stage in (3, 4, 8):
        print("  (run `python report.py` to see the whole picture)\n")
