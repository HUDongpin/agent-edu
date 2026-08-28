# Course 22 public-fixture notice / 课程 22 公开 fixture 声明

The files in this directory are original fixtures authored for the aicourse.top course **How to Edit Video with Agents / 如何使用智能体进行视频剪辑**. They teach a fail-closed workflow for a fictional scenario. The `lab/fixtures/guided-v2` package includes only course-generated color video, tone audio, CPU-rendered variants, fictional transcript text, and a course-authored WebVTT caption. It contains no personal data, private project, credential, provider/model output, third-party code or media, copied prompt, screenshot, X/Twitter media, or GitHub example asset.

本目录文件是为 aicourse.top 课程 **How to Edit Video with Agents / 如何使用智能体进行视频剪辑** 原创制作的 fixture，用于讲授虚构场景中的 fail-closed 工作流。`lab/fixtures/guided-v2` 只包含课程生成的色块视频、音调音频、CPU 渲染版本、虚构转录文字与课程原创 WebVTT 字幕；不包含个人信息、私有工程、凭据、服务商/模型输出、第三方代码或媒体、复制提示词、截图、X/Twitter 媒体或 GitHub 示例资产。

## What the repository license covers / 仓库许可证覆盖范围

The repository's MIT license covers these original fixture texts and schemas. It does **not** relicense any upstream repository, software binary, codec, model, hosted service, post, demonstration, brand, or media item. Every upstream link remains subject to its own license, terms, privacy policy, and rights context. A missing upstream license is not permission; sources recorded as `link-and-paraphrase-only` are linked and summarized without copying their code or media.

仓库 MIT 许可证覆盖这些原创 fixture 文本与 schema，但**不会**重新许可任何上游仓库、软件二进制、编解码器、模型、托管服务、帖子、演示、品牌或媒体项目。每个上游链接仍受其自身许可证、条款、隐私政策与权利语境约束。上游许可证缺失不等于获得许可；标记为 `link-and-paraphrase-only` 的来源只做链接和转述，不复制其代码或媒体。

## Media and publication boundary / 媒体与发布边界

The top-level fictional manifest deliberately records absent media, absent hashes, and unknown rights, so its decision is quarantine. Separately, the guided lab ships only hash-bound course-owned synthetic media and always remains blocked from publication. Neither fixture authorizes learner media use. Before using any real material, the learner must establish ownership or permission, allowed uses, territory, term, attribution, consent, privacy handling, model/provider terms, and the exact destination. Access to a file, transcript, repository, API, or public post does not supply those rights.

顶层虚构清单刻意记录素材缺失、摘要缺失与权利未知，因此决定为隔离。与之分离的 guided lab 只提供由摘要绑定的课程自有合成媒体，而且始终禁止发布；两类 fixture 都不授权使用学习者素材。使用任何真实素材前，学习者必须确认所有权或许可、允许用途、地域、期限、署名、同意、隐私处理、模型/服务商条款与准确发布目的地。能够访问文件、转录、仓库、API 或公开帖子，不代表获得这些权利。

The edit-plan schema enforces plan-local shape, non-destructive output, dry-run review, input identity fields, and evidence-linked operations. A separate semantic validator must resolve references, recompute hashes, verify ranges and timeline arithmetic, and enforce realpath/symlink containment. Approval and release live in separate hash-bound human records; they are never fields that let a mutable plan approve itself. A schema-valid plan still does not authorize an edit. A successful render, assessment score, automated metric, or agent recommendation does not authorize publication. Only a named human, acting within documented authority, may approve the exact final candidate; **do not publish / 不发布** remains a valid and often necessary outcome.

剪辑计划 schema 只强制计划内部形状、非破坏性输出、dry-run 审查、输入身份字段与带证据引用的操作。独立语义 validator 必须解析引用、重算 hash、验证区间与时间线算术，并在执行环境检查 realpath/symlink 范围。批准与发布位于独立、由 hash 绑定的人工记录中，不能让可变计划自我批准。通过 schema 验证的计划仍不构成剪辑授权。渲染成功、测验分数、自动指标或智能体建议都不构成发布授权。只有在有记录权限范围内行动的具名人类，才能批准准确的最终候选成片；**不发布 / do not publish** 始终是有效且常常必要的结果。

## Verification / 验证

`fixtures.provenance.json` binds the top-level original public files to SHA-256 digests; the guided project ledger separately binds every lab media, artifact, caption, probe record, and output byte. The Course 22 release gate rejects missing, extra, symbolic-linked, malformed, stale, or rights-ambiguous assets, and the post-build static check confirms that the same bytes were copied to the static export. These checks establish repository integrity only; they do not authenticate learner-media rights or a reviewer, judge audiovisual meaning, or approve release.

`fixtures.provenance.json` 用 SHA-256 绑定顶层原创公开文件；guided project ledger 另行绑定 lab 中每项媒体、产物、字幕、探测记录与输出字节。课程 22 发布门禁会拒绝缺失、多余、符号链接、格式错误、过期或权利边界不清的资产；构建后静态检查还会确认同一字节已复制到静态导出。这些检查只建立仓库完整性，不认证学习者素材权利或 reviewer 身份，不判断视听含义，也不批准发布。
