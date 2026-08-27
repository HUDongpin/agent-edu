import type { Metadata, Viewport } from "next";
import Shell from "@/components/Shell";
import ProductionAnalytics from "@/components/ProductionAnalytics";
import { LOCALE_CODES, getMessages, metaFor, translator } from "@/lib/i18n";
import { SITE, seoFor } from "@/lib/seo";
import type { ReactNode } from "react";

export function generateStaticParams() {
  return LOCALE_CODES.map((locale) => ({ locale }));
}

export const dynamicParams = false;

// Next owns viewport metadata ordering. Keeping this out of the hand-authored
// <head> prevents concurrent metadata rendering from reordering an equivalent
// tag between otherwise identical production builds.
export const viewport: Viewport = {
  colorScheme: "light dark",
};

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await params;
  const t = translator(await getMessages(locale));

  /* The locale root's own metadata. Each page under it sets its own — the
     hreflang set has to name that page in nine languages, not this one.
     Only the card and the favicon are genuinely site-wide. */
  return {
    metadataBase: new URL(SITE),
    ...seoFor({
      locale,
      page: "",
      title: `${t("brand.name")} — ${t("brand.tag")}`,
      description: t("home.lede"),
      ogDescription: t("brand.sub"),
      siteName: t("brand.name"),
    }),
    icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }] },
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
    <html lang={locale} dir={meta.dir} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
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
        {/* Anonymous page-view counts, no cookies and no cross-site profile.
            It is still analytics, so the copy says so rather than claiming
            "no tracking" — see home.free / home.a1 / lab.keyNote. Runtime
            hostname gating keeps local and Vercel builds byte-identical. */}
        <ProductionAnalytics />
      </body>
    </html>
  );
}
