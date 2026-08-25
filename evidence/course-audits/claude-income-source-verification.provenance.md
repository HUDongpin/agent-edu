# Provenance record: Course 12 Claude income source verification

**Companion report:** `evidence/course-audits/claude-income-source-verification.md`
**Audit date:** 2026-08-23<br>
**Audit timezone:** Asia/Taipei<br>
**Prepared for:** aicourse.top Course 12, “How to make money with Claude”<br>
**State represented:** public sources retrievable during this audit, not a permanent product snapshot

## 1. Scope contract

This provenance record documents how the companion report evaluated official Anthropic/Claude Academy, Help Center, technical, legal, GitHub, X, and X-policy sources. It is intended to make the factual corrections auditable and to preserve the boundary between a verified product fact, an inspectable artifact, an attributed self-report, and an unsupported claim.

The audit answered these questions:

1. What do current primary Anthropic sources support about Skills, Projects, Research, Artifacts, Claude Code Auto mode, prompting, API cost optimization, commercial terms, output rights, connectors, and the Usage Policy?
2. What does X's own automation policy permit or prohibit?
3. What do the named GitHub repositories establish, and what do their licenses not establish?
4. Which named X practitioner posts were directly retrievable, and what narrow lesson can each support?
5. Which candidate course claims must be corrected, qualified, blocked, or rejected before release?

The audit did **not**:

- verify bank statements, invoices, Stripe dashboards, tax returns, customer contracts, profitability, or business identities behind practitioner posts;
- conduct a legal opinion, copyrightability analysis, security audit, penetration test, dependency audit, or accounting review;
- certify that a repository is production-ready;
- authorize reuse of third-party screenshots, posts, trademarks, or repository files;
- reproduce or download X media;
- test every feature from every plan, country, client, or organization configuration; or
- edit the website implementation or shared course files.

## 2. Research workflow and role separation

The deep-research workflow was used with three logical roles performed sequentially in the same audit because the available agent-concurrency slots were already occupied:

- **Researcher role:** located and inspected primary product, technical, legal, policy, repository, and original practitioner sources.
- **Verifier role:** reconciled conflicting or stale statements, checked source scope and currentness, and refused unsupported inferences.
- **Reviewer role:** translated findings into course-safe wording, a claim ledger, and fail-closed release blockers.

No subagent result was accepted without review in the companion report. The absence of independent financial records means practitioner outcome claims remain unverified even when the original post was accessible.

## 3. Evidence and authority rules

### 3.1 Authority ordering

For product entitlement, UI, and behavior:

1. Current Help Center or current technical documentation.
2. Current product announcement when it describes a rollout not yet reflected in older training material.
3. Claude Academy for learning guidance and product workflow framing.
4. GitHub README only for the repository itself, never as the controlling subscription-entitlement source.

For legal and policy boundaries:

1. Applicable Anthropic legal terms and Usage Policy.
2. Destination platform's official policy, such as X's Automation Rules.
3. No practitioner post can override either policy layer.

For reusable code/content:

1. Exact license file at the exact repository revision and path.
2. Directory-level license or README notice where it explicitly narrows the root license.
3. If no clear license is present, the default audit disposition is no copying, modification, bundling, or redistribution.

For business outcomes:

1. Independent records would be required for verification.
2. An original practitioner post receives at most self-report status.
3. An inaccessible post, extrapolation, or unsupported promotional number cannot support a course claim.

### 3.2 Inference controls

The review prohibited these common inference jumps:

- product capability -> customer demand;
- customer demand -> sustainable profit;
- revenue -> profit;
- a payment integration -> correct billing or production readiness;
- a public post -> permission to reproduce its media;
- a repository root license -> permission for all dependencies, media, data, marks, and subdirectories;
- output ownership between contracting parties -> copyrightability, originality, accuracy, or non-infringement;
- an accessible original X post -> independently verified outcome;
- many commits or fast generation -> customer value, security, or maintainability;
- automated action -> platform permission or user consent.

## 4. Official-source access log

Official sources below were accessed or directly inspected through their live public page/indexed live content on 2026-08-23, with Skills, Artifacts, and Cowork safety rechecked on 2026-08-24. The companion report contains the claim-level interpretation, evidence grade, volatility, and limitations.

