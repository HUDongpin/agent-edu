"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";
import Cover from "./Cover";
import { useI18n } from "../I18nProvider";
import {
  CATALOG_COURSES,
  CATALOG_TOPICS,
  COURSE_MODULES,
  LEVELS,
  STATUSES,
  TOP_LEVEL_COURSES,
  catalogCourseMatchesLevel,
  type CatalogCourse,
  type CatalogTopic,
  type Level,
  type Status,
} from "@/lib/courses";
import { PROG, SECTIONS } from "@/lib/progress";

const ALL = "__all__";
const CATALOG_RESULTS_IDS = "catalog-course-results catalog-upcoming-course-results";

type ProgressMap = Record<string, number>;
type Translator = (key: string) => string;

function catalogTopicFromQuery(value: string | null): CatalogTopic | typeof ALL {
  if (!value) return ALL;
  if ((CATALOG_TOPICS as readonly string[]).includes(value)) return value as CatalogTopic;

  // Preserve useful links from the earlier module-level taxonomy.
  if (["foundations", "prompting", "agents"].includes(value)) return "ai-systems";
  if (value === "tools") return "coding-assistants";
  return ALL;
}

function levelFromQuery(value: string | null): Level | typeof ALL {
  return value && (LEVELS as readonly string[]).includes(value) ? value as Level : ALL;
}

function statusFromQuery(value: string | null): Status | typeof ALL {
  return value && (STATUSES as readonly string[]).includes(value) ? value as Status : ALL;
}

/** Course progress is private browser state, so it is read only after mount. */
function useCourseProgress(): ProgressMap {
  const [map, setMap] = useState<ProgressMap>({});

  useEffect(() => {
    const read = () => {
      let sectionsSeen = 0;
      try {
        sectionsSeen = (localStorage.getItem(SECTIONS) || "")
          .split(",")
          .filter(Boolean).length;
      } catch {
        // Storage can be unavailable in private browsing. The courses still work.
      }

      const records = new Map<string, Record<string, unknown>>();
      const progressFor = (storageKey: string): Record<string, unknown> => {
        const cached = records.get(storageKey);
        if (cached) return cached;
        let record: Record<string, unknown> = {};
        try {
          const stored: unknown = JSON.parse(localStorage.getItem(storageKey) || "{}");
          if (stored && typeof stored === "object" && !Array.isArray(stored)) {
            record = stored as Record<string, unknown>;
          }
        } catch {
          // Malformed or unavailable storage is worth zero, never a destructive rewrite.
        }
        records.set(storageKey, record);
        return record;
      };

      const next: ProgressMap = {};
      for (const course of CATALOG_COURSES) {
        if (course.progress) {
          const progress = progressFor(course.progressStorageKey ?? PROG);
          next[course.id] = course.progress(progress, sectionsSeen);
        }
      }
      setMap(next);
    };

    read();
    const progressEvents = new Set([
      ...CATALOG_COURSES.map((course) => course.progressEvent),
      ...TOP_LEVEL_COURSES.map((course) => course.progressEvent),
    ].filter((event): event is string => Boolean(event)));
    window.addEventListener("focus", read);
    window.addEventListener("storage", read);
    for (const event of progressEvents) window.addEventListener(event, read);
    return () => {
      window.removeEventListener("focus", read);
      window.removeEventListener("storage", read);
      for (const event of progressEvents) window.removeEventListener(event, read);
    };
  }, []);

  return map;
}

function actionLabel(progress: number, t: Translator): string {
  if (progress >= 100) return t("cat.review");
  if (progress > 0) return t("cat.resume");
  return t("cat.start");
}

function normalise(value: string, locale: string): string {
  return value.normalize("NFKC").toLocaleLowerCase(locale).trim();
}

