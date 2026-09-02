import { formatDeterministicInteger } from "../deterministic-format";

export function formatGithubNumber(
  locale: string,
  value: number,
  options?: { readonly minimumIntegerDigits?: number },
): string {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError("GitHub number formatting requires a safe integer");
  }
  const minimumIntegerDigits = options?.minimumIntegerDigits ?? 1;
  if (!Number.isInteger(minimumIntegerDigits) || minimumIntegerDigits < 1) {
    throw new RangeError("GitHub minimumIntegerDigits must be a positive integer");
  }
  const sign = value < 0 ? "-" : "";
  const digits = String(Math.abs(value)).padStart(minimumIntegerDigits, "0");
  return sign + digits.replace(/[0-9]/g, (digit) =>
    formatDeterministicInteger(Number(digit), locale));
}

export function formatGithubPercent(locale: string, ratio: number): string {
  if (!Number.isFinite(ratio)) {
    throw new RangeError("GitHub percent formatting requires a finite ratio");
  }
  const value = formatGithubNumber(locale, Math.round(ratio * 100));
  return locale.toLowerCase().split("-")[0] === "ar"
    ? `${value}٪`
    : `${value}%`;
}

export function formatGithubVisibleNumbers(
  locale: string,
  text: string,
): string {
  return text.replace(/\d+/g, (token) =>
    formatGithubNumber(locale, Number(token)));
}

export function formatGithubDate(locale: string, isoDate: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate;
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}
