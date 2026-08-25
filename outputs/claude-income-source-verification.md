# Course 12 source verification: How to make money with Claude

**Site:** aicourse.top  
**Course:** Course 12, “How to make money with Claude”  
**Verification snapshot:** 2026-08-23, Asia/Taipei  
**Audit posture:** fail closed  
**Release status:** **HOLD until the release blockers in Section 9 are cleared**

## 1. Executive verdict

The proposed course can be made factually defensible if it is framed as a course about using Claude to create and deliver valuable work - services, internal workflows, research, content, prototypes, software, and product experiments - rather than as evidence that Claude guarantees income.

The official sources verify product capabilities, plan availability, workflow techniques, cost controls, contractual boundaries, and safety obligations. They do **not** verify demand, customer acquisition, revenue, profit, typical earnings, or a causal relationship between Claude use and business success. The GitHub sources verify that inspectable workflow packages and software scaffolds exist. The X sources are practitioner self-reports; even when the original post is accessible, they establish only what the author publicly claimed, not that the figures are complete, representative, profitable, independently audited, or caused by Claude.

The course should use the following outcome disclaimer prominently, before any monetization examples:

> This course teaches practical ways to use Claude in services, workflows, software, and product experiments. It does not promise income or business success. Results depend on your expertise, market demand, sales, execution, quality control, costs, and compliance with applicable terms and law. Verify Claude's outputs before using or selling them. Practitioner examples are self-reported and are not representative results.

### Required factual corrections at a glance

| Topic | Verified course-safe position as of 2026-08-23 |
|---|---|
| Skills availability | Current Claude Academy and Help Center pages say Skills are available on Free, Pro, Max, Team, and Enterprise, subject to code-execution availability and organization controls. Do not repeat the narrower “paid plans” wording from the repository README as the current plan rule. |
| Projects on Free | Projects are available to all users. Free users can create a maximum of five projects. Enhanced retrieval/RAG is a paid-plan feature. |
| Research location | Research is a paid-plan feature. On supported clients, open it from the `+` control at the lower-left of the composer, then choose Research. Web search must be enabled. Do not tell learners to find Research in the left navigation sidebar. |
| Artifact publishing | Publishing an Artifact means making it shareable/discoverable or embedding it. It is not a storefront, payment processor, payout program, or verified customer-acquisition channel. |
| Claude Code Auto mode | Current Auto mode documentation and the 2026-08-07 product announcement supersede older Academy wording about manual/auto-accept modes. New Pro, Max, and Team sessions began defaulting to Auto mode from 2026-08-14 unless settings or organization policy say otherwise; this is not universal permission for consequential actions. |
| Output ownership | Under the Commercial Terms, the customer owns Outputs as between the parties and to the extent permitted by law. That clause does not establish copyrightability, originality, accuracy, or non-infringement, and does not grant rights in third-party material. Applicable account and regional terms still matter. |
| API cost optimization | Teach prompt caching, token hygiene, prompt audits, spend limits, model/effort selection, and Batch API savings. The current optimization guide says Batch can reduce cost by 50% for work that can wait up to 24 hours. Measure cost per completed task and verify current pricing before publication. |
| Commercial and AUP boundaries | Commercial offerings can be used to power products and services, subject to the applicable terms. Commercial activity does not authorize spam, scams, fake reviews, plagiarism, guardrail/platform circumvention, or unreviewed high-risk decisions. |
| X automation | No browser/site scripting to automate X, no unsolicited bulk replies or DMs, and no duplicate/spam content. Express consent and opt-out are required for permitted automated interactions; AI reply bots require prior written approval from X. |
| Repository licenses | Inspect the license at the exact repository path and revision before reuse. A root license does not cover linked sites, dependencies, trademarks, screenshots, datasets, or separately licensed directories. The Anthropic Skills repository is explicitly mixed-license; no license was observed for the Remotion Skills repository during this audit. |
| Practitioner outcomes | Treat every income, time-saving, customer, commit-count, or growth statement as an attributed self-report unless independent evidence is supplied. Do not turn projections or anecdotes into typical-results claims. |

## 2. Audit method and evidence rules

### 2.1 Evidence grades

| Grade | Meaning | Permitted use in the course |
|---|---|---|
| **A** | Current first-party product, technical, legal, or platform-policy source directly supporting the narrow claim | May support a date-stamped factual statement, with scope and caveats preserved |
| **B** | Inspectable first-party or creator-owned repository artifact and its applicable license | May establish that a pattern, file, skill, or scaffold exists; does not establish commercial results |
| **C** | Attributable practitioner or vendor self-report | May be presented only as “the author reports/claims,” with no causal, typicality, or verification inference |
| **D** | Inaccessible, incomplete, unlicensed for reuse, promotional without substantiation, or not independently reproducible | Must not support a factual outcome claim; link-only or exclude |

### 2.2 Claim acceptance rule

A claim passes only when the cited source directly supports the exact wording, applies to the relevant product/account/region, and has no unresolved conflict with a newer or more authoritative source. When those conditions are not met, the claim is narrowed, labeled as self-report, or rejected. The audit does not infer earnings from capability, licensing from visibility, profitability from revenue, market demand from a software demo, or safety from automation convenience.

### 2.3 Source hierarchy

For current product and terms facts, the hierarchy used here is:

