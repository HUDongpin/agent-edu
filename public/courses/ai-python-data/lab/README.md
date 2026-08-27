# Course 18 offline lab and capstone pack

Contract: `ai-python-data` / `2026.08.26-v1`  
Capstone: `2026.08.26-capstone-v1`  
Validator: `aicourse.ai-python-data.validator.v1`

This pack creates a reproducible education-data audit over the original, fictional fixture shipped one directory above. It never connects to a network, reads real learner data, calls a paid API, or requires a hosted notebook. The canonical runner uses Python 3.11+ and only the standard library. `audit.ipynb` is a presentation surface over that same runner; Jupyter is optional and is not silently installed.

## Files

- `environment.lock.json` and `requirements.lock` declare the runtime, seed, notebook format, and zero third-party runtime dependencies.
- `audit.ipynb` is the ordered notebook handoff, and `run_notebook.py` executes its two code cells in a fresh namespace without installing Jupyter.
- `run_audit.py` is the notebook's analytical library: it verifies fixture hashes, validates the locked schema, preserves missingness, joins the locked lookup, computes seeded descriptive uncertainty, and writes an original SVG plus an eight-artifact dossier.
- `capstone.schema.json` fixes the course, course version, capstone version, validator ID, and exact artifact IDs.
- `submission.template.json` is the schema-specific blank artifact template. Empty placeholders do not pass validation.
- `validate.py` validates the dossier and reconciles referenced files and hashes. It deliberately does not treat a pass as deployment permission.

Keep the directory layout intact so `lab/` remains beside the three fixture files.

## Clean offline run

From this `lab` directory:

```sh
python3 run_notebook.py --output-dir work
python3 validate.py --package work/submission.generated.json
```

The second command must print:

```text
aicourse.ai-python-data.validator.v1: PASS
```

Generated files are learner work and are intentionally not shipped in the static course payload. Delete `work/` to prove a clean rerun. The checked-in source files are immutable; do not write over them.

## Required negative check

Copy the generated submission, change `courseVersion`, remove an artifact, change an artifact ID, or edit an output after its hash was recorded. The validator must exit non-zero. For example:

```sh
cp work/submission.generated.json work/submission.mutated.json
python3 -c 'import json; p="work/submission.mutated.json"; d=json.load(open(p)); d["courseVersion"]="wrong"; open(p,"w").write(json.dumps(d))'
python3 validate.py --package work/submission.mutated.json
```

## Notebook run

If an already installed Jupyter environment is available, start it offline in this directory and run all cells from a fresh kernel. The notebook imports `run_audit.py` and `validate.py`; its analytical runtime remains standard-library-only. The authoritative dependency-free reproducibility command is the `run_notebook.py` clean run above, which executes the same checked-in code cells in a fresh namespace.

## Evidence and decision boundary

All rows and cohort names are fictional. A passing validator establishes only that this exact local dossier matches the declared structural and computational checks. It does not establish representativeness, causal identification, fairness, privacy compliance, truth about real learners, or authorization to deploy. Before submitting a capstone, a human reviewer must challenge at least one cleaning rule, statistical assumption, chart choice, and unsupported real-world claim; the final decision remains `no-deploy`.
