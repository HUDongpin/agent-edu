import type { APIRequestContext, Locator, Page } from "@playwright/test";
import axe from "axe-core";
import {
  AGENT_ORCHESTRATION_CAPSTONE_ARTIFACT_COUNT,
  AGENT_ORCHESTRATION_CAPSTONE_CHECKS_KEY,
  AGENT_ORCHESTRATION_INITIAL_LAB_STATE,
  AGENT_ORCHESTRATION_LAB_ACTIVE_FIELDS,
  AGENT_ORCHESTRATION_LAB_ID_BY_MODULE,
  AGENT_ORCHESTRATION_PROGRESS_VERSION,
  AGENT_ORCHESTRATION_PROGRESS_VERSION_KEY,
  AGENT_ORCHESTRATION_QUIZ_BEST_KEY,
  AGENT_ORCHESTRATION_QUIZ_PASSED_KEY,
  agentOrchestrationCheckpointPassedKey,
  agentOrchestrationModuleProgressKey,
  isAgentOrchestrationLabStateCompletable,
  saveAgentOrchestrationArtifactDraft,
  saveAgentOrchestrationLabReceipt,
  type AgentOrchestrationLabState,
  type AgentOrchestrationLabStateKey,
  type AgentOrchestrationModuleSlug,
} from "../lib/agent-orchestration";
import { AGENT_ORCHESTRATION_PRACTICE_TEMPLATES } from "../lib/agent-orchestration/practice-templates";
import {
  PRODUCT_MANAGEMENT_COURSE_MANIFEST,
  PRODUCT_MANAGEMENT_CAPSTONE_KEY,
  PRODUCT_MANAGEMENT_PROGRESS_VERSION,
  PRODUCT_MANAGEMENT_PROGRESS_VERSION_KEY,
  PRODUCT_MANAGEMENT_QUIZ_PASSED_KEY,
  productManagementModuleProgressKey,
} from "../lib/product-management";
import { CLAUDE_INCOME_COURSE } from "../lib/claude-income";
import { DEEPSEEK_KEY_STORAGE } from "../lib/byok/key-store";
import { GROK_PROGRESS_STORAGE_KEY } from "../lib/grok/progress";
import { LAB_DRAFT_KEY } from "../lib/lab/draft";
import {
  HANDBOOK_SECTION_IDS,
  LAB_STEPS,
  LEARNING_KEY,
  LEGACY_PROGRESS_KEY as SHARED_PROGRESS_STORAGE_KEY,
} from "../lib/progress";
import {
  CURSOR_PROGRESS_RESET_QUARANTINE_KEY,
  GROK_PROGRESS_RESET_QUARANTINE_KEY,
  LEARNING_RESET_QUARANTINE_KEY,
  PROGRESS_LOCAL_DURABLE_KEYS,
  PROGRESS_LOCAL_QUARANTINE_KEYS,
  RECENCY_RESET_QUARANTINE_KEY,
  SHARED_PROGRESS_RESET_QUARANTINE_KEY,
} from "../lib/progress-storage-contract";
import {
  AGENT_ORCHESTRATION_PROGRESS_MODULE_SLUGS,
  CURSOR_PROGRESS_STORAGE_KEY,
  MAKE_MONEY_PROGRESS_LESSON_SLUGS,
  MAKE_MONEY_PROGRESS_SCHEMA,
} from "../lib/progress-topology";
import releaseSurface from "../config/course-release-surface.json" with { type: "json" };
import { expect, test } from "./fixtures";

const SITE = "https://aicourse.top";
const MAX_SITEMAP_BYTES = 500 * 1024;
const RESET_QUARANTINE_SUFFIX = ".reset-quarantine.v1";
const PROGRESS_RECENCY_STORAGE_KEY = RECENCY_RESET_QUARANTINE_KEY.slice(
  0,
  -RESET_QUARANTINE_SUFFIX.length,
);
if (!PROGRESS_LOCAL_DURABLE_KEYS.some((key) => key === PROGRESS_RECENCY_STORAGE_KEY)) {
  throw new Error("Recency quarantine must resolve to a declared durable progress key");
}
const THEME_STORAGE_KEY = "ae.theme";
const LANGUAGE_STORAGE_KEY = "ae.lang";
const RESET_QUARANTINE_SEED_KEY = "__aicourse_e2e_reset_quarantine_seeded__";
const RESET_CONFLICT_SEED_KEY = "__aicourse_e2e_reset_conflict_seeded__";
const LOCALE_RECOVERY_MARKER = "SAFE_LOCALE_BOUNDARY_RENDER_FAILURE";
const GLOBAL_RECOVERY_MARKER = "SAFE_GLOBAL_BOUNDARY_RENDER_FAILURE";
const PROTECTED_RESET_KEYS = {
  theme: THEME_STORAGE_KEY,
  language: LANGUAGE_STORAGE_KEY,
  labDraft: LAB_DRAFT_KEY,
  providerKey: DEEPSEEK_KEY_STORAGE,
} as const;

const EXPECTED_PUBLISHED_IDS = [
  "agent-orchestration",
  "agentic",
  "ai-tutor",
  "claude-income",
  "github",
  "grok",
  "make-money-with-codex",
  "mcp",
  "product-management",
  "prompts",
  "rag",
  "software-engineering",
] as const;

const EXPECTED_BLOCKED_IDS = ["claude", "codex", "cursor"] as const;

const GROK_LESSON_SLUGS = [
  "map-grok",
  "read-interface",
  "privacy-boundaries",
  "task-contracts",
  "search-verify",
  "files-data",
  "software-engineering",
  "research-workflow",
  "writing-workflow",
  "office-workflow",
  "teaching-workflow",
  "imagine-multimodal",
  "connect-automate",
  "capstone",
] as const;

const COMPLETE_GROK_PROGRESS = {
  schemaVersion: 1,
  lessons: Object.fromEntries(GROK_LESSON_SLUGS.map((slug) => [slug, true])),
  quizBest: GROK_LESSON_SLUGS.length,
  quizPassed: true,
  capstoneChecks: Array.from({ length: 7 }, () => true),
  capstoneReady: true,
} as const;

const AGENTIC_EMPTY_PROGRESS = {
  version: 2,
  handbook: {
    lastSection: "start",
    visitedSections: [],
    controlRoom: { completedRuns: 0 },
  },
  lab: {
    completedSteps: [],
    evalRunsCompleted: 0,
  },
} as const;

const CORRUPT_RESET_OWNERS = [
  {
    activeKey: LEARNING_KEY,
    quarantineKey: LEARNING_RESET_QUARANTINE_KEY,
    raw: '{"owner":"agentic","bytes":',
  },
  {
    activeKey: SHARED_PROGRESS_STORAGE_KEY,
    quarantineKey: SHARED_PROGRESS_RESET_QUARANTINE_KEY,
    raw: '{"owner":"shared","bytes":',
  },
  {
    activeKey: CURSOR_PROGRESS_STORAGE_KEY,
    quarantineKey: CURSOR_PROGRESS_RESET_QUARANTINE_KEY,
    raw: '{"owner":"cursor","bytes":',
  },
  {
    activeKey: GROK_PROGRESS_STORAGE_KEY,
    quarantineKey: GROK_PROGRESS_RESET_QUARANTINE_KEY,
    raw: '{"owner":"grok","bytes":',
  },
  {
    activeKey: PROGRESS_RECENCY_STORAGE_KEY,
    quarantineKey: RECENCY_RESET_QUARANTINE_KEY,
    raw: '{"owner":"recency","bytes":',
  },
] as const;

const LAB_ENUM_CANDIDATES: Partial<
  Record<AgentOrchestrationLabStateKey, readonly unknown[]>
> = {
  routeInput: ["known", "ambiguous", "refused"],
  joinPolicy: ["all", "quorum", "first-valid", "best-effort"],
  lostStateLayer: ["context", "conversation", "session", "run-state"],
  capacityState: ["normal", "reduced", "slow-tail"],
  failure: ["before", "ambiguous", "after"],
  evidenceQuestion: [
    "execution-path",
    "service-health",
    "accountability",
    "outcome-quality",
  ],
  selectedEvidenceSystem: ["trace", "monitor", "audit", "evaluation"],
};

function labCandidateValues(
  key: AgentOrchestrationLabStateKey,
  current: AgentOrchestrationLabState[AgentOrchestrationLabStateKey],
): readonly unknown[] {
  const declared = LAB_ENUM_CANDIDATES[key];
  if (declared) return declared;
  if (typeof current === "boolean") return [!current, current];
  if (typeof current === "number") return [0, 1, 2, 3, 4, 5];
  return [current];
}

function completableAgentOrchestrationLabState(
  slug: AgentOrchestrationModuleSlug,
): AgentOrchestrationLabState {
  const labId = AGENT_ORCHESTRATION_LAB_ID_BY_MODULE[slug];
  const fields = AGENT_ORCHESTRATION_LAB_ACTIVE_FIELDS[slug];

  const search = (
    index: number,
    state: AgentOrchestrationLabState,
  ): AgentOrchestrationLabState | null => {
    if (index >= fields.length) {
      return isAgentOrchestrationLabStateCompletable(slug, labId, state)
        ? state
        : null;
    }
    const key = fields[index];
    for (const value of labCandidateValues(key, state[key])) {
      const found = search(index + 1, {
        ...state,
        [key]: value,
      } as AgentOrchestrationLabState);
      if (found) return found;
    }
    return null;
  };

  const state = search(0, { ...AGENT_ORCHESTRATION_INITIAL_LAB_STATE });
  if (!state) throw new Error(`No completable Agent Orchestration lab state for ${slug}`);
  return state;
}

