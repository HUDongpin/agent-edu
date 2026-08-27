# Course 21 offline dual-system production lab and capstone pack

Course contract: `production-ai` / `2026.08.26-v1`  
Capstone contract: `2026.08.26-capstone-v1`  
Validator: `aicourse.production-ai.validator.v1`

This pack runs two real local HTTP services using only the Python standard library:

1. a deterministic predictive routing service; and
2. a deterministic retrieval-grounded answer service over the approved fictional documents in `../fixtures/dual-system-operations-v1.json`.

`run_capstone.py` binds both servers to ephemeral ports on `127.0.0.1`, sends actual JSON requests, records responses, actively injects a numeric feature-distribution shift and a contaminated retrieval index, calculates separate quality/support/trace/cost/latency-budget signals, fires alerts, executes both declared rollback targets, verifies recovery, and writes all ten capstone artifacts. It never contacts the external network, uses a paid API, reads a real record, loads a secret, or creates a server dependency for the static website.

## Files and fixed contracts

- `environment.lock.json` and `requirements.lock` record the exact reference runtime and zero third-party dependencies.
- `services.py` contains the local predictive and RAG HTTP handlers. Its `--service` mode can be used for manual inspection.
- `run_capstone.py` orchestrates clean traffic, both injected degradations, alerting, rollback, recovery verification, and evidence generation.
- `capstone.schema.json` fixes the course, versions, validator, exact ten artifact IDs, two service kinds, two injection IDs, and no-deploy boundary.
- `submission.template.json` is an incomplete authoring template and does not pass validation by itself.
- `validate.py` recomputes the fixed evidence and rejects a wrong version, missing or renamed artifact, absent HTTP transcripts, absent degradation, missing alert/rollback, changed output bytes, or governance approval that does not end in `no-deploy`.
- `test_lab.py` performs a clean run and positive validation, followed by destructive version, artifact, drift, rollback, and output-hash mutations. Every mutation must fail.

## Clean offline run

From this `lab/` directory:

```sh
python3 run_capstone.py --output-dir work
python3 validate.py --package work/submission.generated.json
python3 test_lab.py
```

The validator prints:

```text
aicourse.production-ai.validator.v1: PASS
```

The two listeners exist only while the runner is active and accept connections only from this machine. `work/` is learner output and is intentionally not shipped.

## Optional manual service inspection

The services can be started one at a time for local inspection:

```sh
python3 services.py --service predictive --port 8765
python3 services.py --service rag --port 8766
```

Do not expose these teaching servers to another host. They are intentionally minimal fixtures, not hardened application servers.

## Evidence and authority boundary

All systems, versions, requests, documents, incidents, costs, labels, and decisions are fictional. Logical latency and cost units are deterministic teaching signals, not wall-clock production measurements or invoices. The exercise proves that the declared local mechanisms detect the two authored degradations and verify the two authored rollbacks. It does not establish real reliability, security, privacy, fairness, legal compliance, environmental impact, model quality, or deployment readiness. A passing package ends in a time-bounded `no-deploy` decision and cannot be converted into production approval by renaming a field.
