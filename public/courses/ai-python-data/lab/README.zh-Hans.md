# Course 18 离线实验与毕业项目包

课程合同：`ai-python-data` / `2026.08.26-v1`  
毕业项目：`2026.08.26-capstone-v1`  
校验器：`aicourse.ai-python-data.validator.v1`

本实验包使用上一级目录中随课程发布的原创虚构 fixture，建立可复现的教育数据审计。它不会连接网络、读取真实学习者数据、调用付费 API，也不要求远程托管 notebook。规范 runner 使用 Python 3.11+ 且只依赖标准库。`audit.ipynb` 是同一 runner 的展示界面；Jupyter 是可选工具，不会被静默安装。

## 文件

- `environment.lock.json` 与 `requirements.lock` 声明 runtime、随机种子、notebook 格式及零第三方 runtime 依赖。
- `audit.ipynb` 是有序 notebook 交接文件；`run_notebook.py` 无需安装 Jupyter，即可在全新 namespace 中执行它的两个代码单元。
- `run_audit.py` 是 notebook 的分析库：它核验 fixture 哈希、验证锁定 schema、保留缺失信息、连接锁定 lookup、计算固定种子的描述性不确定性，并写出原创 SVG 与八项产物档案。
- `capstone.schema.json` 固定课程、课程版本、毕业项目版本、校验器 ID 与确切产物 ID。
- `submission.template.json` 是此 schema 专用的空白产物模板。空占位符不能通过验证。
- `validate.py` 验证档案，并核对引用文件及其哈希。它不会把通过验证误写成部署许可。

请保持目录结构不变，使 `lab/` 与三个 fixture 文件处于相邻层级。

## 全新离线运行

在本 `lab` 目录中运行：

```sh
python3 run_notebook.py --output-dir work
python3 validate.py --package work/submission.generated.json
```

第二条命令必须输出：

```text
aicourse.ai-python-data.validator.v1: PASS
```

生成文件属于学习者作品，发布的静态课程载荷不会包含这些文件。删除 `work/` 可以证明能够全新重跑。已签入的源文件是不可变输入；不要用生成结果覆盖它们。

## 必做负向检查

复制生成的 submission，然后修改 `courseVersion`、删除一项产物、更改产物 ID，或在记录哈希后编辑输出。校验器必须以非零状态退出。例如：

```sh
cp work/submission.generated.json work/submission.mutated.json
python3 -c 'import json; p="work/submission.mutated.json"; d=json.load(open(p)); d["courseVersion"]="wrong"; open(p,"w").write(json.dumps(d))'
python3 validate.py --package work/submission.mutated.json
```

## Notebook 运行方式

如果本机已经安装 Jupyter，可以在此目录离线启动它，并从全新 kernel 运行全部单元。notebook 会导入 `run_audit.py` 与 `validate.py`；其分析 runtime 仍只使用标准库。权威的零依赖复现命令仍是上面的 `run_notebook.py` 全新运行，它会在全新 namespace 中执行同一组已签入代码单元。

## 证据与决定边界

所有记录与 cohort 名称均为虚构。校验通过只说明这份确切的本地档案符合已声明的结构与计算检查；它不能证明代表性、因果识别、公平、隐私合规、关于真实学习者的事实或部署授权。提交毕业项目前，人类审查者必须至少质疑一条清洗规则、一个统计假设、一项图表选择和一条无支持的现实主张；最终决定必须保持为 `no-deploy`。

