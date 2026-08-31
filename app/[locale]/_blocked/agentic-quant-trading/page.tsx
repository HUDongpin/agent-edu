import type { Metadata } from "next";
import {
  CourseKitDashboardRoute,
  courseKitMetadata,
} from "@/components/course-kit/CourseRoute";
import { AGENTIC_QUANT_TRADING_COURSE } from "@/lib/agentic-quant-trading";

type Props = { params: Promise<{ locale: string }> };

export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return courseKitMetadata({
    definition: AGENTIC_QUANT_TRADING_COURSE,
    locale,
  });
}

export default async function AgenticQuantTradingPage({ params }: Props) {
  const { locale } = await params;
  return (
    <CourseKitDashboardRoute
      definition={AGENTIC_QUANT_TRADING_COURSE}
      locale={locale}
      requireStructuredReceipts
      sectionHrefs={{
        assessment: `/${locale}/agentic-quant-trading/assessment/`,
        capstone: `/${locale}/agentic-quant-trading/capstone/`,
        sources: `/${locale}/agentic-quant-trading/sources/`,
      }}
    />
  );
}
