# Course 20 核验 provenance

本文记录 `course20-content-verification-2026-08-26.md` 的证据路径与复现方法。它不是发布批准，也不包含凭证、私有媒体或生产数据。

## A. 来源冻结方法

### GitHub

1. release-pinned 来源同时记录描述性 tag/release URL 与解析后的 40 位 commit；课程内的具体 README、docs、license、package 或 source evidence 均使用该 commit 的 `blob`/`tree` URL。
2. commit-pinned-at-cutoff 来源固定到不晚于 2026-08-26 的 commit。
3. 许可证仅在同一固定 ref 的 LICENSE/COPYING/NOTICE 或等价权威文件支持时填写；仓库许可证不自动覆盖模型、媒体、云服务、provider、第三方组件或学习者素材。
4. 课程只链接与转述；没有复制第三方仓库代码、截图、示例媒体或 provider output。

| Source ID | Repository | Frozen revision | Resolved commit / cutoff commit | License boundary |
|---|---|---|---|---|
| `video-use` | `browser-use/video-use` | cutoff commit | `92c2b34e44c205cbc2acae7f6ca7c1c219d5dd66` | MIT |
| `ffmpeg` | `FFmpeg/FFmpeg` | `n9.0.1` / 9.0.1 Lei | `bf1b838f2ab88b4f8fd83443325c782ea0e0f7fa` | default LGPL-2.1-or-later；build-dependent GPL/nonfree |
| `remotion` | `remotion-dev/remotion` | `v4.0.517` | `a2c2a6260fee129bb55f97b9632d998f589839b7` | Remotion License；commercial conditions separate |
| `remotion-skills` | `remotion-dev/remotion` + `remotion-dev/skills` | cutoff commits | `7aee2f4b3d5c05c77761f2dc6ec5aeac701dcce8` + `7c5c10caa5294d01b168a08c9648b4deef717274` | skill availability does not replace runtime license review |
| `opentimelineio` | `AcademySoftwareFoundation/OpenTimelineIO` | `v0.18.1` pre-release | `44236713c1db295a6ffc66189ae98dbdfd0cb9c4` | Apache-2.0 |
| `whisper` | `openai/whisper` | `v20250625` | `31243bad24cc746f07d4c8bfdd2d974872cb1803` | MIT；no diarization claim |
| `whisperx` | `m-bain/whisperX` | `v3.8.6` | `3ccc17b8de34f305300f8a3fd3c9f76ba820c0d0` | BSD-2-Clause；pyannote/token/model terms separate |
| `pyscenedetect` | `Breakthrough/PySceneDetect` | `v0.7.1` | `6ebb72392de8acfb6c539bf15d0aa912ce7ab6b2` | BSD-3-Clause |
| `qwen3-vl` | `QwenLM/Qwen3-VL` | cutoff commit | `96588727e44c78b25ba03ea03b8e12f7e64fd0da` | repository code Apache-2.0；model terms separate |
| `vmaf` | `Netflix/vmaf` | `v3.2.0` | `3f9e02af258a5c0e30124fc585a3c3af90126dee` | BSD-2-Clause-Patent |
| `auto-editor` | `WyattBlue/auto-editor` | `31.5.0` | `2f7ba68049ee67317a7afe6a0555ea6cf30ad101` | Unlicense |
| `videodb-director` | `video-db/Director` | cutoff commit; latest named release v0.1.1 | `70e0b3dfdf59c679a25f4bea511e3cc4c5f2457f` | MIT；cloud/API/data/cost separate |
| `montaj` | `theSamPadilla/montaj` | `v3.10.1` | `634d523f4b022a19c5cf98ffa4f9e609178437c7` | MIT |
| `timeline-studio` | `MartinDelophy/ai-video-editor` | `v1.0.5` | `2a59ffcfc6042deb56456cdadf6434ce39a647cd` | MIT；tag/package version mismatch disclosed |
| `qcut` | `Quriosity-agent/qcut` | `v2026.08.26.1` | `d297613a965102caf45cd5f7cbd0d407340b3dcd` | qcut source tree MIT；providers/assets separate |
| `velorn` | `VelornLabs/velorn` | `v0.3.29` | `90aa9028ee38a98458c6fbd9a9a79b189462e019` | GPL-3.0-only；network/provider paths separate |
| `veac` | `AgentsMesh/veac` | `v0.2.0` | `e3472918a8c05fe53be1c2bf6c6a76cd5730d8af` | MIT；Cargo package remains 0.1.0 |
| `video-edit-cli` | `computerlovetech/video-edit-cli` | `v0.1.2` | `69aeeec7dad7470c1379c7115cbd4d96a4be8686` | MIT |
| `davinci-resolve-mcp` | `samuelgursky/davinci-resolve-mcp` | cutoff commit | `c3c075bcc930b4f967b3abae3073bc48e435c5af` | MIT；Resolve/product/version/edition separate |
| `mosaic-skills` | `mosaic-ai-labs/skills` | cutoff commit | `8331979eb00cc4840a78fddf2355c4a04c0c3219` | MIT；service/provider/media/output terms separate |

