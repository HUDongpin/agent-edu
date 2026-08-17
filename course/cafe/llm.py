"""The one place this course talks to a model.

Everything else imports from here. Three reasons:

1.  When the SDK or a model id changes, exactly one file needs editing.
2.  It gives us a seam for `--offline`, so someone without an API key can
    still run all nine stages.
3.  It gives us a seam for *which vendor*. This course runs on Anthropic's
    Claude or on DeepSeek, and not one line of any stage changes between
    them. That is not a party trick — swapping the model underneath your
    system, without rewriting the system, is a real thing you will want to
    do, and the only reason it is cheap here is that every call goes
    through this file.

Read this file. It is the whole "how do I call a model" answer that the rest
of the course takes for granted.

    export DEEPSEEK_API_KEY=sk-...        # then just run any stage
    export ANTHROPIC_API_KEY=sk-ant-...   # or this one
    export CAFE_PROVIDER=deepseek         # only needed if you have both
"""

from __future__ import annotations

import datetime as _dt
import hashlib
import json
import os
import pathlib
import re
import sys

try:
    import anthropic
except ImportError:  # the first thing a beginner hits; make it say so plainly
    raise SystemExit(
        "\n  The `anthropic` package isn't installed.\n\n"
        "    pip install anthropic\n\n"
        "  (You need it for DeepSeek too — DeepSeek speaks the same wire\n"
        "  format, so the same SDK drives both. Stage 1 needs no model and\n"
        "  runs without it. Everything else does.)\n"
    )

# ---------------------------------------------------------------------------
# Providers
# ---------------------------------------------------------------------------
#
# DeepSeek publishes an Anthropic-compatible endpoint, so the official
# `anthropic` SDK drives it with nothing but a different base_url. That is
# why stages 5 and 6 — which build raw tool_use / tool_result blocks by
# hand — work unchanged on both. The differences that remain are listed in
# `quirks` below, and every one of them is handled in this file.

PROVIDERS = {
    "anthropic": {
        "label":    "Anthropic",
        "env":      "ANTHROPIC_API_KEY",
        "base_url": None,                      # the SDK's own default
        "model":    "claude-opus-5",
        "cheap":    "claude-opus-5",
        "prices":   {"in": 5.00, "out": 25.00, "cached_in": 0.50},
        "quirks":   {"json_schema": True, "thinking_off": False},
        "help":     "https://console.anthropic.com/settings/keys",
    },
    "deepseek": {
        "label":    "DeepSeek",
        "env":      "DEEPSEEK_API_KEY",
        "base_url": "https://api.deepseek.com/anthropic",
        "model":    "deepseek-v4-flash",
        "cheap":    "deepseek-v4-flash",       # -pro is 3x the price
        # USD per 1M tokens, off-peak. Peak is double and is applied below.
        # Checked 2026-08-18 against api-docs.deepseek.com/quick_start/pricing.
        "prices":   {"in": 0.22, "out": 0.66, "cached_in": 0.007},
        # json_schema is ACCEPTED AND SILENTLY IGNORED by DeepSeek — you get
        # prose back and json.loads() explodes. So we fall back to asking in
        # the prompt and validating ourselves. See `_schema_fallback`.
        "quirks":   {"json_schema": False, "thinking_off": True},
        "help":     "https://platform.deepseek.com/api_keys",
    },
}


def _pick_provider() -> str:
    """CAFE_PROVIDER wins; otherwise use whichever key is actually set."""
    chosen = os.environ.get("CAFE_PROVIDER", "").strip().lower()
    if chosen:
        if chosen not in PROVIDERS:
            raise SystemExit(
                f"\n  CAFE_PROVIDER={chosen!r} is not one of: "
                f"{', '.join(PROVIDERS)}\n"
            )
        return chosen
    for name, cfg in PROVIDERS.items():
        if os.environ.get(cfg["env"]):
            return name
    return "deepseek"      # nothing set: the cheaper default, so preflight
                           # points a new learner at the smaller bill


