# Course 20 内容与发布前核验报告

> **历史快照说明（2026-08-28 更正）**：本文记录的是 2026-08-26 对 Course 20 v1.1.0 工作副本的本地验收，不能作为 v1.2.0 重构后的最终验收报告。该候选后来于 2026-08-27 提交为 `35ed70003b78b3f398058ee741a1d5c6f5694183`，并推送到 `origin/codex/course-20-agentic-video-editing`。本文当时使用的 `/private/tmp/aicourse-agentic-video-editing` 工作树现已不存在；本次 v1.2.0 复核运行于临时副本 `/private/tmp/course20-first-principles-final`，分支为 `codex/course-20-first-principles-fix`，尚未 commit、push、merge 或部署。临时路径不是永久可复现身份；应使用基线 commit、分支与 dirty diff。本文原有 PASS 只适用于旧 v1.1.0 范围。

- 课程：**如何使用智能体进行视频剪辑 / Agentic Video Editing: From Intent to a Verified Cut**
- 站点：`aicourse.top`
- 核验日期与研究截止日：**2026-08-26**
- 课程版本：**1.1.0**
- 工作分支：`codex/course-20-agentic-video-editing`
- 历史结论：**v1.1.0 当时的本地 Course 20 发布验收通过；随后已 commit 并 push 为 `35ed700`，但没有生产部署证据。**

## 1. 核验范围

本次核验同时覆盖五个互不替代的合同：

1. **内容合同**：4 阶段、10 模块、750 分钟、10 题终测、12 项 capstone artifact。
2. **来源合同**：20 个 GitHub source records 与 5 条 X posts 必须逐条闭合到模块主张；GitHub release tag 另存解析后的 40 位 commit，X 只以官方 oEmbed 可见文本为帖子正文证据。
3. **安全合同**：教学 fixture 不含真实媒体，不执行 FFmpeg、不访问网络、不覆盖源文件、不授权编辑、渲染或发布；计划批准与最终发布决定是计划外部、绑定准确 hash 的具名人类记录。
4. **产品合同**：英语与简体中文是人工审阅的长篇课程版本；其余 7 个 locale 提供明确披露的英语 fallback。课程在目录、SEO、sitemap、进度、reset、JSON-LD 与下载资源中闭合。
5. **发布合同**：离线 release gate、Draft 2020-12 schema 编译、TypeScript、ESLint、静态构建、产物 hash、Playwright 交互与依赖安全必须分别通过。

核验没有把以下事项纳入“已通过”：真实学习者媒体、真实素材权利、真实 NLE/MCP/云服务执行、任意模型输出质量、线上域名或 Vercel 部署。

## 2. 已纠正的主要错误与过强主张

