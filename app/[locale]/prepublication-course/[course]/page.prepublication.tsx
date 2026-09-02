import { notFound } from "next/navigation";
import CodexCoursePage, {
  generateMetadata as generateCodexMetadata,
} from "@/app/[locale]/_blocked/codex/page";
import { CODEX_LOCALES } from "@/lib/codex";

type Props = {
  params: Promise<{ locale: string; course: string }>;
};

export const dynamicParams = false;

function previewEnabled(): boolean {
  return process.env.AICOURSE_PREPUBLICATION_COURSE === "codex";
}

function assertCodexPreview(course: string): void {
  if (!previewEnabled() || course !== "codex") notFound();
}

export function generateStaticParams() {
  if (!previewEnabled()) return [];
  return CODEX_LOCALES.map((locale) => ({ locale, course: "codex" }));
}

export async function generateMetadata({ params }: Props) {
  const { locale, course } = await params;
  assertCodexPreview(course);
  return generateCodexMetadata({ params: Promise.resolve({ locale }) });
}

export default async function CodexPrepublicationCoursePage({ params }: Props) {
  const { locale, course } = await params;
  assertCodexPreview(course);
  return CodexCoursePage({ params: Promise.resolve({ locale }) });
}
