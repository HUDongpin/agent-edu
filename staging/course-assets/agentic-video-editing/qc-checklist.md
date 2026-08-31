# Course 20 candidate review checklist / 课程 20 候选成片审校清单

This is an original, offline teaching fixture for a fictional edit. It is a review aid, not an automated quality score and not publication authority. Complete it against one frozen, hash-identified candidate render and one frozen, hash-identified review packet. Record the final human decision in the separate `release-decision.json`. A well-supported **do not publish / 不发布** decision is a valid outcome.

这是用于虚构剪辑的原创离线教学 fixture。它是审校辅助，不是自动质量分，也不构成发布授权。必须针对一个冻结且由 hash 标识的候选成片与一个冻结且由 hash 标识的审校包填写；最终人工决定另行写入 `release-decision.json`。证据充分的 **不发布 / do not publish** 是有效结果。

## Review identity / 审校身份

- Candidate render SHA-256 / 候选成片 SHA-256：`<64 lowercase hex characters / 64 位小写十六进制>`
- Edit-plan SHA-256 / 剪辑计划 SHA-256：`<64 lowercase hex characters / 64 位小写十六进制>`
- Review-packet SHA-256 / 审校包 SHA-256：`<64 lowercase hex characters / 64 位小写十六进制>`
- Source manifest SHA-256 / 素材清单 SHA-256：`<64 lowercase hex characters / 64 位小写十六进制>`
- Delivery contract SHA-256 / 交付合同 SHA-256：`<64 lowercase hex characters / 64 位小写十六进制>`
- Plan approval record SHA-256 / 计划批准记录 SHA-256：`<64 lowercase hex characters / 64 位小写十六进制>`
- Named human reviewer / 具名人类审校者：`________________________________`
- Review time and time zone / 审校时间与时区：`________________________________`
- Tool and model versions / 工具与模型版本：`________________________________`

Hash the exact frozen UTF-8 bytes of `edit-plan.v3.json`; `plan-approval.json` lives outside that byte domain and binds only that plan hash. Freeze and hash the candidate and review packet before creating `release-decision.json`, and exclude the release record from every object it binds. If any bound hash, destination, warning, rights/privacy decision, or tool schema changes, prior approval is stale. The agent may prepare evidence but may not fill the named-human decision or approve its own work.

对已冻结 `edit-plan.v3.json` 的准确 UTF-8 字节计算 hash；`plan-approval.json` 位于该字节域之外，且只绑定该计划 hash。先冻结并 hash 候选成片与审校包，再创建 `release-decision.json`；发布记录不得计入它所绑定的任何对象。任何绑定 hash、目的地、警告、权利/隐私决定或工具 schema 变化都会使旧批准失效。智能体可以准备证据，但不得代填具名人类决定，也不得自我批准。

## A. Intake, rights, and privacy / 入库、权利与隐私

- [ ] Every used media ID resolves to the reviewed manifest and exact source SHA-256. / 每个已用媒体 ID 均对应已审清单及准确的源文件 SHA-256。
- [ ] The owner, acquisition path, allowed use, territory, term, attribution, and license evidence are recorded. / 已记录所有者、取得路径、允许用途、地域、期限、署名与许可证证据。
- [ ] Appearance, voice, location, personal data, minors, confidential material, logos, archives, music, fonts, and stock assets have explicit decisions. / 对肖像、声音、地点、个人信息、未成年人、机密内容、标志、档案、音乐、字体与素材库资产均有明确决定。
- [ ] Consent and privacy decisions cover this edit and its intended channel; transcript access does not stand in for consent. / 同意与隐私决定覆盖本次剪辑及预定渠道；可访问转录文本不能替代同意。
- [ ] No unknown, expired, disputed, or out-of-scope item appears in the candidate. / 候选成片不含权利未知、过期、有争议或超出授权范围的项目。
- [ ] Cloud upload, external model calls, and service providers—if any—were separately approved and logged. / 如使用云端上传、外部模型或服务提供商，已单独批准并记录。

**Blocker:** any missing or conflicting rights/privacy evidence means `blocked`; a model inference, repository license, or X post is not a media-use grant.

**阻断条件：** 任一权利或隐私证据缺失/冲突均判定 `blocked`；模型推断、仓库许可证或 X 帖子都不是媒体使用授权。

## B. Source integrity and edit-plan conformance / 源完整性与计划一致性

