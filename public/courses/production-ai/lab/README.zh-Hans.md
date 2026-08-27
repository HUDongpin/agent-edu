# Course 21 离线双系统生产实验与毕业项目包

课程合同：`production-ai` / `2026.08.26-v1`  
毕业项目合同：`2026.08.26-capstone-v1`  
校验器：`aicourse.production-ai.validator.v1`

本实验包只使用 Python 标准库运行两个真实的本地 HTTP 服务：

1. 确定性的预测路由服务；
2. 基于 `../fixtures/dual-system-operations-v1.json` 中获准虚构文档的确定性检索增强回答服务。

`run_capstone.py` 把两个 server 绑定到 `127.0.0.1` 的临时端口，发送真实 JSON 请求、记录响应，主动注入数值特征分布漂移与受污染检索 index，分别计算质量、支持性、trace、成本与延迟预算信号，触发告警，执行两个已声明回滚目标，验证恢复，并写出全部十项毕业项目产物。它不连接外部网络、不使用付费 API、不读取真实记录、不加载密钥，也不会为静态网站增加 server 依赖。

## 文件与固定合同

- `environment.lock.json` 与 `requirements.lock` 记录确切参考 runtime 及零第三方依赖。
- `services.py` 包含本地预测与 RAG HTTP handler。可以用它的 `--service` 模式做人工检查。
- `run_capstone.py` 编排干净流量、两种故障注入、告警、回滚、恢复验证与证据生成。
- `capstone.schema.json` 固定课程、版本、校验器、确切十项产物 ID、两个服务种类、两个注入 ID 与 no-deploy 边界。
- `submission.template.json` 是不完整的创作模板，本身不能通过验证。
- `validate.py` 重算固定证据，并拒绝错误版本、缺失或改名产物、缺失 HTTP transcript、缺失退化、缺失告警/回滚、被修改的输出 bytes，以及未以 `no-deploy` 结束的治理审批。
- `test_lab.py` 先执行全新运行和正向验证，再执行破坏性的版本、产物、drift、rollback 与输出哈希修改；每一种修改都必须失败。

## 全新离线运行

在本 `lab/` 目录中运行：

```sh
python3 run_capstone.py --output-dir work
python3 validate.py --package work/submission.generated.json
python3 test_lab.py
```

校验器会输出：

```text
aicourse.production-ai.validator.v1: PASS
```

两个 listener 只在 runner 活动期间存在，并且只接受本机连接。`work/` 是学习者输出，发布包不会包含它。

## 可选的人工服务检查

可以逐一启动服务，在本机检查：

```sh
python3 services.py --service predictive --port 8765
python3 services.py --service rag --port 8766
```

不要把这些教学服务暴露给其他主机。它们是刻意保持极简的 fixture，不是经过加固的应用服务器。

## 证据与权限边界

所有系统、版本、请求、文档、事件、成本、标签与决定均为虚构。逻辑延迟与成本单位是确定性教学信号，不是实际生产用时或账单。本练习只证明已声明的本地机制能够检测两种人工设计的退化，并核验两种人工设计的回滚；它不能证明真实可靠性、安全、隐私、公平、法律合规、环境影响、模型质量或部署准备度。通过验证的包必须以有时限的 `no-deploy` 决定结束，不能通过重命名字段把它变成生产批准。

