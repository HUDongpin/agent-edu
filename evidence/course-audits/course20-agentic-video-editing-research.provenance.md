# 第 20 课来源与 provenance 登记 v2

- 核验日期：2026-08-28
- 课程版本：1.2.0
- 机器可读来源：`lib/agentic-video-editing/sources.ts`
- 机器可读 claim：`lib/agentic-video-editing/claims.ts`
- 公开 fixture 完整性：`public/courses/agentic-video-editing/fixtures.provenance.json`
- 公开媒体闭包：`public/courses/agentic-video-editing/lab/fixture-manifest.v1.json`

## 核验合同

- GitHub 记录必须保存 40 位 resolved commit 或明确的 cutoff snapshot；release/tag 只是可读版本锚点。代码许可证不自动覆盖模型、媒体、字体、provider、账户或输出。
- X 只接受直接 status URL 与官方 `publish.x.com/oembed`；截断即披露，不用搜索摘要、镜像或媒体补齐，也不把 field signal 当作 benchmark、标准或性能证明。
- 官方标准、官方文档、法律/监管材料、repository issue 与 dated live web 分开登记。
- `support=direct` 只允许来源直接支持的狭窄主张；工程组合标为 `derived`；保守停止规则标为 `course-policy`。
- 法律和监管材料必须保存 jurisdiction、适用边界与“非法律意见”说明。
- 所有第三方材料只链接和改写，不复制上游代码、长段文档、帖子媒体或学习者素材。

## 来源总数与用途

| Kind | 数量 | Stable IDs | 允许证明 | 禁止外推 |
|---|---:|---|---|---|
| `github-repository` | 20 | `video-use`, `ffmpeg`, `remotion`, `remotion-skills`, `opentimelineio`, `whisper`, `whisperx`, `pyscenedetect`, `qwen3-vl`, `vmaf`, `auto-editor`, `videodb-director`, `montaj`, `timeline-studio`, `qcut`, `velorn`, `veac`, `video-edit-cli`, `davinci-resolve-mcp`, `mosaic-skills` | 固定版本中的实现、接口、文档与许可证边界 | 质量、节时、安全、无障碍、权利或课程完整性 |
| `x-post` | 5 | `x-video-use-release`, `x-remotion-skills`, `x-davinci-mcp`, `x-creator-workflow-guide`, `x-mosaic-slack` | 具名作者在具名日期的可见 field signal | benchmark、可靠性、成本、清权或无人审批发布 |
| `official-standard` | 5 | `model-context-protocol-spec`, `wcag-2-2-captions`, `itu-bs-1770`, `ebu-r128`, `c2pa-spec` | 指定版本与范围的协议、无障碍、测量、推荐或 provenance 机制 | 宿主安全、全球统一交付值、事实真伪、权利、同意或法律结论 |
| `official-documentation` | 9 | `ffprobe-docs`, `opentimelineio-docs`, `w3c-media-planning`, `w3c-visual-description`, `aces-docs`, `owasp-prompt-injection`, `owasp-excessive-agency`, `bbc-editorial-accuracy`, `adobe-j-l-cuts` | 具名工具、实践或安全/编辑边界 | 跨版本、跨目的地、跨法域保证 |
| `law-regulation` | 1 | `eu-ai-act-article-50` | EU Regulation 2024/1689 Article 50 的文本、范围与例外 | 全球规则或对学习者具体事实的法律意见 |
| `regulatory-guidance` | 1 | `usco-ai-study` | 美国版权局 AI study 的美国法域分析 | 其他法域、自动版权结论或法律代理意见 |
| `dated-repository-issue` | 1 | `qwen3-vl-issue-1761` | 记录日可见的用户报告与状态 | 维护者确认、普遍发生率或固定产品缺陷 |
| `dated-official-web` | 1 | `mosaic-service-observation` | 记录日可见的 API/legal 页面 | 永久价格、条款、数据处理或发布权限 |