| 区域 | 审计发现 | 修正 | 防回归措施 |
|---|---|---|---|
| GitHub 版本证据 | 仅写 release/tag 容易让读者误以为标签天然不可变 | 14 个 release-pinned records 同时保存 tag 与解析后的 40 位 commit；6 个 cutoff records 固定到 commit | checker 锁定 source ledger SHA、repo、stability、revision、resolved commit 与 license tuple |
| X 帖子证据 | 搜索摘要、线程形态、作者组织身份、附件内容和 `raw footage` 均可能超出 oEmbed | 只用 `publish.x.com/oembed`；截断状态可见披露；线程形态标为未独立建立；“raw footage”收窄为可见的 talk-to-camera workflow | checker 要求 5 个 status ID、作者、日期、完整性、核验方法、状态与仓库佐证范围完全闭合 |
| 许可证台账 | DaVinci Resolve MCP 与 Mosaic skills 已有 MIT LICENSE，但记录遗漏 | 补入固定 commit 的 LICENSE URL、`MIT` 与“不复制代码/媒体”的复用决定 | checker 要求已声明 license 必须有同一固定 ref 的 immutable LICENSE 证据 |
| VEAC 能力边界 | “项目明确不承诺完整 NLE 对等”比固定证据更强 | 改为“文档范围有限，证据不能建立完整 NLE 功能对等” | 来源对象保存中英文 support 与 non-inference boundary，source ledger hash 防漂移 |
| 工具分类 | 自动化、执行引擎、agent tool surface 与 agent architecture 容易混为一谈 | 单列 deterministic automation、execution engine、analysis component、agent architecture、agent tool surface；人类权限作为治理层 | manifest、UI 与 checker 锁定角色标签；读者界面使用本地化标签而非机器码 |
| 计划 schema | v1 将批准/发布/self-hash 混入计划；模板还暗示不存在的 rate/aspect 字段 | v2 仅描述 plan-local structure；批准与发布是冻结 bytes 后的外部 hash-bound records；aspect/output variant 属于 creative brief 或 delivery matrix | Ajv 8.20.0 strict Draft 2020-12 编译；正反实例验证；schema 顶层 `additionalProperties: false` |
| `fixtureId` 语义 | 所有 production plans 也被迫填写任意 `fixtureId` | `fixtureId` 仅 teaching-fixture 分支必填且固定；production 分支明确禁止 | teaching 缺 fixture 负例、production 无 fixture 正例、production 伪造 fixture 负例 |
| Cut Plan 时间语义 | 把 timebase 改成 60 fps，或无限扩大 tolerance，可能让实际不足 45 秒的计划通过 | 教学语义门锁定 30/1 timebase 与恰好 150 帧容差 | checker 加入 timebase 与 tolerance mutation regressions |
| Cut Plan fixture 身份 | 计划可伪造 input duration、source span 或 evidence locator | 锁定唯一 synthetic input、3660 帧、operation/source 区间与 fixture evidence locator | fixture duration、operation identity、evidence locator mutation regressions |
| Cut Plan 权利 | 原本 `unknown` 的 archive clip 可自报 `simulated-cleared` | operation 的 rightsState/ambiguity 必须与不可变 fixture definition 相符 | 专门构造 archive 自报清权反例；必须返回 `fixture-operation` blocker |
| 执行权限 | dry-run、offline、no-overwrite、stop flags 或 no-publish 可被削弱 | semantic validator 逐项 fail closed | 14+ mutation regressions 覆盖路径逃逸、发布、网络、覆盖、stop flags、人审、歧义、权利与时间线 |
| 具名人类 | fixture 只有四类 approval requirements，却被检查文案误称为“四个已具名批准” | 新增 4 个明确为 `null` 的 named approver assignments；任一未分配即 `block-and-request-assignment` | checker 验证四类要求、agent 不得自批、四个 null 槽位与 fail-closed 决策 |
| 终测状态 | 学习者曾通过后，本次失败仍可能在当前结果中看似通过 | 当前 attempt 独立显示失败；另行说明历史 passing record 仍保存 | Playwright 先通过、再故意答错 critical question，验证当前状态无 `data-passed=true` |
| 发布边界 | release checker 只查浏览器测试标题，或默认测试 `next dev`/外部旧站，都不能证明候选 static export | `build:release` 在构建与 static gate 后实际运行 `test:agentic-video-editing`；专用配置始终服务刚生成的 `out/`，无 SPA fallback，并忽略通用 `PLAYWRIGHT_BASE_URL` | checker 锁定命令、release 顺序、受管 server/config，且浏览器实测缺失路由为 404 |
| 依赖安全 | 初选 Ajv 8.17.1 在当前 audit 数据中有 `$data` ReDoS 中级公告 | 升级并 exact-pin `ajv@8.20.0` | `npm audit --audit-level=moderate` 为 0 vulnerabilities；release gate 锁定版本 |

## 3. 最终课程闭合结果

### 结构

- 4 个阶段：Define、Understand、Edit、Verify。
- 10 个独立模块：
  1. 创作意图与剪辑契约
  2. 素材入库、身份、权利与隐私
  3. 转录、镜头与证据索引
  4. 语义分析与导演判断
  5. 声明式 edit plan
  6. 受控、留有凭据的渲染
  7. Agent tool surfaces、MCP 与权限
  8. 字幕、音频、格式与多画幅交付
  9. 技术、语义、无障碍、权利与发布 QC
  10. 可恢复、由人批准的生产 capstone
- 总时长：750 分钟。
- 终测：10 题，80% 及格；3 题为 critical controls，任一答错均不能通过当前 attempt。
- Capstone：12 个互不重复的实质 artifact；本地完成记录不是证书、权利凭证或发布授权。

### 来源

- 20 个 GitHub records：14 个 release-pinned + resolved commit，6 个 commit-pinned-at-cutoff。
- 5 条 X records：均保留 direct status URL 与 official oEmbed URL；4 条明确标记 oEmbed truncated，仓库只佐证技术机制，不补写帖子缺失全文。
- 每条来源都有：用途角色、主张、限制、中英文边界、访问日期、复用决定；适用时另有 license 与固定 LICENSE URL。

