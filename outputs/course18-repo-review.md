# aicourse.top 第 18 门课程仓库审计与发布评审基线

> 课程主题：智能体赋能 K–12 与大学教学  
> 公开课程契约：`ai-teaching` / Course 18  
> 审计角色：deep-research reviewer；仅审计，不修改应用代码  
> 审计基线：`6c0dcd9b7e20f7f079f75dfb994671805559f8dd`  
> 最后复核日期：2026-08-26（Asia/Taipei）

## 0. 结论先行

1. **第 18 课可以安全接入，但必须走独立工作树。**目标工作树为 `/private/tmp/aicourse-agentic-teaching`，分支为 `codex/course-18-agentic-teaching`，基于 `6c0dcd9`。原始检出和两个相邻工作树均有用户或其他代理的未提交工作，不应拣选、覆盖或“顺手整理”。
2. **“现有 17 门课程”不是 17 门已发布课。**当前目录层共有 17 张课程卡：15 门 `available` 公开课程，加 2 门 `soon` 预告（`ai-research`、`responsible-ai`）。因此本分支将新课明确标为 **Course 18** 是产品序号决策，而不是从当前 `TOP_LEVEL_COURSES.length + 1` 自动计算出来的结果。
3. **唯一公开 ID 应为 `ai-teaching`。**该 ID 已存在于 `CatalogCourseId`、九个主消息表的 `c.aiTeaching.*`，并已有 `Cover.tsx` 的教学语义图形。公开路由应为 `/[locale]/ai-teaching/` 和 `/[locale]/ai-teaching/[module]/`。
4. **目录名也应统一为 `ai-teaching`。**现有全局 i18n 发布审计把 `lib/<目录>/types.ts` 的 `<目录>` 直接当作路由根和消息域。如果使用 `lib/agentic-teaching/` 却发布 `/ai-teaching/`，审计会把公开课误判为 staging，从而漏审。因此最小风险方案是 `lib/ai-teaching/`、`components/ai-teaching/`、`app/[locale]/ai-teaching/` 三者同名。若坚持内部目录 `agentic-teaching`，必须先改造并测试全局审计脚本，使其解析 `*_COURSE_ID`，这会扩大本分支范围。
5. **最佳复用不是复制一门课，而是组合两门课。**Course 13 `ai-tutor` 提供最接近的教学设计骨架；Course 15 `agent-orchestration` 提供最成熟的证据、双语、实验、进度、静态导出与发布门禁架构。
6. **当前仓库不是全局 release-green。**本次复核中 TypeScript、全局进度契约、消息键一致性、Course 13、Course 15、GitHub 等目标检查通过；但 Codex、Claude、Cursor 的既有媒体/权利发布门禁仍失败，因而 `npm run build` / `npm run build:release` 会在到达 `next build` 前被 fail-fast 阻断。第 18 课的局部绿灯不能被表述为整站已构建、已部署或已上线。
7. **“世界级”不是内容多，而是可证实、可迁移、可实践、可停止。**发布标准应同时覆盖学习目标、证据边界、K–12/高校双路径、可检查实验、评量有效性、教师最终权威、未成年人/隐私/公平、无障碍、国际化、静态导出与可复现门禁。

---

## 1. 审计范围、方法与事实等级

### 1.1 本报告检查了什么

- Git 分支、HEAD、上游关系、所有工作树与 dirty 状态；
- `lib/courses.ts` 的公开课程/目录卡/进度契约；
- 现有 Course 13 `ai-tutor`、Course 14 `product-management`、Course 15 `agent-orchestration` 的路由、manifest、copy、source、progress、checks 与测试结构；
- App Router 的 locale 布局、动态模块页、metadata、sitemap、静态导出；
- 九语言主消息表、长文课程 copy 的 reviewed/fallback 模式；
- `ae.progress` 进度键、课程 store、reset 与全局 progress ratchet；
- `package.json` 的 fail-closed 发布链、Vercel 输出契约、Playwright/ESLint/TypeScript/课程检查；
- 相邻课程路线图工作树对 Course 18 序号和共享文件造成的合并风险。

### 1.2 事实等级

- **已验证**：由当前基线文件、Git 状态或本次命令直接确认。
- **接入决策**：根据用户明确要求和仓库契约做出的本分支决策。
- **建议**：不改变公开契约、但可提高课程质量或可维护性的实现选择。
- **未证明**：尚未经过生产构建、真实浏览器、生产 URL 或人工权利/翻译审批的事项。

### 1.3 AGENTS.md / Next.js 16 本地文档遵循情况

隔离工作树没有 `node_modules`。审计因此从**同一依赖锁、同一 Git 基线的主检出**读取了仓库内 Next.js 16.3.1 文档，随后才判断路由、metadata 与静态导出接入点。已读的相关指南为：

- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-static-params.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/index.md`
- `node_modules/next/dist/docs/01-app/02-guides/static-exports.md`

对第 18 课的直接约束：

- 当前动态 route 的 `params` 是 Promise，应 `await params`；
- 静态导出的动态模块必须由 `generateStaticParams()` 完整枚举；
- 配合 `dynamicParams = false`，只有 manifest 中列出的模块可访问；
- `generateMetadata` 只能在 Server Component 使用；应复用 `seoFor` 生成 canonical、alternate/hreflang 与 OG，而不是在页面内散落重复规则；
- metadata 是浅层合并，嵌套 `openGraph` 等字段会被页面级对象替换，所以共享字段必须在 helper 中一次性生成；
- `output: "export"` 不支持未枚举的动态路径，也不能在 Server Component 中读取运行时请求；浏览器状态应留在 Client Component / effect 中。

---

## 2. 分支、工作树与 dirty 风险

### 2.1 目标工作树

| 项目 | 已验证状态 | 风险解释 |
|---|---|---|
| 路径 | `/private/tmp/aicourse-agentic-teaching` | 本课唯一允许写应用实现的隔离工作树 |
| 分支 | `codex/course-18-agentic-teaching` | 符合 `codex/` 前缀 |
| HEAD | `6c0dcd9b7e20f7f079f75dfb994671805559f8dd` | 与审计基线一致 |
| upstream | 未配置 | 完成前需明确 push/PR 目标；不能假设已与远端同步 |
| 审计开始 | clean | 隔离成功 |
| 最终增量复核 | `?? lib/ai-teaching/`、`?? components/ai-teaching/`、`?? outputs/course18-source-verification.md` | 并发实现与独立来源核验已开始；这些文件不是 reviewer 写入。中间态曾出现 `lib/agentic-teaching/`，经 reviewer 提醒后已统一为 `ai-teaching`，命名风险已解除 |

Reviewer 只新增本报告，不触碰上述应用目录。后续必须把 concurrent dirty 视为他人工作，不重置、不覆盖。

### 2.2 其他工作树

| 路径 / 分支 | HEAD | 状态与本课风险 |
|---|---:|---|
| `/Users/peter/Desktop/Agentic Engineering` / `codex/generate-the-second-course-how` | `6c0dcd9` | 当前有未跟踪 `lib/creator-ops/`；不能在此实现 Course 18 |
| `/private/tmp/agent-edu-release-hardening` / `codex/platform-release-hardening` | `8c801689` | 大量路由、catalog、progress、SEO、release、媒体与 CI 改动；与本课高重叠，不能机械合并 |
| `/private/tmp/aicourse-course-roadmap` / `codex/complete-course-roadmap` | `59bc9796` | dirty；正在增加 Course 16–21，修改 catalog/progress/SEO/i18n；对 Course 18 序号形成直接冲突 |
| `/Users/peter/Desktop/agent-edu-port` / `codex/progress-contract` | `4e0c5c28` | clean，但包含较新的 progress/reset 工作；未来合并需重跑本课进度契约 |

### 2.3 序号冲突的明确处置

相邻 roadmap 工作树把 “AI Python & Data” 暂定为 Course 18；该工作尚未合并且本身 dirty。依照用户这次的明确请求，本分支的决策是：

- `ai-teaching` 的 `displayNumber` 固定为 `18`；
- 不从数组位置自动派生课程编号；
- 未来合并 roadmap 时，“AI Python & Data” 必须顺延，或由产品负责人重新指定；
- 合并时重点人工解决 `lib/courses.ts`、`lib/seo.ts`、catalog、progress、九语言消息和发布脚本，不接受 `ours/theirs` 整文件覆盖。

---

## 3. 当前课程模型：17 张卡并不等于 17 门已发布课

### 3.1 `TOP_LEVEL_COURSES`

`lib/courses.ts` 当前定义 15 个 available 的顶层课程契约，`displayNumber` 类型只覆盖 `1 | ... | 15`。这个列表同时驱动：

- 全局课程进度与汇总；
- catalog 中“已发布”的可信来源；
-部分课程 release surface；
- reset/progress contract 的期望集合。

第 18 课上线时必须进入 `TOP_LEVEL_COURSES`，且扩展 ID 与 displayNumber 的字面量联合类型。只把卡片放进 catalog 会造成“看得到、进度/发布契约不认识”的半发布状态。

### 3.2 `CATALOG_COURSES`

当前共有 17 张卡：

| 卡片顺序 | ID | 显示编号 | 状态 |
|---:|---|---:|---|
| 1 | `agentic` | 1 | available |
| 2 | `codex` | 2 | available |
| 3 | `claude` | 3 | available |
| 4 | `cursor` | 4 | available |
| 5 | `grok` | 5 | available |
| 6 | `ai-research` | — | soon |
| 7 | `github` | 6 | available |
| 8 | `prompts` | 7 | available |
| 9 | `software-engineering` | 8 | available |
| 10 | `rag` | 9 | available |
| 11 | `mcp` | 10 | available |
| 12 | `make-money-with-codex` | 11 | available |
| 13 | `claude-income` | 12 | available |
| 14 | `ai-tutor` | 13 | available |
| 15 | `product-management` | 14 | available |
| 16 | `agent-orchestration` | 15 | available |
| 17 | `responsible-ai` | — | soon |

`CatalogCourseId` 已含尚未发布的 `ai-teaching`。九个 `messages/*.json` 也已有：

- `c.aiTeaching.title`
- `c.aiTeaching.blurb`
- `c.aiTeaching.level`

但当前没有 Course 18 的 catalog meta、公开顶层契约、路由、manifest、SEO/sitemap 或进度 store。因此“已有文案 key”不等于“已有课程”。

### 3.3 Course 18 的强制公开契约

| 字段 | 决策 |
|---|---|
| `id` | `ai-teaching` |
| `displayNumber` | `18` |
| overview | `/[locale]/ai-teaching/` |
| module | `/[locale]/ai-teaching/[module]/` |
| route param | `module` |
| 库目录 | `lib/ai-teaching/` |
| 组件目录 | `components/ai-teaching/` |
| public assets | `public/courses/ai-teaching/` |
| progress key | 经 `lib/progress.ts` 的 `PROG` 契约派生；不得新增散落硬编码 `ae.*` 键 |
| reviewed long-form locales | 首发至少 `en` 与 `zh-Hans` |
| fallback locales | `es`、`fr`、`de`、`zh-Hant`、`ja`、`ko`、`ar` 可路由到英文长文，但必须显式披露 fallback，不得伪装成已翻译 |

**命名硬门禁：**当前全局 `scripts/check-i18n-release.mjs` 用 `lib/<目录>` 推断 `app/[locale]/<目录>`。所以 `lib/agentic-teaching/` + `/ai-teaching/` 不是安全组合。优先改为全链路 `ai-teaching`；若保留内部目录别名，必须新增“COURSE_ID → route root”解析、回归测试与 fail-closed 断言。

### 3.4 目录与 manifest 契约

模块数量、slug、顺序、时长、阶段、来源、milestone、评量和进度分母必须由 manifest/type 单一来源驱动：

```text
AI_TEACHING_MODULE_SLUGS
        │
        ├── generateStaticParams()
        ├── manifest.modules
        ├── dashboard / previous-next navigation
        ├── progress strategy + completion denominator
        ├── JSON-LD hasPart
        ├── sitemap route count
        └── release checks / Playwright expected routes
```

禁止在 page、catalog、progress store、test 中各自维护一份模块清单。任何模块 slug 变更必须让所有派生检查同时失败或同时更新。

---

## 4. 最接近、最值得复用的课程

### 4.1 Course 13 `ai-tutor`：教学设计与教育边界模板

已验证结构：8 模块、4 阶段、总计 450 分钟、11 个来源、10 个 milestones，当前是英文长文课程。其主题覆盖：

- 学习目标与概念图；
- 诊断引擎；
- 适应性 scaffolding；
- 形成性评量回路；
- 题目验证；
- learner model；
- 学习影响实验；
- 安全与教师监督。

适合复用：

- “目标 → 证据 → 活动”对齐；
- 教育场景工作坊、checkpoint、capstone；
- 诊断、反馈、评量、教师监督的领域语言；
- overview / module page / progress / source manifest 的基本骨架。

不应复制：

- 把“AI tutor”直接等同于“教学智能体”；
- 只做一对一辅导，不处理备课、课堂编排、评量治理、学习支持与机构工作流；
- 沿用 English-only 的发布范围；
- 没有区分 K–12 与高校的同一套活动。

### 4.2 Course 15 `agent-orchestration`：工程与发布模板

已验证结构：15 模块、4 阶段、1060 分钟、67 条 source record、17 个 milestones；英文与简体中文长文 reviewed，其余 7 语言有明确英文 fallback。其 release 模式包含：

- source boundary、claim evidence URL、version/revision、rights/reuse 状态；
- manifest/load/validate/format 分层；
- deterministic lab truth table；
- progress、i18n、lab、static output 独立门禁；
- 课程 overview/module metadata 与 JSON-LD；
- 144 个静态路由组合、32 个 sitemap 项和 684 个 lab case 的机器核验。

适合复用：

- 双语 copy bundle 与 fallback disclosure；
- “来源支持什么 / 不支持什么”的数据模型；
- 不依赖真实 API key 的可重放实验；
- fail-closed release command；
- 静态导出审计、sitemap/SEO/progress 一致性。

不应复制：

- 把一般智能体编排术语换名后当作教学内容；
- 以来源数量作为质量替代指标；
- 过度工程化界面，压过教师的主要任务路径。

### 4.3 Course 14 `product-management`：证据密度参照，不是主模板

其 14 模块、910 分钟、102 条来源、16 个 milestones 展示了高密度 manifest 与证据组织能力。但主题距离课堂实施更远，不能作为唯一模板。

### 4.4 推荐组合

**Course 13 的教学/评量骨架 + Course 15 的证据/i18n/lab/release 架构**，再增加 Course 18 专属的双路径：

- K–12：年龄适切、家长/学校政策、未成年人数据、教师控制、课堂节奏、可及性；
- 高校：课程设计、助教/大班工作流、学术诚信、研究/实验室、LMS/机构治理；
- 共同底层：任务分解、工具授权、观察—计划—行动—验证循环、human-in-command、日志与停止条件。

---

## 5. 最安全的精确文件接入清单

下列清单是以当前基线的 Course 13 + Course 15 架构推导出的**最小完整发布面**。如果实现采用不同文件名，仍必须逐项覆盖同一职责。

### 5.1 必须新增：路由

- `app/[locale]/ai-teaching/page.tsx`
- `app/[locale]/ai-teaching/[module]/page.tsx`

两页必须是 Server Component 边界；模块页须导出 `dynamicParams = false` 和基于 canonical module slugs 的 `generateStaticParams()`。两页均须使用 `generateMetadata()` + `seoFor()`，并输出合法的 Course / LearningResource JSON-LD。

### 5.2 必须新增：课程数据与内容

- `lib/ai-teaching/types.ts`
- `lib/ai-teaching/manifest.ts`
- `lib/ai-teaching/sources.ts`
- `lib/ai-teaching/load.ts`
- `lib/ai-teaching/progress.ts`
- `lib/ai-teaching/validate.ts`
- `lib/ai-teaching/format.ts`
- `lib/ai-teaching/index.ts`
- `lib/ai-teaching/copy/en.ts`
- `lib/ai-teaching/copy/zh-Hans.ts`
- 推荐：`lib/ai-teaching/lab-model.ts`

强制数据属性：

- course ID、display number、module slugs、reviewed locale 常量；
- 每个模块有可观察 outcome、artifact、success criteria、预计时长、前置依赖；
- K–12 / higher-ed 适用性不能只写在 prose，应为机器可检查字段；
- 每个事实或行动建议能反向追到 source ID；
- 每个 source 有 supports、boundary、accessedOn、revision/version、rights/reuse 状态；
- manifest validation 在导入时 fail closed，不能把坏数据带到页面才报错。

### 5.3 必须新增：交互、可视化与进度

- `components/ai-teaching/AiTeachingCourse.module.css`
- `components/ai-teaching/CourseDashboard.tsx`
- `components/ai-teaching/ModuleView.tsx`
- `components/ai-teaching/Interactions.tsx`
- `components/ai-teaching/progress-store.ts`
- 推荐：`components/ai-teaching/TeachingAgentMap.tsx`

进度 store 应使用共享 progress helper/namespace，不直接复制 localStorage 键；读写失败和损坏 JSON 要 fail soft，reset 只能删除本课数据，不能清空其他课程进度。

### 5.4 必须新增：来源/权利与发布门禁

- `public/courses/ai-teaching/NOTICE.md`
- `scripts/check-ai-teaching-course.mjs`
- `scripts/check-ai-teaching-i18n.mjs`
- `scripts/check-ai-teaching-progress.mjs`
- 推荐：`scripts/check-ai-teaching-labs.mjs`
- 推荐：`scripts/check-ai-teaching-static.mjs`
- `tests/ai-teaching-course.spec.ts`

研究交付建议由研究角色新增并与实现来源清单交叉校验：

- `outputs/ai-teaching-course-research-brief.md`
- `outputs/ai-teaching-course-research-brief.provenance.md`

若课程提供可下载教学包、情景数据或 capstone fixture，还应放入 `public/courses/ai-teaching/`，并在 NOTICE/manifest 中记录许可、来源、SHA-256、是否 synthetic/deidentified。

### 5.5 必须修改：平台发布面

- `lib/courses.ts`
  - 加入 `ai-teaching` 顶层 available contract；
  - `displayNumber: 18`；
  - catalog card 引用现有 `c.aiTeaching.*`；
  - 进度策略与 manifest 模块数一致。
- `lib/seo.ts`
  - 把 overview 和 module path 纳入严格 `PAGES`/route helper 契约。
- `app/sitemap.ts`
  - 只发布 reviewed long-form locale 的课程 URL；fallback locale 不应被误标成完整本地化内容。
- `app/[locale]/courses/page.tsx`
  - 加载 Course 18、加入 `hasPart`、`courseCode`、`inLanguage` 与 canonical URL；
  - 现有多层条件表达式较脆弱，本分支宜做最小增量，不展开无关重构。
- `components/courses/Catalog.tsx`
  - 增加稳定 identity flag/anchor 与 Course 18 状态。
- `components/Shell.tsx`
  - footer/course navigation 增加公开链接。
- `components/progress-reset.ts`
  - 注册 Course 18 store reset；不得遗漏或全量清空。
- `messages/en.json`
- `messages/es.json`
- `messages/fr.json`
- `messages/de.json`
- `messages/zh-Hans.json`
- `messages/zh-Hant.json`
- `messages/ja.json`
- `messages/ko.json`
- `messages/ar.json`
  - 保持 key parity；新增 Course 18 meta/label/fallback disclosure 所需主界面 key；主消息翻译与长文 reviewed 状态分开管理。
- `package.json`
  - 新增 Course 18 的 dev/release/i18n/progress/lab/static/test commands；
  - 将 `ai-teaching:check:release` 接入 `build` 和 `build:release` 的 `next build` 之前；
  - 将 static audit 放在 `next build` 之后。
- `README.md`
  - 记录 Course 18、来源边界、首发 locale、验证命令与已知整站 blocker。

### 5.6 通常无需修改

- `components/courses/Cover.tsx`：当前已含 `ai-teaching` 语义 motif 和教学视觉样式；除非有明确视觉升级，不应为接入而改。
- `components/Progress.tsx`：从 `TOP_LEVEL_COURSES` 派生；顶层契约正确时应自动识别。
- `scripts/check-i18n-release.mjs`：只要目录、路由与 public ID 都统一为 `ai-teaching`，现有自动发现可工作。若保留 `lib/agentic-teaching`，则此文件必须修改并补回归测试。
- `next.config.ts`：现有 production static export、`trailingSlash`、image unoptimized 契约足够。
- `vercel.json`：现有 `buildCommand: npm run build:release` 与 `outputDirectory: out` 足够。
- `app/robots.ts`：新课不需要单独规则。

### 5.7 可选、不是 release-critical

- `app/[locale]/page.tsx`：只有确定把 Course 18 设为首页 featured 时才修改；catalog 已能承担发现入口。
- 新生成 hero/cover 位图：现有 Cover motif 足够，且新增位图会引入权利、优化与多语言文字风险。

### 5.8 当前并发实现的增量 reviewer 发现

最终快照时，`lib/ai-teaching/types.ts`、`lib/ai-teaching/progress.ts` 与 `components/ai-teaching/Interactions.tsx` 已开始生成，公开 ID、display number、目录和 reviewed locale 已对齐。以下是**最终合并前必须由代码或门禁证明已解决**的四项：

1. `FinalAssessment` 的通过线在中间快照中写死为 `score >= 10`，没有与题目数量绑定。应改为显式 pass percent / required-correct 常量，并由 validator 校验题数、阈值和 critical question 规则。
2. 中间快照的 module completion 只要求 checkpoint；ArtifactNotebook 可以保存空内容；capstone 仅靠 artifact checkbox 加 learner attestation 完成。若这些状态被表述为能力证明，属于自证完成。应检查 artifact 的非空、结构或语义增量，并让 capstone 产物经过 rubric/evidence gate；否则必须明确其只是本地自我追踪，不是认证。
3. 中间快照的 `AgenticTeachingSource` 还没有把 GitHub/X 的全部治理要求编码为 fail-closed schema：至少需要 `claimEvidenceUrls`、`reuseStatus/rightsDecision`；X 需要 status ID、作者身份/角色、thread/media context 与 corroborating source IDs。不能只把这些留在研究报告 prose。
4. 中间快照的 `AgenticTeachingModuleManifest` 没有逐模块 K–12 / higher-ed applicability 字段，tracks 只有 starting module，无法机器证明双路径不是标题并列。应增加可检查的 audiences/tracks、human-approval/no-go 或等价字段，并由 validator 覆盖。

这些发现不授权 reviewer 修改应用代码；它们应进入 Course 18 release gate 或在最终代码审查中逐项关闭。

---

## 6. GitHub 与 X：来源不是“链接清单”，而是可审计证据

用户把 GitHub repos 和 X posts 指定为关键来源。两者适合捕捉工程实践与一线经验，但证据地位不同。

### 6.1 GitHub source record 最低字段

- `owner/repo` 与仓库主页；
- 精确 commit SHA、tag/release 或不可变 permalink；
- 直接支持声明的文件/行锚点，而不是只有 repo 首页；
- `accessedOn`、release/version、最后复核规则；
- license 与课程允许的 reuse/transform 状态；
- `supports`：它直接支持哪一条课程主张；
- `boundary`：它不能证明什么；
- `claimEvidenceUrls`；
- 若运行代码：固定 fixture、依赖/运行环境、期望输出与失败模式。

证据边界：

- repo 可证明某实现/配置/示例在指定 revision 存在；
- repo star、fork、watch 数不能证明教学有效或安全；
- README 的营销表述不能代替代码、release note、官方文档或独立教育研究；
- tag/release URL 只证明版本锚点，除非其中有直接支撑主张的内容；
- “示例能跑”不等于“对 K–12/高校学习有因果效果”。

### 6.2 X source record 最低字段

- 精确 status URL 与 post ID；
- 作者身份、角色与与该主张相关的可信度；
- `postedAt`、`accessedOn`；
- 完整 thread/media 上下文，不做截句；
- 可支持的最窄主张；
- 明确 `boundary`；
- 对产品行为、效果、安全或普遍性的 corroborating source IDs；
- 引用/改写/截图/嵌入的 rights decision。

证据边界：

- X 可以证明“该作者在该时间公开报告/宣布/主张了 X”；
- X 单帖不能证明普遍性、因果效果、课堂安全或最佳实践；
- 点赞、转发、粉丝数不作质量证据；
- 产品功能要与官方文档、repo/release 或可重放观察相互验证；
- 教师案例必须标为 bounded case，而不是代表所有学校；
- 默认链接或短改写，不在未获许可时把截图、头像、媒体复制进课程。

### 6.3 课程内的 evidence ladder

建议每条可行动主张按以下层级选择证据：

1. 官方协议/政策/产品文档、不可变仓库代码或 release；
2. 同行评审研究、机构指南、标准；
3. 可复现实验或本课程固定 fixture；
4. 具名实践者的 bounded case / X thread；
5. 作者解释或推断，必须显式标记。

不要规定“每模块必须凑 N 个 GitHub + M 个 X”。正确门禁是：每个事实和行动建议都有合适等级的证据；每个适合技术锚定的模块至少有固定 revision；X 只有在提供真实实践语境时才使用。

---

## 7. 课程体验与技术接入的关键评审点

### 7.1 K–12 与高校必须是双路径，不是标题并列

每个核心模块至少应说明：

- 两个场景是否都适用；
- 行动主体是教师、学生、助教、课程负责人还是 IT/治理人员；
- 可委派给智能体的任务；
- 必须由人批准的决定；
- K–12 的年龄、家长/学校政策与未成年人数据边界；
- 高校的学术诚信、LMS、研究/助教和机构政策边界；
- 一个 stop/no-go 情景。

### 7.2 教学智能体的核心循环应可观察

至少能够让学习者检查：

```text
教学意图 → 上下文/政策 → 计划 → 工具授权 → 行动 → 观察
       ↑                                      ↓
       └──── 教师审阅 / 纠偏 / 停止 / 回滚 / 申诉 ────┘
```

“智能”不能只表现为生成文字。课程应教会学习者定义工具权限、证据、检查点、预算、停止条件、失败恢复和人工最终责任。

### 7.3 实验必须默认可重放

- 核心通关不依赖付费模型、真实学校账号或秘密 API key；
- 使用 synthetic/deidentified fixture；
- 固定输入、期望结构、评分规则和 failure case；
- 可选 live-AI extension 与核心 deterministic lab 分开；
- 浏览器端不暴露服务端密钥；
- 未成年人和真实学生数据不能成为演示输入。

### 7.4 评量不能只靠“我完成了”

- 每个 outcome 对应可检查 artifact；
- quiz 有情境题、明确 pass threshold 与关键安全题；
- milestone/checkpoint 有机器或人工 rubric；
- capstone 同时检查教学对齐、证据、权限、安全、观察性、停止/回滚；
- 能正确决定“不用智能体”应当是高分能力，而非失败。

---

## 8. 验证命令、当前结果与阻塞

### 8.1 本次已运行、已通过

由于隔离工作树未安装 `node_modules`，下列命令在**同一基线 `6c0dcd9`、同一 package lock 的主检出**运行；它们是基线验证，不是 Course 18 尚未完成时的验收结果。

| 命令 | 本次结果 | 证明范围 |
|---|---|---|
| `npx tsc --noEmit --incremental false --pretty false` | PASS | 当前基线 TypeScript |
| `npm run progress:check` | PASS | 30 adapters、15 events；每事件一个 dispatcher；14 course stores 均纳入 reset；硬编码 key ratchet 为 12 |
| `npm run i18n:check:keys` | PASS | 13 namespaces × 9 locales，无 missing/extra/empty；不等于人工翻译审批 |
| `npm run ai-tutor:check:release -- --json` | PASS | 最接近教育课程基线 |
| `npm run agent-orchestration:check:release -- --json` | PASS | Course 15 release/i18n/progress/lab 基线 |
| `npm run github:check:release -- --json` | PASS | 旧审计中的 GitHub blocker 已过时 |
| `npm run handbook:check` / `widgets:check` | PASS | 共享基础门禁 |
| Product Management、Make Money、Claude Income、Grok、RAG、MCP、Prompts、Software Engineering release checks | PASS | 对应课程局部门禁 |

Prompts 与 Software Engineering 检查最初在受限 sandbox 中因子进程 `tsx` 无法创建 Unix IPC socket 而报 `EPERM`；在获准的普通执行环境重跑后通过。该现象应分类为测试 harness / sandbox 限制，不是课程缺陷。

### 8.2 当前真实整站阻塞

| 门禁 | 本次结果 | 阻塞原因 |
|---|---|---|
| `npm run codex:check:release -- --json` | FAIL | 18 张图仍要求真实 Codex UI capture（01–12、18–21、23–24） |
| `npm run claude:check:release -- --json` | FAIL | 12 张 Academy-hosted 图缺发布许可；fig-01 真实性 provenance 未解决 |
| `npm run cursor:check:release -- --json` | FAIL | 14 张 first-party Cursor 图缺证据化 publication-rights determination；尚未 published |

因为 `package.json` 的 `build` 与 `build:release` 在 `next build` 前串行运行这些 fail-closed checks，当前整站生产构建会先被既有课程阻断。本次没有把局部检查提升为以下未证明结论：

- 未证明 `npm run build` 或 `npm run build:release` 通过；
- 未证明 `out/` 中存在 Course 18 的完整静态页面；
- 未证明 Vercel preview/production 已部署；
- 未证明生产 canonical、hreflang、sitemap、JSON-LD 与本地一致；
- 未证明七个 fallback locale 已人工翻译；
- 基线分支当前没有 `.github/workflows/ci.yml`，不能声称 CI 会自动守住这些门禁。

### 8.3 Course 18 完成后的建议验收顺序

在目标工作树先提供与 lock 一致的依赖，再依序运行：

```bash
npm run ai-teaching:check
npm run ai-teaching:i18n-check
npm run ai-teaching:progress-check
npm run ai-teaching:lab-check
npm run progress:check
npm run i18n:check:keys
npx tsc --noEmit --incremental false --pretty false
npx eslint 'app/[locale]/ai-teaching/**/*.tsx' components/ai-teaching lib/ai-teaching 'scripts/check-ai-teaching*.mjs' tests/ai-teaching-course.spec.ts --max-warnings 0
npx playwright test tests/ai-teaching-course.spec.ts --workers=1
npm run ai-teaching:check:release -- --json
git diff --check
```

其他整站 blocker 清零后：

```bash
npm run build:release
npm run ai-teaching:static-check
```

### 8.4 Course 18 release check 至少必须断言

- ID、Course 18 编号、title、slug、module count、duration 与 manifest 一致；
- overview + 所有模块的 `generateStaticParams` 路由组合完整，无多余 slug；
- en 与 zh-Hans 长文完整 reviewed；七语言 fallback 明示且不伪本地化；
- every claim → source ID → exact URL 可追踪；无 orphan source、无 dangling claim；
- GitHub revision/rights 和 X boundary/rights 字段完整；
-所有 K–12 / higher-ed 模块覆盖字段可评估；
- progress event 唯一、reset 安全、坏 JSON 隔离；
- labs deterministic；不需要 API key；fixture 无个人资料与秘密；
- keyboard、focus、390px、200% zoom、reduced motion、Arabic RTL shell、fallback banner；
- JSON-LD `Course` / `LearningResource`、`courseCode`、`inLanguage`、`hasPart`、canonical、hreflang 正确；
- static export 中 overview/全部模块存在，尾斜杠和 sitemap URL 一致；
- NOTICE/许可覆盖复制或改编的代码、图、帖子媒体与 fixture。

---

## 9. “世界级课程”评审量规

### 9.1 一票否决硬门禁

任何一项失败都不得公开标为 world-class / available：

1. 公开 ID、Course 18 编号、目录、路由、manifest、SEO/sitemap 或进度分母不一致；
2. 动态模块未完整静态枚举，或未知 slug 未 404；
3. 事实、产品行为或行动建议存在无法追踪的来源；
4. 把 X 个案、star/like/repost 或 README 宣传语提升为普遍效果证据；
5. GitHub revision、license/reuse 或 X media rights 未定却复制内容；
6. 核心实验要求真实学生数据、学校 secret、付费 API 或把 key 送到浏览器；
7. 缺教师/机构最终权威、暂停、覆盖、回滚、申诉和 no-go 路径；
8. 未成年人、隐私、公平、可及性或学术诚信没有场景化处理；
9. 高风险通关只靠 learner 自我勾选，没有 artifact/rubric/critical safety item；
10. en / zh-Hans 任一长文不完整，或 fallback 被伪装成已翻译；
11. progress reset 能误删其他课程，或损坏状态可导致页面崩溃；
12. Course 18 release、browser、static export 任一门禁失败。

### 9.2 100 分量规

| 维度 | 权重 | 世界级证据 | 典型扣分 |
|---|---:|---|---|
| 1. 学习对齐与受众清晰度 | 12 | 每模块有 observable outcome、artifact、success criteria；先修、时长、模块依赖清晰 | 目标只用“了解/掌握”；活动与评量脱节 |
| 2. 主张—证据—边界 | 15 | 每条主张可追溯；来源层级合适；supports/boundary 明确；时效可复核 | 链接堆砌、二手摘要代替一手证据、推断写成事实 |
| 3. GitHub / X 来源治理 | 10 | immutable revision、license、rights；X 全上下文、身份、corroboration、bounded case | repo 只链首页；用热度当质量；未经许可复制帖子媒体 |
| 4. K–12 / 高校迁移真实性 | 10 | 每个核心能力有两类真实场景、角色、政策与限制；明确共享与不可迁移部分 | 仅把 “K–12/大学” 写进标题或换一个案例名 |
| 5. 教学智能体工程深度 | 12 | 意图、上下文、工具权限、计划、行动、观察、验证、预算、停止/回滚可操作 | 课程退化为 prompt 模板或聊天机器人使用说明 |
| 6. 实践、实验与可交付物 | 10 | deterministic lab；固定 fixture；failure case；可检查 teaching artifact；live extension 可选 | 只能看演示；无期望输出；必须付费/联网才能完成 |
| 7. 评量有效性 | 10 | 情境题、critical safety items、合理阈值、milestone 与 capstone rubric；含 no-go 决策 | 只记忆术语；自评即通过；阈值与题目数算术不一致 |
| 8. 安全、隐私、公平与人类权威 | 10 | 年龄适切、数据最小化、bias/accessibility、诚信、教师 override/appeal、incident path | 抽象“请负责任使用”；没有未成年人或机构边界 |
| 9. UX、无障碍与国际化 | 6 | 清晰主路径、progressive disclosure、键盘/focus、390px、200% zoom、RTL、reduced motion、fallback disclosure | 长页面无导航；视觉层级压过任务；fallback 冒充翻译 |
| 10. 工程、SEO、发布与复现 | 5 | 类型、lint、browser、release、static、sitemap/JSON-LD、NOTICE 全通过；命令可复现 | 只在 dev server 可用；无 fail-closed gate；发布声明无证据 |
| **总分** | **100** |  |  |

判定：

- **90–100 且无硬门禁失败**：可标记 world-class / available；
- **80–89 且无硬门禁失败**：仅限 pilot / beta，列出改进项与复核日期；
- **70–79**：内部评审版，不公开；
- **<70 或任一硬门禁失败**：阻断发布。

### 9.3 Reviewer 逐模块抽查问题

每个模块至少回答：

1. 学习者完成后能提交什么证据？
2. 这个 artifact 的成功标准是谁制定、如何检查？
3. 哪个来源直接支持关键主张，来源不能证明什么？
4. 这条 GitHub/X 材料在什么 revision/日期仍有效？
5. K–12 与高校的角色、权限、政策哪里不同？
6. 什么情况下不应使用智能体？
7. 教师如何看见、暂停、纠偏、回滚或申诉？
8. 若模型失败、工具超权、证据冲突或学生数据出现，系统如何停止？
9. 不联网、不付费、不提供真实数据，核心练习还能完成吗？
10. 页面、进度、SEO、sitemap 和静态导出如何机器证明这一模块确实发布？

---

## 10. 推荐合并与发布策略

1. 在 `codex/course-18-agentic-teaching` 完成并验证 Course 18，不触碰其他 worktree。
2. 保持已经落实的 `ai-teaching` 全链路命名，不在后续合并中恢复内部目录别名，以免重新引入 auto-discovery 漏审风险。
3. 先提交课程自包含文件，再提交共享平台接入文件；便于审查 shared-surface 冲突。
4. 在 rebase/merge roadmap 或 release-hardening 前保存各门禁 JSON 输出与当前 HEAD。
5. 对共享文件逐段人工合并：`lib/courses.ts`、`lib/seo.ts`、`app/sitemap.ts`、catalog、progress/reset、messages、package scripts。
6. 合并后重跑 Course 18 门禁、全局 progress/i18n/type/lint/browser，再跑所有 public-course release gates。
7. 只有整站既有 Codex/Claude/Cursor blocker 解决、`build:release` 通过、`out/` 审计通过并验证实际部署 URL 后，才可说“已上线 aicourse.top”。

## 最终 reviewer 判定

**接入点：通过（有条件）。**`ai-teaching` / Course 18 与现有 catalog、消息 key、视觉 motif 和课程架构相容；隔离工作树避免了主要 dirty 风险。

**当前发布状态：未通过。**课程实现与研究证据尚在并发生成，目录命名已经统一；Course 18 的评量、来源 schema 与双路径机器契约仍需关闭上述增量发现，其自身门禁、浏览器、静态输出与生产验证尚未完成；整站还存在三个既有课程的媒体/权利 release blocker。

**达到 world-class 的最短路径：**以 `ai-tutor` 的教育骨架承载 K–12/高校双路径，以 `agent-orchestration` 的 source boundary、双语、deterministic lab、progress 与 fail-closed release 架构作为工程底座；对 GitHub 固定 revision，对 X 限定为可归属的实践者个案；把教师最终权威、未成年人数据、评量有效性和“不使用智能体”的判断写进可执行实验与一票否决门禁。
