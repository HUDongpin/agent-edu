# Cursor Course 4 — shared integration contract

Status: implemented and verified in the shared tree for development/internal review; the public release gate is intentionally rights-gated for all 14 first-party figures.

Prepared: 2026-08-23

Last verified against the additive shared tree: 2026-08-24

This contract records the additive integration now implemented in the shared tree. Concurrent Claude, Grok, Codex, and other-course changes were preserved.

## 1. Catalogue metadata

The shared course ID and the product-manifest ID intentionally differ:

- Shared `TopLevelCourse` / `CatalogCourse` ID: `cursor`
- Product-local `CURSOR_COURSE_ID`: `how-to-use-cursor`

Add Cursor to `TOP_LEVEL_COURSES` with this exact contract:

```ts
{
  id: "cursor",
  displayNumber: 4,
  href: "/cursor/",
  minutes: 800,
  durationMinutes: 800,
  status: "available",
  hue: "var(--violet)",
  level: "beginner-to-advanced",
  moduleIds: [
    "orient-privacy",
    "tab-inline-edit",
    "agent-interface",
    "task-contracts",
    "plan-execute-steer",
    "test-review-recover",
    "rules-skills-mcp",
    "cloud-parallel",
    "software-studio",
    "research-studio",
    "writing-studio",
    "office-studio",
    "teaching-studio",
    "workflow-capstone",
  ],
  outcomeKeys: ["c.cursor.blurb", "c.cursor.title", "c.cursor.meta"],
  progressStrategy: "sixteen-equal-milestones",
  progressStorageKey: CURSOR_PROGRESS_STORAGE_KEY,
  progressEvent: CURSOR_PROGRESS_EVENT,
  progress: (progress) => cursorProgressPercent(progress),
}
```

Preferred imports:

```ts
import { CURSOR_COURSE_MANIFEST } from "./cursor/manifest";
import {
  CURSOR_PROGRESS_EVENT,
  CURSOR_PROGRESS_STORAGE_KEY,
  cursorProgressPercent,
} from "./cursor/progress";
```

The literal `moduleIds` and `800` values above may instead be derived from `CURSOR_COURSE_MANIFEST.lessons`, provided the resulting order and duration are identical.

Required `TopLevelCourse` type additions:

- ID union: `"cursor"`
- display-number union: `4`
- progress-strategy union: `"sixteen-equal-milestones"`

The existing upcoming Cursor catalogue record becomes an integrated, linkable record derived from the top-level entry. Its shared `status: "available"` denotes route availability; it does not override the product manifest's `rights-gated` publication state:

```ts
{
  id: "cursor",
  displayNumber: 4,
  href: "/cursor/",
  titleKey: "c.cursor.title",
  blurbKey: "c.cursor.blurb",
  metaKey: "c.cursor.meta",
  topic: "coding-assistants",
  topicKey: "topic.codingAssistants",
  level: "beginner-to-advanced",
  levelKey: "c.cursor.level",
  format: "guided",
  formatKey: "cat.formatGuided",
  minutes: 800,
  status: "available",
  hue: "var(--violet)",
  progressStorageKey: CURSOR_PROGRESS_STORAGE_KEY,
  progressEvent: CURSOR_PROGRESS_EVENT,
  progress: cursorProgressPercent,
}
```

Preserve the existing Cursor-specific cover motif. Add the exact Cursor anchor mapping in `components/courses/Catalog.tsx`:

```ts
course.id === "cursor" ? "how-to-use-cursor" : /* existing mappings */
```

The card becomes linkable and available; it must no longer render as an unfinished preview. `components/courses/Cover.tsx` and `Cover.module.css` already contain the Cursor motif and need no Course 4 edit.

## 2. Ordered public routes

Dashboard:

```text
cursor/
```

Lessons:

```text
cursor/orient-privacy/
cursor/tab-inline-edit/
cursor/agent-interface/
cursor/task-contracts/
cursor/plan-execute-steer/
cursor/test-review-recover/
cursor/rules-skills-mcp/
cursor/cloud-parallel/
cursor/software-studio/
cursor/research-studio/
cursor/writing-studio/
cursor/office-studio/
cursor/teaching-studio/
cursor/workflow-capstone/
```