function completedAgentOrchestrationArtifact(starter: string): string {
  const evidence = [
    "- Verified control owner: workflow evidence records authority, budget, rollback, and independent review because release safety requires traceable decisions.",
    "- Recovery verifier: an independent reviewer records the rollback result, authority boundary, budget threshold, and release decision before promotion.",
  ].join("\n");
  return starter.replace(/^(## .+)$/gmu, `$1\n${evidence}`);
}

function agentOrchestrationProgress(completedModules: number, complete = false) {
  const record: Record<string, unknown> = {
    [AGENT_ORCHESTRATION_PROGRESS_VERSION_KEY]: AGENT_ORCHESTRATION_PROGRESS_VERSION,
  };
  const slugs = AGENT_ORCHESTRATION_PROGRESS_MODULE_SLUGS.slice(0, completedModules);

  for (const slug of slugs) {
    const moduleSlug = slug as AgentOrchestrationModuleSlug;
    const starter = AGENT_ORCHESTRATION_PRACTICE_TEMPLATES[moduleSlug].en;
    const artifactSaved = saveAgentOrchestrationArtifactDraft(
      record,
      moduleSlug,
      completedAgentOrchestrationArtifact(starter),
      starter,
    );
    const labSaved = saveAgentOrchestrationLabReceipt(
      record,
      moduleSlug,
      AGENT_ORCHESTRATION_LAB_ID_BY_MODULE[moduleSlug],
      completableAgentOrchestrationLabState(moduleSlug),
      "I selected this control state because it preserves authority, evidence, recovery, and independent review; the owner can verify the outcome before release.",
    );
    if (!artifactSaved || !labSaved) {
      throw new Error(`Unable to build valid Agent Orchestration progress for ${moduleSlug}`);
    }
    record[agentOrchestrationCheckpointPassedKey(moduleSlug)] = true;
    record[agentOrchestrationModuleProgressKey(moduleSlug)] = true;
  }

  if (complete) {
    record[AGENT_ORCHESTRATION_QUIZ_BEST_KEY] = 100;
    record[AGENT_ORCHESTRATION_QUIZ_PASSED_KEY] = true;
    record[AGENT_ORCHESTRATION_CAPSTONE_CHECKS_KEY] = Array.from(
      { length: AGENT_ORCHESTRATION_CAPSTONE_ARTIFACT_COUNT },
      (_, index) => `ticket:orchestration-control-evidence-${String(index + 1).padStart(2, "0")}`,
    );
  }
  return record;
}

function productManagementProgress(completedModules: number, complete = false) {
  const record: Record<string, unknown> = {
    [PRODUCT_MANAGEMENT_PROGRESS_VERSION_KEY]: PRODUCT_MANAGEMENT_PROGRESS_VERSION,
  };
  for (const courseModule of PRODUCT_MANAGEMENT_COURSE_MANIFEST.modules.slice(0, completedModules)) {
    record[productManagementModuleProgressKey(courseModule.slug)] = true;
  }
  if (complete) {
    record[PRODUCT_MANAGEMENT_QUIZ_PASSED_KEY] = true;
    record[PRODUCT_MANAGEMENT_CAPSTONE_KEY] = true;
  }
  return record;
}

function claudeIncomeProgress(completedLessons: number, complete = false) {
  const record: Record<string, unknown> = Object.fromEntries(
    CLAUDE_INCOME_COURSE.lessons.slice(0, completedLessons).map((lesson) => [
      `claude-income.lesson.${lesson.slug}.complete`,
      true,
    ]),
  );
  if (complete) {
    record["claude-income.quiz.version"] = "2026-08-23.v1";
    record["claude-income.quiz.passed"] = true;
    record["claude-income.capstone.v1"] = true;
  }
  return record;
}

function makeMoneyProgress(completedLessons: number, complete = false) {
  const record: Record<string, unknown> = {
    [MAKE_MONEY_PROGRESS_SCHEMA.courseVersionKey]: MAKE_MONEY_PROGRESS_SCHEMA.courseVersion,
  };
  for (const slug of MAKE_MONEY_PROGRESS_LESSON_SLUGS.slice(0, completedLessons)) {
    record[`make-money-with-codex.lesson.${slug}`] = true;
  }
  if (complete) {
    record["make-money-with-codex.quiz.best"] = MAKE_MONEY_PROGRESS_SCHEMA.quizQuestionCount;
    record["make-money-with-codex.quiz.passed"] = true;
    record["make-money-with-codex.quiz.version"] = MAKE_MONEY_PROGRESS_SCHEMA.quizVersion;
    record["make-money-with-codex.capstone.checks"] = Array.from(
      { length: MAKE_MONEY_PROGRESS_SCHEMA.capstoneItemCount },
      () => true,
    );
    record["make-money-with-codex.capstone.v1"] = true;
  }
  return record;
}

type CourseSurface = (typeof releaseSurface.courses)[number];

const publishedCourses = releaseSurface.courses.filter(
  (course) => course.state === "published",
);
const blockedCourses = releaseSurface.courses.filter(
  (course) => course.state === "blocked",
);

const FRESH_DASHBOARD_CTA_CONTRACTS = [
  {
    id: "agentic",
    path: "/en/handbook/",
    label: /^Start$/,
    href: "/en/handbook/#start",
  },
  {
    id: "grok",
    path: "/en/grok/",
    label: /^Start with the product map$/,
    href: "/en/grok/map-grok/",
  },
  {
    id: "github",
    path: "/en/github/",
    label: /^Start with account safety$/,
    href: "/en/github/start-secure/",
  },
  {
    id: "prompts",
    path: "/en/prompts/",
    label: /^Start with lesson 1$/,
    href: "/en/prompts/prompts-are-specifications/",
  },
  {
    id: "software-engineering",
    path: "/en/software-engineering/",
    label: /^Start course$/,
    href: "/en/software-engineering/agentic-engineering-system/",
  },
  {
    id: "rag",
    path: "/en/rag/",
    label: /^Start with the RAG decision$/,
    href: "/en/rag/choose-rag/",
  },
  {
    id: "mcp",
    path: "/en/mcp/",
    label: /^Start course$/,
    href: "/en/mcp/why-mcp/",
  },
  {
    id: "make-money-with-codex",
    path: "/en/make-money-with-codex/",
    label: /^Start the evidence path$/,
    href: "/en/make-money-with-codex/money-not-magic/",
  },
  {
    id: "claude-income",
    path: "/en/claude-income/",
    label: /^Start lesson 1$/,
    href: "/en/claude-income/choose-a-money-path/",
  },
  {
    id: "ai-tutor",
    path: "/en/ai-tutor/",
    label: /^Start with the learning contract$/,
    href: "/en/ai-tutor/objectives-concept-map/",
  },
  {
    id: "product-management",
    path: "/en/product-management/",
    label: /^Begin the product loop$/,
    href: "/en/product-management/product-judgment-operating-model/",
  },
  {
    id: "agent-orchestration",
    path: "/en/agent-orchestration/",
    label: /^Start with the autonomy boundary$/,
    href: "/en/agent-orchestration/workflow-agent-boundary/",
  },
] as const;

type StatefulDashboardCtaContract = {
  readonly id: string;
  readonly path: string;
  readonly storageKey: string;
  readonly fresh: { readonly label: RegExp; readonly href: string };
  readonly inProgress: {
    readonly label: RegExp;
    readonly href: string;
    readonly value: () => unknown;
  };
  readonly completed: {
    readonly label: RegExp;
    readonly href: string;
    readonly value: () => unknown;
  };
};

const STATEFUL_DASHBOARD_CTA_CONTRACTS: readonly StatefulDashboardCtaContract[] = [
  {
    id: "agentic",
    path: "/en/handbook/",
    storageKey: "ae.learning.v2",
    fresh: { label: /^Start$/, href: "/en/handbook/#start" },
    inProgress: {
      label: /^Resume$/,
      href: "/en/handbook/#code",
      value: () => ({
        ...AGENTIC_EMPTY_PROGRESS,
        handbook: {
          ...AGENTIC_EMPTY_PROGRESS.handbook,
          visitedSections: ["start"],
        },
      }),
    },
    completed: {
      label: /^Review$/,
      href: "/en/handbook/",
      value: () => ({
        version: 2,
        handbook: {
          lastSection: "play",
          visitedSections: [...HANDBOOK_SECTION_IDS],
          controlRoom: { completedRuns: 1, bestScore: 10 },
        },
        lab: {
          completedSteps: [...LAB_STEPS],
          evalRunsCompleted: 1,
          evalBest: 20,
        },
      }),
    },
  },
  {
    id: "grok",
    path: "/en/grok/",
    storageKey: "aicourse.grok.progress.v1",
    fresh: {
      label: /^Start with the product map$/,
      href: "/en/grok/map-grok/",
    },
    inProgress: {
      label: /^Resume your next lesson$/,
      href: "/en/grok/read-interface/",
      value: () => ({
        ...COMPLETE_GROK_PROGRESS,
        lessons: { "map-grok": true },
        quizBest: 0,
        quizPassed: false,
        capstoneChecks: Array.from({ length: 7 }, () => false),
        capstoneReady: false,
      }),
    },
    completed: {
      label: /^Review$/,
      href: "/en/grok/map-grok/",
      value: () => COMPLETE_GROK_PROGRESS,
    },
  },
  {
    id: "make-money-with-codex",
    path: "/en/make-money-with-codex/",
    storageKey: "ae.progress",
    fresh: {
      label: /^Start the evidence path$/,
      href: "/en/make-money-with-codex/money-not-magic/",
    },
    inProgress: {
      label: /^Resume course$/,
      href: "/en/make-money-with-codex/choose-market-wedge/",
      value: () => makeMoneyProgress(1),
    },
    completed: {
      label: /^Review course$/,
      href: "/en/make-money-with-codex/money-not-magic/",
      value: () => makeMoneyProgress(MAKE_MONEY_PROGRESS_LESSON_SLUGS.length, true),
    },
  },
  {
    id: "claude-income",
    path: "/en/claude-income/",
    storageKey: "ae.progress",
    fresh: {
      label: /^Start lesson 1$/,
      href: "/en/claude-income/choose-a-money-path/",
    },
    inProgress: {
      label: /^Resume course$/,
      href: "/en/claude-income/validate-paid-demand/",
      value: () => claudeIncomeProgress(1),
    },
    completed: {
      label: /^Review course$/,
      href: "/en/claude-income/choose-a-money-path/",
      value: () => claudeIncomeProgress(CLAUDE_INCOME_COURSE.lessons.length, true),
    },
  },
  {
    id: "product-management",
    path: "/en/product-management/",
    storageKey: "ae.progress",
    fresh: {
      label: /^Begin the product loop$/,
      href: "/en/product-management/product-judgment-operating-model/",
    },
    inProgress: {
      label: /^Resume your product loop$/,
      href: "/en/product-management/vision-strategy-business-model/",
      value: () => productManagementProgress(1),
    },
    completed: {
      label: /^Review the product loop$/,
      href: "/en/product-management/product-judgment-operating-model/",
      value: () => productManagementProgress(
        PRODUCT_MANAGEMENT_COURSE_MANIFEST.modules.length,
        true,
      ),
    },
  },
  {
    id: "agent-orchestration",
    path: "/en/agent-orchestration/",
    storageKey: "ae.progress",
    fresh: {
      label: /^Start with the autonomy boundary$/,
      href: "/en/agent-orchestration/workflow-agent-boundary/",
    },
    inProgress: {
      label: /^Resume the orchestration system$/,
      href: "/en/agent-orchestration/task-graphs-contracts/",
      value: () => agentOrchestrationProgress(1),
    },
    completed: {
      label: /^Review course$/,
      href: "/en/agent-orchestration/workflow-agent-boundary/",
      value: () => agentOrchestrationProgress(
        AGENT_ORCHESTRATION_PROGRESS_MODULE_SLUGS.length,
        true,
      ),
    },
  },
];

function normalizedRoute(route: string) {
  return `${route.replace(/^\/+|\/+$/g, "")}/`;
}

function localizedPath(locale: string, route: string) {
  return `/${locale}/${normalizedRoute(route)}`;
}

function canonicalUrl(locale: string, route: string) {
  return `${SITE}${localizedPath(locale, route)}`;
}

function primaryJourneyLinks(page: Page) {
  return page.locator("main [data-course-journey-action]:visible");
}

async function expectSinglePrimaryJourneyLink(
  page: Page,
  expected: { readonly label: RegExp; readonly href: string },
) {
  const links = primaryJourneyLinks(page);
  await expect(
    links,
    "a course dashboard must expose exactly one visible primary learning journey action",
  ).toHaveCount(1);
  await expect(links).toHaveAccessibleName(expected.label);
  await expect(links).toHaveAttribute("href", expected.href);
}

async function expectSharedDashboardShell(page: Page, courseId: string) {
  const expected = publishedCourses.find((course) => course.id === courseId);
  expect(expected, `${courseId}: published registry contract`).toBeDefined();
  const shell = page.locator(`[data-course-shell="${courseId}"]`);
  await expect(shell, `${courseId}: one shared course shell`).toHaveCount(1);
  await expect(shell).toBeVisible();
  await expect(shell).toHaveAttribute("data-course-publication-state", expected!.state);
  await expect(shell).toHaveAttribute(
    "data-course-level",
    /^(?:beginner|intermediate|advanced)(?:-to-(?:intermediate|advanced))?$/,
  );
  await expect(shell).toHaveAttribute("data-course-minutes", /^[1-9]\d*$/);
  await expect(shell).toHaveAttribute(
    "data-course-content-language",
    expected!.primaryLocale ?? "en",
  );
  await expect(shell).toHaveAttribute("data-course-progress-storage", "browser-local");

  for (const field of [
    "status",
    "difficulty",
    "duration",
    "content-language",
    "local-progress",
  ] as const) {
    const value = shell.locator(`[data-course-shell-field="${field}"]`);
    await expect(value, `${courseId}: shared shell ${field}`).toHaveCount(1);
    await expect(value).toBeVisible();
    await expect(value).not.toHaveText(/^\s*$/);
  }
  await expect(shell.locator(".shared-course-storage-note"))
    .toContainText(/browser|local|this device/i);

  const breadcrumb = page.locator("main nav").filter({
    has: page.locator('a[href="/en/courses/"]'),
  }).filter({
    has: page.locator('[aria-current="page"]'),
  }).first();
  await expect(breadcrumb, `${courseId}: dashboard breadcrumb`).toBeVisible();

  const journey = primaryJourneyLinks(page);
  const progressRegion = journey.locator(
    "xpath=ancestor::*[self::section or self::aside][1]",
  );
  await expect(progressRegion, `${courseId}: visible progress region`).toBeVisible();
  await expect(progressRegion).toContainText(/%|\d+\s*\/\s*\d+|milestones?/i);
}

async function replaceStoredProgress(page: Page, key: string, value: unknown) {
  await page.evaluate(({ storageKey, progress }) => {
    localStorage.setItem(storageKey, JSON.stringify(progress));
  }, { storageKey: key, progress: value });
  await page.reload();
}

async function expectNoHorizontalOverflow(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
  await expect.poll(() => page.evaluate(() => {
    const root = document.documentElement;
    return Math.max(root.scrollWidth, document.body.scrollWidth) - root.clientWidth;
  }), { message: "the product surface must not overflow the viewport horizontally" })
    .toBeLessThanOrEqual(1);
}

async function expectIntersectsVisualViewport(target: Locator) {
  await target.evaluate((element) => {
    element.scrollIntoView({ block: "center", inline: "center" });
  });
  await expect.poll(() => target.evaluate((element) => {
    const viewport = window.visualViewport;
    if (!viewport) return false;
    const bounds = element.getBoundingClientRect();
    const viewportRight = viewport.offsetLeft + viewport.width;
    const viewportBottom = viewport.offsetTop + viewport.height;
    return bounds.width > 0
      && bounds.height > 0
      && bounds.right > viewport.offsetLeft
      && bounds.left < viewportRight
      && bounds.bottom > viewport.offsetTop
      && bounds.top < viewportBottom;
  }), { message: "the control must intersect the 200% visual viewport" }).toBe(true);
}

async function expectPrimaryHeadingFocused(page: Page) {
  const heading = page.locator("main h1").first();
  await expect(heading).toBeVisible();
  await expect(heading).toBeFocused();
}

type SeriousAxeViolation = {
  readonly id: string;
  readonly impact: "critical" | "serious";
  readonly targets: readonly (readonly string[])[];
};

async function criticalOrSeriousAxeViolations(page: Page): Promise<SeriousAxeViolation[]> {
  // Contrast must be measured after entry motion settles. Running axe while
  // an opacity-based hero animation is mid-frame reports a transient blended
  // colour that the learner never has to read as a stable state.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => page.evaluate(() => (
    document.getAnimations().filter((animation) => (
      animation.constructor.name === "CSSTransition"
    )).length
  )), {
    message: "theme styles must settle before the accessibility audit",
    timeout: 2_000,
  }).toBe(0);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
  if (!await page.evaluate(() => "axe" in window)) {
    await page.addScriptTag({ content: axe.source });
  }
  return page.evaluate(async () => {
    const axeApi = (window as unknown as {
      axe: {
        run(
          root: Document,
          options: { runOnly: { type: "tag"; values: string[] } },
        ): Promise<{
          violations: Array<{
            id: string;
            impact: string | null;
            nodes: Array<{ target: string[] }>;
          }>;
        }>;
      };
    }).axe;
    const results = await axeApi.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
      },
    });

    return results.violations
      .filter((violation) => violation.impact === "critical" || violation.impact === "serious")
      .map((violation) => ({
        id: violation.id,
        impact: violation.impact as "critical" | "serious",
        // Deliberately omit HTML, failure summaries, and page text from CI evidence.
        targets: violation.nodes.map((node) => node.target),
      }));
  });
}