function SelectFilter({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="filt catalog-filter">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-controls={CATALOG_RESULTS_IDS}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}

function CourseCard({
  course,
  locale,
  progress,
}: {
  course: CatalogCourse;
  locale: string;
  progress: number;
}) {
  const { t } = useI18n();
  const available = course.status === "available";
  const isAgentic = course.id === "agentic";
  const isClaude = course.id === "claude";
  const isCursor = course.id === "cursor";
  const isGrok = course.id === "grok";
  const isGithub = course.id === "github";
  const isPrompts = course.id === "prompts";
  const isSoftwareEngineering = course.id === "software-engineering";
  const isRag = course.id === "rag";
  const isMcp = course.id === "mcp";
  const isClaudeIncome = course.id === "claude-income";
  const isAiTutor = course.id === "ai-tutor";
  const isProductManagement = course.id === "product-management";
  const isAgentOrchestration = course.id === "agent-orchestration";
  const isCreatorOps = course.id === "creator-ops";
  const duration = course.metaKey
    ? t(course.metaKey)
    : course.minutes == null
      ? t("cat.timeTbd")
      : `${course.minutes} ${t("cat.minutes")}`;
  const body = (
    <>
      <Cover id={course.id} hue={course.hue} />
      <div className="cbody catalog-course-body">
        {course.displayNumber ? (
          <span className="catalog-course-number">
            {t(`cat.course${course.displayNumber}`)}
          </span>
        ) : null}
        <div className="cmeta catalog-course-meta">
          <span className="ctag" style={{ color: course.hue, borderColor: course.hue }}>
            {t(course.topicKey)}
          </span>
          <span>{t(course.levelKey)}</span>
          <span aria-hidden="true">·</span>
          <span>{t(course.formatKey)}</span>
          <span aria-hidden="true">·</span>
          <span>{duration}</span>
          {isClaudeIncome && locale !== "en" ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{t("c.claude-income.contentLanguage")}</span>
            </>
          ) : null}
        </div>
        <h2>{t(course.titleKey)}</h2>
        <p>{t(course.blurbKey)}</p>
        <div className="cfoot catalog-course-footer">
          {available ? (
            <>
              <div className="cprog catalog-course-progress">
                <div
                  className="cbar"
                  role="progressbar"
                  aria-label={`${t(course.titleKey)}: ${t("cat.progress")}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                >
                  <span style={{ width: `${progress}%`, background: course.hue }} />
                </div>
                <span className="cpct">{progress}%</span>
              </div>
              <span className="cgo catalog-course-action" style={{ color: course.hue }}>
                {isAgentic ? t("cat.modules") : (
                  <>{actionLabel(progress, t)} <span className="arrow" aria-hidden="true">→</span></>
                )}
              </span>
            </>
          ) : (
            <span className="pill neutral catalog-course-status">{t("cat.soonBadge")}</span>
          )}
        </div>
      </div>
      {isPrompts ? (
        <aside className="prompt-course-contract" aria-label={t("cat.promptIncludes")}>
          <strong>{t("cat.promptIncludes")}</strong>
          <ul>
            <li>{t("cat.promptLessons")}</li>
            <li>{t("cat.promptFigures")}</li>
            <li>{t("cat.promptAssessment")}</li>
          </ul>
        </aside>
      ) : null}
    </>
  );

  const cardClass = [
    "ccard",
    "catalog-course-card",
    available ? "" : "soon catalog-course-card-upcoming",
    isPrompts ? "catalog-course-card-prompts" : "",
  ].filter(Boolean).join(" ");
  const anchorId = course.id === "agentic"
    ? "agentic-engineering"
    : isClaude
      ? "how-to-use-claude"
    : isCursor
      ? "how-to-use-cursor"
    : isGrok
      ? "how-to-use-grok"
    : isGithub
      ? "how-to-use-github"
    : isPrompts
      ? "how-to-write-prompts"
    : isSoftwareEngineering
      ? "software-engineering-with-agentic-ai"
    : isRag
      ? "retrieval-augmented-generation"
    : isMcp
      ? "model-context-protocol"
    : isClaudeIncome
      ? "how-to-make-money-with-claude"
    : isAiTutor
      ? "ai-tutor-learning-systems-engineering"
    : isProductManagement
      ? "product-management-in-the-age-of-ai"
    : isAgentOrchestration
      ? "agent-orchestration"
    : isCreatorOps
      ? "creator-ops"
      : undefined;

  if (!available) {
    return (
      <li id={anchorId} className={cardClass}>
        <div className="cinner catalog-course-disabled" aria-disabled="true">
          {body}
        </div>
      </li>
    );
  }

  if (isAgentic) {
    return (
      <li id={anchorId} className={`${cardClass} catalog-course-card-agentic`}>
        <div className="cinner catalog-agentic-shell">
          {body}
          <nav className="course-modules catalog-agentic-modules" aria-label={t("cat.modules")}>
            <h3>{t("cat.modules")}</h3>
            <ol>
              {COURSE_MODULES.map((module, index) => {
                const title = t(`track.${index + 1}.title`);
                const content = (
                  <>
                    <span className="module-index" aria-hidden="true">{index + 1}</span>
                    <span className="module-copy">
                      <strong>{title}</strong>
                      <span>{t(`track.${index + 1}.desc`)}</span>
                    </span>
                    <span className="module-action" aria-hidden="true">→</span>
                  </>
                );
                return (
                  <li key={module.id}>
                    {module.external ? (
                      <a
                        className="module-link"
                        href={module.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={title}
                      >
                        {content}
                      </a>
                    ) : (
                      <Link
                        className="module-link"
                        href={`/${locale}${module.href}`}
                        aria-label={title}
                      >
                        {content}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      </li>
    );
  }

  const href = course.external ? course.href : `/${locale}${course.href}`;
  return (
    <li id={anchorId} className={cardClass}>
      {course.external ? (
        <a className="cinner" href={href} target="_blank" rel="noopener noreferrer">
          {body}
        </a>
      ) : (
        <Link className="cinner" href={href}>{body}</Link>
      )}
    </li>
  );
}

export default function Catalog({ locale }: { locale: string }) {
  const { t } = useI18n();
  const progress = useCourseProgress();
  const searchId = useId();
  const topicId = useId();
  const levelId = useId();
  const statusId = useId();

  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<CatalogTopic | typeof ALL>(ALL);
  const [level, setLevel] = useState<Level | typeof ALL>(ALL);
  const [status, setStatus] = useState<Status | typeof ALL>(ALL);
  const [filtersReady, setFiltersReady] = useState(false);

  // Static export friendly: hydrate shareable filter state only in the browser.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const params = new URLSearchParams(window.location.search);
      setQuery(params.get("q") ?? "");
      setTopic(catalogTopicFromQuery(params.get("topic")));
      setLevel(levelFromQuery(params.get("level")));
      setStatus(statusFromQuery(params.get("status")));
      setFiltersReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!filtersReady) return;

    const url = new URL(window.location.href);
    const update = (key: string, value: string) => {
      if (value && value !== ALL) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    };
    update("q", query.trim());
    update("topic", topic);
    update("level", level);
    update("status", status);

    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [filtersReady, level, query, status, topic]);

  const topicOptions = useMemo(() => [
    { value: ALL, label: t("cat.all") },
    ...CATALOG_TOPICS.map((value) => ({
      value,
      label: t(CATALOG_COURSES.find((course) => course.topic === value)?.topicKey ?? value),
    })),
  ], [t]);

  const shown = useMemo(() => {
    const wanted = normalise(query, locale);
    return CATALOG_COURSES.filter((course) => {
      if (topic !== ALL && course.topic !== topic) return false;
      if (level !== ALL && !catalogCourseMatchesLevel(course, level)) return false;
      if (status !== ALL && course.status !== status) return false;
      if (!wanted) return true;

      const searchable = [
        t(course.titleKey),
        t(course.blurbKey),
        course.metaKey ? t(course.metaKey) : "",
        t(course.topicKey),
        t(course.levelKey),
        t(course.formatKey),
        course.id === "prompts" ? t("cat.promptIncludes") : "",
        course.id === "prompts" ? t("cat.promptLessons") : "",
        course.id === "prompts" ? t("cat.promptFigures") : "",
        course.id === "prompts" ? t("cat.promptAssessment") : "",
      ].join(" ");
      return normalise(searchable, locale).includes(wanted);
    }).sort((a, b) => Number(a.status === "soon") - Number(b.status === "soon"));
  }, [level, locale, query, status, t, topic]);

  const releasedCourses = shown.filter((course) => course.status === "available");
  const upcomingCourses = shown.filter((course) => course.status === "soon");

  const dirty = Boolean(query.trim()) || topic !== ALL || level !== ALL || status !== ALL;
  const reset = () => {
    setQuery("");
    setTopic(ALL);
    setLevel(ALL);
    setStatus(ALL);
  };

  return (
    <div className="shellwrap course-catalogue catalog-directory">
      <section className="sect catalogue-intro">
        <h1>{t("cat.title")}</h1>
        <p className="lede">{t("cat.lede")}</p>
      </section>

      <section className="catalog-controls" aria-labelledby="catalog-controls-title">
        <h2 id="catalog-controls-title" className="catalog-controls-title">
          {t("cat.filterTitle")}
        </h2>
        <form
          className="filters catalog-filters"
          role="search"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="filt catalog-filter catalog-search-field">
            <label htmlFor={searchId}>{t("cat.searchLabel")}</label>
            <input
              id={searchId}
              className="catalog-search-input"
              type="search"
              value={query}
              placeholder={t("cat.searchPlaceholder")}
              autoComplete="off"
              aria-controls={CATALOG_RESULTS_IDS}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <SelectFilter
            id={topicId}
            label={t("cat.filterTopic")}
            value={topic}
            onChange={(value) => setTopic(value as CatalogTopic | typeof ALL)}
            options={topicOptions}
          />
          <SelectFilter
            id={levelId}
            label={t("cat.filterLevel")}
            value={level}
            onChange={(value) => setLevel(value as Level | typeof ALL)}
            options={[
              { value: ALL, label: t("cat.all") },
              ...LEVELS.map((value) => ({ value, label: t(`level.${value}`) })),
            ]}
          />
          <SelectFilter
            id={statusId}
            label={t("cat.filterStatus")}
            value={status}
            onChange={(value) => setStatus(value as Status | typeof ALL)}
            options={[
              { value: ALL, label: t("cat.all") },
              ...STATUSES.map((value) => ({ value, label: t(`status.${value}`) })),
            ]}
          />
          <div className="filt-meta catalog-filter-summary">
            <span className="catalog-result-count" aria-live="polite" aria-atomic="true">
              {shown.length} {t(shown.length === 1 ? "cat.result" : "cat.results")}
            </span>
            {dirty ? (
              <button type="button" className="iconbtn catalog-reset" onClick={reset}>
                {t("cat.reset")}
              </button>
            ) : null}
          </div>
        </form>
      </section>

      {shown.length ? (
        <div className="catalog-course-sections">
          <section
            className="catalog-course-section catalog-released-courses"
            aria-labelledby="catalog-released-courses-title"
            hidden={releasedCourses.length === 0}
          >
            <h2 id="catalog-released-courses-title" className="catalog-course-section-title">
              {t("cat.availableBadge")}
            </h2>
            <ul className="ccards catalog-course-grid" id="catalog-course-results">
              {releasedCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  locale={locale}
                  progress={progress[course.id] ?? 0}
                />
              ))}
            </ul>
          </section>

          <section
            className="catalog-course-section catalog-coming-soon-courses"
            aria-labelledby="catalog-coming-soon-courses-title"
            hidden={upcomingCourses.length === 0}
          >
            <h2 id="catalog-coming-soon-courses-title" className="catalog-course-section-title">
              {t("cat.soonBadge")}
            </h2>
            <ul className="ccards catalog-course-grid" id="catalog-upcoming-course-results">
              {upcomingCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  locale={locale}
                  progress={progress[course.id] ?? 0}
                />
              ))}
            </ul>
          </section>
        </div>
      ) : (
        <>
          <div className="langnote catalog-empty" id="catalog-course-results">
            <p>{t("cat.none")}</p>
            <button type="button" className="iconbtn catalog-empty-reset" onClick={reset}>
              {t("cat.reset")}
            </button>
          </div>
          <span id="catalog-upcoming-course-results" hidden />
        </>
      )}
    </div>
  );
}