Add an explicit `CURSOR_LESSON_PAGES` to `lib/seo.ts`, then add the dashboard and all lesson routes to `PAGES`. Do not import `lib/cursor/seo.ts` into `lib/seo.ts`, because the product-local helper already imports `SITE` from the shared module. Either list the exact strings or derive them from `./cursor/types` without creating a circular import.

The current generic `app/sitemap.ts` will publish the dashboard and all 14 lessons for all nine `LOCALE_CODES`, including reciprocal alternates and `x-default`, as soon as those paths are added to `PAGES`; no Cursor-specific sitemap branch is required.

No other shared SEO helper is required. Product-local metadata already emits:

- page-specific canonical URLs;
- all-nine `hreflang` alternates and `x-default`;
- mapped Open Graph locales and alternate locales;
- dashboard `Course` JSON-LD;
- lesson `LearningResource` JSON-LD.

The shared catalogue page has a separate exhaustive structured-data map and **does** require a Cursor entry. In `app/[locale]/courses/page.tsx`, use direct imports rather than the `@/lib/cursor` barrel:

```ts
import { loadCursorCourse } from "@/lib/cursor/load";
import { CURSOR_COURSE_MANIFEST } from "@/lib/cursor/manifest";
```

Load the localized Cursor course in the existing `Promise.all`, then materialize its 14 parts:

```ts
const courseFourParts = CURSOR_COURSE_MANIFEST.lessons.map((lesson) => ({
  "@type": "LearningResource",
  position: lesson.order,
  name: cursorCourse.copy.lessons[lesson.slug].title,
  url: `${urlFor(locale)}cursor/${lesson.slug}/`,
  inLanguage: locale,
  timeRequired: `PT${lesson.minutes}M`,
}));
```

Add `cursor: courseFourParts` to `partsByCourse`. Without this exhaustive entry, adding `cursor` to `TopLevelCourse["id"]` breaks TypeScript at `partsByCourse[course.id]` and omits the catalogue `ItemList` lesson graph.

## 3. Progress, cache invalidation, and reset

Cursor uses an isolated, versioned browser record rather than the shared `ae.progress` object:

```text
storage key:       aicourse.cursor.progress.v1
Cursor key prefix: cursor.
same-tab event:    cursor:progress-change
cross-tab event:   storage
focus event:       focus
Web Lock:          aicourse:cursor-progress
commit attempts:   3
writer scope:      Cursor tabs
strategy:          isolated-record-no-cross-course-writers
```

The catalogue must therefore set both `progressStorageKey` and `progressEvent`. The pure `cursorProgressPercent` adapter counts exactly 16 milestones:

- 14 lesson keys that are strictly `true`;
- one final-quiz milestone only when quiz bank version is `"2"`, best score is at least 10 of 12, and pass is strictly `true`;
- one capstone milestone only when all three current records agree:
  - `cursor.capstone.v1`
  - `cursor.capstoneMeta.v1`
  - `cursor.capstoneAssessment.v1`

The capstone assessment stores public artifact IDs, public rubric IDs, and a derived score. Receipt text, paths, logs, and command output are never persisted.

The live global progress component already imports and invokes the Cursor reset adapter, but the adapter is asynchronous and must be awaited. Preserve Course 2's reset call and compose the handlers as follows:

```tsx
onClick={async () => {
  resetAllCourseProgress();
  resetClaudeProgressAfterGlobalReset();
  await resetCursorProgressAfterGlobalReset();
  // Await any equivalent isolated Grok adapter when its contract requires it.
  try {
    localStorage.removeItem(SECTIONS_KEY);
  } catch {
    // Storage can be unavailable.
  }
  setCourses(read());
}}
```

Awaiting the adapter ensures queued cooperative Cursor writes complete before the final removal and clears Cursor's memory-only fallback when local storage is denied.

