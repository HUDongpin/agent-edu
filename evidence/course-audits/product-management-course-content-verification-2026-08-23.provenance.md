# Course 14 内容核验来源与过程记录

**核验日期：** 2026-08-23<br>
**证据快照时区：** Asia/Taipei<br>
**目标：** 发现并修正课程中的可确认事实错误、框架误归属、过度推断、版本过期、source-to-claim mismatch、测验完整性问题与实现不一致<br>
**访问边界：** 仅使用公开网页、公开文档、公开仓库与本地工作区；未使用登录态、付费墙内容、凭据、cookie、token、signed URL、私有仓库或个人数据

## 一、审查对象

- lib/product-management/copy/en.ts：14 模块长篇正文、practice、checkpoint、final assessment 与 capstone
- lib/product-management/sources.ts：来源标题、发布者、URL、访问日期、类型、supports 与 boundary
- lib/product-management/manifest.ts：模块—来源—概念域映射
- lib/product-management/types.ts 与 validate.ts：结构与可执行校验约束
- components/product-management/CourseDashboard.tsx 与 Interactions.tsx：结业测验数据流与 RICE 计算器
- evidence/course-audits/product-management-ai-course-research-brief.md 及其 provenance：原始研究主张与版本状态

## 二、方法

1. 对 14 个模块逐段抽取定义、公式、因果或效力主张、来源 ID、checkpoint、practice artifact 与 capstone 承诺。
2. 将传统产品管理概念与其直接来源核对，包括 Scrum、Rumelt strategy kernel、OKR、HEART、RICE、WSJF、MoSCoW、Kanban、AARRR、PLG、growth loops 与 Product Ops。
3. 将 AI 产品主张与当前官方或一手来源核对，包括 RAG、fine-tuning、workflow/agent、evaluation suite、retrieval/generation/agent evaluation、coding-agent containment、OWASP 2025、NIST AI RMF/GenAI Profile、持续评测、drift、rollback 与 EU AI Act。
4. 将来源用途与 source boundary 分开审查：来源能够支持什么、不能支持什么、是否只是公司实践或 vendor guidance。
5. 对 14 道 checkpoint 与新结业测验进行唯一最佳答案、correctIndex、解释一致性、题干重复与因果表述审查。
6. 运行 Course 14 专项 validator、release gate、scoped ESLint 与 Next.js production build。

## 三、并行审查角色

- 课程内部一致性审查：模块顺序、总时长、artifact/practice/capstone 闭环、RICE UI、checkpoint 与 final assessment。
- 传统产品管理来源审查：M1–M9、M13–M14 的定义、归属、source-to-claim mapping 与证据边界。
- AI 产品与治理来源审查：M10–M12 的架构、评测、编码代理、安全、风险、持续运营与法规当前性。
- 主审整合：逐项核对原文件、决定是否修订、实施变更并执行发布验证。

子审查均为只读；所有实际文件修改由主审完成。

## 四、关键一手或官方来源

### 产品角色、战略与研究

- PMaker English：https://pmaker.space/en/
- Scrum Guide：https://scrumguides.org/scrum-guide.html
- Atlassian DACI：https://www.atlassian.com/team-playbook/plays/daci
- Rumelt strategy kernel：https://www.mckinsey.com/capabilities/strategy-and-corporate-finance/our-insights/the-perils-of-bad-strategy
- GOV.UK consent：https://www.gov.uk/service-manual/user-research/getting-users-consent-for-research
- GOV.UK participant privacy：https://www.gov.uk/service-manual/user-research/managing-user-research-data-participant-privacy

### 指标、优先级与实验

- Google HEART：https://research.google/pubs/measuring-the-user-experience-on-a-large-scale-user-centered-metrics-for-web-applications/
- Google funnel exploration：https://support.google.com/analytics/answer/9327974?hl=en
- Google cohort exploration：https://support.google.com/analytics/answer/9670133?hl=en
- Intercom RICE：https://www.intercom.com/blog/rice-simple-prioritization-for-product-managers/
- SAFe WSJF：https://framework.scaledagile.com/wsjf/
- Agile Business MoSCoW：https://www.agilebusiness.org/resource/what-is-moscow-prioritization/
- Microsoft during-experiment patterns：https://www.microsoft.com/en-us/research/articles/patterns-of-trustworthy-experimentation-during-experiment-stage/

