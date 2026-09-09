"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  readLearningState,
  readLearningStateOnServer,
  selectHandbookProgress,
  subscribeLearningState,
} from "@/lib/progress";
import { useI18n } from "../I18nProvider";

/**
 * Where the Handbook sends the reader afterwards.
 *
 * Across all eleven sections the frozen markup carries exactly one link to the
 * Lab and one to Part 3, and both sit inside §09 — one section before §10,
 * which is where the record decides the Handbook is finished and which offers
 * no way forward at all. So the offer arrived before the ending, was never
 * repeated, and a reader who resumed landed back in the game with nothing after
 * it.
 *
 * This sits outside the handbook entirely, in the wrapper React already owns,
 * for the reason the house rules give: markup.ts is byte-stable, its ids are
 * load-bearing, and its prose is generated, so the right place for a new offer
 * is the shell around it rather than a splice into a container mid-section.
 * Being outside also means it shows under every section instead of one.
 *
 * It reads the record only to choose its first line. `readLearningStateOnServer`
 * returns the empty record, so the server and a first visit get the quieter
 * wording, and nothing here depends on script having run.
 */
export default function Next() {
  const { t, locale } = useI18n();
  const state = useSyncExternalStore(
    subscribeLearningState,
    readLearningState,
    readLearningStateOnServer,
  );
  const finished = selectHandbookProgress(state).completed;

  return (
    <div className="shellwrap">
      <aside className="langnote" aria-label={t("handbook.nextLabel")}>
        <p style={{ margin: "0 0 10px" }}>
          {finished ? t("handbook.nextDone") : t("handbook.nextLede")}
        </p>
        <div className="acts">
          <Link className="btn primary" href={`/${locale}/lab/`}>
            {t("track.2.cta")}<span className="arrow" aria-hidden="true">→</span>
          </Link>
          <Link className="btn" href={`/${locale}/build/`}>
            {t("track.3.cta")}<span className="arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </aside>
    </div>
  );
}