完整 claim URLs、rights decisions、中英文 supports/boundaries 与 machine snapshot tuples 位于 `lib/agentic-video-editing/sources.ts` 和 `scripts/check-agentic-video-editing-course.mjs`。

### X

| Source ID | Direct status | Official oEmbed status | Evidence boundary |
|---|---|---|---|
| `x-video-use-release` | `2044554557221675380` | truncated | 可见 talk-to-camera → `final.mp4` 及列出的处理项；silence 与技术机制来自固定仓库 |
| `x-remotion-skills` | `2013626968386765291` | complete | 官方 Remotion Agent Skills announcement；不证明一句 prompt 或所有用途免费 |
| `x-davinci-mcp` | `2075105180023144837` | truncated | 可见 capability list；不推断账号组织隶属、tool count 或任意编辑质量 |
| `x-creator-workflow-guide` | `1955108960060706862` | truncated | 可见课程范围扩展观察；不重建后文、不推断正式身份或附件内容 |
| `x-mosaic-slack` | `2032121100126265551` | truncated | 可见 Slack/Mosaic clip-edit-post demo；不证明素材授权、隐私、质量或发布权限 |

每条 X record 均要求：direct status URL、`publish.x.com/oembed` URL、status ID、author identity、published date、text completeness、verification method/status、corroboration scope。搜索引擎 snippet 不进入 canonical text record。

## B. Schema 与 semantic gate 证据

- Validator：`ajv@8.20.0` exact pin，Draft 2020-12，`strict: true`、`allErrors: true`。
- Schema positive instances：
  - builder 生成的 blocked teaching-fixture plan；
  - 无 `fixtureId`、使用 production input/hash/rights/evidence 的 production plan。
- Schema negative instances：额外顶层字段、缺 operation reason、teaching 缺 fixture identity、production 冒充 fixture identity。
- Structural introspection：plan 顶层与 operation required/property closure、`additionalProperties: false`、frame range、execution constants、无 approvals/releaseDecision/self-hash、teaching/production conditional boundaries。
- Semantic mutations：duplicate operation ID、source missing/out-of-bounds、timeline discontinuity、expected duration mismatch、target/duration/tolerance、unsafe output path、dry-run/network/overwrite/publish/stop flags、unknown rights、unresolved ambiguity、human review disabled、fixture timebase/input/span/evidence drift、unknown archive self-clearance。

Schema 只证明结构；realpath/symlink containment、真实 hash 匹配、外部 evidence resolution、真实媒体权利、工具行为、含义与发布决定仍须 runtime 与人类审查。

## C. 公开 fixture 完整性

`public/courses/agentic-video-editing/fixtures.provenance.json` 记录以下 final hashes：

```text
035bfd52b2a29392b88aaca357ca52510774094809d1598164203dfe6c209a27  creative-brief.fixture.json
659e289e57edceb5608c6c85843d5b38fa423dda20129bccfe71aa9ef462ffdb  media-manifest.fixture.json
f1b4925382df750c80d77fcb392b3cde6cb4804138f5418ff4381d6c93b05dc2  edit-plan.schema.json
cbc78c4693e69173d32d53879046a310ce2a0715388e68120ed322d4b59f4088  qc-checklist.md
75c3fecda32fc04fbde79e5221fd60038dd3c6042d74263193c0b8b3df22a830  NOTICE.md
```

静态 gate 对比 `public/` 与 `out/` 的 6 个文件名和逐字节内容，再核对上面 5 个 hashes；provenance 文件不自我 hash。

## D. 可复现验证命令

在 `/private/tmp/aicourse-agentic-video-editing`：

```sh
npm audit --audit-level=moderate
npm run agentic-video-editing:check:release
npx tsc --noEmit
npx eslint app/'[locale]'/agentic-video-editing components/agentic-video-editing lib/agentic-video-editing tests/agentic-video-editing-course.spec.ts scripts/check-agentic-video-editing-course.mjs scripts/check-agentic-video-editing-static.mjs
git diff --check
npx next build --webpack
npm run agentic-video-editing:static-check
npm run test:agentic-video-editing
```

最终观察结果：audit 0 vulnerabilities；release/type/lint/diff/build/static 均 PASS；1,940 个静态页面完成；Playwright 9/9 PASS，并确认缺失静态路由保持 404。专用 release config 不读取通用 `PLAYWRIGHT_BASE_URL`；即使环境预设错误外部 URL，测试仍只启动并访问候选 `out/` server。

## E. 结论边界

本 provenance 支持“Course 20 在本地代码、内容、来源、schema、静态产物与浏览器验收范围内通过”。它不支持“生产已部署”“真实媒体已清权”“真实剪辑质量已验证”“第三方服务当前稳定”“智能体可无人值守发布”或“课程完成等同正式证书/授权”。