### 交付与 AI 系统

- Kanban Guide：https://kanbanguides.org/the-kanban-guide/
- GitHub Actions：https://docs.github.com/en/actions/get-started/understand-github-actions
- Google SRE canary：https://sre.google/workbook/canarying-releases/
- GitHub coding-agent risks：https://docs.github.com/en/copilot/concepts/agents/cloud-agent/risks-and-mitigations
- Microsoft Foundry RAG：https://learn.microsoft.com/en-us/azure/foundry/concepts/retrieval-augmented-generation
- OpenAI evaluation best practices：https://developers.openai.com/api/docs/guides/evaluation-best-practices
- Anthropic agent evals：https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
- Google Cloud AI operations：https://docs.cloud.google.com/architecture/deploy-operate-generative-ai-applications

### 安全、风险与法律

- OWASP 2025 Top 10：https://genai.owasp.org/llm-top-10/
- OWASP LLM01 Prompt Injection：https://genai.owasp.org/llmrisk/llm01-prompt-injection/
- OWASP LLM06 Excessive Agency：https://genai.owasp.org/llmrisk/llm062025-excessive-agency/
- NIST AI RMF 1.0：https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf
- NIST AI 600-1：https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf
- EU AI Act original authentic act：https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex%3A32024R1689
- EU AI Act consolidated view 2026-07-27：https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02024R1689-20260727

## 五、当前性与版本处理

- PMaker：所有保留的 source URL 使用英文 /en/ 路由；页面仍可能包含局部未完全英文化内容，因此课程采用独立英文释义，不声称逐页完整翻译。
- OpenAI：evaluation methodology 与 legacy Evals platform 生命周期分开处理。停用日期来自官方 deprecations 页面；课程不依赖将关闭的 dashboard/API。
- OWASP：固定为 2025 taxonomy；不将旧版编号混入当前清单。
- NIST：AI RMF 1.0 与 GenAI Profile 是两份不同文献；AI RMF 1.0 的修订状态写入 source boundary。
- EU AI Act：原始 authentic act 与 consolidated documentation view 同时保留；后者不被描述为独立具有法律效力的文本。

## 六、版权与引用边界

- PMaker 是指定的主要 orientation source，但未在本轮发现可支持整站复制的开放许可。课程只链接并以原创语言概括，不复制页面布局、图片、长段落、完整 prompt set 或 worked example。
- GitHub、GitLab、Google PAIR、W3C 与 OWASP 等材料各自保留其许可条件；某个 repository 的许可不自动覆盖其所有外链框架。
- Vendor 或公司 handbook 只支持其公开描述的具体方法或组织实践，不被提升为跨组织普遍有效的实证结论。
- 法律内容只用于识别审查边界，课程及本报告均不是法律意见。

## 七、可复现验证

- npm run product-management:check：通过
- npm run product-management:check:release：通过
- npx eslint lib/product-management components/product-management app/[locale]/product-management scripts/check-product-management-course.mjs：通过
- npx next build --debug-build-paths Course 14 routes：通过；完成编译、全项目 TypeScript 检查与 Course 14 的 137 个静态页面生成
- npx next build 最终全站复跑：TypeScript 阶段通过，随后被 Course 14 范围外的 Agent Orchestration 课程验证错误阻断；未为本任务修改该课程
- npm run lint：全仓库未通过；失败来自 Course 14 范围外既有文件。本轮没有为获得绿色状态而修改无关代码。

## 八、限制

- 此次核验是截至 2026-08-23 的公开来源快照，不会把动态网页、法规、平台 API 或行业实践冻结成永久事实。
- 静态来源审查不能证明课程的学习效果；需要未来的 learner testing、assessment validity、accessibility review 与教学数据评估。
- 产品管理概念覆盖聚焦数字产品与 AI-enabled software；特定行业必须增加领域专家和监管审查。
- 本轮没有使用受保护、授权不明或不可审计的材料来填补来源缺口。
