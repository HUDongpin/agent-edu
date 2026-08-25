import type { SoftwareEngineeringCapstoneArtifactId } from "./capstone";
import type {
  SoftwareEngineeringLessonSlug,
  SoftwareEngineeringQuestionId,
} from "./types";

/**
 * Release coverage contract derived from SWEBOK v4.0a's 18 knowledge areas.
 * Each row must be taught, practised, and represented in assessment/capstone.
 */
export const SOFTWARE_ENGINEERING_COVERAGE = [
  {
    area: "Software Requirements",
    lessonSlugs: ["requirements-task-contracts"],
    requiredConcepts: ["stakeholders", "functional requirements", "nonfunctional requirements", "acceptance criteria", "traceability", "change control"],
    assessmentQuestionIds: ["q02"],
    capstoneArtifactIds: ["requirements-risk-contract"],
  },
  {
    area: "Software Architecture",
    lessonSlugs: ["architecture-tradeoffs"],
    requiredConcepts: ["quality attributes", "views", "boundaries", "deployment topology", "architecture decisions"],
    assessmentQuestionIds: ["q03"],
    capstoneArtifactIds: ["architecture-decision-package"],
  },
  {
    area: "Software Design",
    lessonSlugs: ["architecture-tradeoffs", "construction-quality"],
    requiredConcepts: ["modularity", "coupling", "cohesion", "interfaces", "data models", "patterns"],
    assessmentQuestionIds: ["q03", "q08"],
    capstoneArtifactIds: ["architecture-decision-package"],
  },
  {
    area: "Software Construction",
    lessonSlugs: ["construction-quality"],
    requiredConcepts: ["idioms", "types", "errors", "validation", "configuration", "dependencies", "build systems"],
    assessmentQuestionIds: ["q08", "q09"],
    capstoneArtifactIds: ["reviewable-implementation-history"],
  },
  {
    area: "Software Testing",
    lessonSlugs: ["testing-strategy"],
    requiredConcepts: ["unit", "integration", "contract", "end-to-end", "property", "fuzz", "mutation", "accessibility", "flakiness"],
    assessmentQuestionIds: ["q11", "q15"],
    capstoneArtifactIds: ["independent-verification-package"],
  },
  {
    area: "Software Engineering Operations",
    lessonSlugs: ["cicd-release", "reliability-observability"],
    requiredConcepts: ["deployment", "observability", "incident response", "rollback", "disaster recovery"],
    assessmentQuestionIds: ["q17", "q18"],
    capstoneArtifactIds: ["release-operations-package"],
  },
  {
    area: "Software Maintenance",
    lessonSlugs: ["review-refactoring-debt", "documentation-knowledge"],
    requiredConcepts: ["corrective maintenance", "adaptive maintenance", "perfective maintenance", "refactoring", "deprecation", "compatibility"],
    assessmentQuestionIds: ["q14"],
    capstoneArtifactIds: ["reviewable-implementation-history"],
  },
  {
    area: "Software Configuration Management",
    lessonSlugs: ["git-environments-worktrees", "cicd-release"],
    requiredConcepts: ["version control", "branches", "worktrees", "merge", "release", "provenance", "rollback"],
    assessmentQuestionIds: ["q07", "q17"],
    capstoneArtifactIds: ["repository-run-manifest", "release-operations-package"],
  },
  {
    area: "Software Engineering Management",
    lessonSlugs: ["planning-estimation-risk", "teams-governance"],
    requiredConcepts: ["scope", "planning", "estimation", "risk", "ownership", "communication", "measurement"],
    assessmentQuestionIds: ["q04", "q21"],
    capstoneArtifactIds: ["requirements-risk-contract", "human-review-evaluation-decision"],
  },
  {
    area: "Software Engineering Process",
    lessonSlugs: ["agentic-engineering-system", "planning-estimation-risk", "teams-governance"],
    requiredConcepts: ["agile", "lean", "plan-driven", "workflow", "feedback", "retrospective", "continuous improvement"],
    assessmentQuestionIds: ["q01", "q21"],
    capstoneArtifactIds: ["human-review-evaluation-decision"],
  },
  {
    area: "Software Engineering Models and Methods",
    lessonSlugs: ["requirements-task-contracts", "architecture-tradeoffs", "debugging-root-cause"],
    requiredConcepts: ["abstraction", "modeling", "analysis", "hypothesis", "decision records", "formalizable contracts"],
    assessmentQuestionIds: ["q02", "q12"],
    capstoneArtifactIds: ["architecture-decision-package", "independent-verification-package"],
  },
  {
    area: "Software Quality",
    lessonSlugs: ["testing-strategy", "review-refactoring-debt", "agent-evaluation"],
    requiredConcepts: ["quality model", "verification", "validation", "review", "static analysis", "quality assurance"],
    assessmentQuestionIds: ["q11", "q15"],
    capstoneArtifactIds: ["independent-verification-package"],
  },
  {
    area: "Software Security",
    lessonSlugs: ["security-privacy-supply-chain"],
    requiredConcepts: ["threat modeling", "authentication", "authorization", "least privilege", "secrets", "privacy", "supply chain", "vulnerability response"],
    assessmentQuestionIds: ["q16", "q20", "q25"],
    capstoneArtifactIds: ["security-privacy-supply-chain-review"],
  },
  {
    area: "Software Engineering Professional Practice",
    lessonSlugs: ["teams-governance", "capstone-safe-change"],
    requiredConcepts: ["ethics", "accountability", "authorship", "licensing", "accessibility", "human oversight", "maintainer burden"],
    assessmentQuestionIds: ["q23"],
    capstoneArtifactIds: ["human-review-evaluation-decision"],
  },
  {
    area: "Software Engineering Economics",
    lessonSlugs: ["performance-economics", "planning-estimation-risk"],
    requiredConcepts: ["cost of delay", "total cost of ownership", "value", "human review cost", "model cost", "sustainability"],
    assessmentQuestionIds: ["q04", "q09", "q21"],
    capstoneArtifactIds: ["requirements-risk-contract", "human-review-evaluation-decision"],
  },
  {
    area: "Computing Foundations",
    lessonSlugs: ["architecture-tradeoffs", "construction-quality", "performance-economics"],
    requiredConcepts: ["algorithms", "data structures", "complexity", "concurrency", "distributed systems", "resource management"],
    assessmentQuestionIds: ["q10", "q19"],
    capstoneArtifactIds: ["architecture-decision-package", "independent-verification-package"],
  },
  {
    area: "Mathematical Foundations",
    lessonSlugs: ["architecture-tradeoffs", "testing-strategy", "agent-evaluation"],
    requiredConcepts: ["logic", "sets and relations", "graphs and trees", "finite-state machines", "discrete probability", "precision and error"],
    assessmentQuestionIds: ["q10", "q24"],
    capstoneArtifactIds: ["independent-verification-package", "human-review-evaluation-decision"],
  },
  {
    area: "Engineering Foundations",
    lessonSlugs: ["architecture-tradeoffs", "debugging-root-cause", "agent-evaluation"],
    requiredConcepts: ["engineering process", "engineering design", "abstraction", "empirical methods", "statistical analysis", "modeling", "measurement", "standards", "root-cause analysis"],
    assessmentQuestionIds: ["q12", "q19", "q21"],
    capstoneArtifactIds: ["architecture-decision-package", "independent-verification-package", "human-review-evaluation-decision"],
  },
] as const satisfies readonly {
  readonly area: string;
  readonly lessonSlugs: readonly SoftwareEngineeringLessonSlug[];
  readonly requiredConcepts: readonly string[];
  readonly assessmentQuestionIds: readonly SoftwareEngineeringQuestionId[];
  readonly capstoneArtifactIds: readonly SoftwareEngineeringCapstoneArtifactId[];
}[];

export const SOFTWARE_ENGINEERING_COVERAGE_SOURCE = {
  title: "Guide to the Software Engineering Body of Knowledge, version 4.0a",
  url: "https://ieeecs-media.computer.org/media/education/swebok/swebok-v4.pdf",
  snapshotOn: "2026-08-23",
} as const;
