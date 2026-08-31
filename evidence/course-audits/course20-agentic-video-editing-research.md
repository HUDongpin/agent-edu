# 第 20 课研究简报：Agentic Video Editing v1.2.0

- 核验日期：2026-08-28；transfer-boundary update：2026-08-30
- 课程版本：1.2.0
- 固定来源研究截止：2026-08-26；版本漂移观察：2026-08-28
- 发布边界：2026-08-28 的验收内容是历史快照；2026-08-30 只新增了把完整 Course 20 技术候选固化为一个本地 commit、供授权的 exact-SHA integration 转移使用的权限。该权限不包括 push、merge、Preview 或部署。
- 双语审核边界：2026-08-28 的人工签署在后续受审字节变化后已经 stale；当前 receipt 必须保持 `stale-human-editorial-signoff` 与 production-promotion blocker，不能把旧签署沿用为当前批准。

## 研究问题

本课要证明的不是“AI 能自动剪视频”，而是一个更严格、可反证的能力：学习者能否把创作意图、有权使用的素材、时间码证据与目的地规格，编译为一条受控执行、可播放、可验证、可回滚的 9:16 candidate，并由具名人类对准确 hash 作出发布或不发布决定。

课程的 canonical 控制链为：

```text
创作意图与责任
  → 素材身份、权利、隐私、provenance 与源时钟
  → transcript / shot / contact-sheet 证据
  → 人工审核的候选片段
  → Edit Plan v3 与独立计划批准
  → tool / MCP authority 与 adversarial dry-run
  → destination / captions / audio / crop / accessibility / color contract
  → 受控执行与 render receipt
  → 技术、语义、编辑、音频、字幕、色彩、无障碍与权利 QC
  → package / recovery / hash-bound human release decision
```

任何执行都必须发生在 delivery specification 与 tool authority 之后；`do-not-publish` 是合格且可审计的终态。

## 课程定位与工作量

- 课程定位：中级制作系统课程，内含 15 分钟初学者 readiness primer；750 分钟引导学习。
- Fixture-safe 浏览器合同：无需编码、账户或付费 API；只形成浏览器本地课程自我追踪。
- Fixture-safe 本地媒体实验：约 180 分钟，要求 CLI、JSON、Node、FFmpeg 与 ffprobe；只有导入 current 本地 receipts 后，才能声称 `synthetic portfolio locally attested`。
- Production-sandbox：是不计分的迁移路径，只使用学习者合法控制的媒体、本地或明确获批工具与具名人审；合成 receipts 不得冒充真实媒体证据。Remotion 扩展另要求 React/TypeScript。
- Final assessment：30 分钟。
- Independent capstone：约 240 分钟。

十个稳定 URL slug 按真实依赖排序：

1. `agentic-editing-contract`
2. `media-ingest-provenance`
3. `transcripts-shots-index`
4. `semantic-analysis-director`
5. `declarative-edit-plan`
6. `agent-tools-mcp`
7. `captions-audio-formats`
8. `deterministic-rendering`
9. `verification-human-review`
10. `production-capstone`

## 课程必须教清的媒体与剪辑基础

课程不能把媒体文件当成“带秒数的文本”。核心正文和实作覆盖：

- 剪辑语言：EDL、cut motivation、continuity、screen direction、reaction、B-roll implication、J/L cut、handles、ripple/roll/slip/slide、pacing 与 context preservation；
- 媒体时钟：source time、timeline time、显式有理数 rate、CFR/VFR、PTS/conform receipt、drop/non-drop-frame、proxy/relink；
- 音频：dialogue edit、room tone、crossfade、click/pop、sync、sample rate、loudness measurement 与 true peak；
- 格式：container/codec、raster、pixel aspect、pixel format、bit depth/chroma、GOP、caption carriage；
- 色彩：source tags、working/display transform、SDR/HDR 分支、scopes 与 shot matching；
- 无障碍：captions/subtitles、speaker 与 non-speech cues、transcript/descriptive transcript、audio-description applicability、contrast、flash 与 player support；
- 交付：目标值来自一个具名 destination contract，不假设“所有社交平台通用”格式或响度。

## Edit Plan 合同

浏览器 Cut Plan 是故意受限的 `selection-plan.v2` 教学合同：只表示选择，状态固定为 blocked，不能携带执行、批准或发布权限。

Production Edit Plan v3 是独立合同：