总计 43 条；20 GitHub + 5 X 保持 field/implementation ledger，但不再充当“25 条即可证明课程完整”的配额。

## 权威主张锚点

- [W3C Media Accessibility Planning](https://www.w3.org/WAI/media/av/planning/)；[WCAG 2.2 prerecorded captions](https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html)；[W3C visual description](https://www.w3.org/WAI/media/av/description/)。
- [ITU-R BS.1770](https://www.itu.int/rec/R-REC-BS.1770) 与 [EBU R 128](https://tech.ebu.ch/publications/r128)：算法/推荐与具体 destination target 分开。
- [ACES documentation](https://docs.acescentral.com/)：color-management 概念与变换边界。
- [ffprobe documentation](https://ffmpeg.org/ffprobe.html)：媒体观察与机器可读输出，不证明编辑语义或发布资格。
- [OpenTimelineIO timeline structure](https://opentimelineio.readthedocs.io/en/latest/tutorials/otio-timeline-structure.html)：interchange 结构；OTIO 不是 renderer，也不自动验证媒体范围。
- [MCP 2025-11-25 specification](https://modelcontextprotocol.io/specification/2025-11-25)：tool schema/result、authorization scope/audience 与 human-in-the-loop 建议；annotation、description 与 result 仍作为不可信输入。
- [OWASP Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) 与 [Excessive Agency](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/)：indirect injection、最小功能/权限/自治边界。
- [C2PA 2.4](https://spec.c2pa.org/specifications/specifications/2.4/specs/C2PA_Specification.html)：tamper-evident provenance；不是 truth、rights、consent 或 lawful-use proof。
- [BBC Editorial Guidelines](https://downloads.bbc.co.uk/guidelines/editorialguidelines/pdfs/Editorial_Guidelines_in_full.pdf)：事实节目不得用 montage/juxtaposition 造成实质误导。
- [Adobe J/L cuts](https://helpx.adobe.com/premiere/desktop/edit-projects/trim-clips/perform-j-cuts-and-l-cuts.html)：vendor practice 中的 J/L-cut 术语与操作。
- [EUR-Lex Regulation (EU) 2024/1689](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689) 与 [U.S. Copyright Office AI initiative](https://www.copyright.gov/policy/artificial-intelligence/)：分别保留 EU/美国边界，课程不提供法律意见。

## Claim-level 非推断规则

24 条高风险 claim 的 release validation 至少执行以下反例：

- caption/accessibility standard 若只绑 FFmpeg source，失败；
- X field signal 若承担性能或完整性证明，失败；
- course policy 若没有标为 fail-closed policy，失败；
- jurisdiction-dependent guidance 若缺法域或非法律意见边界，失败；
- C2PA 若被写成 truth/rights/consent proof，失败；
- ITU/EBU 若被写成所有社交平台统一 loudness target，失败。

每一 section 引用稳定 `claimIds`；不存在的 source/claim、未被 section 使用的高风险 claim、中英 claim 身份漂移均由 gate 阻断。

## 原创媒体 provenance

Course 20 lab 的视觉与音频仅由项目代码生成：几何图形、像素文字、时间码、安全区、运动标记、1 kHz test tone 与静音。公开 fixture 不含人物、个人数据、第三方媒体、声音表演、音乐或模型输出。

`frozen-media-receipt.v1.json` 保存 generator/renderer/source-recipe hash、FFmpeg reference environment、媒体 hash/byteLength/probe observations、跨版本可复现性边界与 `do-not-publish` 决定。`fixture-manifest.v1.json` 对通用 v3 schema、fixture overlay、VTT、项目规格、failure ledger、frozen receipt 与 MP4 做嵌套完整性闭包；manifest 不 self-hash。

SHA-256 只证明字节等同于已登记快照，不证明事实、质量、权利、同意、无障碍、法律合规或发布批准。

学习者 capstone 只能引用自己有权使用的本地媒体，以 path/hash/reference 与 self-attestation 表示；网站不上传、托管或取得该媒体的权限。