PROVIDER = _pick_provider()
_CFG = PROVIDERS[PROVIDER]

# One line to change if you want a different model. CAFE_MODEL overrides it
# without editing the file — try `CAFE_MODEL=deepseek-v4-pro python check.py 3`
# and watch whether the eval score actually moves.
MODEL = os.environ.get("CAFE_MODEL") or _CFG["model"]
PRICE_IN = _CFG["prices"]["in"]
PRICE_OUT = _CFG["prices"]["out"]

# Effort controls how hard the model works: low | medium | high | xhigh | max.
# The course defaults to "low" because these are small, well-specified tasks
# and you are paying per token. Raise it and watch the eval score in stage 3 —
# that is the whole point of having an eval.
#
# On DeepSeek "low" maps to thinking mode OFF, which is the same intent
# (spend fewer tokens thinking) expressed in that vendor's vocabulary.
EFFORT = os.environ.get("CAFE_EFFORT", "low")

_HERE = pathlib.Path(__file__).parent
CASSETTES = _HERE / f"fixtures.{PROVIDER}.json"

# --offline anywhere on the command line replays recorded answers instead of
# calling the API. Useful with no key, on a plane, or in CI.
OFFLINE = "--offline" in sys.argv

_spend = {"in": 0, "out": 0, "cached": 0, "calls": 0}
_client = None


def client():
    """The raw SDK client, for stages that need to drive it directly."""
    global _client
    if _client is None:
        # No api_key argument for Anthropic: the SDK reads ANTHROPIC_API_KEY
        # from the environment. Never hardcode a key — least of all in a repo
        # you are about to push.
        kwargs = {}
        if _CFG["base_url"]:
            kwargs["base_url"] = _CFG["base_url"]
            kwargs["api_key"] = os.environ.get(_CFG["env"], "")
        _client = anthropic.Anthropic(**kwargs)
    return _client


def tuning(effort: str = EFFORT) -> dict:
    """The vendor-specific knobs for "how hard should it think?".

    Stages 5 and 6 splat this into their own `messages.create` calls, which
    is how they stay provider-neutral without knowing any of this.
    """
    if PROVIDER == "deepseek":
        # DeepSeek is a reasoning model by default. Left on, a small
        # max_tokens gets eaten entirely by hidden thinking and `content`
        # comes back EMPTY with stop_reason "max_tokens" — no error, just
        # nothing. Turning it off for low effort avoids that trap and costs
        # a lot less.
        return {"thinking": {"type": "disabled"}} if effort == "low" else {}
    return {"output_config": {"effort": effort}}


# ---------------------------------------------------------------------------
# Record / replay
# ---------------------------------------------------------------------------

def _key(payload: dict) -> str:
    blob = json.dumps(payload, sort_keys=True, default=str)
    return hashlib.sha256(blob.encode()).hexdigest()[:16]


def _load() -> dict:
    if CASSETTES.exists():
        return json.loads(CASSETTES.read_text())
    return {}


def _save(store: dict) -> None:
    CASSETTES.write_text(json.dumps(store, indent=1, sort_keys=True))


# ---------------------------------------------------------------------------
# Making a schema stick on a provider that ignores schemas
# ---------------------------------------------------------------------------

def _schema_fallback(system: str | None, schema: dict) -> str:
    """Ask for the shape in words, because this vendor ignores the field.

    Structured outputs are a real feature on Anthropic: the decoder is
    constrained and the reply *cannot* come back the wrong shape. DeepSeek
    accepts `output_config.format` and ignores it, which is worse than
    rejecting it — you get confident prose where you expected JSON.

    So we do it the old way, and then check. Note the order: instructions
    last, because the thing nearest the end of the prompt has the most pull.
    """
    demand = (
        "Reply with a single JSON object and nothing else. No prose, no "
        "explanation, no ``` fence. It must validate against this JSON Schema:\n"
        + json.dumps(schema, indent=1)
    )
    return f"{system}\n\n{demand}" if system else demand