async function waitForLearningDashboard(page: Page) {
  await expect(page.locator(".learning-dashboard"))
    .toHaveAttribute("aria-busy", "false");
}

function expectedPublishedUrls() {
  const urls = new Set<string>();

  for (const route of releaseSurface.core.routes) {
    for (const locale of releaseSurface.core.contentLocales) {
      urls.add(route ? canonicalUrl(locale, route) : `${SITE}/${locale}/`);
    }
  }

  for (const course of publishedCourses) {
    for (const route of course.routes) {
      for (const locale of course.contentLocales) {
        urls.add(canonicalUrl(locale, route));
      }
    }
  }

  return urls;
}

async function internalPageLinks(page: Page, selector: string) {
  return page.locator(`${selector} a[href]`).evaluateAll((links, site) => {
    const productionOrigin = new URL(site).origin;
    return links.flatMap((link) => {
      const raw = link.getAttribute("href");
      if (!raw) return [];
      let url: URL;
      try {
        url = new URL(raw, window.location.href);
      } catch {
        return [];
      }
      if (
        ![window.location.origin, productionOrigin].includes(url.origin)
        || !["http:", "https:"].includes(url.protocol)
      ) return [];
      const finalSegment = url.pathname.split("/").filter(Boolean).at(-1) ?? "";
      // Downloads and public evidence are assets, not application routes.
      if (finalSegment.includes(".")) return [];
      const pathname = url.pathname === "/"
        ? "/"
        : `/${url.pathname.replace(/^\/+|\/+$/g, "")}/`;
      return [{ raw, pathname }];
    });
  }, SITE);
}

function collectTypedNodes(value: unknown, type: string, result: Record<string, unknown>[] = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectTypedNodes(item, type, result);
    return result;
  }
  if (!value || typeof value !== "object") return result;

  const record = value as Record<string, unknown>;
  const declaredType = record["@type"];
  if (
    declaredType === type
    || (Array.isArray(declaredType) && declaredType.includes(type))
  ) {
    result.push(record);
  }
  for (const child of Object.values(record)) collectTypedNodes(child, type, result);
  return result;
}

function collectSiteUrls(value: unknown, result: string[] = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectSiteUrls(item, result);
    return result;
  }
  if (typeof value === "string") {
    if (value.startsWith(SITE)) result.push(value);
    return result;
  }
  if (!value || typeof value !== "object") return result;
  for (const child of Object.values(value as Record<string, unknown>)) {
    collectSiteUrls(child, result);
  }
  return result;
}

