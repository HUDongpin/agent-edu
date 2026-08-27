# Course 19 离线机器学习实验与毕业项目包

课程合同：`machine-learning` / `2026.08.26-v1`  
毕业项目：`2026.08.26-capstone-v1`  
校验器：`aicourse.machine-learning.validator.v1`

本实验包把必做的“学生支持风险模型”毕业项目实现为小型、可检查的 CPU 管线。它只使用上一级目录中的两个原创虚构 fixture：锁定为 20/5/5 切分的 30 行表，以及包含 14 个事件的推荐日志。它不使用网络、付费 API、远程托管 notebook、远程模型、真实学习者记录或由平台保管的 API key。

规范实现刻意只使用 Python 标准库：仅在训练集学习预处理、确定性的 batch-gradient 逻辑回归、训练集 prevalence baseline、只用 validation 做选择、冻结选择后只打开一次 holdout、Brier/log-loss/confusion 指标、校准分箱、虚构 cohort 错误切片、model card，以及强制的 `no-deploy` 决定。课程不要求 scikit-learn。可选重写只有在保持确切切分、随机种子、特征排除、指标合同与 no-deploy 边界时才可使用它。

## 文件

- `environment.lock.json` 与 `requirements.lock` 固定离线 CPU runtime 和模型参数。
- `run_pipeline.py` 核验全部 fixture 哈希、验证锁定切分、拟合模型、审计推荐事件的曝光边界，并生成两个带哈希输出与八项产物档案。
- `capstone.schema.json` 固定课程、版本、校验器 ID 与确切产物 ID。
- `submission.template.json` 是此 schema 专用的空白产物模板。空占位符不能通过验证。
- `validate.py` 独立地把预测重新绑定到 fixture 的 record/partition/cohort/target 值，重算 baseline 与模型指标、核对哈希，并强制执行 no-deploy 与人工权限合同。

请保持 `lab/` 与上一级 fixture 文件相邻。

## 全新离线运行

在本 `lab` 目录中运行：

```sh
python3 run_pipeline.py --output-dir work
python3 validate.py --package work/submission.generated.json
```

校验器必须输出：

```text
aicourse.machine-learning.validator.v1: PASS
```

删除 `work/` 后重复运行，以验证全新重跑。生成输出属于学习者作品，不包含在发布的静态课程载荷中。

## 必做负向检查

修改一个已绑定字段，并证明系统以失败即关闭方式处理。例如：

```sh
cp work/submission.generated.json work/submission.mutated.json
python3 -c 'import json; p="work/submission.mutated.json"; d=json.load(open(p)); d["artifacts"][-1]["content"]["decision"]="deploy"; open(p,"w").write(json.dumps(d))'
python3 validate.py --package work/submission.mutated.json
```

最后一条命令必须以非零状态退出，并指出 no-deploy 合同失败。等价负向测试可以修改 `courseId`、`courseVersion`、产物 ID、预测 target，或在记录哈希后更改引用文件。

## 审查与权限边界

固定 fixture 只用于教授机制。它的 cohort 是任意颜色词，不是真实群体或受保护群体。小群体指标不是公平证据；看似校准的分数不是总体校准；结果也不是经过验证的构念。任何分数或标签都不得直接触发处分、排名、分流、支持分配、画像、联系学习者或其他有后果的行动。合格人类必须保留事前批准、override、停止、升级与申诉权限。毕业项目要求的决定是 `no-deploy`。

