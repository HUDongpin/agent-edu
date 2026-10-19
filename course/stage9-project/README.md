> 简体中文：[README.zh-Hans.md](README.zh-Hans.md)

# Stage 9 — transfer project

The café was shared practice. This stage asks you to make the control boundary explicit in a domain you actually know.

## The first hour

Three steps, then stop and look. The rest of the stage is what you do with what these show you.

1. Pick a domain you have actually worked in. One sentence: who is standing there, and what they are trying to finish.
2. Write three inputs that would break a keyword rule. If a short list of words would mishandle them, you have found the wall.
3. Write five eval cases in the shape of [`eval-template.json`](eval-template.json): one ordinary, one at the boundary, one hostile, and two more taken from the inputs above.

Check the file from the repo root. The first command checks the template in this folder. The second passes that same file by path:

```bash
npx tsx course/stage9-project/validate.ts
npx tsx course/stage9-project/validate.ts course/stage9-project/eval-template.json
```

Either command accepts the three placeholders and prints a note. A file of your own, passed the same way, needs at least five cases. There is no model call. Passing the check is not the project score. [`RUBRIC.md`](RUBRIC.md) is still how the work is judged.

The deliverable is an inspectable argument supported by a small working artifact:

1. Copy [`artifact-template.md`](artifact-template.md) into your project notes.
2. Copy [`eval-template.json`](eval-template.json) and replace the placeholder cases with inputs from your domain.
3. Build the smallest rules version and the smallest model-assisted version that let the cases expose a meaningful difference.
4. Put an enforceable gate before the most irreversible action.
5. Use [`RUBRIC.md`](RUBRIC.md) for self-review or peer/teacher review.

[`worked-example.md`](worked-example.md) is one completed project — a library's
returns desk — filled into the same template and scored against the same rubric.
Everything up to Stage 8 hands you a worked example and Stage 8 is where it
stops, which is a strange moment to find out what the finished thing looks like.
It is one defensible answer rather than the answer, and it is deliberately not
perfect: it scores 11 of 12, and the row it loses is marked and explained rather
than quietly fixed.

**Stuck?** Hint 1 and 2 in [HINTS.md](../HINTS.md), then [SOLUTIONS.md](../SOLUTIONS.md). The hints cover the guided stages (0–8). This stage is the transfer.

Do not include a live API key, Authorization header, raw Provider error body, personal data or an unredacted learner/customer record in the submission. A local console transcript, redacted case trace or small JSON result is enough evidence.

The rubric deliberately does not award points for choosing a particular framework, Provider or prompt. It awards points for an observable boundary, a proportionate control and honest evidence about what failed.
