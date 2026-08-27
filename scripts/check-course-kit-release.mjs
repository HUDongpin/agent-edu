#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const COURSE_IDS = [
  "responsible-ai",
  "ai-research",
  "ai-python-data",
  "machine-learning",
  "deep-learning",
  "production-ai",
];
const RESPONSIBLE_AI_CRITERION_IDS = [
  "purpose-risk-stop",
  "data-rights-minimisation",
  "subgroups-uncertainty",
  "human-authority-recourse",
  "challenge-incident-recovery",
  "evidence-decision-expiry",
];
const RESPONSIBLE_AI_RUBRIC_VERSION = "2026.08.26-v1";
const EARLY_CRITICAL_CATEGORIES = ["safety", "provenance"];
const ADVANCED_CRITICAL_CATEGORIES = [
  "leakage", "human-authority", "rollback", "reproducibility",
];
const LOCALIZATION_REVIEW_PATH = "lib/course-kit/localization-reviews.json";
const LOCALIZATION_REVIEW_SCHEMA = "aicourse.course-kit.localization-reviews.v1";
const LOCALIZATION_REVIEW_CHECKLIST = "course-kit-native-content-review.v1";
const LOCALIZATION_REVIEW_LOCALES = ["en", "zh-Hans"];
const LOCALIZATION_REVIEW_CHECKS = [
  "completeBundleReviewed",
  "terminologyReviewed",
  "semanticFidelityReviewed",
  "technicalAccuracyReviewed",
];

const CONTRACTS = {
  "responsible-ai": {
    exportName: "RESPONSIBLE_AI_COURSE",
    displayNumber: 16,
    milestoneCount: 12,
    drawCount: 12,
    passCount: 10,
    minutes: [50, 60, 60, 70, 55, 55, 70, 65, 75, 90],
    titles: [
      "Purpose and risk classification",
      "Stakeholders and impact assessment",
      "Data rights, privacy and minimisation",
      "Fairness and subgroup audit",
      "Explainability, uncertainty and limitations",
      "Model, data and system cards",
      "Human authority and oversight boundaries",
      "Escalation, appeal and contestability",
      "Red teaming, incidents and disclosure",
      "Governance dossier capstone",
    ],
    artifactIds: [
      "impact-assessment", "stakeholder-map", "risk-register", "data-map",
      "subgroup-test", "explanation-limitations-card", "override-appeal-flow",
      "red-team-incident-log", "go-no-go-memo",
    ],
  },
  "ai-research": {
    exportName: "AI_RESEARCH_COURSE",
    displayNumber: 17,
    milestoneCount: 12,
    drawCount: 12,
    passCount: 10,
    minutes: [55, 65, 65, 60, 60, 65, 60, 60, 60, 100],
    titles: [
      "Research question, protocol and preregistration",
      "Transparent search strategies and search log",
      "Screening, inclusion and exclusion",
      "Evidence hierarchy and claim-source ledger",
      "PDF, table and extraction boundaries",
      "Citation verification and RAG as locator",
      "Quantitative-analysis boundaries",
      "Qualitative-synthesis boundaries",
      "Reproducibility, uncertainty and AI disclosure",
      "Auditable mini-review capstone",
    ],
    artifactIds: [
      "protocol", "search-log", "inclusion-exclusion-ledger",
      "claim-evidence-matrix", "extraction-sheet",
      "analysis-reproduction-package", "citation-audit",
      "ai-disclosure-failure-log",
    ],
  },
  "ai-python-data": {
    exportName: "AI_PYTHON_DATA_COURSE",
    displayNumber: 18,
    milestoneCount: 12,
    drawCount: 12,
    passCount: 10,
    minutes: [45, 50, 55, 55, 65, 65, 55, 50, 60, 100],
    titles: [
      "Environment, notebooks, seeds and reproducibility",
      "Execution, values, functions and state",
      "Tests, errors, types and debugging",
      "NumPy arrays and vectorisation",
      "Pandas and tidy tabular data",
      "Cleaning, missingness, validation and provenance",
      "Descriptive statistics, sampling and uncertainty",
      "Visualisation and honest charts",
      "Files, APIs, joins and reproducible pipelines",
      "Education-data audit capstone",
    ],
    artifactIds: [
      "environment-receipt", "executable-notebook", "data-dictionary",
      "cleaning-ledger", "validation-report", "statistical-note",
      "visual-report", "provenance-manifest",
    ],
  },
  "machine-learning": {
    exportName: "MACHINE_LEARNING_COURSE",
    displayNumber: 19,
    milestoneCount: 14,
    drawCount: 16,
    passCount: 13,
    minutes: [60, 70, 70, 65, 70, 75, 70, 70, 65, 70, 65, 90],
    titles: [
      "Problem framing, baselines and train/validation/test splits",
      "Linear regression, loss and residuals",
      "Logistic regression and classification",
      "Optimisation, scaling and features",
      "Regularisation, bias and variance",
      "Trees and ensembles",
      "Imbalanced data and metric selection",
      "Calibration, thresholds and error analysis",
      "Clustering",
      "Anomaly detection",
      "Recommender systems",
      "Leakage, reproducibility and model-card capstone",
    ],
    artifactIds: [
      "problem-split-contract", "baseline-experiment", "reproducible-pipeline",
      "model-comparison", "metrics-calibration", "subgroup-error-audit",
      "model-card", "no-deploy-review",
    ],
  },
  "deep-learning": {
    exportName: "DEEP_LEARNING_COURSE",
    displayNumber: 20,
    milestoneCount: 14,
    drawCount: 16,
    passCount: 13,
    minutes: [70, 70, 75, 75, 75, 75, 70, 75, 75, 75, 65, 100],
    titles: [
      "Tensors and computational graphs",
      "Backpropagation and autodiff",
      "Optimisation, initialisation, normalisation and regularisation",
      "Training loops and debugging",
      "CNNs and visual representations",
      "Transfer learning",
      "Sequence models, RNNs and LSTMs",
      "Attention",
      "Transformer encoder and decoder",
      "Tokenisation and pretraining",
      "Fine-tuning and parameter-efficient adaptation",
      "Robustness, evaluation and training-card capstone",
    ],
    artifactIds: [
      "environment-lock", "training-log", "cost-energy-record", "error-slices",
      "ablation", "training-card", "limitations", "reproducibility-receipt",
    ],
  },
  "production-ai": {
    exportName: "PRODUCTION_AI_COURSE",
    displayNumber: 21,
    milestoneCount: 14,
    drawCount: 16,
    passCount: 13,
    minutes: [60, 70, 70, 70, 70, 75, 65, 70, 75, 75, 80, 120],
    titles: [
      "Production contract, SLIs and SLOs",
      "Data and training pipelines",
      "Dataset, feature and lineage versioning",
      "Experiment tracking and reproducibility",
      "Model registry, approval and cards",
      "Batch and online serving",
      "Packaging, security and secrets",
      "Shadow, canary and feature-flag rollout",
      "Monitoring, performance and cost",
      "Data drift, concept drift and continuous evaluation",
      "Incident response, rollback and postmortem",
      "Dual-system production capstone",
    ],
    artifactIds: [
      "lineage-manifest", "experiment-record", "registry-entry",
      "serving-contract", "monitoring-dashboard", "drift-evidence",
      "alert-runbook", "rollback-evidence", "postmortem",
      "governance-approval",
    ],
  },
};

