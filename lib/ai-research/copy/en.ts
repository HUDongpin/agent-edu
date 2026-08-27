import { RESPONSIBLE_AI_CROSS_COURSE_RUBRIC_EN } from "../../course-kit/responsible-ai-rubric";

export const AI_RESEARCH_EN_COURSE_COPY = {
  meta: {
    title: "AI for Evidence-Grounded Research",
    kicker: "Course 17 · Make every claim traceable",
    summary: "Use AI as a bounded research assistant while preserving protocol, search, screening, extraction, analysis, citation, disclosure, and reproduction evidence. RAG chunks and model summaries are locators—not final evidence.",
    audience: "Students, researchers, reviewers, analysts, librarians, and research-software builders who need AI-assisted work to remain inspectable and reproducible.",
    prerequisite: "Basic search and citation literacy. Course 18 is recommended for the technical studio; RAG is also recommended for retrieval-assisted verification work.",
    level: "Beginner to intermediate",
    duration: "10 modules · 10 hr 50 min",
    startCta: "Write the protocol",
    resumeCta: "Resume the evidence ledger",
    fallbackNotice: "The shell follows your selected language, but the teaching text on this page is English. English content remains left-to-right.",
    evidenceNote: "Methods are grounded in reporting standards, official handbooks, infrastructure documentation, and original methods research. The course never treats a search snippet, RAG chunk, or generated citation as source evidence.",
  },
  principles: [
    "Freeze the research question, eligibility logic, and analysis intent before inspecting attractive results.",
    "Preserve enough search and screening evidence for another person to reconstruct every inclusion decision.",
    "Return every substantive claim to the original PDF page, table, dataset, code, or other primary record.",
    "Separate extraction, calculation, interpretation, and synthesis so an error cannot silently cross layers.",
    "Disclose where AI helped, what it could not verify, what failed, and what a human checked.",
  ],
  outcomes: [
    "Write a protocol and preregistration-ready decision log for a bounded review question.",
    "Run and document transparent searches with database, query, date, filters, and export receipts.",
    "Screen records with explicit inclusion and exclusion reasons and visible disagreement resolution.",
    "Maintain a claim–source ledger that distinguishes evidence quality, directness, and reporting gaps.",
    "Extract PDF text, tables, numbers, and methods with page- and cell-level provenance.",
    "Use RAG to locate candidate passages, then verify citations against the primary source.",
    "Respect quantitative and qualitative inference boundaries and preserve uncertainty.",
    "Deliver an auditable mini-review with a reproduction package, citation audit, AI disclosure, and failure log.",
  ],
  quiz: { title: "Evidence-grounded research final assessment", intro: "Twelve questions are drawn from the bank. Passing requires at least 10 correct and every critical provenance, primary-source, and non-fabrication question correct." },
  capstone: {
    title: "Auditable mini-review capstone",
    intro: "Complete a small review whose decisions and claims can be reconstructed from the submitted package. A polished narrative without ledgers and source receipts is incomplete.",
    instructions: ["Use a narrowly scoped question and a manageable, lawful source set.", "Keep stable IDs across protocol, search, screening, extraction, claims, analysis, and citations.", "Verify every final claim against the original source and record unresolved access or reporting gaps instead of guessing."],
    responsibleAiRubric: RESPONSIBLE_AI_CROSS_COURSE_RUBRIC_EN,
    attestation: "I verified final claims against primary records, reported unresolved evidence gaps, and did not represent generated text, snippets, or RAG chunks as source evidence.",
  },
} as const;

