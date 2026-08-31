# Stage 0 — prove the call seam

**Stage 0 of 10** · Previous: [course setup](../README.md#before-you-start) ·
[Course index](../README.md) · Next: [Stage 1 — the kiosk that can't](../stage1-kiosk/README.md)

**Goal:** prove your TypeScript entry point and local call seam before anything
else can confuse you. With `--offline`, the scripted stand-in proves only the
local path. A live run separately proves the configured Provider returned a
response over the network.

Install exactly what the lockfile specifies and verify the bundled no-key seam:

```bash
npm ci
npm run course:offline
```

There is one `TODO` in `run.ts`. Fill in `QUESTION` **before** running Stage 0,
then prove the edited code path without a key:

```bash
npx tsx course/stage0-hello/run.ts --offline
npx tsx course/check.ts 0 --offline
```

That report evidence means “offline path works; live credential was not
checked.” To verify a real credential and network response, configure one
Provider and repeat both commands without `--offline`.

**Live-cost boundary:** each shell block below makes one live call in the Stage
0 run and another in its checker. Both may incur Provider charges. Review the
printed estimate and use the Provider dashboard as the billing record.

macOS/Linux (`bash` or `zsh`):

```bash
export DEEPSEEK_API_KEY=your_key_here     # platform.deepseek.com/api_keys
# or: export ANTHROPIC_API_KEY=your_key_here
#     export CAFE_PROVIDER=anthropic
npx tsx course/stage0-hello/run.ts
npx tsx course/check.ts 0
```

Windows PowerShell:

```powershell
$env:DEEPSEEK_API_KEY = "your_key_here"
# or: $env:ANTHROPIC_API_KEY = "your_key_here"
#     $env:CAFE_PROVIDER = "anthropic"
npx tsx course/stage0-hello/run.ts
npx tsx course/check.ts 0
```

## What to notice

Offline, the last line says that no tokens were spent. Live, it prints the
returned usage and a dated estimate. Keep an eye on it as the stages get
bigger—by Stage 3 you are making 20+ calls per run.

Offline mode is the safe local seam, not evidence of live model behaviour. The
Stage 2 samples the same request repeatedly so you can measure whether a live
configuration varies. A deterministic stand-in cannot reproduce that
measurement.

---

**Stage 0 of 10** · Previous: [course setup](../README.md#before-you-start) ·
[Course index](../README.md) · Next: [Stage 1 — the kiosk that can't](../stage1-kiosk/README.md)