const LAB_CONTRACTS = {
  "responsible-ai": {
    component: "ResponsibleAiStudio.tsx",
    componentToken: "ResponsibleAiStudio",
    localizedGuide: true,
    files: [
      "lab/README.md", "lab/README.zh-Hans.md", "lab/capstone.schema.json",
      "lab/governance-dossier-example.json", "lab/governance-dossier-template.json",
      "lab/test_lab.py", "lab/validate.py",
    ],
  },
  "ai-research": {
    component: "AiResearchStudio.tsx",
    componentToken: "AiResearchStudio",
    files: [
      "BITSTREAM-VERA-LICENSE.txt",
      "primary/REC-001.pdf", "primary/REC-002.pdf", "primary/REC-005.pdf",
      "lab/README.md", "lab/capstone.schema.json",
      "lab/mini-review-example.json", "lab/mini-review-template.json",
      "lab/primary-object-manifest.json", "lab/run_mini_review.py",
      "lab/test_lab.py", "lab/validate.py",
    ],
  },
  "ai-python-data": {
    component: "AiPythonDataLab.tsx",
    componentToken: "AiPythonDataLab",
    localizedGuide: true,
    files: [
      "lab/README.md", "lab/README.zh-Hans.md", "lab/audit.ipynb", "lab/environment.lock.json",
      "lab/requirements.lock", "lab/run_audit.py", "lab/run_notebook.py",
      "lab/capstone.schema.json", "lab/submission.template.json", "lab/validate.py",
    ],
  },
  "machine-learning": {
    component: "MachineLearningLab.tsx",
    componentToken: "MachineLearningLab",
    localizedGuide: true,
    files: [
      "lab/README.md", "lab/README.zh-Hans.md", "lab/environment.lock.json", "lab/requirements.lock",
      "lab/run_pipeline.py", "lab/capstone.schema.json",
      "lab/submission.template.json", "lab/validate.py",
    ],
  },
  "deep-learning": {
    component: "DeepLearningLab.tsx",
    componentToken: "DeepLearningLab",
    localizedGuide: true,
    files: [
      "lab/README.md", "lab/README.zh-Hans.md", "lab/environment.lock.json", "lab/requirements.lock",
      "lab/run_experiment.py", "lab/capstone.schema.json",
      "lab/submission.template.json", "lab/test_lab.py", "lab/validate.py",
    ],
  },
  "production-ai": {
    component: "ProductionAiLab.tsx",
    componentToken: "ProductionAiLab",
    localizedGuide: true,
    files: [
      "lab/README.md", "lab/README.zh-Hans.md", "lab/environment.lock.json", "lab/requirements.lock",
      "lab/services.py", "lab/run_capstone.py", "lab/capstone.schema.json",
      "lab/submission.template.json", "lab/test_lab.py", "lab/validate.py",
    ],
  },
};

function walk(directory, files = []) {
  if (!existsSync(directory)) return files;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path, files);
    else files.push(path);
  }
  return files;
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map(
      (key) => `${JSON.stringify(key)}:${stableJson(value[key])}`,
    ).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function courseKitCopySha256(copy) {
  return createHash("sha256").update(stableJson(copy)).digest("hex");
}