export const AI_RESEARCH_EN_MODULES = {
  "question-protocol-preregistration": {
    title: "Research question, protocol and preregistration", summary: "Convert an interest into a question whose scope and decisions can survive later evidence. ", objective: "Write a protocol with question structure, eligibility, outcomes, sources, screening, extraction, synthesis, deviations, and stopping rules.", artifact: "Protocol and decision log",
    sections: [
      { heading: "Make the question operational", paragraphs: ["Define population or corpus, exposure or phenomenon, comparator where relevant, outcomes, setting, dates, languages, publication types, and unit of analysis. Ambiguity now becomes discretionary selection later."], sourceIds: ["prisma-2020"], evidenceMode: "source-grounded" },
      { heading: "Precommit consequential choices", paragraphs: ["Specify eligibility, search sources, duplicate handling, screening roles, extraction fields, risk-of-bias approach, analysis plan, and stopping rule before seeing the answer. Preregistration does not prevent change; it makes the timing and reason for change visible."], sourceIds: ["osf-preregistration"], evidenceMode: "source-grounded" },
      { heading: "Log deviations", paragraphs: ["When reality requires a change, record the previous rule, new rule, date, reason, affected records, and impact on interpretation. Do not retroactively rewrite the protocol to look prescient."], sourceIds: ["prisma-2020"], evidenceMode: "instructional-synthesis" },
    ],
    practice: { title: "Freeze the first protocol", brief: "Write the question and every decision that could change which evidence enters the review.", steps: ["Open the original fictional corpus at /courses/ai-research/mini-review-corpus-synthetic-v1.json and read its NOTICE before treating any record as evidence.", "Operationalise the question, eligibility, workflow, analysis, and stopping rules.", "Create a numbered deviation log before screening."], deliverable: "Versioned protocol and empty deviation log.", reviewGate: "A second reviewer can apply the criteria without asking what you meant." },
    checkpoint: { question: "What is the purpose of preregistration in an evidence review?", options: ["Expose which consequential decisions were made before results and document later deviations", "Prevent every legitimate protocol change", "Guarantee an unbiased conclusion", "Replace the final methods section"], correctIndex: 0, explanation: "Preregistration timestamps intent and makes deviations inspectable; it does not remove judgment or guarantee validity." },
    takeaway: "A protocol is a contract with your future, result-aware self.",
  },
  "transparent-search-search-log": {
    title: "Transparent search strategies and search log", summary: "Turn discovery into a reproducible sequence of databases, queries, dates, limits, and exports.", objective: "Design concept blocks, translate them across search systems, and preserve complete search receipts.", artifact: "Search strategy and search log",
    sections: [
      { heading: "Design concepts before syntax", paragraphs: ["Break the question into concepts, synonyms, controlled vocabulary, variants, and known sentinel records. Balance recall and precision intentionally, then translate the same conceptual strategy into each database's syntax."], sourceIds: ["cochrane-search"], evidenceMode: "source-grounded" },
      { heading: "Log what actually ran", paragraphs: ["Record platform and database, exact query, fields, filters, date and time, result count, export format, and file hash. A prose summary such as ‘we searched the literature’ cannot be rerun."], sourceIds: ["prisma-search"], evidenceMode: "source-grounded" },
      { heading: "Treat AI suggestions as candidates", paragraphs: ["A model can propose synonyms or query variants, but each term must be checked against the field, database vocabulary, and returned records. Never cite a generated bibliography without resolving every item to a real source."], sourceIds: ["prisma-search"], evidenceMode: "instructional-synthesis" },
    ],
    practice: { title: "Build a two-database search", brief: "Translate one concept strategy into two search systems and preserve both receipts.", steps: ["Create concept and synonym blocks.", "Run, inspect sentinel records, and revise transparently.", "Save exact queries, dates, counts, exports, and hashes."], deliverable: "Search log with reproducible query strings and export receipts.", reviewGate: "Another researcher can rerun the search without interpreting a screenshot." },
    checkpoint: { question: "Which record makes a search reproducible?", options: ["Database, platform, exact query, fields, filters, run date, result count, and export receipt", "A list of keywords remembered after screening", "A screenshot of the first results page", "A model's summary of the search"], correctIndex: 0, explanation: "Reproduction needs the executed syntax and context, not a later description." },
    takeaway: "If the exact search cannot be rerun, the evidence base cannot be audited.",
  },
  "screening-inclusion-exclusion": {
    title: "Screening, inclusion and exclusion", summary: "Make each record-level decision traceable from duplicate removal to full-text exclusion.", objective: "Operate a screening ledger with stable IDs, independent judgments, reasons, disagreement, and flow counts.", artifact: "Inclusion and exclusion ledger",
    sections: [
      { heading: "Preserve record identity", paragraphs: ["Assign stable IDs before deduplication. Keep source database, imported identifiers, duplicate clusters, and the surviving record. Silent deletion makes flow counts and later corrections impossible to reconstruct."], sourceIds: ["prisma-2020"], evidenceMode: "source-grounded" },
      { heading: "Apply criteria at the right stage", paragraphs: ["Title and abstract screening should exclude only when the available information is sufficient. Full-text exclusions need one specific, protocol-aligned reason. ‘Not relevant’ hides the decision rule."], sourceIds: ["cochrane-selection"], evidenceMode: "source-grounded" },
      { heading: "Keep disagreement visible", paragraphs: ["Where the design uses multiple screeners, preserve independent decisions, conflict status, discussion outcome, and adjudicator. Agreement statistics do not replace review of systematic misunderstandings."], sourceIds: ["cochrane-selection"], evidenceMode: "instructional-synthesis" },
    ],
    practice: { title: "Screen a calibration set", brief: "Apply the protocol to a small shared set before scaling screening.", steps: ["Deduplicate while preserving lineage.", "Record independent decisions and specific reasons.", "Resolve conflicts and refine ambiguous guidance through a logged protocol amendment."], deliverable: "Screening ledger and flow reconciliation.", reviewGate: "Every excluded full text has one auditable reason and every count reconciles." },
    checkpoint: { question: "What is an adequate full-text exclusion reason?", options: ["A specific protocol criterion such as wrong population or no eligible outcome", "Not relevant", "The abstract was difficult to read", "The AI screener assigned a low score"], correctIndex: 0, explanation: "Specific protocol-aligned reasons support audit, counts, and consistent application." },
    takeaway: "Screening quality lives in record-level reasons, not only the final included count.",
  },
  "evidence-hierarchy-claim-source-ledger": {
    title: "Evidence hierarchy and claim-source ledger", summary: "Match every claim to evidence of the right design, directness, and reporting quality.", objective: "Build a ledger separating source existence, study design, risk of bias, directness, result, and claim strength.", artifact: "Claim–evidence matrix",
    sections: [
      { heading: "Ask what the design can establish", paragraphs: ["Evidence hierarchy is question-dependent. Randomised studies, observational studies, qualitative accounts, technical evaluations, standards, and case reports answer different questions. Do not turn association into causation or a design recommendation into an observed effect."], sourceIds: ["grade-book-current"], evidenceMode: "source-grounded" },
      { heading: "Record reporting gaps separately", paragraphs: ["A source may exist yet omit sampling, subgroup results, variance, implementation, code, or limitations. Mark ‘not reported’ rather than inferring a favourable value. Distinguish missing evidence from evidence of no effect."], sourceIds: ["cochrane-bias"], evidenceMode: "source-grounded" },
      { heading: "Calibrate the claim", paragraphs: ["For each manuscript claim, link source IDs, exact locations, extracted finding, caveats, and allowed wording. Stronger wording requires stronger and more direct evidence."], sourceIds: ["grade-book-current"], evidenceMode: "instructional-synthesis" },
    ],
    practice: { title: "Build the claim ledger", brief: "Decompose a draft paragraph into atomic claims and test each evidence link.", steps: ["Assign stable claim IDs.", "Record source location, design, finding, quality, and reporting gaps.", "Rewrite claims that exceed the evidence boundary."], deliverable: "Claim–evidence matrix with calibrated wording.", reviewGate: "No citation is asked to support more than its design and reported result permit." },
    checkpoint: { question: "A study does not report subgroup outcomes. What belongs in the ledger?", options: ["Subgroup outcome not reported; no subgroup claim supported", "No subgroup difference", "Subgroups were balanced", "The overall result applies equally to all groups"], correctIndex: 0, explanation: "Absence of reporting cannot be converted into a null or equitable result." },
    takeaway: "The ledger prevents a real citation from being used to support an unreal claim.",
  },
  "pdf-table-extraction-boundaries": {
    title: "PDF, table and extraction boundaries", summary: "Extract what the source reports while preserving page, table, cell, unit, and transformation provenance.", objective: "Create a schema-controlled extraction sheet with verbatim locations, normalised fields, uncertainty, and double-check rules.", artifact: "Extraction sheet and verification log",
    sections: [
      { heading: "Treat extraction as data production", paragraphs: ["Define fields, types, allowed values, units, missing codes, and provenance before extraction. Store the reported value and the normalised value separately so transformations remain reviewable."], sourceIds: ["cochrane-data-collection"], evidenceMode: "source-grounded" },
      { heading: "Return to the rendered source", paragraphs: ["OCR and table tools can reorder columns, drop signs, merge cells, or confuse footnotes. Verify critical text and numbers on the rendered PDF page or authoritative table, recording page, table, row, column, and note."], sourceIds: ["pdf-2-spec", "grobid-evaluation"], evidenceMode: "instructional-synthesis" },
      { heading: "Bound derived calculations", paragraphs: ["Label recalculated statistics, unit conversions, graph readings, and imputations as transformations. Preserve code and inputs, and never present a derived value as if the article reported it."], sourceIds: ["cochrane-data-collection"], evidenceMode: "instructional-synthesis" },
    ],
    practice: { title: "Extract one complex table", brief: "Extract a table with at least one footnote, missing value, or unit transformation.", steps: ["Define the extraction schema and missing codes.", "Capture exact page and cell provenance.", "Recalculate one value in code and label it as derived."], deliverable: "Schema-valid extraction sheet and transformation receipt.", reviewGate: "A reviewer can reproduce every transformed value from preserved inputs." },
    checkpoint: { question: "How should a value recalculated from a paper's table be recorded?", options: ["As a derived value with code, inputs, formula, units, and source cells", "As a directly reported result", "Without the original values to reduce clutter", "Only in prose"], correctIndex: 0, explanation: "The reported and derived layers must remain distinguishable and reproducible." },
    takeaway: "Extraction is faithful only when location and transformation survive the copy operation.",
  },
  "citation-verification-rag-locator": {
    title: "Citation verification and RAG as locator", summary: "Use retrieval to find candidates, then verify identity and support at the primary record.", objective: "Audit bibliographic identity, source location, claim support, and quotation accuracy without trusting generated citations.", artifact: "Citation audit",
    sections: [
      { heading: "Resolve identity first", paragraphs: ["Match title, authors, venue, year, volume, pages, DOI or other persistent identifier across the cited record and the source itself. Search or metadata APIs accelerate resolution, but conflicting metadata must be investigated."], sourceIds: ["crossref-rest"], evidenceMode: "source-grounded" },
      { heading: "Use chunks only to navigate", paragraphs: ["A RAG chunk may omit qualifiers, tables, headings, page boundaries, or surrounding methods. Treat it as a locator. Open the original PDF page, table, dataset, or code before accepting the claim."], sourceIds: ["rag-original"], evidenceMode: "instructional-synthesis" },
      { heading: "Audit support, not just existence", paragraphs: ["A real paper can still be miscited. Record the exact claim, source location, supported wording, boundary, quotation check, and status. Flag inaccessible sources rather than laundering a secondary quotation into primary evidence."], sourceIds: ["crossref-rest", "niso-jats"], evidenceMode: "instructional-synthesis" },
    ],
    practice: { title: "Audit ten citations", brief: "Verify identity and claim support for a small set containing at least one deliberate mismatch.", steps: ["Resolve persistent identifiers and bibliographic fields.", "Open the primary record at the relevant page or object.", "Record support, boundary, quotation, and access status."], deliverable: "Citation audit with page-level evidence.", reviewGate: "Every retained citation supports the exact adjacent claim; RAG chunks appear only as locators." },
    checkpoint: { question: "What may a RAG chunk establish in the final review?", options: ["Where to inspect a candidate passage; the final claim still requires primary-source verification", "The truth of the claim without opening the source", "That every generated citation exists", "That omitted context is irrelevant"], correctIndex: 0, explanation: "Chunking and retrieval can remove context; authoritative support must be checked at the primary record." },
    takeaway: "Retrieval finds the door; research evidence begins after you open it.",
  },
  "quantitative-analysis-boundaries": {
    title: "Quantitative-analysis boundaries", summary: "Keep design, assumptions, code, multiplicity, uncertainty, and interpretation aligned.", objective: "Write and execute a bounded analysis plan without allowing software output to overrule design limitations.", artifact: "Quantitative analysis plan and receipt",
    sections: [
      { heading: "Start from the estimand", paragraphs: ["State the population, treatment or exposure, outcome, contrast, time, unit, and target quantity before choosing a model. A convenient coefficient may not answer the research question."], sourceIds: ["asa-pvalues"], evidenceMode: "instructional-synthesis" },
      { heading: "Preserve assumptions and multiplicity", paragraphs: ["Record missing-data handling, transformations, exclusions, clustering, dependence, diagnostics, multiple testing, robustness checks, and deviations. A p-value does not measure effect size, importance, truth, or replication probability."], sourceIds: ["asa-pvalues"], evidenceMode: "source-grounded" },
      { heading: "Make code and tables reconcile", paragraphs: ["Use tidy, keyed data structures and scripted tables where practical. Bind each reported number to data version, code version, environment, and output receipt; investigate mismatches before writing the narrative."], sourceIds: ["tidy-data"], evidenceMode: "instructional-synthesis" },
    ],
    practice: { title: "Reproduce one result", brief: "Recalculate a reported result from an available dataset or supplied fixture.", steps: ["State the estimand and assumptions.", "Run a versioned script with diagnostics.", "Reconcile the output to the manuscript claim and explain any difference."], deliverable: "Analysis script, environment receipt, and interpretation note.", reviewGate: "The conclusion reports effect, uncertainty, assumptions, and design limits—not significance alone." },
    checkpoint: { question: "What does a small p-value establish by itself?", options: ["Only compatibility of the observed data with a specified model under its assumptions; it does not establish importance or truth", "A large and important effect", "That the study will replicate", "That all model assumptions hold"], correctIndex: 0, explanation: "Interpretation must include design, effect, uncertainty, assumptions, and multiplicity." },
    takeaway: "Statistical software computes under assumptions; it does not choose a defensible claim for you.",
  },
  "qualitative-synthesis-boundaries": {
    title: "Qualitative-synthesis boundaries", summary: "Preserve context, researcher decisions, disconfirming evidence, and the distinction between participant voice and synthesis.", objective: "Build a transparent coding and synthesis trail without inventing saturation, consensus, or participant meaning.", artifact: "Qualitative synthesis memo and audit trail",
    sections: [
      { heading: "Define the analytic object", paragraphs: ["State whether you synthesise findings, participant quotations, authors' interpretations, themes, cases, or mechanisms. Preserve study context and do not pool labels that share wording but describe different phenomena."], sourceIds: ["entreq"], evidenceMode: "source-grounded" },
      { heading: "Keep interpretation traceable", paragraphs: ["Link codes and themes to source excerpts and locations, record codebook changes, negative cases, disagreements, reflexive decisions, and confidence. AI may propose candidate groupings, but cannot silently become the analyst or participant."], sourceIds: ["coreq"], evidenceMode: "instructional-synthesis" },
      { heading: "Bound the synthesis claim", paragraphs: ["Report variation and context, avoid unsupported prevalence language, and distinguish what primary authors claimed from what the review team inferred. Missing reflexivity or sampling information remains a reporting gap. COREQ applies to interviews and focus groups; SRQR is broader, and neither checklist proves analytic trustworthiness."], sourceIds: ["entreq", "srqr"], evidenceMode: "source-grounded" },
    ],
    practice: { title: "Build a transparent theme", brief: "Synthesize a small excerpt set including one disconfirming case.", steps: ["Define unit and coding purpose.", "Link codes, revisions, and theme claims to excerpts.", "Write context, variation, negative evidence, reflexivity, and confidence."], deliverable: "Theme matrix and synthesis memo.", reviewGate: "A reviewer can distinguish source voice, primary-author interpretation, and reviewer synthesis." },
    checkpoint: { question: "How should an AI-proposed qualitative theme be treated?", options: ["As a candidate interpretation that humans test against excerpts, context, negative cases, and the audit trail", "As final once it sounds coherent", "As participant testimony", "As evidence of prevalence"], correctIndex: 0, explanation: "Synthesis requires accountable interpretation grounded in the source corpus and analytic decisions." },
    takeaway: "A coherent theme is not enough; its path from source to interpretation must remain visible.",
  },
  "reproducibility-uncertainty-ai-disclosure": {
    title: "Reproducibility, uncertainty and AI disclosure", summary: "Package materials, environments, decisions, failures, and AI assistance so another person can inspect what happened.", objective: "Create a reproduction package and disclosure that distinguishes available, restricted, generated, verified, and failed steps.", artifact: "Reproduction package and disclosure",
    sections: [
      { heading: "Bind the research object", paragraphs: ["Package protocol, search exports, ledgers, extraction schema, data or lawful access instructions, code, environment, outputs, and README. Use stable paths, versions, checksums, and one command or documented sequence where possible."], sourceIds: ["acm-artifact-review", "fair-principles"], evidenceMode: "source-grounded" },
      { heading: "Disclose AI by function", paragraphs: ["Record tool and version where known, date, task, input boundary, output use, human verification, rejected outputs, and material limitations. Do not paste confidential prompts or proprietary content into a public disclosure."], sourceIds: ["icmje-ai"], evidenceMode: "version-watch" },
      { heading: "Report uncertainty and failure", paragraphs: ["List inaccessible sources, ambiguous eligibility, failed extraction, irreproducible calculations, missing code, unstable tools, and sensitivity of conclusions. A failure log is evidence about the limits of the workflow, not an embarrassment to delete."], sourceIds: ["acm-artifact-review"], evidenceMode: "instructional-synthesis" },
    ],
    practice: { title: "Run a clean-room reproduction", brief: "Ask another person or clean environment to reproduce one table and one claim.", steps: ["Package inputs, environment, code, outputs, and instructions.", "Record every manual and AI-assisted step.", "Log failure, repair the package, and rerun from clean state."], deliverable: "Reproduction package, AI disclosure, and failure log.", reviewGate: "A fresh environment can reach the declared output or produce a specific, documented blocker." },
    checkpoint: { question: "What belongs in an AI-use disclosure?", options: ["Tool/version where known, date, task, input boundary, output use, human verification, failures, and limitations", "Only a statement that AI was used", "Every confidential prompt verbatim", "A claim that human review makes errors impossible"], correctIndex: 0, explanation: "Functional, bounded disclosure lets readers evaluate where AI affected the research process." },
    takeaway: "Reproducibility includes failed paths and human judgments, not just the final script.",
  },
  "auditable-mini-review-capstone": {
    title: "Auditable mini-review capstone", summary: "Integrate protocol, search, screening, extraction, analysis, citations, and disclosure into one reconstructable review.", objective: "Deliver eight linked artifacts and a synthesis whose every substantive claim resolves to primary evidence.", artifact: "Auditable mini-review package",
    sections: [
      { heading: "Reconcile the ledgers", paragraphs: ["Every included source must appear in screening, extraction, claim, and citation records as applicable. Flow counts, IDs, file names, and references must agree. Resolve orphan claims and unused included records."], sourceIds: ["prisma-2020"], evidenceMode: "instructional-synthesis" },
      { heading: "Write from the matrix", paragraphs: ["Draft claims from verified evidence rows, not from model prose or memory. State heterogeneity, quality, missing reporting, access limits, and where synthesis is interpretive rather than directly reported."], sourceIds: ["grade-book-current"], evidenceMode: "instructional-synthesis" },
      { heading: "Audit the package", paragraphs: ["Run schema, link, citation, calculation, privacy, licence, and clean-reproduction checks. Freeze a versioned receipt and preserve unresolved blockers rather than editing the report until the warning disappears."], sourceIds: ["acm-artifact-review", "fair-principles"], evidenceMode: "source-grounded" },
    ],
    practice: { title: "Submit and defend the mini-review", brief: "Give the package to a reviewer who did not build it.", steps: ["Reconcile stable IDs and counts across eight artifacts.", "Sample claims back to pages, tables, data, and code.", "Run clean reproduction and record every unresolved limitation."], deliverable: "Mini-review, eight artifacts, and validation receipt.", reviewGate: "The reviewer can reconstruct inclusion and verify sampled claims without asking for hidden files." },
    checkpoint: { question: "What is a valid final evidence chain for a review claim?", options: ["Claim ID → verified extraction → exact primary-source page/table/data/code → citation and boundary", "Claim → RAG chunk → generated bibliography", "Claim → search snippet → article title", "Claim → model confidence score"], correctIndex: 0, explanation: "Final claims must return to primary records with location and evidence boundaries." },
    takeaway: "The review is finished when another person can audit it—not when the prose sounds finished.",
  },
} as const;
