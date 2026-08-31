"use client";

import Link from "next/link";
import { Fragment, useEffect, useId, useMemo, useState } from "react";
import Cover from "./Cover";
import styles from "./Catalog.module.css";
import { useI18n } from "../I18nProvider";
import {
  CATALOG_COURSE_RELEASES,
  CATALOG_TOPICS,
  COURSE_MODULES,
  LEVELS,
  STATUSES,
  catalogCourseMatchesLevel,
  type CatalogCourse,
  type CatalogTopic,
  type Level,
  type Status,
} from "@/lib/public-courses";
import {
  publicCourseHrefFor as courseHrefFor,
  withPublicCourseReturnLocale,
  type PublicContentLocale as ContentLocale,
  type PublicCourseId as CourseId,
  type PublicPublicationState as PublicationStatus,
} from "@/lib/public-release-surface";
import type { ProgressSummaryState } from "@/lib/public-progress-contract";

const ALL = "__all__";
const CATALOG_RESULTS_IDS = "catalog-course-results catalog-upcoming-course-results";

type CatalogProgress = {
  readonly state: ProgressSummaryState;
  readonly percent: number | null;
  readonly nextHref: string | null;
};

type ProgressMap = Record<string, CatalogProgress>;
type DirectoryCourse = CatalogCourse & {
  readonly publicationState: PublicationStatus;
  readonly targetHref: string | null;
  readonly contentLocale: ContentLocale | null;
  readonly requestedContentLocale: ContentLocale | null;
  readonly interfaceLocales: readonly ContentLocale[];
  readonly reviewedContentLocales: readonly ContentLocale[];
  readonly fallbackLocale: ContentLocale | null;
  readonly usesFallback: boolean;
};

type LanguageMeta = {
  readonly native: string;
  readonly dir: "ltr" | "rtl";
};

const LANGUAGE_META: Readonly<Record<ContentLocale, LanguageMeta>> = {
  en: { native: "English", dir: "ltr" },
  es: { native: "Español", dir: "ltr" },
  fr: { native: "Français", dir: "ltr" },
  de: { native: "Deutsch", dir: "ltr" },
  "zh-Hans": { native: "简体中文", dir: "ltr" },
  "zh-Hant": { native: "繁體中文", dir: "ltr" },
  ja: { native: "日本語", dir: "ltr" },
  ko: { native: "한국어", dir: "ltr" },
  ar: { native: "العربية", dir: "rtl" },
};

const CONTENT_LOCALES = Object.keys(LANGUAGE_META) as readonly ContentLocale[];

function unavailablePublishedProgressMap(): ProgressMap {
  return Object.fromEntries(
    CATALOG_COURSE_RELEASES
      .filter(({ surface }) => surface.state === "published")
      .map(({ course }) => [course.id, {
        state: "unavailable" as const,
        percent: null,
        nextHref: null,
      }]),
  );
}

function isContentLocale(value: string | null): value is ContentLocale {
  return Boolean(value && CONTENT_LOCALES.includes(value as ContentLocale));
}

export function catalogLanguageFromQuery(
  value: string | null,
  reviewedLocales: readonly ContentLocale[],
): ContentLocale | typeof ALL {
  return isContentLocale(value) && reviewedLocales.includes(value) ? value : ALL;
}

export function catalogContentLocaleFor(
  reviewedLocales: readonly ContentLocale[],
  fallbackLocale: ContentLocale | null,
  requestedLocale: string,
): ContentLocale | null {
  if (isContentLocale(requestedLocale) && reviewedLocales.includes(requestedLocale)) {
    return requestedLocale;
  }
  return fallbackLocale && reviewedLocales.includes(fallbackLocale) ? fallbackLocale : null;
}

type TemplateValue = {
  readonly text: string;
  readonly locale: ContentLocale;
};