### 公开原创学习文件

| 文件 | SHA-256 |
|---|---|
| `creative-brief.fixture.json` | `035bfd52b2a29392b88aaca357ca52510774094809d1598164203dfe6c209a27` |
| `media-manifest.fixture.json` | `659e289e57edceb5608c6c85843d5b38fa423dda20129bccfe71aa9ef462ffdb` |
| `edit-plan.schema.json` | `f1b4925382df750c80d77fcb392b3cde6cb4804138f5418ff4381d6c93b05dc2` |
| `qc-checklist.md` | `cbc78c4693e69173d32d53879046a310ce2a0715388e68120ed322d4b59f4088` |
| `NOTICE.md` | `75c3fecda32fc04fbde79e5221fd60038dd3c6042d74263193c0b8b3df22a830` |

`fixtures.provenance.json` 故意不自我 hash；它只绑定上表五个文件，避免 self-hash 悖论。所有 fixture 都是项目原创文本，不含第三方代码、第三方媒体、真实个人资料、私有输入或模型输出。

## 4. 最终验证证据

| 命令/门 | 结果 |
|---|---|
| `npm audit --audit-level=moderate` | PASS，0 vulnerabilities |
| `npm run agentic-video-editing:check:release` | PASS；4 phases、10 modules、750 minutes、20 GitHub、5 X、10 questions、12 capstone artifacts |
| Ajv 8.20.0 strict Draft 2020-12 compilation + instances | PASS；teaching 与 production 正例通过，额外字段、缺字段、错误 fixture/production identity 等负例被拒绝 |
| Cut Plan semantic mutation suite | PASS；时间、范围、证据、权利、歧义、人审、路径与执行策略反例均被阻断 |
| `npx tsc --noEmit` | PASS |
| targeted `npx eslint ...` | PASS，0 warnings/errors |
| `git diff --check` | PASS |
| `npx next build --webpack` | PASS；1,940/1,940 static pages；Course 20 生成 9 个 dashboard 与 90 个 module paths |
| `npm run agentic-video-editing:static-check` | PASS；6 个公开文件 byte-for-byte 进入 `out`；5 个学习文件 hash 全部匹配；无缺失、额外或 symlink |
| `npm run test:agentic-video-editing` | PASS，专用无 SPA fallback server 只服务刚生成的 `out/`；9/9 Chromium tests |

9 个浏览器场景覆盖：英/简中 dashboard、25 条来源与 6 个下载链接、全部 10 个模块、读者可读的来源标签与 X 截断披露、公开文件 hash、Course JSON-LD、缺失静态路由必须返回 404、Cut Plan 安全正例与 unknown-rights 负例、历史通过后当前失败、390px 移动端 label 与水平溢出。

## 5. 明确未声称的事项

- 没有真实视频、音频、字幕、个人资料或权利文件进入测试，因此 **没有验证真实成片质量或真实素材权利**。
- 没有调用 FFmpeg、Remotion、DaVinci Resolve、MCP、云 API、模型、外部账号或社交发布，因此 **没有验证任何第三方 runtime 的实时可用性、费用或产出质量**。
- GitHub/X 台账是 2026-08-26 截止快照；以后版本、许可证、API、帖子可用性与服务条款可能变化。
- 英语与简体中文是 reviewed long-form editions；其他 7 个 locale 是明确披露的英语 fallback，不应被称作完整翻译。
- 本报告完成当日尚未 commit/push；其候选随后已在 2026-08-27 commit 并 push 为 `35ed700`。截至 2026-08-28 仍没有 PR merge、Vercel 部署或 `aicourse.top` 生产探测证据；**本地发布验收或远程分支存在均不等于线上已发布。**
- 全仓库 `build:release` 已接入 Course 20 浏览器门，但本报告验证的是 Course 20 定向 gates、webpack production build、static output 与浏览器验收；不把其他课程或生产部署状态并入本结论。

## 6. 交付判断

在上述历史边界内，v1.1.0 候选当时达到可审计、本地可构建、可交互、可进入正式代码审查的状态。它后来被提交并推送，但本文不支持 v1.2.0、merge 或生产部署结论。后续修复与新验收见 `course20-post-commit-audit-2026-08-28.md`；任何真实媒体试运行仍需另设权利、隐私、执行沙箱、人工 QC 与具名发布决定。
