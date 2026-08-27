# Course 16 离线治理工作室

本实验包是原创、虚构且仅限本地运行的练习。它绝不授权真实部署，也不能证明法律合规、安全、公平或有效性。

## 运行正向对照

```sh
python public/courses/responsible-ai/lab/validate.py --package public/courses/responsible-ai/lab/governance-dossier-example.json
```

命令必须报告 `"ok": true`、`aicourse.responsible-ai.capstone.v1` 和 `aicourse.responsible-ai.validator.v1`。

## 建立你的治理档案

1. 把 `governance-dossier-template.json` 复制到仓库外或你自己的工作目录中。
2. 在解释 fixture 前，先核验它的 SHA-256。
3. 完成全部九项产物。每项产物都必须包含负责人、可审查证据和至少一项局限。
4. 保留六个规范的 Responsible AI 标准 ID，并记录有明确边界的决定。
5. 用校验器检查你的包。把校验器输出的 `packageSha256` 用于浏览器证据收据；绝不要把机密材料粘贴到网站中。

## 负向对照

运行未经修改的模板。由于 draft、owner、evidence 和 limitation 字段尚未完成，它必须失败：

```sh
python public/courses/responsible-ai/lab/validate.py --package public/courses/responsible-ai/lab/governance-dossier-template.json
```

