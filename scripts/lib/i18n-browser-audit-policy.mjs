export const NAME_REQUIRED_CONTROL_SELECTOR = [
  "button",
  "a[href]",
  "input:not([type='hidden'])",
  "select",
  "textarea",
  "[role='button']",
  "[role='link']",
  "[role='checkbox']",
  "[role='radio']",
  "[role='switch']",
  "[role='tab']",
  "[role='menuitem']",
  "[role='menuitemcheckbox']",
  "[role='menuitemradio']",
  "[role='option']",
  "[role='slider']",
  "[role='spinbutton']",
  "[role='combobox']",
  "[role='searchbox']",
  "[role='textbox']",
  "[role='progressbar']",
  "img:not([alt])",
  "svg[role='img']",
].join(",");

const RAW_RENDERED_KEY = /^(?:(?:ui|nav|course|hb|w)\.[A-Za-z0-9_.-]{2,}|undefined|null)$/;
const ACCEPTED_TRUNCATION_CONTRACTS = new Set([
  "breadcrumb-current",
  "lesson-teaser",
]);

function normalize(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

export function rawRenderedKeys(values) {
  return [...new Set(values.map(normalize).filter((value) => RAW_RENDERED_KEY.test(value)))].sort();
}

export function translationSegmentRequiresComparison(segment, locale) {
  if (!segment || !normalize(segment.text) || !locale || segment.auditExempt === true) return false;
  return !segment.lang || segment.lang === locale;
}

export function isExpectedNextRscAbort(failure) {
  if (
    failure?.method !== "GET"
    || failure?.failure !== "net::ERR_ABORTED"
    || typeof failure?.url !== "string"
  ) return false;
  try {
    const url = new URL(failure.url);
    return url.searchParams.has("_rsc") && /\/__next(?:\.[^/]+)+\.txt$/.test(url.pathname);
  } catch {
    return false;
  }
}

export function partitionGeometryFindings(geometry) {
  const fail = [];
  const review = [];
  const accepted = [];
  for (const entry of geometry ?? []) {
    if (entry.documentOverflow) {
      fail.push({
        viewport: entry.viewport,
        documentOverflow: true,
        scrollWidth: entry.scrollWidth,
        innerWidth: entry.innerWidth,
        overflowing: entry.overflowing ?? [],
      });
    }
    for (const clipped of entry.clipped ?? []) {
      const finding = { viewport: entry.viewport, ...clipped };
      if (
        clipped.intentional === true
        && ACCEPTED_TRUNCATION_CONTRACTS.has(clipped.truncationContract)
      ) accepted.push(finding);
      else if (clipped.intentional === true) review.push(finding);
      else fail.push(finding);
    }
  }
  return { fail, review, accepted };
}
