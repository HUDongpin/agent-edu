import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const DEFAULT_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const COURSE_ID = "agentic-quant-trading";
const SNAPSHOT_DATE = "2026-08-26";
const FIXTURE_DIRECTORY = `public/courses/${COURSE_ID}`;
const REQUIRED_FIXTURES = [
  "market-regime-synthetic-v1.csv",
  "news-signals-synthetic-v1.json",
  "risk-policy.template.json",
  "fixture-contract-self-test.py",
  "LICENSE.txt",
];
const REQUIRED_DOWNLOADS = [...REQUIRED_FIXTURES, "provenance.v1.json"];
const REQUIRED_RESEARCH_SOURCE_IDS = [
  "paper-backtest-overfitting",
  "paper-deflated-sharpe-ratio",
  "paper-financial-cross-validation-comparison",
  "nist-ai-rmf",
  "sec-ai-investment-fraud",
  "finra-auto-trading-risk",
  "finra-algorithmic-trading",
  "sec-market-access-rule-faq",
];
const REQUIRED_SELF_TEST_ASSERTIONS = [
  "fixture-integrity",
  "synthetic-identity",
  "bar-date-ordering",
  "timestamp-contract",
  "decision-input-availability",
  "declared-boundary-policy-shape",
  "performance-metrics-not-computable",
];
const REQUIRED_APPROVAL_FAIL_CLOSED_ON = [
  "missing",
  "expired",
  "reused",
  "revoked",
  "issuer-proof-invalid",
  "intent-hash-mismatch",
  "policy-version-mismatch",
];
const REQUIRED_MESSAGE_KEYS = [
  `c.${COURSE_ID}.title`,
  `c.${COURSE_ID}.blurb`,
  `c.${COURSE_ID}.level`,
  `c.${COURSE_ID}.meta`,
  `c.${COURSE_ID}.contentLanguage`,
  "cat.course17",
];

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function add(issues, gate, message) {
  issues.push({ gate, message });
}

function hasDirectXStatusUrl(source) {
  return /^https:\/\/x\.com\/[^/]+\/status\/\d+$/.test(source.url);
}

function githubRevisionSha(source) {
  return source.revision?.match(/\b[0-9a-f]{40}\b/i)?.[0]?.toLowerCase();
}

export function hasImmutableGithubEvidence(source, sha) {
  return source.evidenceUrls.some((candidate) => {
    try {
      const url = new URL(candidate);
      return url.hostname === "github.com"
        && new RegExp(`/(?:commit|blob)/${sha}(?:/|$)`, "i").test(url.pathname);
    } catch {
      return false;
    }
  });
}

function sourceCounts(sources) {
  return {
    github: sources.filter((source) => source.kind === "github-repository").length,
    xPosts: sources.filter((source) => source.kind === "social-post" && hasDirectXStatusUrl(source)).length,
    riskAndResearch: sources.filter((source) => [
      "law-or-regulation",
      "official-guidance",
      "research",
    ].includes(source.kind)).length,
  };
}

async function importFresh(path) {
  return import(`${pathToFileURL(path).href}?course-check=${Date.now()}`);
}

