/**
 * The course catalogue.
 *
 * Data-driven so adding a course is one entry here plus its strings in
 * messages/*.json — no new page, no new component.
 *
 * `status` is load-bearing and honest: "soon" entries are real plans (the
 * gaps the README already names) but they do not exist yet, so they are
 * shown greyed out and are not clickable. A catalogue that lists courses you
 * cannot take is a catalogue nobody trusts twice.
 */

export type Level = "beginner" | "intermediate" | "advanced";
export type Format = "read" | "interactive" | "code";
export type Topic = "foundations" | "prompting" | "agents" | "evaluation" | "safety";
export type Status = "available" | "soon";

export interface Course {
  id: string;
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
  /** How to read this course's progress out of localStorage. */
  progress: (p: Record<string, unknown>, sectionsSeen: number) => number;
}

export const COURSES: Course[] = [
  {
    id: "handbook", href: "/handbook/", level: "beginner", format: "read",
    topic: "foundations", minutes: 45, status: "available", hue: "var(--brand)",
    progress: (_p, seen) => Math.round((seen / 11) * 100),
  },
  {
    id: "lab", href: "/lab/", level: "beginner", format: "interactive",
    topic: "prompting", minutes: 40, status: "available", hue: "var(--green)",
    progress: (p) => {
      const done = ["play0", "play1", "play2", "play3"].filter((k) => p[k]).length;
      return Math.round((done / 4) * 100);
    },
  },
  {
    id: "build", href: "https://github.com/HUDongpin/agent-edu/tree/main/course",
    external: true, level: "intermediate", format: "code", topic: "agents",
    minutes: 150, status: "available", hue: "var(--violet)",
    progress: (p) => (p.part2 ? 100 : 0),
  },
  {
    id: "tools", href: "#", level: "advanced", format: "code", topic: "agents",
    minutes: 60, status: "soon", hue: "var(--gold-mark)", progress: () => 0,
  },
  {
    id: "cost", href: "#", level: "intermediate", format: "interactive",
    topic: "evaluation", minutes: 30, status: "soon", hue: "var(--red)",
    progress: () => 0,
  },
  {
    id: "hitl", href: "#", level: "intermediate", format: "read",
    topic: "safety", minutes: 35, status: "soon", hue: "var(--brand-2)",
    progress: () => 0,
  },
];

export const LEVELS: Level[] = ["beginner", "intermediate", "advanced"];
export const FORMATS: Format[] = ["read", "interactive", "code"];
export const TOPICS: Topic[] = ["foundations", "prompting", "agents", "evaluation", "safety"];
export const STATUSES: Status[] = ["available", "soon"];
