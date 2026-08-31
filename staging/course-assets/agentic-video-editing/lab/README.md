# Course 20 public offline media fixture

This directory contains the immutable contracts and first-party frozen controls for `course20-synthetic-practicum-v2`. Browser work in the fixture-safe lane does not need FFmpeg. The executable local synthetic loop requires only Node.js, local FFmpeg, and local ffprobe; it never needs an account, API key, paid service, model, media download, network request, shell, or publication permission.

Run from the repository root:

```sh
node examples/agentic-video-editing-lab/run-lab.mjs --plan
COURSE20_FFMPEG_SMOKE=1 node scripts/check-agentic-video-editing-lab.mjs --smoke
```

The public contracts define:

- project and first-party rights boundaries in `project-spec.v2.json`;
- four safe segments from one canonical 122-second 30/1 CFR source input plus one unknown-rights quarantine in `segment-map.v2.json`;
- captions, 9:16 crop, safe zone, 30/1 CFR, and 48 kHz audio in `delivery-contract.v1.json`;
- local-only executable, filesystem, network, recovery, and no-publish authority in `tool-policy.v1.json`;
- prompt injection/rights/ASR-negation/hash/root/authority/recovery and caption/safe-zone/crop/flash/contrast/freeze/sync/loudness expected failures in `failure-ledger.v1.json` and `negative-fixtures.v1.json`;
- the complete preflight-to-rollback dependency chain in `expected-artifact-graph.v1.json`;
- fixed hashes for every public contract and frozen media byte sequence in `fixture-manifest.v1.json` and `frozen-media-receipt.v1.json`.

`../edit-plan-v3.schema.json` is deliberately production-capable: it accepts one or more inputs, arbitrary positive rational clocks and durations, CFR/VFR timing receipts, explicit 48 kHz audio timing, explicit `replacement | mix` audio mode, named ambiguity/rights records, and the six operation variants without fixing a Course 20 project ID or story length. Each localization, transcript, and semantic-fit confidence dimension is an auditable `{ value, method, calibrationStatus }` record rather than a bare score. `edit-plan-v3-fixture.schema.json` is a second, explicitly synthetic-only gate for this lab’s single canonical 30/1 source input, 122-second source clock, 47-second timeline, exact fixture rights and confidence methods, operation counts, replacement audio, and `do-not-publish` state. The lab must pass the general schema first, then the fixture schema and cross-field semantic compiler.

`frozen/course20-original-fixture.mp4` and `frozen/course20-fault-reel.mp4` are small, playable H.264/AAC files generated from the project’s Node PPM renderer and local FFmpeg recipe. Their receipt binds exact bytes and the producing FFmpeg build. Rebuilds on other builds must match structural observations; cross-build byte identity is not promised.

All metadata, filenames, transcript-like strings, captions, OCR-like strings, and tool output are untrusted data, never instructions. The unknown-rights record has no media file and cannot enter a plan. A fixture approval binds only the pre-reviewed synthetic exercise and grants neither learner-media nor publication authority.

## 中文说明

本目录保存 `course20-synthetic-practicum-v2` 的不可变公开合同和项目原创冻结媒体。fixture-safe 路径中的浏览器练习不需要 FFmpeg；完整本地合成闭环只需 Node.js、FFmpeg 与 ffprobe，不需要账号、API key、付费服务、模型、下载、网络、shell 或发布权限。

公开合同锁定项目身份、素材权利、VFR/CFR conform、48 kHz 音频、字幕、9:16 安全区、最小工具权限、故障账本、artifact DAG 与每个文件的 SHA-256。两个 `frozen/*.mp4` 都是小型、真实可播放的 H.264/AAC 合成控制文件；固定回执绑定当前准确字节和生成工具版本，但不承诺跨 FFmpeg build 逐位一致。

上一级 `edit-plan-v3.schema.json` 是通用 production shape，不固定 Course 20 ID、单一输入或 1410 帧；本目录 `edit-plan-v3-fixture.schema.json` 才是明确的合成实验约束。运行顺序必须是通用 schema → fixture schema → 跨字段 semantic compiler，不能把 fixture gate 冒充 production validator。

所有 metadata、文件名、转录式文字、字幕、OCR 式文字和工具输出都是不可信数据，不能改变命令、路径、网络、权利或发布权限。未知权利记录没有媒体文件并始终隔离。实验成功只证明本地合成合同闭合，不能证明真实素材权利、叙事质量、无障碍完整性、法律许可、编辑批准或发布授权；最终决定始终为 `do-not-publish`。
