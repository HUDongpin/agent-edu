import { Fragment, type ReactNode } from "react";

export default function LocalizedTemplate({
  template,
  values,
}: {
  readonly template: string;
  readonly values: Readonly<Record<string, ReactNode>>;
}) {
  return template.split(/(\{[^}]+\})/g).filter(Boolean).map((part, index) => {
    const match = /^\{([^}]+)\}$/.exec(part);
    if (!match || !Object.prototype.hasOwnProperty.call(values, match[1])) {
      return <Fragment key={`copy-${index}`}>{part}</Fragment>;
    }
    return <Fragment key={`${match[1]}-${index}`}>{values[match[1]]}</Fragment>;
  });
}