- 每个 input 保存自己的 media/asset-ledger ID、SHA-256、probe receipt、显式有理数时钟、duration、start timecode、drop-frame、CFR/VFR、PTS/conform 与 48 kHz audio clock；
- timeline 单独声明 edit rate；
- discriminated operation union 包含 `clip`、`caption`、`title`、`audio`（`replacement | mix`）、`crop` 与 `transition`；
- clip confidence 分为 localization、transcript、semantic-fit，每一维保存 value、估算方法与校准状态；
- ambiguity 使用可复数数组，每项保存 kind、evidence、status、owner 与 resolution requirement；
- operation 只引用独立 exact-use `rightsDecisionId`，权利决定保存目的地、法域、期限、署名、变换、model upload permission、reviewer 与时间；
- compile 输入是 `plan + delivery contract + approved asset ledger + tool policy`，并在 plan freeze 后由外部 receipt 绑定 hash。

通用 schema、Course 20 fixture overlay 与 cross-field semantic compiler 分层；fixture-specific validator 不冒充通用 production validator。

## 原创离线媒体实验

项目公开提供两个小型 H.264/AAC、48 kHz MP4 控件与 WebVTT、生成脚本、fixture manifest、frozen receipt、failure ledger、expected observations 和 rollback 记录：

- 原创控制样本：122 秒、16:9、30/1 CFR 主源，包含几何图形、像素文字、时间码、安全区、运动标记与 440 Hz test tone；24/1、30000/1001 与 VFR 只作额外时钟控制；
- 故意失败对照：用于证明检测器会阻断 sync、loudness/true peak、caption/non-speech cue、contrast/flash、visual-description applicability、color tag、crop/safe zone、freeze 与 misleading B-roll 问题。

它们不含人物、个人数据、第三方媒体、音乐、声音表演或模型输出，不需要网络、账户或付费 API，也不授权发布。冻结 hash 只约束仓库中的确切字节；不同 FFmpeg build 只要求结构性观察满足合同，不外推 byte identity。

六秒 fixture 用于练习和反证，不代替学习者 45–60 秒、9:16、自己有权使用素材的 capstone。

## Agent、MCP 与生成式媒体边界

下列内容全部作为不可信 data，不能扩大 authority：transcript、OCR/frame text、metadata、file name、web、MCP tool description/annotation 与 tool output。

Adversarial lab 覆盖 transcript/OCR 指令注入、metadata/file-name 命令、伪 read-only MCP annotation、external URL/secret request、path traversal、symlink、network protocol/resource bomb、token audience/confused deputy、egress、paid generation 与 publish escalation。Core sandbox 默认断网、无凭据、无付费生成、不可覆盖 originals、不可发布。

Core capstone 禁止 synthetic face、voice clone、fabricated quotation/testimonial、event replacement 与未经授权的 identity manipulation。可选 synthetic-media extension 必须另行记录 consent/likeness、输入/模型/provider/output 条款、人类作者贡献、synthetic-region ledger、destination disclosure 与法域检查。

C2PA/Content Credentials 是可选 provenance 机制，不是事实、权利、同意或合法使用证明。EU AI Act Article 50 与美国版权局材料均按具体法域与适用范围呈现；课程不是法律意见。

## 证据架构

机器账本共有 43 条来源：

- 20 个 GitHub repository：只支持固定版本中的实现机制与许可证边界；
- 5 条 X post：只支持有日期、可见 oEmbed 的 field signal；
- 5 个 official standard；
- 9 个 official documentation；
- 1 个 law/regulation；
- 1 个 regulatory guidance；
- 1 个 dated repository issue；
- 1 个 dated official web observation。

重点官方锚点包括 W3C/WCAG media/captions/visual description、ITU-R BS.1770、EBU R 128、ACES、FFmpeg/ffprobe、OpenTimelineIO、MCP Tools、OWASP prompt injection/excessive agency、C2PA 2.4、BBC Editorial Guidelines、Adobe J/L cut、EUR-Lex Regulation (EU) 2024/1689 Article 50 与 U.S. Copyright Office AI Study。

24 条高风险 claim 记录分别标注 `direct | derived | course-policy` 与：

- implementation fact；
- engineering synthesis；
- course fail-closed policy；
- jurisdiction-dependent guidance。