export async function checkAgenticQuantTradingCourse({
  projectRoot = DEFAULT_ROOT,
  release = false,
} = {}) {
  const root = resolve(projectRoot);
  const issues = [];
  const courseModule = await importFresh(join(root, "lib/agentic-quant-trading/index.ts"));
  const { drawCourseKitQuizQuestions } = await importFresh(join(root, "lib/course-kit/quiz.ts"));
  const {
    AGENTIC_QUANT_TRADING_COURSE: course,
    AGENTIC_QUANT_TRADING_MODULES: authoringModules,
  } = courseModule;
  if (!course) throw new Error("AGENTIC_QUANT_TRADING_COURSE export is missing.");

  const validationIssues = courseModule.validateAgenticQuantTradingCourse();
  for (const issue of validationIssues) add(issues, "course-definition", `${issue.path}: ${issue.message}`);

  const totalMinutes = course.manifest.modules.reduce((sum, module) => sum + module.minutes, 0);
  if (course.manifest.id !== COURSE_ID || course.manifest.displayNumber !== 17) {
    add(issues, "course-definition", "Course 17 must use agentic-quant-trading as its ID.");
  }
  if (course.manifest.modules.length !== 12 || course.manifest.milestoneCount !== 14) {
    add(issues, "course-definition", "Course 17 requires 12 modules plus quiz and capstone.");
  }
  if (course.manifest.phases.length !== 4) add(issues, "course-definition", "Exactly four phases are required.");
  if (totalMinutes !== 780) add(issues, "course-definition", `Expected 780 minutes; found ${totalMinutes}.`);
  if (course.quiz.questions.length !== 36 || course.quiz.drawCount !== 12 || course.quiz.passCount !== 10) {
    add(issues, "assessment", "The assessment contract is 36 bank questions, draw 12, pass 10.");
  }
  const criticalCount = course.quiz.questions.filter((question) => question.critical).length;
  if (criticalCount < 6 || criticalCount >= course.quiz.drawCount) {
    add(issues, "assessment", "Six or more critical questions are required, fewer than the draw count.");
  }
  const selectedQuestions = drawCourseKitQuizQuestions(
    course.quiz.questions,
    course.quiz.drawCount,
    `${course.manifest.id}:${course.quiz.version}`,
  );
  for (const moduleRecord of course.manifest.modules) {
    const selectedForModule = selectedQuestions.filter((question) => (
      question.id.startsWith(`q-${moduleRecord.slug}-`)
    ));
    if (selectedForModule.length !== 1) {
      add(
        issues,
        "assessment",
        `The fixed draw must select exactly one question for ${moduleRecord.slug}; found ${selectedForModule.length}.`,
      );
    }
  }
  if (selectedQuestions.some((question) => question.evidenceMode !== "instructional-synthesis")) {
    add(issues, "assessment", "Course-authored quiz questions must declare instructional-synthesis evidence mode.");
  }
  if (course.capstone.artifacts.length !== 8) add(issues, "capstone", "Exactly eight capstone artifacts are required.");

  const counts = sourceCounts(course.sources);
  if (course.sources.length !== 27) add(issues, "sources", `Exactly 27 source records are required; found ${course.sources.length}.`);
  if (counts.github !== 13) add(issues, "sources", `Exactly 13 GitHub repository records are required; found ${counts.github}.`);
  if (counts.xPosts !== 6) add(issues, "sources", `Exactly six direct X status records are required; found ${counts.xPosts}.`);
  if (counts.riskAndResearch !== 8) add(issues, "sources", `Exactly eight research or official risk records are required; found ${counts.riskAndResearch}.`);
  const sourceIdSet = new Set(course.sources.map((source) => source.id));
  for (const sourceId of REQUIRED_RESEARCH_SOURCE_IDS) {
    if (!sourceIdSet.has(sourceId)) add(issues, "sources", `Required primary research or official source is missing: ${sourceId}.`);
  }
  for (const source of course.sources) {
    if (source.accessedOn !== SNAPSHOT_DATE) add(issues, "sources", `${source.id} must use accessedOn ${SNAPSHOT_DATE}.`);
    if (source.kind === "github-repository") {
      const sha = githubRevisionSha(source);
      if (!source.licence) add(issues, "sources", `${source.id} must name its repository licence.`);
      if (!sha) {
        add(issues, "sources", `${source.id} revision must include a full 40-character commit SHA.`);
      } else if (!hasImmutableGithubEvidence(source, sha)) {
        add(issues, "sources", `${source.id} needs an immutable GitHub commit or blob URL at its full 40-character SHA; a release tag alone is insufficient.`);
      }
    }
    if (source.kind === "social-post") {
      if (!hasDirectXStatusUrl(source)) add(issues, "sources", `${source.id} is not a direct X status URL.`);
      if (source.evidenceUrls.length < 2) add(issues, "sources", `${source.id} needs independent official cross-evidence.`);
      if (!/(?:does not|not establish|cannot|不|不能|不代表)/i.test(`${source.boundary} ${course.copy["zh-Hans"].sourceAnnotations[source.id]?.boundary || ""}`)) {
        add(issues, "sources", `${source.id} must state an explicit non-inference boundary.`);
      }
    }
  }

  const socialSourceIds = new Set(
    course.sources.filter((source) => source.kind === "social-post").map((source) => source.id),
  );
  for (const moduleRecord of course.manifest.modules) {
    if (moduleRecord.sourceIds.some((sourceId) => socialSourceIds.has(sourceId))) {
      add(issues, "sources", `${moduleRecord.slug} must not inherit X version-watch records at module root.`);
    }
  }
  for (const question of course.quiz.questions) {
    if (question.sourceIds.some((sourceId) => socialSourceIds.has(sourceId))) {
      add(issues, "sources", `${question.id} must not use X version-watch records as assessment evidence.`);
    }
  }
  for (const artifact of course.capstone.artifacts) {
    if (artifact.sourceIds.some((sourceId) => socialSourceIds.has(sourceId))) {
      add(issues, "sources", `${artifact.id} must not use X version-watch records as capstone evidence.`);
    }
  }

  const enModules = Object.values(course.copy.en.modules);
  const declaredArtifacts = new Set(enModules.map((moduleCopy) => moduleCopy.artifact));
  const declaredTakeaways = new Set(enModules.map((moduleCopy) => moduleCopy.takeaway));
  const reviewedDistractorSignatures = new Set();
  for (const question of course.quiz.questions) {
    const questionCopy = course.copy.en.quiz.questions[question.id];
    const competingTruths = question.id.endsWith("-evidence")
      ? declaredArtifacts
      : question.id.endsWith("-boundary")
        ? declaredTakeaways
        : null;
    if (!questionCopy || !competingTruths) continue;
    reviewedDistractorSignatures.add(JSON.stringify(
      questionCopy.options
        .filter((_, optionIndex) => optionIndex !== question.correctIndex)
        .sort(),
    ));
    questionCopy.options.forEach((option, optionIndex) => {
      if (optionIndex !== question.correctIndex && competingTruths.has(option)) {
        add(issues, "assessment", `${question.id} uses another module's true course statement as a distractor.`);
      }
    });
  }
  if (reviewedDistractorSignatures.size !== course.manifest.modules.length * 2) {
    add(issues, "assessment", "Every evidence and boundary question needs a distinct reviewed distractor set.");
  }

  const referencedByTeachingSection = new Set();
  for (const courseModuleRecord of authoringModules) {
    const sectionsByLocale = [
      courseModuleRecord.copy.en.sections,
      courseModuleRecord.copy.zhHans.sections,
    ];
    for (const sections of sectionsByLocale) {
      for (const section of sections) {
        if (!section.sourceIds?.length) {
          add(issues, "sources", `${courseModuleRecord.slug}/${section.heading} must explicitly bind section-level sourceIds.`);
          continue;
        }
        for (const sourceId of section.sourceIds) referencedByTeachingSection.add(sourceId);
        const usesSocialPost = section.sourceIds.some((sourceId) => (
          course.sources.find((source) => source.id === sourceId)?.kind === "social-post"
        ));
        if (usesSocialPost && section.evidenceMode !== "version-watch") {
          add(issues, "sources", `${courseModuleRecord.slug}/${section.heading} uses X evidence outside a version-watch section.`);
        }
        if (usesSocialPost) {
          const text = section.paragraphs.join(" ");
          if (!/(?:announc|post|demo|narrative|promotion|公告|宣布|帖子|演示|叙事|推广)/i.test(text)
            || !/(?:does not|not establish|cannot|only|不能|不证明|不等于|只能)/i.test(text)) {
            add(issues, "sources", `${courseModuleRecord.slug}/${section.heading} must frame X as a bounded announcement or version-watch signal.`);
          }
        }
      }
    }
  }
  for (const source of course.sources) {
    if (!referencedByTeachingSection.has(source.id)) {
      add(issues, "sources", `${source.id} is not cited by any teaching section and must not pad the source register.`);
    }
  }

  const copyText = JSON.stringify(course.copy);
  const requiredSafetySignals = [
    /local synthetic|本地合成/i,
    /no network|network.*(?:forbidden|prohibited)|无网络|禁止网络/i,
    /no external account|external accounts.*(?:forbidden|prohibited)|无外部账户|禁止.*外部账户/i,
    /no credential|credentials.*(?:forbidden|prohibited)|无凭证|禁止.*凭证/i,
    /not investment advice|不构成投资建议/i,
    /no live|not live|不得实盘|不授权实盘|不进入实盘/i,
    /human approval|human reviewer|人类审批|人工审批|具名审核/i,
    /kill switch|熔断|紧急停止/i,
    /point-in-time|known_at|时点一致/i,
  ];
  for (const signal of requiredSafetySignals) {
    if (!signal.test(copyText)) add(issues, "safety", `Required safety signal is absent: ${signal}.`);
  }

  const expectedPaths = [
    `app/[locale]/${COURSE_ID}/page.tsx`,
    `app/[locale]/${COURSE_ID}/[module]/page.tsx`,
    `components/agentic-quant-trading/EvidenceGateLab.tsx`,
    `components/agentic-quant-trading/EvidenceGateLab.module.css`,
    "outputs/agentic-quant-trading-course-research-brief.md",
    "outputs/agentic-quant-trading-course-research-brief.provenance.md",
  ];
  for (const path of expectedPaths) if (!existsSync(join(root, path))) add(issues, "files", `Missing ${path}.`);

  const dashboardRoutePath = join(root, `app/[locale]/${COURSE_ID}/page.tsx`);
  const moduleRoutePath = join(root, `app/[locale]/${COURSE_ID}/[module]/page.tsx`);
  const dashboardRouteText = existsSync(dashboardRoutePath)
    ? readFileSync(dashboardRoutePath, "utf8")
    : "";
  const moduleRouteText = existsSync(moduleRoutePath)
    ? readFileSync(moduleRoutePath, "utf8")
    : "";
  if (!dashboardRouteText.includes("requireStructuredReceipts")) {
    add(issues, "assessment", "Course 17 capstone must require structured evidence receipts.");
  }
  if (!moduleRouteText.includes("requireStructuredReceipt")) {
    add(issues, "assessment", "Course 17 modules must require structured evidence receipts.");
  }

  const labPath = join(root, "components/agentic-quant-trading/EvidenceGateLab.tsx");
  const labText = existsSync(labPath) ? readFileSync(labPath, "utf8") : "";
  for (const name of REQUIRED_DOWNLOADS) {
    if (!labText.includes(`"${name}"`)) {
      add(issues, "assets", `Evidence Gate Lab must expose ${name} as a required local download.`);
    }
  }
  const forbiddenLabLanguage = [
    /ready for paper replay/i,
    /paper(?: |-)?account/i,
    /local replay broker/i,
    /authori[sz]es? paper replay/i,
  ];
  for (const pattern of forbiddenLabLanguage) {
    if (pattern.test(labText)) add(issues, "safety", `Evidence Gate Lab contains forbidden authority language: ${pattern}.`);
  }
  for (const pattern of [
    /sharpe_like_score/i,
    /illustrative_metrics/i,
    /adjustedScore/i,
    /aicourse\.synthetic-evidence-decay/i,
  ]) {
    if (pattern.test(labText)) add(issues, "safety", `Evidence Gate Lab contains a fabricated performance construct: ${pattern}.`);
  }
  for (const required of [
    "illustrative_only: true",
    "eligible_for_human_review",
    "verified: false",
    "failure_reasons",
    'status: "not-computable"',
    'mode: "local-synthetic-replay"',
    "declared_only: true",
    "runtime_enforcement_verified: false",
    "network_isolation_verified: false",
    "network_allowed: false",
  ]) {
    if (!labText.includes(required)) add(issues, "safety", `Evidence Gate Lab is missing ${required}.`);
  }

  const provenancePath = join(root, FIXTURE_DIRECTORY, "provenance.v1.json");
  let provenance;
  if (!existsSync(provenancePath)) {
    add(issues, "assets", `Missing ${FIXTURE_DIRECTORY}/provenance.v1.json.`);
  } else {
    provenance = JSON.parse(readFileSync(provenancePath, "utf8"));
    if (!labText.includes(sha256(provenancePath))) {
      add(issues, "assets", "Evidence Gate Lab is not pinned to the provenance manifest hash.");
    }
    if (provenance.rights?.basis !== "original-project-fixture"
      || provenance.rights?.publication_eligible !== true
      || provenance.rights?.containsThirdPartyData !== false
      || provenance.rights?.containsPersonalData !== false
      || !/eligible/.test(provenance.releaseEligibility || "")) {
      add(issues, "rights", "Fixture provenance must declare original-project rights and release eligibility.");
    }
    for (const name of REQUIRED_FIXTURES) {
      const assetPath = join(root, FIXTURE_DIRECTORY, name);
      const record = provenance.files?.find((file) => file.path === name);
      if (!existsSync(assetPath)) add(issues, "assets", `Missing fixture ${name}.`);
      else if (!record || record.sha256 !== sha256(assetPath)) add(issues, "assets", `SHA-256 mismatch for ${name}.`);
      if (record?.sha256 && !labText.includes(record.sha256)) {
        add(issues, "assets", `Evidence Gate receipt is not pinned to the provenance hash for ${name}.`);
      }
    }
  }
  const noticePath = join(root, FIXTURE_DIRECTORY, "NOTICE.md");
  const notice = existsSync(noticePath) ? readFileSync(noticePath, "utf8") : "";
  if (!/original/i.test(notice) || !/third-party/i.test(notice) || !/not.*investment advice/i.test(notice)) {
    add(issues, "rights", "NOTICE.md must declare origin, third-party boundary, and advice boundary.");
  }
  const riskPolicyPath = join(root, FIXTURE_DIRECTORY, "risk-policy.template.json");
  if (existsSync(riskPolicyPath)) {
    const policy = JSON.parse(readFileSync(riskPolicyPath, "utf8"));
    const boundary = policy.executionBoundary || {};
    const failClosed = policy.failClosed || {};
    const changeControl = policy.changeControl || {};
    const approval = policy.intentApproval || {};
    const issuanceBoundary = approval.issuanceBoundary || {};
    const intentRate = policy.limits?.maxIntentRate || {};
    const boundaryFalse = [
      "networkAccess",
      "externalAccounts",
      "brokerConnections",
      "credentialsAccepted",
      "liveOrderCapability",
    ].every((key) => boundary[key] === false);
    if (policy.schemaVersion !== "aicourse.local-synthetic-risk-policy.v2"
      || policy.mode !== "local-synthetic-replay"
      || typeof policy.policyVersion !== "string"
      || !policy.owner?.identifierRequired
      || !changeControl.namedHumanApprovalRequired
      || changeControl.agentSelfApprovalAllowed !== false
      || !boundaryFalse
      || boundary.remoteEndpoints?.length
      || failClosed.enabled !== true
      || failClosed.defaultDecision !== "deny"
      || failClosed.overrideAllowed !== false
      || failClosed.onMissingEvidence !== "deny"
      || failClosed.onStaleData !== "deny"
      || failClosed.onAssertionFailure !== "deny"
      || failClosed.failureReasonsRequired !== true
      || !Number.isInteger(intentRate.value)
      || intentRate.value < 1
      || !Number.isInteger(intentRate.windowSeconds)
      || intentRate.windowSeconds < 1
      || intentRate.idempotentRetriesCountAsNew !== false
      || approval.requiredBeforeSubmittedState !== true
      || approval.namedHumanRequired !== true
      || approval.agentMayApprove !== false
      || approval.singleUse !== true
      || approval.mustBindExactIntentSha256 !== true
      || approval.mustBindPolicyVersion !== true
      || JSON.stringify([...new Set(approval.requiredFields || [])].sort())
        !== JSON.stringify(["approvalEventId", "approvalId", "approvedAt", "approverId", "expiresAt", "intentSha256", "policyVersion", "proofLocator", "proofType"].sort())
      || issuanceBoundary.humanControlledChannelRequired !== true
      || issuanceBoundary.agentWriteAccess !== false
      || !Array.isArray(issuanceBoundary.acceptedProofTypes)
      || issuanceBoundary.acceptedProofTypes.length !== 2
      || JSON.stringify([...new Set(issuanceBoundary.acceptedProofTypes || [])].sort())
        !== JSON.stringify(["append-only-human-approval-event-with-acl-evidence", "detached-signature-with-pinned-public-key"].sort())
      || issuanceBoundary.verificationRequiredBeforeConsumption !== true
      || issuanceBoundary.revocationCheckRequiredBeforeConsumption !== true
      || issuanceBoundary.consumptionLedgerRequired !== true
      || !Array.isArray(approval.failClosedOn)
      || approval.failClosedOn.length !== REQUIRED_APPROVAL_FAIL_CLOSED_ON.length
      || JSON.stringify([...new Set(approval.failClosedOn || [])].sort())
        !== JSON.stringify([...REQUIRED_APPROVAL_FAIL_CLOSED_ON].sort())
      || JSON.stringify(policy.requiredAssertions || []) !== JSON.stringify(REQUIRED_SELF_TEST_ASSERTIONS)
      || policy.humanReview?.required !== true
      || policy.humanReview?.eligibilityIsAuthorisation !== false
      || policy.humanReview?.reviewCannotEnableNetworkOrExternalExecution !== true) {
      add(issues, "safety", "Risk policy must be versioned, human-owned, local-synthetic-only, and fail closed with no account, network, credential, or market-action path.");
    }
  }
  const selfTestScriptPath = join(root, FIXTURE_DIRECTORY, "fixture-contract-self-test.py");
  if (existsSync(selfTestScriptPath)) {
    const selfTestScript = readFileSync(selfTestScriptPath, "utf8");
    const requiredScriptSignals = [
      "--self-test",
      ...REQUIRED_SELF_TEST_ASSERTIONS,
      '"network_client_code_present": False',
      '"network_isolation_verified": False',
      'performance_status = "not-computable"',
      'performance_status = "capability-present-review-required"',
    ];
    if (requiredScriptSignals.some((signal) => !selfTestScript.includes(signal))
      || /\b(?:requests|urllib|socket|http\.client|aiohttp|httpx|ftplib|websockets|subprocess|os\.system|Popen|curl|wget|open_connection)\b/.test(selfTestScript)
      || /https?:\/\//.test(selfTestScript)) {
      add(issues, "safety", "Fixture self-test must expose the seven bounded contract assertions, disclose non-computable metrics and non-attested OS isolation, and contain no network path or URL.");
    }
    const selfTest = spawnSync("python3", [selfTestScriptPath, "--self-test"], {
      cwd: join(root, FIXTURE_DIRECTORY),
      encoding: "utf8",
    });
    try {
      const receipt = JSON.parse(selfTest.stdout || "{}");
      const assertionIds = receipt.assertions?.map((assertion) => assertion.id);
      if (selfTest.status !== 0
        || receipt.status !== "pass"
        || receipt.performance_metrics?.status !== "not-computable"
        || receipt.network_client_code_present !== false
        || receipt.network_isolation_verified !== false
        || receipt.authorises_market_action !== false
        || JSON.stringify(assertionIds) !== JSON.stringify(REQUIRED_SELF_TEST_ASSERTIONS)
        || receipt.assertions?.some((assertion) => assertion.passed !== true)) {
        add(issues, "safety", `Fixture self-test did not produce the expected bounded pass receipt: ${selfTest.stderr || selfTest.stdout}`);
      }
    } catch (error) {
      add(issues, "safety", `Fixture self-test did not emit valid JSON: ${error.message}`);
    }
  }

  const localeDirectory = join(root, "messages");
  for (const locale of ["en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar"]) {
    const messages = JSON.parse(readFileSync(join(localeDirectory, `${locale}.json`), "utf8"));
    for (const key of REQUIRED_MESSAGE_KEYS) {
      if (typeof messages[key] !== "string" || !messages[key].trim()) add(issues, "i18n", `${locale} is missing ${key}.`);
    }
  }

  const releaseIssues = [];
  if (release) {
    const [{ TOP_LEVEL_COURSES, CATALOG_COURSES }, { PAGES }] = await Promise.all([
      importFresh(join(root, "lib/courses.ts")),
      importFresh(join(root, "lib/seo.ts")),
    ]);
    const top = TOP_LEVEL_COURSES.find((item) => item.id === COURSE_ID);
    const catalog = CATALOG_COURSES.find((item) => item.id === COURSE_ID);
    const responsibleAi = TOP_LEVEL_COURSES.find((item) => item.id === "responsible-ai");
    if (!responsibleAi || responsibleAi.displayNumber !== 16) releaseIssues.push("Course 16 is not an available predecessor.");
    if (!top || top.displayNumber !== 17) releaseIssues.push("Course 17 is not in TOP_LEVEL_COURSES.");
    if (!catalog || catalog.status !== "available" || catalog.href !== `/${COURSE_ID}/`) {
      releaseIssues.push("Course 17 catalogue record is not available and linkable.");
    }
    const expectedPages = [`${COURSE_ID}/`, ...course.manifest.modules.map((module) => `${COURSE_ID}/${module.slug}/`)];
    for (const page of expectedPages) if (!PAGES.includes(page)) releaseIssues.push(`PAGES is missing ${page}.`);
    const numbers = TOP_LEVEL_COURSES.map((item) => item.displayNumber).sort((a, b) => a - b);
    if (numbers.some((number, index) => number !== index + 1)) releaseIssues.push("Available course numbers are not contiguous from 1.");
  }
  for (const message of releaseIssues) add(issues, "release", message);

  return {
    schemaVersion: 1,
    courseId: COURSE_ID,
    mode: release ? "release" : "content",
    status: issues.length ? "fail" : "pass",
    snapshot: SNAPSHOT_DATE,
    counts: {
      phases: course.manifest.phases.length,
      modules: course.manifest.modules.length,
      milestones: course.manifest.milestoneCount,
      minutes: totalMinutes,
      sources: course.sources.length,
      ...counts,
      questions: course.quiz.questions.length,
      criticalQuestions: criticalCount,
      capstoneArtifacts: course.capstone.artifacts.length,
      fixtures: REQUIRED_FIXTURES.length,
    },
    issues,
  };
}

export function formatAgenticQuantTradingCheck(result) {
  const lines = [
    `agentic quant trading course: ${result.status.toUpperCase()} (${result.mode})`,
    `${result.counts.modules} modules · ${result.counts.minutes} minutes · ${result.counts.sources} sources · ${result.counts.questions} questions`,
    `${result.counts.github} GitHub repositories · ${result.counts.xPosts} direct X posts · ${result.counts.capstoneArtifacts} capstone artifacts`,
  ];
  for (const issue of result.issues) lines.push(`- [${issue.gate}] ${issue.message}`);
  return lines.join("\n");
}

const invoked = process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  const result = await checkAgenticQuantTradingCourse({ release: process.argv.includes("--release") });
  console.log(process.argv.includes("--json") ? JSON.stringify(result, null, 2) : formatAgenticQuantTradingCheck(result));
  if (result.status !== "pass") process.exitCode = 1;
}
