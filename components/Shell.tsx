import Link from "next/link";
import Logo from "./Logo";
import LanguageMenu from "./LanguageMenu";
import ThemeToggle from "./ThemeToggle";
import MobileNav from "./MobileNav";
import NavLinks from "./NavLinks";
import { I18nProvider } from "./I18nProvider";
import { LOCALES, coverage, translator, type Messages } from "@/lib/i18n";
import type { ReactNode } from "react";

async function coverageMap(): Promise<Record<string, number>> {
  const en = (await import("@/messages/en.json")).default as Messages;
  const out: Record<string, number> = {};
  for (const l of LOCALES) {
    const own = (await import(`@/messages/${l.code}.json`)).default as Messages;
    out[l.code] = coverage(own, en);
  }
  return out;
}

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
  const cov = await coverageMap();
  const p = (path: string) => `/${locale}${path}`;

  const nav = [
    { href: p("/"), key: "nav.home" },
    { href: p("/courses/"), key: "nav.courses" },
    { href: p("/handbook/"), key: "nav.handbook" },
    { href: p("/lab/"), key: "nav.lab" },
    { href: p("/about/"), key: "nav.about" },
  ];

  return (
    <I18nProvider locale={locale} messages={messages}>
      <a className="skip" href="#main">{t("ui.skip")}</a>

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
            <NavLinks items={nav.map((n) => ({ href: n.href, label: t(n.key) }))} />
            <Link href={p("/teach/")}>
              {t("nav.teach")}
            </Link>
          </MobileNav>

          <div className="topacts">
            <LanguageMenu coverage={cov} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="main">{children}</main>

      <footer className="sitefoot">
        <div className="sitefoot-in">
          <div>
            <h2><span className="wm">aicourse.top</span></h2>
            <p>{t("brand.sub")}</p>
            <p className="muted">{t("foot.licence")}</p>
          </div>
          <div>
            <h2>{t("home.pathTitle")}</h2>
            <ul>
              <li><Link href={p("/courses/")}>{t("nav.courses")}</Link></li>
              <li><Link href={p("/about/")}>{t("nav.about")}</Link></li>
              <li><Link href={p("/teach/")}>{t("nav.teach")}</Link></li>
              <li><Link href={p("/handbook/")}>{t("track.1.title")}</Link></li>
              <li><Link href={p("/lab/")}>{t("track.2.title")}</Link></li>
              <li>
                <Link href={p("/build/")}>
                  {t("track.3.title")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h2>{t("nav.lang")}</h2>
            <p className="muted">{t("note.langHelp")}</p>
            <p>
              <a href="https://github.com/HUDongpin/agent-edu/tree/main/messages" rel="noopener">
                {t("foot.translate")}
              </a>
            </p>
          </div>
          <div>
            <h2>{t("foot.source")}</h2>
            <p><a href="https://github.com/HUDongpin/agent-edu" rel="noopener">github.com/HUDongpin/agent-edu</a></p>
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