- [ ] Source roots stayed read-only; no original was overwritten, renamed, moved, or deleted. / 源目录保持只读；没有覆盖、改名、移动或删除原件。
- [ ] Every input declares either conformed-CFR with rational source/proxy rates and three conform hashes, or native-VFR with stream timebase, first/last PTS, and timestamp-map hash. / 每个输入均声明 conformed-CFR（源/代理有理数 rate 与三个 conform hashes）或 native-VFR（stream timebase、首末 PTS 与 timestamp-map hash）。
- [ ] Input hashes, probe/conform receipts, rate/timebase, PTS, rotation, color metadata, channels, and duration match the approved manifest; unsupported native-VFR remained blocked. / 输入摘要、probe/conform 回执、rate/timebase、PTS、旋转、色彩元数据、声道与时长均匹配已批准清单；不受支持的 native-VFR 始终保持阻断。
- [ ] Every executed operation has a stable operation ID, source media ID, rate-aware source range, independent timeline range, reason, evidence reference, confidence, ambiguity state, and human-review state. / 每个已执行操作均有稳定 operation ID、source media ID、带 rate 的 source range、独立 timeline range、理由、证据引用、置信度、歧义状态与人审状态。
- [ ] Exact rational rescaling proves source and timeline durations agree; no validator copied or summed nominal source frame counts as timeline frames. / 已用精确有理数换算证明 source 与 timeline duration 一致；validator 未把 nominal source frame counts 未经换算直接复制或累加成 timeline frames。
- [ ] The dry-run diff was reviewed before rendering, and the executed plan hash equals the approved plan hash. / 渲染前已审 dry-run 差异，实际执行计划摘要等于已批准计划摘要。
- [ ] Outputs, caches, logs, and intermediates were written only under the declared separate edit directory. / 输出、缓存、日志与中间文件只写入声明的独立 edit 目录。
- [ ] Retries are idempotent or recorded as new operations; no ambiguous tool response caused an unreviewed duplicate effect. / 重试具备幂等性或记为新操作；工具响应不明确时没有产生未经审查的重复效果。

## C. Technical playback / 技术播放

- [ ] Container, codec, resolution, pixel aspect ratio, frame rate, duration, sample rate, channels, loudness target, and subtitle tracks match the delivery contract. / 容器、编码、分辨率、像素宽高比、帧率、时长、采样率、声道、响度目标与字幕轨均符合交付合同。
- [ ] Start, end, every cut boundary, transition, freeze, speed change, title, caption, and audio edit were inspected—not merely spot-checked by a metric. / 已检查开头、结尾、每个切点、转场、定格、变速、标题、字幕与音频编辑，而非只看指标抽样。
- [ ] There are no unintended black frames, repeated frames, dropped frames, flash frames, offline media, missing fonts, corrupt frames, clipped peaks, phase problems, discontinuities, or sync drift. / 不存在非预期黑帧、重复/丢失/闪烁帧、离线素材、字体缺失、坏帧、削波峰值、相位问题、音频断裂或同步漂移。
- [ ] Quality metrics, if used, compare aligned versions of the same content and are not presented as narrative or accessibility judgments. / 如使用质量指标，只比较同一内容的对齐版本，且不把指标说成叙事或无障碍判断。
- [ ] A complete playback was performed on the delivery candidate, not only on a proxy or timeline preview. / 已完整播放交付候选成片，而不只查看代理文件或时间线预览。

## D. Meaning, chronology, and human editorial review / 含义、时序与人类剪辑审查

- [ ] Names, numbers, dates, negations, qualifications, safety instructions, quotations, speaker attribution, and chronology match the source evidence. / 人名、数字、日期、否定、限定、安全说明、引语、说话人归属与时序均匹配源证据。
- [ ] No cut creates a sentence, reaction, causality, endorsement, testimony, event, or emotion that the source does not support. / 没有通过切剪制造源证据不支持的句子、反应、因果、背书、证词、事件或情绪。
- [ ] Transcript, shot detection, visual-language labels, and confidence values were treated as hypotheses and checked against the media. / 转录、镜头检测、视觉语言标签与置信度均作为候选假设，并已对照媒体复核。
- [ ] Silence, pauses, breaths, overlap, room tone, and continuity remain intentional; automated threshold cuts did not damage meaning or rhythm. / 沉默、停顿、呼吸、重叠语音、环境底噪与连续性均属有意；自动阈值剪切未破坏含义或节奏。
- [ ] Every unresolved editorial ambiguity is visible in the review packet and blocks release. / 每个未解决的剪辑歧义均在审校包中可见并阻断发布。

## E. Captions, audio, and accessibility / 字幕、音频与无障碍

