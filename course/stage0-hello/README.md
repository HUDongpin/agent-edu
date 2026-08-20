# Stage 0 — one call

**Goal:** prove your TypeScript entry point, Provider configuration and network work before anything else can confuse you. With `--offline`, the same preflight proves the local code path without a key or network call.

```bash
npm ci
export DEEPSEEK_API_KEY=your_key_here     # platform.deepseek.com/api_keys
# or: export ANTHROPIC_API_KEY=your_key_here
#     export CAFE_PROVIDER=anthropic
npx tsx course/stage0-hello/run.ts
```

There is one `TODO` in `run.ts`. Fill it in and run it again.

```bash
npx tsx course/check.ts 0
```

## What to notice

The last line prints what the call cost. It will be a fraction of a cent. Keep an eye on it as the stages get bigger — by stage 3 you are making 20+ calls per run, and that is the point at which people who never look at the number get a surprise.

If you have no API key, every stage uses the bundled scripted stand-in with `--offline`:

```bash
npx tsx course/stage0-hello/run.ts --offline
```

Offline mode is a fallback, not the course. The single most important thing you will see in stage 2 is a live model giving you a *different answer to the same question*, and a deterministic stand-in cannot show you that.

**Next:** [stage 1 — the kiosk that can't](../stage1-kiosk/README.md)
