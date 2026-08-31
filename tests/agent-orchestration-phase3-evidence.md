# Course 15 Phase 3 evidence

Captured on 2026-08-30 from the isolated Course 15 worktree. The browser files under
`output/playwright/course15-phase3/` are ignored runtime evidence; the adjacent JSON
manifest records their reproducible inventory, measurements, and representative hashes.

## Matrix contract

- Browsers: Chromium, Firefox, WebKit.
- Locales: English and Simplified Chinese.
- Themes: light and dark.
- Viewports: 1440×900, 820×1180, 390×844, and 320×700.
- Matrix size: 3 × 2 × 2 × 4 = 48 cells before and 48 cells after.
- Every cell records response status, document width/height, primary-action position,
  typography, and a viewport screenshot. The after matrix additionally records native
  color scheme, navigator type, and workspace foreground/background contrast.

## Artifact inventory

| Phase | Matrix PNG | Matrix JSON | Ancillary PNG | Total files |
| --- | ---: | ---: | ---: | ---: |
| Before | 48 | 3 | 5 | 56 |
| After | 48 | 3 | 13 | 64 |

The 13 after-state ancillary screenshots cover keyboard focus in all three engines,
reduced motion in all three engines, coarse navigation/assessment targets in all three
engines, coarse course controls in all three engines, and the Chromium selected-assessment
marker. The browser-independent CSS source audit intentionally runs only in Chromium;
Firefox and WebKit therefore report one expected skip each.

## Before/after measurements

No matrix cell has horizontal document overflow, before or after. The primary action
remains fully above the fold at every promised viewport.

| Viewport | Before CTA bottom, min–max | After CTA bottom, min–max | Before document height, min–max | After document height, min–max |
| --- | ---: | ---: | ---: | ---: |
| 1440×900 | 802.4375–831.0666809082031 px | 823–831.0666809082031 px | 7016–7510 px | 7101–7507 px |
| 820×1180 | 619.15625–658.0333099365234 px | 636.96875–658.0333099365234 px | 8414–8881 px | 8413–8878 px |
| 390×844 | 445.71875–554.3333282470703 px | 483.765625–554.3333282470703 px | 11270–12568 px | 11362–12577 px |
| 320×700 | 495.65625–617.1999664306641 px | 511.578125–617.1999664306641 px | 13299–14984 px | 13454–14993 px |

After-state computed measurements across all 48 cells:

- Workspace action contrast: 8.422156076752854:1 minimum and
  9.055932097159467:1 maximum; the required bound is 4.5:1.
- Course navigator type: 13.44 px in every cell, weight 680–720; visible navigator
  state marker: 10.88 px.
- Simplified-Chinese heading line-height/font-size ratio:
  1.119790625–1.120213820315067; tracking/font-size ratio:
  −0.025000013357091146–−0.02499999866452999.
- Simplified Chinese resolves through an explicit local/system stack beginning with
  PingFang SC, Hiragino Sans GB, Microsoft YaHei, and Noto Sans CJK SC.
- Functional evidence copy is at least 11.5 px, source roles at least 12 px, and
  assessment state markers at least 11.5 px in the automated browser checks.
- All audited coarse controls are at least 44 px. The WebKit lab select regression
  measured 20 px before the appearance repair and 44 px afterward; Chromium and Firefox
  render the same custom chevron and geometry.

The pre-edit browser audit also measured the dark workspace primary action at 2.16:1,
evidence mode at 9.76 px, and source role text at 10.24 px. These were the failing
regressions that drove the contrast and functional-type changes; the 48-cell before JSON
predates those added measurement fields and therefore preserves them only visually.

## Visual review

Representative after screenshots were inspected directly:

- `output/playwright/course15-phase3/after/chromium/en-light-1440x900.png`
  preserves desktop hierarchy and keeps the journey action visible.
- `output/playwright/course15-phase3/after/chromium/zh-Hans-dark-390x844.png`
  uses the localized CJK stack and readable wrapping without horizontal overflow.
- `output/playwright/course15-phase3/after/webkit/en-dark-320x700.png`
  keeps both primary actions inside the initial viewport.
- `output/playwright/course15-phase3/after/chromium/assessment-selected.png`
  shows the visible, non-color-only `Selected` marker.
- `output/playwright/course15-phase3/after/{chromium,firefox,webkit}/coarse-course-controls.png`
  shows the repaired 44 px lab select with a consistent custom chevron.

## Reproduction and results

```sh
PHASE3_EVIDENCE_LABEL=before COURSE15_PHASE3_ORIGIN=http://localhost:3015 \
  npx playwright test --config tests/agent-orchestration-phase3.config.ts

PHASE3_EVIDENCE_LABEL=after COURSE15_PHASE3_ORIGIN=http://localhost:3015 \
  npx playwright test --config tests/agent-orchestration-phase3.config.ts
```

The final after run completed with 16 passed and the two expected shared-source audit
skips in 1.1 minutes. A targeted Chromium hover/active/disabled/keyboard run also passed
against the exported static site, proving that the active-state sampler waits for the
60 ms transition rather than reading the hover frame. The targeted coarse-control run
passed in Chromium, Firefox, and WebKit (3/3). The focused workspace/client bundle
boundary passed 5/5 under the unchanged limit.

