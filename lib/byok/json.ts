/**
 * Parse the object requested from a JSON-mode response.
 *
 * DeepSeek normally returns a bare object in JSON mode. The fence/object
 * recovery keeps the Lab tolerant of harmless presentation wrappers while
 * still rejecting prose, arrays and truncated objects as content failures.
 */
export function asJSON<T = unknown>(text: string): T {
  let value = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  if (!value.startsWith("{")) {
    const start = value.indexOf("{");
    const end = value.lastIndexOf("}");
    if (start < 0 || end <= start) throw new SyntaxError("Expected a complete JSON object.");
    value = value.slice(start, end + 1);
  }
  const parsed: unknown = JSON.parse(value);
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new SyntaxError("Expected a JSON object.");
  }
  return parsed as T;
}
