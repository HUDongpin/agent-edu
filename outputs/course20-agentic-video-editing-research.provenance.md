# 第 20 课来源与 provenance 登记

核验日期：2026-08-26  
课程版本：1.1.0  
研究截止：2026-08-26

## 核验合同

- GitHub 主张 URL 必须是同一仓库内锁定 40 位 commit 的 `blob` / `tree` URL。release tag 仅作为 `versionAnchorUrl`；tag 名本身不被当成不可变证据。
- release-pinned 记录保存 `revision`（人可读 release 名称）与 `resolvedCommit`（证据绑定）。研究截止日记录保存具体 commit，并标为 `commit-pinned-at-cutoff`。
- license 只在锁定 commit 的 LICENSE/COPYING 文件明确时登记；项目代码许可不自动覆盖模型、媒体、字体、provider、服务或输出。
- X 只接受直接状态 URL 与 X 官方 `publish.x.com/oembed`。oEmbed 截断后不从搜索索引、镜像或媒体猜测剩余文字。
- 所有第三方材料采用链接与改写；课程不复制上游代码、README 长段落、帖子文字或媒体。

## GitHub 来源登记（20）

| ID | 仓库与版本锚点 | 证据 commit | 角色 | 许可证与边界 |
|---|---|---|---|---|
| `video-use` | [browser-use/video-use](https://github.com/browser-use/video-use)；cutoff snapshot | `92c2b34e44c205cbc2acae7f6ca7c1c219d5dd66` | agent architecture | MIT；仓库机制不证明 launch demo 的质量或节时 |
| `ffmpeg` | [FFmpeg n9.0.1](https://github.com/FFmpeg/FFmpeg/tree/n9.0.1) | `bf1b838f2ab88b4f8fd83443325c782ea0e0f7fa` | execution engine | 默认 LGPL-2.1-or-later；实际 binary 受 build options 影响 |
| `remotion` | [Remotion v4.0.517](https://github.com/remotion-dev/remotion/releases/tag/v4.0.517) | `a2c2a6260fee129bb55f97b9632d998f589839b7` | execution engine | Remotion License；商业条款特殊，当前免费公司许可为最多三名员工 |
| `remotion-skills` | [Remotion skills snapshot](https://github.com/remotion-dev/remotion/tree/7aee2f4b3d5c05c77761f2dc6ec5aeac701dcce8/packages/skills) | `7aee2f4b3d5c05c77761f2dc6ec5aeac701dcce8`（skills submodule `7c5c10caa5294d01b168a08c9648b4deef717274`） | agent tool surface | link/paraphrase only；不从父仓库自动推断 submodule 许可 |
| `opentimelineio` | [OTIO v0.18.1 pre-release](https://github.com/AcademySoftwareFoundation/OpenTimelineIO/releases/tag/v0.18.1) | `44236713c1db295a6ffc66189ae98dbdfd0cb9c4` | timeline contract | Apache-2.0；不是 renderer；`.otio` 与 `.otioz` / `.otiod` 分开 |
| `whisper` | [Whisper v20250625](https://github.com/openai/whisper/releases/tag/v20250625) | `31243bad24cc746f07d4c8bfdd2d974872cb1803` | analysis component | MIT；Whisper alone 不分 speaker |
| `whisperx` | [WhisperX v3.8.6](https://github.com/m-bain/whisperX/releases/tag/v3.8.6) | `3ccc17b8de34f305300f8a3fd3c9f76ba820c0d0` | analysis component | BSD-2-Clause；alignment/diarization 仍需复核 |
| `pyscenedetect` | [PySceneDetect v0.7.1](https://github.com/Breakthrough/PySceneDetect/releases/tag/v0.7.1) | `6ebb72392de8acfb6c539bf15d0aa912ce7ab6b2` | analysis component | BSD-3-Clause；scene list/CSV/stills，不声称原生 contact sheet |
| `qwen3-vl` | [Qwen3-VL snapshot](https://github.com/QwenLM/Qwen3-VL/tree/96588727e44c78b25ba03ea03b8e12f7e64fd0da) | `96588727e44c78b25ba03ea03b8e12f7e64fd0da` | analysis component | 仓库 code Apache-2.0；模型条款另计；issue 只作未验证用户报告 |
| `vmaf` | [VMAF v3.2.0](https://github.com/Netflix/vmaf/releases/tag/v3.2.0) | `3f9e02af258a5c0e30124fc585a3c3af90126dee` | quality control | BSD-2-Clause-Patent；full-reference 视频指标，不验证含义/音频/权利 |
| `auto-editor` | [Auto-Editor 31.5.0](https://github.com/WyattBlue/auto-editor/releases/tag/31.5.0) | `2f7ba68049ee67317a7afe6a0555ea6cf30ad101` | deterministic automation | Unlicense；阈值自动化不是 agent，也不保证保留语义节奏 |
| `videodb-director` | [Director snapshot](https://github.com/video-db/Director/tree/70e0b3dfdf59c679a25f4bea511e3cc4c5f2457f)；latest named release v0.1.1 | `70e0b3dfdf59c679a25f4bea511e3cc4c5f2457f` | agent architecture | MIT；云/API、数据与费用边界另查 |
| `montaj` | [Montaj v3.10.1](https://github.com/theSamPadilla/montaj/releases/tag/v3.10.1) | `634d523f4b022a19c5cf98ffa4f9e609178437c7` | agent tool surface | MIT；外部 host 仍负责推理、权限与验证 |
| `timeline-studio` | [Timeline Studio v1.0.5](https://github.com/MartinDelophy/ai-video-editor/releases/tag/v1.0.5) | `2a59ffcfc6042deb56456cdadf6434ce39a647cd` | agent tool surface | MIT；tag 1.0.5 与该 commit package.json 1.0.0 不一致 |
| `qcut` | [QCut v2026.08.26.1](https://github.com/Quriosity-agent/qcut/releases/tag/v2026.08.26.1) | `d297613a965102caf45cd5f7cbd0d407340b3dcd` | agent tool surface | qcut source tree MIT；provider/assets/model terms 分开 |
| `velorn` | [Velorn v0.3.29](https://github.com/VelornLabs/velorn/releases/tag/v0.3.29) | `90aa9028ee38a98458c6fbd9a9a79b189462e019` | agent tool surface | GPL-3.0-only；Pexels 路径需 key/network |
| `veac` | [VEAC v0.2.0](https://github.com/AgentsMesh/veac/releases/tag/v0.2.0) | `e3472918a8c05fe53be1c2bf6c6a76cd5730d8af` | timeline contract | MIT；tag 0.2.0 与 Cargo package 0.1.0 不一致 |
| `video-edit-cli` | [video-edit-cli v0.1.2](https://github.com/computerlovetech/video-edit-cli/releases/tag/v0.1.2) | `69aeeec7dad7470c1379c7115cbd4d96a4be8686` | agent tool surface | MIT；schema/inspection 示例不证明任意计划安全 |
| `davinci-resolve-mcp` | [DaVinci Resolve MCP snapshot](https://github.com/samuelgursky/davinci-resolve-mcp/tree/c3c075bcc930b4f967b3abae3073bc48e435c5af) | `c3c075bcc930b4f967b3abae3073bc48e435c5af` | agent tool surface | MIT；仅链接/转述，以固定 media-analysis guide 支撑受限主张，不复制代码或截图 |
| `mosaic-skills` | [Mosaic skills snapshot](https://github.com/mosaic-ai-labs/skills/tree/8331979eb00cc4840a78fddf2355c4a04c0c3219) | `8331979eb00cc4840a78fddf2355c4a04c0c3219` | agent tool surface | MIT；仅链接/转述且不复制代码；API key、credits、网络与 social authorization 另计 |

## Release tag → resolved commit

| Source ID | 描述性 tag/release | 解析 commit |
|---|---|---|
| `ffmpeg` | `n9.0.1` | `bf1b838f2ab88b4f8fd83443325c782ea0e0f7fa` |
| `remotion` | `v4.0.517` | `a2c2a6260fee129bb55f97b9632d998f589839b7` |
| `opentimelineio` | `v0.18.1` | `44236713c1db295a6ffc66189ae98dbdfd0cb9c4` |
| `whisper` | `v20250625` | `31243bad24cc746f07d4c8bfdd2d974872cb1803` |
| `whisperx` | `v3.8.6` | `3ccc17b8de34f305300f8a3fd3c9f76ba820c0d0` |
| `pyscenedetect` | `v0.7.1` | `6ebb72392de8acfb6c539bf15d0aa912ce7ab6b2` |
| `vmaf` | `v3.2.0` | `3f9e02af258a5c0e30124fc585a3c3af90126dee` |
| `auto-editor` | `31.5.0` | `2f7ba68049ee67317a7afe6a0555ea6cf30ad101` |
| `montaj` | `v3.10.1` | `634d523f4b022a19c5cf98ffa4f9e609178437c7` |
| `timeline-studio` | `v1.0.5` | `2a59ffcfc6042deb56456cdadf6434ce39a647cd` |
| `qcut` | `v2026.08.26.1` | `d297613a965102caf45cd5f7cbd0d407340b3dcd` |
| `velorn` | `v0.3.29` | `90aa9028ee38a98458c6fbd9a9a79b189462e019` |
| `veac` | `v0.2.0` | `e3472918a8c05fe53be1c2bf6c6a76cd5730d8af` |
| `video-edit-cli` | `v0.1.2` | `69aeeec7dad7470c1379c7115cbd4d96a4be8686` |

这些解析值是课程在研究截止日保存的证据绑定，不是对 GitHub tag 治理状态的永久保证。

## X 来源登记（5）

| ID | 直接帖子 | 作者/日期 | oEmbed 状态 | 课程允许的主张 | 不允许外推 |
|---|---|---|---|---|---|
| `x-video-use-release` | [2044554557221675380](https://x.com/gregpr07/status/2044554557221675380) | Gregor Zunic；2026-04-15 | truncated；official oEmbed | 可见 launch 文字中的对镜头讲话工作流 → `final.mp4` 与列出的处理项 | silence 来自仓库；不证明质量、节时、可靠性或作者组织关系 |
| `x-remotion-skills` | [2013626968386765291](https://x.com/Remotion/status/2013626968386765291) | Remotion；2026-01-20 | complete；official oEmbed | Agent Skills 已发布 | 不证明一条提示成片、输出质量或所有组织免费使用 |
| `x-davinci-mcp` | [2075105180023144837](https://x.com/GithubProjects/status/2075105180023144837) | GitHub Projects Community；2026-07-09 | truncated；official oEmbed | 可见 capability showcase | 不推断与 GitHub 公司的组织关系，不从帖子推导当前 tool count/安全性 |
| `x-creator-workflow-guide` | [1955108960060706862](https://x.com/cryptoninjanime/status/1955108960060706862) | りょー；2025-08-12 | truncated；official oEmbed | 作者把原计划课程扩展成更广 guide | 不用搜索摘要补文；不支持人类编辑比较、效率或替代结论 |
| `x-mosaic-slack` | [2032121100126265551](https://x.com/_adishj/status/2032121100126265551) | Adish Jain；2026-03-12 | truncated；official oEmbed | Slack agent 用 Mosaic API clip/edit/post | 不声称 thread root；不证明档案权利、隐私、质量或无人审批发布 |

规范 oEmbed 主机统一为 `publish.x.com`。所有记录的 `verificationMethod` 均为 `x-official-oembed`；没有 `search-index` 状态。

## 原创公开学习资产

| 文件 | 用途 | 发布边界 |
|---|---|---|
| `creative-brief.fixture.json` | 虚构创作契约、停止条件、责任角色 | 无源媒体、无真实人、无发布权 |
| `media-manifest.fixture.json` | fail-closed intake 与权利隔离 | 所有 fictional records 均 quarantine |
| `edit-plan.schema.json` | edit-plan v2 的 plan-local JSON Schema | 不包含 approval/release decision；schema-valid 不等于可执行 |
| `qc-checklist.md` | 双语技术、含义、字幕/音频、权利/隐私、交付与具名 release 审校 | approval record 位于 plan bytes 之外；允许 `do not publish` |
| `NOTICE.md` | 版权、no-copy、no-media、no-authority 与完整性边界 | 不检查学习者媒体，不授权第三方内容 |
| `fixtures.provenance.json` | 以上五个文件的 SHA-256 ledger | ledger 不自 hash；完整性不证明质量、权利或发布批准 |

## 仍需上线前重查的易变项

- 20 个仓库的新 release、README、许可证、依赖、网络调用和 provider 条款；
- Remotion 当前商业许可与员工阈值；
- 模型权重、diarization provider、API、stock/archival media、字体和音乐条款；
- X oEmbed 的可访问性与可见文字；截断状态不得静默升级为完整；
- 真实执行环境的 FFmpeg build flags、codec/hardware/thread、time base 与 binary receipt；
- 所有真实素材的 owner、license、consent、privacy、retention、accessibility 与具名 release authority。
