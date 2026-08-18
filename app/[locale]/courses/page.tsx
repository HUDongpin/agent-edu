import Catalog from "@/components/courses/Catalog";
import { LOCALE_CODES, getMessages, translator } from "@/lib/i18n";
import type { Metadata } from "next";

export function generateStaticParams() {
  return LOCALE_CODES.map((locale) => ({ locale }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await params;
  const t = translator(await getMessages(locale));
  return { title: `${t("cat.title")} · aicourse.top`, description: t("cat.lede") };
}

export default async function CoursesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <Catalog locale={locale} />;
}
