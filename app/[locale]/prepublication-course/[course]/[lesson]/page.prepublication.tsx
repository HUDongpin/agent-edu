import { notFound } from "next/navigation";
import CodexLessonPage, {
  generateMetadata as generateCodexLessonMetadata,
} from "@/app/[locale]/_blocked/codex/[lesson]/page";
import { CODEX_LESSON_SLUGS, CODEX_LOCALES } from "@/lib/codex";

type Props = {
  params: Promise<{ locale: string; course: string; lesson: string }>;
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
  return CODEX_LOCALES.flatMap((locale) => (
    CODEX_LESSON_SLUGS.map((lesson) => ({ locale, course: "codex", lesson }))
  ));
}

export async function generateMetadata({ params }: Props) {
  const { locale, course, lesson } = await params;
  assertCodexPreview(course);
  return generateCodexLessonMetadata({
    params: Promise.resolve({ locale, lesson }),
  });
}

export default async function CodexPrepublicationLessonPage({ params }: Props) {
  const { locale, course, lesson } = await params;
  assertCodexPreview(course);
  return CodexLessonPage({ params: Promise.resolve({ locale, lesson }) });
}
