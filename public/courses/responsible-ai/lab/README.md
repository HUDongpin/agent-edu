# Course 16 offline governance studio

This pack is an original, fictional, local-only exercise. It never authorizes a real deployment or establishes legal compliance, safety, fairness, or effectiveness.

## Run the positive control

```sh
python public/courses/responsible-ai/lab/validate.py --package public/courses/responsible-ai/lab/governance-dossier-example.json
```

The command must report `"ok": true`, `aicourse.responsible-ai.capstone.v1`, and `aicourse.responsible-ai.validator.v1`.

## Build your dossier

1. Copy `governance-dossier-template.json` outside the repository or into your own working directory.
2. Verify the fixture SHA-256 before interpreting it.
3. Complete all nine artifacts. Every artifact needs an owner, reviewable evidence, and at least one limitation.
4. Preserve the six canonical Responsible AI criterion IDs and record a bounded decision.
5. Run the validator against your package. Use its `packageSha256` in the browser evidence receipt; never paste confidential material into the site.

## Negative control

Run the untouched template. It must fail because draft, owner, evidence, and limitation fields are incomplete:

```sh
python public/courses/responsible-ai/lab/validate.py --package public/courses/responsible-ai/lab/governance-dossier-template.json
```