1. Current Anthropic Help Center, platform documentation, Claude Code documentation, and legal/policy pages.
2. Current Claude Academy pages for training guidance and workflow examples.
3. Official or creator-owned GitHub repositories for inspectable implementation patterns and exact license scope.
4. Original X posts only as attributable practitioner testimony.

Search snippets, summaries, reposts, marketing aggregators, and course copy are not substitutes for a primary source.

## 3. Reconciliation of the required conflicts

### 3.1 Skills availability: current product documentation controls

The current Claude Academy lesson and current Help Center article both state that Skills are available on Free, Pro, Max, Team, and Enterprise. They also impose operational caveats: code execution and file creation must be available, and organization administrators may control access. The `anthropics/skills` README contains narrower wording that its example skills are available to paid Claude plans.

These statements should not be merged into “Skills are paid-only.” The repository README is an implementation/example repository, not the authoritative plan-entitlement page, and its wording may describe a narrower bundle or an earlier release state. The course-safe statement is:

> As of 2026-08-23, Claude Skills are documented for Free, Pro, Max, Team, and Enterprise. Availability can still depend on code execution, workspace settings, administrator policy, region, and product changes; check the current Help Center before teaching a click path.

Custom Skills also introduce supply-chain risk. Anthropic's Academy guidance says to use Skills only from trusted sources and inspect their contents. The course should require learners to review instructions, scripts, dependencies, and permissions before enabling a third-party Skill.

### 3.2 Projects: Free is supported, with a five-project ceiling

The current Projects article states that Projects are available to all users, including Free users, and that Free users may create at most five projects. The article separately describes enhanced retrieval/RAG capacity as paid-plan functionality. The course must not say either “Projects require Pro” or “Free Projects are unlimited.”

Course-safe wording:

> Free users can create up to five Projects as of 2026-08-23. Paid plans add enhanced retrieval and may have different limits. Because plan limits change, label screenshots and instructions with the capture date and plan.

### 3.3 Research: paid feature, opened from the composer

The current Research article lists Pro, Max, Team, and Enterprise availability across supported web, desktop, and mobile clients. It says web search must be enabled. The current entry path is the `+` control at the bottom-left of the message composer, followed by Research. It is misleading to call Research a permanent item in the left navigation sidebar.

Course-safe wording:

> On an eligible paid plan, open a conversation, select `+` at the lower-left of the composer, and choose Research. Confirm that web search is enabled. The exact control can move, so show a dated, plan-labeled screenshot and provide the Help Center link as the fallback.

Research can consume the same conversation limits more quickly because it conducts multiple searches. It produces cited results, but citations still require human inspection before commercial use.

### 3.4 Artifacts: publishing is distribution, not monetization

The Artifacts Help article supports creating, editing, versioning, downloading, and publishing supported artifacts. It also describes AI-powered artifacts hosted on Anthropic infrastructure and notes that a viewer's usage counts against that viewer's limits rather than the creator's limits. Nothing in the cited article establishes a built-in checkout, marketplace, payout, customer-acquisition, licensing, or revenue-sharing feature.

Therefore these claims fail:

- “Publish an Artifact and Claude pays you.”
- “Artifact publishing automatically sells your app.”
- “Artifact views generate creator revenue.”
- “Publishing makes the Artifact production-ready for customers.”

Course-safe wording:

> Artifacts can help demonstrate or share a deliverable. To charge customers, the creator needs a separately validated commercial channel, payment system, customer agreement, support plan, privacy posture, and applicable tax/compliance process. Publishing is not payment.

Claude Code artifacts created in an organization can have different visibility rules; the current Help article says those are organization-private rather than public. Do not use a public-sharing screenshot to teach an organization-private workflow.

### 3.5 Claude Code Auto mode: default behavior changed in August 2026

Claude Academy's Claude Code 101 material still uses older mode language such as manual mode, auto-accept, and Plan Mode. The newer Claude Code Auto mode documentation and Anthropic's 2026-08-07 announcement are more authoritative for the current feature.

The announcement says that beginning 2026-08-14, new Pro, Max, and Team Claude Code sessions use Auto mode by default unless the user pins a different default or an administrator sets policy. Enterprise/API and other environments were initially opt-in. The current technical documentation describes a classifier that decides whether to allow or interrupt tool use, but it also preserves explicit allow/ask/deny rules and acknowledges that conversational boundaries can be lost through context compaction.

Course-safe wording:

> Auto mode reduces permission interruptions for many actions, but it is not blanket authorization and does not eliminate risk. Use durable project rules, explicit ask/deny controls, least privilege, version control, tests, backups, and human review for consequential changes. Confirm the current account and organization default before demonstrating it.

The course must not tell learners to enable broad permissions merely to work faster, and it must not imply that the Auto classifier makes billing, deployment, deletion, external messaging, credential handling, or regulated work safe without review.

### 3.6 Output ownership: a scoped allocation, not an originality warranty

The Anthropic Commercial Terms say that, as between Anthropic and the customer and to the extent permitted by law, the customer retains rights in inputs and owns outputs, with a corresponding assignment if Anthropic has rights. The same terms require the customer to evaluate and verify outputs and alert users that factual claims can be false, incomplete, misleading, or stale. The IP indemnity has stated exclusions.

The ownership clause does **not** establish:

- that an output is copyrightable in a given jurisdiction;
- that it is original or unique;
- that it does not reproduce or conflict with third-party material;
- that it is factually accurate or commercially fit;
- that a customer owns input material supplied by someone else;
- that third-party software, media, trademarks, or datasets are relicensed; or
- that Commercial Terms govern a consumer account in every country.