每一教学 section 引用稳定 claim ID。GitHub/X 不能替代标准、性能或法律证据；FFmpeg-only 来源不能证明 caption standard；课程政策不能写成全球法律。

## 学习闭环

课程区分三组不能混写的集合：13 process artifacts、12 module-completion artifacts、12 Capstone artifacts。M7 `delivery-matrix-accessibility` 是执行前必需的 process/module artifact，但不重复进入 Capstone；M5 `plan-diff-independent-approval` 必须进入 Capstone。十二项 Capstone 依次为：创作简报；媒体清单/provenance；证据索引；候选片段/system card；冻结 Edit Plan v3；plan diff 与独立批准；工具政策与 dry-run；render receipt；45–60 秒 9:16 candidate/caption/delivery record；验证/修复/回归；release package/runbook/recovery；绑定版本的 do-not-publish 决定与 residual-risk rationale。

JSON/YAML 必须 parse 并通过 semantic contract；媒体与多文件目录使用 reference/manifest；每次保存产生 content SHA-256、semantic SHA-256 与 validator receipt。修改 production-relevant 上游字段只精确失效 descendants；修改 `nonProductionNotes` 不强制全量重渲，但当前 artifact 的 exact content binding 仍需刷新。

模块完成要求前置模块 current、checkpoint 通过、该模块全部 required artifact receipt current-valid。Assessment 可以提前作为 diagnostic，但只在十个 module receipts 完成后形成正式里程碑。Capstone 必须再绑定 12 项准确 artifact hash、十个 module receipt fingerprint、当前 quiz、package hash、具名 reviewer 与五维 0–3 rubric；总分至少 12/15，前两维各不低于 2，且 unresolved critical blocker 为零。三行垃圾文本不能完成任何模块。

2026-08-28 的人工双语编辑审核曾由当前任务所有者报告通过。独立 receipt 绑定由 72 个直接 Course 20 editorial files 组成的 path-and-byte-framed aggregate，覆盖动态合同、claims、sources、组件内联双语文案、公开 catalogue route、本地实验与公开下载字节，同时单列英文、简中、semantic option binding 与 assessment contract 的精确 SHA-256。后续受审 byte 已经发生变化，因此该签署当前为 stale，不能继续作为 production-promotion 证据；只有对当前精确 surface 的新人工审核才能解除该阻断。

## 研究结论

世界级课程的判断标准不是“有十章、25 条链接与一个漂亮流程图”，而是：

1. 依赖先于执行；
2. 初学者能在原创离线媒体上观察真实 probe、render、QC 与 rollback；
3. builder 能用无歧义 v3 合同表达多时钟与 typed operations；
4. 每一完成状态都由可重算 receipt，而不是文本长度证明；
5. 标准、实现证据、课程政策与法域指导不混写；
6. 失败与不发布仍是安全、可解释、可审计的成功结果。

## 2026-08-28 历史本地验收快照（已被后续字节变化取代）

以下数值只记录 2026-08-28 当时的树，不能作为 2026-08-30 exact-SHA transfer candidate 的当前门禁或人工批准证据。当前门禁必须在最终字节上重新运行并另行报告；当前人工双语 receipt 保持 stale/fail-closed。

- Course 20 release/artifact/assessment/lab gates：PASS；unit 20/20；adversarial controls 16/16。
- 真实 FFmpeg/ffprobe：122 秒 30/1 CFR 主源 → 47 秒、1080×1920、30/1、48 kHz candidate → verify → rollback；无网络、覆盖或发布能力。
- TypeScript、目标 ESLint、全站 progress 与 i18n key、`git diff --check`：PASS。
- Next.js 16.3.1 直接生产构建：PASS；schema-3 静态边界为 99 个 Course 20 routes、13 个页面 JS/CSS、12,157 个 manifest-bound export files。
- Playwright：17/17，覆盖 assessment、receipt DAG、五维 12/15 rubric、local file SHA-256、跨页面进度一致性、reset、404、键盘/焦点、axe 与移动端 reflow。

此历史快照仅说明当时隔离工作树中的 Course 20 候选。2026-08-30 的授权只允许把最终技术候选固化为一个本地 commit，供上层任务按准确 SHA 转移；仍未授权 push、merge、Preview 或部署。全仓 `build:release` 在 Course 20 之前被 Course Codex 的 18 张真实 UI capture 门阻断，不能据此声称 aicourse.top 生产站已更新。
