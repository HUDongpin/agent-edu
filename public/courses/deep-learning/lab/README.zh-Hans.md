# Course 20 离线神经训练实验与毕业项目包

课程合同：`deep-learning` / `2026.08.26-v1`  
毕业项目合同：`2026.08.26-capstone-v1`  
校验器：`aicourse.deep-learning.validator.v1`

本实验包在 `../fixtures/` 的 12 条原创合成记录上运行确定性的纯 CPU 学习实验。它比较可审计的方向规则 baseline 与手写 16–4–1 神经网络，记录完整里程碑日志，评估干净及变换后的错误切片，运行匹配的无 bias 消融，并生成全部八项毕业项目产物。它不使用网络、付费 API、远程 notebook、GPU、真实人员数据或第三方 runtime package。

必做实验刻意保持微型。它用于学习 tensor、gradient、training loop、鲁棒性、消融、证据与审查机制，不能证明深度学习在真实图像上的表现。GPU 或 framework 实验只是可选扩展，不能代替参考 CPU 收据。

## 文件与固定合同

- `environment.lock.json` 与 `requirements.lock` 记录确切参考 runtime、随机种子、架构、epoch 和零第三方依赖。
- `run_experiment.py` 核验 fixture bytes，训练两种参考配置，写出三个确定性证据文件，并组装八项产物 submission。
- `capstone.schema.json` 固定课程、课程版本、毕业项目版本、校验器 ID、产物 ID 及课程专用内容要求。
- `submission.template.json` 是故意不完整的创作模板；只有用真实生成证据替换占位符后才可能通过。
- `validate.py` 拒绝错误版本、错误或缺失产物、缺失证据、被修改的生成文件、数值漂移、虚假 GPU 必需条件，以及缺少人类 no-deploy 边界的包。
- `test_lab.py` 证明全新运行与正向验证通过，然后依次修改版本、产物集合、产物 ID、训练证据与生成文件；每一种修改都必须失败。

## 全新离线运行

在本 `lab/` 目录中运行：

```sh
python3 run_experiment.py --output-dir work
python3 validate.py --package work/submission.generated.json
python3 test_lab.py
```

校验器会输出：

```text
aicourse.deep-learning.validator.v1: PASS
```

`work/` 是学习者输出，发布包不会包含它。你可以随时删除它，并从已签入源文件重新运行。不要用生成输出覆盖 fixture 或源脚本。

## 证据与权限边界

成本/能耗记录是确定性的逻辑运算代理，不是物理功耗测量或碳排估算。切片名称描述合成变换，不代表受保护群体。校验通过只证明字节绑定、结构完整、确定性参考计算及独立审查收据存在；它不能证明真实数据上的准确性、公平、未测试领域的鲁棒性、安全、认证或训练/部署许可。随附参考决定为 `no-deploy`。

