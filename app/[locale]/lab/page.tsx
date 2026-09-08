import Lab from "@/components/lab/Lab";
import { I18nScope } from "@/components/I18nProvider";
import { LOCALE_CODES, getMessages, translator } from "@/lib/i18n";
import { scopeMessages } from "@/lib/i18n-scope";
import { seoFor } from "@/lib/seo";
import type { Metadata } from "next";

export function generateStaticParams() {
  return LOCALE_CODES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = translator(await getMessages(locale));
  return seoFor({
    locale, page: "lab/",
    title: `${t("track.2.title")} · aicourse.top`,
    description: t("track.2.desc"),
    siteName: t("brand.name"),
  });
}

export default async function LabPage(
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  /* The Lab reads more strings at run time than the rest of the site put
     together — every stage heading, every verdict, every column of the two
     comparison tables. They belong to this route and are loaded on it. */
  const messages = scopeMessages(await getMessages(locale), "lab");
  return (
    <I18nScope messages={messages}>
      <Lab />
    </I18nScope>
  );
}