## 4. Exact global message additions

Insert `cat.course4` between the Course 3 and Course 6 labels. Add `c.cursor.*` beside the other integrated product strings.

### English (`messages/en.json`)

```json
{
  "cat.course4": "Course 4",
  "c.cursor.title": "How to Use Cursor",
  "c.cursor.blurb": "Master Cursor through 14 evidence-led lessons that connect authentic interface practice with safe workflows for engineering, research, writing, office work, and teaching.",
  "c.cursor.level": "Beginner to advanced",
  "c.cursor.meta": "14 lessons, about 13 hours 20 minutes, 14 authentic Cursor UI figures"
}
```

### Spanish (`messages/es.json`)

```json
{
  "cat.course4": "Curso 4",
  "c.cursor.title": "Cómo utilizar Cursor",
  "c.cursor.blurb": "Domine Cursor mediante 14 lecciones basadas en evidencia que combinan la práctica auténtica de la interfaz con flujos de trabajo seguros para desarrollo, investigación, redacción, tareas de oficina y enseñanza.",
  "c.cursor.level": "De principiante a avanzado",
  "c.cursor.meta": "14 lecciones, unas 13 horas y 20 minutos, 14 figuras auténticas de la interfaz de Cursor"
}
```

### French (`messages/fr.json`)

```json
{
  "cat.course4": "Cours 4",
  "c.cursor.title": "Comment utiliser Cursor",
  "c.cursor.blurb": "Maîtrisez Cursor grâce à 14 leçons fondées sur des preuves, qui associent une pratique authentique de l’interface à des méthodes de travail sûres pour le développement, la recherche, la rédaction, les tâches de bureau et l’enseignement.",
  "c.cursor.level": "Débutant à avancé",
  "c.cursor.meta": "14 leçons, environ 13 heures 20 minutes, 14 illustrations authentiques de l’interface de Cursor"
}
```

### German (`messages/de.json`)

```json
{
  "cat.course4": "Kurs 4",
  "c.cursor.title": "So verwenden Sie Cursor",
  "c.cursor.blurb": "Beherrschen Sie Cursor in 14 evidenzbasierten Lektionen, die authentische Arbeit mit der Benutzeroberfläche und sichere Abläufe für Softwareentwicklung, Forschung, Schreiben, Büroarbeit und Lehre verbinden.",
  "c.cursor.level": "Anfänger bis Fortgeschritten",
  "c.cursor.meta": "14 Lektionen, etwa 13 Stunden und 20 Minuten, 14 authentische Cursor-UI-Abbildungen"
}
```

### Simplified Chinese (`messages/zh-Hans.json`)

```json
{
  "cat.course4": "课程四",
  "c.cursor.title": "如何使用 Cursor",
  "c.cursor.blurb": "通过 14 节以证据为导向的课程掌握 Cursor，将真实界面实践与工程、研究、写作、办公和教学场景中的安全工作流程相结合。",
  "c.cursor.level": "入门到高级",
  "c.cursor.meta": "14 节课，约 13 小时 20 分钟，14 幅真实 Cursor 界面图"
}
```

### Traditional Chinese (`messages/zh-Hant.json`)

```json
{
  "cat.course4": "課程 4",
  "c.cursor.title": "如何使用 Cursor",
  "c.cursor.blurb": "透過 14 堂以證據為核心的課程掌握 Cursor，將真實介面操作與軟體工程、研究、寫作、辦公和教學情境中的安全工作流程結合起來。",
  "c.cursor.level": "初學者到進階使用者",
  "c.cursor.meta": "14 堂課，約 13 小時 20 分鐘，14 張真實 Cursor UI 圖片"
}
```

### Japanese (`messages/ja.json`)

```json
{
  "cat.course4": "コース 4",
  "c.cursor.title": "Cursor の使い方",
  "c.cursor.blurb": "実際のインターフェース操作を、エンジニアリング、調査、執筆、オフィス業務、教育のための安全なワークフローへ結び付ける、証拠重視の全 14 レッスンを通じて Cursor を習得します。",
  "c.cursor.level": "初級から上級まで",
  "c.cursor.meta": "全 14 レッスン・約 13 時間 20 分・Cursor 公式 UI 図 14 点"
}
```