_FENCE = re.compile(r"```(?:json)?\s*(.*?)\s*```", re.S)


def _extract_json(text: str, schema: dict):
    """Pull an object out of a reply that was *asked* to be pure JSON."""
    candidate = text.strip()

    fenced = _FENCE.search(candidate)
    if fenced:
        candidate = fenced.group(1).strip()

    if not candidate.startswith("{"):
        start = candidate.find("{")
        end = candidate.rfind("}")
        if start == -1 or end <= start:
            raise ValueError(
                f"expected JSON, got prose: {text.strip()[:160]!r}"
            )
        candidate = candidate[start:end + 1]

    data = json.loads(candidate)

    # The bit people skip. An unconstrained model can return valid JSON of
    # the wrong shape, and a missing key surfaces three functions later as a
    # KeyError with no clue where it came from. Fail here instead.
    missing = [k for k in schema.get("required", []) if k not in data]
    if missing:
        raise ValueError(f"JSON is missing required key(s): {missing}")
    return data


# ---------------------------------------------------------------------------
# The two calls the course uses
# ---------------------------------------------------------------------------

def ask(prompt: str, *, system: str | None = None, schema: dict | None = None,
        effort: str = EFFORT, max_tokens: int = 2000, variant: int = 0):
    """Send one message. Return the reply text, or a parsed dict if `schema`.

    `schema` is a JSON Schema. On a provider that supports structured
    outputs this constrains the decoder so the reply *cannot* be the wrong
    shape. On one that doesn't, we ask in the prompt and validate the answer
    — same call signature either way, which is the entire point of this file.

    `variant` changes nothing about the request. It only separates recordings,
    so that asking the identical question five times records five answers
    instead of overwriting one. Stage 2 needs that: the whole lesson is that
    the same question can come back different.
    """
    native_schema = bool(schema) and _CFG["quirks"]["json_schema"]

    if schema and not native_schema:
        system = _schema_fallback(system, schema)

    request: dict = {
        "model": MODEL,
        "max_tokens": max_tokens,
        "messages": [{"role": "user", "content": prompt}],
    }
    request.update(tuning(effort))
    if system:
        request["system"] = system
    if native_schema:
        request.setdefault("output_config", {})
        request["output_config"]["format"] = {
            "type": "json_schema", "schema": schema,
        }

    cassette_key = _key({**request, "_variant": variant, "_p": PROVIDER})
    store = _load()

    if OFFLINE:
        if cassette_key not in store:
            raise SystemExit(
                "\n  No recording for this exact request, so --offline cannot answer it.\n"
                "  Recordings are keyed on the whole request, so any change to your\n"
                f"  prompt needs a fresh recording. Set {_CFG['env']} and drop\n"
                "  --offline to record it.\n"
            )
        text = store[cassette_key]
    else:
        response = client().messages.create(**request)

        # Claude runs safety classifiers. A declined request is a normal
        # HTTP 200 with an empty or partial `content`, so check this BEFORE
        # indexing into content — otherwise you get a confusing IndexError.
        if response.stop_reason == "refusal":
            raise RuntimeError(
                f"The model declined this request "
                f"(category: {getattr(response.stop_details, 'category', None)})."
            )

        _meter(response.usage)
        text = "".join(b.text for b in response.content if b.type == "text")

        # A reasoning model with too small a max_tokens spends the whole
        # budget thinking and returns an empty string. Say so, rather than
        # letting an empty reply fail somewhere less obvious.
        if not text.strip() and response.stop_reason == "max_tokens":
            raise RuntimeError(
                f"{_CFG['label']} used all {max_tokens} tokens on hidden "
                f"reasoning and left no answer. Raise max_tokens, or pass "
                f"effort='low' to turn thinking off."
            )

        store[cassette_key] = text
        _save(store)

    if not schema:
        return text
    return json.loads(text) if native_schema else _extract_json(text, schema)