async function expectMetadataContract(page: Page, course: CourseSurface, route: string) {
  const canonical = canonicalUrl("en", route);
  const canonicalLink = page.locator('link[rel="canonical"]');
  await expect(canonicalLink).toHaveCount(1);
  await expect(canonicalLink).toHaveAttribute("href", canonical);

  const alternates = await page
    .locator('link[rel="alternate"][hreflang]')
    .evaluateAll((links) => links.map((link) => ({
      locale: link.getAttribute("hreflang"),
      href: link.getAttribute("href"),
    })));
  const expectedAlternates = [
    ...course.contentLocales.map((locale) => ({
      locale,
      href: canonicalUrl(locale, route),
    })),
    { locale: "x-default", href: canonicalUrl(course.primaryLocale!, route) },
  ];

  expect(
    alternates.sort((a, b) => String(a.locale).localeCompare(String(b.locale))),
    `${course.id}: hreflang must describe only real content locales`,
  ).toEqual(
    expectedAlternates.sort((a, b) => String(a.locale).localeCompare(String(b.locale))),
  );
  expect(alternates.every((alternate) => !alternate.href?.includes("?"))).toBe(true);

  const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
  const documents = scripts.map((script, index) => {
    try {
      return JSON.parse(script) as unknown;
    } catch {
      throw new Error(`${course.id}: JSON-LD script ${index + 1} is not valid JSON`);
    }
  });
  const courseNodes = documents.flatMap((document) => collectTypedNodes(document, "Course"));
  const learningResourceNodes = documents.flatMap((document) =>
    collectTypedNodes(document, "LearningResource"));
  const structuredUrls = documents.flatMap((document) => collectSiteUrls(document));

  expect(
    structuredUrls,
    `${course.id}: the current canonical must be represented in JSON-LD`,
  ).toContain(canonical);
  expect(structuredUrls.every((url) => !url.includes("?"))).toBe(true);

  expect(courseNodes.length, `${course.id}: dashboard must expose Course JSON-LD`).toBeGreaterThan(0);
  expect(
    courseNodes.some((node) => node.url === canonicalUrl("en", course.routes[0])),
    `${course.id}: Course JSON-LD URL must identify the course dashboard`,
  ).toBe(true);
  expect(
    [...courseNodes, ...learningResourceNodes].some(
      (node) => node.url === canonical && node.inLanguage === "en",
    ),
    `${course.id}: the current JSON-LD page node must declare its actual content language`,
  ).toBe(true);

  for (const blocked of blockedCourses) {
    const blockedSegment = `/${normalizedRoute(blocked.routes[0] ?? blocked.id)}`;
    expect(
      structuredUrls.every((url) => !new URL(url).pathname.includes(blockedSegment)),
      `${course.id}: structured data must not disclose blocked course routes`,
    ).toBe(true);
  }
}

function decodeXmlText(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}

function xmlLocations(xml: string) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
    decodeXmlText(match[1].trim()),
  );
}

async function readPublishedSitemap(request: APIRequestContext) {
  const pending = ["/sitemap.xml"];
  const visited = new Set<string>();
  const pageUrls = new Set<string>();

  while (pending.length) {
    const path = pending.shift()!;
    if (visited.has(path)) continue;
    visited.add(path);

    const response = await request.get(path);
    expect(response.status(), `${path} must be available`).toBe(200);
    const body = await response.body();
    expect(body.byteLength, `${path} must stay within the sitemap shard budget`)
      .toBeLessThanOrEqual(MAX_SITEMAP_BYTES);
    const xml = body.toString("utf8");
    const locations = xmlLocations(xml);

    if (/<sitemapindex(?:\s|>)/.test(xml)) {
      for (const location of locations) {
        const url = new URL(location);
        expect(url.origin, `${path} may reference only this product's sitemap shards`).toBe(SITE);
        pending.push(url.pathname);
      }
      continue;
    }

    expect(xml, `${path} must be a sitemap index or URL set`).toMatch(/<urlset(?:\s|>)/);
    for (const location of locations) pageUrls.add(location);
  }

  return { pageUrls, sitemapFiles: visited };
}

async function expectEnglishRecoverySurface(
  page: Page,
  activeTestId: "locale-error" | "global-error",
  inactiveTestId: "locale-error" | "global-error",
  safeMarker: string,
) {
  const active = page.getByTestId(activeTestId);
  await expect(active).toHaveCount(1);
  await expect(active).toBeVisible();
  await expect(page.getByTestId(inactiveTestId)).toHaveCount(0);
  await expect(active).toHaveAttribute("role", "alert");
  await expect(active.getByRole("heading", {
    level: 1,
    name: "This page stopped working.",
  })).toBeVisible();
  await expect(active.getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(active.getByRole("link", { name: "Return home" }))
    .toHaveAttribute("href", "/en/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");

  const bodyText = await page.locator("body").innerText();
  expect(bodyText.trim().length, `${activeTestId}: recovery document must not be blank`)
    .toBeGreaterThan(0);
  expect(bodyText, `${activeTestId}: visible DOM must omit the safe failure marker`)
    .not.toContain(safeMarker);
  expect(await page.content(), `${activeTestId}: serialized DOM must omit the safe failure marker`)
    .not.toContain(safeMarker);
}

test("release registry pins exactly the approved twelve-course surface", () => {
  expect(releaseSurface.schemaVersion).toBe(2);
  expect(publishedCourses.map((course) => course.id).sort()).toEqual(
    [...EXPECTED_PUBLISHED_IDS].sort(),
  );
  expect(blockedCourses.map((course) => course.id).sort()).toEqual(
    [...EXPECTED_BLOCKED_IDS].sort(),
  );
  expect(publishedCourses).toHaveLength(12);

  for (const course of publishedCourses) {
    expect(course.primaryLocale, `${course.id}: primary locale`).toBe("en");
    expect(course.contentLocales, `${course.id}: real content locales`).toContain("en");
    expect(course.routes.length, `${course.id}: public routes`).toBeGreaterThan(0);
    expect(course.releaseGate, `${course.id}: fail-closed release gate`).toBeTruthy();
    expect(course.href, `${course.id}: public dashboard href`).toBe(
      `/${normalizedRoute(course.routes[0])}`,
    );
  }
});

test("locale recovery boundary handles an injected render failure without exposing it", async ({ page }) => {
  let pageErrorCount = 0;
  let consoleErrorCount = 0;
  page.on("pageerror", () => { pageErrorCount += 1; });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrorCount += 1;
  });

  await page.addInitScript(({ locale, marker }) => {
    const NativeNumberFormat = Intl.NumberFormat;
    const throwingNumberFormat = new Proxy(NativeNumberFormat, {
      construct(target, args, newTarget) {
        if (args.length === 1 && args[0] === locale) {
          throw new Error(marker);
        }
        return Reflect.construct(target, args, newTarget);
      },
    });
    Object.defineProperty(Intl, "NumberFormat", {
      configurable: true,
      writable: true,
      value: throwingNumberFormat,
    });
  }, { locale: "en", marker: LOCALE_RECOVERY_MARKER });

  // Grok's client-side progress/assessment surface intentionally constructs
  // this exact formatter during hydration. Keep the injected fault below the
  // locale layout so it exercises app/[locale]/error.tsx, not global-error.
  const response = await page.goto("/en/grok/");
  expect(response?.status()).toBe(200);
  await expectEnglishRecoverySurface(
    page,
    "locale-error",
    "global-error",
    LOCALE_RECOVERY_MARKER,
  );
  expect(pageErrorCount, "the locale boundary must handle the render failure").toBe(0);
  expect(
    consoleErrorCount,
    "the framework may log the handled fault, but evidence retains only a count",
  ).toBeGreaterThan(0);
});

test("global recovery boundary handles an injected layout failure without exposing it", async ({ page }) => {
  let pageErrorCount = 0;
  let consoleErrorCount = 0;
  page.on("pageerror", () => { pageErrorCount += 1; });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrorCount += 1;
  });

  await page.addInitScript(({ mediaQuery, marker }) => {
    const nativeMatchMedia = window.matchMedia.bind(window);
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value(query: string) {
        if (query === mediaQuery) throw new Error(marker);
        return nativeMatchMedia(query);
      },
    });
  }, {
    mediaQuery: "(prefers-color-scheme:dark)",
    marker: GLOBAL_RECOVERY_MARKER,
  });

  const response = await page.goto("/en/");
  expect(response?.status()).toBe(200);
  await expectEnglishRecoverySurface(
    page,
    "global-error",
    "locale-error",
    GLOBAL_RECOVERY_MARKER,
  );
  expect(pageErrorCount, "the global boundary must handle the layout failure").toBe(0);
  expect(
    consoleErrorCount,
    "the framework may log the handled fault, but evidence retains only a count",
  ).toBeGreaterThan(0);
});

for (const contract of FRESH_DASHBOARD_CTA_CONTRACTS) {
  test(`${contract.id}: fresh dashboard exposes exactly one primary learning CTA`, async ({ page }) => {
    const response = await page.goto(contract.path);
    expect(response?.status(), `${contract.id}: dashboard response`).toBe(200);
    await expect(page.locator("main h1").first()).toBeVisible();
    await expectSharedDashboardShell(page, contract.id);
    await expectSinglePrimaryJourneyLink(page, contract);
  });
}

for (const contract of STATEFUL_DASHBOARD_CTA_CONTRACTS) {
  test(`${contract.id}: primary CTA changes from Start to exact Resume to Review`, async ({ page }) => {
    const response = await page.goto(contract.path);
    expect(response?.status(), `${contract.id}: fresh dashboard response`).toBe(200);
    await expectSinglePrimaryJourneyLink(page, contract.fresh);

    await replaceStoredProgress(page, contract.storageKey, contract.inProgress.value());
    await expectSinglePrimaryJourneyLink(page, contract.inProgress);

    await replaceStoredProgress(page, contract.storageKey, contract.completed.value());
    await expectSinglePrimaryJourneyLink(page, contract.completed);
  });
}

