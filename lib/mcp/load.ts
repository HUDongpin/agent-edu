import "server-only";

import { MCP_FINAL_ASSESSMENT } from "./assessment";
import { MCP_CLAIM_MAP } from "./claims";
import type { McpCourseCopy } from "./copy";
import { MCP_CONCEPTS, MCP_LESSONS, MCP_UNITS } from "./course";
import { MCP_EXTENSIONS } from "./extensions";
import { MCP_FIGURES } from "./figures";
import { MCP_SOURCES } from "./sources";
import {
  MCP_COURSE_SEQUENCE,
  MCP_COURSE_VERSION,
  MCP_PROTOCOL_VERSION,
  type McpCourse,
  type McpKnowledgeCheck,
  type McpLesson,
  type McpLessonSection,
  type McpLocale,
} from "./types";

type CopyModule = { default: McpCourseCopy };

const COPY_LOADERS: Record<McpLocale, () => Promise<CopyModule>> = {
  en: () => import("@/messages/mcp/en.json") as unknown as Promise<CopyModule>,
  es: () => import("@/messages/mcp/es.json") as unknown as Promise<CopyModule>,
  fr: () => import("@/messages/mcp/fr.json") as unknown as Promise<CopyModule>,
  de: () => import("@/messages/mcp/de.json") as unknown as Promise<CopyModule>,
  "zh-Hans": () => import("@/messages/mcp/zh-Hans.json") as unknown as Promise<CopyModule>,
  "zh-Hant": () => import("@/messages/mcp/zh-Hant.json") as unknown as Promise<CopyModule>,
  ja: () => import("@/messages/mcp/ja.json") as unknown as Promise<CopyModule>,
  ko: () => import("@/messages/mcp/ko.json") as unknown as Promise<CopyModule>,
  ar: () => import("@/messages/mcp/ar.json") as unknown as Promise<CopyModule>,
};

function requireCopy<T>(value: T | undefined, path: string): T {
  if (value === undefined) throw new Error(`Missing MCP localized copy: ${path}`);
  return value;
}

function materializeSection(
  invariant: McpLessonSection,
  localized: McpCourseCopy["lessons"][string]["sections"][number],
  path: string,
): McpLessonSection {
  return {
    heading: localized.heading,
    body: localized.body,
    ...(invariant.bullets ? {
      bullets: requireCopy(localized.bullets, `${path}.bullets`),
    } : {}),
    ...(invariant.code ? {
      code: {
        ...invariant.code,
        label: requireCopy(localized.codeLabel, `${path}.codeLabel`),
      },
    } : {}),
    ...(invariant.callout ? {
      callout: {
        tone: invariant.callout.tone,
        title: requireCopy(localized.callout, `${path}.callout`).title,
        body: requireCopy(localized.callout, `${path}.callout`).body,
      },
    } : {}),
  };
}

function materializeCheck(
  invariant: McpKnowledgeCheck,
  localized: McpCourseCopy["lessons"][string]["check"],
): McpKnowledgeCheck {
  return {
    question: localized.question,
    options: localized.options,
    correctIndex: invariant.correctIndex,
    explanation: localized.explanation,
  };
}

function materializeLesson(copy: McpCourseCopy, invariant: McpLesson): McpLesson {
  const localized = requireCopy(copy.lessons[invariant.slug], `lessons.${invariant.slug}`);
  if (localized.sections.length !== invariant.sections.length) {
    throw new Error(`MCP localized section count mismatch: lessons.${invariant.slug}.sections`);
  }
  return {
    ...invariant,
    title: localized.title,
    summary: localized.summary,
    objective: localized.objective,
    sections: invariant.sections.map((section, index) => materializeSection(
      section,
      requireCopy(localized.sections[index], `lessons.${invariant.slug}.sections.${index}`),
      `lessons.${invariant.slug}.sections.${index}`,
    )),
    practice: {
      title: localized.practice.title,
      brief: localized.practice.brief,
      steps: localized.practice.steps,
      evidence: localized.practice.evidence,
      safety: localized.practice.safety,
    },
    check: materializeCheck(invariant.check, localized.check),
    takeaway: localized.takeaway,
  };
}

export async function loadMcpCopy(locale: McpLocale): Promise<McpCourseCopy> {
  const loaded = await COPY_LOADERS[locale]();
  return loaded.default;
}

export async function loadMcpCourse(locale: McpLocale): Promise<McpCourse> {
  const copy = await loadMcpCopy(locale);
  const lessons = MCP_LESSONS.map((lesson) => materializeLesson(copy, lesson));

  return {
    locale,
    contentLocale: locale,
    contentDirection: locale === "ar" ? "rtl" : "ltr",
    copyMetadata: copy._meta,
    sequence: MCP_COURSE_SEQUENCE,
    version: MCP_COURSE_VERSION,
    protocolVersion: MCP_PROTOCOL_VERSION,
    publishedOn: "2026-08-24",
    title: copy.meta.title,
    shortTitle: copy.meta.shortTitle,
    kicker: copy.meta.kicker,
    summary: copy.meta.summary,
    audience: copy.meta.audience,
    sourceNote: copy.meta.sourceNote,
    localeNote: copy.meta.localeNote,
    units: MCP_UNITS.map((unit) => ({
      ...unit,
      ...requireCopy(copy.units[unit.id], `units.${unit.id}`),
    })),
    lessons,
    concepts: MCP_CONCEPTS.map((concept) => ({
      ...concept,
      label: requireCopy(copy.concepts[concept.id], `concepts.${concept.id}`).label,
    })),
    sources: MCP_SOURCES.map((source) => ({
      ...source,
      note: requireCopy(copy.sourceNotes[source.id], `sourceNotes.${source.id}`),
    })),
    figures: MCP_FIGURES.map((figure) => ({
      ...figure,
      ...requireCopy(copy.figures[figure.id], `figures.${figure.id}`),
    })),
    assessment: MCP_FINAL_ASSESSMENT.map((question) => ({
      ...question,
      ...requireCopy(copy.assessment[question.id], `assessment.${question.id}`),
      correctIndex: question.correctIndex,
      reviewSlug: question.reviewSlug,
    })),
    claims: MCP_CLAIM_MAP.map((claim) => ({
      ...claim,
      claim: requireCopy(copy.claims[claim.id], `claims.${claim.id}`),
    })),
    extensions: MCP_EXTENSIONS.map((extension) => ({
      ...extension,
      ...requireCopy(copy.extensions[extension.id], `extensions.${extension.id}`),
    })),
    ui: copy.ui,
    capstone: copy.capstone,
    interactive: copy.interactive,
  };
}

export async function getLocalizedMcpLesson(locale: McpLocale, slug: string) {
  const course = await loadMcpCourse(locale);
  return course.lessons.find((lesson) => lesson.slug === slug);
}