Course-safe wording:

> Under Anthropic's Commercial Terms, customers own outputs as between the parties and to the extent permitted by law. You remain responsible for verifying accuracy, provenance, originality, third-party rights, and fitness for the intended commercial use. Check the terms that actually govern your account and region.

The regional Consumer Terms page reviewed for this audit illustrates why scope matters: consumer terms and commercial/API terms are not interchangeable. The course should link both the applicable live terms and their effective date instead of giving a universal legal conclusion.

### 3.7 API cost optimization: optimize completed work, not headline token price

Anthropic's current optimization guide recommends prompt caching, removing unnecessary input and output tokens, prompt audits, model and effort selection, task-level token budgets, monitoring, and spend limits. It states that the Batch API offers a 50% cost reduction for jobs that can wait up to 24 hours. The guide advises evaluating cost per completed task and warns that internal results are directional; customers should measure their own workloads.

Course-safe practice:

1. Define the acceptance test for a completed customer task.
2. Measure baseline quality, latency, input/output tokens, retries, review time, and failure cost.
3. Add caching for repeated stable context.
4. Trim unnecessary context and verbosity without removing required evidence.
5. Compare models and effort levels on the same representative test set.
6. Use Batch only for latency-tolerant work and verify its current rules.
7. Set spend limits and alerts before scaling.

Do not hard-code a dollar margin from an old model price table, and do not equate a 50% API discount with 50% higher profit. Human review, retries, hosting, data acquisition, payment fees, taxes, support, refunds, and sales costs remain outside the token price.

### 3.8 Commercial use and AUP: permitted use remains bounded

The Commercial Terms apply to specified commercial offerings, including API-key use and offerings that reference those terms, and contemplate customers powering products and services for their own users. They also restrict unlawful use, require compliance with the Usage Policy and service-specific terms, require independent output evaluation, and restrict building a competing model/product or reselling the service without approval.

The Usage Policy prohibits or restricts activities directly relevant to a “make money” course, including scams, phishing, spam, deceptive products, fake reviews, plagiarism, platform safeguard circumvention, and ban evasion. High-risk applications require qualified human involvement and disclosures. Consumer-facing chatbots and external-facing agents must disclose that users are interacting with AI at the beginning of the interaction.

Course-safe rule:

> A commercially valuable workflow must pass four gates: it is allowed by the applicable Anthropic terms; allowed by the destination platform's rules; lawful in the relevant jurisdiction; and supported by human review, privacy, security, and customer-quality controls appropriate to the risk.

“Claude can technically do it” is not evidence that the workflow is permitted.

### 3.9 X automation: no unsolicited growth-hacking playbook

X's Automation Rules make the account owner responsible for automated activity. They prohibit non-API scripting of the website, spam and duplicative posts, unsolicited keyword-triggered replies, and unsolicited bulk direct messages. Permitted automated interaction requires express consent and a clear opt-out. Automated AI reply bots require prior written approval from X.

The course must not teach:

- browser automation that imitates a person on x.com;
- scraping or site scripting that bypasses the official API;
- cold bulk DMs;
- automated keyword replies to people who did not opt in;
- duplicate engagement posts across accounts;
- rotating accounts, fingerprints, proxies, or identities to evade enforcement; or
- “human-like” deception intended to conceal automation.

The safer course pattern is human-authored outreach to a small, relevant, consent-respecting audience, with no automated replies or DMs unless every current platform requirement is satisfied. Anthropic's AUP remains an additional constraint even if X permits a specific API action.

### 3.10 Repository license scope: inspect before copying

The repositories provide valuable structural examples, but they are not a single pool of freely reusable material.

- `anthropics/skills` explicitly says many examples use Apache 2.0 while the document-creation Skills for DOCX, PDF, PPTX, and XLSX are source-available rather than open source. Check the license inside each Skill directory.
- `coreyhaines31/marketingskills`, `thatrebeccarae/claude-marketing`, `wasp-lang/open-saas`, `jonradoff/lastsaas`, and `shotgun-sh/shotgun` displayed MIT licenses at the audited repository state.
- `houtini-ai/seo-audit` displayed Apache 2.0.
- No repository license was observed for `remotion-dev/skills` during this audit. It can be linked and inspected, but course authors should not copy, modify, bundle, or redistribute it without confirming permission at the exact revision.

A license in a repository normally covers the material actually placed under it. It does not automatically cover dependencies, linked websites, service marks, screenshots, personal data, customer data, third-party examples, generated content, or separately licensed subdirectories. Before copying code into course materials, record the repository URL, immutable commit, exact path, license file, attribution/notice obligations, modifications, and third-party components.

### 3.11 Practitioner reports: idea signals, not income evidence

The currently reproducible X text can support only narrow attributed statements. Cody Schneider supports an attributed team AI-analyst description; Elvis Sun supports a narrow billing-incident self-report; William Candillon supports a Remotion-output statement without a Claude attribution. The Degen Sing and Sam Ragsdale details described in the 2026-08-23 draft are not reproducible from the 2026-08-24 public surfaces and are Grade D. An accessible original post is not an audit.

For every practitioner example, use this structure:

> **Practitioner report, not independently verified:** [Author] states that [narrow claim] in an X post dated [date if visible]. The post does not establish causality, typical results, profitability after costs, or suitability for another business. We use it only to illustrate [specific workflow lesson].