function LanguageTemplate({
  template,
  values,
}: {
  template: string;
  values: Readonly<Record<string, TemplateValue>>;
}) {
  return template.split(/(\{[A-Za-z]+\})/u).map((part, index) => {
    const key = /^\{([A-Za-z]+)\}$/u.exec(part)?.[1];
    const value = key ? values[key] : undefined;
    if (!value) return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
    const meta = LANGUAGE_META[value.locale];
    return (
      <bdi key={`${key}-${index}`} lang={value.locale} dir={meta.dir}>
        {value.text}
      </bdi>
    );
  });
}

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
function useCourseProgress(locale: string): ProgressMap {
  const [map, setMap] = useState<ProgressMap>({});

  useEffect(() => {
    let cancelled = false;
    let removeListeners = () => {};
    void import("../progress-adapters")
      .then(({ createPublishedProgressAdapters }) => {
        if (cancelled) return;
        const adapters = createPublishedProgressAdapters(locale);
        const read = () => {
          // Begin fail-closed so a partial/empty factory cannot leave one
          // published card looking as if its progress were still loading.
          const next = unavailablePublishedProgressMap();
          for (const adapter of adapters) {
            try {
              const summary = adapter.readSummary();
              if (summary.state === "unavailable") {
                next[adapter.courseId] = {
                  state: "unavailable",
                  percent: null,
                  nextHref: null,
                };
                continue;
              }
              next[adapter.courseId] = summary;
            } catch {
              next[adapter.courseId] = {
                state: "unavailable",
                percent: null,
                nextHref: null,
              };
            }
          }
          if (!cancelled) setMap(next);
        };

        read();
        const progressEvents = new Set(adapters.map((adapter) => adapter.progressEvent));
        window.addEventListener("focus", read);
        window.addEventListener("storage", read);
        for (const event of progressEvents) window.addEventListener(event, read);
        removeListeners = () => {
          window.removeEventListener("focus", read);
          window.removeEventListener("storage", read);
          for (const event of progressEvents) window.removeEventListener(event, read);
        };
      })
      .catch(() => {
        if (cancelled) return;
        setMap(unavailablePublishedProgressMap());
        removeListeners = () => {
          // The module never loaded, so no listeners were installed.
        };
      });
    return () => {
      cancelled = true;
      removeListeners();
    };
  }, [locale]);

  return map;
}