for (const course of publishedCourses) {
  test(`${course.id}: English dashboard and representative child route are published`, async ({ page }) => {
    const dashboard = course.routes[0];
    const child = course.routes.find((route) => route !== dashboard);

    const dashboardResponse = await page.goto(localizedPath("en", dashboard));
    expect(dashboardResponse, `${course.id}: dashboard document response`).not.toBeNull();
    expect(dashboardResponse!.status(), `${course.id}: English dashboard`).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("main h1").first()).toBeVisible();
    await expectMetadataContract(page, course, dashboard);

    if (!child) return;
    // Route publication is a pair of independent document contracts. Loading
    // the child in its own page prevents the dashboard's cancellable Next Link
    // prefetches from racing WebKit's second page.goto while preserving the
    // child's real response, hydration, DOM, and metadata assertions.
    const childPage = await page.context().newPage();
    let unmockedChildProviderRequests = 0;
    await childPage.route("https://api.deepseek.com/**", (route) => {
      unmockedChildProviderRequests += 1;
      return route.abort("blockedbyclient");
    });
    try {
      const childResponse = await childPage.goto(localizedPath("en", child));
      expect(childResponse, `${course.id}: representative child document response`).not.toBeNull();
      expect(childResponse!.status(), `${course.id}: representative English child route`).toBe(200);
      await expect(childPage.locator("html")).toHaveAttribute("lang", "en");
      await expect(childPage.locator("main h1").first()).toBeVisible();
      await expectMetadataContract(childPage, course, child);
    } finally {
      await childPage.close();
      expect(
        unmockedChildProviderRequests,
        `${course.id}: representative child must not contact the live Provider`,
      ).toBe(0);
    }
  });

  test(`${course.id}: dashboard has no critical or serious axe findings`, async ({ page }) => {
    const response = await page.goto(localizedPath("en", course.routes[0]));
    expect(response?.status(), `${course.id}: English dashboard`).toBe(200);
    await expect(page.locator("main h1").first()).toBeVisible();
    for (const theme of ["light", "dark"] as const) {
      // Audit the same stable, persisted theme state a returning learner gets.
      // WebKit can expose partially propagated custom-property values when a
      // large document's data-theme attribute is mutated and axe reads it in
      // that same rendering turn. Loading the saved choice through the real
      // pre-hydration theme script avoids auditing a transient mixed palette;
      // any violation in the settled light or dark product state still fails.
      await page.evaluate(({ storageKey, selectedTheme }) => {
        localStorage.setItem(storageKey, selectedTheme);
      }, { storageKey: THEME_STORAGE_KEY, selectedTheme: theme });
      await page.reload();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await expect(page.locator("main h1").first()).toBeVisible();
      const violations = await criticalOrSeriousAxeViolations(page);
      expect(
        violations,
        `${course.id}: ${theme} critical/serious accessibility findings`,
      ).toEqual([]);
    }
  });

  test(`${course.id}: a representative learning route has breadcrumb, previous, and next navigation`, async ({ page }) => {
    const childIndex = course.id === "agentic" ? 1 : 2;
    const child = course.routes[childIndex];
    const previous = course.routes[childIndex - 1];
    const next = course.routes[childIndex + 1];
    expect(child, `${course.id}: representative learning route`).toBeTruthy();
    expect(previous, `${course.id}: previous learning route`).toBeTruthy();
    expect(next, `${course.id}: next learning route`).toBeTruthy();

    const response = await page.goto(localizedPath("en", child));
    expect(response?.status(), `${course.id}: representative learning route`).toBe(200);
    await expect(page.locator("main h1").first()).toBeVisible();

    const dashboardHref = localizedPath("en", course.routes[0]);
    const breadcrumb = page.locator("main nav").filter({
      has: page.locator(`a[href="${dashboardHref}"]`),
    }).filter({
      has: page.locator('[aria-current="page"]'),
    }).first();
    await expect(breadcrumb, `${course.id}: learning-route breadcrumb`).toBeVisible();
    const lessonNavigation = page.locator("main [data-course-lesson-nav]");
    await expect(lessonNavigation, `${course.id}: one shared lesson navigation`).toHaveCount(1);
    await expect(lessonNavigation).toBeVisible();
    await expect(lessonNavigation.locator(
      `a[rel="prev"][href="${localizedPath("en", previous)}"]`,
    ))
      .toBeVisible();
    await expect(lessonNavigation.locator(
      `a[rel="next"][href="${localizedPath("en", next)}"]`,
    ))
      .toBeVisible();
  });
}

test("blocked courses remain 404 in English and a non-English shell locale", async ({ page }) => {
  for (const course of blockedCourses) {
    const dashboard = course.routes[0];
    for (const locale of ["en", "ar"] as const) {
      await test.step(`${course.id}: ${locale}`, async () => {
        const response = await page.goto(localizedPath(locale, dashboard));
        expect(response, `${course.id}: 404 document response`).not.toBeNull();
        expect(response!.status(), `${course.id} must not have a public ${locale} route`).toBe(404);
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/i);
      });
    }
  }
});

test("courses never emit fallback pages for unsupported content locales", async ({ page }) => {
  let checked = 0;
  for (const course of publishedCourses) {
    const unsupportedLocale = releaseSurface.siteLocales.find(
      (locale) => !(course.contentLocales as readonly string[]).includes(locale),
    );
    if (!unsupportedLocale) continue;
    checked += 1;

    await test.step(`${course.id}: ${unsupportedLocale}`, async () => {
      const response = await page.goto(localizedPath(unsupportedLocale, course.routes[0]));
      expect(response, `${course.id}: unsupported-locale document response`).not.toBeNull();
      expect(
        response!.status(),
        `${course.id} must not masquerade English content as ${unsupportedLocale}`,
      ).toBe(404);
    });
  }
  expect(checked, "the matrix must include at least one honest unsupported-locale 404")
    .toBeGreaterThan(0);
});

test("home, catalog, and footer expose published links but no blocked hrefs", async ({ page }) => {
  const blockedSegments = blockedCourses.map((course) =>
    `/${normalizedRoute(course.routes[0] ?? course.id)}`,
  );

  for (const path of ["/en/", "/en/courses/"] as const) {
    const response = await page.goto(path);
    expect(response?.status(), `${path} must be published`).toBe(200);
    const localPaths = await page.locator("a[href]").evaluateAll((links) =>
      links.map((link) => new URL((link as HTMLAnchorElement).href).pathname),
    );
    for (const segment of blockedSegments) {
      expect(
        localPaths.every((href) => !href.includes(segment)),
        `${path} must not link to blocked route ${segment}`,
      ).toBe(true);
    }
  }

  const catalogHrefs = new Set(await page.locator('main a[href]').evaluateAll((links) =>
    links.map((link) => new URL((link as HTMLAnchorElement).href).pathname),
  ));
  const footerHrefs = new Set(await page.locator('footer a[href]').evaluateAll((links) =>
    links.map((link) => new URL((link as HTMLAnchorElement).href).pathname),
  ));
  for (const course of publishedCourses) {
    const href = localizedPath("en", course.routes[0]);
    expect(catalogHrefs, `catalog link for ${course.id}`).toContain(href);
    expect(footerHrefs, `footer link for ${course.id}`).toContain(href);
  }
});

test("blocked and roadmap courses stay localized, visible, non-linkable, and reason-free", async ({ page }) => {
  const upcomingCourses = releaseSurface.courses.filter(
    (course) => course.state === "blocked" || course.state === "roadmap",
  );
  const soonLabels = {
    en: "Coming soon",
    ar: "قريبًا",
    "zh-Hans": "即将推出",
  } as const;

  expect(
    upcomingCourses
      .filter((course) => course.state === "blocked")
      .map((course) => course.id)
      .sort(),
  ).toEqual([...EXPECTED_BLOCKED_IDS].sort());
  expect(upcomingCourses.filter((course) => course.state === "roadmap")).toHaveLength(2);

  for (const [locale, soonLabel] of Object.entries(soonLabels)) {
    await test.step(locale, async () => {
      const response = await page.goto(`/${locale}/courses/`);
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");

      const section = page.locator(
        'section[aria-labelledby="catalog-coming-soon-courses-title"]',
      );
      await expect(section.getByRole("heading", { name: soonLabel, exact: true })).toBeVisible();
      const cards = section.locator("li.catalog-course-card-upcoming");
      await expect(cards).toHaveCount(upcomingCourses.length);
      expect(await cards.evaluateAll((items) => items.map((item) => item.getAttribute("data-course-id"))))
        .toEqual(upcomingCourses.map((course) => course.id));

      for (const course of upcomingCourses) {
        const card = section.locator(
          `li.catalog-course-card-upcoming[data-course-id="${course.id}"]`,
        );
        await expect(card).toHaveCount(1);
        await expect(card.locator('[aria-disabled="true"]')).toHaveCount(1);
        await expect(card.locator("a[href]")).toHaveCount(0);
        await expect(card.locator(".catalog-course-status")).toHaveText(soonLabel);
        const text = await card.innerText();
        for (const blocker of ("blockers" in course ? course.blockers : []) ?? []) {
          expect(text).not.toContain(blocker);
        }
      }
    });
  }
});

test("catalog loading and empty-filter states are distinct and recoverable", async ({ page, request }) => {
  const staticResponse = await request.get("/en/courses/");
  expect(staticResponse.status()).toBe(200);
  const staticMarkup = await staticResponse.text();
  expect(staticMarkup).toContain("catalog-progress-pending");
  expect(staticMarkup).toContain('role="status"');
  expect(staticMarkup).toContain("Working…");
  expect(staticMarkup).not.toContain("catalog-empty");

  await page.goto("/en/courses/");
  await expect(page.locator(".catalog-progress-pending")).toHaveCount(0);

  const query = "no-course-can-match-this-audit-sentinel";
  await page.locator(".catalog-search-input").fill(query);
  const empty = page.locator(".catalog-empty");
  await expect(empty).toBeVisible();
  await expect(empty).toContainText("No course matches those filters.");
  await expect(page.locator(".catalog-result-count")).toHaveText("0 courses");
  await expect(page.locator("li.catalog-course-card")).toHaveCount(0);

  await empty.locator(".catalog-empty-reset").click();
  await expect(empty).toHaveCount(0);
  await expect(page.locator("li.catalog-course-card")).toHaveCount(releaseSurface.courses.length);
  await expect(page.locator(".catalog-search-input")).toHaveValue("");
});

