export function formatGithubNumber(
  locale: string,
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatGithubVisibleNumbers(
  locale: string,
  text: string,
): string {
  const formatter = new Intl.NumberFormat(locale, { useGrouping: false });
  return text.replace(/\d+/g, (token) => formatter.format(Number(token)));
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
