# Codex capstone: make the course filter complete

This is a deliberately small Next.js and React repository. It already builds,
lints, and preserves its two routes. One feature is intentionally incomplete:
the course list can show **All** courses or **Complete** courses, but it cannot
show only **Incomplete** courses.

## Your task

Add an **Incomplete** filter to the course list without changing the dependency
set or removing either route.

The smallest coherent implementation changes `components/CourseList.tsx` and
`lib/courses.ts`. Treat the supplied `tests/CourseList.test.tsx` as a frozen
acceptance test: do not edit or weaken it. If you want to strengthen coverage,
add a separate test file instead.

Acceptance criteria:

- “Incomplete” appears beside the existing filters.
- Activating it shows only courses whose `complete` value is `false`.
- The filters remain native `<button type="button">` controls inside the
  labelled group and expose their selected state with `aria-pressed`.
- Pointer, Enter, and Space activation all work through native button behaviour.
- `/` and `/courses/` still build as static routes.
- `package.json` and `package-lock.json` remain at their supplied baseline, so
  no dependency, lockfile, package-manager, or lifecycle-script surface changes.

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

The final command first removes any receipt from an earlier run. It writes a
new `course-receipt.json` atomically only after every current check passes. Its
schema is `aicourse.codex.capstone.v1`; submit that receipt with the course
exercise.

The starter is expected to begin with two failing exercise assertions. That is
the exercise, not a broken installation. Lint and build should already pass.