| ID | URL | Retrieval outcome | Used for |
|---|---|---|---|
| O1 | https://academy.claude.com/courses/ai-fluency-for-small-businesses | Retrieved | 4D workflow framing, realistic expectations, data hygiene, human responsibility; not income evidence |
| O2 | https://academy.claude.com/courses/claude-101/working-with-skills | Retrieved | Current all-plan Skills wording, execution prerequisite, organization control, trusted-source inspection |
| O3 | https://academy.claude.com/courses/claude-code-101 | Retrieved | Agentic workflow, permissions/review/context, and evidence that older mode language persists |
| O4a | https://academy.claude.com/claude/use-cases | Retrieved | Official workflow examples, not market validation |
| O4b | https://academy.claude.com/products/cowork/use-cases | Retrieved | Official Cowork workflow examples, not market validation |
| O5 | https://support.claude.com/en/articles/9517075-what-are-projects | Retrieved | All-user Projects availability, Free maximum of five, paid enhanced retrieval, sharing distinctions |
| O6 | https://support.claude.com/en/articles/12512180-use-skills-in-claude | Rechecked 2026-08-24 | All-plan listing, required Code execution and file creation setting, and organization/admin caveats for Skills |
| O7 | https://support.claude.com/en/articles/9487310-what-are-artifacts-and-how-do-i-use-them | Rechecked 2026-08-24 | Artifact types and flows, required Code execution and file creation setting, and no payment feature |
| O8 | https://support.claude.com/en/articles/11088861-use-research-on-claude | Retrieved | Paid-plan Research availability, web/desktop/mobile, web-search dependency, `+` composer entry path, usage-limit caveat |
| O9 | https://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities | Retrieved | Connector permissions, read/write risk, organization action controls, third-party infrastructure and privacy caveats |
| O10 | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices | Retrieved | Clear/direct prompts, context, examples, constraints, structured tags |
| O11 | https://platform.claude.com/docs/en/about-claude/models/optimizing-for-cost-and-intelligence | Retrieved | Caching, token hygiene, prompt audits, model/effort selection, spend limits, Batch 50%/up-to-24-hours condition, own-workload measurement |
| O12 | https://www.anthropic.com/legal/commercial-terms | Retrieved | Governing-scope boundary, products/services use, inputs/outputs allocation, verification duty, policy compliance, resale/competition restriction, indemnity limits |
| O13 | https://www.anthropic.com/legal/consumer-terms | Retrieved regional page | Evidence that consumer and commercial/API terms differ and that account/region scope must be preserved |
| O14 | https://www.anthropic.com/legal/aup | Retrieved | Spam/scam/deception/fake-review/plagiarism/circumvention boundaries, high-risk safeguards, AI disclosure duties |
| O15 | https://help.x.com/en/rules-and-policies/x-automation | Retrieved | API/site-scripting boundary, owner responsibility, duplicate/spam prohibition, consent/opt-out, reply/DM restrictions, prior written approval for AI reply bots |
| O16 | https://claude.com/blog/auto-mode-default-in-claude-code | Retrieved | Dated Auto mode default rollout for new Pro/Max/Team sessions and continuing human-review risk |
| O17 | https://code.claude.com/docs/en/auto-mode-config | Retrieved | Current classifier and allow/ask/deny behavior, configuration scope, durable rules, compaction caveat |
| O18 | https://support.claude.com/en/articles/13364135-use-claude-cowork-safely | Retrieved 2026-08-24 | Cloud processing, prompt-injection risk, approval modes, computer-use boundary, and permanent-deletion permission |

### 4.1 Official-source temporal notes

- Help Center and product documentation are high-volatility operational sources. Their claims are valid only for the audit date and the plan/client scope stated in the source.
- Legal terms and Usage Policy are lower-volatility than click paths but can change by effective date, product, and region. The live terms governing the learner's actual account control.
- Academy material is authoritative training guidance, but it can lag a recent product rollout. That occurred in the Auto mode terminology reconciliation.
- No official source reviewed claims that Artifacts pay creators or that using Claude produces income.

