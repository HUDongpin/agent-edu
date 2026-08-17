import type { Metadata } from "next";
import Shell from "@/components/Shell";
import { LOCALE_CODES, getMessages, metaFor, translator } from "@/lib/i18n";
import type { ReactNode } from "react";

export function generateStaticParams() {
  return LOCALE_CODES.map((locale) => ({ locale }));
}

export const dynamicParams = false;

const SITE = "https://aicourse.top";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await params;
  const t = translator(await getMessages(locale));

  /* hreflang for every locale. This is the whole reason the site moved to
     per-locale URLs: with one shared URL, search engines only ever indexed
     the English copy. */
  const languages: Record<string, string> = {};
  for (const code of LOCALE_CODES) languages[code] = `${SITE}/${code}/`;
  languages["x-default"] = `${SITE}/en/`;

  return {
    metadataBase: new URL(SITE),
    title: `${t("brand.name")} — ${t("brand.tag")}`,
    description: t("home.lede"),
    alternates: { canonical: `${SITE}/${locale}/`, languages },
    openGraph: {
      type: "website",
      siteName: t("brand.name"),
      title: `${t("brand.name")} — ${t("brand.tag")}`,
      description: t("brand.sub"),
      url: `${SITE}/${locale}/`,
      locale,
      images: [{ url: "/docs/og-card.png", width: 2400, height: 1260 }],
    },
    twitter: { card: "summary_large_image", images: ["/docs/og-card.png"] },
    icons: { icon: "/logo.svg" },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages(locale);
  const meta = metaFor(locale);

  return (
    <html lang={locale} dir={meta.dir} suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        {/* Applied before paint so a dark-mode reader never sees a white flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              `try{var t=localStorage.getItem("ae.theme");` +
              `if(t)document.documentElement.setAttribute("data-theme",t);}catch(e){}`,
          }}
        />
      </head>
      <body>
        <Shell locale={locale} messages={messages}>
          {children}
        </Shell>
      </body>
    </html>
  );
}
