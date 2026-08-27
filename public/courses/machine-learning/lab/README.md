# Course 19 offline machine-learning lab and capstone pack

Contract: `machine-learning` / `2026.08.26-v1`  
Capstone: `2026.08.26-capstone-v1`  
Validator: `aicourse.machine-learning.validator.v1`

This pack implements the required student-support risk-model capstone as a small, inspectable CPU pipeline. It uses only the two original fictional fixtures in the parent directory: the locked 30-row 20/5/5 table and the 14-event recommendation log. It never uses a network, paid API, hosted notebook, remote model, real learner record, or platform-held API key.

The canonical implementation is deliberately Python-standard-library-only: training-only preprocessing, deterministic batch-gradient logistic regression, a train-prevalence baseline, validation-only selection, one-shot holdout evaluation, Brier/log-loss/confusion metrics, calibration bins, fictional-cohort error slices, a model card, and a mandatory `no-deploy` decision. Scikit-learn is not required. An optional reimplementation may use it only if it preserves the exact split, seed, feature exclusions, metric contract, and no-deploy boundary.

## Files

- `environment.lock.json` and `requirements.lock` fix the offline CPU runtime and model parameters.
- `run_pipeline.py` verifies all fixture hashes, validates the locked split, fits the model, audits the recommendation-event exposure boundary, and creates two hashed outputs plus the eight-artifact dossier.
- `capstone.schema.json` fixes the course, versions, validator ID, and exact artifact IDs.
- `submission.template.json` is the schema-specific blank artifact template. Empty placeholders do not pass validation.
- `validate.py` independently binds predictions back to fixture record/partition/cohort/target values, recalculates baseline and model metrics, reconciles hashes, and enforces the no-deploy/human-authority contract.

Keep `lab/` beside the parent fixture files.

## Clean offline run

From this `lab` directory:

```sh
python3 run_pipeline.py --output-dir work
python3 validate.py --package work/submission.generated.json
```

The validator must print:

```text
aicourse.machine-learning.validator.v1: PASS
```

Delete `work/` and repeat to verify a clean run. Generated outputs are learner work and are not included in the published static payload.

## Required negative check

Mutate a bound field and prove fail-closed behavior. For example:

```sh
cp work/submission.generated.json work/submission.mutated.json
python3 -c 'import json; p="work/submission.mutated.json"; d=json.load(open(p)); d["artifacts"][-1]["content"]["decision"]="deploy"; open(p,"w").write(json.dumps(d))'
python3 validate.py --package work/submission.mutated.json
```

The final command must exit non-zero and identify the no-deploy contract failure. Equivalent negative tests may change `courseId`, `courseVersion`, an artifact ID, a prediction target, or a referenced file after hashing.

## Review and authority boundary

The fixed fixture exists to teach mechanics. Its cohorts are arbitrary color words, not protected or real groups. Tiny-group metrics are not fairness evidence; calibrated-looking scores are not population calibration; the outcome is not a validated construct. No score or label may directly trigger discipline, ranking, triage, support allocation, profiling, outreach, or any other consequential action. A qualified human must retain prior approval, override, stop, escalation, and appeal authority. The required capstone decision is `no-deploy`.
