# Course 20 offline neural-training lab and capstone pack

Course contract: `deep-learning` / `2026.08.26-v1`  
Capstone contract: `2026.08.26-capstone-v1`  
Validator: `aicourse.deep-learning.validator.v1`

This pack runs a deterministic, CPU-only learning experiment over the 12-record original synthetic fixture in `../fixtures/`. It compares an auditable orientation-rule baseline with a hand-coded 16–4–1 neural network, records the full milestone log, evaluates clean and transformed error slices, runs a matched no-bias ablation, and emits all eight capstone artifacts. It uses no network, paid API, remote notebook, GPU, real-person data, or third-party runtime package.

The required experiment is intentionally tiny. It teaches tensor, gradient, training-loop, robustness, ablation, evidence, and review mechanics. It does not establish deep-learning performance on real images. GPU or framework exercises are optional extensions and cannot replace the reference CPU receipt.

## Files and fixed contracts

- `environment.lock.json` and `requirements.lock` record the exact reference runtime, seed, architecture, epochs, and zero third-party dependencies.
- `run_experiment.py` verifies fixture bytes, trains both reference configurations, writes three deterministic evidence files, and assembles the eight-artifact submission.
- `capstone.schema.json` fixes the course, course version, capstone version, validator ID, artifact IDs, and course-specific content requirements.
- `submission.template.json` is a deliberately incomplete authoring template; it cannot pass until real generated evidence replaces its placeholders.
- `validate.py` rejects wrong versions, wrong or missing artifacts, missing evidence, changed generated files, numerical drift, false GPU requirements, and an absent human no-deploy boundary.
- `test_lab.py` proves a clean run and positive validation, then mutates the version, artifact set, artifact ID, training evidence, and a generated file. Every mutation must fail.

## Clean offline run

Run from this `lab/` directory:

```sh
python3 run_experiment.py --output-dir work
python3 validate.py --package work/submission.generated.json
python3 test_lab.py
```

The validator prints:

```text
aicourse.deep-learning.validator.v1: PASS
```

`work/` is learner output and is intentionally not shipped. Remove it at any time and rerun from the checked-in sources. Do not overwrite the fixture or source scripts with generated output.

## Evidence and authority boundary

The cost/energy record is a deterministic logical-operation proxy, not a physical power measurement or carbon estimate. Slice names describe synthetic transformations, not protected groups. A passing validator establishes byte binding, structural completeness, deterministic reference calculations, and the presence of an independent-review receipt. It does not establish accuracy on real data, fairness, robustness in an untested domain, safety, certification, or permission to train or deploy. The bundled reference decision is `no-deploy`.