## 5. Repository access and license log

Repositories were inspected through their public GitHub pages on 2026-08-23. The audit recorded the visible repository license/status, but it did not clone or create a dependency/software-bill-of-materials audit. Before copying any file, the course publisher must pin an immutable commit and confirm the license at that exact path.

| ID | URL | Retrieval outcome | License/status observed | Provenance disposition |
|---|---|---|---|---|
| G1 | https://github.com/anthropics/skills | Retrieved | Explicitly mixed: many examples Apache 2.0; document Skills identified as source-available rather than open source | Use for structure and official examples; inspect each Skill directory before reuse. Repository plan wording does not control current entitlement. |
| G2 | https://github.com/coreyhaines31/marketingskills | Retrieved | MIT displayed | Artifact/pattern evidence only. Creator business links and results are outside the repository license and not verified. |
| G3 | https://github.com/thatrebeccarae/claude-marketing | Retrieved | MIT displayed | Skill catalog is inspectable. Client-origin, test-count, and timing statements are creator self-report. |
| G4 | https://github.com/houtini-ai/seo-audit | Retrieved | Apache 2.0 displayed | Architecture/check registry is inspectable. Speed, traffic, and business-value statements are self-report. |
| G5 | https://github.com/remotion-dev/skills | Retrieved | No repository license observed during audit | Link/inspect only. No copying, modification, bundling, or redistribution until permission is established. |
| G6 | https://github.com/wasp-lang/open-saas | Retrieved | MIT displayed | Scaffold existence only; authentication/payment components do not prove secure, correct, or profitable operation. |
| G7 | https://github.com/jonradoff/lastsaas | Retrieved | MIT displayed | Scaffold existence is inspectable; Claude-only origin, time, and production-readiness language remain creator assertions. |
| G8a | https://github.com/shotgun-sh/shotgun | Retrieved | MIT displayed | Supports a spec-driven/research-first pattern, not independent performance or security claims. |
| G8b | https://github.com/shotgun-sh/shotgun/blob/main/docs/CASE_STUDY.md | Retrieved | File within repository at audited branch; exact commit not pinned | Vendor-authored case report. Rapid-build, first-customer, time-saving, revenue, and security language remains Grade C. |

### 5.1 License control required before publication

For every repository-derived course asset, create a separate asset record containing:

- repository owner/name;
- immutable commit hash;
- exact file path;
- exact license file and version;
- copyright holder and required notice;
- modifications made;
- bundled dependencies or copied third-party material;
- trademark/media/data exclusions;
- permission evidence if no clear license exists; and
- location of attribution in the course.

The companion report does not itself grant permission. A GitHub “public” repository and an open-source license are different facts.

## 6. X practitioner access log

X retrieval was inconsistent. Where the original post text was available through the public page or indexed result, the source was graded as attributable self-report only. Where the content could not be reproduced, the result was graded D and blocked. No screenshot, video, avatar, or other X media was downloaded or reused.

| ID | URL | Current retrieval outcome, superseding the 2026-08-23 description where noted | Permitted evidentiary use |
|---|---|---|---|
| X1 | https://x.com/degensing/status/2026578817016566047 | 2026-08-24 official oEmbed exposes only a media link | Grade D. No factual lesson or assessment use. |
| X2 | https://x.com/codyschneider/status/2026009180763554234 | 2026-08-24 official oEmbed returns the attributed team AI-analyst statement | Grade C only for Claude Code, Cowork, iOS, dashboard, sales-forecasting, and blog-post-content improvement self-report; no attached-media use. |
| X3 | https://x.com/samrags_/status/2016267562057662745 | 2026-08-24 official oEmbed truncates before durable-handoff details | Grade D. No goal-file, output-file, one-objective-per-chat, comparative, or income use. |
| X4 | https://x.com/elvissun/status/2025044631407468689 | 2026-08-24 official oEmbed supports triple billing totaling $240 attributed to code written with Claude Code | Grade C caution only. It does not identify Stripe or establish a refund outcome. |
| X5 | https://x.com/wcandillon/status/2015345960491069718 | 2026-08-24 official oEmbed says the output was made entirely with Remotion | Grade C output evidence only. The recoverable text does not mention Claude, a client, or revenue. |
| X6 | https://x.com/adiix_official/status/2034730013283512381 | Direct access error; detailed claim not independently recovered | Exclude outcome and extrapolation claims. |
| X7 | https://x.com/levikmunneke/status/2035123865463267798 | Direct page returned no usable detailed content | Exclude projection and outcome claims. |
| X8 | https://x.com/AlexBelogubov/status/2041451718127354053 | Original long-form content recovered | At most, attribute it as a prohibited-practice warning. Do not reproduce or teach evasion workflow details as a success method. |
| X9 | https://x.com/noisyb0y1/status/2040723475124408393 | Indexed claim recovered without supporting records or reproducible method | Exclude as income evidence. It is an unsupported promotional claim. |

