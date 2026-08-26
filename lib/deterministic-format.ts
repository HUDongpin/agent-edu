const ARABIC_INDIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"] as const;

/**
 * Format a hydration-facing integer without relying on runtime ICU data.
 * Arabic language tags use Arabic-Indic digits; every other language uses
 * ungrouped ASCII digits. The same input therefore produces byte-identical
 * text in Node and every browser engine.
 */
export function formatDeterministicInteger(value: number, locale: string): string {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError("Deterministic integer formatting requires a safe integer");
  }

  const ascii = String(value);
  const language = locale.toLowerCase().split("-")[0];
  if (language !== "ar") return ascii;
  return ascii.replace(/[0-9]/g, (digit) => ARABIC_INDIC_DIGITS[Number(digit)]);
}
