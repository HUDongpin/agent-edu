"use client";

import { Fragment, type ReactNode } from "react";
import { useI18n } from "./I18nProvider";

/**
 * A translated sentence that carries emphasis and numbers.
 *
 * The Lab's teaching text is prose, not labels: it leans on a bold clause and
 * an italic aside, and it quotes running counts back at the reader. Splitting
 * those into separate keys and re-assembling them in JSX only works if every
 * language puts the pieces in the English order, which none of them do — so
 * the marker travels inside the string and the translator moves it.
 *
 *   **bold**  *italic*  {name}
 *
 * Deliberately nothing more. A translator editing one JSON line should never
 * have to think about markup, and a stray asterisk should render as itself
 * rather than eating the rest of the sentence.
 */

export type Vars = Record<string, string | number>;

const MARK = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;

function fill(text: string, vars?: Vars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in vars ? String(vars[name]) : whole);
}

export function rich(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let at = 0;
  MARK.lastIndex = 0;
  for (let m = MARK.exec(text); m; m = MARK.exec(text)) {
    if (m.index > at) out.push(text.slice(at, m.index));
    out.push(
      m[1] !== undefined
        ? <strong key={m.index}>{m[1]}</strong>
        : <em key={m.index}>{m[2]}</em>,
    );
    at = m.index + m[0].length;
  }
  if (at < text.length) out.push(text.slice(at));
  return out;
}

export default function Rich({ k, vars }: { k: string; vars?: Vars }) {
  const { t } = useI18n();
  return <Fragment>{rich(fill(t(k), vars))}</Fragment>;
}
