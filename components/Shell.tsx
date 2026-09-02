import Link from "next/link";
import Logo from "./Logo";
import LanguageMenu from "./LanguageMenu";
import ThemeToggle from "./ThemeToggle";
import MobileNav from "./MobileNav";
import NavLinks from "./NavLinks";
import RouteFocus from "./RouteFocus";
import ProgressRecencyTracker from "./ProgressRecencyTracker";
import ProgressAdaptersProvider from "./ProgressAdaptersProvider";
import CourseLocaleReturn from "./CourseLocaleReturn";
import { I18nProvider } from "./I18nProvider";
import { translator, type Messages } from "@/lib/i18n";
import { PUBLISHED_CATALOG_COURSES } from "@/lib/public-courses";
import {
  PUBLISHED_COURSE_SURFACES,
  contentLocaleForCourse,
  courseHrefFor,
  type CourseId,
} from "@/lib/release-surface";
import { Suspense, type ReactNode } from "react";

export default async function Shell({
  locale,
  messages,
  children,
}: {
  locale: string;
  messages: Messages;
  children: ReactNode;
}) {
  const t = translator(messages);
  const p = (path: string) => `/${locale}${path}`;

  const coursePrefixes = Array.from(new Set(
    PUBLISHED_COURSE_SURFACES.flatMap((surface) =>
      surface.routes.map((route) => p(`/${route.split("/")[0]}/`))),
  ));

  const nav = [
    { href: p("/courses/"), key: "nav.courses", activePrefixes: [p("/courses/"), ...coursePrefixes] },
    { href: p("/learning/"), key: "nav.learning", exact: true },
    { href: p("/#paths"), key: "nav.paths", exact: true },
    { href: p("/about/"), key: "nav.about", exact: true },
    { href: p("/teach/"), key: "nav.teach", exact: true },
  ];

  const footerCourses = PUBLISHED_CATALOG_COURSES.map(({ course }) => {
    const contentLocale = contentLocaleForCourse(course.id as CourseId, locale);
    const rawHref = courseHrefFor(course.id as CourseId, locale)!;
    const href = contentLocale && contentLocale !== locale
      ? `${rawHref}?fromLocale=${encodeURIComponent(locale)}`
      : rawHref;
    return { href, label: t(course.titleKey), id: course.id };
  });

  return (
    <I18nProvider locale={locale} messages={messages}>
      <a className="skip" href="#main" tabIndex={0}>{t("ui.skip")}</a>
      <RouteFocus />
      <ProgressRecencyTracker />

      <header className="topbar">
        <div className="topbar-in">
          <Link className="logo" href={p("/")}>
            <Logo />
            <span>
              <span className="wm">aicourse<i>.top</i></span>
              <span className="tagline">{t("brand.tag")}</span>
            </span>
          </Link>

          <MobileNav label={t("nav.menu")}>
            <NavLinks items={nav.map((n) => ({
              href: n.href,
              label: t(n.key),
              activePrefixes: "activePrefixes" in n ? n.activePrefixes : undefined,
              exact: "exact" in n ? n.exact : undefined,
            }))} />
          </MobileNav>

          <div className="topacts">
            <LanguageMenu />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <Suspense fallback={null}>
        <CourseLocaleReturn />
      </Suspense>
      <ProgressAdaptersProvider>
        <main id="main" tabIndex={-1}>{children}</main>
      </ProgressAdaptersProvider>

      <footer className="sitefoot">
        <div className="sitefoot-in">
          <div>
            <h2><span className="wm">aicourse.top</span></h2>
            <p>{t("brand.sub")}</p>
            <p className="muted">{t("foot.licence")}</p>
          </div>
          <div>
            <h2>{t("foot.explore")}</h2>
            <ul>
              <li><Link href={p("/courses/")}>{t("nav.courses")}</Link></li>
              <li><Link href={p("/learning/")}>{t("nav.learning")}</Link></li>
              <li><Link href={p("/#paths")}>{t("nav.paths")}</Link></li>
              {footerCourses.map((course) => (
                <li key={course.id}><Link href={course.href}>{course.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h2>{t("foot.learn")}</h2>
            <ul>
              <li><Link href={p("/handbook/")}>{t("track.1.title")}</Link></li>
              <li><Link href={p("/lab/")}>{t("track.2.title")}</Link></li>
              <li>
                <Link href={p("/build/")}>
                  {t("track.3.title")}
                </Link>
              </li>
              <li><Link href={p("/teach/")}>{t("nav.teach")}</Link></li>
            </ul>
          </div>
          <div>
            <h2>{t("foot.openTitle")}</h2>
            <ul>
              <li><Link href={p("/about/")}>{t("nav.about")}</Link></li>
              <li><Link href={p("/privacy/")}>{t("privacy.title")}</Link></li>
              <li>
              <a href="https://github.com/HUDongpin/agent-edu/tree/main/messages" rel="noopener">
                {t("foot.translate")}
              </a>
              </li>
              <li><a href="https://github.com/HUDongpin/agent-edu" rel="noopener">{t("foot.source")}</a></li>
            </ul>
            <p className="muted">
              {t("foot.built")} <a href="https://github.com/HUDongpin" rel="noopener">HU Dongpin</a>
            </p>
            <p className="muted">{t("foot.disclaim")}</p>
          </div>
        </div>
      </footer>
    </I18nProvider>
  );
}
