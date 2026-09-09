import Handbook from "@/components/handbook/Handbook";
import { I18nScope } from "@/components/I18nProvider";
import { loadWidgetCopy } from "@/lib/handbook/copy";
import { localiseHandbook } from "@/lib/handbook/localise";
import { LOCALE_CODES, getMessages, translator } from "@/lib/i18n";
import { scopeMessages } from "@/lib/i18n-scope";
import { seoFor } from "@/lib/seo";
import type { Metadata } from "next";

export function generateStaticParams() {
  return LOCALE_CODES.map((locale) => ({ locale }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await params;
  const t = translator(await getMessages(locale));
  return seoFor({
    locale, page: "handbook/",
    title: `${t("track.1.title")} · aicourse.top`,
    description: t("track.1.desc"),
    siteName: t("brand.name"),
  });
}

/* The markup is localised here rather than in the browser, so the exported
   file for each locale is already in that language — the point of giving the
   handbook nine URLs in the first place. */
export default async function HandbookPage(
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const { html, localised } = await localiseHandbook(locale);
  const copy = await loadWidgetCopy(locale);
  /* Six keys: the English-only note, and the labels on the two links out of
     the handbook. Everything else the reader sees here is either spliced
     into the markup at build time or written by a widget out of `copy`. */
  const messages = scopeMessages(await getMessages(locale), "handbook");
  return (
    <I18nScope messages={messages}>
      <Handbook html={html} localised={localised} copy={copy} />
    </I18nScope>
  );
}
