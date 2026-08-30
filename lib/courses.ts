/**
 * The course catalogue.
 *
 * Data-driven so adding a course is one entry here plus its strings in
 * messages/*.json — no new page, no new component.
 *
 * `status` is load-bearing and honest: a "soon" entry is specified and being
 * built, but does not exist yet, so it is shown greyed out and is not
 * clickable. A catalogue that lists courses you cannot take is a catalogue
 * nobody trusts twice — which is why an entry only earns "soon" while someone
 * is actually working on it, and why `tools` and `cost` were removed rather
 * than left advertised indefinitely. Both are fully specified in
 * `docs/course-briefs/`; their rows come back the day someone starts building.
 */

export type Level = "beginner" | "intermediate" | "advanced";
export type Format = "read" | "interactive" | "code";
export type Topic = "foundations" | "prompting" | "agents" | "evaluation" | "safety";
export type Status = "available" | "soon";
export type CourseId = "handbook" | "lab" | "build" | "hitl";

export interface Course {
  id: CourseId;
  /** Path relative to the locale root, or an absolute URL. */
  href: string;
  external?: boolean;
  level: Level;
  format: Format;
  topic: Topic;
  minutes: number;
  status: Status;
  /** CSS custom property carrying this course's hue. */
  hue: string;
}

export const COURSES: Course[] = [
  {
    id: "handbook", href: "/handbook/", level: "beginner", format: "read",
    topic: "foundations", minutes: 45, status: "available", hue: "var(--brand)",
  },
  {
    id: "lab", href: "/lab/", level: "beginner", format: "interactive",
    topic: "prompting", minutes: 40, status: "available", hue: "var(--green)",
  },
  {
    id: "build", href: "/build/",
    level: "intermediate", format: "code", topic: "agents",
    minutes: 150, status: "available", hue: "var(--violet)",
  },
  {
    id: "hitl", href: "#", level: "intermediate", format: "read",
    topic: "safety", minutes: 35, status: "soon", hue: "var(--brand-2)",
  },
];

export const LEVELS: Level[] = ["beginner", "intermediate", "advanced"];
export const FORMATS: Format[] = ["read", "interactive", "code"];
export const TOPICS: Topic[] = ["foundations", "prompting", "agents", "evaluation", "safety"];
export const STATUSES: Status[] = ["available", "soon"];