test("home, catalog, and footer contain no extra internal page routes", async ({ page }) => {
  const expectedPaths = new Set(
    [...expectedPublishedUrls()].map((url) => new URL(url).pathname),
  );
  const surfaces = [
    { path: "/en/", selector: "main", label: "home" },
    { path: "/en/courses/", selector: "main", label: "catalog" },
    { path: "/en/courses/", selector: "footer", label: "footer" },
  ] as const;

  for (const surface of surfaces) {
    await test.step(surface.label, async () => {
      const response = await page.goto(surface.path);
      expect(response?.status()).toBe(200);
      const links = await internalPageLinks(page, surface.selector);
      expect(links.length, `${surface.label} must expose at least one internal page link`)
        .toBeGreaterThan(0);
      expect(
        links.filter((link) => !expectedPaths.has(link.pathname)),
        `${surface.label} must not disclose a typo, blocked route, or other unregistered page`,
      ).toEqual([]);
    });
  }
});

test("sitemap files equal the registry-derived localized route set", async ({ request }) => {
  const expected = expectedPublishedUrls();
  expect(expected.size, "the registry must derive at least one public route").toBeGreaterThan(0);

  const { pageUrls, sitemapFiles } = await readPublishedSitemap(request);
  expect(sitemapFiles.size).toBeGreaterThan(0);
  expect([...pageUrls].sort()).toEqual([...expected].sort());

  for (const blocked of blockedCourses) {
    const blockedSegment = `/${normalizedRoute(blocked.routes[0] ?? blocked.id)}`;
    expect([...pageUrls].every((url) => !new URL(url).pathname.includes(blockedSegment))).toBe(true);
  }
});

test("a fresh learner gets an honest empty state and a catalogue action", async ({ page }) => {
  const response = await page.goto("/en/learning/");
  expect(response?.status()).toBe(200);
  await waitForLearningDashboard(page);

  await expect(page.getByRole("heading", { name: "No learning progress yet" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Browse courses/ }))
    .toHaveAttribute("href", "/en/courses/");
  await expect(page.locator(".learning-course-card")).toHaveCount(0);
  await expect(page.locator('header a[href="/en/learning/"]'))
    .toHaveAttribute("aria-current", "page");
});

test("Home to lesson to My Learning resumes the exact next Grok lesson", async ({ page }) => {
  const home = await page.goto("/en/");
  expect(home?.status()).toBe(200);

  await page.locator('.platform-hero a[href="/en/courses/"]').click();
  await expect(page).toHaveURL(/\/en\/courses\/$/);
  await expectPrimaryHeadingFocused(page);

  await page.locator('#how-to-use-grok > a[href="/en/grok/"]').click();
  await expect(page).toHaveURL(/\/en\/grok\/$/);
  await expect(page).toHaveTitle(/Grok/);
  await expectPrimaryHeadingFocused(page);
  await expect(page.locator('header a[href="/en/courses/"]'))
    .toHaveAttribute("aria-current", "page");

  await page
    .locator('[data-testid="grok-course-dashboard"] a[href="/en/grok/map-grok/"]')
    .first()
    .click();
  await expect(page).toHaveURL(/\/en\/grok\/map-grok\/$/);
  await expect(page).toHaveTitle(/Map Grok/i);
  await expectPrimaryHeadingFocused(page);
  await expect(page.locator('header a[href="/en/courses/"]'))
    .toHaveAttribute("aria-current", "page");

  const completion = page.getByTestId("grok-lesson-completion-map-grok");
  const completionButton = completion.getByRole("button");
  await expect(completionButton).toBeEnabled();
  await completionButton.click();
  await expect(completionButton).toHaveAttribute("aria-pressed", "true");

  await page.locator('header a[href="/en/learning/"]').click();
  await expect(page).toHaveURL(/\/en\/learning\/$/);
  await expect(page).toHaveTitle(/My Learning/);
  await expectPrimaryHeadingFocused(page);
  await waitForLearningDashboard(page);

  const grokCard = page.locator(".learning-course-card").filter({
    has: page.getByRole("heading", { name: "How to Use Grok" }),
  });
  await expect(grokCard).toBeVisible();
  await expect(grokCard.getByRole("link", { name: /Resume/ }))
    .toHaveAttribute("href", "/en/grok/read-interface/");

  await grokCard.getByRole("link", { name: /Resume/ }).click();
  await expect(page).toHaveURL(/\/en\/grok\/read-interface\/$/);
  await expectPrimaryHeadingFocused(page);
});

test("a completed course is grouped separately and offers Review", async ({ page }) => {
  await page.addInitScript((progress) => {
    localStorage.setItem("aicourse.grok.progress.v1", JSON.stringify(progress));
  }, COMPLETE_GROK_PROGRESS);

  const response = await page.goto("/en/learning/");
  expect(response?.status()).toBe(200);
  await waitForLearningDashboard(page);

  const completed = page.locator('section[aria-labelledby="learning-completed-title"]');
  await expect(completed).toBeVisible();
  const grokCard = completed.locator(".learning-course-card").filter({
    has: page.getByRole("heading", { name: "How to Use Grok" }),
  });
  await expect(grokCard).toContainText("100%");
  await expect(grokCard.getByRole("link", { name: /Review/ }))
    .toHaveAttribute("href", "/en/grok/");
});

test("unavailable browser storage is announced without a fabricated zero", async ({ page }) => {
  await page.addInitScript(() => {
    const unavailable = () => {
      throw new DOMException("Storage disabled for test", "SecurityError");
    };
    for (const method of ["getItem", "setItem", "removeItem"] as const) {
      Object.defineProperty(Storage.prototype, method, {
        configurable: true,
        value: unavailable,
      });
    }
  });

  const response = await page.goto("/en/learning/");
  expect(response?.status()).toBe(200);
  await waitForLearningDashboard(page);

  await expect(page.locator(".learning-storage-warning")).toBeVisible();
  await expect(page.locator(".learning-storage-warning"))
    .toContainText("cannot be read or saved");
  await expect(page.locator(".learning-course-card")).toHaveCount(0);
  await expect(page.getByRole("progressbar")).toHaveCount(0);
});

test("corrupt progress is quarantined without overwriting the raw record or showing zero", async ({ page }) => {
  const corruptRaw = '{"schemaVersion":1,"lessons":';
  await page.addInitScript((raw) => {
    localStorage.setItem("aicourse.grok.progress.v1", raw);
  }, corruptRaw);

  const response = await page.goto("/en/learning/");
  expect(response?.status()).toBe(200);
  await waitForLearningDashboard(page);

  await expect(page.locator(".learning-storage-warning")).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("aicourse.grok.progress.v1")))
    .toBe(corruptRaw);
  await expect(page.locator(".learning-course-card")).toHaveCount(0);
  await expect(page.getByRole("progressbar")).toHaveCount(0);
});

test("global reset cancels cleanly, then clears progress but preserves device preferences and drafts", async ({ page }) => {
  const labDraft = JSON.stringify({
    version: 1,
    stage: 2,
    rules: "Keep this Lab draft",
    prompt: "Keep this prompt draft",
    completedPreviewIds: ["preview-1"],
    savedAt: "2026-08-26T00:00:00.000Z",
  });
  const agenticProgress = JSON.stringify({
    version: 2,
    handbook: {
      lastSection: "prompt",
      visitedSections: ["start", "code", "prompt"],
      controlRoom: { completedRuns: 0 },
    },
    lab: {
      completedSteps: ["first-call"],
      evalRunsCompleted: 0,
    },
  });
  const sharedProgress = JSON.stringify({
    "github.lesson.start-secure": true,
    "prompts.lesson.prompts-are-specifications.practice": true,
    "softwareEngineering.lesson.agentic-engineering-system": true,
    "rag.lesson.choose-rag.practice": true,
    "mcp.lesson.why-mcp": true,
    "make-money-with-codex.lesson.money-not-magic": true,
    "claude-income.lesson.choose-a-money-path.complete": true,
    "ai-tutor.module.objectives-concept-map": true,
    "product-management.module.product-judgment-operating-model": true,
    "agent-orchestration.module.workflow-agent-boundary": true,
  });

  await page.addInitScript(({ draft, learning, shared, grok }) => {
    localStorage.setItem("ae.theme", "dark");
    localStorage.setItem("ae.lang", "ar");
    localStorage.setItem("ae.lab.draft.v1", draft);
    localStorage.setItem("ae.learning.v2", learning);
    localStorage.setItem("ae.progress", shared);
    localStorage.setItem("aicourse.grok.progress.v1", JSON.stringify(grok));
    sessionStorage.setItem("ae.ds.key", "provider-key-stays-in-this-tab");
  }, {
    draft: labDraft,
    learning: agenticProgress,
    shared: sharedProgress,
    grok: {
      ...COMPLETE_GROK_PROGRESS,
      lessons: { "map-grok": true },
      quizBest: 0,
      quizPassed: false,
      capstoneChecks: Array.from({ length: 7 }, () => false),
      capstoneReady: false,
    },
  });

  const response = await page.goto("/en/learning/");
  expect(response?.status()).toBe(200);
  await waitForLearningDashboard(page);
  await expect(page.getByRole("heading", { name: "In progress" })).toBeVisible();

  const snapshot = () => page.evaluate(() => ({
    theme: localStorage.getItem("ae.theme"),
    language: localStorage.getItem("ae.lang"),
    draft: localStorage.getItem("ae.lab.draft.v1"),
    learning: localStorage.getItem("ae.learning.v2"),
    shared: localStorage.getItem("ae.progress"),
    grok: localStorage.getItem("aicourse.grok.progress.v1"),
    provider: sessionStorage.getItem("ae.ds.key"),
  }));
  const beforeCancel = await snapshot();
  const reset = page.getByRole("button", { name: "Clear all progress" });

  page.once("dialog", async (dialog) => {
    expect(dialog.type()).toBe("confirm");
    const message = dialog.message();
    expect(message).toContain("all active learning progress");
    expect(message).toContain("inactive recovery copy");
    expect(message).toContain("theme, language, Provider key, and Lab draft");
    await dialog.dismiss();
  });
  await reset.click();
  await expect.poll(snapshot, { message: "cancelling reset must be a no-op" })
    .toEqual(beforeCancel);

  page.once("dialog", async (dialog) => {
    expect(dialog.type()).toBe("confirm");
    await dialog.accept();
  });
  await reset.click();
  await expect(page.locator(".learning-reset-feedback")).toBeVisible();
  await expect(page.getByRole("heading", { name: "No learning progress yet" })).toBeVisible();

  const afterReset = await snapshot();
  expect(afterReset.theme).toBe("dark");
  expect(afterReset.language).toBe("ar");
  expect(afterReset.draft).toBe(labDraft);
  expect(afterReset.provider).toBe("provider-key-stays-in-this-tab");
  expect(afterReset.grok).toBeNull();

  const learning = JSON.parse(afterReset.learning ?? "null") as {
    handbook?: { visitedSections?: unknown[]; controlRoom?: { completedRuns?: number } };
    lab?: { completedSteps?: unknown[]; evalRunsCompleted?: number };
  };
  expect(learning.handbook?.visitedSections).toEqual([]);
  expect(learning.handbook?.controlRoom?.completedRuns).toBe(0);
  expect(learning.lab?.completedSteps).toEqual([]);
  expect(learning.lab?.evalRunsCompleted).toBe(0);

  const remainingShared = JSON.parse(afterReset.shared ?? "{}") as Record<string, unknown>;
  for (const key of Object.keys(JSON.parse(sharedProgress) as Record<string, unknown>)) {
    expect(Object.hasOwn(remainingShared, key), `reset must remove ${key}`).toBe(false);
  }
});

