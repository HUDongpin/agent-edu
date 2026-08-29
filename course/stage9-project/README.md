# Stage 9 — transfer project

**Stage 9 of 10** · Previous: [Stage 8 — when the input fights back](../stage8-security/README.md) ·
[Course index](../README.md) · Next: [review and finish](#completion-checklist)

The café was shared practice. This stage asks you to make the control boundary explicit in a domain you actually know.

There is no model call and no automatic pass/fail checker here. The deliverable is an inspectable argument supported by a small working artifact:

1. Copy [`artifact-template.md`](artifact-template.md) into your project notes.
2. Copy [`eval-template.json`](eval-template.json) and replace the placeholder cases with inputs from your domain.
3. Build the smallest rules version and the smallest model-assisted version that let the cases expose a meaningful difference.
4. Put an enforceable gate before the most irreversible action.
5. Use [`RUBRIC.md`](RUBRIC.md) for self-review or peer/teacher review.

Do not include a live API key, Authorization header, raw Provider error body, personal data or an unredacted learner/customer record in the submission. A local console transcript, redacted case trace or small JSON result is enough evidence.

The rubric deliberately does not award points for choosing a particular framework, Provider or prompt. It awards points for an observable boundary, a proportionate control and honest evidence about what failed.

## Completion checklist

- [ ] The artifact names the goal, non-goals and what the model, code and a person may decide.
- [ ] A realistic failure input reproduces the rules version's boundary.
- [ ] The Eval cases include ordinary, ambiguous and hostile/boundary inputs with an inspectable scoring rule.
- [ ] Baseline and changed results retain failures and regressions, not selected successes only.
- [ ] Code or a person gates the most irreversible action before it executes.
- [ ] Provider data, tools, secrets, storage and untrusted-input boundaries are explicit.
- [ ] Evidence is redacted and contains no live key, Authorization header, raw Provider body or identifiable record.
- [ ] The rubric has been applied and the **review state** below matches what actually happened.

Stage 9 is deliberately not checked automatically. Record only the bounded
manual evidence state you can support:

```bash
# The files and evidence named above exist, but the rubric is not yet signed off.
npx tsx course/report.ts --stage9 artifact-assembled \
  --artifact notes/agent-transfer-artifact.md \
  --artifact notes/eval-results.json

# You applied RUBRIC.md to the same unchanged materialized file scope.
npx tsx course/report.ts --stage9 self-reviewed
```

Every `--artifact` must name a safe relative regular file inside this
repository. The report stores only the sorted relative paths, file count,
timestamp and deterministic inventory/content SHA-256—not file contents or an
absolute path. The first `artifact-assembled` or `self-reviewed` record needs
an explicit scope; a later `self-reviewed` command may reuse and re-hash the
existing paths. The report re-verifies those files every time it renders. If a
file is missing or changed, it invalidates the assembled/review state rather
than continuing to display the learner attestation.

The report also supports `--stage9 not-started`, which clears the stored scope.
None of these states means “passed,” “mastered,” deployed or certified;
`self-reviewed` records only that you applied the rubric to the materialized
scope shown by the report.

When you are finished, return to the [Course 3 launchpad](https://aicourse.top/en/build/)
or browse [All courses](https://aicourse.top/en/courses/).

---

**Stage 9 of 10** · Previous: [Stage 8 — when the input fights back](../stage8-security/README.md) ·
[Course index](../README.md) · Next: [Course 3 launchpad](https://aicourse.top/en/build/)