function actionKey(
  progress: CatalogProgress | undefined,
): "cat.startIn" | "cat.resumeIn" | "cat.finishIn" | "cat.reviewIn" {
  if (progress?.state === "completed") return "cat.reviewIn";
  if (
    progress?.state === "in-progress"
    && progress.percent !== null
    && progress.percent >= 100
  ) return "cat.finishIn";
  if (progress?.state === "in-progress") return "cat.resumeIn";
  return "cat.startIn";
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
  options: readonly {
    value: string;
    label: string;
    lang?: string;
    dir?: "ltr" | "rtl";
  }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className={`filt catalog-filter ${styles.filterControl}`}>
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-controls={CATALOG_RESULTS_IDS}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            lang={option.lang}
            dir={option.dir}
          >
            {option.label}
          </option>
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
  course: DirectoryCourse;
  locale: string;
  progress?: CatalogProgress;
}) {
  const { t } = useI18n();
  const available = course.publicationState === "published" && Boolean(course.targetHref);
  const progressPending = available && progress === undefined;
  const progressUnavailable = progress?.state === "unavailable";
  const progressPercent = progress && !progressUnavailable ? progress.percent : null;
  const contentLanguage = course.contentLocale
    ? LANGUAGE_META[course.contentLocale]
    : null;
  const requestedLanguage = course.requestedContentLocale
    ? LANGUAGE_META[course.requestedContentLocale]
    : null;
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
  const duration = course.metaKey
    ? t(course.metaKey)
    : course.minutes == null
      ? t("cat.timeTbd")
      : `${course.minutes} ${t("cat.minutes")}`;
  const body = (
    <>
      <Cover id={course.id} hue={course.hue} />
      <div className={`cbody catalog-course-body ${styles.courseBody}`}>
        {course.displayNumber ? (
          <span className="catalog-course-number">
            {t(`cat.course${course.displayNumber}`)}
          </span>
        ) : null}
        <div className={`cmeta catalog-course-meta ${styles.courseMeta}`}>
          <span className="ctag" style={{ color: course.hue, borderColor: course.hue }}>
            {t(course.topicKey)}
          </span>
          <span>{t(course.levelKey)}</span>
          <span aria-hidden="true">·</span>
          <span>{t(course.formatKey)}</span>
          <span aria-hidden="true">·</span>
          <span>{duration}</span>
        </div>
        {course.contentLocale && contentLanguage ? (
          <div
            className={styles.languageContract}
            data-course-content-language={course.contentLocale}
            data-course-reviewed-languages={course.reviewedContentLocales.join(",")}
          >
            <p className={styles.languageLine}>
              <LanguageTemplate
                template={t("cat.contentLanguage")}
                values={{
                  language: {
                    text: contentLanguage.native,
                    locale: course.contentLocale,
                  },
                }}
              />
            </p>
            {course.usesFallback && course.requestedContentLocale && requestedLanguage ? (
              <p className={styles.fallbackNotice} data-course-language-fallback="true">
                <LanguageTemplate
                  template={t("cat.fallbackNotice")}
                  values={{
                    interfaceLanguage: {
                      text: requestedLanguage.native,
                      locale: course.requestedContentLocale,
                    },
                    contentLanguage: {
                      text: contentLanguage.native,
                      locale: course.contentLocale,
                    },
                  }}
                />
              </p>
            ) : null}
          </div>
        ) : null}
        <h2>{t(course.titleKey)}</h2>
        <p>{t(course.blurbKey)}</p>
        <div className={`cfoot catalog-course-footer ${styles.courseFooter}`}>
          {available ? (
            <>
              {progressPending ? (
                <span className="catalog-progress-pending" role="status" aria-live="polite">
                  {t("ui.loading")}
                </span>
              ) : progressUnavailable ? (
                <span className="catalog-progress-unavailable" role="status">
                  {t("progress.storageUnavailable")}
                </span>
              ) : progressPercent !== null ? (
                <div className="cprog catalog-course-progress">
                  <div
                    className="cbar"
                    role="progressbar"
                    aria-label={`${t(course.titleKey)}: ${t("cat.progress")}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progressPercent}
                  >
                    <span style={{ width: `${progressPercent}%`, background: course.hue }} />
                  </div>
                  <span className="cpct">{progressPercent}%</span>
                </div>
              ) : null}
              {course.contentLocale && contentLanguage ? (
                isAgentic && course.targetHref ? (
                  <Link
                    className={`cgo catalog-course-action ${styles.action}`}
                    href={course.targetHref}
                    hrefLang={course.contentLocale}
                    style={{ color: course.hue }}
                  >
                    <LanguageTemplate
                      template={t(actionKey(progress))}
                      values={{
                        language: {
                          text: contentLanguage.native,
                          locale: course.contentLocale,
                        },
                      }}
                    />
                    <span className="arrow" aria-hidden="true">→</span>
                  </Link>
                ) : (
                  <span
                    className={`cgo catalog-course-action ${styles.action}`}
                    style={{ color: course.hue }}
                  >
                    <LanguageTemplate
                      template={t(actionKey(progress))}
                      values={{
                        language: {
                          text: contentLanguage.native,
                          locale: course.contentLocale,
                        },
                      }}
                    />
                    <span className="arrow" aria-hidden="true">→</span>
                  </span>
                )
              ) : null}
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
    styles.courseCard,
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
      : undefined;

  if (!available) {
    return (
      <li
        id={anchorId}
        className={cardClass}
        data-course-id={course.id}
        data-course-interface-locales={course.interfaceLocales.join(",")}
      >
        <div className="cinner catalog-course-disabled" aria-disabled="true">
          {body}
        </div>
      </li>
    );
  }

  if (isAgentic) {
    return (
      <li
        id={anchorId}
        className={`${cardClass} catalog-course-card-agentic`}
        data-course-id={course.id}
        data-course-interface-locales={course.interfaceLocales.join(",")}
      >
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
                        className={`module-link ${styles.moduleLink}`}
                        href={module.href}
                        hrefLang={course.contentLocale ?? undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={title}
                      >
                        {content}
                      </a>
                    ) : (
                      <Link
                        className={`module-link ${styles.moduleLink}`}
                        href={withPublicCourseReturnLocale(
                          `/${course.contentLocale ?? locale}${module.href}`,
                          locale,
                        )}
                        hrefLang={course.contentLocale ?? undefined}
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

  const resumeHref = progress?.state !== "unavailable"
    && progress?.nextHref
    && (isRag || (progressPercent !== null && progressPercent > 0))
    ? withPublicCourseReturnLocale(progress.nextHref, locale)
    : null;
  const href = resumeHref ?? course.targetHref ?? "#";
  return (
    <li
      id={anchorId}
      className={cardClass}
      data-course-id={course.id}
      data-course-interface-locales={course.interfaceLocales.join(",")}
    >
      {course.external ? (
        <a
          className="cinner"
          href={href}
          hrefLang={course.contentLocale ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
        >
          {body}
        </a>
      ) : (
        <Link className="cinner" href={href} hrefLang={course.contentLocale ?? undefined}>
          {body}
        </Link>
      )}
    </li>
  );
}

export default function Catalog({ locale }: { locale: string }) {
  const { t } = useI18n();
  const progress = useCourseProgress(locale);
  const searchId = useId();
  const topicId = useId();
  const levelId = useId();
  const statusId = useId();
  const languageId = useId();

  const reviewedCatalogLocales = useMemo<readonly ContentLocale[]>(() =>
    CONTENT_LOCALES.filter((candidate) => CATALOG_COURSE_RELEASES.some(
      ({ surface }) => surface.reviewedContentLocales.includes(candidate),
    )), []);

  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<CatalogTopic | typeof ALL>(ALL);
  const [level, setLevel] = useState<Level | typeof ALL>(ALL);
  const [status, setStatus] = useState<Status | typeof ALL>(ALL);
  const [language, setLanguage] = useState<ContentLocale | typeof ALL>(ALL);
  const [filtersReady, setFiltersReady] = useState(false);

  const directoryCourses = useMemo<readonly DirectoryCourse[]>(() =>
    CATALOG_COURSE_RELEASES.map(({ course, surface }) => {
        const requestedContentLocale = language !== ALL
          ? language
          : isContentLocale(locale)
            ? locale
            : surface.fallbackLocale;
        const contentLocale = requestedContentLocale
          ? catalogContentLocaleFor(
              surface.reviewedContentLocales,
              surface.fallbackLocale,
              requestedContentLocale,
            )
          : null;
        const rawHref = requestedContentLocale
          ? courseHrefFor(course.id as CourseId, requestedContentLocale)
          : null;
        return {
          ...course,
          status: surface.state === "published" ? "available" : "soon",
          publicationState: surface.state,
          interfaceLocales: surface.interfaceLocales,
          reviewedContentLocales: surface.reviewedContentLocales,
          fallbackLocale: surface.fallbackLocale,
          requestedContentLocale,
          contentLocale,
          usesFallback: Boolean(
            contentLocale && requestedContentLocale && contentLocale !== requestedContentLocale,
          ),
          targetHref: rawHref && contentLocale
            ? withPublicCourseReturnLocale(rawHref, locale)
            : null,
        } satisfies DirectoryCourse;
      })
      // Keep the registry map as the auditable source, then fail closed for a
      // shell locale the record does not explicitly support.
      .filter((course) => course.interfaceLocales.includes(locale as ContentLocale)),
  [language, locale]);

  // Static export friendly: hydrate shareable filter state only in the browser.
  useEffect(() => {
    const readFilters = () => {
      const params = new URLSearchParams(window.location.search);
      setQuery(params.get("q") ?? "");
      setTopic(catalogTopicFromQuery(params.get("topic")));
      setLevel(levelFromQuery(params.get("level")));
      setStatus(statusFromQuery(params.get("status")));
      setLanguage(catalogLanguageFromQuery(params.get("language"), reviewedCatalogLocales));
      setFiltersReady(true);
    };
    const frame = window.requestAnimationFrame(readFilters);
    window.addEventListener("popstate", readFilters);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("popstate", readFilters);
    };
  }, [reviewedCatalogLocales]);

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
    update("language", language);

    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [filtersReady, language, level, query, status, topic]);

  const topicOptions = useMemo(() => [
    { value: ALL, label: t("cat.all") },
    ...CATALOG_TOPICS.map((value) => ({
      value,
      label: t(directoryCourses.find((course) => course.topic === value)?.topicKey ?? value),
    })),
  ], [directoryCourses, t]);

  const shown = useMemo(() => {
    const wanted = normalise(query, locale);
    return directoryCourses.filter((course) => {
      if (topic !== ALL && course.topic !== topic) return false;
      if (level !== ALL && !catalogCourseMatchesLevel(course, level)) return false;
      if (status !== ALL && course.status !== status) return false;
      if (language !== ALL && !course.reviewedContentLocales.includes(language)) return false;
      if (!wanted) return true;

      const searchable = [
        t(course.titleKey),
        t(course.blurbKey),
        course.metaKey ? t(course.metaKey) : "",
        t(course.topicKey),
        t(course.levelKey),
        t(course.formatKey),
        ...course.reviewedContentLocales.map((courseLocale) => LANGUAGE_META[courseLocale].native),
        course.id === "prompts" ? t("cat.promptIncludes") : "",
        course.id === "prompts" ? t("cat.promptLessons") : "",
        course.id === "prompts" ? t("cat.promptFigures") : "",
        course.id === "prompts" ? t("cat.promptAssessment") : "",
      ].join(" ");
      return normalise(searchable, locale).includes(wanted);
    }).sort((a, b) => Number(a.status === "soon") - Number(b.status === "soon"));
  }, [directoryCourses, language, level, locale, query, status, t, topic]);

  const releasedCourses = shown.filter((course) => course.status === "available");
  const upcomingCourses = shown.filter((course) => course.status === "soon");

  const dirty = Boolean(query.trim())
    || topic !== ALL
    || level !== ALL
    || status !== ALL
    || language !== ALL;
  const reset = () => {
    setQuery("");
    setTopic(ALL);
    setLevel(ALL);
    setStatus(ALL);
    setLanguage(ALL);
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
          className={`filters catalog-filters ${styles.controlsGrid}`}
          role="search"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className={`filt catalog-filter catalog-search-field ${styles.filterControl}`}>
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
          <SelectFilter
            id={languageId}
            label={t("cat.filterLanguage")}
            value={language}
            onChange={(value) => setLanguage(value as ContentLocale | typeof ALL)}
            options={[
              { value: ALL, label: t("cat.allLanguages") },
              ...reviewedCatalogLocales.map((value) => ({
                value,
                label: LANGUAGE_META[value].native,
                lang: value,
                dir: LANGUAGE_META[value].dir,
              })),
            ]}
          />
          <div className="filt-meta catalog-filter-summary">
            <span className="catalog-result-count" aria-live="polite" aria-atomic="true">
              {shown.length} {t(shown.length === 1 ? "cat.result" : "cat.results")}
            </span>
            {dirty ? (
              <button
                type="button"
                className={`iconbtn catalog-reset ${styles.resetButton}`}
                onClick={reset}
              >
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
                  progress={progress[course.id]}
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
                  progress={progress[course.id]}
                />
              ))}
            </ul>
          </section>
        </div>
      ) : (
        <>
          <div className="langnote catalog-empty" id="catalog-course-results">
            <p>{t("cat.none")}</p>
            <button
              type="button"
              className={`iconbtn catalog-empty-reset ${styles.emptyReset}`}
              onClick={reset}
            >
              {t("cat.reset")}
            </button>
          </div>
          <span id="catalog-upcoming-course-results" hidden />
        </>
      )}
    </div>
  );
}
