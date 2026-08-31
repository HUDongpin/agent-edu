# Course 20 synthetic lab notice

The committed recipe, segment descriptions, captions, policy, schemas, documentation, and two small frozen synthetic MP4 controls in this directory were authored for Course 20. The repository does not bundle third-party footage, music, fonts, people, personal data, model output, or credentials.

The executable starter requires a locally installed `ffmpeg` and `ffprobe`. Those programs are not copied into this course package and remain subject to the terms of the learner's installed build. The lab invokes them offline through Node's argument-array process API with `shell: false`.

The public contracts and frozen media form a hash-identified teaching snapshot. Their hashes can detect drift against a trusted copy; hashes do not prove authorship, authenticity, media rights, legal clearance, or chain of custody. Frozen MP4 hashes bind the committed bytes and producing build; rebuilds are checked structurally and are not claimed to be byte-identical across FFmpeg versions or platforms.

`edit-plan.v2` is retained only as a historical concept in course records. The starter neither migrates nor executes v2 plans. Learners must build and validate a new v3 plan explicitly.

## 中文

本目录提交的 recipe、片段描述、字幕、政策、schema、说明与两个小型冻结 MP4 控制文件均为课程 20 原创内容。仓库不捆绑第三方影像、音乐、字体、人物、个人资料、模型输出或凭据。

starter 需要学习者本机已安装 `ffmpeg` 与 `ffprobe`；课程包不会复制这些程序，其许可证取决于学习者安装的 build。实验只通过 Node 参数数组、`shell: false` 的离线进程调用它们。

公开合同和冻结媒体构成由 hash 标识的教学快照。hash 只能相对于可信副本发现漂移，不能证明作者身份、真实性、媒体权利、法律许可或保管链。冻结 MP4 hash 绑定提交字节与生成 build；其他 FFmpeg build 的重建只要求结构一致，不声称逐位相同。

`edit-plan.v2` 只作为历史概念保留；starter 不会迁移或执行 v2，学习者必须显式构建并验证新的 v3 计划。