### 6.1 X retrieval failures and fallback boundary

Direct X pages sometimes returned HTTP errors or empty content. Official oEmbed produced usable but sometimes truncated text for X2, X4, and X5, only a media link for X1 and X6, and text truncated before the disputed details for X3. The audit did not use a repost, paraphrase, screenshot OCR, or third-party summary to fill the gaps, because doing so would obscure authorship, deletion/edit state, and context. This is why X1, X3, X6, and X7 are blocked rather than reconstructed from the draft course context.

### 6.2 Self-report validity boundary

For X2, X4, X5, and X8, retrieval establishes only that an attributable public account made the recoverable statement. It does not establish:

- identity verification beyond the public account;
- completeness of costs or failures;
- customer consent;
- compliance with all applicable terms and laws;
- realized versus projected income;
- revenue net of refunds, fees, tax, labor, support, or acquisition;
- causal impact of Claude;
- typicality or repeatability; or
- authenticity/licensing of attached media.

## 7. Conflict-resolution log

| Conflict | Sources compared | Resolution rule | Final decision |
|---|---|---|---|
| Skills plan availability | Current Skills Help and Academy pages versus `anthropics/skills` README “paid plans” wording | Use current user-facing entitlement sources for plan facts; restrict repository evidence to repository contents | Teach all five plans with execution/admin/date caveats; identify repository wording as stale or narrower, not controlling |
| Free Projects limit | Current Projects Help article versus possible older “paid-only” course language | Use current Help article | Free users: maximum five Projects; enhanced retrieval paid |
| Research UI location | Current Research Help article versus possible sidebar instructions | Use current click path | `+` at lower-left of composer, then Research; web search on; paid plans |
| Artifact “publish” meaning | Current Artifacts Help article versus monetization inference | Require explicit support for payment/revenue feature | Publish means share/discover/embed in documented flow; no verified native payment or payout |
| Claude Code permission modes | Older Academy mode language versus 2026-08 blog and current Auto mode docs | Newer technical docs and rollout announcement control current behavior | Date-stamped new-session default for Pro/Max/Team, with configuration/admin/provider caveats and continuing review |
| Output ownership | Commercial Terms ownership allocation versus “safe to sell anything” inference | Preserve contracting scope and all explicit/implicit limitations | Ownership between parties, to extent permitted by law; no originality, copyrightability, accuracy, non-infringement, or third-party-license guarantee |
| API savings | Technical guide's Batch API statement versus profit claim | Preserve latency condition and cost scope | 50% API-cost reduction for eligible delayed work, not 50% total-cost or profit guarantee |
| Commercial use | Commercial Terms product/service use versus unrestricted “anything for money” claim | Apply Commercial Terms, AUP, service-specific terms, destination-platform policy, and law together | Commercial workflows are conditional; spam, deception, evasion, plagiarism, and unreviewed high-risk use remain disallowed/restricted |
| X automation | Practitioner growth tactics versus X Automation Rules and Anthropic AUP | Platform and provider policies control | Exclude unsolicited automation, site scripting, bulk replies/DMs, evasion; AI reply bots need prior written X approval |
| Repository reuse | Visible repository content versus assumed public-domain status | Exact path/revision/license controls | Mixed/no-license content blocked; licensed code requires notices and third-party review |
| Practitioner income | Original posts versus independent financial evidence | Self-report never becomes verified merely by accessibility | Attribute narrow workflow lessons; reject causal, typical-results, and profit conclusions |

