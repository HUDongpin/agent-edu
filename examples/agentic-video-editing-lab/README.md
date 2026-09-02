# Course 20: offline verified-cut lab

This first-party lab makes the Course 20 control loop executable without learner media, accounts, credentials, models, paid APIs, downloads, network requests, a command shell, publication, or overwrite authority. Node creates an original 122-second 16:9 PPM chapter source with pixel text, visible one-second timecode cards, safe-zone guides, and motion markers. FFmpeg makes the canonical source itself 30/1 CFR with continuous 48 kHz audio, records separate 24 CFR, 30000/1001 CFR, and deliberately irregular VFR provenance controls, conforms only those controls for clock exercises, then renders the reviewed four-segment, 47-second, 1080×1920 candidate from the single canonical 30/1 source.

## Run

From the repository root:

```sh
node examples/agentic-video-editing-lab/run-lab.mjs --plan
node examples/agentic-video-editing-lab/run-lab.mjs
```

`--plan` validates contracts and the artifact DAG without requiring media tools. The complete run creates one unique ignored workspace under `tmp/agentic-video-editing-lab/<run-id>/` and executes:

```text
preflight → generate → plan → render → verify → negative controls → rollback
```

Run a stage separately with the same ID:

```sh
node examples/agentic-video-editing-lab/preflight.mjs --run-id course20-demo-001
node examples/agentic-video-editing-lab/generate.mjs --run-id course20-demo-001
node examples/agentic-video-editing-lab/plan.mjs --run-id course20-demo-001
node examples/agentic-video-editing-lab/render.mjs --run-id course20-demo-001
node examples/agentic-video-editing-lab/verify.mjs --run-id course20-demo-001
node examples/agentic-video-editing-lab/negative-fixtures.mjs --run-id course20-demo-001
node examples/agentic-video-editing-lab/rollback.mjs --run-id course20-demo-001
```

Course version `1.2.0` uses two visibly separate gates. The public `edit-plan-v3.schema.json` is production-generic: it accepts arbitrary project identities, one or more inputs, positive rational CFR/VFR clocks and durations, explicit 48 kHz timing, explicit replacement/mix audio mode, named rights/ambiguity records, all six operation variants, and three confidence records that each carry value, estimation method, and calibration status. The lab-only `edit-plan-v3-fixture.schema.json` then applies this exercise’s one-input, 3660-source-frame/1410-output-frame, exact-rights, exact-confidence-method, replacement-audio, operation-count, and no-publish constraints. A cross-field semantic compiler runs third. Compilation binds exact hashes for four external artifacts only after the plan exists: plan, delivery contract, asset ledger, and tool policy.

Every Node write uses exclusive create. FFmpeg receives `-n` through argument arrays and `shell: false`. Existing and new paths stay inside a real, non-symbolic workspace. Remote protocols and network-capable options are rejected. Originals and conformed proxies become read-only. Reusing a run ID stops rather than overwrites.

The negative registry also exercises prompt injection, unknown rights, ASR negation loss, plan-hash mismatch, root escape, network/publication escalation, and missing recovery. The known-bad reel and its failure ledger exercise caption overlap/out-of-bounds, portrait safe-zone conflict, wrong crop, flash, low contrast, freeze, A/V sync offset, and excessive loudness. A green negative-control result means the fault was blocked; it never means the bad reel is acceptable. Rollback quarantines only an unapproved synthetic canary and preserves the verified candidate, sources, hashes, and receipts.

If FFmpeg, ffprobe, required local filters, fixed hashes, or contracts are unavailable, preflight writes a blocked receipt and stops. No later stage may manufacture a pass.

## Boundary

Passing proves only that this exact local synthetic fixture exercised the timing, path, provenance, compile, render, detector, and rollback contracts. It does not establish story quality, real-media rights, privacy compliance, accessibility completeness, legal clearance, editorial approval, certification, or publication authority. The terminal decision is always `do-not-publish`.

## 中文说明

此实验只使用项目原创的几何、像素文字、时间码、安全区、运动标记与 48 kHz 测试音，不使用学习者素材、账号、凭据、模型、付费 API、下载、网络、shell 或发布权限。它真实生成 122 秒 16:9、30/1 CFR canonical 源素材；24 CFR、30000/1001 CFR 与 VFR 只作额外 PTS/conform provenance 控制。黄金计划从唯一的 30/1 canonical 源选择 hook、context、method、close 四段，渲染约 47 秒、1080×1920 的竖屏审查成片。

流程严格执行 `preflight → generate → plan → render → verify → negative controls → rollback`。v3 计划显式记录视频/音频时钟、权利决定、六类 operation、三项置信度与歧义责任；实际编译在计划冻结后，以外部回执绑定 plan、delivery contract、asset ledger、tool policy 四个准确 hash。

负例覆盖 prompt injection、未知权利、ASR 否定词丢失、hash/root/authority/recovery、字幕、安全区、裁切、闪烁、对比度、冻结、同步与响度。Rollback 只隔离未批准的合成 canary，不删除学习者数据，也不改变已验证候选或只读源。任何依赖或合同不满足时，系统只留下 blocked receipt，绝不伪造成功。最终边界始终是本地合成证据与 `do-not-publish`。
