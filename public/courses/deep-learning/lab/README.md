# Course 20 v2: offline, executable deep-learning evidence

Status: **release HOLD** until the exact English and Simplified Chinese bundle receives named human terminology, semantic-fidelity, and technical-accuracy review. Automated checks cannot sign that review.

## What this pack proves—and what it does not

The standard-library `run_experiment.py` remains an M1–M4 foundation reference. It returns only `REFERENCE_PASS`, `capstoneEligible=false`, `independentReviewComplete=false`, and `decision=no-deploy`.

The required PyTorch lane executes real CPU operations for all twelve modules:

- tensor/view/broadcast/graph and analytic–autograd–finite-difference checks;
- one-batch overfit, fault tests, and checkpoint/resume equivalence;
- a three-seed LayerNorm ablation;
- linear/CNN/residual comparisons and four transfer strategies;
- RNN/LSTM padding, state-reset, and held-out-length tests;
- scaled dot-product attention with mask and perturbation negatives;
- a trained tiny Transformer with causal future-token leakage regression;
- multilingual NFKC tokenizer/corpus-rights audit;
- trained rank-2 LoRA adaptation and merge equivalence;
- robustness/resource/no-deploy dossier preparation.

A PASS is evidence about these original synthetic mechanics fixtures only. It does not establish external validity, fairness, safety, reviewer identity, data rights outside the pack, or authority to train or deploy.

## Locked runtime

- CPython 3.11.15
- PyTorch 2.13.0
- NumPy 2.4.1
- CPU, one Torch thread, deterministic algorithms, no runtime network
- required full run budget: at most 10 minutes and 2 GiB peak memory

`environment.lock.json` records the exact macOS arm64 reference wheel hashes and dependency tree. Other platforms must record their own resolved wheel hashes; they may not reuse the macOS hashes as proof.

## Run and validate

Complete `readiness.template.json` first. `validate_readiness.py` checks matrix multiplication, broadcasting, partial derivatives, the chain rule, stable softmax, train/validation/test boundaries, and a Python unit-test receipt. Any miss returns `BRIDGE_REQUIRED`; readiness is diagnostic and is not one of the 14 course milestones.

From the repository root:

```bash
python3 public/courses/deep-learning/lab/test_lab.py
python3 public/courses/deep-learning/lab/run_modules.py --all --output-dir work/deep-learning/modules
```

The `--all` run derives each predecessor hash from the artifact it just wrote. To run one later module independently, pass every declared predecessor as `--input-artifact ARTIFACT_ID=SHA256`.

Validate one module and issue a browser-importable, hash-bound receipt:

```bash
python3 public/courses/deep-learning/lab/validate_module.py \
  --module transformer-encoder-decoder \
  --package work/deep-learning/modules/transformer-encoder-decoder.json \
  --receipt work/deep-learning/receipts/transformer-encoder-decoder.json
```

The browser checks the receipt’s structure and bindings. It does not read the learner’s local file or authenticate that the command was really run.

## Reference example

```bash
python3 public/courses/deep-learning/lab/run_experiment.py \
  --output-dir work/deep-learning/reference
python3 public/courses/deep-learning/lab/validate_reference.py \
  --package work/deep-learning/reference/submission.generated.json
```

Reference success is not capstone completion.

## Learner final

Copy `submission.template.json`, replace every placeholder, calculate each artifact’s SHA-256 over canonical JSON content, and validate:

```bash
python3 public/courses/deep-learning/lab/validate_capstone.py \
  --package work/deep-learning/learner-final.json \
  --receipt-dir work/deep-learning/capstone-receipts
```

Run this command from the repository root with both paths inside the workspace. Only after the whole package passes, the validator writes eight `aicourse.evidence-receipt.v1` files. Each receipt binds one capstone artifact ID to that artifact content’s canonical SHA-256, its exact `learner-final.json#artifacts/{index}/content` location, the executed validator command, and the reviewer role. Paste the matching receipt into the matching browser artifact field. The browser can re-check this structure; it still cannot read local bytes, rerun the command, authenticate the reviewer, certify competence, or grant release authority.

The learner final requires:

- three completed primary Transformer seeds, a completed simple/RNN baseline, a retained checkpoint-resume attempt, and at least one retained non-completed attempt;
- offset-aware ordered timestamps, monotonic elapsed time, wall time, stop reasons, config/split hashes, and exact module-receipt links for every run;
- detailed failure/recovery entries, not only `failedRunsRetained=true`;
- peak memory, sequential wall time, exact run counts, a monetary estimate with bounds, and an energy proxy with bounds and a declared non-physical-measurement boundary;
- separate clean, corruption, held-out-length, synthetic subgroup-like, calibration, and error-analysis slices, with denominators, seed traces, transformation receipts, a controlled ablation, missing tests, and generalisation limits;
- retained failing controls for causal-mask leakage, Unicode normalization round-trip, tokenizer-version drift, and LoRA merge equivalence;
- a Transformer-backed dossier whose atomic claims link exact run, failure, resource, and evaluation artifact hashes;
- limitations and a named reviewer’s exact seven-artifact hash set, clean-room transcript, rerun, failed check, challenge, variance, remediation, rationale, and signed decision.

A defensible `no-train` or `no-deploy` decision may pass. Unresolved rights can pass only with the stricter `no-train` decision. Validator PASS never grants training or deployment authority.

## Destructive tests

`test_lab_v2.py` recomputes all twelve module artifacts and rejects a content-specific mutation for every module. It also destructively tests every capstone capability above, verifies `no-train`, and round-trips all eight validator-generated receipts through the same CourseKit parser used by the browser. It rejects MLP-only capstones, missing seeds/runs/failures/resources/slices/negative cases, broken lineage, incomplete external review, unsafe rights decisions, placeholder hashes, and any attempt to use the foundation reference as a learner final.
