import Handbook from "@/components/handbook/Handbook";
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

export default function HandbookPage() {
  return <Handbook />;
}
