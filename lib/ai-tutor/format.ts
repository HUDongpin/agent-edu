export type AiTutorMessageValue = string | number;

/**
 * Interpolate complete, locale-owned messages without assembling translated
 * sentence fragments in components. Missing and unused placeholders fail
 * closed so a future translation cannot silently drop instructional context.
 */
export function formatAiTutorMessage(
  template: string,
  values: Readonly<Record<string, AiTutorMessageValue>>,
): string {
  const used = new Set<string>();
  const formatted = template.replace(/\{([A-Za-z][A-Za-z0-9]*)\}/g, (_match, key: string) => {
    if (!(key in values)) throw new Error(`Missing AI Tutor message value: ${key}`);
    used.add(key);
    return String(values[key]);
  });
  for (const key of Object.keys(values)) {
    if (!used.has(key)) throw new Error(`Unused AI Tutor message value: ${key}`);
  }
  return formatted;
}