- [ ] Captions were human-reviewed word by word for wording, punctuation, names, numbers, negation, speaker labels, and meaningful sound cues. / 字幕已逐词人工复核措辞、标点、人名、数字、否定、说话人标签与关键声音提示。
- [ ] Caption timing, reading speed, line breaks, safe areas, contrast, overlap, and shot changes were checked at delivery size. / 已在交付尺寸检查字幕时间、阅读速度、断行、安全区、对比度、重叠与镜头切换。
- [ ] Dialogue remains intelligible and synchronized; music and effects do not conceal meaning or safety information. / 对白清晰同步；音乐与音效不遮蔽含义或安全信息。
- [ ] Essential information is not conveyed by color, audio, flashing, or tiny text alone; applicable audio-description needs have a recorded decision. / 关键信息不只依赖颜色、声音、闪烁或微小文字；对适用的音频描述需求已有记录决定。
- [ ] Caption and audio deliverables were checked after the final encode, not assumed from the timeline state. / 字幕与音频交付物在最终编码后复核，而非根据时间线状态推定。

## F. Reproducibility, security, and delivery / 可复现性、安全与交付

- [ ] The packet records source manifest, brief, transcript/index, plan, dry-run diff, commands/tool receipts, tool/model versions, render log, QC findings, and all relevant SHA-256 values. / 审校包记录素材清单、brief、转录/索引、计划、dry-run 差异、命令/工具回执、工具/模型版本、渲染日志、QC 发现及相关 SHA-256。
- [ ] Credentials, tokens, absolute workstation paths, private URLs, personal data, and unnecessary media are absent from logs and deliverables. / 日志与交付物不含凭据、令牌、工作站绝对路径、私有 URL、个人信息或非必要媒体。
- [ ] Tool calls stayed inside the approved filesystem, network, account, model, cost, and publication authority. / 工具调用未超出批准的文件系统、网络、账号、模型、成本与发布权限。
- [ ] Transcript, OCR, captions, metadata, filenames, web pages, MCP descriptions, and tool results were treated as untrusted data; embedded instructions did not alter the commission or permissions. / 转录、OCR、字幕、metadata、文件名、网页、MCP 描述与工具结果均按不可信数据处理；嵌入其中的指令未改变原始委托或权限。
- [ ] MCP publisher, server identity, version, tool name/description, and input/output schema hashes match the approved policy; shadowing, schema drift, or invalid tool output failed closed. / MCP publisher、server identity、version、tool name/description 与 input/output schema hashes 均匹配已批政策；同名工具遮蔽、schema 漂移或非法工具结果均 fail closed。
- [ ] The exact final candidate, captions, attribution, thumbnail, description, and destination settings were reviewed together. / 已共同审查准确的最终成片、字幕、署名、缩略图、说明与目的地设置。
- [ ] A rollback/withdrawal owner and retention/deletion decision are recorded. / 已记录回滚/撤回负责人及保留/删除决定。

## G. Named human release recommendation / 具名人类发布建议

Choose exactly one and explain it. An assessment pass, successful render, green metric, agent recommendation, or completed checklist does not waive a blocker.

For `course20-synthetic-practicum-v2`, `approve-release` is prohibited and only `do-not-publish` can close the exercise. A separate learner-controlled production-sandbox project may reach human release review only after all destination-specific gates are rerun with zero unresolved critical blockers.

只能选择一个并说明理由。测验通过、渲染成功、指标变绿、智能体建议或清单完成都不能豁免阻断项。

对 `course20-synthetic-practicum-v2`，`approve-release` 被禁止，只有 `do-not-publish` 可以闭合练习。学习者自有媒体的独立 production-sandbox 项目，只有在针对真实目的地重跑全部门禁且未解决关键 blocker 为零后，才能进入人工发布复核。

- [ ] **do-not-publish / 不发布** — evidence supports withholding the exact candidate; unresolved items or rationale / 证据支持不发布该准确候选成片；未解决事项或理由：`________________________________`
- [ ] **approve-release / 批准发布** — the named human accepts the exact candidate and recorded residual risk for the declared destination only. / 具名人类仅针对所声明的发布目的地，接受该准确候选成片及已记录的剩余风险。

Copy this choice, the exact candidate/review/destination hashes, QC findings, rights/privacy decisions, warnings, reviewer identity, timestamp, and residual risk into `release-decision.json`. This checklist alone is not the release record.

把此选择、准确的 candidate/review/destination hashes、QC 发现、权利/隐私决定、警告、审校者身份、时间戳与剩余风险写入 `release-decision.json`。本清单本身不是发布决定记录。

Named human signature / 具名人类签署：`________________________________`

Decision timestamp / 决定时间：`________________________________`

Residual-risk statement / 剩余风险说明：`________________________________`
