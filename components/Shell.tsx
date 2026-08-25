import Link from "next/link";
import Logo from "./Logo";
import LanguageMenu from "./LanguageMenu";
import ThemeToggle from "./ThemeToggle";
import MobileNav from "./MobileNav";
import NavLinks from "./NavLinks";
import { I18nProvider } from "./I18nProvider";
import { translator, type Messages } from "@/lib/i18n";
import type { ReactNode } from "react";

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

  const nav = [
    { href: p("/courses/"), key: "nav.courses" },
    { href: p("/#paths"), key: "nav.paths" },
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
            <LanguageMenu />
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
            <h2>{t("foot.explore")}</h2>
            <ul>
              <li><Link href={p("/courses/")}>{t("nav.courses")}</Link></li>
              <li><Link href={p("/#paths")}>{t("nav.paths")}</Link></li>
              <li><Link href={p("/courses/#agentic-engineering")}>{t("c.agentic.title")}</Link></li>
              <li><Link href={p("/codex/")}>{t("c.codex.title")}</Link></li>
              <li><Link href={p("/claude/")}>{t("c.claude.title")}</Link></li>
              <li><Link href={p("/cursor/")}>{t("c.cursor.title")}</Link></li>
              <li><Link href={p("/grok/")}>{t("c.grok.title")}</Link></li>
              <li><Link href={p("/github/")}>{t("c.github.title")}</Link></li>
              <li><Link href={p("/prompts/")}>{t("c.prompts.title")}</Link></li>
              <li><Link href={p("/software-engineering/")}>{t("c.softwareEngineering.title")}</Link></li>
              <li><Link href={p("/rag/")}>{t("c.rag.title")}</Link></li>
              <li><Link href={p("/mcp/")}>{t("c.mcp.title")}</Link></li>
              <li><Link href={p("/make-money-with-codex/")}>{t("c.make-money-with-codex.title")}</Link></li>
              <li><Link href={p("/claude-income/")}>{t("c.claude-income.title")}</Link></li>
              <li><Link href={p("/ai-tutor/")}>{t("c.ai-tutor.title")}</Link></li>
              <li><Link href={p("/product-management/")}>{t("c.product-management.title")}</Link></li>
              <li><Link href={p("/agent-orchestration/")}>{t("c.agent-orchestration.title")}</Link></li>
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
