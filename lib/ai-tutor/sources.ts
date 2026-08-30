import type { AiTutorSourceId, AiTutorSourceRecord } from "./types";

export const AI_TUTOR_SOURCES = [
  {
    id: "constructive-alignment",
    title: "Constructive alignment",
    publisher: "Monash University TeachHQ",
    url: "https://www.monash.edu/learning-teaching/teachhq/Teaching-practices/learning-outcomes/how-to/constructive-alignment",
    accessedOn: "2026-08-23",
    evidenceType: "teaching-guidance",
  },
  {
    id: "concept-mapping",
    title: "The Theory Underlying Concept Maps and How to Construct and Use Them",
    publisher: "Florida Institute for Human and Machine Cognition",
    url: "https://cmap.ihmc.us/publications/researchpapers/theoryunderlyingconceptmaps.pdf",
    accessedOn: "2026-08-23",
    evidenceType: "research",
  },
  {
    id: "evidence-centered-design",
    title: "Evidence-Centered Design: The TOEIC Speaking and Writing Tests",
    publisher: "ETS",
    url: "https://www.ets.org/Media/Research/pdf/TC-10-07.pdf",
    accessedOn: "2026-08-23",
    evidenceType: "research",
  },
  {
    id: "scaffolding-review",
    title: "Scaffolding in teacher-student interaction: A decade of research",
    publisher: "Educational Psychology Review",
    url: "https://doi.org/10.1007/s10648-010-9127-6",
    accessedOn: "2026-08-23",
    evidenceType: "research",
  },
  {
    id: "apa-formative-assessment",
    title: "Pre-K to 12 Teaching Principle: Assessment",
    publisher: "American Psychological Association",
    url: "https://www.apa.org/ed/schools/teaching-learning/top-twenty/assessment",
    accessedOn: "2026-08-23",
    evidenceType: "official-guidance",
  },
  {
    id: "testing-standards",
    title: "Standards for Educational and Psychological Testing",
    publisher: "AERA, APA, and NCME",
    url: "https://www.apa.org/science/programs/testing/standards",
    accessedOn: "2026-08-23",
    evidenceType: "standard",
  },
  {
    id: "knowledge-tracing",
    title: "Knowledge tracing: Modeling the acquisition of procedural knowledge",
    publisher: "User Modeling and User-Adapted Interaction",
    url: "https://doi.org/10.1007/BF01099821",
    accessedOn: "2026-08-23",
    evidenceType: "research",
  },
  {
    id: "negotiated-learner-modeling",
    title: "Negotiated learner modelling to maintain today's learner models",
    publisher: "Research and Practice in Technology Enhanced Learning",
    url: "https://link.springer.com/article/10.1186/s41039-016-0035-3",
    accessedOn: "2026-08-23",
    evidenceType: "research",
  },
  {
    id: "wwc-standards",
    title: "What Works Clearinghouse Procedures and Standards Handbook, Version 5.0",
    publisher: "U.S. Institute of Education Sciences",
    url: "https://ies.ed.gov/ncee/wwc/Handbooks",
    accessedOn: "2026-08-23",
    evidenceType: "standard",
  },
  {
    id: "unesco-genai-guidance",
    title: "Guidance for generative AI in education and research",
    publisher: "UNESCO",
    url: "https://unesdoc.unesco.org/ark:/48223/pf0000386693",
    accessedOn: "2026-08-23",
    evidenceType: "official-guidance",
  },
  {
    id: "nist-ai-rmf",
    title: "Artificial Intelligence Risk Management Framework (AI RMF 1.0)",
    publisher: "National Institute of Standards and Technology",
    url: "https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10",
    accessedOn: "2026-08-23",
    evidenceType: "official-guidance",
  },
] as const satisfies readonly AiTutorSourceRecord[];

export const AI_TUTOR_SOURCE_BY_ID = Object.fromEntries(
  AI_TUTOR_SOURCES.map((source) => [source.id, source]),
) as unknown as Record<AiTutorSourceId, AiTutorSourceRecord>;

export function getAiTutorSource(id: AiTutorSourceId): AiTutorSourceRecord {
  const source = AI_TUTOR_SOURCE_BY_ID[id];
  if (!source) throw new Error(`Unknown AI Tutor source: ${id}`);
  return source;
}
