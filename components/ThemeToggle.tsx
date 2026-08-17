"use client";

import { useI18n } from "./I18nProvider";

export default function ThemeToggle() {
  const { t } = useI18n();
  return (
    <button
      className="iconbtn"
      type="button"
      aria-label={t("nav.theme")}
      onClick={() => {
        const el = document.documentElement;
        const cur = el.getAttribute("data-theme");
        const dark = cur ? cur === "dark" : matchMedia("(prefers-color-scheme:dark)").matches;
        const next = dark ? "light" : "dark";
        el.setAttribute("data-theme", next);
        try {
          localStorage.setItem("ae.theme", next);
        } catch {
          /* private browsing: the choice just won't persist */
        }
      }}
    >
      ◐
    </button>
  );
}