function validDateOnly(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function localDateOnly(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function validHumanReviewerId(value) {
  return typeof value === "string"
    && /^[a-z0-9][a-z0-9._-]{2,}$/i.test(value)
    && !/(?:^|[._-])(?:ai|agent|automated|bot|chatgpt|claude|codex|openai)(?:$|[._-])/i.test(value);
}

export function evaluateCourseKitLocalizationReview(
  courseId,
  definition,
  ledger,
  { requireApproval = true } = {},
) {
  const findings = [];
  const add = (message) => findings.push(message);
  if (!ledger || typeof ledger !== "object") {
    add(`${LOCALIZATION_REVIEW_PATH} is missing or malformed.`);
    return findings;
  }
  if (ledger.schema !== LOCALIZATION_REVIEW_SCHEMA) {
    add(`Localization review schema must be ${LOCALIZATION_REVIEW_SCHEMA}.`);
  }
  if (ledger.checklistVersion !== LOCALIZATION_REVIEW_CHECKLIST) {
    add(`Localization review checklist must be ${LOCALIZATION_REVIEW_CHECKLIST}.`);
  }
  const courseKeys = ledger.courses && typeof ledger.courses === "object"
    ? Object.keys(ledger.courses).sort()
    : [];
  if (!sameArray(courseKeys, [...COURSE_IDS].sort())) {
    add(`Localization review course inventory must be exactly ${COURSE_IDS.join(", ")}.`);
  }
  const course = ledger.courses?.[courseId];
  if (!course || typeof course !== "object") {
    add(`Localization review entry for ${courseId} is missing.`);
    return findings;
  }
  if (course.courseVersion !== definition.manifest.version) {
    add(`${courseId} review is bound to ${course.courseVersion ?? "no version"}, not ${definition.manifest.version}.`);
  }
  const localeKeys = course.locales && typeof course.locales === "object"
    ? Object.keys(course.locales).sort()
    : [];
  if (!sameArray(localeKeys, [...LOCALIZATION_REVIEW_LOCALES].sort())) {
    add(`${courseId} review locales must be exactly en and zh-Hans.`);
  }
  const today = localDateOnly();
  for (const locale of LOCALIZATION_REVIEW_LOCALES) {
    const review = course.locales?.[locale];
    if (!review || typeof review !== "object") {
      add(`${courseId}/${locale} review entry is missing.`);
      continue;
    }
    const observedHash = courseKitCopySha256(definition.copy[locale]);
    if (!/^[a-f0-9]{64}$/.test(review.copySha256 ?? "") || review.copySha256 !== observedHash) {
      add(`${courseId}/${locale} review hash does not match the exact current copy bundle (${observedHash}).`);
    }
    if (review.status === "pending") {
      if (requireApproval) {
        add(`${courseId}/${locale} human terminology, semantic-fidelity, and technical-accuracy review is pending.`);
      }
      continue;
    }
    if (review.status !== "approved") {
      add(`${courseId}/${locale} review status must be pending or approved.`);
      continue;
    }
    if (!validHumanReviewerId(review.reviewer)) {
      add(`${courseId}/${locale} approval requires a stable, non-automated human reviewer ID.`);
    }
    if (!validDateOnly(review.reviewedOn) || review.reviewedOn > today) {
      add(`${courseId}/${locale} approval requires a real, non-future review date.`);
    }
    const checks = review.checks;
    if (!checks || typeof checks !== "object"
        || !sameArray(Object.keys(checks).sort(), [...LOCALIZATION_REVIEW_CHECKS].sort())) {
      add(`${courseId}/${locale} approval must record the exact review checklist.`);
    } else {
      for (const check of LOCALIZATION_REVIEW_CHECKS) {
        if (checks[check] !== true) add(`${courseId}/${locale} review check ${check} must be true.`);
      }
    }
  }
  return findings;
}

function checkLocalizationReview(courseId, definition, issues, root, requireApproval) {
  const path = join(root, LOCALIZATION_REVIEW_PATH);
  if (!existsSync(path)) {
    issue(issues, "localization-review", `${LOCALIZATION_REVIEW_PATH} is missing.`);
    return;
  }
  let ledger;
  try {
    ledger = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    issue(issues, "localization-review", `${LOCALIZATION_REVIEW_PATH} is invalid JSON: ${error}`);
    return;
  }
  for (const finding of evaluateCourseKitLocalizationReview(
    courseId,
    definition,
    ledger,
    { requireApproval },
  )) {
    issue(issues, "localization-review", finding);
  }
}

function sameArray(left, right) {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function issue(issues, gate, message, details = undefined) {
  issues.push({ gate, message, ...(details ? { details } : {}) });
}

function provenanceResources(provenance) {
  const records = provenance.resources ?? provenance.files ?? [];
  return Array.isArray(records) ? records : [];
}

function rightsEligible(provenance) {
  const rights = provenance.rights;
  if (!rights || typeof rights !== "object") return false;
  if (rights.publication_eligible === true) return true;
  return rights.containsThirdPartyData === false
    && rights.containsPersonalData === false;
}

function checkAssets(courseId, issues, root) {
  const directory = join(root, "public/courses", courseId);
  if (!existsSync(directory)) {
    issue(issues, "assets", `Missing public/courses/${courseId}.`);
    return { files: 0, hashed: 0 };
  }
  const noticePath = join(directory, "NOTICE.md");
  if (!existsSync(noticePath)) {
    issue(issues, "rights", "NOTICE.md is missing.");
  } else {
    const notice = readFileSync(noticePath, "utf8");
    if (!/(?:original|原创|authored|synthetic|合成)/i.test(notice)) {
      issue(issues, "rights", "NOTICE.md does not identify original or synthetic authorship.");
    }
    if (!/(?:licen[cs]e|rights|权利|许可|CC0)/i.test(notice)) {
      issue(issues, "rights", "NOTICE.md does not record a rights or licence boundary.");
    }
  }

  const allFiles = walk(directory);
  const provenanceFiles = allFiles.filter((path) => /provenance(?:\.v\d+)?\.json$/i.test(path));
  if (!provenanceFiles.length) {
    issue(issues, "rights", "A machine-readable provenance JSON file is required.");
    return { files: allFiles.length, hashed: 0 };
  }

  const covered = new Set();
  let eligible = false;
  for (const provenancePath of provenanceFiles) {
    let provenance;
    try {
      provenance = JSON.parse(readFileSync(provenancePath, "utf8"));
    } catch (error) {
      issue(issues, "assets", `${relative(root, provenancePath)} is not valid JSON: ${error}`);
      continue;
    }
    eligible ||= rightsEligible(provenance);
    const records = provenanceResources(provenance);
    if (!records.length) {
      issue(issues, "assets", `${relative(root, provenancePath)} has no file hash records.`);
    }
    for (const record of records) {
      if (!record || typeof record.path !== "string" || typeof record.sha256 !== "string") {
        issue(issues, "assets", `${relative(root, provenancePath)} has a malformed hash record.`);
        continue;
      }
      const assetPath = resolve(directory, record.path);
      if (!assetPath.startsWith(`${resolve(directory)}/`)) {
        issue(issues, "assets", `Provenance path escapes its course directory: ${record.path}.`);
        continue;
      }
      covered.add(assetPath);
      if (!existsSync(assetPath)) {
        issue(issues, "assets", `Provenance references missing asset ${record.path}.`);
      } else if (sha256(assetPath) !== record.sha256.toLowerCase()) {
        issue(issues, "assets", `SHA-256 mismatch for ${record.path}.`);
      }
    }
  }
  if (!eligible) {
    issue(issues, "rights", "Provenance does not make an explicit publication-eligible original-data assertion.");
  }

  const payloadFiles = allFiles.filter((path) => {
    const name = relative(directory, path);
    return !/(^|\/)(?:NOTICE|LICENSE[^/]*)\.md$/i.test(name)
      && !/provenance(?:\.v\d+)?\.json$/i.test(name)
      && !/(^|\/)checksums\.sha256$/i.test(name);
  });
  for (const path of payloadFiles) {
    if (!covered.has(resolve(path))) {
      issue(issues, "assets", `${relative(directory, path)} is not covered by provenance SHA-256.`);
    }
  }
  return { files: allFiles.length, hashed: covered.size };
}

function checkStaticUi(courseId, issues, root) {
  const routeDirectory = join(root, "app/[locale]", courseId);
  const expectedRouteFiles = [
    join(routeDirectory, "page.tsx"),
    join(routeDirectory, "[module]/page.tsx"),
  ];
  for (const path of expectedRouteFiles) {
    if (!existsSync(path)) issue(issues, "routes", `Missing ${relative(root, path)}.`);
  }
  const routeText = expectedRouteFiles
    .filter(existsSync)
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
  for (const token of ["dynamicParams = false", "generateStaticParams", "Promise<", "await params"] ) {
    if (!routeText.includes(token)) issue(issues, "routes", `Route contract is missing ${token}.`);
  }

  const sharedDirectory = join(root, "components/course-kit");
  const courseDirectory = join(root, "components", courseId);
  const uiFiles = [
    ...walk(sharedDirectory),
    ...walk(courseDirectory),
    ...expectedRouteFiles.filter(existsSync),
  ]
    .filter((path) => /\.tsx?$/.test(path));
  const uiText = uiFiles.map((path) => readFileSync(path, "utf8")).join("\n");
  if (/<main(?:\s|>)/i.test(uiText)) {
    issue(issues, "ui", "Course kit must not create a nested second <main>.");
  }
  if (/<(?:iframe|img|video|audio|source)\b[^>]*(?:src|poster)\s*=\s*["'`{][^>]*https?:\/\//i.test(uiText)) {
    issue(issues, "ui", "Course kit embeds remote media.");
  }
  for (const token of [
    "requireStructuredReceipts = true",
    "requireStructuredReceipt = true",
    'kind: "module-artifact"',
    'kind: "capstone-artifact"',
    "courseId: config.courseId",
    "courseVersion: config.courseVersion",
    "artifactId: moduleSlug",
    "artifactId: artifact.id",
    "validatorId: config.evidenceValidatorId",
  ]) {
    if (!uiText.includes(token)) {
      issue(issues, "assessment", `Structured evidence completion gate is missing ${token}.`);
    }
  }

  for (const file of uiFiles) {
    const text = readFileSync(file, "utf8");
    const usedClasses = [...text.matchAll(/styles\.([A-Za-z_][A-Za-z0-9_]*)/g)]
      .map((match) => match[1]);
    if (!usedClasses.length) continue;
    const importMatch = text.match(/import\s+styles\s+from\s+["']([^"']+\.module\.css)["']/);
    if (!importMatch) {
      issue(issues, "ui", `${relative(root, file)} uses styles.* without a CSS module import.`);
      continue;
    }
    const cssPath = resolve(dirname(file), importMatch[1]);
    if (!existsSync(cssPath)) {
      issue(issues, "ui", `${relative(root, file)} imports missing CSS module ${importMatch[1]}.`);
      continue;
    }
    const css = readFileSync(cssPath, "utf8");
    const declaredClasses = new Set(
      [...css.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)/g)].map((match) => match[1]),
    );
    for (const className of usedClasses) {
      if (!declaredClasses.has(className)) {
        issue(issues, "ui", `${relative(root, file)} references undefined CSS class ${className}.`);
      }
    }
  }
}

function checkCourseDirectoryContract(courseId, issues, root) {
  const directory = join(root, "lib", courseId);
  const expectedFiles = [
    "types.ts",
    "manifest.ts",
    "sources.ts",
    "copy/en.ts",
    "copy/zh-Hans.ts",
    "load.ts",
    "validate.ts",
    "quiz.ts",
    "capstone.ts",
    "progress.ts",
  ];
  for (const relativePath of expectedFiles) {
    const path = join(directory, relativePath);
    if (!existsSync(path)) {
      issue(
        issues,
        "structure",
        `Missing required course contract file lib/${courseId}/${relativePath}.`,
      );
    }
  }
}

function checkCourseLabContract(courseId, contract, issues, root) {
  const labContract = LAB_CONTRACTS[courseId];
  if (!labContract) {
    issue(issues, "lab", `No executable lab contract is registered for ${courseId}.`);
    return;
  }
  const coursePublicDirectory = join(root, "public/courses", courseId);
  for (const relativePath of labContract.files) {
    if (!existsSync(join(coursePublicDirectory, relativePath))) {
      issue(issues, "lab", `Missing required executable lab asset public/courses/${courseId}/${relativePath}.`);
    }
  }

  const componentPath = join(root, "components", courseId, labContract.component);
  if (!existsSync(componentPath)) {
    issue(issues, "lab", `Missing course-specific lab component components/${courseId}/${labContract.component}.`);
  } else {
    const component = readFileSync(componentPath, "utf8");
    if (/^\s*["']use client["']/m.test(component)) {
      issue(issues, "lab", `${labContract.component} must remain a Server Component.`);
    }
    for (const token of [`/courses/${courseId}`, `aicourse.${courseId}.validator.v1`]) {
      if (!component.includes(token)) {
        issue(issues, "lab", `${labContract.component} does not expose ${token}.`);
      }
    }
    if (!component.includes("/lab")) {
      issue(issues, "lab", `${labContract.component} does not expose the published lab directory.`);
    }
    if (labContract.localizedGuide) {
      if (!component.includes("README.zh-Hans.md") || !component.includes("README.md")) {
        issue(issues, "lab", `${labContract.component} must expose both English and Simplified Chinese run guides.`);
      }
      if (!component.includes('locale === "zh-Hans"')) {
        issue(issues, "lab", `${labContract.component} must select the Simplified Chinese run guide only for zh-Hans.`);
      }
    }
  }

  const routeFiles = [
    join(root, "app/[locale]", courseId, "page.tsx"),
    join(root, "app/[locale]", courseId, "[module]/page.tsx"),
  ];
  for (const routePath of routeFiles) {
    if (!existsSync(routePath)) continue;
    const route = readFileSync(routePath, "utf8");
    if (!/supplement=\{(?:\(|<)/.test(route) || !route.includes(`@/components/${courseId}`)) {
      issue(issues, "lab", `${relative(root, routePath)} does not wire the course-specific supplement.`);
    }
  }

  const schemaPath = join(coursePublicDirectory, "lab/capstone.schema.json");
  const validatorPath = join(coursePublicDirectory, "lab/validate.py");
  if (!existsSync(schemaPath) || !existsSync(validatorPath)) return;
  let schema;
  try {
    schema = JSON.parse(readFileSync(schemaPath, "utf8"));
  } catch (error) {
    issue(issues, "lab", `capstone.schema.json is not valid JSON: ${error}`);
    return;
  }
  const expectedSchemaId = `aicourse.${courseId}.capstone.v1`;
  const expectedValidatorId = `aicourse.${courseId}.validator.v1`;
  if (schema["x-schemaId"] !== expectedSchemaId && schema.$id !== expectedSchemaId) {
    issue(issues, "lab", `capstone.schema.json does not declare exact schema ID ${expectedSchemaId}.`);
  }
  if (schema["x-validatorId"] && schema["x-validatorId"] !== expectedValidatorId) {
    issue(issues, "lab", `capstone.schema.json validator ID drifted from ${expectedValidatorId}.`);
  }
  const validator = readFileSync(validatorPath, "utf8");
  const schemaText = JSON.stringify(schema);
  for (const artifactId of contract.artifactIds) {
    if (!schemaText.includes(artifactId) || !validator.includes(artifactId)) {
      issue(issues, "lab", `Artifact ${artifactId} is not locked by both schema and validator.`);
    }
  }
  for (const token of [expectedSchemaId, expectedValidatorId, "--package"]) {
    if (!validator.includes(token)) {
      issue(issues, "lab", `Offline validator is missing ${token}.`);
    }
  }
}

function checkEvidenceContract(courseId, definition, issues, root) {
  const contract = definition.capstone.evidenceContract;
  const expected = {
    schemaId: `aicourse.${courseId}.capstone.v1`,
    schemaPath: `/courses/${courseId}/lab/capstone.schema.json`,
    validatorId: `aicourse.${courseId}.validator.v1`,
    validatorPath: `/courses/${courseId}/lab/validate.py`,
    validatorCommand: `python public/courses/${courseId}/lab/validate.py --package <artifact-package.json>`,
  };
  for (const [field, value] of Object.entries(expected)) {
    if (contract?.[field] !== value) {
      issue(issues, "assessment", `Evidence contract ${field} must equal ${value}.`);
    }
  }
  for (const [field, publicPath] of [
    ["schemaPath", contract?.schemaPath],
    ["validatorPath", contract?.validatorPath],
  ]) {
    const path = typeof publicPath === "string"
      ? join(root, "public", publicPath.replace(/^\//, ""))
      : "";
    if (!path || !existsSync(path)) {
      issue(issues, "assessment", `Evidence contract ${field} does not resolve to a published local asset.`);
    }
  }
  const validatorDiskPath = join(root, "public/courses", courseId, "lab/validate.py");
  if (existsSync(validatorDiskPath)) {
    const text = readFileSync(validatorDiskPath, "utf8");
    if (!text.includes(expected.validatorId) || !text.includes(expected.schemaId)) {
      issue(issues, "assessment", "Offline validator does not declare the exact validator and schema IDs.");
    }
  }
}

function checkDefinition(courseId, definition, contract, issues) {
  const { manifest, sources, copy, quiz, capstone } = definition;
  if (manifest.id !== courseId) issue(issues, "manifest", `Expected ID ${courseId}, found ${manifest.id}.`);
  if (manifest.displayNumber !== contract.displayNumber) {
    issue(issues, "manifest", `Expected Course ${contract.displayNumber}, found ${manifest.displayNumber}.`);
  }
  if (manifest.milestoneCount !== contract.milestoneCount) {
    issue(issues, "manifest", `Expected ${contract.milestoneCount} milestones.`);
  }
  const observedMinutes = manifest.modules.map((module) => module.minutes);
  if (!sameArray(observedMinutes, contract.minutes)) {
    issue(issues, "manifest", `Module-minute contract drift: ${JSON.stringify(observedMinutes)}.`);
  }
  const moduleTotal = observedMinutes.reduce((sum, minutes) => sum + minutes, 0);
  const expectedTotal = contract.minutes.reduce((sum, minutes) => sum + minutes, 0);
  if (moduleTotal !== expectedTotal) issue(issues, "manifest", `Expected ${expectedTotal} minutes, found ${moduleTotal}.`);
  const observedTitles = manifest.modules.map(
    (module) => copy.en?.modules[module.slug]?.title,
  );
  if (contract.titles && !sameArray(observedTitles, contract.titles)) {
    issue(issues, "manifest", `Fixed English module-title contract drift: ${JSON.stringify(observedTitles)}.`);
  }

  const artifacts = capstone.artifacts.map((artifact) => artifact.id);
  if (contract.artifactIds && !sameArray(artifacts, contract.artifactIds)) {
    issue(issues, "capstone", `Capstone artifact contract drift: ${JSON.stringify(artifacts)}.`);
  }
  if (contract.artifactCount && artifacts.length !== contract.artifactCount) {
    issue(issues, "capstone", `Expected ${contract.artifactCount} capstone artifacts, found ${artifacts.length}.`);
  }

  const expectedBank = manifest.modules.length * 3;
  if (quiz.questions.length !== expectedBank) {
    issue(issues, "quiz", `Expected ${expectedBank} bank questions, found ${quiz.questions.length}.`);
  }
  if (quiz.drawCount !== contract.drawCount || quiz.passCount !== contract.passCount) {
    issue(
      issues,
      "quiz",
      `Expected draw/pass ${contract.drawCount}/${contract.passCount}, found ${quiz.drawCount}/${quiz.passCount}.`,
    );
  }
  const critical = quiz.questions.filter((question) => question.critical === true);
  if (!critical.length) issue(issues, "quiz", "At least one critical question is required.");
  if (critical.length >= quiz.drawCount) issue(issues, "quiz", "Critical questions must fit inside the fixed draw.");
  const requiredCategories = manifest.displayNumber <= 18
    ? EARLY_CRITICAL_CATEGORIES
    : ADVANCED_CRITICAL_CATEGORIES;
  for (const category of requiredCategories) {
    if (!critical.some((question) => question.criticalCategory === category)) {
      issue(issues, "quiz", `Missing required critical category ${category}.`);
    }
  }

  if (manifest.displayNumber >= 17) {
    const gate = capstone.responsibleAiGate;
    if (!gate) {
      issue(issues, "responsible-ai", "The Course 16 horizontal gate mapping is missing.");
    } else {
      if (gate.version !== RESPONSIBLE_AI_RUBRIC_VERSION) {
        issue(issues, "responsible-ai", `Expected rubric ${RESPONSIBLE_AI_RUBRIC_VERSION}.`);
      }
      const observedCriteria = gate.criteria.map((criterion) => criterion.id);
      if (!sameArray(observedCriteria, RESPONSIBLE_AI_CRITERION_IDS)) {
        issue(issues, "responsible-ai", `Criterion mapping drift: ${JSON.stringify(observedCriteria)}.`);
      }
      for (const criterion of gate.criteria) {
        for (const questionId of criterion.questionIds) {
          const question = quiz.questions.find((candidate) => candidate.id === questionId);
          if (!question?.critical) {
            issue(issues, "responsible-ai", `${criterion.id} maps to non-critical or missing question ${questionId}.`);
          }
        }
        for (const artifactId of criterion.artifactIds) {
          if (!capstone.artifacts.some((artifact) => artifact.id === artifactId)) {
            issue(issues, "responsible-ai", `${criterion.id} maps to missing artifact ${artifactId}.`);
          }
        }
      }
    }
  }

  const expectedLocales = ["en", "zh-Hans"];
  if (!sameArray([...manifest.contentLocales], expectedLocales)) {
    issue(issues, "locales", "Complete content locales must be exactly en and zh-Hans.");
  }
  if (!copy.en || !copy["zh-Hans"]) issue(issues, "locales", "Both complete content bundles are required.");
  for (const locale of expectedLocales) {
    if (!copy[locale]) continue;
    if (!copy[locale].outcomes.length) issue(issues, "locales", `${locale} has no learning outcomes.`);
    for (const moduleManifest of manifest.modules) {
      const moduleCopy = copy[locale].modules[moduleManifest.slug];
      if (!moduleCopy) continue;
      if (moduleCopy.sections.length < 2) {
        issue(issues, "copy", `${locale}/${moduleManifest.slug} needs at least two teaching sections.`);
      }
      if (!moduleCopy.practice?.deliverable || !moduleCopy.practice?.reviewGate) {
        issue(issues, "assessment", `${locale}/${moduleManifest.slug} has no applied artifact and review gate.`);
      }
      if (!moduleCopy.checkpoint?.question) {
        issue(issues, "assessment", `${locale}/${moduleManifest.slug} has no checkpoint.`);
      }
    }
  }

  for (const source of sources) {
    if (!source.supports.trim() || !source.boundary.trim()) {
      issue(issues, "sources", `${source.id} lacks a precise supports/boundary contract.`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(source.accessedOn)) {
      issue(issues, "sources", `${source.id} lacks an ISO access date.`);
    }
    if (!source.reuseStatus) issue(issues, "rights", `${source.id} lacks a reuse status.`);
    if (!source.conceptDomain?.trim()) issue(issues, "sources", `${source.id} lacks a concept domain.`);
    if (!source.transformation?.trim()) issue(issues, "sources", `${source.id} lacks a transformation record.`);
    if (!source.rightsBoundary?.trim()) issue(issues, "rights", `${source.id} lacks a rights boundary.`);
    if (["version-pinned", "current-documentation"].includes(source.stability) && !source.revision && !source.publishedOn) {
      issue(issues, "sources", `${source.id} is unstable evidence without revision or publication date.`);
    }
    if (source.reuseStatus === "licence-noted-no-copy" && !source.licence?.trim()) {
      issue(issues, "rights", `${source.id} claims a noted licence without naming it.`);
    }
  }
}

function checkProgress(definition, helpers, issues) {
  const config = helpers.createCourseKitProgressConfig(definition);
  if (helpers.courseKitProgressPercent({}, config) !== 0) {
    issue(issues, "progress", "Empty progress must be 0%.");
  }
  const partial = {
    [config.progressVersionKey]: config.courseVersion,
    [helpers.courseKitModuleCompleteKey(config.courseId, config.moduleSlugs[0])]: true,
  };
  const expectedPartial = Math.round(100 / config.milestoneCount);
  if (helpers.courseKitProgressPercent(partial, config) !== expectedPartial) {
    issue(issues, "progress", `One milestone must equal ${expectedPartial}%.`);
  }
  const oldVersion = { ...partial, [config.progressVersionKey]: "obsolete-v0" };
  if (helpers.courseKitProgressPercent(oldVersion, config) !== 0) {
    issue(issues, "progress", "Old-version completion must be invalidated to 0%.");
  }
  const complete = { [config.progressVersionKey]: config.courseVersion };
  for (const slug of config.moduleSlugs) {
    complete[helpers.courseKitModuleCompleteKey(config.courseId, slug)] = true;
  }
  complete[helpers.courseKitQuizVersionKey(config.courseId)] = config.quizVersion;
  complete[helpers.courseKitQuizPassedKey(config.courseId)] = true;
  complete[helpers.courseKitCapstoneVersionKey(config.courseId)] = config.capstoneVersion;
  for (const id of config.capstoneArtifactIds) {
    complete[helpers.courseKitCapstoneArtifactKey(config.courseId, id)] = true;
  }
  complete[helpers.courseKitCapstoneCompleteKey(config.courseId)] = true;
  if (helpers.courseKitProgressPercent(complete, config) !== 100) {
    issue(issues, "progress", "Complete current-version progress must be 100%.");
  }
}

export function evaluateCourseKitFixture({ definition, contract, validationIssues = [], coverageIssues = [] }) {
  const issues = [];
  checkDefinition(definition.manifest.id, definition, contract, issues);
  for (const validationIssue of validationIssues) {
    issue(issues, "definition", `${validationIssue.path}: ${validationIssue.message}`);
  }
  for (const coverageIssue of coverageIssues) issue(issues, "coverage", coverageIssue);
  return { ok: issues.length === 0, issues };
}

export async function checkCourseKitRelease(
  courseId,
  projectRoot = ROOT,
  { requireLocalizationApproval = true } = {},
) {
  const root = resolve(projectRoot);
  const contract = CONTRACTS[courseId];
  if (!contract) throw new Error(`Unknown Course Kit ID: ${courseId}.`);
  const cache = `course-kit-release=${Date.now()}`;
  const [courseModule, validationModule, coverageModule, progressModule, quizModule, localeModule] = await Promise.all([
    import(`${pathToFileURL(join(root, "lib", courseId, "index.ts")).href}?${cache}`),
    import(`${pathToFileURL(join(root, "lib/course-kit/validate.ts")).href}?${cache}`),
    import(`${pathToFileURL(join(root, "lib/course-kit/coverage.ts")).href}?${cache}`),
    import(`${pathToFileURL(join(root, "lib/course-kit/progress.ts")).href}?${cache}`),
    import(`${pathToFileURL(join(root, "lib/course-kit/quiz.ts")).href}?${cache}`),
    import(`${pathToFileURL(join(root, "lib/course-kit/locale.ts")).href}?${cache}`),
  ]);
  const definition = courseModule[contract.exportName];
  if (!definition) throw new Error(`${courseId} does not export ${contract.exportName}.`);
  const issues = [];
  checkCourseDirectoryContract(courseId, issues, root);
  checkLocalizationReview(
    courseId,
    definition,
    issues,
    root,
    requireLocalizationApproval,
  );
  checkEvidenceContract(courseId, definition, issues, root);
  checkCourseLabContract(courseId, contract, issues, root);
  checkDefinition(courseId, definition, contract, issues);
  for (const item of validationModule.validateCourseKitDefinition(definition)) {
    issue(issues, "definition", `${item.path}: ${item.message}`);
  }
  for (const item of coverageModule.validateCourseKitCoverage(definition)) {
    issue(issues, "coverage", item);
  }
  checkProgress(definition, progressModule, issues);

  const materialised = localeModule.materialiseCourseKit(definition, "en");
  const draw = quizModule.drawCourseKitQuizQuestions(
    materialised.quiz.questions,
    materialised.quiz.drawCount,
    `${courseId}:${materialised.quiz.version}`,
  );
  const criticalIds = definition.quiz.questions.filter((question) => question.critical).map((question) => question.id);
  if (!criticalIds.every((id) => draw.some((question) => question.id === id))) {
    issue(issues, "quiz", "The deterministic final draw omitted a critical question.");
  }
  const wrongCriticalAnswers = Object.fromEntries(
    draw.map((question) => [question.id, question.correctIndex]),
  );
  const firstCritical = draw.find((question) => question.critical);
  if (firstCritical) {
    wrongCriticalAnswers[firstCritical.id] = (firstCritical.correctIndex + 1) % 4;
    const grade = quizModule.gradeCourseKitQuiz(draw, wrongCriticalAnswers, materialised.quiz.passCount);
    if (grade.passed) issue(issues, "quiz", "A wrong critical answer incorrectly passed the final assessment.");
  }

  for (const requestedLocale of ["es", "fr", "de", "zh-Hant", "ja", "ko", "ar"]) {
    const locale = localeModule.resolveCourseKitLocale(requestedLocale);
    if (locale.contentLocale !== "en" || locale.canonicalLocale !== "en" || locale.contentDirection !== "ltr") {
      issue(issues, "locales", `${requestedLocale} is not an explicit English/LTR fallback.`);
    }
    if (requestedLocale === "ar" && locale.shellDirection !== "rtl") {
      issue(issues, "locales", "Arabic shell must remain RTL around the English LTR content surface.");
    }
  }

  const assetStats = checkAssets(courseId, issues, root);
  checkStaticUi(courseId, issues, root);
  return {
    courseId,
    ok: issues.length === 0,
    contract: {
      displayNumber: definition.manifest.displayNumber,
      modules: definition.manifest.modules.length,
      minutes: definition.manifest.modules.reduce((sum, module) => sum + module.minutes, 0),
      milestones: definition.manifest.milestoneCount,
      questions: definition.quiz.questions.length,
      criticalQuestions: definition.quiz.questions.filter((question) => question.critical).length,
      capstoneArtifacts: definition.capstone.artifacts.length,
      sources: definition.sources.length,
      assets: assetStats.files,
      hashedAssets: assetStats.hashed,
    },
    issues,
  };
}

export async function checkAllCourseKitReleases(
  projectRoot = ROOT,
  selectedIds = COURSE_IDS,
  options = {},
) {
  const results = [];
  for (const courseId of selectedIds) {
    results.push(await checkCourseKitRelease(courseId, projectRoot, options));
  }
  return { ok: results.every((result) => result.ok), results };
}

function format(result) {
  const lines = [];
  for (const course of result.results) {
    const contract = course.contract;
    lines.push(
      `${course.courseId}: ${course.ok ? "PASS" : "FAIL"} — ${contract.modules} modules / ${contract.minutes} min / ${contract.questions} questions / ${contract.capstoneArtifacts} capstone artifacts / ${contract.hashedAssets} hashed assets`,
    );
    for (const item of course.issues) lines.push(`  [${item.gate}] ${item.message}`);
  }
  lines.push(`course-kit release: ${result.ok ? "PASS" : "FAIL"}`);
  return lines.join("\n");
}

const invoked = process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  const courseIndex = process.argv.indexOf("--course");
  const selected = courseIndex >= 0 ? [process.argv[courseIndex + 1]] : COURSE_IDS;
  if (!selected[0] || selected.some((id) => !COURSE_IDS.includes(id))) {
    console.error(`Use --course with one of: ${COURSE_IDS.join(", ")}`);
    process.exitCode = 2;
  } else {
    const result = await checkAllCourseKitReleases(ROOT, selected, {
      requireLocalizationApproval: !process.argv.includes("--local"),
    });
    if (process.argv.includes("--json")) console.log(JSON.stringify(result, null, 2));
    else console.log(format(result));
    if (!result.ok) process.exitCode = 1;
  }
}