test("confirmed reset quarantines all corrupt owners byte-exactly and reloads fresh", async ({ page }) => {
  const labDraft = '{"version":1,"prompt":"keep this Lab draft byte-exact"}';
  const protectedValues = {
    theme: "dark",
    language: "ar",
    labDraft,
    providerKey: "provider-key-stays-in-this-tab",
  } as const;

  await page.addInitScript(({ owners, protectedKeys, protectedState, seedKey }) => {
    if (sessionStorage.getItem(seedKey) === "1") return;
    for (const owner of owners) localStorage.setItem(owner.activeKey, owner.raw);
    localStorage.setItem(protectedKeys.theme, protectedState.theme);
    localStorage.setItem(protectedKeys.language, protectedState.language);
    localStorage.setItem(protectedKeys.labDraft, protectedState.labDraft);
    sessionStorage.setItem(protectedKeys.providerKey, protectedState.providerKey);
    sessionStorage.setItem(seedKey, "1");
  }, {
    owners: CORRUPT_RESET_OWNERS,
    protectedKeys: PROTECTED_RESET_KEYS,
    protectedState: protectedValues,
    seedKey: RESET_QUARANTINE_SEED_KEY,
  });

  const response = await page.goto("/en/learning/");
  expect(response?.status()).toBe(200);
  await waitForLearningDashboard(page);
  await expect(page.locator(".learning-storage-warning")).toBeVisible();

  const snapshot = () => page.evaluate(({ owners, protectedKeys, quarantineKeys }) => ({
    active: Object.fromEntries(owners.map(({ activeKey }) => [
      activeKey,
      localStorage.getItem(activeKey),
    ])),
    quarantine: Object.fromEntries(quarantineKeys.map((key) => [
      key,
      localStorage.getItem(key),
    ])),
    quarantineKeys: Array.from({ length: localStorage.length }, (_, index) =>
      localStorage.key(index))
      .filter((key): key is string => key?.endsWith(".reset-quarantine.v1") === true)
      .sort(),
    protected: {
      theme: localStorage.getItem(protectedKeys.theme),
      language: localStorage.getItem(protectedKeys.language),
      labDraft: localStorage.getItem(protectedKeys.labDraft),
      providerKey: sessionStorage.getItem(protectedKeys.providerKey),
    },
  }), {
    owners: CORRUPT_RESET_OWNERS,
    protectedKeys: PROTECTED_RESET_KEYS,
    quarantineKeys: PROGRESS_LOCAL_QUARANTINE_KEYS,
  });

  const beforeCancel = await snapshot();
  expect(beforeCancel.active).toEqual(Object.fromEntries(
    CORRUPT_RESET_OWNERS.map(({ activeKey, raw }) => [activeKey, raw]),
  ));
  expect(beforeCancel.quarantineKeys).toEqual([]);
  expect(beforeCancel.protected).toEqual(protectedValues);

  const reset = page.getByRole("button", { name: "Clear all progress" });
  page.once("dialog", async (dialog) => {
    expect(dialog.type()).toBe("confirm");
    await dialog.dismiss();
  });
  await reset.click();
  await expect.poll(snapshot, { message: "cancel must preserve every tracked byte" })
    .toEqual(beforeCancel);
  await expect(page.locator(".learning-reset-feedback")).toHaveCount(0);

  page.once("dialog", async (dialog) => {
    expect(dialog.type()).toBe("confirm");
    await dialog.accept();
  });
  await reset.click();

  const feedback = page.locator('.learning-reset-feedback[role="status"][aria-live="polite"]');
  await expect(feedback).toHaveText(
    "Active learning progress was cleared. One or more unreadable records were moved to inactive recovery storage on this device and will not be used as progress.",
  );
  await expect(page.getByRole("heading", { name: "No learning progress yet" })).toBeVisible();

  const afterReset = await snapshot();
  expect(afterReset.active).toEqual({
    [LEARNING_KEY]: JSON.stringify(AGENTIC_EMPTY_PROGRESS),
    [SHARED_PROGRESS_STORAGE_KEY]: null,
    [CURSOR_PROGRESS_STORAGE_KEY]: null,
    [GROK_PROGRESS_STORAGE_KEY]: null,
    [PROGRESS_RECENCY_STORAGE_KEY]: null,
  });
  expect(afterReset.quarantine).toEqual(Object.fromEntries(
    CORRUPT_RESET_OWNERS.map(({ quarantineKey, raw }) => [quarantineKey, raw]),
  ));
  expect(afterReset.quarantineKeys).toEqual([...PROGRESS_LOCAL_QUARANTINE_KEYS].sort());
  expect(afterReset.protected).toEqual(protectedValues);

  await page.reload();
  await waitForLearningDashboard(page);
  await expect(page.getByRole("heading", { name: "No learning progress yet" })).toBeVisible();
  await expect(page.locator(".learning-storage-warning")).toHaveCount(0);
  await expect(page.locator(".learning-course-card")).toHaveCount(0);
  await expect(page.getByRole("progressbar")).toHaveCount(0);
  expect((await snapshot()).protected).toEqual(protectedValues);
});

test("a conflicting quarantine slot keeps corrupt active progress and reports an incomplete reset", async ({ page }) => {
  const corruptRaw = '{"owner":"agentic","active":';
  const conflictingRecovery = '{"owner":"agentic","older-recovery":';
  await page.addInitScript(({ active, quarantine, corrupt, conflict, seedKey }) => {
    if (sessionStorage.getItem(seedKey) === "1") return;
    localStorage.setItem(active, corrupt);
    localStorage.setItem(quarantine, conflict);
    sessionStorage.setItem(seedKey, "1");
  }, {
    active: LEARNING_KEY,
    quarantine: LEARNING_RESET_QUARANTINE_KEY,
    corrupt: corruptRaw,
    conflict: conflictingRecovery,
    seedKey: RESET_CONFLICT_SEED_KEY,
  });

  const response = await page.goto("/en/learning/");
  expect(response?.status()).toBe(200);
  await waitForLearningDashboard(page);
  await expect(page.locator(".learning-storage-warning")).toBeVisible();

  page.once("dialog", async (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Clear all progress" }).click();

  const feedback = page.locator('.learning-reset-feedback[role="status"][aria-live="polite"]');
  await expect(feedback).toHaveText(
    "The current tab was reset, but one or more records on this device could not be cleared safely. They may reappear after refresh.",
  );
  await expect(feedback).not.toContainText("Active learning progress was cleared");
  expect(await page.evaluate((key) => localStorage.getItem(key), LEARNING_KEY)).toBe(corruptRaw);
  expect(await page.evaluate((key) => localStorage.getItem(key), LEARNING_RESET_QUARANTINE_KEY))
    .toBe(conflictingRecovery);

  await page.reload();
  await waitForLearningDashboard(page);
  await expect(page.locator(".learning-storage-warning")).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), LEARNING_KEY)).toBe(corruptRaw);
  expect(await page.evaluate((key) => localStorage.getItem(key), LEARNING_RESET_QUARANTINE_KEY))
    .toBe(conflictingRecovery);
});

