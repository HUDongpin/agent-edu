"use client";

import { useSyncExternalStore } from "react";
import ErrorSurface from "@/components/ErrorSurface";
import {
  GLOBAL_ERROR_COPY,
  errorDirection,
  errorLocaleFromPathname,
  type ErrorLocale,
} from "@/lib/error-copy";
import "./globals.css";

type Theme = "light" | "dark";

const subscribeToStaticBrowserState = () => () => {};

function browserLocale(): ErrorLocale {
  return errorLocaleFromPathname(window.location.pathname);
}

function serverLocale(): ErrorLocale {
  return "en";
}

function browserTheme(): Theme | undefined {
  try {
    const savedTheme = window.localStorage.getItem("ae.theme");
    return savedTheme === "light" || savedTheme === "dark" ? savedTheme : undefined;
  } catch {
    // Recovery must keep working when storage is blocked or unavailable.
    return undefined;
  }
}

function serverTheme(): undefined {
  return undefined;
}

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const locale = useSyncExternalStore(
    subscribeToStaticBrowserState,
    browserLocale,
    serverLocale,
  );
  const theme = useSyncExternalStore(
    subscribeToStaticBrowserState,
    browserTheme,
    serverTheme,
  );

  const copy = GLOBAL_ERROR_COPY[locale];
  const homeHref = `/${locale}/`;

  return (
    <html lang={locale} dir={errorDirection(locale)} data-theme={theme}>
      <head>
        <title>{copy.title} · aicourse.top</title>
        <meta name="color-scheme" content="light dark" />
      </head>
      <body>
        <main id="main" className="globalErrorMain">
          <ErrorSurface
            eyebrow={copy.eyebrow}
            title={copy.title}
            body={copy.body}
            retryLabel={copy.retry}
            onRetry={retry}
            homeLabel={copy.home}
            homeHref={homeHref}
            coursesLabel={copy.courses}
            coursesHref={`${homeHref}courses/`}
            referenceLabel={copy.reference}
            reference={error.digest}
            alert
            focusKey={`${locale}:${error.digest ?? "unknown"}`}
          />
        </main>
      </body>
    </html>
  );
}
