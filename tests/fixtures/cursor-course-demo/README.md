# Cursor capstone: make the course filter complete

This is a deliberately small Next.js and React repository. It already builds,
lints, and preserves its two routes. One feature is intentionally incomplete:
the course list can show **All** courses or **Complete** courses, but it cannot
show only **Incomplete** courses.

## Your task

Add an **Incomplete** filter to the course list without changing the dependency
set or removing either route.

Acceptance criteria:

- “Incomplete” appears beside the existing filters.
- Activating it shows only courses whose `complete` value is `false`.
- The filters remain native `<button type="button">` controls inside the
  labelled group and expose their selected state with `aria-pressed`.
- Pointer, Enter, and Space activation all work through native button behaviour.
- `/` and `/courses/` still build as static routes.
- No dependencies or dev dependencies are added, removed, or changed.

Run the fast feedback loop while you work:

```bash
npm ci
npm test
npm run lint
npm run build
```

When everything passes, run:

```bash
npm run course:verify
```

The final command writes `course-receipt.json`. Its schema is
`aicourse.cursor.capstone.v1`; submit that receipt with the course exercise.

The receipt is an unsigned local self-check. It records the Boolean results
reported by the bundled verifier for the current filesystem; it does not prove
who ran the commands, which machine ran them, or that the supporting logs and
diff are authentic. Do not hand-edit the receipt or verifier. Keep the fresh
command output and reviewed diff in the separate human evidence packet. Each
verifier run removes an older receipt first, so a later failure cannot leave a
stale passing receipt behind.

The starter is expected to begin with two failing exercise assertions. That is
the exercise, not a broken installation. Lint and build should already pass.
