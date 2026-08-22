import { MENU } from "../cafe/menu";

export type LabRule = { c: string; n: string; s: "S" | "L" };

export const MAX_LAB_RULES = 32;
export const MAX_LAB_RULE_CONDITION_LENGTH = 160;

const DEFAULT_LAB_RULES: readonly LabRule[] = [
  { c: "large tea", n: "tea", s: "L" },
  { c: "tea", n: "tea", s: "S" },
];

export function freshLabRules(): LabRule[] {
  return DEFAULT_LAB_RULES.map((rule) => ({ ...rule }));
}

export function encodeLabRules(rules: readonly LabRule[]): string {
  return JSON.stringify(rules);
}

export function decodeLabRules(raw: string): LabRule[] | null {
  try {
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value) || value.length > MAX_LAB_RULES) return null;
    const decoded: LabRule[] = [];
    for (const candidate of value) {
      if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return null;
      const rule = candidate as Record<string, unknown>;
      if (
        Object.keys(rule).sort().join("\u0000") !== "c\u0000n\u0000s"
        || typeof rule.c !== "string"
        || !rule.c.trim()
        || rule.c.length > MAX_LAB_RULE_CONDITION_LENGTH
        || typeof rule.n !== "string"
        || !Object.prototype.hasOwnProperty.call(MENU, rule.n)
        || (rule.s !== "S" && rule.s !== "L")
      ) {
        return null;
      }
      decoded.push({ c: rule.c, n: rule.n, s: rule.s });
    }
    return decoded;
  } catch {
    return null;
  }
}
