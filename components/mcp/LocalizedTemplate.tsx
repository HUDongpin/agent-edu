import { Fragment } from "react";

type TemplateValue = string | number;

export default function LocalizedTemplate({
  template,
  values,
  isolate,
}: {
  template: string;
  values: Readonly<Record<string, TemplateValue>>;
  isolate?: Readonly<Record<string, "ltr" | "rtl" | "auto">>;
}) {
  const pattern = /\{([A-Za-z][A-Za-z0-9]*)\}/g;
  const segments: Array<{ text: string } | { key: string; value: TemplateValue }> = [];
  let cursor = 0;
  for (const match of template.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > cursor) segments.push({ text: template.slice(cursor, index) });
    const key = match[1];
    segments.push(Object.prototype.hasOwnProperty.call(values, key)
      ? { key, value: values[key] }
      : { text: match[0] });
    cursor = index + match[0].length;
  }
  if (cursor < template.length) segments.push({ text: template.slice(cursor) });

  return segments.map((segment, index) => {
    if ("text" in segment) return <Fragment key={index}>{segment.text}</Fragment>;
    const direction = isolate?.[segment.key];
    return direction ? (
      <bdi key={`${segment.key}-${index}`} dir={direction} translate="no">
        {segment.value}
      </bdi>
    ) : (
      <Fragment key={`${segment.key}-${index}`}>{segment.value}</Fragment>
    );
  });
}