def meter(response) -> None:
    """Count a call you made yourself.

    Stages 5 and 6 drive the client directly, so `ask()` never sees them.
    Without this line their token spend is invisible — and a cost you cannot
    see is a cost you will not manage.
    """
    _meter(response.usage)


def _meter(usage) -> None:
    _spend["in"] += usage.input_tokens
    _spend["out"] += usage.output_tokens
    _spend["cached"] += getattr(usage, "cache_read_input_tokens", 0) or 0
    _spend["calls"] += 1


_baseline = None


def _count(text: str) -> int:
    return client().messages.count_tokens(
        model=MODEL, messages=[{"role": "user", "content": text or "x"}]
    ).input_tokens


def tokens(text: str) -> int:
    """Count the tokens in `text`, the way the API counts them.

    Do not estimate with len(text)/4, and do not use tiktoken — that is
    OpenAI's tokenizer and it is wrong for both models here.

    One wrinkle worth understanding, because it bites people in stage 4:
    the endpoint counts a whole *request*, not a string, and every request
    carries wrapping — role markers, chat template, tool preamble. On
    DeepSeek that floor is ~83 tokens before your text is even considered.
    So we measure the empty request once and subtract it. What comes back
    is the cost of your text, which is the thing stage 4 is budgeting.
    """
    global _baseline
    if OFFLINE:
        return len(text) // 4  # rough; offline has no API to ask
    if _baseline is None:
        _baseline = _count("") - 1      # -1 for the "x" stand-in above
    return max(0, _count(text) - _baseline)


def _peak() -> bool:
    """DeepSeek halves its prices outside peak hours.

    Peak is 01:00-04:00 and 06:00-10:00 UTC. Worth knowing before you run a
    thousand-case eval: the identical job can cost half as much at 22:00.
    """
    h = _dt.datetime.now(_dt.timezone.utc).hour
    return 1 <= h < 4 or 6 <= h < 10


def spend() -> str:
    """A human-readable running total. Print it at the end of a stage."""
    if OFFLINE:
        return "offline — no tokens spent"

    mult = 2.0 if (PROVIDER == "deepseek" and _peak()) else 1.0
    fresh_in = max(0, _spend["in"] - _spend["cached"])
    dollars = (
        fresh_in * PRICE_IN
        + _spend["cached"] * _CFG["prices"]["cached_in"]
        + _spend["out"] * PRICE_OUT
    ) * mult / 1_000_000

    note = ""
    if _spend["cached"]:
        note += f" ({_spend['cached']:,} cached)"
    if mult > 1:
        note += " · peak rate"
    return (f"{_spend['calls']} call(s) · {_spend['in']:,} in / "
            f"{_spend['out']:,} out{note} · ${dollars:.4f} on "
            f"{MODEL}")


def preflight() -> None:
    """Fail early and clearly, instead of deep inside a stack trace."""
    if OFFLINE:
        print("  [offline] replaying recorded answers — you are not seeing "
              "real model variation.\n")
        return
    if not os.environ.get(_CFG["env"]):
        others = [n for n, c in PROVIDERS.items()
                  if n != PROVIDER and os.environ.get(c["env"])]
        hint = (f"\n  ({PROVIDERS[others[0]]['label']} is configured — run with "
                f"CAFE_PROVIDER={others[0]} to use it.)\n" if others else "")
        raise SystemExit(
            f"\n  {_CFG['env']} is not set, so the {_CFG['label']} provider "
            f"cannot run.\n\n"
            f"    export {_CFG['env']}=...\n\n"
            f"  Get a key: {_CFG['help']}\n"
            f"{hint}"
            "  Or run any stage with --offline to replay recorded answers.\n"
        )
    print(f"  [{_CFG['label']}] {MODEL} · effort={EFFORT}\n")
