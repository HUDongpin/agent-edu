"use client";

import { useSyncExternalStore } from "react";
import { useI18n } from "./I18nProvider";

/**
 * Light and dark.
 *
 * The button used to be a single ◐ labelled "Theme", which says what it is
 * about but not what pressing it does. It now shows the theme you would get
 * and says so — the only version that reads correctly whether the current
 * theme came from a saved choice or from the operating system.
 *
 * The state is subscribed to rather than read in an effect, because it has
 * two sources: the attribute this button sets, and the OS preference for a
 * reader who has never pressed it. Both can change while the page is open.
 */

const watchers = new Set<() => void>();

function subscribe(fn: () => void): () => void {
  watchers.add(fn);
  const mq = matchMedia("(prefers-color-scheme:dark)");
  mq.addEventListener("change", fn);
  return () => {
    watchers.delete(fn);
    mq.removeEventListener("change", fn);
  };
}

function isDark(): boolean {
  const set = document.documentElement.getAttribute("data-theme");
  return set ? set === "dark" : matchMedia("(prefers-color-scheme:dark)").matches;
}

/* The server cannot know, and must not guess: rendering "dark" to a reader in
   light mode would flip the glyph on hydration. Null renders the neutral ◐. */
function onServer(): null { return null; }

export default function ThemeToggle() {
  const { t } = useI18n();
  const dark = useSyncExternalStore<boolean | null>(subscribe, isDark, onServer);
  const label = dark === null ? t("nav.theme") : dark ? t("nav.themeLight") : t("nav.themeDark");

  return (
    <button
      className="iconbtn themebtn"
      type="button"
      aria-label={label}
      title={label}
      onClick={() => {
        const next = dark ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        try {
          localStorage.setItem("ae.theme", next);
        } catch {
          /* private browsing: the choice just won't persist */
        }
        for (const fn of watchers) fn();
      }}
    >
      <span aria-hidden="true">{dark === null ? "◐" : dark ? "☀" : "☾"}</span>
    </button>
  );
}