## 8. Legal, policy, and rights caveats

This audit summarizes public terms for editorial accuracy and is not legal advice. A publisher should obtain qualified advice for the jurisdictions, account type, taxes, consumer-protection rules, privacy obligations, licensing, and regulated industries actually in scope.

Specific rights boundaries preserved in the companion report:

- Anthropic's Commercial Terms apply only when they govern the offering in use.
- The allocation of output rights is between the contracting parties and limited by applicable law.
- A customer cannot assign rights it does not have in an input or third-party component.
- Platform terms, privacy law, anti-spam law, professional rules, customer contracts, and open-source licenses operate in addition to Anthropic's terms.
- Publicly viewable X posts and screenshots are not assumed licensed for course reproduction.
- No X media was copied into these artifacts.
- No repository was treated as public domain.

## 9. Reproducibility instructions for the release editor

Before publishing the course, repeat this check in a clean browser session:

1. Open O5, O6, O7, O8, O11, O12, O14, O15, O16, and O17 from their canonical URLs.
2. Record the page title, displayed update/effective date, plan/client/region scope, and relevant paragraph in a dated source ledger.
3. Compare every course sentence that mentions plan availability, numeric limits, click paths, ownership, cost, publishing, automation, or safety against the live paragraph.
4. Log discrepancies as blocking, even if the course copy was correct in this 2026-08-23 snapshot.
5. Capture real Claude UI only after the copy is reconciled. Use an authorized course-owner account and synthetic/redacted data.
6. For repository assets, replace branch URLs such as `/main/` with immutable commit URLs and archive the applicable license/notice record.
7. For any X anecdote retained, re-open the original post, confirm that it still exists and has not materially changed, label it “self-reported,” and avoid reproducing media unless permission is documented.
8. Test the final deployed course, not only the source repository: links, figures, captions, alt text, plan labels, disclosures, quiz keys, and mobile rendering.

Because the course concerns monetization, a release re-check is recommended immediately before publication and whenever Anthropic changes plans, pricing, Auto mode, Artifacts, Research, Skills, terms, or the Usage Policy.

## 10. Quality-control checklist completed for this audit

- [x] Primary Anthropic sources used for product, technical, terms, and policy facts.
- [x] X's own policy used for X automation rules.
- [x] Skills availability conflict explicitly reconciled.
- [x] Free-plan Project maximum recorded.
- [x] Research click path and plan boundary recorded.
- [x] Artifact publishing/payment misconception rejected.
- [x] Claude Code Auto mode change reconciled against newer sources.
- [x] Output ownership narrowed to contractual scope and limitations.
- [x] API cost optimization separated from total cost and profit.
- [x] Commercial-use permission separated from AUP/platform/legal compliance.
- [x] Repository license scope reviewed and mixed/no-license cases blocked.
- [x] Practitioner reports separated from verified outcomes.
- [x] Inaccessible X claims were not reconstructed as facts.
- [x] Real-UI screenshot privacy, date, plan, rights, and authenticity controls specified.
- [x] Fail-closed claim ledger and release blockers included in the companion report.

## 11. Provenance conclusion

The source set is sufficient to correct the course's product, terms, policy, and evidence-framing errors. It is not sufficient to substantiate a promise of income, typical financial results, or the detailed outcomes of inaccessible practitioner posts. The companion report therefore records a **HOLD** decision until factual corrections, rights checks, dated real-UI recaptures, and published-build QA are complete.

## 12. Current-source provenance addendum, 2026-08-24

This addendum supersedes the 2026-08-23 X1 through X5 retrieval descriptions,
not the historical HOLD decision. Current official oEmbed responses support the
narrow dispositions in the table above. Degen Sing and Sam Ragsdale are Grade D
and barred from instruction and assessment; Cody Schneider, Elvis Sun, and
William Candillon remain Grade C only for their explicitly recoverable public
self-reports. No X media was downloaded, reproduced, or used to fill missing
text.
