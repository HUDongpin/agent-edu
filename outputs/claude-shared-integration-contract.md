# Course 3 shared-integration contract

Product namespace: `claude`  
Public ordinal: `3` (explicit; never inferred from array position)  
Course ID: `claude`  
Manifest ID: `how-to-use-claude`  
Product state: development-ready; public release gated by image rights

## Top-level course record

```ts
{
  id: "claude",
  displayNumber: 3,
  href: "/claude/",
  minutes: 870,
  durationMinutes: 870,
  status: "available",
  hue: "var(--claude, #d97757)",
  level: "beginner-to-advanced",
  moduleIds: CLAUDE_COURSE_MANIFEST.lessons.map((lesson) => lesson.slug),
  outcomeKeys: ["c.claude.blurb", "c.claude.title", "c.claude.meta"],
  progressStrategy: "seventeen-equal-milestones",
  progress: (p) => claudeProgressPercent(p),
}
```

Progress numerator:

- one milestone for each of 15 keys `claude.lesson.<slug>`;
- one when `isClaudeQuizPassed(progress)` is true;
- one when `isClaudeCapstoneSelfAuditPassed(progress)` is true, which requires all six artifact checks, a weighted self-audit score of at least 80/100, the critical-risk attestation, and the persisted completion flag.

Denominator: 17. Preserve every non-`claude.` key on course reset.

Product adapter: `import { claudeProgressPercent } from "@/lib/claude/progress"`.

## Routes

Dashboard:

```text
claude/
```

Lessons:

```text
claude/choose-your-surface/
claude/describe-the-outcome/
claude/iterate-with-examples/
claude/discern-verify-protect/
claude/work-with-files/
claude/build-projects/
claude/create-artifacts/
claude/research-with-citations/
claude/extend-with-tools/
claude/delegate-with-cowork/
claude/software-engineering/
claude/research-and-data/
claude/writing-and-office/
claude/teaching-and-learning/
claude/portfolio-capstone/
```

Per locale: 16 pages. Across 9 locales: 144 pages.

SEO/sitemap additions:

- `CLAUDE_LESSON_PAGES` with the 15 lesson paths above;
- add `"claude/"` and `...CLAUDE_LESSON_PAGES` to `PAGES`;
- add `claudeLessonPage(slug)` if shared page typing is desired;
- dashboard emits `Course`, `hasPart`, `courseWorkload: PT870M`, and breadcrumbs;
- lesson emits `LearningResource` and breadcrumbs;
- product-local canonical/hreflang helper already emits all 9 locales plus `x-default`.

## Catalogue record

```ts
{
  id: "claude",
  displayNumber: 3,
  href: "/claude/",
  titleKey: "c.claude.title",
  blurbKey: "c.claude.blurb",
  metaKey: "c.claude.meta",
  topic: "collaboration",
  topicKey: "topic.collaboration",
  level: "beginner-to-advanced",
  levelKey: "c.claude.level",
  format: "guided",
  formatKey: "cat.formatGuided",
  minutes: 870,
  status: "available",
  hue: "var(--claude, #d97757)",
  progress: claudeProgressPercent,
}
```

Suggested stable anchor: `how-to-use-claude`.

## English global message additions

```json
{
  "cat.course3": "Course 3",
  "c.claude.title": "How to Use Claude",
  "c.claude.blurb": "Build trustworthy Claude workflows across research, writing, office work, teaching, and software engineering, with dated real-interface figures and independent verification.",
  "c.claude.level": "Beginner to advanced",
  "c.claude.meta": "15 lessons, about 14.5 hours",
  "home.claudePoint1": "Choose the right Claude surface, context, tools, permissions, and review boundary.",
  "home.claudePoint2": "Practise source-grounded workflows for software, research, data, writing, office work, and teaching.",
  "home.claudePoint3": "Complete a six-artifact portfolio across Delegation, Description, Discernment, and Diligence.",
  "home.course3Cta": "Start learning Claude"
}
```

All nine global locale files require natural translations with exact key parity. Product-local course translations live separately in `messages/claude/*.json`.

## Navigation and cover

- Add `/${locale}/claude/` to the footer course list between Codex and Cursor.
- Add a Course 3 featured card or explicitly document why the home page curates fewer than all released courses.
- Add an original, non-logo Claude cover motif to `components/courses/Cover.tsx` and a warm, high-contrast `claude` variant to `Cover.module.css`.
- Do not imply Anthropic affiliation or endorsement.

## Package scripts

```json
{
  "claude:check": "node --import tsx scripts/check-claude-course.mjs",
  "claude:check:release": "node --import tsx scripts/check-claude-course.mjs --release",
  "test:claude": "playwright test tests/claude-course.spec.ts"
}
```

Historical integration note: the original `--release` checker was intentionally
expected to fail while 12 Academy-hosted figures remained in
`permission-required` state. As of the 2026-08-26 course-roadmap candidate,
those 12 assets have been replaced by visibly labelled course-original SVG
diagrams; three retained repository figures have licence-bound provenance.
`npm run claude:check:release` now passes without weakening the rights gate.

## Required shared acceptance

1. Re-read every shared file after Cursor and Grok deliver their contracts.
2. Apply one additive patch for Courses 3, 4, and 5 while preserving Courses 1, 2, 6, and 7.
3. Keep explicit display ordinals independent of array positions.
4. Run global message parity, full TypeScript, lint, build, sitemap, and course-specific Playwright suites.
5. Run every product release checker; report the Claude rights failure as a real publication blocker rather than suppressing it.
