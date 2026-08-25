import {
  validateCourseKitDefinition,
  type CourseKitValidationIssue,
} from "../course-kit/validate";
import { AGENTIC_QUANT_TRADING_COURSE } from "./definition";

const REQUIRED_CRITICAL_QUESTION_IDS = [
  "q-scope-safety-autonomy-core",
  "q-market-data-time-contracts-core",
  "q-backtest-leakage-costs-core",
  "q-portfolio-risk-deterministic-gates-core",
  "q-paper-execution-reconciliation-core",
  "q-monitoring-kill-switch-incidents-core",
] as const;

const REQUIRED_SOURCE_IDS = [
  "github-qlib",
  "github-rd-agent",
  "github-tradingagents",
  "github-backtesting-py",
  "github-alpaca-py",
  "paper-backtest-overfitting",
  "nist-ai-rmf",
  "sec-ai-investment-fraud",
  "finra-auto-trading-risk",
  "x-openbb-workspace-mcp-2026",
  "x-alpaca-cli-agents-2026",
  "x-ai4finance-finrlx-2026",
] as const;

export function validateAgenticQuantTradingCourse(): readonly CourseKitValidationIssue[] {
  const issues = [...validateCourseKitDefinition(AGENTIC_QUANT_TRADING_COURSE)];
  const { manifest, copy, quiz, capstone, sources } =
    AGENTIC_QUANT_TRADING_COURSE;
  const totalMinutes = manifest.modules.reduce(
    (sum, courseModule) => sum + courseModule.minutes,
    0,
  );

  if (
    manifest.id !== "agentic-quant-trading" ||
    manifest.displayNumber !== 17
  ) {
    issues.push({
      path: "manifest",
      message:
        "Course 17 must use the agentic-quant-trading ID and display number 17.",
    });
  }
  if (manifest.milestoneCount !== 14 || manifest.modules.length !== 12) {
    issues.push({
      path: "manifest",
      message:
        "Course 17 requires 12 modules plus quiz and capstone: 14 milestones.",
    });
  }
  if (manifest.phases.length !== 4) {
    issues.push({
      path: "manifest.phases",
      message: "Course 17 requires exactly four learning phases.",
    });
  }
  manifest.phases.forEach((phase, phaseIndex) => {
    if (phase.moduleSlugs.length !== 3) {
      issues.push({
        path: `manifest.phases[${phaseIndex}].moduleSlugs`,
        message: "Every Course 17 phase must contain exactly three modules.",
      });
    }
  });
  if (totalMinutes !== 780) {
    issues.push({
      path: "manifest.modules",
      message: "Course 17 modules must total exactly 780 minutes.",
    });
  }
  if (
    quiz.questions.length !== 36 ||
    quiz.drawCount !== 12 ||
    quiz.passCount !== 10
  ) {
    issues.push({
      path: "quiz",
      message:
        "Course 17 requires a 36-question bank, draw 12, and pass 10.",
    });
  }
  const criticalIds = new Set(
    quiz.questions
      .filter((question) => question.critical === true)
      .map((question) => question.id),
  );
  for (const questionId of REQUIRED_CRITICAL_QUESTION_IDS) {
    if (!criticalIds.has(questionId)) {
      issues.push({
        path: "quiz.questions",
        message: `Missing critical safety-gate question: ${questionId}.`,
      });
    }
  }
  if (criticalIds.size >= quiz.drawCount) {
    issues.push({
      path: "quiz.questions",
      message:
        "The critical gate must remain smaller than the 12-question draw.",
    });
  }
  if (capstone.artifacts.length !== 8) {
    issues.push({
      path: "capstone.artifacts",
      message: "Course 17 requires exactly eight capstone artifacts.",
    });
  }

  const sourceIds = new Set(sources.map((source) => source.id));
  for (const sourceId of REQUIRED_SOURCE_IDS) {
    if (!sourceIds.has(sourceId)) {
      issues.push({
        path: "sources",
        message: `Course 17 is missing required source: ${sourceId}.`,
      });
    }
  }

  for (const locale of ["en", "zh-Hans"] as const) {
    const localeCopy = copy[locale];
    for (const courseModule of manifest.modules) {
      const moduleCopy = localeCopy.modules[courseModule.slug];
      if (moduleCopy.sections.length < 2) {
        issues.push({
          path: `copy.${locale}.modules.${courseModule.slug}.sections`,
          message:
            "Every Course 17 module needs at least two substantive teaching sections.",
        });
      }
      if (moduleCopy.practice.steps.length < 3) {
        issues.push({
          path: `copy.${locale}.modules.${courseModule.slug}.practice.steps`,
          message:
            "Every Course 17 practice needs at least three executable steps.",
        });
      }
      moduleCopy.sections.forEach((section, sectionIndex) => {
        const minimumCharacters = locale === "en" ? 260 : 100;
        if (section.paragraphs.join(" ").trim().length < minimumCharacters) {
          issues.push({
            path: `copy.${locale}.modules.${courseModule.slug}.sections[${sectionIndex}]`,
            message: "Teaching-section prose is too thin for publication.",
          });
        }
      });
    }

    const safetyText = [
      localeCopy.meta.summary,
      localeCopy.meta.prerequisite,
      localeCopy.capstone.attestation,
      ...localeCopy.principles,
      ...manifest.modules.map(
        (courseModule) =>
          localeCopy.modules[courseModule.slug].practice.reviewGate,
      ),
    ]
      .join(" ")
      .toLowerCase();
    const hasPaperOnlyBoundary =
      locale === "en"
        ? safetyText.includes("paper") && safetyText.includes("no live")
        : safetyText.includes("模拟") && safetyText.includes("实盘");
    const hasAdviceBoundary =
      locale === "en"
        ? safetyText.includes("investment advice")
        : safetyText.includes("投资建议");
    if (!hasPaperOnlyBoundary || !hasAdviceBoundary) {
      issues.push({
        path: `copy.${locale}`,
        message:
          "Course 17 must explicitly enforce paper-only operation, no live orders, and no investment advice.",
      });
    }
  }

  return issues;
}

export function validateAgenticQuantTradingCourseMessages(): string[] {
  return validateAgenticQuantTradingCourse().map(
    (issue) => `${issue.path}: ${issue.message}`,
  );
}

export function assertValidAgenticQuantTradingCourse(): void {
  const issues = validateAgenticQuantTradingCourse();
  if (!issues.length) return;
  throw new Error(
    `Invalid Agentic Quant Trading course:\n${issues
      .map((issue) => `- ${issue.path}: ${issue.message}`)
      .join("\n")}`,
  );
}
