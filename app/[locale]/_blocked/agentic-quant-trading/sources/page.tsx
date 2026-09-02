import type { Metadata } from "next";
import {
  CourseKitSourcesRoute,
  courseKitMilestoneMetadata,
} from "@/components/course-kit/CourseRoute";
import { AGENTIC_QUANT_TRADING_COURSE } from "@/lib/agentic-quant-trading";

type Props = { params: Promise<{ locale: string }> };

export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return courseKitMilestoneMetadata({
    definition: AGENTIC_QUANT_TRADING_COURSE,
    locale,
    section: "sources",
  });
}

export default async function AgenticQuantTradingSourcesPage({ params }: Props) {
  const { locale } = await params;
  return (
    <CourseKitSourcesRoute
      definition={AGENTIC_QUANT_TRADING_COURSE}
      locale={locale}
    />
  );
}