### Korean (`messages/ko.json`)

```json
{
  "cat.course4": "코스 4",
  "c.cursor.title": "Cursor 사용 방법",
  "c.cursor.blurb": "엔지니어링, 연구, 글쓰기, 사무 및 교육을 위한 안전한 워크플로와 실제 인터페이스 실습을 연결하는 증거 중심의 14개 수업을 통해 Cursor를 마스터하세요.",
  "c.cursor.level": "초급부터 고급",
  "c.cursor.meta": "14개 수업, 약 13시간 20분, 실제 Cursor UI 그림 14개"
}
```

### Arabic (`messages/ar.json`)

```json
{
  "cat.course4": "الدورة الرابعة",
  "c.cursor.title": "كيفية استخدام Cursor",
  "c.cursor.blurb": "أتقن Cursor عبر 14 درسًا تقودها الأدلة، وتربط التدريب العملي على واجهات أصيلة بسير عمل آمن للهندسة والبحث والكتابة والعمل المكتبي والتدريس.",
  "c.cursor.level": "من مبتدئ إلى متقدم",
  "c.cursor.meta": "١٤ درسًا، نحو ١٣ ساعة و٢٠ دقيقة، و١٤ شكلًا أصيلًا لواجهة مستخدم Cursor"
}
```

## 5. Package scripts

Add these scripts without removing or weakening any existing check:

```json
{
  "cursor:check": "node --import tsx scripts/check-cursor-course.mjs",
  "cursor:check:release": "node --import tsx scripts/check-cursor-course.mjs --release",
  "cursor:fixture": "node scripts/build-cursor-demo-archive.mjs",
  "test:cursor": "playwright test --config tests/cursor-playwright.config.ts --workers=1"
}
```

Compose `npm run cursor:check:release` into both shared `build` and `build:release` release-check chains while preserving every existing course check, including the current Course 2 Codex and Course 5 Grok gates.

## 6. Post-integration acceptance

Run all of the following after the additive merge:

```sh
npm run cursor:check
npm run cursor:check:release # expected to fail closed until all 14 figures have evidence-bearing publication determinations that have been reviewed
npx tsc --noEmit --pretty false
rg --files 'app/[locale]/cursor' components/cursor lib/cursor | rg '\.(ts|tsx)$' | xargs npx eslint
npx eslint tests/cursor-course.spec.ts scripts/check-cursor-course.mjs scripts/build-cursor-demo-archive.mjs
npm run i18n:check:release
CURSOR_BASE_URL=http://localhost:3000 npx playwright test --config tests/cursor-playwright.config.ts --workers=1
npm run build # expected to fail while any course release gate remains closed
```

The integrated Cursor browser suite contains 39 tests, including the shared sitemap assertion. The current post-correction result is recorded in `outputs/cursor-course-verification.md` rather than duplicated here.

## 7. Locked implementation facts

- 4 units, 14 lessons, 800 minutes
- 28-question stable-ID bank, version 2
- 12-question final, exactly 3 questions per unit, pass at 10/12, best-score policy
- 14 practices
- 14 authentic first-party Cursor UI figures and 42 local PNG/WebP assets; technical availability does not mean publication clearance
- 50-source ledger: 34 official docs, 4 official blogs, 11 revision-pinned community GitHub repositories, and 1 course artifact; every record is used by a lesson or assessment
- Deterministic 17-file capstone archive
- Archive SHA-256: `4d7623fee2771309cac1d87c33da30883bec58938bcdc67a8f3995156f31a34e`
- Internal fixture SHA-256: `3b6f1f3749ec0be076c86725f494a1780a4c126e1a9480c55f5c2d8433b5e31b`
- Checksum-sidecar file SHA-256: `b41041a3696fd2b992e1e70d9b4aa7c94a364175122b8325c8b6b47c0da91ca5`
