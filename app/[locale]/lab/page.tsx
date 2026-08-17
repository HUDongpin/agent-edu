import Lab from "@/components/lab/Lab";
import { LOCALE_CODES, getMessages, translator } from "@/lib/i18n";
import type { Metadata } from "next";

export function generateStaticParams() {
  return LOCALE_CODES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = translator(await getMessages(locale));
  return { title: `${t("track.2.title")} · aicourse.top`, description: t("track.2.desc") };
}

export default function LabPage() {
  return <Lab />;
}
