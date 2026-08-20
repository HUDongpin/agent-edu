import Handbook from "@/components/handbook/Handbook";
import { loadWidgetCopy } from "@/lib/handbook/copy";
import { localiseHandbook } from "@/lib/handbook/localise";
import { LOCALE_CODES, getMessages, translator } from "@/lib/i18n";
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
  return <Handbook html={html} localised={localised} copy={copy} />;
}
