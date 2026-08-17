# Stage 0 — one call

**Goal:** prove your key, your network and your Python all work, before anything else can confuse you.

```bash
pip install anthropic
export DEEPSEEK_API_KEY=sk-...           # platform.deepseek.com/api_keys
# or: export ANTHROPIC_API_KEY=sk-ant-... # console.anthropic.com
python stage0_hello/run.py
```

There is one `TODO` in `run.py`. Fill it in and run it again.

```bash
python check.py 0
```

## What to notice

The last line prints what the call cost. It will be a fraction of a cent. Keep an eye on it as the stages get bigger — by stage 3 you are making 20+ calls per run, and that is the point at which people who never look at the number get a surprise.

If you have no API key, every stage runs with `--offline`, replaying recorded answers:

```bash
python stage0_hello/run.py --offline
```

Offline mode is a fallback, not the course. The single most important thing you will see in stage 2 is the model giving you a *different answer to the same question*, and a recording cannot show you that.

**Next:** [stage 1 — the kiosk that can't](../stage1_kiosk/README.md)