Exclude inaccessible or purely promotional monetary claims. Exclude any tactic whose substance is account farming, fingerprint rotation, proxy evasion, undisclosed automation, fake engagement, or other platform circumvention, even if the author reports revenue.

## 4. Official source register

Every record below includes the direct claim supported, source class, evidence grade, volatility, and limitations. “Accessed” means the live page or its directly indexed content was inspected on the snapshot date; it does not mean Anthropic promises the feature will remain unchanged.

| ID | Source and URL | Accessed | Direct claim supported | Source class / grade | Volatility | Limitations |
|---|---|---:|---|---|---|---|
| O1 | [Claude Academy: AI Fluency for Small Businesses](https://academy.claude.com/courses/ai-fluency-for-small-businesses) | 2026-08-23 | Teaches the 4D framework, realistic expectations, hallucination/knowledge-cutoff awareness, data hygiene, transparency, and keeping humans responsible for final decisions. | Anthropic Academy / **A** | Medium | Training guidance, not proof of demand, revenue, profit, or legal compliance. |
| O2 | [Claude Academy: Working with Skills](https://academy.claude.com/courses/claude-101/working-with-skills) | 2026-08-23 | Skills are documented for Free, Pro, Max, Team, and Enterprise; code execution/file creation and organization controls matter; inspect and trust a custom Skill before use. | Anthropic Academy / **A** | High | Plan eligibility and UI can change. Does not validate a third-party Skill or its license. |
| O3 | [Claude Academy: Claude Code 101](https://academy.claude.com/courses/claude-code-101) | 2026-08-23 | Teaches an agentic Explore -> Plan -> Code -> Commit workflow, permissions, context, review, and plan/API prerequisites. | Anthropic Academy / **A** for workflow | High | Its mode terminology may lag current Auto mode. It does not prove software quality, security, or commercial success. |
| O4 | [Claude Academy: Claude use cases](https://academy.claude.com/claude/use-cases) and [Cowork use cases](https://academy.claude.com/products/cowork/use-cases) | 2026-08-23 | Provides first-party workflow examples such as research, content, call preparation, analysis, personas, and prototyping. | Anthropic Academy / **A** for listed examples | High | Examples are possibilities, not market validation or expected earnings. Product/plan availability must be checked separately. |
| O5 | [Help Center: What are Projects?](https://support.claude.com/en/articles/9517075-what-are-projects) | 2026-08-23 | Projects are available to all users; Free users have a maximum of five; enhanced retrieval is paid; sharing differs by organization plan. | Anthropic Help / **A** | High | Limits, sharing, and retrieval features can change. A Project is not a customer-facing product or proof of durable storage/compliance for a business. |
| O6 | [Help Center: Use Skills in Claude](https://support.claude.com/en/articles/12512180-use-skills-in-claude) | 2026-08-24 | Skills are listed for Free, Pro, Max, Team, and Enterprise; Code execution and file creation must be enabled. | Anthropic Help / **A** | High | Team and Enterprise access can depend on organization and administrator controls. Does not license repository code. |
| O7 | [Help Center: What are Artifacts and how do I use them?](https://support.claude.com/en/articles/9487310-what-are-artifacts-and-how-do-i-use-them) | 2026-08-24 | Artifacts can be created, edited, versioned, downloaded, and shared/published; Code execution and file creation must be enabled. | Anthropic Help / **A** | High | No built-in payment, storefront, payout, or customer guarantee is documented. Public and organization-private Artifact flows differ. |
| O8 | [Help Center: Use Research on Claude](https://support.claude.com/en/articles/11088861-use-research-on-claude) | 2026-08-23 | Research is for Pro, Max, Team, and Enterprise on supported web/desktop/mobile clients; web search is required; launch from `+` at the lower-left of the composer; it performs iterative searches with citations. | Anthropic Help / **A** | High | UI and plan eligibility can change. Citations require human validation; Research may consume limits faster. |
| O9 | [Help Center: Use connectors to extend Claude's capabilities](https://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities) | 2026-08-23 | Connectors inherit source permissions, may read or modify external data, can be constrained by organization action controls, and may run on third-party infrastructure. | Anthropic Help / **A** | High | Availability differs by plan and connector. Connecting a service does not validate its security, privacy, accuracy, or license. “Least privilege” is an audit recommendation derived from these risks. |
| O10 | [Platform docs: Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) | 2026-08-23 | Recommends clear and direct instructions, explicit desired outputs and constraints, relevant context, examples, and structured tags where useful. | Anthropic technical docs / **A** | High | Model-specific behavior changes. Better prompting does not guarantee factuality or business outcomes. |
| O11 | [Platform docs: Optimizing for cost and intelligence](https://platform.claude.com/docs/en/about-claude/models/optimizing-for-cost-and-intelligence) | 2026-08-23 | Documents prompt caching, token hygiene, prompt audits, model/effort/task budgets, spend limits, cost-per-completed-task measurement, and a 50% Batch API reduction for jobs that can wait up to 24 hours. | Anthropic technical docs / **A** | High | Pricing and model behavior can change; Anthropic's internal results are directional. Savings require measurement on the user's workload and do not equal profit. |
| O12 | [Anthropic Commercial Terms of Service](https://www.anthropic.com/legal/commercial-terms) | 2026-08-23 | Defines commercial-offering scope; permits powering products/services subject to terms; allocates input/output rights between parties; requires output verification and user warnings; prohibits unapproved resale and competing-model uses; states IP-indemnity exclusions. | Anthropic contract / **A** | Medium | Applies only when these terms govern. Ownership is limited by law and third-party rights; this audit is not legal advice. Rates and terms may change. |
| O13 | [Anthropic Consumer Terms of Service](https://www.anthropic.com/legal/consumer-terms) | 2026-08-23 | The retrieved regional consumer page illustrates that consumer Claude use and commercial/API use can have different governing terms; it also requires output verification and contains warranty/rights limits. | Anthropic contract / **A** within stated region | Medium | The retrieved page was region-scoped; do not generalize it globally. Check the terms shown for the learner's account, product, and location. |
| O14 | [Anthropic Usage Policy](https://www.anthropic.com/legal/aup) | 2026-08-23 | Prohibits illegal/IP abuse, scams, phishing, spam, deceptive products, fake reviews, plagiarism, platform-circumvention and ban-evasion patterns; imposes safeguards/disclosure for high-risk and external-facing AI uses. | Anthropic policy / **A** | Medium | Categories and exceptions require contextual reading. Compliance with the AUP does not establish compliance with law or another platform's rules. |
| O15 | [X Automation Rules](https://help.x.com/en/rules-and-policies/x-automation) | 2026-08-23 | Account owner is responsible; website scripting, spam, duplicative activity, unsolicited bulk replies/DMs are prohibited; permitted automation requires consent/opt-out; AI reply bots need prior written approval. | Platform policy / **A** | High | X rules and API tiers change. A platform permission does not override Anthropic's AUP, privacy law, or anti-spam law. |
| O16 | [Claude blog: Auto mode is becoming the default in Claude Code](https://claude.com/blog/auto-mode-default-in-claude-code) | 2026-08-23 | Announces the 2026-08-14 default for new Pro, Max, and Team sessions unless user/admin configuration differs, plus the need for review in consequential work. | Anthropic product announcement / **A** | High | Rollout state and defaults can vary by account or organization. A dated announcement should be checked against current docs. |
| O17 | [Claude Code docs: Auto mode configuration](https://code.claude.com/docs/en/auto-mode-config) | 2026-08-23 | Describes the classifier, explicit allow/ask/deny precedence, configuration scope, availability, durable rules, and the risk that conversational boundaries can be lost during context compaction. | Anthropic technical docs / **A** | High | Technical behavior and provider defaults can change. The classifier is not a warranty of safety or authorization. |
| O18 | [Help Center: Use Claude Cowork safely](https://support.claude.com/en/articles/13364135-use-claude-cowork-safely) | 2026-08-24 | Cowork sessions run in Anthropic's cloud; local files accessed by Cowork are processed there; approval behavior varies by mode and tool. | Anthropic Help / **A** | High | Skip all approvals does not check actions, and computer use lacks ordinary per-action tool checks. Permanent deletion still asks for explicit permission. Recheck before sensitive use. |

## 5. GitHub source register

Repository evidence supports patterns and implementation inspection. It does not establish that a product is secure, production-ready, profitable, adopted, or appropriate for a customer's data.

| ID | Source and URL | Accessed | Direct claim supported | Source class / grade | Volatility | Limitations and license scope |
|---|---|---:|---|---|---|---|
| G1 | [anthropics/skills](https://github.com/anthropics/skills) | 2026-08-23 | Official examples show reusable Skill directory patterns and document-oriented Skills. README states that many examples use Apache 2.0 while DOCX/PDF/PPTX/XLSX Skills are source-available, not open source. | Official repository / **B** | High | Mixed licensing; inspect each directory. README's “paid plans” wording conflicts with newer Help/Academy entitlement pages and must not control plan claims. No income evidence. |
| G2 | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | 2026-08-23 | Inspectable collection of reusable marketing workflow Skills; README links the creator's agency, training, and product ecosystem. | Creator repository / **B** | Medium | MIT was displayed for repository code at the audited state. The repository does not prove customer outcomes or revenue. Linked products, marks, media, and dependencies are not automatically MIT-covered. |
| G3 | [thatrebeccarae/claude-marketing](https://github.com/thatrebeccarae/claude-marketing) | 2026-08-23 | Inspectable collection of marketing Skills; the author reports that they emerged from and were tested in client work. | Artifact **B**; client/time statements **C** | Medium | MIT was displayed. Statements such as counts, test history, or producing a client-ready audit in a stated time are self-reported, not independently benchmarked or revenue evidence. |
| G4 | [houtini-ai/seo-audit](https://github.com/houtini-ai/seo-audit) | 2026-08-23 | Inspectable SEO audit architecture and check registry; author reports a large reduction in audit time. | Artifact **B**; performance statements **C** | Medium | Apache 2.0 was displayed. Timing, traffic, recovery, and commercial-value claims are unverified. SEO checks can become stale and require domain expertise. |
| G5 | [remotion-dev/skills](https://github.com/remotion-dev/skills) | 2026-08-23 | Repository demonstrates agent Skills for programmatic video workflows, including creation, markup, studio, and rendering tasks. | Repository existence / **B** | Medium | No license was observed during the audit. Link and inspect only until reuse permission is confirmed at the exact revision. Does not prove client demand, quality, or income. |
| G6 | [wasp-lang/open-saas](https://github.com/wasp-lang/open-saas) | 2026-08-23 | Inspectable SaaS scaffold includes common components such as authentication, payments, AI integration, and tests. | Creator repository / **B** | Medium | MIT was displayed. A payment integration is not evidence of demand, profitability, tax/security compliance, correct billing, or production readiness. |
| G7 | [jonradoff/lastsaas](https://github.com/jonradoff/lastsaas) | 2026-08-23 | Inspectable SaaS scaffold with billing/tenancy components; author says it was created through a conversational Claude Code workflow. | Artifact **B**; origin/performance statements **C** | Medium | MIT was displayed. “Production-ready,” time-saved, and similar claims are creator assertions unless independently tested. No verified revenue evidence. |
| G8 | [shotgun-sh/shotgun](https://github.com/shotgun-sh/shotgun) and [repository case study](https://github.com/shotgun-sh/shotgun/blob/main/docs/CASE_STUDY.md) | 2026-08-23 | Repository supports a spec-driven, research-before-build pattern. Its own case study reports rapid build and first-customer metrics. | Artifact **B**; case metrics **C** | Medium | MIT was displayed. The case study is vendor-authored; time, customer, quality, security, and revenue claims are not independently verified. “Zero attack vectors” or similar language must never be upgraded to an audit conclusion. |

## 6. X practitioner source register

An accessible original X post receives at most Grade C for a claimed personal experience. Engagement counts, author reputation, screenshots, or numerical detail do not make it independently verified.

| ID | Source and URL | Accessed | Direct claim supported | Source class / grade | Volatility | Limitations and course disposition |
|---|---|---:|---|---|---|---|
| X1 | [Degen Sing post](https://x.com/degensing/status/2026578817016566047) | 2026-08-24 recheck | Current official oEmbed exposes only a media link and no usable claim text. | Unavailable current evidence / **D** | High | Block from instruction and assessment. Do not reconstruct worktree, task-registry, testing, review, cost, security, customer, or income details from earlier summaries or inaccessible media. |
| X2 | [Cody Schneider post](https://x.com/codyschneider/status/2026009180763554234) | 2026-08-24 recheck | Author reports a marketing-team AI analyst across Claude Code, Cowork, and iOS, with claimed dashboard, sales-forecasting, and blog-post-content improvement uses. | Practitioner self-report / **C** | High | Official oEmbed supports only the attributed statement. It does not establish ROI, correctness, governance, or representative results; attached media is not used. |
| X3 | [Sam Ragsdale post](https://x.com/samrags_/status/2016267562057662745) | 2026-08-24 recheck | Official oEmbed confirms a post about onboarding non-engineers to Claude Code and Cowork, but truncates before any durable-handoff detail. | Unavailable current evidence / **D** | High | Block from instruction and assessment. No goal-file, output-file, one-objective-per-chat, comparative, or income claim is supported by the available text. |
| X4 | [Elvis Sun post](https://x.com/elvissun/status/2025044631407468689) | 2026-08-24 recheck | Author reports that one customer was billed three times for a total of $240 and attributes the defect to billing code written with Claude Code. | Practitioner incident self-report / **C** | High | The recoverable text does not identify Stripe or establish a refund outcome. Use only as a cautionary self-report, not a failure-rate or general-causality claim. |
| X5 | [William Candillon post](https://x.com/wcandillon/status/2015345960491069718) | 2026-08-24 recheck | Author reports that the displayed creative output was made entirely with Remotion. | Practitioner demonstration / **C** | High | The recoverable text does not mention Claude. It supports output existence only, not Claude contribution, production time, quality, demand, clients, or revenue. |
| X6 | [AdiiX post](https://x.com/adiix_official/status/2034730013283512381) | 2026-08-23 | No direct claim independently recoverable in this audit. Context described a small automation result, an account ban, and a large extrapolation. | Inaccessible/promotional / **D** | High | Exclude monetary and extrapolated outcome claims. A projection is not realized revenue, and an account ban is a compliance warning rather than a replicable playbook. |
| X7 | [Levi Munneke post](https://x.com/levikmunneke/status/2035123865463267798) | 2026-08-23 | No direct claim independently recoverable in this audit. Context described projected seven-figure results from outbound activity. | Inaccessible/projection / **D** | High | Exclude. Projected arithmetic is not revenue or profit; automated outbound may conflict with platform, privacy, and anti-spam rules. |
| X8 | [Alexander Belogubov post/article](https://x.com/AlexBelogubov/status/2041451718127354053) | 2026-08-23 | Author describes a Reddit-promotion system and claims scale/revenue, including aged accounts, residential proxies, fingerprint rotation, and ban avoidance. | Attributable self-report / **C** for authorship; prohibited method | High | Do not include as a success tactic. The described evasion conflicts with Anthropic's platform-circumvention/ban-evasion boundaries and cannot support an ethical monetization lesson. Revenue and scale are also unverified. |
| X9 | [Noisy post](https://x.com/noisyb0y1/status/2040723475124408393) | 2026-08-23 | Author makes a high daily/monthly income claim attributed to Claude and plugins. | Unsupported promotional claim / **D** | High | No independently inspectable business identity, method, customer records, costs, or audit trail. Exclude from income evidence and marketing copy. |

## 7. Course-safe evidence model for monetization lessons

The strongest course structure separates four layers that promotional posts often collapse:

| Layer | Question learners must answer | Acceptable evidence |
|---|---|---|
| Capability | Can Claude help perform this task? | Official product documentation plus a reproducible demonstration |
| Deliverable quality | Does the output meet a defined customer need? | Rubric, tests, expert review, provenance, accessibility and security checks |
| Market evidence | Will a specific customer pay? | Ethical customer interviews, signed pilot, paid invoice, retention/refund data; never an Artifact view count alone |
| Business outcome | Does the work produce sustainable profit? | Revenue minus all costs, time, failures, refunds, taxes, support, and acquisition; measured over a stated period |

The official and repository sources mostly support the first layer. The practitioner sources may suggest experiments for the second or third layer, but they do not independently establish the fourth. Course quizzes, figures, and headings should preserve that distinction.

### Recommended real-UI figure protocol

Because this course is expected to use real Claude UI figures, every figure should include a small caption with:

- source owner and capture method;
- capture date, plan, client, and region where material;
- exact UI path demonstrated;
- notice that UI and entitlements can change;
- redaction of names, emails, account identifiers, prompts containing client data, connector data, API keys, billing records, and hidden browser elements;
- alt text that teaches the same action without relying on the image; and
- an adjacent live Help/Academy link.

The preferred image source is a fresh screenshot from a course-owner-controlled Claude account using synthetic or expressly authorized data. Do not copy an X screenshot or repository image merely because it is publicly viewable. Public visibility is not a reuse license. If third-party media is essential, obtain permission and preserve attribution. Do not fabricate a Claude UI or use a generated interface image while labeling it “real.”

High-priority figures to recapture after factual copy is locked:

1. Skills settings or creation flow, labeled with plan and code-execution caveat.
2. Projects list showing the Free-plan context without private project names; caption says “maximum five” as of the capture date.
3. Research opened from the `+` composer control, not the left sidebar.
4. Artifact create/edit/publish controls with an explicit caption: “Publish shares; it does not collect payment.”
5. Claude Code permission/Auto mode settings showing the exact current account default and ask/deny controls.
6. API usage/cost monitoring using synthetic values, not a claim of profit.

## 8. Fail-closed claim ledger

“PASS” means the narrow, date-stamped wording below is source-supported. “CONDITIONAL” means it can be published only with the listed qualification. “REJECT” means the claim must not appear as fact. “BLOCKED” means the available evidence was insufficient.

| Claim ID | Candidate course claim | Verdict | Permitted wording or evidence boundary | Release action |
|---|---|---|---|---|
| CL-01 | “Claude will make you money” or guarantees a specified result | **REJECT** | Claude can assist with workflows that a person may turn into valuable services or products; business outcomes are uncertain. | Remove guarantee language from title metadata, hero copy, captions, quizzes, testimonials, and calls to action. Add the outcome disclaimer. |
| CL-02 | A practitioner's reported revenue proves that learners can reproduce it | **REJECT** | “The author reports...” plus a narrow workflow lesson; no causality, typicality, or profitability inference. | Re-label every number and add costs/selection-bias limitations, or remove it. |
| CL-03 | Skills are paid-only | **REJECT** | Current Help and Academy pages say Free, Pro, Max, Team, Enterprise, with execution/admin caveats. | Replace paid-only copy and date-stamp the claim. |
| CL-04 | Free users have unlimited Projects or no Projects | **REJECT** | Free users can create up to five Projects; enhanced retrieval is paid. | Correct narration, screenshots, quiz answers, and comparison tables. |
| CL-05 | Research is in the left navigation sidebar | **REJECT** | On eligible paid plans, open `+` at the lower-left of the composer and choose Research; enable web search. | Recapture real UI and add plan/date caveat. |
| CL-06 | Artifact publishing includes payment or makes a product commercially available | **REJECT** | Publishing supports sharing/discovery/embedding. Payment, contracts, support, privacy, and distribution are separate systems. | Remove payout/storefront language and any unverified earnings figure tied to Artifact views. |
| CL-07 | Claude Code is now universally in Auto mode, so permission review is unnecessary | **REJECT** | From 2026-08-14, new Pro/Max/Team sessions defaulted to Auto unless configuration differs; other environments/admin policies vary. Auto is risk reduction, not authorization. | Update legacy mode copy; show ask/deny controls; add human-review and durable-rule requirements. |
| CL-08 | “You own every Claude output, so it is safe to sell” | **REJECT** | Commercial Terms allocate output ownership between the parties to the extent permitted by law; originality, copyrightability, accuracy, third-party rights, and fitness remain unresolved. | Replace with scoped legal wording and require provenance/IP review. |
| CL-09 | Batch API always halves total business costs | **REJECT** | Current docs state 50% API-cost reduction for work that can wait up to 24 hours. Total cost and profit require workload measurement. | Replace with measured cost-per-completed-task exercise and current pricing link. |
| CL-10 | Anthropic permits commercial products without further conditions | **REJECT** | Applicable commercial offerings may power products/services subject to Commercial Terms, Usage Policy, service-specific terms, law, and third-party platform rules. | Identify the product/account terms for each lesson and add AUP gates. |
| CL-11 | Learners can automate cold replies or DMs on X with Claude | **REJECT** | X prohibits unsolicited bulk activity and site scripting; consent/opt-out rules apply; AI reply bots need prior written approval. | Remove automation playbooks and any evasion, account-rotation, or proxy guidance. |
| CL-12 | Code in every cited GitHub repository can be copied into the course | **REJECT** | Reuse is conditional on the exact path, revision, license, notices, and third-party components. | Create a per-asset license manifest before copying. Exclude unlicensed Remotion material and mixed-license Anthropic files unless permission is confirmed. |
| CL-13 | A SaaS template or payment integration is production-ready and profitable | **REJECT** | Repository establishes an inspectable scaffold only. Production claims require testing, security review, billing invariants, privacy, support, and market evidence. | Replace “production-ready” with a testable prototype description; add a launch checklist. |
| CL-14 | An X screenshot can be reused because the post is public | **REJECT** | Link to the original post; obtain permission before reproducing media; use a fresh, redacted first-party Claude screenshot where possible. | Remove or license third-party screenshots; log consent and attribution. |
| CL-15 | The Degen Sing workflow proves a profitable autonomous company | **BLOCKED** | Current public retrieval exposes no usable claim text. | Remove all workflow and outcome details from instruction and assessment; retain only a Grade D blocked ledger record. |
| CL-16 | The Elvis Sun post proves Claude is unsafe for all billing code | **REJECT** | It is an author-reported triple-billing incident attributed to code written with Claude Code. The available text does not identify Stripe or establish a refund outcome. | Present only the narrow cautionary self-report, not a rate or causal generalization. |
| CL-17 | The Belogubov Reddit system is a valid growth strategy | **REJECT** | No permissible course wording as a success tactic. It may be mentioned only as a prohibited/evasion warning. | Exclude operational steps, revenue claims, account/proxy details, and replication instructions. |
| CL-18 | Degen Sing, Sam Ragsdale, AdiiX, Levi, or Noisy details are verified | **BLOCKED** | No factual lesson claim is permitted from the currently unavailable or truncated evidence. Cody Schneider is limited to the narrow attributed workflow text recovered by official oEmbed. | Remove blocked details, or preserve lawful dated evidence and obtain corroboration before a future release. |
| CL-19 | Official use cases prove customer demand | **REJECT** | Official use cases establish supported workflow examples only. | Add a customer-discovery and paid-pilot step before product claims. |
| CL-20 | The cited sources validate “world-class” course quality | **REJECT** | “World-class” is an aspiration requiring learning-objective alignment, hands-on assessments, accessibility, current UI validation, and learner testing. | Run an independent instructional QA pass after factual corrections and figure replacement. |

## 9. Release blockers

Course 12 should remain on hold until all applicable blockers are closed and recorded in a release checklist.

1. **Outcome-claim blocker:** Remove guarantees and unsupported earnings, customer, time-saving, ROI, and profitability statements from every page, caption, quiz, SEO field, schema field, and promotional asset. Add the outcome disclaimer.
2. **Product-fact blocker:** Apply the Skills, five-Free-Projects, Research-location, Artifact-publishing, and Auto-mode corrections consistently across prose, narration, screenshots, answers, and downloads.
3. **Terms-scope blocker:** Replace universal output-ownership and commercial-use claims with the scoped Commercial Terms wording. Link the live applicable terms and effective date. Include accuracy, third-party-rights, and human-verification limits.
4. **Policy blocker:** Remove spam, unsolicited automated outreach, fake-review, plagiarism, account-farming, proxy/fingerprint rotation, ban-evasion, and platform-circumvention methods. Add an Anthropic AUP plus destination-platform compliance gate to every automation lesson.
5. **X-evidence blocker:** Remove or explicitly label every practitioner metric as an unverified self-report. Exclude unavailable Degen Sing, Sam Ragsdale, AdiiX, Levi, and Noisy details from factual teaching. Limit Cody Schneider, Elvis Sun, and William Candillon to the exact current public text. Use the Belogubov material only as a prohibited-practice warning, if at all.
6. **Repository-rights blocker:** Build a file-level asset manifest with immutable commit, path, license, notice, modification, and third-party-dependency fields. Do not redistribute unlicensed or mixed-license material without verified permission.
7. **Real-UI blocker:** Replace mock, stale, borrowed, or unlabeled screenshots with freshly captured real Claude UI from an authorized account using synthetic/redacted data. Label date, plan, client, and region when material. Obtain permission for any third-party media.
8. **Safety/quality blocker:** Add human review, acceptance tests, provenance checks, prompt-injection/data controls, least-privilege connector guidance, billing tests, backups, rollback, monitoring, refund handling, and customer disclosure where relevant.
9. **Cost-evidence blocker:** Replace static profit calculators based only on token price with current-price inputs and total-cost measurement: retries, labor, review, hosting, payments, acquisition, support, refunds, taxes, and failure costs.
10. **Instructional-QA blocker:** After corrections, verify every demonstration against the live product, test every link, make alt text usable without the image, verify quiz keys, and run an independent final review of the published build rather than only the source files.

## 10. Release decision

**Current decision: HOLD.**

The course is releasable only after the blockers above are resolved and the final published build is re-verified. A defensible release can teach Claude-enabled value creation, ethical service/product experiments, measured cost control, and reliable delivery. It cannot use capability as proof of income, publishing as proof of payment, repository visibility as a reuse license, or practitioner anecdotes as typical financial results.

The corresponding methodological and retrieval record is in `claude-income-source-verification.provenance.md`.

## 11. Current-source erratum, 2026-08-24

The HOLD decision above remains the historical preimplementation verdict. This
erratum supersedes only the stale X retrieval details: Degen Sing and Sam
Ragsdale are Grade D and blocked; Cody Schneider is Grade C only for the narrow
team AI-analyst self-report; Elvis Sun does not establish Stripe or a refund;
and William Candillon's recoverable text establishes a Remotion output without
mentioning Claude. The implemented Course 12 ledger and validator apply these
current boundaries and retain no Grade D source in instruction or assessment.