test("an Arabic catalogue declares English-only content before crossing locales", async ({ page }) => {
  const response = await page.goto("/ar/courses/");
  expect(response?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

  const promptCard = page.locator("#how-to-write-prompts");
  await expect(promptCard.locator(".catalog-course-meta"))
    .toContainText("محتوى الدورة: الإنجليزية");
  const courseLink = promptCard.locator('a[href^="/en/prompts/"]');
  await expect(courseLink).toHaveAttribute("href", "/en/prompts/?fromLocale=ar");
  await courseLink.click();

  await expect(page).toHaveURL(/\/en\/prompts\/?\?fromLocale=ar$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expectPrimaryHeadingFocused(page);
  await expect(page.locator('link[rel="canonical"]'))
    .toHaveAttribute("href", `${SITE}/en/prompts/`);
  await expect(page.locator('link[rel="canonical"]')).not.toHaveAttribute("href", /\?/);
  await expect(page.locator(".course-locale-return a"))
    .toHaveAttribute("href", "/ar/courses/");

  const technicalText = page.locator("pre, code").first();
  if (await technicalText.count()) {
    expect(await technicalText.evaluate((element) => getComputedStyle(element).direction))
      .toBe("ltr");
  }

  await page.locator(".course-locale-return a").click();
  await expect(page).toHaveURL(/\/ar\/courses\/$/);
  await expectPrimaryHeadingFocused(page);
});

test("fromLocale survives course navigation and disappears outside the course", async ({ page }) => {
  const response = await page.goto("/ar/courses/");
  expect(response?.status()).toBe(200);

  const courseLink = page.locator('#how-to-write-prompts a[href="/en/prompts/?fromLocale=ar"]');
  await expect(courseLink).toHaveCount(1);
  await courseLink.click();
  await expect(page).toHaveURL((url) => (
    url.pathname === "/en/prompts/"
    && url.searchParams.getAll("fromLocale").length === 1
    && url.searchParams.get("fromLocale") === "ar"
  ));
  await expect(page.locator(".course-locale-return a"))
    .toHaveAttribute("href", "/ar/courses/");

  const start = primaryJourneyLinks(page);
  await expect(start).toHaveCount(1);
  await expect(start).toHaveAttribute("href", "/en/prompts/prompts-are-specifications/");
  await start.click();
  await expect(page).toHaveURL((url) => (
    url.pathname === "/en/prompts/prompts-are-specifications/"
    && url.searchParams.getAll("fromLocale").length === 1
    && url.searchParams.get("fromLocale") === "ar"
  ));
  await expectPrimaryHeadingFocused(page);
  await expect(page.locator(".course-locale-return a"))
    .toHaveAttribute("href", "/ar/courses/");

  const nextLesson = page.locator('[data-course-lesson-nav] a[rel="next"]');
  await expect(nextLesson).toHaveAttribute("href", "/en/prompts/six-part-prompt/");
  await nextLesson.click();
  await expect(page).toHaveURL((url) => (
    url.pathname === "/en/prompts/six-part-prompt/"
    && url.searchParams.getAll("fromLocale").length === 1
    && url.searchParams.get("fromLocale") === "ar"
  ));
  await expectPrimaryHeadingFocused(page);
  await expect(page.locator(".course-locale-return a"))
    .toHaveAttribute("href", "/ar/courses/");

  await page.locator('header a[href="/en/courses/"]').click();
  await expect(page).toHaveURL(/\/en\/courses\/$/);
  await expectPrimaryHeadingFocused(page);
  await expect(page.locator(".course-locale-return")).toHaveCount(0);
});

for (const locale of ["ar", "zh-Hans"] as const) {
  test(`${locale} Continue Learning preserves its allowlisted return locale for Resume and Review`, async ({ page }) => {
    const sharedProgress = {
      ...productManagementProgress(1),
      ...claudeIncomeProgress(CLAUDE_INCOME_COURSE.lessons.length, true),
    };
    await page.addInitScript((progress) => {
      localStorage.setItem("ae.progress", JSON.stringify(progress));
    }, sharedProgress);

    const resumeHref = `/en/product-management/vision-strategy-business-model/?fromLocale=${locale}`;
    const reviewHref = `/en/claude-income/?fromLocale=${locale}`;
    const home = await page.goto(`/${locale}/`);
    expect(home?.status(), `${locale}: localized home`).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);

    const resume = page.locator(`.progress-course a[href="${resumeHref}"]`);
    const review = page.locator(`.progress-course a[href="${reviewHref}"]`);
    await expect(resume, `${locale}: exact English-only Resume target`).toHaveCount(1);
    await expect(review, `${locale}: exact English-only Review target`).toHaveCount(1);
    for (const link of [resume, review]) {
      const href = await link.getAttribute("href");
      const target = new URL(href!, SITE);
      expect(target.searchParams.getAll("fromLocale")).toEqual([locale]);
      expect(releaseSurface.siteLocales).toContain(target.searchParams.get("fromLocale"));
    }

    await resume.click();
    await expect(page).toHaveURL((url) => (
      url.pathname === "/en/product-management/vision-strategy-business-model/"
      && url.searchParams.getAll("fromLocale").length === 1
      && url.searchParams.get("fromLocale") === locale
    ));
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.locator(".course-locale-return a"))
      .toHaveAttribute("href", `/${locale}/courses/`);
    await page.locator(".course-locale-return a").click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/courses/$`));
    await expectPrimaryHeadingFocused(page);

    await page.goto(`/${locale}/`);
    const reviewAgain = page.locator(`.progress-course a[href="${reviewHref}"]`);
    await expect(reviewAgain).toHaveCount(1);
    await reviewAgain.click();
    await expect(page).toHaveURL((url) => (
      url.pathname === "/en/claude-income/"
      && url.searchParams.getAll("fromLocale").length === 1
      && url.searchParams.get("fromLocale") === locale
    ));
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.locator(".course-locale-return a"))
      .toHaveAttribute("href", `/${locale}/courses/`);
    await page.locator(".course-locale-return a").click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/courses/$`));
    await expectPrimaryHeadingFocused(page);
  });
}

test("the home hero is a bounded grid and all release widths avoid horizontal overflow", async ({ page }) => {
  for (const width of [320, 390, 768, 979, 980, 1440] as const) {
    await test.step(`${width}px`, async () => {
      await page.setViewportSize({ width, height: 1000 });
      const response = await page.goto("/en/");
      expect(response?.status()).toBe(200);
      await expectNoHorizontalOverflow(page);

      if (width !== 1440) return;
      const hero = page.locator(".platform-hero");
      expect(await hero.evaluate((element) => getComputedStyle(element).display)).toBe("grid");
      const cta = await hero.locator('a[href="/en/courses/"]').boundingBox();
      const artwork = await hero.locator(".platform-hero-art").boundingBox();
      expect(cta, "the primary hero CTA must have layout geometry").not.toBeNull();
      expect(artwork, "the hero artwork must have layout geometry").not.toBeNull();
      expect(cta!.y + cta!.height, "the hero CTA must be inside the first screen")
        .toBeLessThanOrEqual(1000);
      expect(artwork!.y + artwork!.height, "the hero artwork must be inside the first screen")
        .toBeLessThanOrEqual(1000);
      expect((await hero.boundingBox())!.height, "the CSS nesting regression must stay fixed")
        .toBeLessThan(900);
    });
  }
});

test("Chromium 200% page zoom keeps the primary learning journey operable", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "Firefox and WebKit expose no Playwright-equivalent browser page-scale API.",
  );

  await page.setViewportSize({ width: 1280, height: 800 });
  const response = await page.goto("/en/grok/");
  expect(response?.status()).toBe(200);

  const devtools = await page.context().newCDPSession(page);
  await devtools.send("Emulation.setPageScaleFactor", { pageScaleFactor: 2 });
  await expect.poll(() => page.evaluate(() => window.visualViewport?.scale ?? 1), {
    message: "Chromium must report a real 200% page scale",
  }).toBeCloseTo(2, 1);

  const start = primaryJourneyLinks(page);
  await expect(start).toHaveCount(1);
  await expectIntersectsVisualViewport(start);
  await start.focus();
  await expect(start).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/en\/grok\/map-grok\/$/);
  await expectPrimaryHeadingFocused(page);

  const next = page.locator('[data-course-lesson-nav] a[rel="next"]');
  await expect(next).toHaveAttribute("href", "/en/grok/read-interface/");
  await expectIntersectsVisualViewport(next);
  await next.focus();
  await expect(next).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/en\/grok\/read-interface\/$/);
  await expectPrimaryHeadingFocused(page);
});

test("the teacher workflow defaults to 90 minutes, is keyboard-selectable, and prints all plans", async ({ page }) => {
  const response = await page.goto("/en/teach/");
  expect(response?.status()).toBe(200);
  await expect(page.locator('header a[href="/en/teach/"]'))
    .toHaveAttribute("aria-current", "page");

  const plan45 = page.getByRole("radio", { name: "45 min" });
  const plan90 = page.getByRole("radio", { name: "90 min" });
  const plan180 = page.getByRole("radio", { name: "180 min" });
  await expect(plan90).toBeChecked();
  await expect(page.locator('[data-plan-minutes="90"]:visible')).toHaveCount(1);
  await expect(page.locator('[data-plan-minutes="45"]:visible')).toHaveCount(0);
  await expect(page.locator('[data-plan-minutes="180"]:visible')).toHaveCount(0);

  await plan90.focus();
  await page.keyboard.press("ArrowRight");
  await expect(plan180).toBeChecked();
  await expect(page.locator('[data-plan-minutes="180"]:visible')).toHaveCount(1);
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(plan45).toBeChecked();
  await expect(page.locator('[data-plan-minutes="45"]:visible')).toHaveCount(1);

  const support = page.getByRole("button", { name: "Support materials" });
  await expect(support).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("heading", { name: "Learner worksheet" })).not.toBeVisible();
  await support.click();
  await expect(support).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("heading", { name: "Learner worksheet" })).toBeVisible();
  await support.click();
  await expect(support).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("heading", { name: "Learner worksheet" })).not.toBeVisible();

  await page.emulateMedia({ media: "print" });
  await expect(page.locator('[data-plan-minutes]:visible')).toHaveCount(3);
  await expect(page.getByRole("heading", { name: "Tell learners what a click can spend" }))
    .toBeVisible();
  await expect(page.getByRole("heading", { name: "Project rubric" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Accept evidence, not one approved answer" }))
    .toBeVisible();
});

test("the mobile menu starts at Courses and Escape restores focus to Menu", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto("/en/");
  expect(response?.status()).toBe(200);

  const toggle = page.getByRole("button", { name: "Menu" });
  const menu = page.getByRole("navigation", { name: "Menu" });
  const courses = menu.locator('a[href="/en/courses/"]');
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(courses).not.toBeVisible();

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(courses).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(courses).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(toggle).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(courses).toBeFocused();

  const toggleBox = await toggle.boundingBox();
  const coursesBox = await courses.boundingBox();
  expect(toggleBox!.width).toBeGreaterThanOrEqual(44);
  expect(toggleBox!.height).toBeGreaterThanOrEqual(44);
  expect(coursesBox!.height).toBeGreaterThanOrEqual(44);

  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
  await expect(courses).not.toBeVisible();
  await expectNoHorizontalOverflow(page);
});
