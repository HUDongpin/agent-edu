# 第20课 v2：离线、可执行的深度学习证据

状态：**发布 HOLD**。只有具名真人对当前精确版本完成英文与简体中文术语、语义一致性和技术准确性复核后，才可解除阻断；自动检查不能代签。

## 这个实验包能证明什么

纯标准库 `run_experiment.py` 仅是 M1–M4 的 foundation reference，只能返回 `REFERENCE_PASS`、`capstoneEligible=false`、`independentReviewComplete=false` 与 `decision=no-deploy`。

必做 PyTorch 路径会在 CPU 上真实执行十二个模块的关键能力：

- tensor/view/broadcast/计算图与解析—autograd—有限差分检查；
- 单批过拟合、故障测试与 checkpoint/resume 等价性；
- 三种子 LayerNorm 消融；
- linear/CNN/residual 对照与四种迁移策略；
- RNN/LSTM padding、状态重置及未见长度测试；
- scaled dot-product attention、mask 与扰动负例；
- 训练微型 Transformer，并执行 causal future-token leakage 回归；
- 多文字 NFKC tokenizer 与语料权利审计；
- 训练 rank-2 LoRA 并验证 merge 等价性；
- 鲁棒性、资源与 no-deploy dossier 草案。

PASS 只支持这些原创合成机制任务，不证明外部效度、公平、安全、审核者身份、实验包之外的数据权利或训练/部署授权。

## 锁定运行环境

- CPython 3.11.15
- PyTorch 2.13.0
- NumPy 2.4.1
- CPU、单 Torch 线程、确定性算法、运行时无网络
- 完整必做运行预算：不超过10分钟、峰值内存不超过2 GiB

`environment.lock.json` 记录 macOS arm64 参考 wheel 的精确哈希和依赖树。其他平台必须记录自己的 wheel 哈希，不能用 macOS 哈希冒充跨平台证据。

## 运行与验证

请先完成 `readiness.template.json`。`validate_readiness.py` 会检查矩阵乘法、广播、偏导数、chain rule、稳定 softmax、训练/验证/测试边界，以及 Python 单元测试收据。任何缺失都会返回 `BRIDGE_REQUIRED`；readiness 是诊断，不计入14个正式里程碑。

在仓库根目录执行：

```bash
python3 public/courses/deep-learning/lab/test_lab.py
python3 public/courses/deep-learning/lab/run_modules.py --all --output-dir work/deep-learning/modules
```

`--all` 会从刚生成的直接父产物推导 lineage 哈希。若单独运行后续模块，必须为所有声明的父产物传入 `--input-artifact ARTIFACT_ID=SHA256`。

验证一个模块并生成可导入浏览器的 hash-bound receipt：

```bash
python3 public/courses/deep-learning/lab/validate_module.py \
  --module transformer-encoder-decoder \
  --package work/deep-learning/modules/transformer-encoder-decoder.json \
  --receipt work/deep-learning/receipts/transformer-encoder-decoder.json
```

浏览器只能检查 receipt 的结构与绑定关系，不能读取学习者的本地文件，也不能认证命令真的运行过。

## Reference example

```bash
python3 public/courses/deep-learning/lab/run_experiment.py \
  --output-dir work/deep-learning/reference
python3 public/courses/deep-learning/lab/validate_reference.py \
  --package work/deep-learning/reference/submission.generated.json
```

reference 通过不等于 capstone 完成。

## Learner final

复制 `submission.template.json`，替换所有占位符，按 canonical JSON content 计算每项 artifact SHA-256，然后运行：

```bash
python3 public/courses/deep-learning/lab/validate_capstone.py \
  --package work/deep-learning/learner-final.json \
  --receipt-dir work/deep-learning/capstone-receipts
```

必须从仓库根目录运行，而且两个路径都必须位于 workspace 内。只有整个 package 通过后，validator 才会生成八份 `aicourse.evidence-receipt.v1` 文件。每份 receipt 都把一个 capstone artifact ID 绑定到该 artifact content 的 canonical SHA-256、精确的 `learner-final.json#artifacts/{index}/content` 位置、实际 validator command 与 reviewer role。请把对应 receipt 粘贴到浏览器中同名的 artifact 字段。浏览器能再次检查结构，却仍不能读取本地字节、重跑命令、认证 reviewer、证明能力或授予发布权。

学习者最终包必须包含：

- 三个完成的 primary Transformer seeds、一个完成的 simple/RNN baseline、一次保留的 checkpoint-resume 尝试，以及至少一次保留的未完成尝试；
- 每次运行的带时区且有序 timestamps、单调 elapsed time、wall time、stop reason、config/split hashes 与精确 module-receipt 链接；
- 详细 failure/recovery 条目，而不是只有 `failedRunsRetained=true`；
- 峰值内存、顺序 wall time、精确运行数、带上下界的金额估计，以及带上下界和“非物理能耗测量”边界的 energy proxy；
- 分开的 clean、corruption、held-out-length、synthetic subgroup-like、calibration 与 error-analysis slices，并包含分母、seed traces、变换 receipts、受控消融、未做测试和泛化边界；
- causal-mask leakage、Unicode normalization round-trip、tokenizer-version drift 与 LoRA merge equivalence 的保留失败负控；
- 用确切 run、failure、resource 与 evaluation artifact hashes 支撑原子主张的 Transformer-backed dossier；
- limitations，以及具名 reviewer 对精确七项 artifact hashes 的绑定、clean-room transcript、重跑、失败检查、challenge、差异、修复、理由和签署决定。

证据充分的 `no-train` 或 `no-deploy` 可以通过；未解决的数据权利问题只能搭配更严格的 `no-train`。Validator PASS 永远不授予训练或部署权。

## 破坏性测试

`test_lab_v2.py` 会重算十二个模块，为每个模块拒绝内容特定的破坏性变异，并逐项破坏上述 capstone 能力；它还会验证 `no-train`，并把 validator 生成的八份 receipt 送入浏览器同款 CourseKit parser 做 round-trip。测试拒绝 MLP-only、缺 seeds/runs/failures/resources/slices/负例、断裂 lineage、不完整外部复核、不安全的权利决定、占位哈希，以及把 foundation reference 冒充 learner final。
